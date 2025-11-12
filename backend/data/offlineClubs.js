export const offlineClubs = [
  {
    id: 'offline-club-growth',
    name: 'Growth Seekers',
    focus: 'Growth investing & earnings trends',
    meeting_cadence: 'Bi-weekly',
    description: 'Track innovative companies, debate catalysts, and practice setting price targets.',
    owner_id: 'offline-owner-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metrics: {
      members: 18,
      active_conversations: 4
    }
  },
  {
    id: 'offline-club-dividend',
    name: 'Dividend Explorers',
    focus: 'Income strategies & DRIP planning',
    meeting_cadence: 'Monthly',
    description: 'Study dividend aristocrats, share portfolio updates, and craft reinvestment plans.',
    owner_id: 'offline-owner-2',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metrics: {
      members: 11,
      active_conversations: 2
    }
  }
];

export const offlineClubMembers = [
  {
    club_id: 'offline-club-growth',
    user_id: 'offline-owner-1',
    role: 'owner'
  },
  {
    club_id: 'offline-club-growth',
    user_id: 'offline-member-1',
    role: 'member'
  },
  {
    club_id: 'offline-club-dividend',
    user_id: 'offline-owner-2',
    role: 'owner'
  }
];

export default {
  clubs: offlineClubs,
  clubMembers: offlineClubMembers
};

