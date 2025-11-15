import express from 'express';
import {
  healthCheck,
  getContext
} from '../controllers/mcpController.js';

const router = express.Router();

router.get('/health', healthCheck);
router.get('/mcp/context', getContext);

export default router;
