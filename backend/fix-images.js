const fs = require('fs');
const path = require('path');
const envPath = path.join(__dirname, '.env');
require('dotenv').config({ path: envPath });
const pool = require('./config/database');

async function fixImages() {
  try {
    console.log('🔍 Finding image files and fixing paths...\n');
    
    // Get all slideshow images from database
    const [slides] = await pool.execute(
      'SELECT id, title, image_path FROM slideshow_images'
    );
    
    console.log(`Found ${slides.length} slideshow image(s) in database\n`);
    
    const backendDir = __dirname;
    const projectRoot = path.join(backendDir, '..'); // Parent directory
    const uploadsDir = path.join(backendDir, 'uploads', 'slideshow');
    const indexBackgroundDir = path.join(projectRoot, 'indexbackground'); // Root level indexbackground
    
    // Ensure uploads/slideshow directory exists
    if (!fs.existsSync(path.join(backendDir, 'uploads'))) {
      fs.mkdirSync(path.join(backendDir, 'uploads'), { recursive: true });
    }
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Create indexbackground subdirectory in uploads/slideshow
    const targetIndexBackgroundDir = path.join(uploadsDir, 'indexbackground');
    if (!fs.existsSync(targetIndexBackgroundDir)) {
      fs.mkdirSync(targetIndexBackgroundDir, { recursive: true });
    }
    
    console.log(`📁 Source directory: ${indexBackgroundDir}`);
    console.log(`📁 Target directory: ${targetIndexBackgroundDir}\n`);
    
    let fixed = 0;
    let moved = 0;
    let notFound = [];
    
    for (const slide of slides) {
      const dbPath = slide.image_path || '';
      console.log(`\n📄 Slide ID ${slide.id}: "${slide.title}"`);
      console.log(`   Database path: ${dbPath}`);
      
      // Try to find the file in various locations
      let sourceFile = null;
      let targetPath = null;
      let newDbPath = null;
      
      // Get filename from database path
      const filename = path.basename(dbPath.replace(/^\//, ''));
      
      // Possible locations to check (prioritize root indexbackground)
      const possibleLocations = [
        // Location 1: Root level indexbackground/ (most likely)
        path.join(indexBackgroundDir, filename),
        // Location 2: backend/indexbackground/...
        path.join(backendDir, dbPath.replace(/^\//, '')),
        // Location 3: backend/uploads/indexbackground/...
        path.join(backendDir, 'uploads', dbPath.replace(/^\//, '')),
        // Location 4: backend/uploads/slideshow/indexbackground/...
        path.join(targetIndexBackgroundDir, filename),
        // Location 5: Just the filename in various places
        path.join(backendDir, filename),
        path.join(uploadsDir, filename),
      ];
      
      // Also try without leading / from root
      if (dbPath.startsWith('/')) {
        possibleLocations.push(path.join(projectRoot, dbPath.substring(1)));
      }
      
      // Check each possible location
      for (const location of possibleLocations) {
        if (fs.existsSync(location)) {
          sourceFile = location;
          console.log(`   ✅ Found file at: ${location}`);
          break;
        }
      }
      
      if (!sourceFile) {
        console.log(`   ❌ File not found in any expected location`);
        notFound.push({ id: slide.id, title: slide.title, path: dbPath });
        continue;
      }
      
      // Determine target location and new DB path
      // Put everything in uploads/slideshow/indexbackground/
      const fileBasename = path.basename(sourceFile);
      
      // Target path: uploads/slideshow/indexbackground/filename.jpg
      newDbPath = `/uploads/slideshow/indexbackground/${fileBasename}`;
      targetPath = path.join(targetIndexBackgroundDir, fileBasename);
      
      // Move file if it's not already in the target location
      if (sourceFile !== targetPath) {
        try {
          fs.copyFileSync(sourceFile, targetPath);
          console.log(`   📦 Copied to: ${targetPath}`);
          moved++;
        } catch (err) {
          console.log(`   ⚠️  Error copying file: ${err.message}`);
          continue;
        }
      } else {
        console.log(`   ✓ File already in correct location`);
      }
      
      // Update database path
      if (newDbPath !== dbPath) {
        await pool.execute(
          'UPDATE slideshow_images SET image_path = ? WHERE id = ?',
          [newDbPath, slide.id]
        );
        console.log(`   ✏️  Updated database path to: ${newDbPath}`);
        fixed++;
      } else {
        console.log(`   ✓ Database path already correct`);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY:');
    console.log(`   Total slides: ${slides.length}`);
    console.log(`   Files moved/copied: ${moved}`);
    console.log(`   Database paths updated: ${fixed}`);
    console.log(`   Files not found: ${notFound.length}`);
    
    if (notFound.length > 0) {
      console.log('\n❌ Files not found:');
      notFound.forEach(item => {
        console.log(`   - ID ${item.id}: ${item.title} (${item.path})`);
      });
    }
    
    console.log('\n✅ Done! Images should now be accessible at:');
    console.log('   http://localhost:3000/uploads/slideshow/...');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

// Run the fix
fixImages();

