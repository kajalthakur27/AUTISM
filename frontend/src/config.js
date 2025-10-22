// API Configuration with Auto Environment Detection
const config = {
  // Auto-detect environment and use appropriate URL
  API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5001'  // Local development
    : 'https://autism-fzil.onrender.com', // Production deployed backend
  
  // Fallback URLs for better reliability
  FALLBACK_API_BASE_URL: 'https://autism-fzil.onrender.com',
  LOCAL_API_BASE_URL: 'http://localhost:5001',
  
  // API endpoints
  ENDPOINTS: {
    ANALYZE: '/api/analyze',
    HEALTH: '/health',
    SCREENINGS: '/api/screenings'
  }
};

// Debug logging for production troubleshooting
console.log(`🔧 Environment Detection:
📍 Current hostname: ${window.location.hostname}
🌐 API Base URL: ${config.API_BASE_URL}
🔄 Fallback URL: ${config.FALLBACK_API_BASE_URL}`);

export default config;