# API Documentation

Complete API reference for the AI Investment Backend system.

## 🔗 Base URL

```
Production: https://api.investx-labs.com
Staging: https://staging-api.investx-labs.com
Development: http://localhost:8000
```

## 🔐 Authentication

### API Key Authentication
```http
X-API-Key: your-api-key-here
```

### JWT Token Authentication
```http
Authorization: Bearer your-jwt-token-here
```

## 📊 Response Format

All API responses follow this format:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully",
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456789"
}
```

Error responses:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": { ... }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "request_id": "req_123456789"
}
```

## 🤖 Chat Endpoints

### Send Chat Message

Send a message to the AI chatbot.

```http
POST /api/v1/chat/message
Content-Type: application/json
X-API-Key: your-api-key
```

**Request Body:**
```json
{
  "user_id": "user_123456",
  "message": "Hey Finley! I have $50/month to invest. Where should I start?",
  "context": {
    "age": 16,
    "budget": 50,
    "risk_tolerance": "moderate",
    "investment_goals": ["long_term_growth", "education_fund"],
    "experience_level": "beginner"
  },
  "conversation_id": "conv_789012"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "response": "Hey there! 🎉 That's awesome that you want to start investing at 16! With $50/month, you're setting yourself up for some serious long-term growth. Let me break this down for you:\n\n**First things first:**\n• Start with a robo-advisor or index funds (they're perfect for beginners!)\n• Consider apps like Acorns or Betterment for small amounts\n• Look into ETFs like VTI or VOO for broad market exposure\n\n**Why these are great for you:**\n• Low fees and minimums\n• Automatic diversification\n• Perfect for dollar-cost averaging with your $50/month\n\nWant me to explain any of these options in more detail? I can also help you understand how compound interest will work with your monthly investments! 💪",
    "conversation_id": "conv_789012",
    "message_id": "msg_345678",
    "suggestions": [
      {
        "type": "educational_content",
        "title": "Understanding Index Funds",
        "content_id": "content_001",
        "relevance_score": 0.95
      },
      {
        "type": "action",
        "title": "Calculate compound interest",
        "action": "calculate_compound_interest",
        "parameters": {"amount": 50, "years": 10}
      }
    ],
    "safety_flags": [],
    "response_time": 1.2
  }
}
```

### Get Chat History

Retrieve conversation history for a user.

```http
GET /api/v1/chat/history/{user_id}?limit=50&offset=0
X-API-Key: your-api-key
```

**Query Parameters:**
- `limit` (optional): Number of messages to return (default: 50, max: 100)
- `offset` (optional): Number of messages to skip (default: 0)
- `conversation_id` (optional): Filter by specific conversation

**Response:**
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "conversation_id": "conv_789012",
        "created_at": "2024-01-15T09:00:00Z",
        "last_message_at": "2024-01-15T10:30:00Z",
        "message_count": 5,
        "summary": "Discussion about starting to invest with $50/month",
        "messages": [
          {
            "message_id": "msg_123456",
            "type": "user",
            "content": "Hey Finley! I have $50/month to invest. Where should I start?",
            "timestamp": "2024-01-15T09:00:00Z"
          },
          {
            "message_id": "msg_123457",
            "type": "assistant",
            "content": "Hey there! 🎉 That's awesome that you want to start investing...",
            "timestamp": "2024-01-15T09:00:15Z",
            "suggestions": [...]
          }
        ]
      }
    ],
    "total_count": 1,
    "has_more": false
  }
}
```

### Submit Chat Feedback

Provide feedback on chatbot responses.

```http
POST /api/v1/chat/feedback
Content-Type: application/json
X-API-Key: your-api-key
```

**Request Body:**
```json
{
  "message_id": "msg_345678",
  "user_id": "user_123456",
  "feedback_type": "rating",
  "rating": 5,
  "comment": "Very helpful explanation!",
  "helpful_aspects": ["clear_explanation", "practical_advice"],
  "improvement_suggestions": []
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "feedback_id": "feedback_789012",
    "message": "Thank you for your feedback! It helps us improve Finley's responses."
  }
}
```

## 📚 Educational Content Endpoints

### Get Personalized Recommendations

Get educational content recommendations based on user profile.

```http
GET /api/v1/educational-content/recommendations/{user_id}?limit=10&content_types=article,video,quiz
X-API-Key: your-api-key
```

**Query Parameters:**
- `limit` (optional): Number of recommendations (default: 10, max: 50)
- `content_types` (optional): Comma-separated list of content types
- `topics` (optional): Comma-separated list of topics to focus on
- `difficulty_level` (optional): Filter by difficulty (beginner, intermediate, advanced)

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "content_id": "content_001",
        "title": "Understanding Index Funds: A Beginner's Guide",
        "type": "article",
        "description": "Learn the basics of index funds and why they're perfect for young investors.",
        "difficulty_level": "beginner",
        "estimated_read_time": "8 minutes",
        "topics": ["index_funds", "diversification", "beginner_investing"],
        "relevance_score": 0.95,
        "target_age_range": [13, 18],
        "budget_range": [25, 100],
        "risk_level": "low",
        "url": "https://api.investx-labs.com/content/article/001",
        "thumbnail_url": "https://cdn.investx-labs.com/images/index-funds-guide.jpg",
        "created_at": "2024-01-10T00:00:00Z",
        "updated_at": "2024-01-15T00:00:00Z"
      }
    ],
    "total_count": 15,
    "has_more": true
  }
}
```

### Get Content Details

Get detailed information about specific educational content.

```http
GET /api/v1/educational-content/{content_id}
X-API-Key: your-api-key
```

**Response:**
```json
{
  "success": true,
  "data": {
    "content_id": "content_001",
    "title": "Understanding Index Funds: A Beginner's Guide",
    "type": "article",
    "content": "# Understanding Index Funds\n\nIndex funds are one of the best ways for young investors to start building wealth...",
    "metadata": {
      "author": "Financial Education Team",
      "source": "SEC.gov",
      "last_updated": "2024-01-15T00:00:00Z",
      "tags": ["index_funds", "diversification", "beginner_investing"],
      "difficulty_level": "beginner",
      "estimated_read_time": "8 minutes"
    },
    "ai_analysis": {
      "target_age": 16,
      "budget_range": [25, 100],
      "risk_level": "low",
      "investment_types": ["index_funds", "etfs"],
      "keywords": ["diversification", "low_cost", "passive_investing"]
    },
    "related_content": [
      {
        "content_id": "content_002",
        "title": "ETFs vs Index Funds: What's the Difference?",
        "relevance_score": 0.88
      }
    ]
  }
}
```

### Search Educational Content

Search educational content with filters and semantic search.

```http
GET /api/v1/educational-content/search?q=compound interest&filters=beginner&limit=20
X-API-Key: your-api-key
```

**Query Parameters:**
- `q` (required): Search query
- `filters` (optional): Comma-separated filters (beginner, intermediate, advanced, article, video, quiz)
- `limit` (optional): Number of results (default: 20, max: 100)
- `offset` (optional): Number of results to skip

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "content_id": "content_003",
        "title": "The Power of Compound Interest",
        "type": "article",
        "relevance_score": 0.92,
        "snippet": "Compound interest is often called the eighth wonder of the world...",
        "metadata": {
          "difficulty_level": "beginner",
          "estimated_read_time": "6 minutes",
          "topics": ["compound_interest", "long_term_investing"]
        }
      }
    ],
    "total_count": 25,
    "has_more": true,
    "search_time": 0.15
  }
}
```

## 📈 Market Data Endpoints

### Get Market Data Explanation

Get AI-powered explanations of market data and stock movements.

```http
GET /api/v1/market-data/explain/{symbol}?timeframe=1d&user_age=16
X-API-Key: your-api-key
```

**Path Parameters:**
- `symbol`: Stock symbol (e.g., AAPL, GOOGL, TSLA)

**Query Parameters:**
- `timeframe` (optional): Time period (1d, 1w, 1m, 3m, 1y)
- `user_age` (optional): User's age for age-appropriate explanations

**Response:**
```json
{
  "success": true,
  "data": {
    "symbol": "AAPL",
    "company_name": "Apple Inc.",
    "current_price": 185.92,
    "price_change": 2.15,
    "price_change_percent": 1.17,
    "explanation": {
      "summary": "Apple's stock went up today! 📈 Here's what happened in simple terms:",
      "detailed_explanation": "Apple's stock price increased by $2.15 (1.17%) today. This could be due to several factors:\n\n• **Strong earnings report**: Apple might have reported better-than-expected profits\n• **New product announcements**: Maybe they announced a new iPhone or service\n• **Market sentiment**: Investors might be feeling more confident about tech stocks\n• **Economic factors**: Interest rates or economic news could be affecting the market\n\n**What this means for you as a young investor:**\n• Daily price changes are normal - don't worry about day-to-day movements\n• Focus on long-term trends rather than daily fluctuations\n• Apple is a large, established company, so it's generally considered a stable investment\n• Remember: past performance doesn't guarantee future results!",
      "age_appropriate": true,
      "complexity_level": "beginner"
    },
    "market_data": {
      "open": 183.50,
      "high": 186.20,
      "low": 182.80,
      "volume": 45234567,
      "market_cap": "2.89T"
    },
    "educational_notes": [
      "This is a good example of how individual stocks can be volatile",
      "Large companies like Apple tend to be more stable than smaller companies",
      "Daily price changes are normal and expected in the stock market"
    ],
    "timestamp": "2024-01-15T16:00:00Z"
  }
}
```

### Get Market Overview

Get a teen-friendly market overview.

```http
GET /api/v1/market-data/overview?user_age=16
X-API-Key: your-api-key
```

**Response:**
```json
{
  "success": true,
  "data": {
    "market_summary": {
      "overall_sentiment": "positive",
      "explanation": "The market is having a good day! 📈 Most major indices are up, which means investors are feeling optimistic about the economy.",
      "teen_friendly_summary": "Think of the stock market like a big shopping mall. Today, most stores (companies) are doing well, so the overall mood is positive!"
    },
    "major_indices": [
      {
        "name": "S&P 500",
        "symbol": "SPY",
        "price": 4785.32,
        "change": 15.67,
        "change_percent": 0.33,
        "explanation": "The S&P 500 tracks 500 of the largest US companies. It's up today, which is generally good news!"
      }
    ],
    "teen_relevant_stocks": [
      {
        "symbol": "AAPL",
        "name": "Apple",
        "price": 185.92,
        "change": 2.15,
        "change_percent": 1.17,
        "why_relevant": "You probably use Apple products every day! This is a company you know and understand."
      }
    ],
    "educational_insights": [
      "When the market is up, it doesn't mean every stock is up",
      "Market movements are influenced by many factors including news, earnings, and economic data",
      "As a young investor, focus on long-term trends rather than daily movements"
    ],
    "timestamp": "2024-01-15T16:00:00Z"
  }
}
```

## 👤 User Profile Endpoints

### Update User Interests

Update user's investment interests and preferences.

```http
POST /api/v1/user/update-interests
Content-Type: application/json
X-API-Key: your-api-key
```

**Request Body:**
```json
{
  "user_id": "user_123456",
  "interests": {
    "investment_types": ["stocks", "etfs", "index_funds"],
    "topics": ["technology", "sustainable_investing", "dividend_stocks"],
    "learning_goals": ["understand_market_basics", "learn_about_etfs", "portfolio_diversification"],
    "risk_tolerance": "moderate",
    "investment_horizon": "long_term",
    "budget_range": [25, 100]
  },
  "preferences": {
    "content_format": ["articles", "videos", "interactive_quizzes"],
    "difficulty_level": "beginner",
    "notification_frequency": "weekly"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "user_123456",
    "updated_interests": {
      "investment_types": ["stocks", "etfs", "index_funds"],
      "topics": ["technology", "sustainable_investing", "dividend_stocks"],
      "learning_goals": ["understand_market_basics", "learn_about_etfs", "portfolio_diversification"],
      "risk_tolerance": "moderate",
      "investment_horizon": "long_term",
      "budget_range": [25, 100]
    },
    "recommendation_updated": true,
    "message": "Your interests have been updated! We'll personalize your content recommendations accordingly."
  }
}
```

### Get User Profile

Get user's profile and learning progress.

```http
GET /api/v1/user/profile/{user_id}
X-API-Key: your-api-key
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "user_123456",
    "profile": {
      "age": 16,
      "experience_level": "beginner",
      "risk_tolerance": "moderate",
      "investment_goals": ["long_term_growth", "education_fund"],
      "budget_range": [25, 100],
      "interests": {
        "investment_types": ["stocks", "etfs", "index_funds"],
        "topics": ["technology", "sustainable_investing"]
      }
    },
    "learning_progress": {
      "total_content_consumed": 15,
      "articles_read": 8,
      "videos_watched": 4,
      "quizzes_completed": 3,
      "current_streak": 5,
      "badges_earned": ["first_investment", "diversification_master"],
      "knowledge_level": "beginner_intermediate"
    },
    "engagement_metrics": {
      "total_chat_messages": 45,
      "avg_session_duration": 12.5,
      "favorite_topics": ["index_funds", "compound_interest"],
      "last_active": "2024-01-15T10:30:00Z"
    }
  }
}
```

## 🎯 Quiz and Gamification Endpoints

### Get Personalized Quiz

Get a quiz tailored to user's level and interests.

```http
GET /api/v1/quiz/personalized?user_id=user_123456&topic=index_funds&difficulty=beginner
X-API-Key: your-api-key
```

**Query Parameters:**
- `user_id` (required): User ID
- `topic` (optional): Quiz topic
- `difficulty` (optional): Difficulty level
- `question_count` (optional): Number of questions (default: 5, max: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "quiz_id": "quiz_789012",
    "title": "Index Funds Basics Quiz",
    "description": "Test your knowledge of index funds!",
    "difficulty": "beginner",
    "estimated_time": "3 minutes",
    "questions": [
      {
        "question_id": "q_001",
        "question": "What is an index fund?",
        "type": "multiple_choice",
        "options": [
          "A fund that tracks a specific market index",
          "A fund that only invests in technology stocks",
          "A fund managed by a single person",
          "A fund that guarantees returns"
        ],
        "correct_answer": 0,
        "explanation": "An index fund tracks a specific market index, like the S&P 500, providing broad market exposure."
      }
    ],
    "total_questions": 5,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### Submit Quiz Answers

Submit quiz answers and get results.

```http
POST /api/v1/quiz/submit
Content-Type: application/json
X-API-Key: your-api-key
```

**Request Body:**
```json
{
  "quiz_id": "quiz_789012",
  "user_id": "user_123456",
  "answers": [
    {
      "question_id": "q_001",
      "answer": 0,
      "time_spent": 15
    }
  ],
  "total_time": 180
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "quiz_id": "quiz_789012",
    "user_id": "user_123456",
    "score": 4,
    "total_questions": 5,
    "percentage": 80,
    "grade": "B",
    "results": [
      {
        "question_id": "q_001",
        "correct": true,
        "user_answer": 0,
        "correct_answer": 0,
        "explanation": "Great job! You correctly identified that an index fund tracks a specific market index."
      }
    ],
    "badges_earned": ["index_fund_expert"],
    "recommendations": [
      {
        "type": "content",
        "title": "Advanced Index Fund Strategies",
        "content_id": "content_005"
      }
    ],
    "completed_at": "2024-01-15T10:35:00Z"
  }
}
```

## 🔍 Analytics and Insights Endpoints

### Get Learning Analytics

Get detailed analytics about user's learning progress.

```http
GET /api/v1/analytics/learning/{user_id}?timeframe=30d
X-API-Key: your-api-key
```

**Query Parameters:**
- `timeframe` (optional): Time period (7d, 30d, 90d, 1y)

**Response:**
```json
{
  "success": true,
  "data": {
    "user_id": "user_123456",
    "timeframe": "30d",
    "learning_metrics": {
      "content_consumed": 25,
      "time_spent_learning": 180, // minutes
      "quizzes_completed": 8,
      "average_quiz_score": 78,
      "topics_covered": ["index_funds", "compound_interest", "diversification"],
      "knowledge_growth": 0.15 // 15% improvement
    },
    "engagement_metrics": {
      "chat_sessions": 12,
      "avg_session_duration": 8.5, // minutes
      "questions_asked": 35,
      "favorite_content_types": ["articles", "interactive_quizzes"]
    },
    "progress_insights": [
      "You've shown great improvement in understanding index funds!",
      "Consider exploring more advanced topics like portfolio rebalancing",
      "Your quiz scores have improved by 20% this month"
    ],
    "recommendations": [
      {
        "type": "content",
        "title": "Portfolio Diversification Strategies",
        "reason": "Based on your interest in index funds"
      }
    ]
  }
}
```

## 🚨 Error Codes

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Validation Error |
| 429 | Rate Limited |
| 500 | Internal Server Error |

### Error Response Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Invalid input data |
| `AUTHENTICATION_ERROR` | Invalid API key or token |
| `RATE_LIMIT_EXCEEDED` | Too many requests |
| `CONTENT_NOT_FOUND` | Requested content doesn't exist |
| `USER_NOT_FOUND` | User ID not found |
| `AI_SERVICE_ERROR` | AI service temporarily unavailable |
| `DATABASE_ERROR` | Database connection issue |
| `EXTERNAL_API_ERROR` | External service error |

## 📊 Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| Chat endpoints | 100 requests | 1 hour |
| Content endpoints | 200 requests | 1 hour |
| Market data endpoints | 50 requests | 1 hour |
| User endpoints | 50 requests | 1 hour |
| Quiz endpoints | 30 requests | 1 hour |

## 🔧 SDK Examples

### JavaScript/TypeScript

```typescript
import { InvestXAPI } from '@investx-labs/api-sdk';

const api = new InvestXAPI({
  apiKey: 'your-api-key',
  baseURL: 'https://api.investx-labs.com'
});

// Send chat message
const response = await api.chat.sendMessage({
  user_id: 'user_123456',
  message: 'Hey Finley! I have $50/month to invest. Where should I start?',
  context: {
    age: 16,
    budget: 50,
    risk_tolerance: 'moderate'
  }
});

// Get recommendations
const recommendations = await api.content.getRecommendations('user_123456', {
  limit: 10,
  content_types: ['article', 'video']
});
```

### Python

```python
from investx_api import InvestXClient

client = InvestXClient(
    api_key='your-api-key',
    base_url='https://api.investx-labs.com'
)

# Send chat message
response = client.chat.send_message(
    user_id='user_123456',
    message='Hey Finley! I have $50/month to invest. Where should I start?',
    context={
        'age': 16,
        'budget': 50,
        'risk_tolerance': 'moderate'
    }
)

# Get market data explanation
explanation = client.market_data.explain_symbol('AAPL', user_age=16)
```

### React Hook Example

```typescript
import { useInvestXChat } from '@investx-labs/react-sdk';

function ChatComponent() {
  const { sendMessage, messages, loading } = useInvestXChat({
    userId: 'user_123456',
    apiKey: 'your-api-key'
  });

  const handleSendMessage = async (message: string) => {
    await sendMessage(message, {
      age: 16,
      budget: 50,
      risk_tolerance: 'moderate'
    });
  };

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>
          <strong>{msg.type}:</strong> {msg.content}
        </div>
      ))}
      <button onClick={() => handleSendMessage('Hello!')}>
        Send Message
      </button>
    </div>
  );
}
```

## 📝 Webhook Events

The API can send webhooks for various events:

### Event Types

- `user.engagement.high` - User shows high engagement
- `user.learning.milestone` - User reaches learning milestone
- `content.recommendation.updated` - User recommendations updated
- `chat.conversation.escalated` - Conversation needs human review

### Webhook Payload

```json
{
  "event_type": "user.learning.milestone",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "user_id": "user_123456",
    "milestone": "completed_beginner_quiz",
    "details": {
      "quiz_id": "quiz_789012",
      "score": 90,
      "badge_earned": "quiz_master"
    }
  }
}
```

This comprehensive API documentation provides all the information needed to integrate with the AI Investment Backend system.
