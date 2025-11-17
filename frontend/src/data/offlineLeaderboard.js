export const offlineLeaderboardEntries = [
  {
    user_id: 'offline-user-mentor',
    username: 'MoneyMentor',
    rank: 1,
    score: 4200,
    xp: 4200,
    net_worth: 15250,
    portfolio_return: 14.6,
    achievements_count: 9,
    trades_count: 18,
    lessons_completed: 22,
    updated_at: new Date().toISOString(),
    user: {
      username: 'MoneyMentor',
      full_name: 'Taylor Mentor',
      avatar_url: null
    }
  },
  {
    user_id: 'offline-user-rising',
    username: 'RisingInvestor',
    rank: 2,
    score: 3675,
    xp: 3675,
    net_worth: 11870,
    portfolio_return: 11.2,
    achievements_count: 6,
    trades_count: 9,
    lessons_completed: 15,
    updated_at: new Date().toISOString(),
    user: {
      username: 'RisingInvestor',
      full_name: 'Jordan Rise',
      avatar_url: null
    }
  },
  {
    user_id: 'offline-user-builder',
    username: 'FutureBuilder',
    rank: 3,
    score: 2980,
    xp: 2980,
    net_worth: 9450,
    portfolio_return: 9.4,
    achievements_count: 4,
    trades_count: 6,
    lessons_completed: 11,
    updated_at: new Date().toISOString(),
    user: {
      username: 'FutureBuilder',
      full_name: 'Avery Builder',
      avatar_url: null
    }
  }
];

export const offlineLeaderboardRank = {
  rank: 5,
  xp: 2540,
  net_worth: 8120,
  portfolio_return: 7.8,
  achievements_count: 3,
  trades_count: 5,
  lessons_completed: 9,
  updated_at: new Date().toISOString(),
  user: {
    username: 'OfflineYou',
    full_name: 'You (Offline)',
    avatar_url: null
  }
};

const offlineLeaderboardData = {
  entries: offlineLeaderboardEntries,
  userRank: offlineLeaderboardRank
};

export default offlineLeaderboardData;

