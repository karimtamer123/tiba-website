const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const upload = require('../config/upload');
const { authenticateToken } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

// Get all news
router.get('/', async (req, res) => {
  try {
    const { featured } = req.query;
    let query = 'SELECT * FROM news WHERE 1=1';
    const params = [];

    if (featured === 'true') {
      query += ' AND is_featured = 1';
    }

    query += ' ORDER BY date DESC, created_at DESC';

    const [news] = await pool.execute(query, params);

    res.json(news);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Error fetching news' });
  }
});

// Get single news article
router.get('/:id', async (req, res) => {
  try {
    const [articles] = await pool.execute(
      'SELECT * FROM news WHERE id = ?',
      [req.params.id]
    );

    if (articles.length === 0) {
      return res.status(404).json({ error: 'News article not found' });
    }

    res.json(articles[0]);
  } catch (error) {
    console.error('Error fetching news article:', error);
    res.status(500).json({ error: 'Error fetching news article' });
  }
});

// Create new news article
router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { title, content, date, is_featured } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    let imagePath = null;
    if (req.file) {
      imagePath = `/uploads/news/${req.file.filename}`;
    }

    const [result] = await pool.execute(
      'INSERT INTO news (title, content, image_path, date, is_featured, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [title, content, imagePath, date || new Date().toISOString().split('T')[0], is_featured === 'true' ? 1 : 0]
    );

    res.json({
      id: result.insertId,
      message: 'News article created successfully'
    });
  } catch (error) {
    console.error('Error creating news article:', error);
    res.status(500).json({ error: 'Error creating news article' });
  }
});

// Update news article
router.put('/:id', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { title, content, date, is_featured } = req.body;
    const id = req.params.id;

    // Get current article
    const [articles] = await pool.execute(
      'SELECT image_path FROM news WHERE id = ?',
      [id]
    );

    if (articles.length === 0) {
      return res.status(404).json({ error: 'News article not found' });
    }

    const updateFields = [];
    const updateValues = [];

    if (title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(title);
    }
    if (content !== undefined) {
      updateFields.push('content = ?');
      updateValues.push(content);
    }
    if (date !== undefined) {
      updateFields.push('date = ?');
      updateValues.push(date);
    }
    if (is_featured !== undefined) {
      updateFields.push('is_featured = ?');
      updateValues.push(is_featured === 'true' ? 1 : 0);
    }

    // Handle image upload
    if (req.file) {
      // Delete old image if exists
      if (articles[0].image_path) {
        const oldImagePath = path.join(__dirname, '..', articles[0].image_path);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      const imagePath = `/uploads/news/${req.file.filename}`;
      updateFields.push('image_path = ?');
      updateValues.push(imagePath);
    }

    if (updateFields.length > 0) {
      updateValues.push(id);
      await pool.execute(
        `UPDATE news SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
        updateValues
      );
    }

    res.json({ message: 'News article updated successfully' });
  } catch (error) {
    console.error('Error updating news article:', error);
    res.status(500).json({ error: 'Error updating news article' });
  }
});

// Delete news article
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;

    // Get image path before deleting
    const [articles] = await pool.execute(
      'SELECT image_path FROM news WHERE id = ?',
      [id]
    );

    if (articles.length === 0) {
      return res.status(404).json({ error: 'News article not found' });
    }

    // Delete image if exists
    if (articles[0].image_path) {
      const imagePath = path.join(__dirname, '..', articles[0].image_path);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete from database
    await pool.execute('DELETE FROM news WHERE id = ?', [id]);

    res.json({ message: 'News article deleted successfully' });
  } catch (error) {
    console.error('Error deleting news article:', error);
    res.status(500).json({ error: 'Error deleting news article' });
  }
});

// Get featured news
router.get('/featured/list', async (req, res) => {
  try {
    const [news] = await pool.execute(
      'SELECT * FROM news WHERE is_featured = 1 ORDER BY date DESC, created_at DESC LIMIT 3'
    );

    res.json(news);
  } catch (error) {
    console.error('Error fetching featured news:', error);
    res.status(500).json({ error: 'Error fetching featured news' });
  }
});

module.exports = router;

