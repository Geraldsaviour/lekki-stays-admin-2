require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { performanceMonitor, getMetrics, getHealthStatus } = require('./middleware/performance');

const app = express();
const PORT = process.env.PORT || 3000;

// Performance monitoring middleware (should be first)
app.use(performanceMonitor);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// STATIC FILE ROUTES - MUST BE FIRST!
// Explicit routes for CSS files
app.get('/styles.css', (req, res) => {
  console.log('Serving styles.css');
  res.setHeader('Content-Type', 'text/css');
  const serverPath = path.join(__dirname, 'styles.css');
  const rootPath = path.join(__dirname, '..', 'styles.css');
  
  if (fs.existsSync(serverPath)) {
    res.sendFile(serverPath);
  } else if (fs.existsSync(rootPath)) {
    res.sendFile(rootPath);
  } else {
    res.status(404).send('File not found');
  }
});

app.get('/listing-detail.css', (req, res) => {
  console.log('Serving listing-detail.css');
  res.setHeader('Content-Type', 'text/css');
  // Try server directory first, then root
  const serverPath = path.join(__dirname, 'listing-detail.css');
  const rootPath = path.join(__dirname, '..', 'listing-detail.css');
  
  if (fs.existsSync(serverPath)) {
    res.sendFile(serverPath);
  } else if (fs.existsSync(rootPath)) {
    res.sendFile(rootPath);
  } else {
    res.status(404).send('File not found');
  }
});

app.get('/booking.css', (req, res) => {
  console.log('Serving booking.css');
  res.setHeader('Content-Type', 'text/css');
  const serverPath = path.join(__dirname, 'booking.css');
  const rootPath = path.join(__dirname, '..', 'booking.css');
  
  if (fs.existsSync(serverPath)) {
    res.sendFile(serverPath);
  } else if (fs.existsSync(rootPath)) {
    res.sendFile(rootPath);
  } else {
    res.status(404).send('File not found');
  }
});

app.get('/search-results.css', (req, res) => {
  console.log('Serving search-results.css');
  res.setHeader('Content-Type', 'text/css');
  const serverPath = path.join(__dirname, 'search-results.css');
  const rootPath = path.join(__dirname, '..', 'search-results.css');
  
  if (fs.existsSync(serverPath)) {
    res.sendFile(serverPath);
  } else if (fs.existsSync(rootPath)) {
    res.sendFile(rootPath);
  } else {
    res.status(404).send('File not found');
  }
});

// Explicit routes for JS files
app.get('/script.js', (req, res) => {
  console.log('Serving script.js');
  res.setHeader('Content-Type', 'application/javascript');
  const serverPath = path.join(__dirname, 'script.js');
  const rootPath = path.join(__dirname, '..', 'script.js');
  
  if (fs.existsSync(serverPath)) {
    res.sendFile(serverPath);
  } else if (fs.existsSync(rootPath)) {
    res.sendFile(rootPath);
  } else {
    res.status(404).send('File not found');
  }
});

app.get('/listing-detail.js', (req, res) => {
  console.log('Serving listing-detail.js');
  res.setHeader('Content-Type', 'application/javascript');
  // Try server directory first, then root
  const serverPath = path.join(__dirname, 'listing-detail.js');
  const rootPath = path.join(__dirname, '..', 'listing-detail.js');
  
  if (fs.existsSync(serverPath)) {
    res.sendFile(serverPath);
  } else if (fs.existsSync(rootPath)) {
    res.sendFile(rootPath);
  } else {
    res.status(404).send('File not found');
  }
});

app.get('/booking.js', (req, res) => {
  console.log('Serving booking.js');
  res.setHeader('Content-Type', 'application/javascript');
  const serverPath = path.join(__dirname, 'booking.js');
  const rootPath = path.join(__dirname, '..', 'booking.js');
  
  if (fs.existsSync(serverPath)) {
    res.sendFile(serverPath);
  } else if (fs.existsSync(rootPath)) {
    res.sendFile(rootPath);
  } else {
    res.status(404).send('File not found');
  }
});

app.get('/search-results.js', (req, res) => {
  console.log('Serving search-results.js');
  res.setHeader('Content-Type', 'application/javascript');
  const serverPath = path.join(__dirname, 'search-results.js');
  const rootPath = path.join(__dirname, '..', 'search-results.js');
  
  if (fs.existsSync(serverPath)) {
    res.sendFile(serverPath);
  } else if (fs.existsSync(rootPath)) {
    res.sendFile(rootPath);
  } else {
    res.status(404).send('File not found');
  }
});

app.get('/api-client.js', (req, res) => {
  console.log('Serving api-client.js');
  res.setHeader('Content-Type', 'application/javascript');
  // Try server directory first, then root
  const serverPath = path.join(__dirname, 'api-client.js');
  const rootPath = path.join(__dirname, '..', 'api-client.js');
  
  if (fs.existsSync(serverPath)) {
    res.sendFile(serverPath);
  } else if (fs.existsSync(rootPath)) {
    res.sendFile(rootPath);
  } else {
    res.status(404).send('File not found');
  }
});

// Serve shared/api-client.js
app.get('/shared/api-client.js', (req, res) => {
  console.log('Serving shared/api-client.js');
  res.setHeader('Content-Type', 'application/javascript');
  // Try multiple locations
  const serverSharedPath = path.join(__dirname, 'shared', 'api-client.js');
  const publicSharedPath = path.join(__dirname, '..', 'public', 'shared', 'api-client.js');
  const serverPath = path.join(__dirname, 'api-client.js');
  const rootPath = path.join(__dirname, '..', 'api-client.js');
  
  if (fs.existsSync(serverSharedPath)) {
    res.sendFile(serverSharedPath);
  } else if (fs.existsSync(publicSharedPath)) {
    res.sendFile(publicSharedPath);
  } else if (fs.existsSync(serverPath)) {
    res.sendFile(serverPath);
  } else if (fs.existsSync(rootPath)) {
    res.sendFile(rootPath);
  } else {
    res.status(404).send('File not found');
  }
});

// Test file
app.get('/test.txt', (req, res) => {
  console.log('Serving test.txt');
  res.setHeader('Content-Type', 'text/plain');
  res.sendFile(path.join(__dirname, 'test.txt'));
});

// Serve static files from server directory (where they actually exist in Vercel)
app.use(express.static(__dirname));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${req.get('Accept')}`);
  next();
});

// Explicit routes for main static files
// API Routes - Now using Supabase!
app.use('/api/apartments', require('./routes/apartments-supabase'));
app.use('/api/bookings', require('./routes/bookings-supabase'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/payments', require('./routes/payments'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Debug endpoint to check static files
app.get('/api/debug/files', (req, res) => {
  const staticFiles = [
    'styles.css',
    'listing-detail.css', 
    'booking.css',
    'search-results.css',
    'script.js',
    'listing-detail.js',
    'booking.js',
    'search-results.js',
    'api-client.js',
    'test.txt'
  ];
  
  // Check in server directory where files should now be
  const fileStatus = staticFiles.map(file => ({
    file,
    serverPath: path.join(__dirname, file),
    exists: fs.existsSync(path.join(__dirname, file))
  }));
  
  // Also list all files in server directory
  let allFiles = [];
  try {
    allFiles = fs.readdirSync(__dirname);
  } catch (e) {
    allFiles = ['Error reading directory: ' + e.message];
  }
  
  res.json({
    staticFiles: fileStatus,
    serverDir: __dirname,
    allFilesInServerDir: allFiles,
    message: "Files should now be in server directory"
  });
});

// Performance metrics endpoint
app.get('/api/metrics', (req, res) => {
  const metrics = getMetrics();
  res.json({
    success: true,
    metrics: metrics,
    timestamp: new Date().toISOString()
  });
});

// Performance health endpoint
app.get('/api/health/performance', (req, res) => {
  const health = getHealthStatus();
  const statusCode = health.status === 'healthy' ? 200 : 
                    health.status === 'degraded' ? 200 : 503;
  
  res.status(statusCode).json({
    success: true,
    health: health,
    timestamp: new Date().toISOString()
  });
});

// Serve index.html for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Catch-all route for HTML files - MUST be before 404 handler
app.get('*.html', (req, res) => {
  const filename = req.path.substring(1); // Remove leading /
  const filePath = path.join(__dirname, '..', filename);
  
  console.log(`Attempting to serve HTML: ${filename} from ${filePath}`);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'Page not found' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server (Firebase doesn't need initialization)
app.listen(PORT, () => {
  console.log(`🏨 Lekki Stays server running on port ${PORT}`);
  console.log(`🌐 Visit: http://localhost:${PORT}`);
  console.log(`📱 WhatsApp: ${process.env.HOST_WHATSAPP_NUMBER}`);
  console.log(`🔥 Using Firebase Firestore`);
});

module.exports = app;