export const offlineCourses = [
  {
    id: 'offline-course-investing-basics',
    title: 'Investing Foundations',
    category: 'beginner',
    description: 'Learn the fundamentals of saving, budgeting, and building an investing habit.',
    level: 'Beginner',
    image_url: null,
    estimated_minutes: 45
  },
  {
    id: 'offline-course-portfolio-power',
    title: 'Portfolio Power-Ups',
    category: 'intermediate',
    description: 'Explore diversification, index funds, and how to balance growth vs. safety.',
    level: 'Intermediate',
    image_url: null,
    estimated_minutes: 60
  }
];

export const offlineModules = {
  'offline-course-investing-basics': [
    {
      id: 'offline-module-budgeting',
      course_id: 'offline-course-investing-basics',
      title: 'Budgeting & Goals',
      summary: 'Clarify why you are investing and how to automate contributions.',
      order_index: 1
    },
    {
      id: 'offline-module-risk',
      course_id: 'offline-course-investing-basics',
      title: 'Understanding Risk',
      summary: 'Discover the relationship between time horizons and risk tolerance.',
      order_index: 2
    }
  ],
  'offline-course-portfolio-power': [
    {
      id: 'offline-module-diversification',
      course_id: 'offline-course-portfolio-power',
      title: 'Diversification in Action',
      summary: 'Use ETFs to spread risk across sectors and regions.',
      order_index: 1
    },
    {
      id: 'offline-module-maintenance',
      course_id: 'offline-course-portfolio-power',
      title: 'Maintaining Momentum',
      summary: 'Rebalance and review to stay aligned with your goals.',
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
      summary: 'Define a short-term investing goal and assign an amount + timeline.',
      content: `Why it matters:
- Goals make investing feel concrete.
- SMART stands for Specific, Measurable, Achievable, Relevant, Time-bound.

Try this:
1. Pick a goal (example: $500 for a laptop upgrade in 10 months).
2. Break it down (save $50/month).
3. Automate a transfer so you never miss a contribution.`
    },
    {
      id: 'offline-lesson-automate',
      module_id: 'offline-module-budgeting',
      title: 'Automate Contributions',
      summary: 'Use direct deposit or scheduled transfers to build consistency.',
      content: `Habit stack:
- Pick a day right after payday.
- Automate a small but consistent amount.
- Celebrate milestones each month to keep motivation high.`
    }
  ],
  'offline-module-risk': [
    {
      id: 'offline-lesson-risk-return',
      module_id: 'offline-module-risk',
      title: 'Risk vs. Return',
      summary: 'Higher potential gains usually come with higher short-term swings.',
      content: `Key ideas:
- Risk tolerance: how you emotionally handle dips.
- Risk capacity: how much risk your timeline allows.
- Use time horizons: money needed soon stays conservative; long-term can take more swings.`
    }
  ],
  'offline-module-diversification': [
    {
      id: 'offline-lesson-index-funds',
      module_id: 'offline-module-diversification',
      title: 'Meet the Index Fund',
      summary: 'An ETF like VTI owns thousands of companies at once.',
      content: `Quick win:
- Pick one broad-market ETF to anchor your portfolio.
- Review sector exposure once a quarter.
- Write a two-sentence "why" statement for every holding.`
    },
    {
      id: 'offline-lesson-global-balance',
      module_id: 'offline-module-diversification',
      title: 'Think Global',
      summary: 'Add international exposure to spread geographic risk.',
      content: `Action item:
- Compare a US-only ETF vs. a global ETF.
- Identify how each reacted during recent market volatility.
- Decide if you want a fixed % or a custom rule for international holdings.`
    }
  ],
  'offline-module-maintenance': [
    {
      id: 'offline-lesson-rebalance',
      module_id: 'offline-module-maintenance',
      title: 'Rebalancing Rhythm',
      summary: 'Reset allocations so winners do not run away with your portfolio.',
      content: `Steps:
1. Pick a cadence (quarterly or when an allocation drifts by 5%+).
2. Sell a bit of what grew beyond its target and buy what lagged.
3. Log each change in a notebook or spreadsheet to track learning.`
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
        question: 'Which statement best describes risk tolerance?',
        options: [
          'How much risk your friends are taking',
          'How you react to big market swings emotionally',
          'The maximum amount you are allowed to invest',
          'A guarantee you will not lose money'
        ],
        answer: 1,
        explanation: 'Risk tolerance is a personal measure of how you handle volatility without panic.'
      },
      {
        id: 'risk-q2',
        question: 'What is one way to increase your risk capacity?',
        options: [
          'Extend your investing timeline',
          'Check prices every hour',
          'Only buy meme stocks',
          'Ignore your goals entirely'
        ],
        answer: 0,
        explanation: 'Longer timelines let you ride out volatility, boosting your ability to take risk.'
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
        question: 'What makes an index fund diversified?',
        options: [
          'It holds many companies across sectors',
          'It guarantees profits every year',
          'It only holds technology companies',
          'It changes holdings daily based on trends'
        ],
        answer: 0,
        explanation: 'Index funds track lots of companies, spreading risk across the market.'
      }
    ]
  }
};

export default {
  courses: offlineCourses,
  modules: offlineModules,
  lessons: offlineLessons,
  quizzes: offlineQuizzes
};

