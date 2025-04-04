// Set production environment for Vercel
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Import the Express app
import app from '../src/server';

console.log(`API running in ${process.env.NODE_ENV} mode`);

// Export the Express app for Vercel
export default app;
