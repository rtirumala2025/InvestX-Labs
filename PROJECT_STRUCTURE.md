# InvestX Labs - Project Structure

## 📁 Directory Organization

```
InvestX Labs/
├── 📁 backend/                    # Backend services
│   ├── 📁 ai-investment-backend/  # Main Python backend
│   │   ├── 📁 ai_models/          # AI/ML models and systems
│   │   ├── 📁 api/                # API endpoints
│   │   ├── 📁 chatbot/            # Chat functionality
│   │   ├── 📁 config/             # Backend configuration
│   │   ├── 📁 data_pipeline/      # Data processing
│   │   ├── 📁 database/           # Database connections
│   │   └── 📁 utils/              # Backend utilities
│   └── 📁 functions/              # Firebase Cloud Functions
├── 📁 config/                     # Project configuration
│   ├── env.example               # Environment variables template
│   ├── firebase.json             # Firebase configuration
│   ├── firestore.indexes.json    # Firestore indexes
│   ├── firestore.rules           # Firestore security rules
│   └── storage.rules             # Firebase Storage rules
├── 📁 docs/                       # Documentation
│   ├── 📁 api/                    # API documentation
│   ├── 📁 deployment/             # Deployment guides
│   └── 📁 setup/                  # Setup and configuration guides
├── 📁 frontend/                   # React frontend application
│   ├── 📁 public/                 # Static assets
│   ├── 📁 src/                    # Source code
│   │   ├── 📁 components/         # React components
│   │   ├── 📁 pages/              # Page components
│   │   ├── 📁 services/           # API services
│   │   ├── 📁 hooks/              # Custom React hooks
│   │   ├── 📁 context/            # React context providers
│   │   ├── 📁 utils/              # Frontend utilities
│   │   └── 📁 styles/             # CSS and styling
│   ├── 📁 tests/                  # Test files
│   └── package.json               # Frontend dependencies
├── 📁 scripts/                    # Utility scripts
├── .gitignore                     # Git ignore rules
├── README.md                      # Main project documentation
└── PROJECT_STRUCTURE.md           # This file
```

## 🎯 Key Directories

### Backend (`/backend/`)
- **ai-investment-backend/**: Main Python backend with AI models, APIs, and data processing
- **functions/**: Firebase Cloud Functions for serverless operations

### Frontend (`/frontend/`)
- **src/components/**: Reusable React components organized by feature
- **src/pages/**: Page-level components for routing
- **src/services/**: API integration and external service connections
- **src/hooks/**: Custom React hooks for state management and side effects

### Configuration (`/config/`)
- All Firebase configuration files
- Environment variable templates
- Security rules and indexes

### Documentation (`/docs/`)
- **setup/**: Installation and configuration guides
- **api/**: API documentation and specifications
- **deployment/**: Deployment and production guides

### Scripts (`/scripts/`)
- Database initialization and setup scripts
- Utility scripts for development and maintenance

## 🚀 Getting Started

1. **Setup Environment**: Copy `config/env.example` to `.env` and configure
2. **Install Dependencies**: Run `npm install` in both root and frontend directories
3. **Configure Firebase**: Follow guides in `docs/setup/`
4. **Start Development**: Run `npm start` in the frontend directory

## 📚 Documentation

- **Setup Guides**: `docs/setup/` - Firebase, Google Auth, and environment setup
- **API Documentation**: `docs/api/` - Backend API specifications
- **Deployment**: `docs/deployment/` - Production deployment guides

## 🔧 Development

- **Frontend**: React application with Tailwind CSS and Firebase integration
- **Backend**: Python Flask/FastAPI with AI models and data processing
- **Database**: Firebase Firestore for real-time data
- **Authentication**: Firebase Auth with Google OAuth

## 📝 Notes

- All configuration files are centralized in `/config/`
- Documentation is organized by purpose in `/docs/`
- Frontend and backend are kept separate for scalability
- Scripts are available for common development tasks
