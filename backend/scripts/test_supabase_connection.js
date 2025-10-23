import dns from 'dns';
import net from 'net';
import { promisify } from 'util';
import path from 'path';
import { writeFile } from 'fs/promises';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import logger from '../utils/logger.js';
import { supabase, adminSupabase } from '../ai-services/supabaseClient.js';

// Ensure global.fetch is available for any dependencies that expect it
global.fetch = fetch;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dnsResolve = promisify(dns.resolve4);
const TEST_ID = `test_${Date.now()}`;
const LOGS_DIR = path.join(__dirname, '../logs');

// Helper function to create marker files
const createMarkerFile = async (success, data = {}) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = path.join(LOGS_DIR, `test-${success ? 'success' : 'error'}-${timestamp}.json`);
    
    const result = {
      testId: TEST_ID,
      timestamp: new Date().toISOString(),
      success,
      environment: process.env.NODE_ENV || 'development',
      ...getGitInfo(),
      ...data
    };
    
    await writeFile(filename, JSON.stringify(result, null, 2));
    logger.info(`Created marker file: ${filename}`, { filename, testId: TEST_ID });
    return filename;
  } catch (error) {
    logger.error('Failed to create marker file', { 
      error: error.message,
      testId: TEST_ID 
    });
    return null;
  }
};

// Get Git info for logging
const getGitInfo = () => {
  try {
    return {
      commit: execSync('git rev-parse --short HEAD 2>/dev/null || echo "unknown"').toString().trim(),
      branch: execSync('git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown"').toString().trim()
    };
  } catch (error) {
    return { 
      commit: 'unknown', 
      branch: 'unknown',
      error: error.message 
    };
  }
};

// Test DNS resolution
const testDnsResolution = async (hostname) => {
  const startTime = Date.now();
  try {
    logger.info('Testing DNS resolution...', { hostname, testId: TEST_ID });
    const addresses = await dnsResolve(hostname);
    const duration = Date.now() - startTime;
    
    logger.info('DNS resolution successful', {
      testId: TEST_ID,
      hostname,
      addresses,
      duration: `${duration}ms`
    });
    
    return { success: true, addresses, duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('DNS resolution failed', {
      testId: TEST_ID,
      hostname,
      error: error.message,
      duration: `${duration}ms`
    });
    return { success: false, error: error.message, duration };
  }
};

// Test TCP connection
const testTcpConnection = async (host, port = 443) => {
  const startTime = Date.now();
  const socket = new net.Socket();
  
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      socket.destroy();
      const duration = Date.now() - startTime;
      const error = 'Connection timed out';
      logger.error('TCP connection timed out', {
        testId: TEST_ID,
        host,
        port,
        duration: `${duration}ms`
      });
      resolve({ success: false, error, duration });
    }, 5000);

    socket.on('error', (error) => {
      clearTimeout(timeout);
      const duration = Date.now() - startTime;
      logger.error('TCP connection failed', {
        testId: TEST_ID,
        host,
        port,
        error: error.message,
        duration: `${duration}ms`
      });
      resolve({ success: false, error: error.message, duration });
    });

    socket.connect(port, host, () => {
      clearTimeout(timeout);
      const duration = Date.now() - startTime;
      socket.destroy();
      
      logger.info('TCP connection successful', {
        testId: TEST_ID,
        host,
        port,
        duration: `${duration}ms`
      });
      
      resolve({ success: true, duration });
    });
  });
};

// Test Supabase connection
const testSupabaseConnection = async () => {
  const results = {
    dns: null,
    tcp: null,
    auth: null,
    database: null
  };
  
  try {
    // Test DNS resolution
    const supabaseHost = new URL(process.env.SUPABASE_URL).hostname;
    results.dns = await testDnsResolution(supabaseHost);
    
    if (!results.dns.success) {
      throw new Error('DNS resolution failed');
    }
    
    // Test TCP connection
    results.tcp = await testTcpConnection(supabaseHost, 443);
    if (!results.tcp.success) {
      throw new Error('TCP connection failed');
    }
    
    // Test auth.users table access
    const authStartTime = Date.now();
    try {
      const { data, error } = await adminSupabase
        .from('users')
        .select('*')
        .limit(1);
      
      const duration = Date.now() - authStartTime;
      
      if (error) throw error;
      
      results.auth = {
        success: true,
        duration,
        userCount: data?.length || 0
      };
      
      logger.info('Auth test successful', {
        testId: TEST_ID,
        duration: `${duration}ms`,
        userCount: results.auth.userCount
      });
      
    } catch (error) {
      const duration = Date.now() - authStartTime;
      logger.error('Auth test failed', {
        testId: TEST_ID,
        error: error.message,
        duration: `${duration}ms`
      });
      results.auth = { success: false, error: error.message, duration };
    }
    
    // Test database connection with pg_tables
    const dbStartTime = Date.now();
    try {
      const { data, error } = await adminSupabase.rpc('get_pg_tables');
      const duration = Date.now() - dbStartTime;
      
      if (error) throw error;
      
      results.database = {
        success: true,
        duration,
        tableCount: data?.length || 0
      };
      
      logger.info('Database test successful', {
        testId: TEST_ID,
        duration: `${duration}ms`,
        tableCount: results.database.tableCount
      });
      
    } catch (error) {
      const duration = Date.now() - dbStartTime;
      logger.error('Database test failed', {
        testId: TEST_ID,
        error: error.message,
        duration: `${duration}ms`
      });
      results.database = { success: false, error: error.message, duration };
    }
    
    // Check if all tests passed
    const allTestsPassed = Object.values(results).every(r => r?.success);
    
    if (allTestsPassed) {
      logger.info('All tests completed successfully', { testId: TEST_ID });
      await createMarkerFile(true, { results });
      return { success: true, results };
    } else {
      const error = 'One or more tests failed';
      logger.error(error, { testId: TEST_ID, results });
      await createMarkerFile(false, { results });
      return { success: false, error, results };
    }
    
  } catch (error) {
    logger.error('Test suite failed', {
      testId: TEST_ID,
      error: error.message,
      stack: error.stack
    });
    
    await createMarkerFile(false, {
      error: error.message,
      stack: error.stack,
      results
    });
    
    return { success: false, error: error.message, results };
  }
};

// Run the tests
(async () => {
  try {
    logger.info('Starting Supabase connection tests', { testId: TEST_ID });
    const { success, error } = await testSupabaseConnection();
    
    if (success) {
      logger.info('All tests completed successfully', { testId: TEST_ID });
      process.exit(0);
    } else {
      logger.error('Tests completed with errors', { testId: TEST_ID, error });
      process.exit(1);
    }
  } catch (error) {
    logger.error('Unexpected error in test suite', {
      testId: TEST_ID,
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
})();
