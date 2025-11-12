import express from 'express';
import {
  healthCheck,
  generateSuggestions,
  updateSuggestionConfidence,
  recordSuggestionInteraction,
  getSuggestionLogs,
  chat
} from '../controllers/aiController.js';

const router = express.Router();

router.get('/health', healthCheck);
router.post('/suggestions', generateSuggestions);
router.patch('/suggestions/:logId/confidence', updateSuggestionConfidence);
router.post('/suggestions/:logId/interactions', recordSuggestionInteraction);
router.get('/suggestions/logs/:userId', getSuggestionLogs);
router.post('/chat', chat);

export default router;
