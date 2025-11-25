import express from 'express';
import {
  listClubs,
  getClubById,
  createClub,
  updateClub,
  deleteClub,
  addClubMember,
  removeClubMember,
  listClubMembers,
  getClubActivity
} from '../controllers/clubsController.js';

const router = express.Router();

router.get('/', listClubs);
router.post('/', createClub);
router.get('/:clubId', getClubById);
router.put('/:clubId', updateClub);
router.delete('/:clubId', deleteClub);

// Member management endpoints
router.post('/:clubId/members', addClubMember);
router.delete('/:clubId/members/:userId', removeClubMember);
router.get('/:clubId/members', listClubMembers);

// Activity feed endpoint
router.get('/:clubId/activity', getClubActivity);

export default router;

