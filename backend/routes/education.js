import express from 'express';
import {
  getEducationContent,
  getUserProgress,
  upsertUserProgress,
  validateEducationContent
} from '../controllers/educationController.js';

const router = express.Router();

router.get('/content', getEducationContent);
router.get('/progress/:userId', getUserProgress);
router.post('/progress', upsertUserProgress);
router.get('/validate', validateEducationContent);

export default router;

