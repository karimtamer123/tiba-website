const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'tiba_website',
};

const projectRoot = path.join(__dirname, '..', '..'); // D:\Downloads\tiba

// Category mapping
const categoryMap = {
    'air-handling-units': 'air-handling-units',
    'chillers': 'chillers',
    'cooling-towers': 'cooling-towers',
    'fan-coil-units': 'fan-coil-units',
    'variable-refrigerant-flow': 'variable-refrigerant-flow',
    'air-outlets-dampers': 'air-outlets-dampers',
    'pumps': 'pumps'
};

async function updateProductSubcategories() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✓ Connected to MySQL database');
        console.log(`  Database: ${dbConfig.database} on ${dbConfig.host}\n`);

        // Get all products that need subcategory updates
        const [products] = await connection.execute(
            'SELECT id, name, description, category, subcategory FROM products ORDER BY category, name'
        );

        console.log(`📋 Found ${products.length} products to check\n`);
        
        // Show sample of current subcategories
        console.log('📊 Sample of current subcategories:');
        products.slice(0, 5).forEach(p => {
            console.log(`   "${p.name}" (${p.category}): "${p.subcategory || 'null'}"`);
        });
        console.log('');

        // Process each product category file to build a mapping
        const productFiles = [
            'air-handling-units.html',
            'chillers.html',
            'cooling-towers.html',
            'fan-coil-units.html',
            'variable-refrigerant-flow.html',
            'air-outlets-dampers.html',
            'pumps.html'
        ];

        let updatedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const product of products) {
            try {
                // Force update all products to re-extract subcategories
                // (Comment out the skip check to force update all)
                // if (product.subcategory && product.subcategory.trim() !== '') {
                //     skippedCount++;
                //     continue;
                // }
                
                console.log(`🔍 Processing: "${product.name}" (Category: ${product.category}, Current Subcategory: "${product.subcategory || 'null'}")`);

                const categoryKey = product.category;
                // Find the filename from categoryMap
                const mapKey = Object.keys(categoryMap).find(key => categoryMap[key] === categoryKey);
                const filename = mapKey ? mapKey + '.html' : categoryKey + '.html';
                const filePath = path.join(projectRoot, filename);

                if (!fs.existsSync(filePath)) {
                    console.warn(`⚠️  File not found for product "${product.name}": ${filename}`);
                    errorCount++;
                    continue;
                }

                const htmlContent = fs.readFileSync(filePath, 'utf-8');

                // Find the product by name in the HTML (use a more flexible search)
                // Try exact match first, then partial match
                let productMatch = null;
                let productIndex = -1;
                
                // Escape special regex characters but allow for variations
                const productNameEscaped = product.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                
                // Try exact match
                productMatch = htmlContent.match(new RegExp(`<h3[^>]*class="product-name"[^>]*>${productNameEscaped}<\\/h3>`, 'i'));
                if (productMatch) {
                    productIndex = productMatch.index;
                } else {
                    // Try partial match (first 20 characters)
                    const partialName = product.name.substring(0, 20).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    productMatch = htmlContent.match(new RegExp(`<h3[^>]*class="product-name"[^>]*>[^<]*${partialName}[^<]*<\\/h3>`, 'i'));
                    if (productMatch) {
                        productIndex = productMatch.index;
                    }
                }
                
                if (productIndex === -1) {
                    console.warn(`⚠️  Product "${product.name}" not found in ${filename}`);
                    errorCount++;
                    continue;
                }
                
                // Find the parent section
                const sectionStart = htmlContent.lastIndexOf('<div id="', productIndex);
                const sectionEnd = htmlContent.indexOf('"', sectionStart + 9);
                let sectionId = null;
                if (sectionStart !== -1 && sectionEnd !== -1) {
                    sectionId = htmlContent.substring(sectionStart + 9, sectionEnd);
                }

                // Find section header
                const sectionHeaderMatch = htmlContent.substring(Math.max(0, productIndex - 2000), productIndex)
                    .match(/<h2[^>]*class="brand-title"[^>]*>([^<]+)<\/h2>/);
                let sectionTitle = sectionHeaderMatch ? sectionHeaderMatch[1].trim() : null;

                // Extract subcategory using the same logic as import script
                let subcategory = null;

                // For Pumps: Extract from description line "Application: ..."
                if (categoryKey === 'pumps' && product.description) {
                    const appMatch = product.description.match(/Application:\s*([^|]+)/i);
                    if (appMatch) {
                        subcategory = appMatch[1].trim();
                    }
                }
                
                // For Pumps: Also try to extract from product name if description doesn't have it
                if (!subcategory && categoryKey === 'pumps') {
                    const nameLower = product.name.toLowerCase();
                    if (nameLower.includes('fire fighting') || nameLower.includes('fire')) {
                        subcategory = 'Fire Fighting';
                    } else if (nameLower.includes('hvac')) {
                        subcategory = 'HVAC';
                    } else if (nameLower.includes('irrigation')) {
                        subcategory = 'Irrigation';
                    } else if (nameLower.includes('submersible')) {
                        subcategory = 'Submersible';
                    } else if (nameLower.includes('pressure')) {
                        subcategory = 'Pressure Boosters';
                    } else if (nameLower.includes('deep well')) {
                        subcategory = 'Deep Well';
                    }
                }

                // For Chillers: Extract from section ID
                if (!subcategory && categoryKey === 'chillers' && sectionId && sectionId.includes('-products')) {
                    const idParts = sectionId.replace('-products', '').split('-');
                    subcategory = idParts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
                }

                // For Cooling Towers: Extract from section ID
                if (!subcategory && categoryKey === 'cooling-towers' && sectionId && sectionId.includes('-products')) {
                    const idParts = sectionId.replace('-products', '').split('-');
                    subcategory = idParts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
                }

                // For Air Handling Units: Extract from section ID or product name
                if (!subcategory && categoryKey === 'air-handling-units') {
                    if (sectionId && sectionId.includes('-product')) {
                        // Don't use brand as subcategory - these are brands, not product types
                        // For AHU, subcategory might be "Modular" or "Energy-Efficient" from the name
                        const nameLower = product.name.toLowerCase();
                        if (nameLower.includes('modular')) {
                            subcategory = 'Modular';
                        } else if (nameLower.includes('energy-efficient') || nameLower.includes('energy efficient')) {
                            subcategory = 'Energy-Efficient';
                        }
                    }
                }
                
                // For Air Outlets & Dampers: Extract from product name
                if (!subcategory && categoryKey === 'air-outlets-dampers') {
                    const nameLower = product.name.toLowerCase();
                    if (nameLower.includes('diffuser')) {
                        if (nameLower.includes('swirl')) {
                            subcategory = 'Swirl Diffusers';
                        } else if (nameLower.includes('linear')) {
                            subcategory = 'Linear Diffusers';
                        } else {
                            subcategory = 'Diffusers';
                        }
                    } else if (nameLower.includes('grille')) {
                        if (nameLower.includes('fixed')) {
                            subcategory = 'Fixed Grilles';
                        } else if (nameLower.includes('adjustable')) {
                            subcategory = 'Adjustable Grilles';
                        } else {
                            subcategory = 'Grilles';
                        }
                    } else if (nameLower.includes('damper')) {
                        if (nameLower.includes('control')) {
                            subcategory = 'Control Dampers';
                        } else if (nameLower.includes('fire') || nameLower.includes('smoke')) {
                            subcategory = 'Fire & Smoke Dampers';
                        } else {
                            subcategory = 'Dampers';
                        }
                    }
                }
                
                // For Fan Coil Units: Extract from product name
                if (!subcategory && categoryKey === 'fan-coil-units') {
                    const nameLower = product.name.toLowerCase();
                    if (nameLower.includes('dcu')) {
                        subcategory = 'DCU Series';
                    } else if (nameLower.includes('cr-a') || nameLower.includes('cr a')) {
                        subcategory = 'CR-A Series';
                    }
                }
                
                // For Variable Refrigerant Flow: Extract from product name
                if (!subcategory && categoryKey === 'variable-refrigerant-flow') {
                    const nameLower = product.name.toLowerCase();
                    if (nameLower.includes('dvm')) {
                        subcategory = 'DVM S Series';
                    }
                }

                // Try from section title
                if (!subcategory && sectionTitle) {
                    const categoryWords = ['Chillers', 'Cooling Towers', 'Pumps', 'Air Handling Units', 'Fan Coil Units', 'Variable Refrigerant Flow', 'Systems'];
                    let cleanTitle = sectionTitle;
                    for (const word of categoryWords) {
                        cleanTitle = cleanTitle.replace(new RegExp(`\\s*${word}\\s*$`, 'i'), '');
                    }
                    if (cleanTitle && cleanTitle !== sectionTitle && cleanTitle.trim().length > 0) {
                        subcategory = cleanTitle.trim();
                    }
                }

                // Try from product name or description
                if (!subcategory) {
                    const subcategoryPatterns = [
                        { pattern: /(Water-Cooled|Water Cooled)\s+(Centrifugal|Screw)/i, extract: (m) => m[0] },
                        { pattern: /(Air-Cooled|Air Cooled)\s+(Screw|Scroll|Magnetic)/i, extract: (m) => m[0] },
                        { pattern: /(Centrifugal|Screw|Scroll|Absorption|Magnetic Bearing)/i, extract: (m) => m[1] },
                        { pattern: /(Open Type|Closed Type|Evaporative Condensers)/i, extract: (m) => m[1] },
                        { pattern: /(Fire Fighting|HVAC|Irrigation|Submersible|Pressure Boosters)/i, extract: (m) => m[1] }
                    ];

                    const searchText = `${product.name} ${product.description || ''}`;
                    for (const { pattern, extract } of subcategoryPatterns) {
                        const match = searchText.match(pattern);
                        if (match) {
                            subcategory = extract(match);
                            break;
                        }
                    }
                }

                if (subcategory) {
                    await connection.execute(
                        'UPDATE products SET subcategory = ? WHERE id = ?',
                        [subcategory, product.id]
                    );
                    console.log(`✅ Updated: "${product.name}" -> Subcategory: "${subcategory}"`);
                    updatedCount++;
                } else {
                    console.warn(`⚠️  Could not determine subcategory for: "${product.name}"`);
                    errorCount++;
                }

            } catch (error) {
                console.error(`❌ Error updating product "${product.name}":`, error.message);
                errorCount++;
            }
        }

        console.log('\n============================================================');
        console.log('📊 UPDATE SUMMARY:');
        console.log(`   Total products checked: ${products.length}`);
        console.log(`   Successfully updated: ${updatedCount}`);
        console.log(`   Skipped (already had subcategory): ${skippedCount}`);
        console.log(`   Errors/Could not determine: ${errorCount}`);
        console.log('============================================================\n');

        if (updatedCount > 0) {
            console.log('✅ Product subcategories have been updated successfully!');
        }

    } catch (error) {
        console.error('Fatal error during update:', error);
    } finally {
        if (connection) connection.end();
    }
}

updateProductSubcategories();

