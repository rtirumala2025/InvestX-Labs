const { createClient } = require('@supabase/supabase-js');
const dns = require('dns');
const net = require('net');
const { promisify } = require('util');
const { createHash } = require('crypto');
const { writeFile, mkdir, access } = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
require('dotenv').config({ path: '../../.env' });

// Import the logger
const logger = require('../utils/logger');

// Configure environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
try {
  const envPath = join(__dirname, '../../.env');
  dotenv.config({ path: envPath });
  logger.info(`Loaded environment variables from: ${envPath}`);
} catch (error) {
  logger.warn('Failed to load .env file, using system environment variables', {
    error: error.message
  });
}

// Constants
const LOGS_DIR = join(process.cwd(), 'logs');
const TEST_ID = `test_${Date.now()}`;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const TEST_TIMEOUT_MS = 30000; // 30 seconds timeout for tests

// Promisify Node.js functions
const dnsResolve = promisify(dns.resolve4);
const tcpConnect = (host, port, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let connected = false;
    let timeoutId = setTimeout(() => {
      if (!connected) {
        socket.destroy();
        resolve({ success: false, error: 'Connection timeout', timedOut: true });
      }
    }, timeout);

    socket.on('connect', () => {
      clearTimeout(timeoutId);
      connected = true;
      socket.end();
      resolve({ success: true });
    });
    
    socket.on('error', (error) => {
      clearTimeout(timeoutId);
      resolve({ 
        success: false, 
        error: error.message, 
        code: error.code,
        syscall: error.syscall
      });
    });
    
    socket.connect(port, host);
  });
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

// Create a test result marker file
const createMarkerFile = async (success, data = {}) => {
  try {
    await mkdir(LOGS_DIR, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = join(LOGS_DIR, `test-${success ? 'success' : 'error'}-${timestamp}.json`);
    
    const result = {
      testId: TEST_ID,
      timestamp: new Date().toISOString(),
      success,
      environment: process.env.NODE_ENV || 'development',
      nodeEnv: process.env.NODE_ENV,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      ...getGitInfo(),
      ...data
    };
    
    // Ensure we don't include circular references or non-serializable data
    const safeData = JSON.parse(JSON.stringify(result, (key, value) => {
      if (value instanceof Error) {
        return {
          message: value.message,
          name: value.name,
          stack: value.stack,
          ...value
        };
      }
      return value;
    }));
    
    await writeFile(filename, JSON.stringify(safeData, null, 2));
    logger.info(`Created test result marker file: ${filename}`, { 
      filename, 
      testId: TEST_ID,
      success,
      fileSize: Buffer.byteLength(JSON.stringify(safeData)) / 1024 + ' KB'
    });
    return filename;
  } catch (error) {
    logger.error('Failed to create marker file', { 
      error: error.message, 
      stack: error.stack,
      testId: TEST_ID,
      code: error.code,
      syscall: error.syscall
    });
    return null;
  }
};

// Test DNS resolution with multiple record types
const testDnsResolution = async (hostname) => {
  const startTime = Date.now();
  const result = {
    success: false,
    hostname,
    testId: TEST_ID,
    startTime: new Date().toISOString(),
    records: {},
    errors: []
  };
  
  try {
    logger.info('Starting DNS resolution tests...', { 
      hostname, 
      testId: TEST_ID,
      recordTypes: ['A', 'AAAA', 'CNAME', 'MX', 'TXT']
    });
    
    // Test different record types
    const recordTypes = ['A', 'AAAA', 'CNAME', 'MX', 'TXT'];
    
    for (const type of recordTypes) {
      try {
        const resolveFn = promisify(type === 'A' ? dns.resolve4 : 
                                  type === 'AAAA' ? dns.resolve6 :
                                  type === 'CNAME' ? dns.resolveCname :
                                  type === 'MX' ? dns.resolveMx :
                                  dns.resolveTxt);
                                  
        const records = await resolveFn(hostname);
        result.records[type] = records;
        logger.debug(`DNS ${type} records resolved`, {
          testId: TEST_ID,
          hostname,
          type,
          count: Array.isArray(records) ? records.length : 1
        });
      } catch (error) {
        const errorInfo = {
          type,
          error: error.message,
          code: error.code
        };
        result.errors.push(errorInfo);
        logger.warn(`Failed to resolve ${type} records`, {
          testId: TEST_ID,
          hostname,
          ...errorInfo
        });
      }
    }
    
    // Consider it a success if we got at least one record type
    const hasRecords = Object.values(result.records).some(records => 
      Array.isArray(records) ? records.length > 0 : !!records
    );
    
    result.success = hasRecords;
    result.duration = Date.now() - startTime;
    
    if (hasRecords) {
      logger.info('DNS resolution completed successfully', {
        testId: TEST_ID,
        hostname,
        duration: `${result.duration}ms`,
        recordTypes: Object.keys(result.records).filter(k => result.records[k]?.length > 0)
      });
    } else {
      logger.error('DNS resolution failed for all record types', {
        testId: TEST_ID,
        hostname,
        errors: result.errors,
        duration: `${result.duration}ms`
      });
    }
    
    return result;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorInfo = {
      testId: TEST_ID,
      hostname,
      error: error.message,
      code: error.code,
      duration,
      stack: error.stack
    };
    
    logger.error('DNS resolution test failed', errorInfo);
    return {
      ...result,
      success: false,
      error: error.message,
      code: error.code,
      duration,
      errors: [...(result.errors || []), { error: error.message, code: error.code }]
    };
  }
};

// Test TCP connection with multiple ports and protocols
const testTcpConnection = async (host, ports = [443, 80]) => {
  const startTime = Date.now();
  const results = [];
  
  logger.info('Starting TCP connection tests...', { 
    testId: TEST_ID,
    host,
    ports,
    timeout: '5s per port'
  });
  
  // Test each port in parallel with timeout
  const testPromises = ports.map(async (port) => {
    const portStartTime = Date.now();
    const result = {
      port,
      protocol: port === 443 ? 'HTTPS' : port === 80 ? 'HTTP' : `TCP/${port}`,
      success: false,
      startTime: new Date().toISOString(),
      duration: 0
    };
    
    try {
      logger.debug(`Testing ${result.protocol} connection...`, { 
        testId: TEST_ID, 
        host, 
        port 
      });
      
      const connectionResult = await tcpConnect(host, port, 5000);
      const duration = Date.now() - portStartTime;
      
      if (connectionResult.success) {
        result.success = true;
        result.duration = duration;
        logger.info(`${result.protocol} connection successful`, {
          testId: TEST_ID,
          host,
          port,
          duration: `${duration}ms`
        });
      } else {
        throw new Error(connectionResult.error || 'Connection failed');
      }
    } catch (error) {
      const duration = Date.now() - portStartTime;
      result.duration = duration;
      result.error = error.message;
      result.code = error.code;
      
      logger.warn(`${result.protocol} connection failed`, {
        testId: TEST_ID,
        host,
        port,
        error: error.message,
        code: error.code,
        duration: `${duration}ms`
      });
    }
    
    return result;
  });
  
  // Wait for all tests to complete with a timeout
  try {
    results.push(...await Promise.all(testPromises));
  } catch (error) {
    logger.error('Error during TCP connection tests', {
      testId: TEST_ID,
      error: error.message,
      stack: error.stack
    });
  }
  
  const duration = Date.now() - startTime;
  const success = results.some(r => r.success);
  
  const summary = {
    testId: TEST_ID,
    host,
    success,
    duration,
    portsTested: results.length,
    portsSuccessful: results.filter(r => r.success).length,
    results
  };
  
  if (success) {
    logger.info('TCP connection tests completed successfully', {
      testId: TEST_ID,
      ...summary
    });
  } else {
    logger.error('All TCP connection tests failed', {
      testId: TEST_ID,
      ...summary
    });
  }
  
  return summary;
};

// Create Supabase client with retry logic and enhanced error handling
const createSupabaseClient = (url, key, options = {}) => {
  const { 
    maxRetries = MAX_RETRIES, 
    retryDelay = RETRY_DELAY_MS,
    clientType = 'anon',
    timeout = 10000 // 10 seconds default timeout
  } = options;
  
  const clientOptions = {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        'X-Client-Name': 'supabase-connection-tester',
        'X-Client-Version': '1.0.0',
        'X-Test-ID': TEST_ID,
        'X-Client-Type': clientType
      }
    },
    db: {
      schema: 'public'
    }
  };
  
  // Add timeout to fetch requests
  const fetchWithTimeout = async (url, fetchOptions = {}) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeout}ms`);
      }
      throw error;
    }
  };
  
  // Custom fetch with retry logic
  const customFetch = async (url, fetchOptions = {}) => {
    let lastError;
    const requestId = `req_${createHash('sha256')
      .update(`${Date.now()}_${Math.random()}`)
      .digest('hex')
      .substring(0, 12)}`;
    
    const requestInfo = {
      testId: TEST_ID,
      requestId,
      clientType,
      url: url.toString(),
      method: fetchOptions.method || 'GET'
    };
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const startTime = Date.now();
      
      try {
        logger.debug(`Sending request to Supabase (attempt ${attempt}/${maxRetries})`, {
          ...requestInfo,
          attempt,
          maxRetries,
          timeout: `${timeout}ms`
        });
        
        const response = await fetchWithTimeout(url, {
          ...fetchOptions,
          headers: {
            ...fetchOptions.headers,
            'X-Request-ID': requestId,
            'X-Request-Attempt': attempt.toString(),
            'X-Request-Timeout': timeout.toString(),
            'X-Test-ID': TEST_ID,
            'X-Client-Type': clientType
          }
        });
        
        const responseTime = Date.now() - startTime;
        const responseClone = response.clone();
        
        // Log response summary
        const responseInfo = {
          ...requestInfo,
          status: response.status,
          statusText: response.statusText,
          duration: responseTime,
          attempt,
          headers: Object.fromEntries(response.headers.entries())
        };
        
        // Try to parse response as JSON, fall back to text
        try {
          const data = await responseClone.json();
          logger.debug('Received JSON response from Supabase', {
            ...responseInfo,
            responseSize: JSON.stringify(data).length
          });
        } catch (e) {
          const text = await responseClone.text();
          logger.debug('Received text response from Supabase', {
            ...responseInfo,
            responseSize: text.length,
            isTruncated: text.length > 1000 ? `${text.length} bytes` : false,
            preview: text.length <= 1000 ? text : `${text.substring(0, 100)}... [truncated]`
          });
        }
        
        // Log slow responses
        if (responseTime > 2000) {
          logger.warn('Slow Supabase response', {
            ...responseInfo,
            duration: responseTime,
            threshold: 2000
          });
        }
        
        return response;
        
      } catch (error) {
        lastError = error;
        const errorTime = Date.now() - startTime;
        
        const errorInfo = {
          ...requestInfo,
          error: error.message,
          code: error.code,
          name: error.name,
          attempt,
          duration: errorTime,
          stack: error.stack
        };
        
        // Don't retry on client errors (4xx) except 408, 429, and 5xx
        const isRetryable = !error.status || 
                           (error.status >= 500) || 
                           [408, 429].includes(error.status);
        
        if (attempt < maxRetries && isRetryable) {
          // Exponential backoff with jitter
          const baseDelay = Math.min(
            retryDelay * Math.pow(2, attempt - 1),
            30000 // Max 30 seconds
          );
          const jitter = Math.random() * 0.5 + 0.75; // 0.75 to 1.25
          const delay = Math.floor(baseDelay * jitter);
          
          logger.warn(`Request failed, retrying in ${delay}ms...`, {
            ...errorInfo,
            nextAttemptIn: `${delay}ms`,
            maxRetries,
            isRetryable
          });
          
          await new Promise(resolve => setTimeout(resolve, delay));
        } else if (attempt >= maxRetries) {
          logger.error('Max retries reached, request failed', errorInfo);
        } else {
          logger.error('Non-retryable error', {
            ...errorInfo,
            isRetryable
          });
        }
      }
    }
    
    const finalError = lastError || new Error('Unknown error occurred during Supabase request');
    finalError.isOperational = true;
    finalError.code = finalError.code || 'E_SUPABASE_REQUEST_FAILED';
    throw finalError;
  };
  
  // Create the client with our custom fetch
  try {
    const client = createClient(url, key, {
      ...clientOptions,
      global: {
        ...clientOptions.global,
        fetch: customFetch
      }
    });
    
    logger.info(`Supabase ${clientType} client initialized`, {
      testId: TEST_ID,
      url,
      clientType,
      keyPrefix: key ? `${key.substring(0, 8)}...` : 'none',
      timeout: `${timeout}ms`,
      maxRetries
    });
    
    return client;
    
  } catch (error) {
    logger.error('Failed to create Supabase client', {
      testId: TEST_ID,
      clientType,
      error: error.message,
      code: error.code,
      stack: error.stack
    });
    
    // Re-throw with more context
    const wrappedError = new Error(`Failed to initialize Supabase ${clientType} client: ${error.message}`);
    wrappedError.originalError = error;
    wrappedError.code = error.code || 'E_SUPABASE_INIT_FAILED';
    throw wrappedError;
  }
};

// Test database connection and run various queries
const testDatabaseConnection = async (supabase, clientType = 'anon') => {
  const startTime = Date.now();
  const result = { 
    success: false, 
    clientType,
    testId: TEST_ID,
    startTime: new Date().toISOString(),
    queries: {},
    errors: []
  };
  
  try {
    logger.info(`Testing ${clientType} database connection...`, { 
      testId: TEST_ID,
      clientType
    });
    
    // 1. Test basic connection with version
    const versionStart = Date.now();
    try {
      const { data: versionData, error: versionError } = await supabase.rpc('version');
      
      if (versionError) throw versionError;
      
      const duration = Date.now() - versionStart;
      result.queries.version = {
        success: true,
        duration,
        data: versionData
      };
      
      logger.info('Database version query successful', {
        testId: TEST_ID,
        clientType,
        duration: `${duration}ms`,
        version: versionData
      });
      
    } catch (error) {
      const duration = Date.now() - versionStart;
      const errorInfo = {
        query: 'version',
        error: error.message,
        code: error.code,
        duration
      };
      
      result.queries.version = {
        success: false,
        ...errorInfo
      };
      result.errors.push(errorInfo);
      
      logger.error('Database version query failed', {
        testId: TEST_ID,
        clientType,
        ...errorInfo
      });
      
      // If we can't even get the version, fail fast
      throw new Error(`Failed to get database version: ${error.message}`);
    }
    
    // 2. Test auth.users access (requires admin)
    if (clientType === 'admin') {
      const authStart = Date.now();
      try {
        const { data: authData, error: authError, count } = await supabase
          .from('auth.users')
          .select('*', { count: 'exact', head: true });
        
        const duration = Date.now() - authStart;
        
        if (authError) throw authError;
        
        result.queries.authUsers = {
          success: true,
          duration,
          rowCount: count,
          hasAccess: true
        };
        
        logger.info('Auth users access successful', {
          testId: TEST_ID,
          clientType,
          duration: `${duration}ms`,
          rowCount: count
        });
        
      } catch (error) {
        const duration = Date.now() - authStart;
        const errorInfo = {
          query: 'auth_users',
          error: error.message,
          code: error.code,
          duration,
          hasAccess: false
        };
        
        result.queries.authUsers = {
          success: false,
          ...errorInfo
        };
        result.errors.push(errorInfo);
        
        logger.warn('Auth users access failed (may be expected for non-admin clients)', {
          testId: TEST_ID,
          clientType,
          ...errorInfo
        });
      }
    }
    
    // 3. Test public schema tables access
    const tablesStart = Date.now();
    try {
      const { data: tables, error: tablesError } = await supabase
        .rpc('get_tables')
        .select('*')
        .limit(100);
      
      const duration = Date.now() - tablesStart;
      
      if (tablesError) throw tablesError;
      
      const tableData = Array.isArray(tables) ? tables : [];
      
      result.queries.tables = {
        success: true,
        duration,
        tableCount: tableData.length,
        tables: tableData.slice(0, 10).map(t => ({
          name: t.table_name,
          schema: t.table_schema,
          type: t.table_type
        })),
        sampleTables: tableData.slice(0, 5).map(t => t.table_name)
      };
      
      logger.info('Database tables query successful', {
        testId: TEST_ID,
        clientType,
        duration: `${duration}ms`,
        tableCount: tableData.length,
        sampleTables: tableData.slice(0, 5).map(t => t.table_name)
      });
      
    } catch (error) {
      const duration = Date.now() - tablesStart;
      const errorInfo = {
        query: 'tables',
        error: error.message,
        code: error.code,
        duration
      };
      
      result.queries.tables = {
        success: false,
        ...errorInfo
      };
      result.errors.push(errorInfo);
      
      logger.error('Database tables query failed', {
        testId: TEST_ID,
        clientType,
        ...errorInfo
      });
    }
    
    // 4. Test a simple SELECT query on a common table if available
    if (result.queries.tables?.success && result.queries.tables.tables.length > 0) {
      const testTable = result.queries.tables.tables.find(t => 
        t.schema === 'public' && 
        !t.name.startsWith('pg_') && 
        !t.name.startsWith('sql_')
      );
      
      if (testTable) {
        const testQueryStart = Date.now();
        try {
          const { data, error, count } = await supabase
            .from(testTable.name)
            .select('*', { count: 'exact', head: true })
            .limit(1);
          
          const duration = Date.now() - testQueryStart;
          
          if (error) throw error;
          
          result.queries.testQuery = {
            success: true,
            duration,
            table: testTable.name,
            rowCount: count || 0,
            hasData: (data && data.length > 0) || (count && count > 0)
          };
          
          logger.info(`Test query on ${testTable.name} successful`, {
            testId: TEST_ID,
            clientType,
            duration: `${duration}ms`,
            table: testTable.name,
            rowCount: count
          });
          
        } catch (error) {
          const duration = Date.now() - testQueryStart;
          const errorInfo = {
            query: 'test_query',
            table: testTable.name,
            error: error.message,
            code: error.code,
            duration
          };
          
          result.queries.testQuery = {
            success: false,
            ...errorInfo
          };
          result.errors.push(errorInfo);
          
          logger.warn(`Test query on ${testTable.name} failed`, {
            testId: TEST_ID,
            clientType,
            ...errorInfo
          });
        }
      }
    }
    
    // Determine overall success
    const criticalFailures = result.errors.some(e => 
      e.query === 'version' || 
      (clientType === 'admin' && e.query === 'auth_users')
    );
    
    result.success = !criticalFailures && 
                    result.queries.version?.success && 
                    (clientType !== 'admin' || result.queries.authUsers?.success);
    
    result.duration = Date.now() - startTime;
    result.endTime = new Date().toISOString();
    
    if (result.success) {
      logger.info(`Database connection test for ${clientType} client completed successfully`, {
        testId: TEST_ID,
        clientType,
        duration: `${result.duration}ms`,
        queries: Object.keys(result.queries).filter(k => result.queries[k]?.success)
      });
    } else {
      logger.error(`Database connection test for ${clientType} client completed with errors`, {
        testId: TEST_ID,
        clientType,
        duration: `${result.duration}ms`,
        success: false,
        errors: result.errors.map(e => ({
          query: e.query,
          error: e.error,
          code: e.code
        }))
      });
    }
    
    return result;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorInfo = {
      testId: TEST_ID,
      clientType,
      error: error.message,
      code: error.code,
      duration,
      stack: error.stack
    };
    
    logger.error(`Database connection test for ${clientType} client failed`, errorInfo);
    
    return {
      ...result,
      success: false,
      error: error.message,
      code: error.code,
      duration,
      errors: [
        ...(result.errors || []), 
        { 
          query: 'connection', 
          error: error.message, 
          code: error.code 
        }
      ]
    };
  }
};

// Main test function
const runTests = async () => {
  const testStartTime = Date.now();
  const results = {
    testId: TEST_ID,
    startTime: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    nodeEnv: process.env.NODE_ENV,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    cpus: require('os').cpus().length,
    memory: {
      total: require('os').totalmem(),
      free: require('os').freemem(),
      unit: 'bytes'
    },
    gitInfo: getGitInfo(),
    hostname: process.env.HOSTNAME || require('os').hostname(),
    tests: {},
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      criticalFailures: 0
    }
  };
  
  // Track test sequence and timing
  const testSequence = [];
  const startTest = (name) => {
    const test = {
      name,
      startTime: Date.now(),
      status: 'running'
    };
    testSequence.push(test);
    logger.info(`=== Starting test: ${name} ===`, { testId: TEST_ID });
    return test;
  };
  
  const endTest = (test, result) => {
    const duration = Date.now() - test.startTime;
    test.duration = duration;
    test.status = result.success ? 'passed' : 'failed';
    test.result = result;
    
    results.summary.total++;
    if (test.status === 'passed') {
      results.summary.passed++;
    } else {
      results.summary.failed++;
      if (result.isCritical !== false) {
        results.summary.criticalFailures++;
      }
    }
    
    logger.info(`=== Completed test: ${test.name} (${duration}ms) - ${test.status.toUpperCase()} ===`, {
      testId: TEST_ID,
      name: test.name,
      status: test.status,
      duration,
      success: result.success,
      isCritical: result.isCritical !== false
    });
    
    return test;
  };
  
  try {
    logger.info('🚀 Starting Supabase connection tests', { 
      testId: TEST_ID,
      startTime: results.startTime,
      environment: results.environment,
      nodeVersion: results.nodeVersion,
      platform: results.platform,
      arch: results.arch
    });
    
    // Validate environment variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
    const hasAdminAccess = !!supabaseServiceKey;
    
    // Check for required environment variables
    const missingVars = [];
    if (!supabaseUrl) missingVars.push('SUPABASE_URL');
    if (!supabaseAnonKey && !supabaseServiceKey) {
      missingVars.push('SUPABASE_ANON_KEY or SUPABASE_SERVICE_KEY');
    }
    
    if (missingVars.length > 0) {
      const error = new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
      logger.error('Missing required environment variables', {
        testId: TEST_ID,
        missing: missingVars,
        hasAnonKey: !!supabaseAnonKey,
        hasServiceKey: hasAdminAccess,
        environment: process.env.NODE_ENV || 'development'
      });
      throw error;
    }
    
    // Extract hostname and port from URL
    let hostname, port, protocol;
    try {
      const url = new URL(supabaseUrl);
      hostname = url.hostname;
      port = url.port || (url.protocol === 'https:' ? 443 : 80);
      protocol = url.protocol.replace(':', '');
      
      logger.debug('Parsed Supabase URL', {
        testId: TEST_ID,
        url: supabaseUrl,
        hostname,
        port,
        protocol
      });
      
    } catch (error) {
      logger.error('Invalid SUPABASE_URL', {
        testId: TEST_ID,
        url: supabaseUrl,
        error: error.message,
        code: error.code
      });
      throw new Error(`Invalid SUPABASE_URL: ${error.message}`);
    }
    
    // 1. Test DNS resolution
    const dnsTest = startTest('DNS Resolution');
    try {
      const dnsResult = await testDnsResolution(hostname);
      results.tests.dnsResolution = dnsResult;
      endTest(dnsTest, dnsResult);
      
      if (!dnsResult.success) {
        logger.warn('DNS resolution had issues, some tests may fail', {
          testId: TEST_ID,
          errors: dnsResult.errors
        });
      }
    } catch (error) {
      const errorResult = {
        success: false,
        error: error.message,
        code: error.code,
        isCritical: true
      };
      results.tests.dnsResolution = errorResult;
      endTest(dnsTest, errorResult);
      throw error; // Critical failure
    }
    
    if (!dnsResult.success) {
      throw new Error(`DNS resolution failed: ${dnsResult.error}`);
    }
    
    // 2. Test TCP connection (default port 443 for HTTPS)
    logger.info('=== Starting TCP connection test ===', { testId: TEST_ID });
    const tcpResult = await testTcpConnection(hostname, 443);
    results.tests.tcpConnection = tcpResult;
    
    if (!tcpResult.success) {
      throw new Error(`TCP connection failed: ${tcpResult.error}`);
    }
    
    // 3. Create Supabase client with retry logic
    logger.info('=== Initializing Supabase client ===', { testId: TEST_ID });
    const supabase = createSupabaseClient(supabaseUrl, supabaseKey, {
      maxRetries: MAX_RETRIES,
      retryDelay: RETRY_DELAY_MS
    });
    
    // 4. Test database connection and queries
    logger.info('=== Starting database connection test ===', { testId: TEST_ID });
    const dbResult = await testDatabaseConnection(supabase);
    results.tests.databaseConnection = dbResult;
    
    if (!dbResult.success) {
      throw new Error(`Database connection failed: ${dbResult.error}`);
    }
    
    // Calculate total duration
    const totalDuration = Date.now() - testStartTime;
    results.endTime = new Date().toISOString();
    results.duration = totalDuration;
    results.success = true;
    
    logger.info('✅ All tests completed successfully', {
      testId: TEST_ID,
      duration: `${totalDuration}ms`,
      results: {
        dnsResolution: dnsResult.success,
        tcpConnection: tcpResult.success,
        databaseConnection: dbResult.success,
        version: dbResult.version,
        tableCount: dbResult.tableCount
      }
    });
    
    // Create success marker file
    await createMarkerFile(true, {
      ...results,
      tests: {
        dnsResolution: dnsResult.success,
        tcpConnection: tcpResult.success,
        databaseConnection: dbResult.success
      },
      metadata: {
        version: dbResult.version,
        tableCount: dbResult.tableCount,
        hasAuthAccess: dbResult.hasAuthAccess
      }
    });
    
    return results;
    
  } catch (error) {
    const totalDuration = Date.now() - testStartTime;
    results.endTime = new Date().toISOString();
    results.duration = totalDuration;
    results.success = false;
    results.error = {
      message: error.message,
      code: error.code,
      stack: error.stack
    };
    
    logger.error('❌ Tests failed', {
      testId: TEST_ID,
      error: error.message,
      code: error.code,
      duration: `${totalDuration}ms`,
      stack: error.stack
    });
    
    // Create error marker file
    await createMarkerFile(false, {
      ...results,
      error: {
        message: error.message,
        code: error.code
      }
    });
    
    process.exit(1);
  }
};

// Run the tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      const results = await runTests();
      const duration = new Date() - new Date(results.startTime);
      
      // Calculate test duration
      results.duration = duration;
      results.endTime = new Date().toISOString();
      
      // Create a summary of test results
      const testResults = Object.values(results.tests || {});
      const passedTests = testResults.filter(t => t?.success);
      const failedTests = testResults.filter(t => t && !t.success);
      
      const summary = {
        testId: TEST_ID,
        total: testResults.length,
        passed: passedTests.length,
        failed: failedTests.length,
        success: failedTests.length === 0,
        duration: `${duration}ms`,
        startTime: results.startTime,
        endTime: results.endTime,
        environment: results.environment,
        hostname: results.hostname
      };
      
      // Log the final summary
      if (summary.success) {
        logger.info('✅ All tests completed successfully', summary);
      } else {
        logger.error(`❌ ${summary.failed} test(s) failed`, summary);
      }
      
      // Create a marker file with the test results
      const markerFile = await createMarkerFile(summary.success, {
        ...summary,
        tests: results.tests,
        gitInfo: results.gitInfo,
        environment: process.env
      });
      
      // Exit with appropriate status code
      process.exit(summary.success ? 0 : 1);
      
    } catch (error) {
      logger.error('❌ Unhandled error in test execution', {
        testId: TEST_ID,
        error: error.message,
        code: error.code,
        stack: error.stack,
        duration: `${Date.now() - new Date(TEST_ID.split('_')[1] || Date.now())}ms`
      });
      
      // Create an error marker file
      await createMarkerFile(false, {
        testId: TEST_ID,
        error: error.message,
        code: error.code,
        stack: error.stack,
        environment: process.env.NODE_ENV,
        gitInfo: getGitInfo(),
        timestamp: new Date().toISOString()
      });
      
      process.exit(1);
    }
  })();
}

// Export the test functions for programmatic use
export { 
  runTests, 
  testDnsResolution, 
  testTcpConnection, 
  testDatabaseConnection, 
  createSupabaseClient,
  createMarkerFile,
  getGitInfo
};
