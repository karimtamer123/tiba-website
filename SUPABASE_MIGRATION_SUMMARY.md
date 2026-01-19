# Supabase Migration Summary

## Files Created

1. **`supabase-schema.sql`** - Complete SQL schema with:
   - `jobs` table (id, created_at, title, department, location, type, description, is_active)
   - `applicants` table (id, created_at, full_name, email, phone, message, cv_url, job_id)
   - Row Level Security (RLS) policies for public and admin access
   - Indexes for performance

2. **`js/supabaseClient.js`** - Supabase client initialization
   - Imports config from `js/config.js`
   - Exports Supabase client using @supabase/supabase-js v2

3. **`js/career.js`** - Careers page functionality
   - Fetches active jobs from Supabase on page load
   - Renders jobs dynamically
   - Handles job card expansion/collapse
   - Application form submission with CV upload to Supabase Storage
   - Works with both careers.html and apply.html

4. **`js/admin.js`** - Admin panel for job management
   - Email/password authentication via Supabase Auth
   - Admin role verification (checks profiles.role='admin')
   - Create/Edit/Delete jobs
   - Activate/Deactivate jobs
   - View applicants table with job details
   - Logout functionality

## Files Modified

1. **`careers.html`**
   - Removed all demo job cards (Supply Chain Manager, Business Development Executive, Sales Representative, Marketing Specialist)
   - Added empty `#careersGrid` container (jobs loaded dynamically)
   - Added `#status` container for messages
   - Added Supabase CDN script
   - Added module script: `/js/career.js`
   - Removed old localStorage-based job rendering logic

2. **`admin.html`**
   - Added Supabase CDN script
   - Added module script: `/js/admin.js`
   - Note: Existing admin infrastructure remains for backward compatibility

3. **`apply.html`**
   - Added Supabase CDN script
   - Added hidden `jobId` input field
   - Added module script: `/js/career.js` to handle form submission

## SQL Schema to Run in Supabase

**IMPORTANT:** Run the SQL from `supabase-schema.sql` in your Supabase SQL Editor before deploying.

The SQL creates:
- `jobs` table with all required columns
- `applicants` table with foreign key to jobs
- RLS policies for public and admin access
- Performance indexes

## Storage Bucket Setup

**IMPORTANT:** Create a storage bucket named "cvs" in Supabase Dashboard:
1. Go to Storage in Supabase Dashboard
2. Create new bucket: "cvs"
3. Set to Public (for CV downloads)
4. Optional: Configure file size limits and allowed MIME types (application/pdf)

## Environment Variables

The Supabase configuration is already in `js/config.js`:
- `SUPABASE_URL`: "https://wneysqwtpbvedmhzcdoj.supabase.co"
- `SUPABASE_ANON_KEY`: "sb_publishable_FCZEfgKzPjY2JNpAQ_5POg_0pT-JTEw"

## How It Works

### Career Page Flow:
1. Page loads → `career.js` fetches active jobs from Supabase
2. Jobs are rendered dynamically in `#careersGrid`
3. User clicks "Apply Now" → Application form shown/redirected to apply.html
4. User submits application → CV uploaded to Supabase Storage → Applicant record inserted

### Admin Flow:
1. Admin visits admin.html → `admin.js` checks session
2. If not logged in → Shows login form
3. Login → Verifies admin role in profiles table
4. If admin → Shows dashboard with:
   - Create/Edit Job form
   - Jobs list with actions (Edit, Activate/Deactivate, Delete)
   - Applicants table

## Testing Checklist

- [ ] Run SQL schema in Supabase SQL Editor
- [ ] Create "cvs" storage bucket in Supabase
- [ ] Verify RLS policies are active
- [ ] Test public job viewing (careers page should show empty initially)
- [ ] Create test admin user with role='admin' in profiles table
- [ ] Test admin login
- [ ] Create a job in admin panel
- [ ] Verify job appears on careers page
- [ ] Test job application submission
- [ ] Verify CV upload to storage
- [ ] Verify applicant appears in admin panel

## Notes

- The career page shows **zero jobs by default** (as required)
- Jobs only appear after admin creates them
- All data is stored in Supabase (Postgres + Storage)
- No MySQL backend required for careers functionality
- Frontend talks directly to Supabase (serverless)

