/**
 * Lekki Stays / LuxStay Backend Server (Supabase)
 * 
 * Express server with Supabase PostgreSQL database
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { testConnection } = require('./supabase-client');
const { performanceMonitor, getMetrics, getHealthStatus } = require('./middleware/performance');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================================
// MIDDLEWARE
// ============================================================================

// Performance monitoring (should be first)
app.use(performanceMonitor);

// CORS
app.use(cors());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// ============================================================================
// STATIC FILE ROUTES (Keep existing dual-location strategy for Vercel)
// ============================================================================

// Helper function to serve static files from both locations
function serveStaticFile(filename, contentType) {
  return (req, res) => {
    console.log(`Serving ${filename}`);
    res.setHeader('Content-Type', contentType);
    
    const serverPath = path.join(__dirname, filename);
    const rootPath = path.join(__dirname, '..', filename);
    
    if (fs.existsSync(serverPath)) {
      res.sendFile(serverPath);
    } else if (fs.existsSync(rootPath)) {
      res.sendFile(rootPath);
    } else {
      res.status(404).send('File not found');
    }
  };
}

// CSS files
app.get('/styles.css', serveStaticFile('styles.css', 'text/css'));
app.get('/listing-detail.css', serveStaticFile('listing-detail.css', 'text/css'));
app.get('/booking.css', serveStaticFile('booking.css', 'text/css'));
app.get('/search-results.css', serveStaticFile('search-results.css', 'text/css'));

// JavaScript files
app.get('/script.js', serveStaticFile('script.js', 'application/javascript'));
app.get('/listing-detail.js', serveStaticFile('listing-detail.js', 'application/javascript'));
app.get('/booking.js', serveStaticFile('booking.js', 'application/javascript'));
app.get('/search-results.js', serveStaticFile('search-results.js', 'application/javascript'));
app.get('/api-client.js', serveStaticFile('api-client.js', 'application/javascript'));

// Serve static files from server directory
app.use(express.static(__dirname));

// ============================================================================
// API ROUTES (New Supabase routes)
// ============================================================================

app.use('/api/apartments', require('./routes-supabase/apartments'));
app.use('/api/bookings', require('./routes-supabase/bookings'));
app.use('/api/availability', require('./routes-supabase/availability'));

// ============================================================================
// HEALTH CHECK & MONITORING
// ============================================================================

app.get('/api/health', async (req, res) => {
  const dbConnected = await testConnection();
  
  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? 'OK' : 'DEGRADED',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0-supabase'
  });
});

app.get('/api/metrics', (req, res) => {
  const metrics = getMetrics();
  res.json({
    success: true,
    metrics,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health/performance', (req, res) => {
  const health = getHealthStatus();
  const statusCode = health.status === 'healthy' ? 200 : 
                    health.status === 'degraded' ? 200 : 503;
  
  res.status(statusCode).json({
    success: true,
    health,
    timestamp: new Date().toISOString()
  });
});

// ============================================================================
// HTML FILE SERVING
// ============================================================================

// Serve index.html for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Catch-all route for HTML files
app.get('*.html', (req, res) => {
  const filename = req.path.substring(1);
  const filePath = path.join(__dirname, '..', filename);
  
  console.log(`Attempting to serve HTML: ${filename}`);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'Page not found' });
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    path: req.path
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

async function startServer() {
  try {
    // Test Supabase connection
    console.log('🔌 Testing Supabase connection...');
    const connected = await testConnection();
    
    if (!connected) {
      console.warn('⚠️  Supabase connection failed. Server will start but database operations may fail.');
    }
    
    // Start Express server
    app.listen(PORT, () => {
      console.log('');
      console.log('🏨 ═══════════════════════════════════════════════════════');
      console.log('🏨  Lekki Stays / LuxStay Backend Server');
      console.log('🏨 ═══════════════════════════════════════════════════════');
      console.log(`🌐  Server running on port ${PORT}`);
      console.log(`🔗  Local: http://localhost:${PORT}`);
      console.log(`📱  WhatsApp: ${process.env.HOST_WHATSAPP_NUMBER || 'Not configured'}`);
      console.log(`🗄️   Database: Supabase (PostgreSQL)`);
      console.log(`🔐  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('🏨 ═══════════════════════════════════════════════════════');
      console.log('');
      
      if (!connected) {
        console.log('⚠️  WARNING: Database connection failed!');
        console.log('   Check your SUPABASE_URL and SUPABASE_ANON_KEY in .env');
        console.log('');
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
