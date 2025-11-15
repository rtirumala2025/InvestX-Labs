import {
  adminSupabase,
  createApiResponse,
  handleSupabaseError,
  logger
} from '../ai-system/index.js';
import offlineClubsData from '../data/offlineClubs.js';
import crypto from 'crypto';

const buildFallbackResponse = (message = 'Supabase unavailable; serving offline clubs data.') =>
  createApiResponse(
    {
      clubs: offlineClubsData.clubs,
      members: offlineClubsData.clubMembers,
      metadata: { offline: true }
    },
    {
      message,
      metadata: { offline: true }
    }
  );

const groupMembersByClub = (members = []) =>
  members.reduce((acc, member) => {
    const clubId = member.club_id;
    if (!clubId) return acc;
    if (!acc[clubId]) acc[clubId] = [];
    acc[clubId].push(member);
    return acc;
  }, {});

export const listClubs = async (req, res) => {
  if (!adminSupabase) {
    logger.warn('Supabase unavailable: returning offline clubs list');
    return res.status(200).json(buildFallbackResponse());
  }

  try {
    const { data: clubs, error: clubsError } = await adminSupabase
      .from('clubs')
      .select('*')
      .order('name', { ascending: true });

    if (clubsError) throw clubsError;

    const clubIds = (clubs || []).map((club) => club.id).filter(Boolean);
    let membersByClub = {};

    if (clubIds.length) {
      const { data: members, error: membersError } = await adminSupabase
        .from('club_members')
        .select('club_id, user_id, role')
        .in('club_id', clubIds);

      if (membersError) throw membersError;

      membersByClub = groupMembersByClub(members || []);
    }

    const enriched = (clubs || []).map((club) => ({
      ...club,
      metrics: {
        members: membersByClub[club.id]?.length || 0
      }
    }));

    return res.status(200).json(
      createApiResponse(
        {
          clubs: enriched,
          members: membersByClub,
          metadata: { offline: false }
        },
        'Clubs loaded successfully'
      )
    );
  } catch (error) {
    const normalized = handleSupabaseError(error, { scope: 'clubs:list' });
    logger.warn('Clubs list fallback triggered', normalized);
    return res.status(200).json(buildFallbackResponse(normalized.message));
  }
};

export const getClubById = async (req, res) => {
  const { clubId } = req.params;

  if (!clubId) {
    return res.status(400).json(
      createApiResponse(null, {
        success: false,
        statusCode: 400,
        message: 'clubId is required'
      })
    );
  }

  if (!adminSupabase) {
    const fallbackClub = offlineClubsData.clubs.find((club) => club.id === clubId);
    return res.status(200).json(
      createApiResponse(
        {
          club: fallbackClub || null,
          members: offlineClubsData.clubMembers.filter((member) => member.club_id === clubId),
          metadata: { offline: true }
        },
        {
          message: 'Supabase unavailable; serving offline club snapshot.',
          metadata: { offline: true }
        }
      )
    );
  }

  try {
    const { data: club, error: clubError } = await adminSupabase
      .from('clubs')
      .select('*')
      .eq('id', clubId)
      .maybeSingle();

    if (clubError) throw clubError;

    if (!club) {
      return res.status(404).json(
        createApiResponse(null, {
          success: false,
          statusCode: 404,
          message: 'Club not found'
        })
      );
    }

    const { data: members, error: memberError } = await adminSupabase
      .from('club_members')
      .select('club_id, user_id, role')
      .eq('club_id', clubId);

    if (memberError) throw memberError;

    return res.status(200).json(
      createApiResponse(
        {
          club,
          members: members || [],
          metadata: { offline: false }
        },
        'Club loaded successfully'
      )
    );
  } catch (error) {
    const normalized = handleSupabaseError(error, { clubId, scope: 'clubs:get' });
    logger.warn('Club detail fallback triggered', normalized);
    const fallbackClub = offlineClubsData.clubs.find((club) => club.id === clubId) || null;
    return res.status(200).json(
      createApiResponse(
        {
          club: fallbackClub,
          members: offlineClubsData.clubMembers.filter((member) => member.club_id === clubId),
          metadata: { offline: true }
        },
        {
          message: normalized.message || 'Unable to load club; serving fallback data.',
          metadata: { offline: true }
        }
      )
    );
  }
};

export const createClub = async (req, res) => {
  const { name, description = null, focus = null, meetingCadence = null, ownerId } = req.body || {};

  if (!name || !ownerId) {
    return res.status(400).json(
      createApiResponse(null, {
        success: false,
        statusCode: 400,
        message: 'name and ownerId are required'
      })
    );
  }

  const newClub = {
    id: crypto.randomUUID(),
    owner_id: ownerId,
    name,
    description,
    focus,
    meeting_cadence: meetingCadence,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (!adminSupabase) {
    logger.warn('Supabase unavailable: queueing club creation offline', { clubName: name });
    return res.status(200).json(
      createApiResponse(
        {
          club: newClub,
          queued: true,
          metadata: { offline: true }
        },
        {
          message: 'Supabase unavailable; club creation queued locally.',
          metadata: { offline: true }
        }
      )
    );
  }

  try {
    const { data, error } = await adminSupabase
      .from('clubs')
      .insert({
        id: newClub.id,
        owner_id: newClub.owner_id,
        name: newClub.name,
        description: newClub.description,
        focus: newClub.focus,
        meeting_cadence: newClub.meeting_cadence,
        created_at: newClub.created_at,
        updated_at: newClub.updated_at
      })
      .select('*')
      .maybeSingle();

    if (error) throw error;

    return res.status(201).json(
      createApiResponse(
        {
          club: data,
          queued: false,
          metadata: { offline: false }
        },
        'Club created successfully'
      )
    );
  } catch (error) {
    const normalized = handleSupabaseError(error, { clubName: name, scope: 'clubs:create' });
    logger.warn('Failed to create club online. Returning offline queue response.', normalized);
    return res.status(200).json(
      createApiResponse(
        {
          club: newClub,
          queued: true,
          metadata: { offline: true }
        },
        {
          message: normalized.message || 'Unable to create club right now; queued locally.',
          metadata: { offline: true }
        }
      )
    );
  }
};

export const updateClub = async (req, res) => {
  const { clubId } = req.params;
  const { name, description = null, focus = null, meetingCadence = null } = req.body || {};

  if (!clubId) {
    return res.status(400).json(
      createApiResponse(null, {
        success: false,
        statusCode: 400,
        message: 'clubId is required'
      })
    );
  }

  const updates = {
    ...(name ? { name } : {}),
    description,
    focus,
    meeting_cadence: meetingCadence,
    updated_at: new Date().toISOString()
  };

  if (!adminSupabase) {
    logger.warn('Supabase unavailable: queueing club update offline', { clubId });
    return res.status(200).json(
      createApiResponse(
        {
          club: { id: clubId, ...updates },
          queued: true,
          metadata: { offline: true }
        },
        {
          message: 'Supabase unavailable; club update queued locally.',
          metadata: { offline: true }
        }
      )
    );
  }

  try {
    const { data, error } = await adminSupabase
      .from('clubs')
      .update(updates)
      .eq('id', clubId)
      .select('*')
      .maybeSingle();

    if (error) throw error;

    return res.status(200).json(
      createApiResponse(
        {
          club: data,
          queued: false,
          metadata: { offline: false }
        },
        'Club updated successfully'
      )
    );
  } catch (error) {
    const normalized = handleSupabaseError(error, { clubId, scope: 'clubs:update' });
    logger.warn('Failed to update club online. Returning queue response.', normalized);
    return res.status(200).json(
      createApiResponse(
        {
          club: { id: clubId, ...updates },
          queued: true,
          metadata: { offline: true }
        },
        {
          message: normalized.message || 'Unable to update club; queued locally.',
          metadata: { offline: true }
        }
      )
    );
  }
};

export const deleteClub = async (req, res) => {
  const { clubId } = req.params;

  if (!clubId) {
    return res.status(400).json(
      createApiResponse(null, {
        success: false,
        statusCode: 400,
        message: 'clubId is required'
      })
    );
  }

  if (!adminSupabase) {
    logger.warn('Supabase unavailable: queueing club deletion offline', { clubId });
    return res.status(200).json(
      createApiResponse(
        {
          queued: true,
          clubId,
          metadata: { offline: true }
        },
        {
          message: 'Supabase unavailable; club deletion queued locally.',
          metadata: { offline: true }
        }
      )
    );
  }

  try {
    await adminSupabase.from('club_members').delete().eq('club_id', clubId);
    const { error } = await adminSupabase.from('clubs').delete().eq('id', clubId);

    if (error) throw error;

    return res.status(200).json(
      createApiResponse(
        {
          queued: false,
          clubId,
          metadata: { offline: false }
        },
        'Club deleted successfully'
      )
    );
  } catch (error) {
    const normalized = handleSupabaseError(error, { clubId, scope: 'clubs:delete' });
    logger.warn('Failed to delete club online. Returning queue response.', normalized);
    return res.status(200).json(
      createApiResponse(
        {
          queued: true,
          clubId,
          metadata: { offline: true }
        },
        {
          message: normalized.message || 'Unable to delete club now; queued locally.',
          metadata: { offline: true }
        }
      )
    );
  }
};

