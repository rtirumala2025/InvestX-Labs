import { logger } from '../utils/logger.js';
import { formatFinancialNumber } from './utils.js';

class RuleBase {
  constructor() {
    this.riskLevels = {
      conservative: { stocks: 30, bonds: 50, cash: 20 },
      moderate: { stocks: 60, bonds: 30, cash: 10 },
      aggressive: { stocks: 80, bonds: 15, cash: 5 }
    };
  }

  // Calculate suggested asset allocation based on risk tolerance and time horizon
  getAssetAllocation(riskTolerance, timeHorizonYears, options = {}) {
    const requestId = options.requestId || `req_${Date.now()}`;
    const logContext = { riskTolerance, timeHorizonYears, requestId };
    
    logger.debug('Calculating asset allocation', logContext);
    try {
      // Validate risk tolerance
      const validRiskLevels = Object.keys(this.riskLevels);
      if (!validRiskLevels.includes(riskTolerance)) {
        const errorMsg = `Invalid risk tolerance: ${riskTolerance}. Must be one of: ${validRiskLevels.join(', ')}`;
        logger.error(errorMsg, logContext);
        throw new Error(errorMsg);
      }
      
      // Validate time horizon
      if (typeof timeHorizonYears !== 'number' || timeHorizonYears < 0) {
        const errorMsg = `Invalid time horizon: ${timeHorizonYears}. Must be a positive number.`;
        logger.error(errorMsg, logContext);
        throw new Error(errorMsg);
      }
      // Adjust allocation based on time horizon
      const timeFactor = Math.min(Math.max(timeHorizonYears / 10, 0.5), 1.5);
      
      // Get base allocation based on risk tolerance
      const baseAllocation = this.riskLevels[riskTolerance] || this.riskLevels.moderate;
      
      // Adjust stock allocation based on time horizon
      const adjustedStocks = Math.min(
        90, // Cap at 90%
        Math.max(
          10, // Floor at 10%
          baseAllocation.stocks * timeFactor
        )
      );
      
      // Calculate remaining allocation
      const remaining = 100 - adjustedStocks;
      const bonds = (baseAllocation.bonds / (baseAllocation.bonds + baseAllocation.cash)) * remaining;
      const cash = remaining - bonds;
      
      const allocation = {
        stocks: Math.round(adjustedStocks * 10) / 10,
        bonds: Math.round(bonds * 10) / 10,
        cash: Math.round(cash * 10) / 10
      };
      
      logger.info('Calculated asset allocation', {
        ...logContext,
        allocation,
        timeFactor
      });
      
      return allocation;
    } catch (error) {
      logger.error('Error in getAssetAllocation:', error);
      // Return moderate allocation as fallback
      return { ...this.riskLevels.moderate };
    }
  }

  // Evaluate if a stock is a good buy based on P/E ratio and other metrics
  evaluateStock(metrics, options = {}) {
    const requestId = options.requestId || `req_${Date.now()}`;
    const logContext = { 
      symbol: metrics.symbol || 'unknown',
      requestId 
    };
    
    logger.debug('Evaluating stock', { ...logContext, metrics });
    
    // Validate required metrics
    const requiredMetrics = [
      'peRatio', 'pegRatio', 'dividendYield', 'beta', 
      'fiftyTwoWeekHigh', 'fiftyTwoWeekLow', 'currentPrice'
    ];
    
    const missingMetrics = requiredMetrics.filter(m => metrics[m] === undefined);
    if (missingMetrics.length > 0) {
      const errorMsg = `Missing required metrics: ${missingMetrics.join(', ')}`;
      logger.error(errorMsg, { ...logContext, missingMetrics });
      throw new Error(errorMsg);
    }
    const {
      peRatio,        // Price-to-Earnings ratio
      pegRatio,       // P/E to Growth ratio
      dividendYield,  // Dividend yield percentage
      beta,           // Volatility measure
      fiftyTwoWeekHigh,
      fiftyTwoWeekLow,
      currentPrice
    } = metrics;

    const score = {
      value: 0,
      metrics: {
        symbol: metrics.symbol || 'unknown',
        timestamp: new Date().toISOString()
      },
      summary: []
    };
    
    logger.debug('Initialized stock evaluation score', { 
      ...logContext,
      initialScore: score 
    });

    // Evaluate P/E Ratio (lower is generally better)
    if (peRatio < 15) {
      score.value += 2;
      score.metrics.peRating = 'good';
      score.summary.push('Attractive P/E ratio');
    } else if (peRatio < 25) {
      score.value += 1;
      score.metrics.peRating = 'average';
      score.summary.push('Reasonable P/E ratio');
    } else {
      score.metrics.peRating = 'high';
      score.summary.push('High P/E ratio - consider valuation carefully');
    }

    // Evaluate PEG Ratio (1.0 is considered fair value)
    if (pegRatio < 1) {
      score.value += 2;
      score.metrics.pegRating = 'undervalued';
      score.summary.push('Potentially undervalued based on growth');
    } else if (pegRatio < 1.5) {
      score.value += 1;
      score.metrics.pegRating = 'fair';
      score.summary.push('Fairly valued based on growth');
    } else {
      score.metrics.pegRating = 'overvalued';
      score.summary.push('Potentially overvalued based on growth');
    }

    // Evaluate Dividend Yield (context matters by sector)
    if (dividendYield > 0) {
      score.value += 1;
      score.metrics.dividend = 'pays';
      score.summary.push(`Pays a dividend of ${dividendYield}%`);
    }

    // Evaluate Price vs 52-Week Range
    const rangePct = (currentPrice - fiftyTwoWeekLow) / (fiftyTwoWeekHigh - fiftyTwoWeekLow) * 100;
    if (rangePct < 30) {
      score.value += 2;
      score.metrics.pricePosition = 'low';
      score.summary.push('Trading near 52-week low - potential buying opportunity');
    } else if (rangePct > 70) {
      score.metrics.pricePosition = 'high';
      score.summary.push('Trading near 52-week high - consider waiting for pullback');
    } else {
      score.value += 1;
      score.metrics.pricePosition = 'mid';
    }

    // Evaluate Volatility
    if (beta < 0.8) {
      score.value += 1;
      score.metrics.volatility = 'low';
      score.summary.push('Lower volatility than the market');
    } else if (beta > 1.2) {
      score.metrics.volatility = 'high';
      score.summary.push('Higher volatility than the market');
    } else {
      score.value += 1;
      score.metrics.volatility = 'average';
    }

    // Add metrics to score
    score.metrics = {
      ...score.metrics,
      peRatio: metrics.peRatio,
      pegRatio: metrics.pegRatio,
      dividendYield: metrics.dividendYield,
      beta: metrics.beta,
      priceToFiftyTwoWeekHigh: (metrics.currentPrice / metrics.fiftyTwoWeekHigh) * 100,
      priceToFiftyTwoWeekLow: (metrics.currentPrice / metrics.fiftyTwoWeekLow) * 100,
      ...score.metrics // Preserve any metrics added during evaluation
    };
    
    // Final rating
    if (score.value >= 5) {
      score.rating = 'Strong Buy';
      score.summary.unshift('This stock appears to be a strong investment based on fundamental analysis.');
    } else if (score.value >= 3) {
      score.rating = 'Buy';
      score.summary.unshift('This stock appears to be a good investment based on fundamental analysis.');
    } else if (score.value >= 1) {
      score.rating = 'Hold';
      score.summary.unshift('This stock appears fairly valued. Consider holding if already owned.');
    } else {
      score.rating = 'Sell';
      score.summary.unshift('Caution: This stock may be overvalued based on fundamental analysis.');
    }

    score.summary.push('Note: This is educational information only, not financial advice.');
    logger.info('Completed stock evaluation', {
      ...logContext,
      finalScore: score.value,
      rating: score.rating,
      metrics: score.metrics
    });
    
    return score;
  }

  // Get educational content based on user's knowledge level and interests
  getEducationalContent(interests = [], knowledgeLevel = 'beginner', options = {}) {
    const requestId = options.requestId || `req_${Date.now()}`;
    const logContext = { 
      interests, 
      knowledgeLevel,
      requestId 
    };
    
    logger.debug('Generating educational content', logContext);
    
    // Validate knowledge level
    const validKnowledgeLevels = ['beginner', 'intermediate', 'advanced'];
    if (!validKnowledgeLevels.includes(knowledgeLevel)) {
      const errorMsg = `Invalid knowledge level: ${knowledgeLevel}. Must be one of: ${validKnowledgeLevels.join(', ')}`;
      logger.error(errorMsg, logContext);
      throw new Error(errorMsg);
    }
    const content = [];
    
    // Add content based on interests
    if (interests.includes('stocks')) {
      content.push({
        title: 'Understanding Stocks',
        content: 'Stocks represent ownership in a company. When you buy a stock, you own a small piece of that company.',
        level: 'beginner',
        type: 'article',
        duration: '5 min read'
      });
    }
    
    if (interests.includes('bonds')) {
      content.push({
        title: 'Bonds Explained',
        content: 'Bonds are essentially loans you make to a company or government, which they agree to pay back with interest.',
        level: 'beginner',
        type: 'article',
        duration: '4 min read'
      });
    }
    
    if (interests.includes('etfs')) {
      content.push({
        title: 'ETFs for Beginners',
        content: 'ETFs (Exchange-Traded Funds) let you invest in many companies at once, providing instant diversification.',
        level: 'beginner',
        type: 'article',
        duration: '6 min read'
      });
    }
    
    // Add more advanced content if user is not a beginner
    if (knowledgeLevel !== 'beginner') {
      content.push({
        title: 'Advanced Portfolio Strategies',
        content: 'Learn about modern portfolio theory and how to optimize your asset allocation.',
        level: 'intermediate',
        type: 'guide',
        duration: '15 min read'
      });
    }
    
    logger.debug('Generated educational content', {
      ...logContext,
      contentCount: content.length
    });
    
    return content;
  }
}

// Create a singleton instance
export const ruleBase = new RuleBase();
