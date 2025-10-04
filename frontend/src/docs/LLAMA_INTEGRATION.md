# LLaMA 4 Scout AI Integration Guide

## Overview

This document describes the integration of LLaMA 4 Scout AI into the InvestX Labs project using OpenRouter API. The AI provides intelligent investment insights, portfolio analysis, and personalized recommendations based on user portfolio data.

## Architecture

### 1. **AI Service Layer** (`src/services/ai/llamaService.js`)
- **Purpose**: Core AI communication service
- **Features**:
  - OpenRouter API integration
  - Response caching (5-minute cache)
  - Portfolio-aware system prompts
  - Comprehensive error handling
  - Rate limit management
  - API key masking in logs

### 2. **Custom Hook** (`src/hooks/useLlamaAI.js`)
- **Purpose**: React hook for AI interactions
- **Features**:
  - Portfolio context integration
  - Conversation history management
  - Loading and error states
  - Specialized AI functions (analyze, suggest, insights)
  - Automatic retry mechanisms

### 3. **Portfolio Simulator** (`src/utils/portfolioSimulator.js`)
- **Purpose**: Generate realistic test portfolios for AI testing
- **Features**:
  - Three portfolio types: beginner, balanced, aggressive
  - Realistic market data simulation
  - Comprehensive portfolio metrics
  - Temporary testing infrastructure

### 4. **Chat Interface** (`src/components/chat/ChatInterfaceDemo.jsx`)
- **Purpose**: Updated chat component with AI integration
- **Features**:
  - Portfolio-aware welcome messages
  - Contextual quick actions
  - AI status indicators
  - Fallback responses when AI unavailable

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
# LLaMA 4 Scout AI Configuration (OpenRouter)
REACT_APP_LLAMA_API_KEY=your_openrouter_api_key_here
REACT_APP_LLAMA_API_URL=https://openrouter.ai/api/v1/chat/completions
```

### Getting OpenRouter API Key

1. Visit [https://openrouter.ai](https://openrouter.ai)
2. Create an account
3. Navigate to API Keys section
4. Generate a new API key
5. Add to your `.env` file

## Features

### 1. **Portfolio Analysis**
- Comprehensive portfolio health assessment
- Diversification analysis
- Risk evaluation
- Specific improvement recommendations
- Actionable next steps

### 2. **Investment Suggestions**
- Amount-specific recommendations
- Ticker symbol suggestions with rationale
- Portfolio fit analysis
- Risk considerations
- Allocation percentages

### 3. **Market Insights**
- Relevant market trends
- Sector-specific insights
- Risk factor monitoring
- Opportunity identification
- Portfolio-specific commentary

### 4. **Intelligent Conversations**
- Context-aware responses
- Portfolio data integration
- Educational content delivery
- Personalized advice
- Follow-up suggestions

## Usage Examples

### Basic AI Interaction

```javascript
import { useLlamaAI } from '../hooks/useLlamaAI';

const MyComponent = () => {
  const { sendMessage, loading, error } = useLlamaAI(portfolioData);
  
  const handleQuestion = async () => {
    const response = await sendMessage("How should I diversify my portfolio?");
    console.log(response);
  };
};
```

### Portfolio Analysis

```javascript
const { analyzePortfolio } = useLlamaAI(portfolioData);

const getAnalysis = async () => {
  const analysis = await analyzePortfolio();
  // Display analysis to user
};
```

### Investment Suggestions

```javascript
const { getSuggestions } = useLlamaAI(portfolioData);

const getInvestmentIdeas = async () => {
  const suggestions = await getSuggestions(1000); // $1000 to invest
  // Display suggestions to user
};
```

## Error Handling

### 1. **API Configuration Errors**
- Missing API key → Fallback responses
- Invalid API key → User-friendly error message
- Network issues → Cached response fallback

### 2. **Rate Limiting**
- 429 errors → Retry with exponential backoff
- Quota exceeded → Graceful degradation
- Service unavailable → Static advice fallback

### 3. **Response Validation**
- Empty responses → Default suggestions
- Malformed data → Error recovery
- Timeout handling → User notification

## Logging

All AI interactions are logged with the following format:

```
🤖 [LlamaService] Action: Details
🤖 [useLlamaAI] Hook operation: Status
💬 [ChatInterfaceDemo] UI interaction: Result
```

### Log Categories:
- **🤖 LlamaService**: API calls, caching, errors
- **🤖 useLlamaAI**: Hook operations, state changes
- **💬 ChatInterfaceDemo**: UI interactions, user messages
- **🧪 PortfolioSimulator**: Test data generation

## Testing

### Manual Testing

1. **Without API Key** (Fallback Mode):
   ```javascript
   // Chat interface shows fallback responses
   // AI status indicator shows "not configured"
   ```

2. **With API Key** (Live Mode):
   ```javascript
   // Real AI responses from LLaMA 4 Scout
   // Portfolio-specific advice
   // Contextual suggestions
   ```

### Integration Testing

```javascript
import { runAIIntegrationTest } from '../utils/portfolioSimulator';

// Test with different portfolio types
const testResults = await runAIIntegrationTest('balanced');
console.log(testResults);
```

## Performance Optimization

### 1. **Response Caching**
- 5-minute cache for identical requests
- Reduces API calls and costs
- Improves response times

### 2. **Request Batching**
- Intelligent prompt construction
- Context-aware system messages
- Optimized token usage

### 3. **Fallback Strategies**
- Cached responses when API fails
- Static advice for common questions
- Graceful degradation

## Security Considerations

### 1. **API Key Protection**
- Environment variable storage
- Masked in all logs
- Client-side only (no server exposure)

### 2. **Data Privacy**
- Portfolio data context only
- No PII in AI requests
- Temporary test data cleanup

### 3. **Rate Limiting**
- Respectful API usage
- Built-in request throttling
- Error handling for limits

## Troubleshooting

### Common Issues

1. **"AI service not configured"**
   - Check `REACT_APP_LLAMA_API_KEY` in `.env`
   - Verify OpenRouter account status

2. **"Failed to get AI response"**
   - Check network connectivity
   - Verify API key validity
   - Check OpenRouter service status

3. **Rate limit errors**
   - Wait for rate limit reset
   - Consider upgrading OpenRouter plan
   - Use caching to reduce requests

### Debug Mode

Enable detailed logging:
```javascript
// All AI operations will log detailed information
console.log('AI Debug Mode: Enabled');
```

## Future Enhancements

### Planned Features
1. **Conversation Memory**: Long-term conversation context
2. **Advanced Analytics**: Portfolio performance predictions
3. **Market Alerts**: AI-driven notification system
4. **Educational Content**: Personalized learning paths
5. **Risk Assessment**: Advanced risk modeling

### Integration Opportunities
1. **Voice Interface**: Speech-to-text AI interactions
2. **Mobile App**: Native mobile AI assistant
3. **Email Digest**: AI-generated portfolio summaries
4. **Social Features**: AI-moderated investment discussions

## Support

For issues or questions regarding the LLaMA integration:

1. Check the console logs for detailed error information
2. Verify environment configuration
3. Test with portfolio simulator
4. Review OpenRouter API documentation
5. Check network connectivity and API status

---

**Status**: ✅ Production Ready
**Last Updated**: October 2025
**Version**: 1.0.0
