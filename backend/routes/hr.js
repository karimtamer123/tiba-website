const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { authenticateHRToken } = require('../middleware/auth');

// HR login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find HR user
    const [users] = await pool.execute(
      'SELECT * FROM hr_users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username,
        role: 'hr'
      },
      process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: 'hr'
      }
    });
  } catch (error) {
    console.error('Error during HR login:', error);
    res.status(500).json({ error: 'Error during login' });
  }
});

// Verify HR token
router.get('/verify', authenticateHRToken, async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT id, username FROM hr_users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'HR user not found' });
    }

    res.json({
      user: {
        id: users[0].id,
        username: users[0].username,
        role: 'hr'
      }
    });
  } catch (error) {
    console.error('Error verifying HR token:', error);
    res.status(500).json({ error: 'Error verifying token' });
  }
});

// Create HR user (for initial setup - should be protected in production)
router.post('/create-hr', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Check if user already exists
    const [existing] = await pool.execute(
      'SELECT id FROM hr_users WHERE username = ?',
      [username]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'HR user already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create HR user
    const [result] = await pool.execute(
      'INSERT INTO hr_users (username, password) VALUES (?, ?)',
      [username, hashedPassword]
    );

    res.json({
      message: 'HR user created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating HR user:', error);
    res.status(500).json({ error: 'Error creating HR user' });
  }
});

module.exports = router;

