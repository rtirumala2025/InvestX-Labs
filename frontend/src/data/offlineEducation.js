export const offlineCourses = [
  {
    id: 'offline-course-investing-basics',
    title: 'Investing Foundations',
    category: 'beginner',
    description: 'Build confidence with goals, budgeting, and the habit of investing regularly.',
    level: 'Beginner',
    color: 'from-blue-400 via-cyan-400 to-emerald-400',
    estimatedMinutes: 45
  },
  {
    id: 'offline-course-portfolio-power',
    title: 'Portfolio Power-Ups',
    category: 'intermediate',
    description: 'Master diversification, ETF strategies, and how to maintain a balanced portfolio.',
    level: 'Intermediate',
    color: 'from-purple-400 via-indigo-400 to-sky-400',
    estimatedMinutes: 60
  }
];

export const offlineModules = {
  'offline-course-investing-basics': [
    {
      id: 'offline-module-budgeting',
      course_id: 'offline-course-investing-basics',
      title: 'Budgeting & Goals',
      summary: 'Set SMART goals and automate contributions so investing becomes a habit.',
      order_index: 1
    },
    {
      id: 'offline-module-risk',
      course_id: 'offline-course-investing-basics',
      title: 'Understanding Risk',
      summary: 'Learn how time horizons influence risk tolerance and risk capacity.',
      order_index: 2
    }
  ],
  'offline-course-portfolio-power': [
    {
      id: 'offline-module-diversification',
      course_id: 'offline-course-portfolio-power',
      title: 'Diversification in Action',
      summary: 'Use index funds to spread risk across sectors, regions, and asset classes.',
      order_index: 1
    },
    {
      id: 'offline-module-maintenance',
      course_id: 'offline-course-portfolio-power',
      title: 'Maintaining Momentum',
      summary: 'Rebalance and review your portfolio to stay aligned with goals.',
      order_index: 2
    }
  ]
};

export const offlineLessons = {
  'offline-module-budgeting': [
    {
      id: 'offline-lesson-budget-101',
      module_id: 'offline-module-budgeting',
      title: 'Set a SMART Goal',
      summary: 'Make investing real with a defined amount, timeline, and automation plan.',
      content: `Why it matters:
- Goals make investing specific.
- SMART stands for Specific, Measurable, Achievable, Relevant, Time-bound.

Activity:
1. Pick a goal (example: laptop upgrade for $500 in 10 months).
2. Break it down (save $50 per month).
3. Automate transfers right after payday so you never forget.`
    },
    {
      id: 'offline-lesson-automate',
      module_id: 'offline-module-budgeting',
      title: 'Automate Contributions',
      summary: 'Build a money routine that keeps working even when you are busy.',
      content: `Quick wins:
- Link savings or brokerage accounts for scheduled transfers.
- Start with a small amount now; increase when income grows.
- Celebrate monthly check-ins to keep yourself motivated.`
    }
  ],
  'offline-module-risk': [
    {
      id: 'offline-lesson-risk-return',
      module_id: 'offline-module-risk',
      title: 'Risk vs. Return',
      summary: 'Balance emotional comfort with the time you have to ride out volatility.',
      content: `Key ideas:
- Risk tolerance: how you react emotionally to market swings.
- Risk capacity: how much risk your timeline allows.
- Use buckets: money needed soon stays conservative; long-term goals can accept more swings.`
    }
  ],
  'offline-module-diversification': [
    {
      id: 'offline-lesson-index-funds',
      module_id: 'offline-module-diversification',
      title: 'Meet the Index Fund',
      summary: 'An ETF like VTI owns thousands of companies in a single trade.',
      content: `Try this:
- Compare a single-stock chart to a broad-market ETF.
- Notice how diversification smooths the ride.
- Write a short "why I own this ETF" statement to stay focused.`
    },
    {
      id: 'offline-lesson-global-balance',
      module_id: 'offline-module-diversification',
      title: 'Think Global',
      summary: 'Add international exposure to avoid relying on just one economy.',
      content: `Check list:
- Compare a U.S.-only ETF vs. a developed-markets ETF.
- Identify how each performed during recent market events.
- Decide on a simple rule (e.g., 70% U.S. / 30% global).`
    }
  ],
  'offline-module-maintenance': [
    {
      id: 'offline-lesson-rebalance',
      module_id: 'offline-module-maintenance',
      title: 'Rebalancing Rhythm',
      summary: 'Reset allocations so winners do not dominate your portfolio.',
      content: `Steps:
1. Pick a cadence (quarterly or when allocation drifts 5%+).
2. Trim winners, add to laggards, or direct new contributions.
3. Log each adjustment so you can reflect on trends.`
    }
  ]
};

export const offlineQuizzes = {
  'offline-lesson-risk-return': {
    id: 'offline-quiz-risk-return',
    lesson_id: 'offline-lesson-risk-return',
    title: 'Risk Checkpoint',
    questions: [
      {
        id: 'risk-q1',
        question: 'Risk tolerance refers to:',
        options: [
          'How your friends invest',
          'How you emotionally handle market swings',
          'How much money you wish to invest',
          'A guarantee against losses'
        ],
        answer: 1,
        explanation: 'Risk tolerance is about your comfort with volatility.'
      },
      {
        id: 'risk-q2',
        question: 'Risk capacity can increase when you:',
        options: [
          'Shorten your timeline',
          'Extend your investing horizon',
          'Only watch meme stocks',
          'Ignore your budget'
        ],
        answer: 1,
        explanation: 'Longer timelines let you take on more volatility safely.'
      }
    ]
  },
  'offline-lesson-index-funds': {
    id: 'offline-quiz-index-funds',
    lesson_id: 'offline-lesson-index-funds',
    title: 'Index IQ',
    questions: [
      {
        id: 'index-q1',
        question: 'An index fund is diversified because it:',
        options: [
          'Owns many companies across sectors',
          'Guarantees annual profits',
          'Focuses only on technology stocks',
          'Changes holdings hourly'
        ],
        answer: 0,
        explanation: 'Index funds track a basket of companies, spreading risk broadly.'
      }
    ]
  }
};

const offlineEducation = {
  courses: offlineCourses,
  modules: offlineModules,
  lessons: offlineLessons,
  quizzes: offlineQuizzes
};

export default offlineEducation;

