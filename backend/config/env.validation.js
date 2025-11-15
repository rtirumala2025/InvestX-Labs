/**
 * Environment Variable Validation
 * 
 * Validates required environment variables at startup
 * Prevents runtime errors due to missing configuration
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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
    example: '3001',
    default: '3001',
  },
  NODE_ENV: {
    required: false,
    description: 'Node environment',
    example: 'development',
    default: 'development',
  },
  
  // MCP Configuration
  MCP_PORT: {
    required: false,
    description: 'MCP server port',
    example: '3002',
    default: '3002',
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
  console.log('\n🔍 Validating environment variables...\n');
  
  Object.entries(REQUIRED_ENV_VARS).forEach(([key, config]) => {
    const value = process.env[key] ||
      (key === 'SUPABASE_SERVICE_ROLE_KEY' ? process.env.SUPABASE_SERVICE_KEY : undefined);
    
    if (!value) {
      if (config.required) {
        validationResults.valid = false;
        validationResults.missing.push(key);
        validationResults.errors.push({
          key,
          message: `Missing required environment variable: ${key}`,
          description: config.description,
          example: config.example,
        });
        console.error(`❌ ${key}: MISSING (required)`);
        console.error(`   Description: ${config.description}`);
        console.error(`   Example: ${config.example}\n`);
      } else {
        if (config.default) {
          process.env[key] = config.default;
          console.log(`⚠️  ${key}: Using default value (${config.default})`);
        } else {
          validationResults.warnings.push({
            key,
            message: `Optional environment variable not set: ${key}`,
            description: config.description,
          });
          console.warn(`⚠️  ${key}: Not set (optional)`);
        }
      }
    } else {
      // Mask sensitive values in logs
      const maskedValue = key.includes('KEY') || key.includes('SECRET')
        ? `${value.substring(0, 10)}...`
        : value;
      console.log(`✅ ${key}: ${maskedValue}`);
    }
  });
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (!validationResults.valid) {
    console.error('❌ Environment validation FAILED\n');
    console.error('Missing required variables:');
    validationResults.missing.forEach(key => {
      console.error(`  - ${key}`);
    });
    console.error('\nPlease set these variables in your .env file\n');
    return false;
  }
  
  if (validationResults.warnings.length > 0) {
    console.warn(`⚠️  ${validationResults.warnings.length} optional variables not set\n`);
  }
  
  console.log('✅ Environment validation PASSED\n');
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
  console.log('\n📝 Environment Setup Instructions\n');
  console.log('Create a .env file in the backend directory with the following variables:\n');
  
  Object.entries(REQUIRED_ENV_VARS).forEach(([key, config]) => {
    const required = config.required ? '(REQUIRED)' : '(optional)';
    console.log(`${key}=${config.example} ${required}`);
    console.log(`# ${config.description}\n`);
  });
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

/**
 * Validate and exit if invalid
 */
export function validateOrExit() {
  const isValid = validateEnv();
  
  if (!isValid) {
    printSetupInstructions();
    console.error('❌ Cannot start server without required environment variables\n');
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
