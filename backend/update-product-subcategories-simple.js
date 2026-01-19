const mysql = require('mysql2/promise');

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'tiba_website',
};

async function updateProductSubcategories() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✓ Connected to MySQL database');
        console.log(`  Database: ${dbConfig.database} on ${dbConfig.host}\n`);

        const [products] = await connection.execute(
            'SELECT id, name, description, category, subcategory FROM products ORDER BY category, name'
        );

        console.log(`📋 Found ${products.length} products to update\n`);

        let updatedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;

        for (const product of products) {
            try {
                let subcategory = null;
                const nameLower = product.name.toLowerCase();
                const descLower = (product.description || '').toLowerCase();

                // For Pumps: Extract from description or name
                if (product.category === 'pumps') {
                    // Try description first
                    if (product.description) {
                        const appMatch = product.description.match(/Application:\s*([^|]+)/i);
                        if (appMatch) {
                            subcategory = appMatch[1].trim();
                        }
                    }
                    // Fallback to name patterns
                    if (!subcategory) {
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
                }
                // For Chillers: Extract from name
                else if (product.category === 'chillers') {
                    if (nameLower.includes('water-cooled') || nameLower.includes('water cooled')) {
                        if (nameLower.includes('centrifugal')) {
                            subcategory = 'Water-Cooled Centrifugal';
                        } else if (nameLower.includes('screw')) {
                            subcategory = 'Water-Cooled Screw';
                        }
                    } else if (nameLower.includes('air-cooled') || nameLower.includes('air cooled')) {
                        if (nameLower.includes('screw')) {
                            subcategory = 'Air-Cooled Screw';
                        } else if (nameLower.includes('scroll')) {
                            subcategory = 'Air-Cooled Scroll';
                        } else if (nameLower.includes('magnetic')) {
                            subcategory = 'Air-Cooled Magnetic Bearing';
                        }
                    } else if (nameLower.includes('absorption')) {
                        subcategory = 'Absorption';
                    }
                }
                // For Cooling Towers: Extract from name
                else if (product.category === 'cooling-towers') {
                    if (nameLower.includes('evaporative condenser')) {
                        subcategory = 'Evaporative Condensers';
                    } else if (nameLower.includes('closed circuit') || nameLower.includes('closed-circuit')) {
                        subcategory = 'Closed Type';
                    } else if (nameLower.includes('open') || nameLower.includes('crossflow') || nameLower.includes('axial fan')) {
                        subcategory = 'Open Type';
                    }
                }
                // For Air Handling Units: Extract from name
                else if (product.category === 'air-handling-units') {
                    if (nameLower.includes('modular')) {
                        subcategory = 'Modular';
                    } else if (nameLower.includes('energy-efficient') || nameLower.includes('energy efficient')) {
                        subcategory = 'Energy-Efficient';
                    }
                }
                // For Air Outlets & Dampers: Extract from name
                else if (product.category === 'air-outlets-dampers') {
                    if (nameLower.includes('swirl diffuser')) {
                        subcategory = 'Swirl Diffusers';
                    } else if (nameLower.includes('linear diffuser')) {
                        subcategory = 'Linear Diffusers';
                    } else if (nameLower.includes('fixed grille')) {
                        subcategory = 'Fixed Grilles';
                    } else if (nameLower.includes('adjustable grille')) {
                        subcategory = 'Adjustable Grilles';
                    } else if (nameLower.includes('control damper')) {
                        subcategory = 'Control Dampers';
                    } else if (nameLower.includes('fire') && nameLower.includes('smoke')) {
                        subcategory = 'Fire & Smoke Dampers';
                    }
                }
                // For Fan Coil Units: Extract from name
                else if (product.category === 'fan-coil-units') {
                    if (nameLower.includes('dcu')) {
                        subcategory = 'DCU Series';
                    } else if (nameLower.includes('cr-a') || nameLower.includes('cr a')) {
                        subcategory = 'CR-A Series';
                    }
                }
                // For Variable Refrigerant Flow: Extract from name
                else if (product.category === 'variable-refrigerant-flow') {
                    if (nameLower.includes('dvm')) {
                        subcategory = 'DVM S Series';
                    }
                }

                if (subcategory) {
                    await connection.execute(
                        'UPDATE products SET subcategory = ? WHERE id = ?',
                        [subcategory, product.id]
                    );
                    console.log(`✅ Updated: "${product.name}" -> "${subcategory}"`);
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
        console.log(`   Skipped: ${skippedCount}`);
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

