const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const upload = require('../config/upload');
const { authenticateToken } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

// Debug endpoint to check projects table
router.get('/debug', async (req, res) => {
  try {
    // Check if table exists
    const [tables] = await pool.execute(
      "SHOW TABLES LIKE 'projects'"
    );
    console.log('Projects table exists:', tables.length > 0);
    
    // Count projects
    const [count] = await pool.execute('SELECT COUNT(*) as total FROM projects');
    console.log('Total projects in database:', count[0].total);
    
    // Get first few projects
    const [sample] = await pool.execute('SELECT * FROM projects LIMIT 5');
    console.log('Sample projects:', sample);
    
    res.json({
      tableExists: tables.length > 0,
      totalProjects: count[0].total,
      sampleProjects: sample
    });
  } catch (error) {
    console.error('Debug error:', error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// Get all projects
router.get('/', async (req, res) => {
  try {
    const { category, featured } = req.query;
    console.log('GET /projects - Query params:', { category, featured });
    
    let query = 'SELECT * FROM projects WHERE 1=1';
    const params = [];

    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }

    if (featured === 'true') {
      query += ' AND is_featured = 1';
    }

    query += ' ORDER BY created_at DESC';
    
    console.log('Executing query:', query);
    console.log('With params:', params);

    const [projects] = await pool.execute(query, params);
    console.log('Projects found:', projects.length);

    // Get images for each project
    for (const project of projects) {
      const [images] = await pool.execute(
        'SELECT * FROM project_images WHERE project_id = ? ORDER BY display_order ASC',
        [project.id]
      );
      project.images = images;
    }

    console.log('Returning', projects.length, 'projects');
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Error fetching projects', details: error.message });
  }
});

// Get single project
router.get('/:id', async (req, res) => {
  try {
    const [projects] = await pool.execute(
      'SELECT * FROM projects WHERE id = ?',
      [req.params.id]
    );

    if (projects.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const project = projects[0];

    // Get images
    const [images] = await pool.execute(
      'SELECT * FROM project_images WHERE project_id = ? ORDER BY display_order ASC',
      [project.id]
    );
    project.images = images;

    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Error fetching project' });
  }
});

// Create new project
router.post('/', authenticateToken, upload.array('images', 10), async (req, res) => {
  try {
    const { title, location, description, equipment, category, is_featured } = req.body;

    if (!title || !location) {
      return res.status(400).json({ error: 'Title and location are required' });
    }

    // Insert project
    const [result] = await pool.execute(
      'INSERT INTO projects (title, location, description, equipment, category, is_featured, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [title, location, description || null, equipment || null, category || 'all', is_featured === 'true' ? 1 : 0]
    );

    const projectId = result.insertId;

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const imagePath = `/uploads/projects/${file.filename}`;
        await pool.execute(
          'INSERT INTO project_images (project_id, image_path, display_order) VALUES (?, ?, ?)',
          [projectId, imagePath, i + 1]
        );
      }
    }

    res.json({
      id: projectId,
      message: 'Project created successfully'
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Error creating project' });
  }
});

// Update project
router.put('/:id', authenticateToken, upload.array('images', 10), async (req, res) => {
  try {
    const { title, location, description, equipment, category, is_featured } = req.body;
    const id = req.params.id;

    const updateFields = [];
    const updateValues = [];

    if (title !== undefined) {
      updateFields.push('title = ?');
      updateValues.push(title);
    }
    if (location !== undefined) {
      updateFields.push('location = ?');
      updateValues.push(location);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (equipment !== undefined) {
      updateFields.push('equipment = ?');
      updateValues.push(equipment);
    }
    if (category !== undefined) {
      updateFields.push('category = ?');
      updateValues.push(category);
    }
    if (is_featured !== undefined) {
      updateFields.push('is_featured = ?');
      updateValues.push(is_featured === 'true' ? 1 : 0);
    }

    if (updateFields.length > 0) {
      updateValues.push(id);
      await pool.execute(
        `UPDATE projects SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
        updateValues
      );
    }

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      // Get current max display_order
      const [maxOrder] = await pool.execute(
        'SELECT MAX(display_order) as max_order FROM project_images WHERE project_id = ?',
        [id]
      );
      let currentOrder = maxOrder[0]?.max_order || 0;

      for (const file of req.files) {
        const imagePath = `/uploads/projects/${file.filename}`;
        currentOrder++;
        await pool.execute(
          'INSERT INTO project_images (project_id, image_path, display_order) VALUES (?, ?, ?)',
          [id, imagePath, currentOrder]
        );
      }
    }

    res.json({ message: 'Project updated successfully' });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Error updating project' });
  }
});

// Delete project
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;

    // Get all images before deleting
    const [images] = await pool.execute(
      'SELECT image_path FROM project_images WHERE project_id = ?',
      [id]
    );

    // Delete images from filesystem
    for (const image of images) {
      const imagePath = path.join(__dirname, '..', image.image_path);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete from database (cascade will handle project_images)
    await pool.execute('DELETE FROM projects WHERE id = ?', [id]);

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Error deleting project' });
  }
});

// Delete project image
router.delete('/:id/images/:imageId', authenticateToken, async (req, res) => {
  try {
    const { id, imageId } = req.params;

    // Get image path
    const [images] = await pool.execute(
      'SELECT image_path FROM project_images WHERE id = ? AND project_id = ?',
      [imageId, id]
    );

    if (images.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    // Delete file
    const imagePath = path.join(__dirname, '..', images[0].image_path);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // Delete from database
    await pool.execute('DELETE FROM project_images WHERE id = ?', [imageId]);

    res.json({ message: 'Project image deleted successfully' });
  } catch (error) {
    console.error('Error deleting project image:', error);
    res.status(500).json({ error: 'Error deleting project image' });
  }
});

// Get featured projects
router.get('/featured/list', async (req, res) => {
  try {
    const [projects] = await pool.execute(
      'SELECT * FROM projects WHERE is_featured = 1 ORDER BY created_at DESC'
    );

    // Get images for each project
    for (const project of projects) {
      const [images] = await pool.execute(
        'SELECT * FROM project_images WHERE project_id = ? ORDER BY display_order ASC LIMIT 1',
        [project.id]
      );
      project.primary_image = images[0] || null;
    }

    res.json(projects);
  } catch (error) {
    console.error('Error fetching featured projects:', error);
    res.status(500).json({ error: 'Error fetching featured projects' });
  }
});

module.exports = router;

