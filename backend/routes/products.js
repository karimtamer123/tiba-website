const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const upload = require('../config/upload');
const { authenticateToken } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

// Get all products
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY display_order ASC, created_at DESC';

    const [products] = await pool.execute(query, params);

    // Get images and key features for each product
    for (const product of products) {
      const [images] = await pool.execute(
        'SELECT * FROM product_images WHERE product_id = ? ORDER BY display_order ASC',
        [product.id]
      );
      product.images = images;

      // Parse key features (stored as JSON)
      if (product.key_features) {
        try {
          product.key_features = JSON.parse(product.key_features);
        } catch (e) {
          product.key_features = [];
        }
      } else {
        product.key_features = [];
      }
    }

    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Error fetching products' });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const [products] = await pool.execute(
      'SELECT * FROM products WHERE id = ?',
      [req.params.id]
    );

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = products[0];

    // Get images
    const [images] = await pool.execute(
      'SELECT * FROM product_images WHERE product_id = ? ORDER BY display_order ASC',
      [product.id]
    );
    product.images = images;

    // Parse key features
    if (product.key_features) {
      try {
        product.key_features = JSON.parse(product.key_features);
      } catch (e) {
        product.key_features = [];
      }
    } else {
      product.key_features = [];
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Error fetching product' });
  }
});

// Create new product
router.post('/', authenticateToken, upload.array('images', 10), async (req, res) => {
  try {
    const { name, description, category, subcategory, key_features, display_order } = req.body;

    if (!name || !category) {
      return res.status(400).json({ error: 'Name and category are required' });
    }

    // Parse key_features if it's a string
    let featuresArray = [];
    if (key_features) {
      try {
        featuresArray = typeof key_features === 'string' ? JSON.parse(key_features) : key_features;
      } catch (e) {
        featuresArray = Array.isArray(key_features) ? key_features : [];
      }
    }

    // Get display_order if not provided
    let order = display_order;
    if (!order) {
      const [maxOrder] = await pool.execute(
        'SELECT MAX(display_order) as max_order FROM products WHERE category = ?',
        [category]
      );
      order = (maxOrder[0]?.max_order || 0) + 1;
    }

    // Insert product
    const [result] = await pool.execute(
      'INSERT INTO products (name, description, category, subcategory, key_features, display_order, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [name, description || null, category, subcategory || null, JSON.stringify(featuresArray), order]
    );

    const productId = result.insertId;

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const imagePath = `/uploads/products/${file.filename}`;
        await pool.execute(
          'INSERT INTO product_images (product_id, image_path, display_order) VALUES (?, ?, ?)',
          [productId, imagePath, i + 1]
        );
      }
    }

    res.json({
      id: productId,
      message: 'Product created successfully'
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Error creating product' });
  }
});

// Update product
router.put('/:id', authenticateToken, upload.array('images', 10), async (req, res) => {
  try {
    const { name, description, category, subcategory, key_features, display_order } = req.body;
    const id = req.params.id;

    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(description);
    }
    if (category !== undefined) {
      updateFields.push('category = ?');
      updateValues.push(category);
    }
    if (subcategory !== undefined) {
      updateFields.push('subcategory = ?');
      updateValues.push(subcategory);
    }
    if (key_features !== undefined) {
      let featuresArray = [];
      try {
        featuresArray = typeof key_features === 'string' ? JSON.parse(key_features) : key_features;
      } catch (e) {
        featuresArray = Array.isArray(key_features) ? key_features : [];
      }
      updateFields.push('key_features = ?');
      updateValues.push(JSON.stringify(featuresArray));
    }
    if (display_order !== undefined) {
      updateFields.push('display_order = ?');
      updateValues.push(display_order);
    }

    if (updateFields.length > 0) {
      updateValues.push(id);
      await pool.execute(
        `UPDATE products SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
        updateValues
      );
    }

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      // Get current max display_order
      const [maxOrder] = await pool.execute(
        'SELECT MAX(display_order) as max_order FROM product_images WHERE product_id = ?',
        [id]
      );
      let currentOrder = maxOrder[0]?.max_order || 0;

      for (const file of req.files) {
        const imagePath = `/uploads/products/${file.filename}`;
        currentOrder++;
        await pool.execute(
          'INSERT INTO product_images (product_id, image_path, display_order) VALUES (?, ?, ?)',
          [id, imagePath, currentOrder]
        );
      }
    }

    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Error updating product' });
  }
});

// Delete product
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;

    // Get all images before deleting
    const [images] = await pool.execute(
      'SELECT image_path FROM product_images WHERE product_id = ?',
      [id]
    );

    // Delete images from filesystem
    for (const image of images) {
      const imagePath = path.join(__dirname, '..', image.image_path);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    // Delete from database (cascade will handle product_images)
    await pool.execute('DELETE FROM products WHERE id = ?', [id]);

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Error deleting product' });
  }
});

// Delete product image
router.delete('/:id/images/:imageId', authenticateToken, async (req, res) => {
  try {
    const { id, imageId } = req.params;

    // Get image path
    const [images] = await pool.execute(
      'SELECT image_path FROM product_images WHERE id = ? AND product_id = ?',
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
    await pool.execute('DELETE FROM product_images WHERE id = ?', [imageId]);

    res.json({ message: 'Product image deleted successfully' });
  } catch (error) {
    console.error('Error deleting product image:', error);
    res.status(500).json({ error: 'Error deleting product image' });
  }
});

module.exports = router;

