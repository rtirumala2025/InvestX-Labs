import express from 'express';
import {
  getQuote,
  getCompanyOverview,
  searchSymbols,
  getHistoricalData
} from '../controllers/marketController.js';

const router = express.Router();

router.get('/quote/:symbol', getQuote);
router.get('/company/:symbol', getCompanyOverview);
router.get('/search', searchSymbols);
router.get('/historical/:symbol', getHistoricalData);

export default router;
