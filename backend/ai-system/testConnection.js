const testConnection = async () => {
  const startTime = Date.now();
  const testId = `test-${Date.now()}`;
  
  const result = {
    success: false,
    testId,
    details: {
      startTime: new Date(startTime).toISOString(),
      tests: {}
    }
  };

  try {
    // 1. Parse and validate SUPABASE_URL
    let supabaseHostname;
    try {
      const url = new URL(SUPABASE_URL);
      supabaseHostname = url.hostname;
      logger.debug('Successfully parsed SUPABASE_URL', { testId, url: SUPABASE_URL, hostname: supabaseHostname });
    } catch (error) {
      const errorMsg = `Invalid SUPABASE_URL: ${error.message}`;
      logger.error(errorMsg, { testId, url: SUPABASE_URL, error: error.message });
      return { 
        success: false, 
        error: errorMsg,
        details: result.details
      };
    }

    // 2. Test DNS resolution
    try {
      logger.debug('Testing DNS resolution', { testId, hostname: supabaseHostname });
      const addresses = await dns.resolve4(supabaseHostname);
      result.details.dns = { 
        status: 'success', 
        addresses,
        resolvedAt: new Date().toISOString()
      };
      logger.info('DNS resolution successful', { 
        testId, 
        hostname: supabaseHostname,
        addresses
      });
    } catch (error) {
      const errorMsg = `DNS resolution failed: ${error.message}`;
      result.details.dns = { 
        status: 'failed', 
        error: error.message,
        code: error.code,
        failedAt: new Date().toISOString()
      };
      
      logger.error(errorMsg, { 
        testId,
        hostname: supabaseHostname,
        error: error.message,
        code: error.code
      });
      
      return { 
        success: false, 
        error: errorMsg,
        details: result.details
      };
    }

    // 3. Test TCP connection
    try {
      logger.debug('Testing TCP connection', { 
        testId, 
        host: supabaseHostname,
        port: 443,
        timeout: 5000 
      });
      
      await new Promise((resolve, reject) => {
        const socket = net.createConnection({ 
          host: supabaseHostname, 
          port: 443, 
          timeout: 5000 
        });
        
        const connectStart = Date.now();
        
        socket.on('connect', () => {
          const latency = Date.now() - connectStart;
          result.details.tcp = { 
            status: 'success',
            latency: `${latency}ms`,
            connectedAt: new Date().toISOString()
          };
          logger.info('TCP connection successful', {
            testId,
            host: supabaseHostname,
            port: 443,
            latency: `${latency}ms`
          });
          socket.destroy();
          resolve();
        });
        
        socket.on('error', (error) => {
          const errorMsg = `TCP connection failed: ${error.message}`;
          result.details.tcp = { 
            status: 'failed', 
            error: error.message, 
            code: error.code,
            failedAt: new Date().toISOString()
          };
          logger.error(errorMsg, {
            testId,
            host: supabaseHostname,
            port: 443,
            error: error.message,
            code: error.code
          });
          socket.destroy();
          reject(new Error(errorMsg));
        });
        
        socket.on('timeout', () => {
          const errorMsg = 'TCP connection timed out';
          result.details.tcp = { 
            status: 'timeout',
            timeout: 5000,
            failedAt: new Date().toISOString()
          };
          logger.error(errorMsg, {
            testId,
            host: supabaseHostname,
            port: 443,
            timeout: 5000
          });
          socket.destroy();
          reject(new Error(errorMsg));
        });
      });
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        code: error.code,
        details: result.details
      };
    }

    // 4. Test database connection with a simple query
    try {
      logger.debug('Testing database connection with a simple query', { testId });
      
      // Use a direct query to test the connection
      const { data, error } = await supabase
        .rpc('execute_sql', { query: 'SELECT 1 as test_value' });
      
      if (error) throw error;
      
      logger.debug('Database connection test successful', { 
        testId, 
        result: data 
      });
      
      result.success = true;
      result.details.query = { 
        status: 'success',
        result: data,
        executedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Database connection test failed', {
        testId,
        error: error.message,
        code: error.code,
        details: error.details || error.hint || ''
      });
      
      result.success = false;
      result.error = `Database query failed: ${error.message}`;
      result.details.query = {
        status: 'failed',
        error: error.message,
        code: error.code,
        failedAt: new Date().toISOString()
      };
    }
    
    result.details.duration = `${Date.now() - startTime}ms`;
    return result;
  } catch (error) {
    logger.error('Unexpected error in testConnection', {
      testId,
      error: error.message,
      stack: error.stack
    });
    
    return {
      success: false,
      error: `Unexpected error: ${error.message}`,
      details: result.details,
      stack: isDevelopment ? error.stack : undefined
    };
  }
};

export default testConnection;
