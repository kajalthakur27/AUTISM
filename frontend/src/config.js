// API Configuration
const config = {
  // For local development with photo-only analysis feature:
  API_BASE_URL: 'http://localhost:5001',
  
  // Production backend URL (deployed on Render) - uncomment for production:
  // API_BASE_URL: 'https://autism-fzil.onrender.com',
  
  // Fallback to local backend if deployed backend is unavailable
  FALLBACK_API_BASE_URL: 'http://localhost:5001',
  
  // API endpoints
  ENDPOINTS: {
    ANALYZE: '/api/analyze',
    HEALTH: '/health',
    SCREENINGS: '/api/screenings'
  }
};

export default config;