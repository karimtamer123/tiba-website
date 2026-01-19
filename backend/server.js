const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Load environment variables from backend/.env
const envPath = path.join(__dirname, '.env');
require('dotenv').config({ path: envPath });

// Debug logging for environment variables (safe - no secrets)
console.log('=== Environment Variables Check ===');
console.log(`DB_HOST: ${process.env.DB_HOST ? '✓ defined' : '✗ missing'}`);
console.log(`DB_USER: ${process.env.DB_USER ? '✓ defined' : '✗ missing'}`);
console.log(`DB_NAME: ${process.env.DB_NAME ? '✓ defined' : '✗ missing'}`);
console.log(`DB_PASSWORD: ${process.env.DB_PASSWORD ? '✓ defined' : '✗ missing'}`);
console.log(`JWT_SECRET: ${process.env.JWT_SECRET ? '✓ defined' : '✗ missing'}`);

// Check if .env file exists
if (!fs.existsSync(envPath)) {
  console.error(`\n⚠️  WARNING: .env file not found at ${envPath}`);
  console.error('Please create a .env file in the backend/ directory with your database credentials.\n');
} else {
  console.log(`✓ .env file found at ${envPath}\n`);
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/v1/admin', require('./routes/admin'));
app.use('/api/v1/hr', require('./routes/hr'));
app.use('/api/v1/applications', require('./routes/applications'));
app.use('/api/v1/slideshow', require('./routes/slideshow'));
app.use('/api/v1/statistics', require('./routes/statistics'));
app.use('/api/v1/projects', require('./routes/projects'));
app.use('/api/v1/products', require('./routes/products'));
app.use('/api/v1/news', require('./routes/news'));
app.use('/api/v1/diagnostics', require('./routes/diagnostics'));
app.use('/api/v1/fix-paths', require('./routes/fix-paths'));

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

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;

