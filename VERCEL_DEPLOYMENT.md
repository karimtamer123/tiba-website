# Vercel Deployment Guide

This guide will help you deploy the Tiba Manzalawi Group website to Vercel.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. A MySQL database (hosted on services like PlanetScale, Railway, AWS RDS, or your own server)
3. Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Prepare Your Repository

1. Make sure all your code is committed to Git
2. Push your code to GitHub/GitLab/Bitbucket

## Step 2: Install Vercel CLI (Optional but Recommended)

```bash
npm i -g vercel
```

## Step 3: Configure Environment Variables

You need to set up environment variables in Vercel:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

```
DB_HOST=your-database-host
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=your-database-name
JWT_SECRET=your-secure-random-jwt-secret
NODE_ENV=production
```

**Important:** 
- Replace all values with your actual database credentials
- `JWT_SECRET` should be a long, random string for security
- These variables will be encrypted and available to your serverless functions

## Step 4: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click **Add New Project**
3. Import your Git repository
4. Vercel will automatically detect the configuration
5. Click **Deploy**

### Option B: Deploy via CLI

```bash
# In your project root directory
vercel

# For production deployment
vercel --prod
```

## Step 5: Database Configuration

### Important Notes:

1. **Database Hosting:** Vercel doesn't host MySQL databases. You'll need:
   - A cloud MySQL service (PlanetScale, Railway, AWS RDS, DigitalOcean, etc.)
   - Or a database server accessible from the internet

2. **Database Connection:**
   - Make sure your database allows connections from Vercel's IP addresses
   - Many cloud providers have security groups/firewalls - configure them to allow Vercel

3. **Database Setup:**
   - Run your database migration scripts if you have them
   - The database schema should be created before deployment

## Step 6: File Uploads

**Important:** File uploads in serverless functions have limitations:

1. **Temporary Storage:** Files uploaded to serverless functions are stored in `/tmp` (limited to 512MB)
2. **Permanent Storage:** For permanent file storage, consider:
   - **Vercel Blob Storage** (recommended for Vercel)
   - **AWS S3**
   - **Cloudinary**
   - **External CDN**

3. **Update Upload Routes:** You may need to modify your upload routes to use external storage instead of local file system.

## Step 7: Verify Deployment

1. Visit your deployed URL (provided by Vercel)
2. Check the health endpoint: `https://your-domain.vercel.app/api/v1/health`
3. Test your admin/login functionality
4. Verify database connections are working

## Troubleshooting

### Common Issues:

1. **Database Connection Errors:**
   - Verify environment variables are set correctly
   - Check database firewall allows Vercel IPs
   - Verify database credentials

2. **File Upload Issues:**
   - Serverless functions have temporary file storage
   - Consider migrating to cloud storage (S3, Vercel Blob, etc.)

3. **Build Errors:**
   - Check that all dependencies are in `package.json`
   - Verify Node.js version compatibility
   - Check build logs in Vercel dashboard

4. **API Routes Not Working:**
   - Ensure `api/index.js` exists
   - Check `vercel.json` configuration
   - Verify route patterns match

## File Structure

The deployment expects this structure:
```
.
├── api/
│   └── index.js          # Serverless function entry point
├── backend/
│   ├── routes/           # API routes
│   ├── config/           # Database config
│   └── uploads/          # Upload directory (consider external storage)
├── vercel.json           # Vercel configuration
├── package.json          # Dependencies
└── *.html                # Static HTML files
```

## Next Steps

1. Set up a custom domain (optional)
2. Configure SSL (automatic with Vercel)
3. Set up monitoring and logging
4. Consider setting up a staging environment

## Support

For issues:
- Check Vercel logs: Dashboard → Your Project → Deployments → View Function Logs
- Vercel Documentation: https://vercel.com/docs
- Serverless Functions: https://vercel.com/docs/functions

