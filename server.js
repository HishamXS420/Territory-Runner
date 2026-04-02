require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

console.log('🚀 Starting Territory Runner Server...');
console.log('📝 Loading configuration...');

// MongoDB connection
const mongoConnection = require('./config/mongodb');

// Routes
const authRoutes = require('./routes/authRoutes');
const runRoutes = require('./routes/runRoutes');
const territoryRoutes = require('./routes/territoryRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

console.log('🔧 Configuring express middleware...');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

console.log('🛣️ Setting up API routes...');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/run', runRoutes);
app.use('/api/territory', territoryRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

// Page Routes (EJS templates)
// Middleware to check authentication
const checkAuth = (req, res, next) => {
  const token = req.cookies?.token || req.query?.token;
  if (!token) {
    return res.redirect('/login');
  }
  next();
};

// Login page
app.get('/login', (req, res) => {
  console.log('📄 Rendering login page');
  res.render('login');
});

// Signup page
app.get('/signup', (req, res) => {
  console.log('📄 Rendering signup page');
  res.render('signup');
});

// Home page (protected)
app.get('/', (req, res) => {
  console.log('📄 Rendering home page');
  res.render('home');
});

// Run page (protected)
app.get('/run', (req, res) => {
  console.log('📄 Rendering run page');
  res.render('run');
});

// Leaderboard page
app.get('/leaderboard', (req, res) => {
  console.log('📄 Rendering leaderboard page');
  res.render('leaderboard');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Application is running', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Request error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

// Global uncaught exception handler
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Start server
const server = app.listen(PORT, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log(`✅ Server is running on http://localhost:${PORT}`);
  console.log('🎯 API Ready:');
  console.log('   - /api/auth (register, login)');
  console.log('   - /api/run (start, coordinate, finish)');
  console.log('   - /api/territory (all, bounds, user)');
  console.log('   - /api/leaderboard (area, distance)');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
});

// Handle server shutdown gracefully
server.on('error', (err) => {
  console.error('❌ Server error:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`⚠️ Port ${PORT} is already in use!`);
    console.error('Try: taskkill /IM node.exe /F (Windows)');
  }
});
