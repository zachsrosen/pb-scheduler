/**
 * PB Scheduler - Backend Server
 * Connects to HubSpot API and serves the scheduler frontend
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const session = require('express-session');
const path = require('path');

const hubspotRoutes = require('./routes/hubspot');
const schedulesRoutes = require('./routes/schedules');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000 }
}));

// Initialize database
db.initialize();

// API Routes
app.use('/api/hubspot', hubspotRoutes);
app.use('/api/schedules', schedulesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║          ⚡ PB SCHEDULER SERVER RUNNING ⚡                 ║
╠═══════════════════════════════════════════════════════════╣
║  Local:    http://localhost:${PORT}                          ║
║  API:      http://localhost:${PORT}/api                      ║
║  HubSpot:  ${process.env.HUBSPOT_ACCESS_TOKEN ? '✅ Connected' : '❌ Missing token'}                              ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
