const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Endpoint to fix image paths in database (adds leading / if missing)
router.post('/fix-slideshow-paths', authenticateToken, async (req, res) => {
  try {
    // Get all slideshow images
    const [slides] = await pool.execute(
      'SELECT id, image_path FROM slideshow_images'
    );
    
    let updated = 0;
    const updates = [];
    
    for (const slide of slides) {
      let newPath = slide.image_path;
      
      // Fix path - ensure it starts with /
      if (newPath && !newPath.startsWith('/')) {
        newPath = '/' + newPath;
      }
      
      // Handle old paths that might need to be in /uploads/slideshow/
      // Only update if the path actually changed
      if (newPath && newPath !== slide.image_path) {
        await pool.execute(
          'UPDATE slideshow_images SET image_path = ? WHERE id = ?',
          [newPath, slide.id]
        );
        updated++;
        updates.push({
          id: slide.id,
          old_path: slide.image_path,
          new_path: newPath
        });
      }
    }
    
    res.json({
      message: `Updated ${updated} image path(s)`,
      total: slides.length,
      updated: updated,
      updates: updates
    });
  } catch (error) {
    console.error('Error fixing paths:', error);
    res.status(500).json({ 
      error: 'Error fixing paths',
      message: error.message 
    });
  }
});

module.exports = router;

