import express from 'express';
import {
  listClubs,
  getClubById,
  createClub,
  updateClub,
  deleteClub
} from '../controllers/clubsController.js';

const router = express.Router();

router.get('/', listClubs);
router.post('/', createClub);
router.get('/:clubId', getClubById);
router.put('/:clubId', updateClub);
router.delete('/:clubId', deleteClub);

export default router;

