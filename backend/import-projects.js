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

async function importProjects() {
  let connection;
  try {
    // Connect to database
    connection = await mysql.createConnection(dbConfig);
    console.log('✓ Connected to MySQL database');
    console.log(`  Database: ${dbConfig.database} on ${dbConfig.host}\n`);

    // Read projects.html file
    const projectsHtmlPath = path.join(__dirname, '..', 'projects.html');
    if (!fs.existsSync(projectsHtmlPath)) {
      throw new Error(`projects.html not found at: ${projectsHtmlPath}`);
    }

    const htmlContent = fs.readFileSync(projectsHtmlPath, 'utf-8');
    console.log('✓ Read projects.html file\n');

    // Extract project cards - find all project-card divs
    const projects = [];
    const projectCardPattern = /<div class="project-card" data-category="([^"]+)">/g;
    let cardMatch;
    const cardPositions = [];
    
    // Find all project card positions
    while ((cardMatch = projectCardPattern.exec(htmlContent)) !== null) {
      cardPositions.push({
        category: cardMatch[1],
        startIndex: cardMatch.index,
        fullMatch: cardMatch[0]
      });
    }
    
    console.log(`Found ${cardPositions.length} project card markers\n`);
    
    // Extract each project card content
    for (let i = 0; i < cardPositions.length; i++) {
      const pos = cardPositions[i];
      const startIdx = pos.startIndex + pos.fullMatch.length;
      const endIdx = i < cardPositions.length - 1 
        ? cardPositions[i + 1].startIndex 
        : htmlContent.length;
      
      const cardContent = htmlContent.substring(startIdx, endIdx);
      const category = pos.category;

      // Extract image path
      const imageMatch = cardContent.match(/<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>/);
      const imagePath = imageMatch ? imageMatch[1] : null;

      // Extract title
      const titleMatch = cardContent.match(/<h3>([^<]+)<\/h3>/);
      const title = titleMatch ? titleMatch[1].trim() : null;

      // Extract location
      const locationMatch = cardContent.match(/<p class="project-location">([^<]+)<\/p>/);
      const location = locationMatch ? locationMatch[1].trim() : null;

      // Extract description
      const descMatch = cardContent.match(/<p class="project-description">([^<]+(?:<br[^>]*>)?[^<]*)<\/p>/);
      let description = null;
      if (descMatch) {
        description = descMatch[1].replace(/<br[^>]*>/g, ' ').trim();
      }

      // Extract equipment from equipment-list section
      let equipment = null;
      const equipmentSection = cardContent.match(/<div class="equipment-list">[\s\S]*?<h4>Equipment Provided:<\/h4>\s*<p>([^<]+)<\/p>/);
      if (equipmentSection) {
        equipment = equipmentSection[1].trim();
      }

      if (title && location) {
        projects.push({
          title,
          location,
          description: description || null,
          equipment: equipment || null,
          category: category || 'all',
          imagePath: imagePath || null
        });
      }
    }

    console.log(`📋 Found ${projects.length} projects to import\n`);

    if (projects.length === 0) {
      console.log('⚠️  No projects found in HTML file');
      return;
    }

    // Check if projects already exist
    const [existing] = await connection.execute('SELECT COUNT(*) as count FROM projects');
    if (existing[0].count > 0) {
      console.log(`⚠️  Warning: Database already contains ${existing[0].count} projects`);
      console.log('   This script will add new projects. Duplicates may be created.\n');
    }

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    // Import each project
    for (const project of projects) {
      try {
        // Check if project already exists (by title and location)
        const [existing] = await connection.execute(
          'SELECT id FROM projects WHERE title = ? AND location = ?',
          [project.title, project.location]
        );

        if (existing.length > 0) {
          console.log(`⏭️  Skipped: "${project.title}" (already exists)`);
          skipped++;
          continue;
        }

        // Insert project
        const [result] = await connection.execute(
          `INSERT INTO projects (title, location, description, equipment, category, is_featured, created_at) 
           VALUES (?, ?, ?, ?, ?, 0, NOW())`,
          [
            project.title,
            project.location,
            project.description,
            project.equipment,
            project.category
          ]
        );

        const projectId = result.insertId;

        // Handle image - copy to uploads directory and insert into project_images
        if (project.imagePath) {
          // Convert relative path to absolute
          let sourceImagePath = path.join(__dirname, '..', project.imagePath);
          
          // Check if file exists
          if (fs.existsSync(sourceImagePath)) {
            // Create projects upload directory if it doesn't exist
            const uploadsDir = path.join(__dirname, 'uploads', 'projects');
            if (!fs.existsSync(uploadsDir)) {
              fs.mkdirSync(uploadsDir, { recursive: true });
            }

            // Get filename and create new path
            const filename = path.basename(project.imagePath);
            const destImagePath = path.join(uploadsDir, filename);

            // Copy file
            fs.copyFileSync(sourceImagePath, destImagePath);

            // Insert image record
            const dbImagePath = `/uploads/projects/${filename}`;
            await connection.execute(
              'INSERT INTO project_images (project_id, image_path, display_order) VALUES (?, ?, 1)',
              [projectId, dbImagePath]
            );

            console.log(`✅ Imported: "${project.title}" (${project.category}) with image`);
          } else {
            // File doesn't exist, just record the path
            const dbImagePath = project.imagePath.startsWith('/') ? project.imagePath : `/${project.imagePath}`;
            await connection.execute(
              'INSERT INTO project_images (project_id, image_path, display_order) VALUES (?, ?, 1)',
              [projectId, dbImagePath]
            );
            console.log(`✅ Imported: "${project.title}" (${project.category}) - image file not found, path recorded`);
          }
        } else {
          console.log(`✅ Imported: "${project.title}" (${project.category}) - no image`);
        }

        imported++;
      } catch (error) {
        console.error(`❌ Error importing "${project.title}":`, error.message);
        errors++;
      }
    }

    console.log('\n============================================================');
    console.log('📊 IMPORT SUMMARY:');
    console.log(`   Total projects found: ${projects.length}`);
    console.log(`   Successfully imported: ${imported}`);
    console.log(`   Skipped (duplicates): ${skipped}`);
    console.log(`   Errors: ${errors}`);
    console.log('============================================================\n');

    if (imported > 0) {
      console.log('✅ Projects have been imported successfully!');
      console.log('   You can now view them in the admin portal at /admin/projects\n');
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
importProjects();

