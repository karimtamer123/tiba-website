# Tiba Manzalawi Group - Backend API

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

1. Copy `.env.example` to `.env`
2. Update database credentials in `.env`:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=tiba_website
   JWT_SECRET=your-secret-key-change-this
   PORT=3000
   ```

### 3. Setup Database

Run the migration files in order:
```bash
mysql -u root -p < database/migrations/001_create_tables.sql
mysql -u root -p < database/migrations/002_insert_initial_data.sql
```

Or use MySQL Workbench/phpMyAdmin to run the SQL files manually.

### 4. Create Admin User

After setting up the database, create an admin user:

**Option 1: Via API** (Recommended)
```bash
curl -X POST http://localhost:3000/api/v1/admin/create-admin \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'
```

**Option 2: Via SQL** (Password must be bcrypt hashed)
```sql
INSERT INTO admin_users (username, password) VALUES 
('admin', '$2b$10$...'); -- Use bcrypt to hash your password
```

### 5. Start Server

```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/v1/admin/login` - Login
- `GET /api/v1/admin/verify` - Verify token
- `POST /api/v1/admin/create-admin` - Create admin user

### Slideshow
- `GET /api/v1/slideshow` - Get all slideshow images
- `GET /api/v1/slideshow/:id` - Get single slide
- `POST /api/v1/slideshow` - Upload new slide (auth required)
- `PUT /api/v1/slideshow/:id` - Update slide (auth required)
- `DELETE /api/v1/slideshow/:id` - Delete slide (auth required)
- `POST /api/v1/slideshow/reorder` - Reorder slides (auth required)

### Statistics
- `GET /api/v1/statistics` - Get all statistics
- `GET /api/v1/statistics/:id` - Get single stat
- `POST /api/v1/statistics` - Create stat (auth required)
- `PUT /api/v1/statistics/:id` - Update stat (auth required)
- `DELETE /api/v1/statistics/:id` - Delete stat (auth required)

### Projects
- `GET /api/v1/projects` - Get all projects
- `GET /api/v1/projects?category=all&featured=true` - Filter projects
- `GET /api/v1/projects/:id` - Get single project
- `GET /api/v1/projects/featured/list` - Get featured projects
- `POST /api/v1/projects` - Create project (auth required)
- `PUT /api/v1/projects/:id` - Update project (auth required)
- `DELETE /api/v1/projects/:id` - Delete project (auth required)

### Products
- `GET /api/v1/products` - Get all products
- `GET /api/v1/products?category=cooling-towers` - Filter by category
- `GET /api/v1/products/:id` - Get single product
- `POST /api/v1/products` - Create product (auth required)
- `PUT /api/v1/products/:id` - Update product (auth required)
- `DELETE /api/v1/products/:id` - Delete product (auth required)

### News
- `GET /api/v1/news` - Get all news
- `GET /api/v1/news?featured=true` - Get featured news
- `GET /api/v1/news/:id` - Get single article
- `GET /api/v1/news/featured/list` - Get featured news (limit 3)
- `POST /api/v1/news` - Create article (auth required)
- `PUT /api/v1/news/:id` - Update article (auth required)
- `DELETE /api/v1/news/:id` - Delete article (auth required)

## File Upload

Images are uploaded to `backend/uploads/` with subdirectories:
- `slideshow/` - Hero slideshow images
- `products/` - Product images
- `projects/` - Project images
- `news/` - News article images

The server serves uploaded files statically at `/uploads/...`

## Authentication

All admin endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <token>
```

Tokens expire after 24 hours.

## Frontend Integration

The frontend uses `js/api-client.js` for API calls. Update `API_BASE_URL` in that file if your backend runs on a different port/domain.

## Notes

- Image uploads support: jpeg, jpg, png, gif, webp
- Max file size: 10MB (configurable in `.env`)
- All timestamps are stored in UTC
- Foreign key relationships use CASCADE delete

