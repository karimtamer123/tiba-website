# Vercel Deployment Checklist

## Pre-Deployment Setup

### ✅ Completed
- [x] Created `vercel.json` with clean routing
- [x] Updated script paths to use absolute paths (`/js/...`)
- [x] Created `.gitignore` file
- [x] Removed localhost references from admin/careers functionality
- [x] Supabase configuration in `/js/config.js` (anon key only - safe for public)

## Step 1: Push to GitHub

1. **Initialize Git repository** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit - ready for Vercel deployment"
   ```

2. **Create a new repository on GitHub**:
   - Go to https://github.com/new
   - Name it (e.g., `tiba-website`)
   - Don't initialize with README/license
   - Click "Create repository"

3. **Push to GitHub**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git branch -M main
   git push -u origin main
   ```

## Step 2: Deploy to Vercel

1. **Go to Vercel Dashboard**:
   - Visit https://vercel.com/dashboard
   - Sign in or create account

2. **Import Project**:
   - Click "Add New Project"
   - Click "Import Git Repository"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Project**:
   - **Framework Preset**: Other (or leave as default)
   - **Root Directory**: `./` (root)
   - **Build Command**: Leave empty (no build step)
   - **Output Directory**: Leave empty (static files)
   - **Install Command**: Leave empty (no dependencies to install)

4. **Environment Variables** (Optional - only if needed):
   - No environment variables needed for Supabase (anon key is in code)
   - If you add backend later, add them here

5. **Deploy**:
   - Click "Deploy"
   - Wait for deployment to complete

## Step 3: Test After Deployment

### URLs to Test:

1. **Homepage**:
   - `https://your-project.vercel.app/`
   - `https://your-project.vercel.app/index.html`

2. **Admin Panel**:
   - `https://your-project.vercel.app/admin`
   - `https://your-project.vercel.app/admin.html`
   - ✅ Should show login form (not stuck on "Checking authentication")
   - ✅ Login with Supabase credentials
   - ✅ Create a job
   - ✅ View applicants

3. **Careers Page**:
   - `https://your-project.vercel.app/careers`
   - `https://your-project.vercel.app/careers.html`
   - ✅ Should show empty state (no demo jobs)
   - ✅ After creating job in admin, it should appear here
   - ✅ Click "Apply Now" and submit application

4. **Other Pages**:
   - `https://your-project.vercel.app/about`
   - `https://your-project.vercel.app/products`
   - `https://your-project.vercel.app/projects`
   - `https://your-project.vercel.app/contact`

### Functionality Tests:

- [ ] Admin login works (Supabase Auth)
- [ ] Can create/edit/delete jobs in admin
- [ ] Jobs appear on careers page
- [ ] Application form submits successfully
- [ ] CV uploads to Supabase Storage
- [ ] Applicants appear in admin panel
- [ ] All static assets load (images, CSS, JS)

## Important Notes

### Supabase Setup Required:
1. **Run SQL Schema**: Execute `supabase-schema.sql` in Supabase SQL Editor
2. **Create Storage Bucket**: 
   - Go to Storage in Supabase Dashboard
   - Create bucket named "cvs"
   - Set to Public
3. **Create Admin User**:
   - Create user in Supabase Auth
   - Add record to `profiles` table with `role='admin'`

### File Structure:
```
/
├── vercel.json          ✅ Configured
├── .gitignore           ✅ Created
├── index.html
├── admin.html          ✅ Uses /js/admin.js
├── careers.html        ✅ Uses /js/career.js
├── js/
│   ├── config.js       ✅ Supabase config
│   ├── supabaseClient.js ✅ Uses /js/config.js
│   ├── admin.js        ✅ Uses window.supabase
│   └── career.js       ✅ Uses /js/supabaseClient.js
└── ... (other files)
```

### No Backend Required:
- ✅ All admin/careers functionality uses Supabase directly
- ✅ No localhost or backend API calls
- ✅ Static site - works on Vercel without server

## Troubleshooting

### If admin page shows "Checking authentication":
- Check browser console for errors
- Verify Supabase URL and key in `/js/config.js`
- Ensure Supabase project is active

### If jobs don't appear:
- Check Supabase dashboard - verify jobs table exists
- Check RLS policies are set correctly
- Verify `is_active = true` for jobs

### If applications don't submit:
- Check Supabase Storage bucket "cvs" exists and is public
- Check browser console for upload errors
- Verify RLS policy allows INSERT on applicants table

## Post-Deployment

1. **Set Custom Domain** (optional):
   - Go to Project Settings → Domains
   - Add your custom domain

2. **Monitor Deployments**:
   - Check Vercel dashboard for deployment status
   - View function logs if needed

3. **Update Supabase URLs** (if needed):
   - If you change Supabase project, update `/js/config.js`

