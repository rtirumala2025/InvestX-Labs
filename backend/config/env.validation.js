/**
 * Environment Variable Validation
 * 
 * Validates required environment variables at startup
 * Prevents runtime errors due to missing configuration
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import logger from '../utils/logger.js';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

// Required environment variables
const REQUIRED_ENV_VARS = {
  // Supabase Configuration
  SUPABASE_URL: {
    required: true,
    description: 'Supabase project URL',
    example: 'https://your-project.supabase.co',
  },
  SUPABASE_ANON_KEY: {
    required: true,
    description: 'Supabase anonymous key',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  },
  SUPABASE_SERVICE_ROLE_KEY: {
    required: false,
    description: 'Supabase service role key (for admin operations). Legacy alias SUPABASE_SERVICE_KEY is also supported.',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  },
  
  // Alpha Vantage Configuration
  ALPHA_VANTAGE_API_KEY: {
    required: true,
    description: 'Alpha Vantage API key for real-time market data',
    example: 'YOUR_ALPHA_VANTAGE_API_KEY',
  },
  ALPHA_VANTAGE_KEY: {
    required: false,
    description: 'Alias for Alpha Vantage API key',
    example: 'YOUR_ALPHA_VANTAGE_API_KEY',
  },
  
  // OpenRouter Configuration (for AI features)
  OPENROUTER_API_KEY: {
    required: false,
    description: 'OpenRouter API key for AI chat features',
    example: 'sk-or-v1-...',
  },
  
  // Server Configuration
  PORT: {
    required: false,
    description: 'Server port',
    example: '5001',
    default: '5001',
  },
  NODE_ENV: {
    required: false,
    description: 'Node environment',
    example: 'development',
    default: 'development',
  },
  APP_URL: {
    required: false,
    description: 'Public application URL for referer headers',
    example: 'https://app.investxlabs.com',
  },
  
  // MCP Configuration
  MCP_PORT: {
    required: false,
    description: 'MCP server port',
    example: '3002',
    default: '3002',
  },
  MCP_ENABLED: {
    required: false,
    description: 'Enable MCP server',
    example: 'false',
    default: 'false',
  },
  MCP_ENABLED: {
    required: false,
    description: 'Feature flag to enable Model Context Protocol (MCP) server',
    example: 'false',
    default: 'false',
  },
};

// Validation results
const validationResults = {
  valid: true,
  missing: [],
  warnings: [],
  errors: [],
};

/**
 * Validate environment variables
 */
export function validateEnv() {
  const isProd = (process.env.NODE_ENV || 'development') === 'production';
  logger.info('🔍 Validating environment variables...');
  
  Object.entries(REQUIRED_ENV_VARS).forEach(([key, config]) => {
    const value = process.env[key] ||
      (key === 'SUPABASE_SERVICE_ROLE_KEY' ? process.env.SUPABASE_SERVICE_KEY : undefined);
    
    if (!value) {
      const isCritical = config.required || (isProd && ['SUPABASE_URL','SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','ALPHA_VANTAGE_API_KEY','ALPHA_VANTAGE_KEY','APP_URL'].includes(key));
      if (isCritical) {
        validationResults.valid = false;
        validationResults.missing.push(key);
        validationResults.errors.push({
          key,
          message: `Missing required environment variable: ${key}`,
          description: config.description,
          example: config.example,
        });
        logger.error(`❌ ${key}: MISSING${isProd ? ' (required in production)' : ' (required)'}`);
        logger.error(`   Description: ${config.description}`);
        if (config.example) logger.error(`   Example: ${config.example}`);
      } else {
        if (config.default) {
          process.env[key] = config.default;
          logger.warn(`⚠️  ${key}: Using default value (${config.default})`);
        } else {
          validationResults.warnings.push({
            key,
            message: `Optional environment variable not set: ${key}`,
            description: config.description,
          });
          logger.warn(`⚠️  ${key}: Not set (optional)`);
        }
      }
    } else {
      // Mask sensitive values in logs
      const maskedValue = key.includes('KEY') || key.includes('SECRET')
        ? `${value.substring(0, 6)}...`
        : value;
      logger.info(`✅ ${key}: ${maskedValue}`);
    }
  });
  
  if (!validationResults.valid) {
    logger.error('❌ Environment validation FAILED');
    logger.error('Missing required variables:');
    validationResults.missing.forEach(key => {
      logger.error(`  - ${key}`);
    });
    logger.error('Please set these variables in your .env file');
    return false;
  }
  
  if (validationResults.warnings.length > 0) {
    logger.warn(`⚠️  ${validationResults.warnings.length} optional variables not set`);
  }
  
  logger.info('✅ Environment validation PASSED');
  return true;
}

/**
 * Get validation results
 */
export function getValidationResults() {
  return validationResults;
}

/**
 * Print environment setup instructions
 */
export function printSetupInstructions() {
  logger.info('📝 Environment Setup Instructions');
  logger.info('Create a .env file in the backend directory with the following variables:');
  
  Object.entries(REQUIRED_ENV_VARS).forEach(([key, config]) => {
    const required = config.required ? '(REQUIRED)' : '(optional)';
    logger.info(`${key}=${config.example} ${required}`);
    logger.info(`# ${config.description}`);
  });
}

/**
 * Validate and exit if invalid
 */
export function validateOrExit() {
  const isValid = validateEnv();
  const isProd = (process.env.NODE_ENV || 'development') === 'production';
  
  if (!isValid && isProd) {
    printSetupInstructions();
    logger.error('❌ Cannot start server without required environment variables');
    process.exit(1);
  }
}

// Export configuration
export const config = {
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
  },
  alphaVantage: {
    apiKey: process.env.ALPHA_VANTAGE_API_KEY,
  },
  openRouter: {
    apiKey: process.env.OPENROUTER_API_KEY,
  },
  server: {
    port: process.env.PORT || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  mcp: {
    port: process.env.MCP_PORT || 3002,
  },
};

export default {
  validateEnv,
  validateOrExit,
  getValidationResults,
  printSetupInstructions,
  config,
};
