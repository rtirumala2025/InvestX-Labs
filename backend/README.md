# InvestX Labs Backend

Backend service for the InvestX Labs AI Chat feature.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and update the values:
   ```bash
   cp .env.example .env
   ```

3. Update the `.env` file with your OpenRouter API key and other configuration.

## Running the Server

- Development:
  ```bash
  npm run dev
  ```

- Production:
  ```bash
  npm start
  ```

## API Endpoints

- `POST /api/chat` - Send a message to the AI assistant
  - Request body: `{ message: string, portfolioData?: object }`
  - Response: `{ reply: string }`

- `GET /health` - Health check endpoint
  - Response: `{ status: 'ok' }`

## Environment Variables

- `PORT` - Port to run the server on (default: 5001)
- `NODE_ENV` - Environment (development/production)
- `OPENROUTER_API_KEY` - Your OpenRouter API key
- `FRONTEND_URL` - URL of the frontend for CORS
- `APP_URL` - Base URL of this API
