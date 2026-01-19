const mysql = require('mysql2/promise');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'tiba_website',
};

async function updateSubcategories() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✓ Connected to MySQL\n');

        // Update Pumps subcategories from description
        await connection.execute(`
            UPDATE products 
            SET subcategory = TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(description, 'Application:', -1), '|', 1))
            WHERE category = 'pumps' 
            AND description LIKE '%Application:%'
            AND (subcategory IS NULL OR subcategory = '' OR subcategory IN ('Xylem', 'Lowara', 'Bell & Gossett', 'Flygt'))
        `);
        console.log('✅ Updated pumps from description');

        // Update Chillers subcategories
        await connection.execute(`
            UPDATE products 
            SET subcategory = CASE
                WHEN LOWER(name) LIKE '%water-cooled%centrifugal%' OR LOWER(name) LIKE '%water cooled%centrifugal%' THEN 'Water-Cooled Centrifugal'
                WHEN LOWER(name) LIKE '%water-cooled%screw%' OR LOWER(name) LIKE '%water cooled%screw%' THEN 'Water-Cooled Screw'
                WHEN LOWER(name) LIKE '%air-cooled%screw%' OR LOWER(name) LIKE '%air cooled%screw%' THEN 'Air-Cooled Screw'
                WHEN LOWER(name) LIKE '%air-cooled%scroll%' OR LOWER(name) LIKE '%air cooled%scroll%' THEN 'Air-Cooled Scroll'
                WHEN LOWER(name) LIKE '%air-cooled%magnetic%' OR LOWER(name) LIKE '%air cooled%magnetic%' THEN 'Air-Cooled Magnetic Bearing'
                WHEN LOWER(name) LIKE '%absorption%' THEN 'Absorption'
            END
            WHERE category = 'chillers'
            AND (subcategory IS NULL OR subcategory = '' OR subcategory = 'DB')
        `);
        console.log('✅ Updated chillers');

        // Update Cooling Towers subcategories
        await connection.execute(`
            UPDATE products 
            SET subcategory = CASE
                WHEN LOWER(name) LIKE '%evaporative condenser%' THEN 'Evaporative Condensers'
                WHEN LOWER(name) LIKE '%closed circuit%' OR LOWER(name) LIKE '%closed-circuit%' THEN 'Closed Type'
                WHEN LOWER(name) LIKE '%open%' OR LOWER(name) LIKE '%crossflow%' OR LOWER(name) LIKE '%axial fan%' THEN 'Open Type'
            END
            WHERE category = 'cooling-towers'
            AND (subcategory IS NULL OR subcategory = '' OR subcategory = 'Evapco')
        `);
        console.log('✅ Updated cooling towers');

        // Update Air Handling Units subcategories
        await connection.execute(`
            UPDATE products 
            SET subcategory = CASE
                WHEN LOWER(name) LIKE '%modular%' THEN 'Modular'
                WHEN LOWER(name) LIKE '%energy-efficient%' OR LOWER(name) LIKE '%energy efficient%' THEN 'Energy-Efficient'
            END
            WHERE category = 'air-handling-units'
            AND (subcategory IS NULL OR subcategory = '' OR subcategory IN ('Trox', 'Saiver'))
        `);
        console.log('✅ Updated air handling units');

        // Update Air Outlets & Dampers subcategories
        await connection.execute(`
            UPDATE products 
            SET subcategory = CASE
                WHEN LOWER(name) LIKE '%swirl diffuser%' THEN 'Swirl Diffusers'
                WHEN LOWER(name) LIKE '%linear diffuser%' THEN 'Linear Diffusers'
                WHEN LOWER(name) LIKE '%fixed grille%' THEN 'Fixed Grilles'
                WHEN LOWER(name) LIKE '%adjustable grille%' THEN 'Adjustable Grilles'
                WHEN LOWER(name) LIKE '%control damper%' THEN 'Control Dampers'
                WHEN (LOWER(name) LIKE '%fire%' AND LOWER(name) LIKE '%smoke%') THEN 'Fire & Smoke Dampers'
            END
            WHERE category = 'air-outlets-dampers'
            AND (subcategory IS NULL OR subcategory = '' OR subcategory = 'Trox')
        `);
        console.log('✅ Updated air outlets & dampers');

        // Update Fan Coil Units subcategories
        await connection.execute(`
            UPDATE products 
            SET subcategory = CASE
                WHEN LOWER(name) LIKE '%dcu%' THEN 'DCU Series'
                WHEN LOWER(name) LIKE '%cr-a%' OR LOWER(name) LIKE '%cr a%' THEN 'CR-A Series'
            END
            WHERE category = 'fan-coil-units'
            AND (subcategory IS NULL OR subcategory = '' OR subcategory IN ('Trox', 'Saiver'))
        `);
        console.log('✅ Updated fan coil units');

        // Update Variable Refrigerant Flow subcategories
        await connection.execute(`
            UPDATE products 
            SET subcategory = 'DVM S Series'
            WHERE category = 'variable-refrigerant-flow'
            AND LOWER(name) LIKE '%dvm%'
            AND (subcategory IS NULL OR subcategory = '' OR subcategory = 'Samsung')
        `);
        console.log('✅ Updated variable refrigerant flow');

        // Show summary
        const [summary] = await connection.execute(`
            SELECT category, COUNT(*) as total, 
                   SUM(CASE WHEN subcategory IS NOT NULL AND subcategory != '' THEN 1 ELSE 0 END) as with_subcategory
            FROM products 
            GROUP BY category
        `);

        console.log('\n============================================================');
        console.log('📊 SUMMARY BY CATEGORY:');
        summary.forEach(row => {
            console.log(`   ${row.category}: ${row.with_subcategory}/${row.total} have subcategories`);
        });
        console.log('============================================================\n');

        console.log('✅ All subcategories updated!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) connection.end();
    }
}

updateSubcategories();

