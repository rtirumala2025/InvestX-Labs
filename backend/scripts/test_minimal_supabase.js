import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns/promises';
import net from 'net';
import { execSync } from 'child_process';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import logger and supabase after env is loaded
import logger from '../utils/logger.js';
import { supabase, supabaseAdmin } from '../ai-services/supabaseClient.js';

// Get Git commit info for better traceability
const getGitInfo = () => {
  try {
    return {
      commit: execSync('git rev-parse --short HEAD').toString().trim(),
      branch: execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
    };
  } catch (error) {
    return { error: error.message };
  }
};

const gitInfo = getGitInfo();
const testId = `test-${Date.now()}`;

async function testDnsResolution(hostname) {
  try {
    const start = Date.now();
    const addresses = await dns.resolve4(hostname);
    const duration = Date.now() - start;
    
    logger.info('DNS resolution successful', {
      hostname,
      addresses,
      duration: `${duration}ms`
    });
    
    return { success: true, addresses, duration };
  } catch (error) {
    logger.error('DNS resolution failed', {
      hostname,
      error: error.message,
      code: error.code
    });
    throw new Error(`DNS resolution failed: ${error.message}`);
  }
}

async function testTcpConnection(hostname, port = 5432) {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = net.createConnection({ host: hostname, port, timeout: 5000 });
    
    const timeout = setTimeout(() => {
      socket.destroy();
      const error = new Error(`TCP connection to ${hostname}:${port} timed out`);
      logger.error('TCP connection timed out', {
        hostname,
        port,
        error: error.message
      });
      resolve({ success: false, error });
    }, 5000);
    
    socket.on('connect', () => {
      clearTimeout(timeout);
      const duration = Date.now() - start;
      socket.end();
      
      logger.info('TCP connection successful', {
        hostname,
        port,
        duration: `${duration}ms`
      });
      
      resolve({ success: true, duration });
    });
    
    socket.on('error', (error) => {
      clearTimeout(timeout);
      logger.error('TCP connection failed', {
        hostname,
        port,
        error: error.message,
        code: error.code
      });
      resolve({ success: false, error });
    });
  });
}

async function testSupabaseConnection() {
  const testStart = Date.now();
  const testContext = {
    testId,
    git: gitInfo,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    platform: process.platform,
    timestamp: new Date().toISOString()
  };
  
  try {
    logger.info('🚀 Starting Supabase connection test', testContext);
    
    // Log environment summary (without sensitive data)
    const envSummary = {
      ...testContext,
      supabaseUrl: process.env.SUPABASE_URL ? 
        new URL(process.env.SUPABASE_URL).origin : 'Not configured',
      nodeEnv: process.env.NODE_ENV || 'development',
      logLevel: process.env.LOG_LEVEL || 'info',
      logDir: path.join(process.cwd(), 'logs')
    };
    logger.debug('Test environment summary', envSummary);
    
    // 1. Parse Supabase URL
    let supabaseUrl;
    try {
      supabaseUrl = new URL(process.env.SUPABASE_URL);
      logger.debug('Parsed Supabase URL', {
        testId,
        hostname: supabaseUrl.hostname,
        protocol: supabaseUrl.protocol
      });
    } catch (error) {
      const errorMsg = `Invalid SUPABASE_URL: ${error.message}`;
      logger.error(errorMsg, { testId, error: error.message });
      throw new Error(errorMsg);
    }
    
    // 2. Test DNS resolution
    const dnsResult = await testDnsResolution(supabaseUrl.hostname);
    if (!dnsResult.success) {
      throw new Error('DNS resolution failed');
    }
    
    // 3. Test TCP connection (use port 443 for HTTPS)
    const tcpResult = await testTcpConnection(supabaseUrl.hostname, 443);
    if (!tcpResult.success) {
      throw new Error('TCP connection failed');
    }
    
    // 4. Test Supabase query - try auth.users first, then fallback to direct query
    let data, error, queryType = 'auth.users';
    
    try {
      logger.debug(`Attempting to query auth.users`, { testId });
      
      // First try using the admin client to query auth.users
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1
      });
      
      if (!authError) {
        data = authData.users;
        logger.debug('Successfully queried auth.users', { 
          testId, 
          userCount: data ? data.length : 0 
        });
      } else {
        // Fallback to direct query if auth admin fails
        logger.debug('Auth admin query failed, trying direct query', { 
          testId, 
          error: authError.message,
          queryType: 'fallback'
        });
        
        // Fallback to direct query
        queryType = 'direct';
        const { data: directData, error: directError } = await supabase
          .from('users')
          .select('id, email, created_at')
          .limit(1);
          
        if (!directError) {
          data = directData;
        } else {
          error = directError;
        }
      }
    } catch (authError) {
      logger.debug('Auth query failed, trying direct query', { 
        testId, 
        error: authError.message,
        queryType: 'fallback'
      });
      
      // Fallback to direct query
      queryType = 'direct';
      const { data: directData, error: directError } = await supabase
        .from('users')
        .select('id, email, created_at')
        .limit(1);
        
      if (!directError) {
        data = directData;
      } else {
        error = directError;
      }
    }

    if (!data && !error) {
      error = new Error('None of the test tables exist');
      error.code = 'NO_TABLES_FOUND';
    }
    
    if (error) {
      logger.error('Supabase query failed', { 
        testId, 
        error: error.message,
        code: error.code,
        details: error.details || error.hint || ''
      });
      throw error;
    }
    
    const duration = Date.now() - testStart;
    const resultSummary = {
      testId,
      duration: `${duration}ms`,
      queryType,
      rowCount: data ? data.length : 0,
      dataSample: data && data.length > 0 ? 
        Object.keys(data[0]).reduce((acc, key) => {
          // Sanitize sensitive data
          if (key.toLowerCase().includes('token') || 
              key.toLowerCase().includes('password') ||
              key.toLowerCase().includes('secret')) {
            acc[key] = '***REDACTED***';
          } else if (typeof data[0][key] === 'object') {
            acc[key] = '[Object]';
          } else {
            acc[key] = data[0][key];
          }
          return acc;
        }, {}) : null,
      environment: process.env.NODE_ENV || 'development'
    };
    
    // Log success with performance metrics
    logger.info('✅ Supabase connection test successful', {
      ...resultSummary,
      performance: {
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      }
    });
    
    // Write a success marker file
    try {
      const successFile = path.join(process.cwd(), 'logs', `test-success-${testId}.json`);
      fs.writeFileSync(successFile, JSON.stringify({
        ...resultSummary,
        status: 'success',
        timestamp: new Date().toISOString()
      }, null, 2));
    } catch (fileError) {
      logger.warn('Failed to write success marker file', { 
        testId, 
        error: fileError.message 
      });
    }
    
    return { 
      success: true, 
      data,
      duration,
      testId
    };
    
  } catch (error) {
    const errorMsg = error.message || 'Unknown error during Supabase test';
    const errorInfo = {
      testId,
      error: {
        name: error.name,
        message: error.message,
        code: error.code || '',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      duration: Date.now() - testStart,
      environment: process.env.NODE_ENV || 'development'
    };
    
    logger.error('❌ Test failed', errorInfo);
    
    // Write an error marker file
    try {
      const errorFile = path.join(process.cwd(), 'logs', `test-error-${testId}.json`);
      fs.writeFileSync(errorFile, JSON.stringify({
        ...errorInfo,
        status: 'failed',
        timestamp: new Date().toISOString()
      }, null, 2));
    } catch (fileError) {
      console.error('Failed to write error file:', fileError);
    }
    
    return { 
      success: false, 
      error: errorMsg,
      testId,
      duration: Date.now() - testStart
    };
  } finally {
    logger.info('🏁 Test completed', { 
      testId,
      duration: `${Date.now() - testStart}ms` 
    });
  }
}

// Handle command line arguments
const isVerbose = process.argv.includes('--verbose');
if (isVerbose) {
  console.log('Running in verbose mode');
  // Enable debug logging if verbose flag is set
  process.env.DEBUG = 'true';
}

// Run the test
(async () => {
  try {
    const result = await testSupabaseConnection();
    if (result.success) {
      console.log('✅ Test passed! Result:', result.data);
    } else {
      console.error('❌ Test failed:', result.error?.message || 'Unknown error');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Unhandled error in test:', error);
    process.exit(1);
  }
})();
