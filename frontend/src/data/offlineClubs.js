export const offlineClubs = [
  {
    id: 'offline-club-growth',
    name: 'Growth Seekers',
    description: 'Track innovative companies, debate catalysts, and practice setting price targets together.',
    focus: 'Growth investing',
    meetingCadence: 'Bi-weekly',
    owner_id: 'offline-owner-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metrics: {
      members: 18,
      activeConversations: 4
    }
  },
  {
    id: 'offline-club-dividend',
    name: 'Dividend Explorers',
    description: 'Compare dividend aristocrats, share income strategies, and plan DRIP reinvestments.',
    focus: 'Income strategies',
    meetingCadence: 'Monthly',
    owner_id: 'offline-owner-2',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    metrics: {
      members: 11,
      activeConversations: 2
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

const offlineClubsData = {
  clubs: offlineClubs,
  members: offlineClubMembers
};

export default offlineClubsData;

