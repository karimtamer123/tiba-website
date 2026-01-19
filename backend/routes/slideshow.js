const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const upload = require('../config/upload');
const { authenticateToken } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

// Get all slideshow images
router.get('/', async (req, res) => {
  try {
    const [slides] = await pool.execute(
      'SELECT * FROM slideshow_images ORDER BY display_order ASC'
    );
    res.json(slides);
  } catch (error) {
    console.error('Error fetching slideshow:', error);
    res.status(500).json({ error: 'Error fetching slideshow images' });
  }
});

// Get single slideshow image
router.get('/:id', async (req, res) => {
  try {
    const [slides] = await pool.execute(
      'SELECT * FROM slideshow_images WHERE id = ?',
      [req.params.id]
    );
    
    if (slides.length === 0) {
      return res.status(404).json({ error: 'Slideshow image not found' });
    }
    
    res.json(slides[0]);
  } catch (error) {
    console.error('Error fetching slideshow image:', error);
    res.status(500).json({ error: 'Error fetching slideshow image' });
  }
});

// Upload new slideshow image
router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const { title, subtitle } = req.body;

    // Get current max display_order
    const [maxOrder] = await pool.execute(
      'SELECT MAX(display_order) as max_order FROM slideshow_images'
    );
    const displayOrder = (maxOrder[0]?.max_order || 0) + 1;

    // Save to database
    const imagePath = `/uploads/slideshow/${req.file.filename}`;
    const [result] = await pool.execute(
      'INSERT INTO slideshow_images (image_path, title, subtitle, display_order, created_at) VALUES (?, ?, ?, ?, NOW())',
      [imagePath, title || '', subtitle || '', displayOrder]
    );

    res.json({
      id: result.insertId,
      image_path: imagePath,
      title: title || '',
      subtitle: subtitle || '',
      display_order: displayOrder,
      message: 'Slideshow image uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading slideshow image:', error);
    res.status(500).json({ error: 'Error uploading slideshow image' });
  }
});

// Update slideshow image
router.put('/:id', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { title, subtitle, display_order } = req.body;
    const id = req.params.id;

    // Get existing image path if we need to delete old file
    let oldImagePath = null;
    if (req.file) {
      const [existing] = await pool.execute(
        'SELECT image_path FROM slideshow_images WHERE id = ?',
        [id]
      );
      if (existing.length > 0) {
        oldImagePath = existing[0].image_path;
      }
    }

    const updateFields = [];
    const updateValues = [];

    if (req.file) {
      const imagePath = `/uploads/slideshow/${req.file.filename}`;
      updateFields.push('image_path = ?');
      updateValues.push(imagePath);

      // Delete old image file if it exists
      if (oldImagePath) {
        // oldImagePath is like /uploads/slideshow/filename.jpg
        const oldFilePath = path.join(__dirname, '..', oldImagePath.replace(/^\//, ''));
        fs.unlink(oldFilePath, (err) => {
          if (err && err.code !== 'ENOENT') {
            console.error('Error deleting old slideshow image:', err);
          }
        });
      }
    }

    if (title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(title);
    }
    if (subtitle !== undefined) {
      updateFields.push('subtitle = ?');
      updateValues.push(subtitle);
    }
    if (display_order !== undefined) {
      updateFields.push('display_order = ?');
      updateValues.push(display_order);
    }

    if (updateFields.length === 0) {
      // Clean up uploaded file if no fields to update
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting uploaded file:', err);
        });
      }
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(id);

    await pool.execute(
      `UPDATE slideshow_images SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Fetch updated record to return
    const [updated] = await pool.execute(
      'SELECT * FROM slideshow_images WHERE id = ?',
      [id]
    );

    res.json({
      message: 'Slideshow image updated successfully',
      slide: updated[0]
    });
  } catch (error) {
    console.error('Error updating slideshow image:', error);
    // Clean up uploaded file on error
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting uploaded file on error:', err);
      });
    }
    res.status(500).json({ error: 'Error updating slideshow image' });
  }
});

// Delete slideshow image
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;

    // Get image path before deleting
    const [slides] = await pool.execute(
      'SELECT image_path FROM slideshow_images WHERE id = ?',
      [id]
    );

    if (slides.length === 0) {
      return res.status(404).json({ error: 'Slideshow image not found' });
    }

    // Delete from database
    await pool.execute('DELETE FROM slideshow_images WHERE id = ?', [id]);

    // Delete file from filesystem
    const imagePath = path.join(__dirname, '..', slides[0].image_path);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    res.json({ message: 'Slideshow image deleted successfully' });
  } catch (error) {
    console.error('Error deleting slideshow image:', error);
    res.status(500).json({ error: 'Error deleting slideshow image' });
  }
});

// Reorder slideshow images
router.post('/reorder', authenticateToken, async (req, res) => {
  try {
    const { order } = req.body; // Array of { id, display_order }

    if (!Array.isArray(order)) {
      return res.status(400).json({ error: 'Order must be an array' });
    }

    // Update display_order for each image
    for (const item of order) {
      await pool.execute(
        'UPDATE slideshow_images SET display_order = ? WHERE id = ?',
        [item.display_order, item.id]
      );
    }

    res.json({ message: 'Slideshow order updated successfully' });
  } catch (error) {
    console.error('Error reordering slideshow:', error);
    res.status(500).json({ error: 'Error reordering slideshow images' });
  }
});

module.exports = router;

