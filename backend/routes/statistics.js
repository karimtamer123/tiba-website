const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get all statistics
router.get('/', async (req, res) => {
  try {
    const [stats] = await pool.execute(
      'SELECT * FROM statistics ORDER BY display_order ASC'
    );
    res.json(stats);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Error fetching statistics' });
  }
});

// Get single statistic
router.get('/:id', async (req, res) => {
  try {
    const [stats] = await pool.execute(
      'SELECT * FROM statistics WHERE id = ?',
      [req.params.id]
    );
    
    if (stats.length === 0) {
      return res.status(404).json({ error: 'Statistic not found' });
    }
    
    res.json(stats[0]);
  } catch (error) {
    console.error('Error fetching statistic:', error);
    res.status(500).json({ error: 'Error fetching statistic' });
  }
});

// Update statistic
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { value, label, description, suffix, display_order } = req.body;
    const id = req.params.id;

    const updateFields = [];
    const updateValues = [];

    if (value !== undefined) {
      updateFields.push('value = ?');
      updateValues.push(value);
    }
    if (label !== undefined) {
      updateFields.push('label = ?');
      updateValues.push(label);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (suffix !== undefined) {
      updateFields.push('suffix = ?');
      updateValues.push(suffix);
    }
    if (display_order !== undefined) {
      updateFields.push('display_order = ?');
      updateValues.push(display_order);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(id);

    await pool.execute(
      `UPDATE statistics SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
      updateValues
    );

    res.json({ message: 'Statistic updated successfully' });
  } catch (error) {
    console.error('Error updating statistic:', error);
    res.status(500).json({ error: 'Error updating statistic' });
  }
});

// Create new statistic
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { value, label, description, suffix, display_order } = req.body;

    if (!value || !label) {
      return res.status(400).json({ error: 'Value and label are required' });
    }

    // Get current max display_order if not provided
    let order = display_order;
    if (!order) {
      const [maxOrder] = await pool.execute(
        'SELECT MAX(display_order) as max_order FROM statistics'
      );
      order = (maxOrder[0]?.max_order || 0) + 1;
    }

    const [result] = await pool.execute(
      'INSERT INTO statistics (value, label, description, suffix, display_order, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [value, label, description || null, suffix || null, order]
    );

    res.json({
      id: result.insertId,
      value,
      label,
      description: description || null,
      suffix: suffix || null,
      display_order: order,
      message: 'Statistic created successfully'
    });
  } catch (error) {
    console.error('Error creating statistic:', error);
    res.status(500).json({ error: 'Error creating statistic' });
  }
});

// Delete statistic
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;

    const [result] = await pool.execute('DELETE FROM statistics WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Statistic not found' });
    }

    res.json({ message: 'Statistic deleted successfully' });
  } catch (error) {
    console.error('Error deleting statistic:', error);
    res.status(500).json({ error: 'Error deleting statistic' });
  }
});

module.exports = router;

