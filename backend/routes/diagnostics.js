const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const pool = require('../config/database');

// Diagnostic endpoint to check file existence
router.get('/check-files', async (req, res) => {
  try {
    // Get all slideshow images from database
    const [slides] = await pool.execute(
      'SELECT id, title, image_path FROM slideshow_images'
    );
    
    const results = [];
    
    for (const slide of slides) {
      const imagePath = slide.image_path;
      
      // Construct full file system path
      // imagePath is like /uploads/slideshow/filename.jpg
      // Need to resolve from backend directory
      const fullPath = path.join(__dirname, '..', imagePath.replace(/^\//, ''));
      
      const fileExists = fs.existsSync(fullPath);
      const stats = fileExists ? fs.statSync(fullPath) : null;
      
      results.push({
        id: slide.id,
        title: slide.title,
        db_path: imagePath,
        filesystem_path: fullPath,
        exists: fileExists,
        size: stats ? stats.size : null,
        modified: stats ? stats.mtime : null,
        http_url: `http://localhost:3000${imagePath}`
      });
    }
    
    res.json({
      uploads_directory: path.join(__dirname, '..', 'uploads'),
      uploads_directory_exists: fs.existsSync(path.join(__dirname, '..', 'uploads')),
      slideshow_directory: path.join(__dirname, '..', 'uploads', 'slideshow'),
      slideshow_directory_exists: fs.existsSync(path.join(__dirname, '..', 'uploads', 'slideshow')),
      files: results
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Error checking files',
      message: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;

