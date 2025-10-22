// API Configuration with Robust Environment Detection
const isLocalDevelopment = () => {
  const hostname = window.location.hostname;
  return hostname === 'localhost' || 
         hostname === '127.0.0.1' || 
         hostname.includes('localhost') ||
         window.location.port === '5173' ||
         window.location.port === '3000';
};

const config = {
  // Robust environment detection
  API_BASE_URL: isLocalDevelopment()
    ? 'http://localhost:5001'  // Local development
    : 'https://autism-fzil.onrender.com', // Production deployed backend
  
  // Multiple fallback URLs for maximum reliability
  FALLBACK_URLS: [
    'https://autism-fzil.onrender.com',
    'https://autism-fzil.onrender.com', // Try same URL twice (Render cold starts)
  ],
  
  // API endpoints
  ENDPOINTS: {
    ANALYZE: '/api/analyze',
    HEALTH: '/health',
    SCREENINGS: '/api/screenings'
  }
};

// Enhanced debug logging
console.log(`🔧 Environment Detection (Enhanced):
📍 Current hostname: ${window.location.hostname}
🔗 Full URL: ${window.location.href}
🌐 API Base URL: ${config.API_BASE_URL}
🔄 Fallback URLs: ${config.FALLBACK_URLS.join(', ')}
🏠 Is Local Dev: ${isLocalDevelopment()}`);

export default config;