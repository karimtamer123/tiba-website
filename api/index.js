const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Load environment variables - try both root and backend directory
const backendEnvPath = path.join(__dirname, '..', 'backend', '.env');
const rootEnvPath = path.join(__dirname, '..', '.env');

if (fs.existsSync(backendEnvPath)) {
  require('dotenv').config({ path: backendEnvPath });
} else if (fs.existsSync(rootEnvPath)) {
  require('dotenv').config({ path: rootEnvPath });
} else {
  require('dotenv').config();
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files statically (if they exist)
const uploadsPath = path.join(__dirname, '..', 'backend', 'uploads');
if (fs.existsSync(uploadsPath)) {
  app.use('/uploads', express.static(uploadsPath));
}

// Import routes
const adminRoutes = require(path.join(__dirname, '..', 'backend', 'routes', 'admin'));
const hrRoutes = require(path.join(__dirname, '..', 'backend', 'routes', 'hr'));
const applicationsRoutes = require(path.join(__dirname, '..', 'backend', 'routes', 'applications'));
const slideshowRoutes = require(path.join(__dirname, '..', 'backend', 'routes', 'slideshow'));
const statisticsRoutes = require(path.join(__dirname, '..', 'backend', 'routes', 'statistics'));
const projectsRoutes = require(path.join(__dirname, '..', 'backend', 'routes', 'projects'));
const productsRoutes = require(path.join(__dirname, '..', 'backend', 'routes', 'products'));
const newsRoutes = require(path.join(__dirname, '..', 'backend', 'routes', 'news'));
const diagnosticsRoutes = require(path.join(__dirname, '..', 'backend', 'routes', 'diagnostics'));
const fixPathsRoutes = require(path.join(__dirname, '..', 'backend', 'routes', 'fix-paths'));

// Mount routes
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/hr', hrRoutes);
app.use('/api/v1/applications', applicationsRoutes);
app.use('/api/v1/slideshow', slideshowRoutes);
app.use('/api/v1/statistics', statisticsRoutes);
app.use('/api/v1/projects', projectsRoutes);
app.use('/api/v1/products', productsRoutes);
app.use('/api/v1/news', newsRoutes);
app.use('/api/v1/diagnostics', diagnosticsRoutes);
app.use('/api/v1/fix-paths', fixPathsRoutes);

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// Export for Vercel serverless
module.exports = app;

