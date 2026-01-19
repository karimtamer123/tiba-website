const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'tiba_website',
};

// Map HTML file names to database category values
const categoryMap = {
  'air-handling-units': 'air-handling-units',
  'chillers': 'chillers',
  'cooling-towers': 'cooling-towers',
  'fan-coil-units': 'fan-coil-units',
  'variable-refrigerant-flow': 'variable-refrigerant-flow',
  'air-outlets-dampers': 'air-outlets-dampers',
  'pumps': 'pumps'
};

async function importProducts() {
  let connection;
  try {
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✓ Connected to MySQL database');
    console.log(`  Database: ${dbConfig.database} on ${dbConfig.host}\n`);

    const projectRoot = path.join(__dirname, '..');
    const products = [];

    // List of product category HTML files
    const productFiles = [
      'air-handling-units.html',
      'chillers.html',
      'cooling-towers.html',
      'fan-coil-units.html',
      'variable-refrigerant-flow.html',
      'air-outlets-dampers.html',
      'pumps.html'
    ];

    console.log('📋 Scanning product category files...\n');

    // Process each product category file
    for (const filename of productFiles) {
      const filePath = path.join(projectRoot, filename);
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${filename}, skipping...`);
        continue;
      }

      // Determine category from filename
      const categoryKey = filename.replace('.html', '');
      const category = categoryMap[categoryKey] || categoryKey;

      console.log(`📄 Processing ${filename} (category: ${category})...`);

      const htmlContent = fs.readFileSync(filePath, 'utf-8');

      // Find all product-horizontal-card sections
      // Use a more flexible approach - find all occurrences
      const productCardPattern = /<div class="product-horizontal-card"/g;
      let cardMatch;
      const cardPositions = [];

      // Find all product card start positions
      while ((cardMatch = productCardPattern.exec(htmlContent)) !== null) {
        cardPositions.push(cardMatch.index);
      }

      console.log(`  Found ${cardPositions.length} product card(s)`);

      // Extract each product
      for (let i = 0; i < cardPositions.length; i++) {
        const startIdx = cardPositions[i];
        const endIdx = i < cardPositions.length - 1 ? cardPositions[i + 1] : htmlContent.length;
        
        // Extract content between this card and the next (or end of file)
        let cardContent = htmlContent.substring(startIdx, endIdx);
        
        // Find the closing tags for this card (should be </div></div></div>)
        const cardEndMatch = cardContent.match(/<\/div>\s*<\/div>\s*<\/div>/);
        if (cardEndMatch) {
          cardContent = cardContent.substring(0, cardEndMatch.index + cardEndMatch[0].length);
        }

        // Find the parent section that contains this product card
        // Look backwards from the card position to find the section header
        const sectionStart = htmlContent.lastIndexOf('<div id="', startIdx);
        const sectionEnd = htmlContent.indexOf('"', sectionStart + 9);
        let sectionId = null;
        if (sectionStart !== -1 && sectionEnd !== -1) {
          sectionId = htmlContent.substring(sectionStart + 9, sectionEnd);
        }

        // Also look for section header (h2.brand-title) before this card
        const sectionHeaderMatch = htmlContent.substring(Math.max(0, startIdx - 2000), startIdx)
          .match(/<h2[^>]*class="brand-title"[^>]*>([^<]+)<\/h2>/);
        let sectionTitle = sectionHeaderMatch ? sectionHeaderMatch[1].trim() : null;

        // Extract product name (h3.product-name)
        const nameMatch = cardContent.match(/<h3[^>]*class="product-name"[^>]*>([^<]+)<\/h3>/);
        const name = nameMatch ? nameMatch[1].trim() : null;

        // Extract description/specs (p tag after product name, before Key Features)
        const descMatch = cardContent.match(/<p[^>]*style="[^"]*font-size: 0\.875rem[^"]*color: #6B7280[^"]*"[^>]*>([^<]+)<\/p>/);
        const description = descMatch ? descMatch[1].trim() : null;

        // Extract image path
        const imageMatch = cardContent.match(/<img[^>]+src="([^"]+)"[^>]*alt="[^"]*"[^>]*>/);
        const imagePath = imageMatch ? imageMatch[1] : null;

        // Extract key features (list items within Key Features section)
        const featuresSection = cardContent.match(/<h4[^>]*>Key Features<\/h4>[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>/);
        const features = [];
        if (featuresSection) {
          const featureItems = featuresSection[1].match(/<li[^>]*>[\s\S]*?<span[^>]*>[\s\S]*?<\/span>([\s\S]*?)<\/li>/g);
          if (featureItems) {
            featureItems.forEach(item => {
              // Extract text after the bullet span
              const textMatch = item.match(/<\/span>([\s\S]*?)<\/li>/);
              if (textMatch) {
                const featureText = textMatch[1].trim().replace(/<[^>]+>/g, '').trim();
                if (featureText) {
                  features.push(featureText);
                }
              }
            });
          }
        }

        // Extract subcategory from section ID, section title, description, or image path
        let subcategory = null;
        
        // For Pumps: Extract from description line "Application: ..."
        if (category === 'pumps' && description) {
          const appMatch = description.match(/Application:\s*([^|]+)/i);
          if (appMatch) {
            subcategory = appMatch[1].trim();
          }
        }
        
        // For Chillers: Extract from section ID (e.g., "water-cooled-centrifugal-products" -> "Water-Cooled Centrifugal")
        if (!subcategory && category === 'chillers' && sectionId && sectionId.includes('-products')) {
          const idParts = sectionId.replace('-products', '').split('-');
          subcategory = idParts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
        }
        
        // For Cooling Towers: Extract from section ID (e.g., "open-type-products" -> "Open Type")
        if (!subcategory && category === 'cooling-towers' && sectionId && sectionId.includes('-products')) {
          const idParts = sectionId.replace('-products', '').split('-');
          subcategory = idParts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
        }
        
        // For Air Handling Units: Extract from section ID (e.g., "trox-product" -> "Trox")
        if (!subcategory && category === 'air-handling-units' && sectionId && sectionId.includes('-product')) {
          subcategory = sectionId.replace('-product', '').charAt(0).toUpperCase() + sectionId.replace('-product', '').slice(1);
        }
        
        // Try from section title (e.g., "Water-Cooled Centrifugal Chillers" -> "Water-Cooled Centrifugal")
        if (!subcategory && sectionTitle) {
          // Remove category name from title (e.g., "Chillers", "Cooling Towers")
          const categoryWords = ['Chillers', 'Cooling Towers', 'Pumps', 'Air Handling Units', 'Fan Coil Units', 'Variable Refrigerant Flow', 'Systems'];
          let cleanTitle = sectionTitle;
          for (const word of categoryWords) {
            cleanTitle = cleanTitle.replace(new RegExp(`\\s*${word}\\s*$`, 'i'), '');
          }
          if (cleanTitle && cleanTitle !== sectionTitle && cleanTitle.trim().length > 0) {
            subcategory = cleanTitle.trim();
          }
        }
        
        // If still no subcategory, try to extract from image path folders
        if (!subcategory && imagePath) {
          const pathParts = imagePath.split('/');
          // Look for subcategory-like folder names (e.g., "water cooled centrifugal chillers")
          for (const part of pathParts) {
            const lowerPart = part.toLowerCase();
            // Check if it contains subcategory keywords
            if (lowerPart.includes('centrifugal') || lowerPart.includes('screw') || 
                lowerPart.includes('scroll') || lowerPart.includes('absorption') ||
                lowerPart.includes('magnetic') || lowerPart.includes('open') ||
                lowerPart.includes('closed') || lowerPart.includes('evaporative') ||
                lowerPart.includes('fire') || lowerPart.includes('hvac') ||
                lowerPart.includes('irrigation') || lowerPart.includes('submersible') ||
                lowerPart.includes('pressure')) {
              // Convert to title case
              subcategory = part.split(/[\s-]+/).map(p => 
                p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
              ).join(' ');
              break;
            }
          }
        }
        
        // If still no subcategory, try to extract from product name or description
        if (!subcategory) {
          // Look for common subcategory patterns in name/description
          const subcategoryPatterns = [
            { pattern: /(Water-Cooled|Water Cooled)\s+(Centrifugal|Screw)/i, extract: (m) => m[0] },
            { pattern: /(Air-Cooled|Air Cooled)\s+(Screw|Scroll|Magnetic)/i, extract: (m) => m[0] },
            { pattern: /(Centrifugal|Screw|Scroll|Absorption|Magnetic Bearing)/i, extract: (m) => m[1] },
            { pattern: /(Open Type|Closed Type|Evaporative Condensers)/i, extract: (m) => m[1] },
            { pattern: /(Fire Fighting|HVAC|Irrigation|Submersible|Pressure Boosters)/i, extract: (m) => m[1] }
          ];
          
          const searchText = `${name} ${description || ''}`;
          for (const { pattern, extract } of subcategoryPatterns) {
            const match = searchText.match(pattern);
            if (match) {
              subcategory = extract(match);
              break;
            }
          }
        }

        if (name) {
          products.push({
            name,
            description: description || null,
            category,
            subcategory: subcategory || null,
            keyFeatures: features,
            imagePath: imagePath || null
          });
          console.log(`  ✓ Extracted: "${name}"`);
        } else {
          console.log(`  ⚠️  Skipped product (no name found)`);
        }
      }
    }

    console.log(`\n📋 Found ${products.length} products to import\n`);

    if (products.length === 0) {
      console.log('⚠️  No products found in HTML files');
      return;
    }

    // Check if products already exist
    const [existing] = await connection.execute('SELECT COUNT(*) as count FROM products');
    if (existing[0].count > 0) {
      console.log(`⚠️  Warning: Database already contains ${existing[0].count} products`);
      console.log('   This script will add new products. Duplicates may be created.\n');
    }

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    // Import each product
    for (const product of products) {
      try {
        // Check if product already exists (by name and category)
        const [existing] = await connection.execute(
          'SELECT id FROM products WHERE name = ? AND category = ?',
          [product.name, product.category]
        );

        if (existing.length > 0) {
          console.log(`⏭️  Skipped: "${product.name}" (already exists)`);
          skipped++;
          continue;
        }

        // Convert key features array to JSON
        const keyFeaturesJson = JSON.stringify(product.keyFeatures);

        // Insert product
        const [result] = await connection.execute(
          `INSERT INTO products (name, description, category, subcategory, key_features, display_order, created_at) 
           VALUES (?, ?, ?, ?, ?, 0, NOW())`,
          [
            product.name,
            product.description,
            product.category,
            product.subcategory,
            keyFeaturesJson
          ]
        );

        const productId = result.insertId;

        // Handle image - copy to uploads directory and insert into product_images
        if (product.imagePath) {
          // Convert relative path to absolute
          let sourceImagePath = path.join(projectRoot, product.imagePath);
          
          // Check if file exists
          if (fs.existsSync(sourceImagePath)) {
            // Create products upload directory if it doesn't exist
            const uploadsDir = path.join(__dirname, 'uploads', 'products');
            if (!fs.existsSync(uploadsDir)) {
              fs.mkdirSync(uploadsDir, { recursive: true });
            }

            // Get filename and create new path
            const filename = path.basename(product.imagePath);
            const destImagePath = path.join(uploadsDir, filename);

            // Copy file
            fs.copyFileSync(sourceImagePath, destImagePath);

            // Insert image record
            const dbImagePath = `/uploads/products/${filename}`;
            await connection.execute(
              'INSERT INTO product_images (product_id, image_path, display_order) VALUES (?, ?, 1)',
              [productId, dbImagePath]
            );

            console.log(`✅ Imported: "${product.name}" (${product.category}) with image`);
          } else {
            // File doesn't exist, just record the path
            const dbImagePath = product.imagePath.startsWith('/') ? product.imagePath : `/${product.imagePath}`;
            await connection.execute(
              'INSERT INTO product_images (product_id, image_path, display_order) VALUES (?, ?, 1)',
              [productId, dbImagePath]
            );
            console.log(`✅ Imported: "${product.name}" (${product.category}) - image file not found, path recorded`);
          }
        } else {
          console.log(`✅ Imported: "${product.name}" (${product.category}) - no image`);
        }

        imported++;
      } catch (error) {
        console.error(`❌ Error importing "${product.name}":`, error.message);
        errors++;
      }
    }

    console.log('\n============================================================');
    console.log('📊 IMPORT SUMMARY:');
    console.log(`   Total products found: ${products.length}`);
    console.log(`   Successfully imported: ${imported}`);
    console.log(`   Skipped (duplicates): ${skipped}`);
    console.log(`   Errors: ${errors}`);
    console.log('============================================================\n');

    if (imported > 0) {
      console.log('✅ Products have been imported successfully!');
      console.log('   You can now view them in the admin portal at /admin/products\n');
    }

  } catch (error) {
    console.error('\n❌ Error during import:', error);
    console.error('Stack:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('✓ Database connection closed');
    }
  }
}

// Run the import
importProducts();

