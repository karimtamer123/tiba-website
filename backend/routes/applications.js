const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const uploadPDF = require('../config/upload-pdf');
const { authenticateHRToken } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

// Submit new application (public - no auth required)
router.post('/', uploadPDF.single('cv'), async (req, res) => {
  try {
    const { fullName, email, phone, age, position, experience, coverLetter } = req.body;

    if (!fullName || !email || !phone || !age || !position || !experience) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'CV file is required' });
    }

    const cvPath = `/uploads/applications/${req.file.filename}`;

    const [result] = await pool.execute(
      'INSERT INTO job_applications (full_name, email, phone, age, position, experience, cv_path, cover_letter, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [fullName, email, phone, parseInt(age), position, experience, cvPath, coverLetter || null, 'new']
    );

    res.json({
      id: result.insertId,
      message: 'Application submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({ error: 'Error submitting application' });
  }
});

// Get all applications (HR only)
router.get('/', authenticateHRToken, async (req, res) => {
  try {
    const { status, position, search } = req.query;
    
    let query = 'SELECT * FROM job_applications WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }

    if (position && position !== 'all') {
      query += ' AND position = ?';
      params.push(position);
    }

    if (search) {
      query += ' AND (full_name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY created_at DESC';

    const [applications] = await pool.execute(query, params);

    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Error fetching applications' });
  }
});

// Get single application (HR only)
router.get('/:id', authenticateHRToken, async (req, res) => {
  try {
    const [applications] = await pool.execute(
      'SELECT * FROM job_applications WHERE id = ?',
      [req.params.id]
    );

    if (applications.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json(applications[0]);
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ error: 'Error fetching application' });
  }
});

// Update application status (HR only)
router.put('/:id', authenticateHRToken, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const id = req.params.id;
    const hrUserId = req.user.id;

    const updateFields = [];
    const updateValues = [];

    if (status) {
      updateFields.push('status = ?');
      updateValues.push(status);
      if (status !== 'new') {
        updateFields.push('reviewed_by = ?');
        updateValues.push(hrUserId);
        updateFields.push('reviewed_at = NOW()');
      }
    }

    if (notes !== undefined) {
      updateFields.push('notes = ?');
      updateValues.push(notes);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(id);

    await pool.execute(
      `UPDATE job_applications SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
      updateValues
    );

    res.json({ message: 'Application updated successfully' });
  } catch (error) {
    console.error('Error updating application:', error);
    res.status(500).json({ error: 'Error updating application' });
  }
});

// Delete application (HR only)
router.delete('/:id', authenticateHRToken, async (req, res) => {
  try {
    const id = req.params.id;

    // Get CV path before deleting
    const [applications] = await pool.execute(
      'SELECT cv_path FROM job_applications WHERE id = ?',
      [id]
    );

    if (applications.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Delete CV file
    if (applications[0].cv_path) {
      const cvFilePath = path.join(__dirname, '..', applications[0].cv_path.replace(/^\//, ''));
      if (fs.existsSync(cvFilePath)) {
        fs.unlinkSync(cvFilePath);
      }
    }

    // Delete from database
    await pool.execute('DELETE FROM job_applications WHERE id = ?', [id]);

    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({ error: 'Error deleting application' });
  }
});

// Get application statistics (HR only)
router.get('/stats/summary', authenticateHRToken, async (req, res) => {
  try {
    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_count,
        SUM(CASE WHEN status = 'reviewed' THEN 1 ELSE 0 END) as reviewed_count,
        SUM(CASE WHEN status = 'shortlisted' THEN 1 ELSE 0 END) as shortlisted_count,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN status = 'hired' THEN 1 ELSE 0 END) as hired_count
      FROM job_applications
    `);

    res.json(stats[0]);
  } catch (error) {
    console.error('Error fetching application statistics:', error);
    res.status(500).json({ error: 'Error fetching statistics' });
  }
});

module.exports = router;

