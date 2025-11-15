# AI Investment Backend

A comprehensive AI-powered backend system for teen investment education, featuring an intelligent chatbot named Finley, automated data pipelines, and personalized content recommendations.

## 🚀 Features

### 🤖 AI-Powered Chatbot (Finley)
- **Teen-friendly personality** with enthusiastic and educational responses
- **Conversational AI** using GPT-3.5/4 with RAG (Retrieval-Augmented Generation)
- **Safety filters** to ensure appropriate and responsible financial education
- **Context-aware responses** based on user age, experience level, and interests
- **Quiz generation** and interactive learning features

### 📊 Data Pipeline
- **Automated content scraping** from SEC.gov, Khan Academy, and Investopedia
- **Real-time market data** collection for teen-relevant stocks (AAPL, GOOGL, TSLA, etc.)
- **News aggregation** for investment education articles
- **AI content analysis** to extract metadata and categorize content
- **Vector embeddings** for semantic search and recommendations

### 🧠 AI Models & RAG System
- **Fine-tuned models** on educational investment content
- **Vector search** for semantic content retrieval
- **Personalized recommendations** based on user profiles
- **Context retrieval** for relevant educational content
- **Response generation** with teen-appropriate language

### 🗄️ Database & Storage
- **Firebase Firestore** for user data and conversations
- **ChromaDB** for vector embeddings and semantic search
- **Redis** for caching and session management
- **Automated data cleaning** and deduplication

### 🔒 Safety & Compliance
- **COPPA compliance** for users under 13
- **Content filtering** for age-appropriate material
- **Safety disclaimers** for educational-only content
- **Rate limiting** and security measures

## 📁 Project Structure

```
ai-investment-backend/
├── data_pipeline/
│   ├── scrapers/           # Content, market data, and news scrapers
│   ├── processors/         # AI analysis, embeddings, data cleaning
│   └── scheduler.py        # Automated pipeline scheduling
├── ai_models/
│   ├── fine_tuning/        # Model training and evaluation
│   ├── rag_system/         # Vector search and context retrieval
│   └── recommendation_engine.py
├── chatbot/
│   ├── chat_handler.py     # Main chatbot logic
│   ├── conversation_manager.py
│   ├── personality.py      # Finley's personality system
│   └── safety_filters.py   # Content safety checks
├── api/
│   ├── app.py             # FastAPI main application
│   ├── chat_endpoints.py  # Chat API routes
│   ├── data_endpoints.py  # Content and data APIs
│   └── user_endpoints.py  # User profile management
├── database/
│   ├── firestore_client.py
│   ├── vector_store.py
│   └── cache_manager.py
├── config/
│   ├── settings.py        # Application configuration
│   ├── prompts.py         # Chatbot prompts and personality
│   └── model_config.py    # AI model settings
├── utils/
│   ├── logging_config.py
│   ├── error_handlers.py
│   └── validation.py
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.11+
- Docker and Docker Compose
- Firebase project with Firestore enabled
- OpenAI API key
- Redis server

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ai-investment-backend
```

### 2. Environment Configuration
```bash
cp env.example .env
```

Edit `.env` with your configuration:
```env
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo

# Firebase Configuration
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_CLIENT_ID=your_client_id
FIREBASE_CLIENT_X509_CERT_URL=your_client_cert_url

# Database Configuration
REDIS_URL=redis://localhost:6379
CHROMA_PERSIST_DIRECTORY=./chroma_db

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_DEBUG=True

# Security
SECRET_KEY=your_secret_key_here
JWT_SECRET_KEY=your_jwt_secret_key_here
```

### 3. Firebase Setup

#### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Firestore Database
4. Generate service account key

#### Service Account Configuration
1. Go to Project Settings > Service Accounts
2. Generate new private key
3. Download the JSON file
4. Extract the required fields for your `.env` file

### 4. Installation Options

#### Option A: Docker (Recommended)
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Option B: Local Development
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start Redis (if not using Docker)
redis-server

# Run the application
uvicorn api.app:app --host 0.0.0.0 --port 8000 --reload
```

## 🚀 Usage

### API Endpoints

#### Chat Endpoints
```bash
# Start a conversation
POST /api/chat/start
{
  "user_id": "user123",
  "session_id": "optional-session-id"
}

# Send a message
POST /api/chat/message
{
  "user_id": "user123",
  "message": "What is a stock?",
  "session_id": "session-id"
}

# Get conversation history
GET /api/chat/history/{user_id}?session_id=optional

# Provide feedback
POST /api/chat/feedback
{
  "conversation_id": "conv123",
  "feedback": {
    "rating": 5,
    "feedback_type": "helpful",
    "comments": "Great explanation!"
  }
}
```

#### Data Endpoints
```bash
# Get educational content
GET /api/data/educational-content?category=stocks&difficulty=beginner&limit=10

# Search content
POST /api/data/educational-content/search
{
  "query": "how to invest in stocks",
  "category": "stocks",
  "limit": 5
}

# Get personalized recommendations
GET /api/data/recommendations/{user_id}?limit=10

# Get market data
GET /api/data/market-data/AAPL

# Get recent news
GET /api/data/news/recent?limit=20
```

#### User Endpoints
```bash
# Create user profile
POST /api/user/profile
{
  "user_id": "user123",
  "age": 16,
  "experience_level": "beginner",
  "interests": ["stocks", "etfs"],
  "risk_tolerance": "moderate"
}

# Get user profile
GET /api/user/profile/{user_id}

# Update user interests
PUT /api/user/profile/{user_id}/interests
{
  "interests": ["stocks", "etfs", "bonds"]
}
```

### Example Chat Interaction

```python
import requests

# Start conversation
response = requests.post("http://localhost:8000/api/chat/start", json={
    "user_id": "teen_user_123"
})

session_id = response.json()["session_id"]

# Send message
response = requests.post("http://localhost:8000/api/chat/message", json={
    "user_id": "teen_user_123",
    "message": "I have $50/month to invest. Where should I start?",
    "session_id": session_id
})

print(response.json()["response"])
# Output: "Hey there! That's awesome that you want to start investing! 💰 
# With $50/month, you're in a great position to begin building your investment knowledge and portfolio..."
```

## 🔧 Configuration

### Model Configuration
Edit `config/model_config.py` to adjust:
- AI model parameters (temperature, max tokens)
- Embedding model settings
- RAG system configuration
- Safety thresholds

### Personality Customization
Edit `config/prompts.py` to customize:
- Finley's personality traits
- Conversation starters
- Response templates
- Safety disclaimers

### Data Pipeline Settings
Configure in `data_pipeline/scheduler.py`:
- Scraping schedules
- Content sources
- Processing intervals
- Cache TTL settings

## 📊 Monitoring & Analytics

### Health Checks
```bash
# Check system health
GET /health

# Get API status
GET /api/status

# Get system metrics
GET /api/metrics
```

### Logging
Logs are stored in the `logs/` directory:
- `ai_investment_backend.log` - General application logs
- `errors.log` - Error logs only

### Database Monitoring
- Firestore: Monitor through Firebase Console
- Redis: Use `redis-cli monitor` for real-time monitoring
- ChromaDB: Check collection stats via API

## 🔒 Security

### Safety Features
- **Content filtering** for inappropriate material
- **Age verification** for teen users
- **Rate limiting** to prevent abuse
- **Input validation** and sanitization
- **Safety disclaimers** for educational content

### Best Practices
- Use HTTPS in production
- Regularly update dependencies
- Monitor API usage and errors
- Implement proper authentication
- Regular security audits

## 🚀 Deployment

### Production Deployment
1. **Set up production environment variables**
2. **Configure SSL certificates** for HTTPS
3. **Set up monitoring and alerting**
4. **Configure backup strategies**
5. **Deploy using Docker Compose**

```bash
# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

### Scaling Considerations
- **Horizontal scaling** with multiple API instances
- **Database sharding** for large user bases
- **CDN integration** for static content
- **Load balancing** with Nginx
- **Caching strategies** for improved performance

## 🧪 Testing

### Run Tests
```bash
# Install test dependencies
pip install pytest pytest-asyncio

# Run all tests
pytest

# Run specific test categories
pytest tests/chat/
pytest tests/api/
pytest tests/ai_models/
```

### Test Coverage
```bash
# Install coverage
pip install coverage

# Run with coverage
coverage run -m pytest
coverage report
coverage html
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Development Guidelines
- Follow PEP 8 style guidelines
- Add type hints to all functions
- Write comprehensive docstrings
- Include unit tests for new features
- Update documentation as needed

## 📝 API Documentation

### Interactive Documentation
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### OpenAPI Specification
The API follows OpenAPI 3.0 specification and is automatically generated from the FastAPI code.

## 🆘 Troubleshooting

### Common Issues

#### 1. Firebase Connection Issues
```bash
# Check Firebase credentials
python -c "from database.firestore_client import firestore_client; print('Firebase connected')"
```

#### 2. Redis Connection Issues
```bash
# Test Redis connection
redis-cli ping
```

#### 3. OpenAI API Issues
```bash
# Check API key
python -c "import openai; print('OpenAI configured')"
```

#### 4. Vector Store Issues
```bash
# Check ChromaDB
ls -la chroma_db/
```

### Debug Mode
Enable debug mode for detailed logging:
```env
API_DEBUG=True
LOG_LEVEL=DEBUG
```

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation
- Contact the development team

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- OpenAI for GPT models
- Firebase for database services
- FastAPI for the web framework
- ChromaDB for vector storage
- All contributors and testers

---

**Built with ❤️ for teen financial education**
