/**
 * AI Controller Tests
 * 
 * Tests for AI endpoints:
 * - Health check
 * - Chat
 * - Suggestions generation
 * - Analytics
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  healthCheck,
  chat,
  generateSuggestions,
  computeAnalytics
} from '../controllers/aiController.js';
import * as aiSystem from '../ai-system/index.js';

// Mock dependencies
jest.mock('../ai-system/index.js');

describe('AI Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 'test-user-id' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    jest.clearAllMocks();
  });

  describe('healthCheck', () => {
    it('should return health status', async () => {
      await healthCheck(req, res);

      expect(res.json).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0]).toHaveProperty('status');
    });
  });

  describe('chat', () => {
    it('should process chat message and return response', async () => {
      req.body = {
        message: 'What is a stock?',
        userId: 'test-user-id',
        sessionId: 'test-session-id'
      };

      aiSystem.aiEngine = {
        processMessage: jest.fn().mockResolvedValue({
          response: 'A stock represents ownership in a company.',
          intent: 'education'
        })
      };

      await chat(req, res);

      expect(res.json).toHaveBeenCalled();
    });

    it('should return 400 for missing message', async () => {
      req.body = { userId: 'test-user-id' };

      await chat(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('generateSuggestions', () => {
    it('should generate investment suggestions', async () => {
      req.body = {
        userId: 'test-user-id',
        portfolioData: { holdings: [] }
      };

      aiSystem.generateSuggestionsService = jest.fn().mockResolvedValue([
        { type: 'buy', symbol: 'AAPL', confidence: 0.8 }
      ]);

      await generateSuggestions(req, res);

      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('computeAnalytics', () => {
    it('should compute portfolio analytics', async () => {
      req.body = {
        portfolioId: 'test-portfolio-id',
        userId: 'test-user-id'
      };

      await computeAnalytics(req, res);

      expect(res.json).toHaveBeenCalled();
    });
  });
});
