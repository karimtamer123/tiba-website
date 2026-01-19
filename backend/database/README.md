# Database Setup Instructions

## Prerequisites
- MySQL server installed and running
- Node.js and npm installed

## Setup Steps

1. **Configure Environment Variables**
   - Copy `.env.example` to `.env` in the backend directory
   - Update database credentials in `.env`:
     ```
     DB_HOST=localhost
     DB_USER=root
     DB_PASSWORD=your_password
     DB_NAME=tiba_website
     ```

2. **Run Migrations**
   - Option 1: Use MySQL command line
     ```bash
     mysql -u root -p < backend/database/migrations/001_create_tables.sql
     mysql -u root -p < backend/database/migrations/002_insert_initial_data.sql
     ```
   
   - Option 2: Use MySQL Workbench or phpMyAdmin
     - Open each migration file and run the SQL commands

3. **Create Initial Admin User**
   - After running migrations, you can create an admin user via API:
     ```bash
     POST http://localhost:3000/api/v1/admin/create-admin
     Body: {
       "username": "admin",
       "password": "your_password"
     }
     ```
   - Or manually insert using SQL (password must be hashed with bcrypt)

4. **Verify Database Connection**
   - Start the backend server: `npm start`
   - Check health endpoint: `GET http://localhost:3000/api/v1/health`

## Database Schema

- **admin_users**: Admin authentication
- **slideshow_images**: Hero slideshow images for index page
- **statistics**: Company statistics displayed on index page
- **projects**: Project portfolio
- **project_images**: Images for projects (multiple per project)
- **products**: Product catalog
- **product_images**: Images for products (multiple per product)
- **news**: News articles

## Notes

- All tables have `created_at` and `updated_at` timestamps
- Foreign key relationships use CASCADE delete for images
- Image paths are stored as relative paths from the backend/uploads directory
- Key features for products are stored as JSON arrays

