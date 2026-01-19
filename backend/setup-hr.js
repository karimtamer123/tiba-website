const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'tiba_website',
};

async function setupHR() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✓ Connected to MySQL database');
        console.log(`  Database: ${dbConfig.database} on ${dbConfig.host}\n`);

        // Read and execute migration
        const migrationPath = path.join(__dirname, 'database', 'migrations', '003_create_hr_tables.sql');
        console.log('📄 Reading migration file...');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        // Split by semicolons and execute each statement
        const statements = migrationSQL.split(';').filter(s => s.trim().length > 0);
        
        for (const statement of statements) {
            if (statement.trim()) {
                await connection.execute(statement);
            }
        }
        
        console.log('✅ Database tables created successfully\n');

        // Create default HR user
        const defaultUsername = 'hr';
        const defaultPassword = 'hr123'; // Change this in production!
        
        // Check if HR user already exists
        const [existing] = await connection.execute(
            'SELECT id FROM hr_users WHERE username = ?',
            [defaultUsername]
        );

        if (existing.length > 0) {
            console.log(`⚠️  HR user "${defaultUsername}" already exists. Skipping user creation.`);
        } else {
            const hashedPassword = await bcrypt.hash(defaultPassword, 10);
            await connection.execute(
                'INSERT INTO hr_users (username, password) VALUES (?, ?)',
                [defaultUsername, hashedPassword]
            );
            console.log('✅ Default HR user created:');
            console.log(`   Username: ${defaultUsername}`);
            console.log(`   Password: ${defaultPassword}`);
            console.log('   ⚠️  Please change the password after first login!\n');
        }

        // Ensure uploads/applications directory exists
        const applicationsDir = path.join(__dirname, 'uploads', 'applications');
        if (!fs.existsSync(applicationsDir)) {
            fs.mkdirSync(applicationsDir, { recursive: true });
            console.log('✅ Created uploads/applications directory\n');
        }

        console.log('============================================================');
        console.log('✅ HR System Setup Complete!');
        console.log('============================================================\n');
        console.log('Next steps:');
        console.log('1. Access HR login at: http://localhost:3000/hr-login.html');
        console.log('2. Login with the default credentials (or create a new HR user)');
        console.log('3. Applications submitted through apply.html will appear in the HR portal');
        console.log('');

    } catch (error) {
        console.error('❌ Error during HR setup:', error);
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log('   (Tables may already exist - this is okay)');
        }
    } finally {
        if (connection) connection.end();
    }
}

setupHR();

