# InvestX Labs

A React-based investment education and portfolio tracking platform for high school students.

## Project Structure

This is a monorepo containing both frontend and backend applications:

```
├── frontend/          # React frontend application
├── backend/           # Python backend application
├── scripts/           # Utility and setup scripts
├── docs/              # Documentation
├── config/            # Project configuration
└── functions/         # Firebase functions
```

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- Python 3.8+
- Firebase CLI
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/investx-labs/investx-labs.git
   cd investx-labs
   ```

2. Install dependencies:
   ```bash
npm run setup
   ```

3. Set up Firebase:
   ```bash
npm run setup:firebase
```

4. Initialize the database:
   ```bash
npm run setup:database
   ```

### Development

Start the development server:
   ```bash
npm run dev
```

This will start the frontend development server on `http://localhost:3000`.

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run setup:firebase` - Set up Firebase configuration
- `npm run setup:database` - Initialize database
- `npm run add:sample-data` - Add sample data to database

## Architecture

### Frontend (React)
- **Components**: Reusable UI components organized by feature
- **Pages**: Route-level components
- **Hooks**: Custom React hooks for state management
- **Services**: API calls and external service integrations
- **Utils**: Helper functions and utilities
- **Assets**: Images, fonts, and static data

### Backend (Python)
- **AI Models**: Machine learning models for investment recommendations
- **API**: RESTful API endpoints
- **Chatbot**: Conversational AI for user interaction
- **Data Pipeline**: Data processing and analysis
- **Database**: Data persistence and caching

## Technologies

### Frontend
- React 18
- React Router
- Tailwind CSS
- Firebase SDK
- Recharts
- Lucide React

### Backend
- Python 3.8+
- FastAPI
- Firebase Admin SDK
- Machine Learning libraries
- Docker

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For support, email support@investx-labs.com or create an issue on GitHub.