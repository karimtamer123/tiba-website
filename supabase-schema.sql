-- ============================================
-- Supabase Schema for Careers System
-- ============================================
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  title TEXT NOT NULL,
  department TEXT,
  location TEXT,
  type TEXT,  -- e.g. "Full-time", "Part-time", "Contract"
  description TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL
);

-- 2. Create applicants table
CREATE TABLE IF NOT EXISTS applicants (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  cv_url TEXT,
  job_id BIGINT REFERENCES jobs(id) ON DELETE CASCADE
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for jobs table

-- Public can SELECT active jobs only
CREATE POLICY "Public can view active jobs"
ON jobs
FOR SELECT
TO public
USING (is_active = true);

-- Only admins can INSERT jobs
CREATE POLICY "Admins can insert jobs"
ON jobs
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Only admins can UPDATE jobs
CREATE POLICY "Admins can update jobs"
ON jobs
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Only admins can DELETE jobs
CREATE POLICY "Admins can delete jobs"
ON jobs
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 5. RLS Policies for applicants table

-- Public can INSERT applicants (submit applications)
CREATE POLICY "Public can submit applications"
ON applicants
FOR INSERT
TO public
WITH CHECK (true);

-- Only admins can SELECT applicants
CREATE POLICY "Admins can view applicants"
ON applicants
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- 6. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applicants_job_id ON applicants(job_id);
CREATE INDEX IF NOT EXISTS idx_applicants_created_at ON applicants(created_at DESC);

-- ============================================
-- Storage Bucket Setup (run in Supabase Dashboard)
-- ============================================
-- Go to Storage in Supabase Dashboard
-- Create a new bucket named "cvs"
-- Set it to Public (for reading CVs)
-- Optional: Set file size limits and allowed MIME types (e.g., application/pdf)

