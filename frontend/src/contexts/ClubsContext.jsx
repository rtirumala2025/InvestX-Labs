import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import PropTypes from 'prop-types';
import { useAuth } from './AuthContext';
import { useApp } from './AppContext';
import offlineClubs from '../data/offlineClubs';
import {
  fetchClubs,
  fetchClubById,
  createClub,
  updateClubById,
  deleteClubById,
  cacheQueuedActions,
  loadQueuedActions
} from '../services/api/clubService';

const ClubsContext = createContext(null);

const createPendingAction = (type, payload) => ({
  id: `${type}-${Date.now()}`,
  type,
  payload,
  queuedAt: new Date().toISOString()
});

const normalizeClub = (club) => {
  if (!club) return club;
  return {
    ...club,
    meetingCadence: club.meetingCadence ?? club.meeting_cadence ?? '',
    focus: club.focus ?? club.focus_area ?? '',
    metrics: club.metrics || {
      members: club.metrics?.members ?? club.members_count ?? 0
    }
  };
};

export const ClubsProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const userId = currentUser?.id;
  const { queueToast, registerContext, isOnline } = useApp();

  const [clubs, setClubs] = useState([]);
  const [selectedClubId, setSelectedClubId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offline, setOffline] = useState(false);
  const [pendingActions, setPendingActions] = useState(() => loadQueuedActions() || []);

  const persistQueue = useCallback((nextQueue) => {
    setPendingActions(nextQueue);
    cacheQueuedActions(nextQueue);
  }, []);

  const enqueueAction = useCallback(
    (action) => {
      persistQueue([...pendingActions, action]);
    },
    [pendingActions, persistQueue]
  );

  const resolveClubById = useCallback(
    async (clubId) => {
      if (!clubId) return null;
      const existing = clubs.find((club) => club.id === clubId);
      if (existing) return existing;
      const { club } = await fetchClubById(clubId);
      return normalizeClub(club);
    },
    [clubs]
  );

  const loadClubs = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { clubs: clubList, offline: isOffline, reason } = await fetchClubs();

    // Only show warnings if we're actually offline (not just API unavailable)
    const actuallyOffline = !isOnline;

    if (!clubList?.length) {
      setClubs(offlineClubs.clubs.map(normalizeClub));
      setOffline(true);
      setError(reason || 'Unable to load clubs.');
      // Only show toast if actually offline, not just API unavailable
      if (actuallyOffline) {
        queueToast(reason || 'Clubs are in offline mode. Showing cached data.', 'warning', {
          id: 'clubs-offline'
        });
      }
    } else {
      setClubs(clubList.map(normalizeClub));
      setOffline(Boolean(isOffline));
      // Only show warning if actually offline
      if (isOffline && actuallyOffline) {
        queueToast('Clubs are in offline mode. Changes will sync later.', 'warning', {
          id: 'clubs-offline'
        });
      }
    }

    setLoading(false);
  }, [queueToast, isOnline]);

  useEffect(() => {
    loadClubs();
  }, [loadClubs]);

  useEffect(() => {
    if (clubs.length && !selectedClubId) {
      setSelectedClubId(clubs[0]?.id ?? null);
    }
  }, [clubs, selectedClubId]);

  const flushPendingActions = useCallback(async () => {
    if (!pendingActions.length || !isOnline) {
      return;
    }

    let didFail = false;
    const remaining = [];

    for (const action of pendingActions) {
      try {
        if (action.type === 'create') {
          const result = await createClub(action.payload);
          if (result.queued || result.offline) {
            throw new Error('queued');
          }
        } else if (action.type === 'update') {
          const result = await updateClubById(action.payload.id, action.payload.updates);
          if (result.queued || result.offline) {
            throw new Error('queued');
          }
        } else if (action.type === 'delete') {
          const result = await deleteClubById(action.payload.id);
          if (result.queued || result.offline) {
            throw new Error('queued');
          }
        }
      } catch (error) {
        console.warn('🏛️ [ClubsContext] Failed to flush queued action', action.type, error);
        didFail = true;
        remaining.push(action);
      }
    }

    if (!didFail) {
      await loadClubs();
      setOffline(false);
      queueToast('Club changes synced successfully.', 'success', { id: 'clubs-sync' });
    } else {
      queueToast('Some club changes could not sync. They will retry automatically.', 'warning', {
        id: 'clubs-sync-warning'
      });
    }

    persistQueue(remaining);
  }, [pendingActions, persistQueue, queueToast, isOnline, loadClubs]);

  useEffect(() => {
    if (isOnline) {
      flushPendingActions();
    }
  }, [isOnline, flushPendingActions]);

  const refreshClubs = useCallback(async () => {
    await loadClubs();
  }, [loadClubs]);

  const handleCreateClub = useCallback(
    async (clubPayload) => {
      const basePayload = {
        ...clubPayload,
        ownerId: clubPayload.ownerId || userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const response = await createClub(basePayload);
      const created = normalizeClub(response.club || basePayload);

      setClubs((prev) => [created, ...prev]);
      setSelectedClubId(created.id);

      if (response.queued || response.offline) {
        enqueueAction(createPendingAction('create', created));
        queueToast('Club created offline. We will sync it when you reconnect.', 'warning');
      } else {
        queueToast('Club created successfully!', 'success');
      }

      return { club: created, queued: response.queued || response.offline };
    },
    [enqueueAction, queueToast, userId]
  );

  const handleUpdateClub = useCallback(
    async (clubId, updates) => {
      const response = await updateClubById(clubId, updates);
      const updated = normalizeClub(response.club || { id: clubId, ...updates });

      setClubs((prev) =>
        prev.map((club) =>
          club.id === clubId ? { ...club, ...updated, updated_at: new Date().toISOString() } : club
        )
      );

      if (response.queued || response.offline) {
        enqueueAction(createPendingAction('update', { id: clubId, updates }));
        queueToast('Club update saved offline. It will sync once you reconnect.', 'warning');
      } else {
        queueToast('Club updated successfully!', 'success');
      }

      return { club: updated, queued: response.queued || response.offline };
    },
    [enqueueAction, queueToast]
  );

  const handleDeleteClub = useCallback(
    async (clubId) => {
      const response = await deleteClubById(clubId);

      setClubs((prev) => prev.filter((club) => club.id !== clubId));
      if (selectedClubId === clubId) {
        setSelectedClubId(clubs[0]?.id ?? null);
      }

      if (response.queued || response.offline) {
        enqueueAction(createPendingAction('delete', { id: clubId }));
        queueToast('Club deletion queued. It will complete when you reconnect.', 'warning');
      } else {
        queueToast('Club deleted successfully.', 'success');
      }

      return { queued: response.queued || response.offline };
    },
    [clubs, enqueueAction, queueToast, selectedClubId]
  );

  const value = useMemo(
    () => ({
      clubs,
      selectedClubId,
      loading,
      error,
      offline,
      pendingActions,
      selectClub: setSelectedClubId,
      refreshClubs,
      createClub: handleCreateClub,
      updateClub: handleUpdateClub,
      deleteClub: handleDeleteClub,
      resolveClubById
    }),
    [
      clubs,
      selectedClubId,
      loading,
      error,
      offline,
      pendingActions,
      refreshClubs,
      handleCreateClub,
      handleUpdateClub,
      handleDeleteClub,
      resolveClubById
    ]
  );

  useEffect(() => {
    let unregister;
    if (registerContext) {
      unregister = registerContext('clubs', {
        clubs,
        selectedClubId,
        loading,
        error,
        offline,
        pendingActions: pendingActions.length
      });
    }
    return () => unregister?.();
  }, [clubs, selectedClubId, loading, error, offline, pendingActions, registerContext]);

  return <ClubsContext.Provider value={value}>{children}</ClubsContext.Provider>;
};

ClubsProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useClubs = () => {
  const context = useContext(ClubsContext);
  if (!context) {
    throw new Error('useClubs must be used within a ClubsProvider');
  }
  return context;
};

export default ClubsContext;

