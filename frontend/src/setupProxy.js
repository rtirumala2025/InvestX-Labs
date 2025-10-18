const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: process.env.REACT_APP_API_URL || 'http://localhost:5000',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/api', // Remove /api prefix when forwarding to backend
      },
      onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(500).json({ 
          error: 'Proxy error',
          details: err.message 
        });
      },
    })
  );
};
