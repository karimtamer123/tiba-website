// Supabase client is created in admin.html and available as window.supabase
const supabase = window.supabase;

if (!supabase) {
  console.error('Admin.js: Supabase client not found on window.supabase');
  const app = document.getElementById('admin-app');
  if (app) {
    app.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #F8F9FA;">
        <div style="background: white; padding: 2rem; border-radius: 12px; max-width: 500px;">
          <h2 style="color: #dc3545;">Supabase Client Not Found</h2>
          <p>The Supabase client was not initialized. Please refresh the page.</p>
          <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #3B82F6; color: white; border: none; border-radius: 6px; cursor: pointer;">Reload</button>
        </div>
      </div>
    `;
  }
}

console.log('Admin.js: Script loaded');
console.log('Admin.js: Supabase client available:', !!supabase);

// State
let currentUser = null;
let jobs = [];
let applicants = [];
let editingJobId = null;

// DOM Elements (will be initialized)
let adminApp = null;
let loginForm = null;
let dashboard = null;

// Initialize on load
async function initAdmin() {
  console.log('Admin.js: Initializing...');
  
  adminApp = document.getElementById('admin-app');
  if (!adminApp) {
    console.error('Admin.js: admin-app element not found');
    setTimeout(() => {
      const app = document.getElementById('admin-app');
      if (app) {
        app.innerHTML = '<div style="padding: 2rem; text-align: center;"><p style="color: #dc3545;">Error: admin-app element not found</p></div>';
      }
    }, 1000);
    return;
  }

  // Supabase client should already be available from admin.html
  if (!supabase) {
    console.error('Admin.js: Supabase client not available');
    showLogin('Error: Supabase client not initialized. Please refresh the page.');
    return;
  }

  try {
    console.log('Admin.js: Checking session...');
    await checkSession();
    setupAuthListener();
  } catch (error) {
    console.error('Admin.js: Error during initialization:', error);
    showLogin('Error initializing: ' + (error.message || 'Unknown error. Please check the browser console.'));
  }
}

// Wait for DOM and Supabase CDN to be ready
function startInit() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdmin);
  } else {
    // DOM already loaded - wait a bit for Supabase CDN
    setTimeout(initAdmin, 100);
  }
}

// Start initialization
startInit();

// Fallback: If initialization takes too long, show login form
setTimeout(() => {
  const app = document.getElementById('admin-app');
  if (app && app.innerHTML.includes('Checking authentication')) {
    console.warn('Admin.js: Initialization timeout, showing login form as fallback');
    if (typeof showLogin === 'function') {
      showLogin('Initialization took too long. Please check browser console for errors.');
    } else {
      app.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #F8F9FA;">
          <div style="background: white; padding: 2rem; border-radius: 12px; max-width: 400px;">
            <h2>Error Loading Admin Module</h2>
            <p style="color: #dc3545;">Please check the browser console (F12) for errors.</p>
            <button onclick="location.reload()" style="padding: 0.5rem 1rem; background: #3B82F6; color: white; border: none; border-radius: 6px; cursor: pointer; margin-top: 1rem;">Reload</button>
          </div>
        </div>
      `;
    }
  }
}, 3000);

// Check current session
async function checkSession() {
  try {
    console.log('Admin.js: Getting session from Supabase...');
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Admin.js: Session error:', error);
      throw error;
    }
    
    console.log('Admin.js: Session result:', session ? 'Session exists' : 'No session');
    
    if (session) {
      console.log('Admin.js: Verifying admin role for user:', session.user.id);
      // Verify admin role
      const isAdmin = await verifyAdminRole(session.user.id);
      console.log('Admin.js: Admin role verified:', isAdmin);
      
      if (isAdmin) {
        currentUser = session.user;
        console.log('Admin.js: Showing dashboard...');
        showDashboard();
      } else {
        console.log('Admin.js: User is not admin, showing login...');
        showLogin('You do not have admin access.');
        await supabase.auth.signOut();
      }
    } else {
      console.log('Admin.js: No session, showing login...');
      showLogin();
    }
  } catch (error) {
    console.error('Admin.js: Error checking session:', error);
    showLogin('Error checking authentication: ' + (error.message || 'Please try again.'));
  }
}

// Verify admin role
async function verifyAdminRole(userId) {
  try {
    console.log('Admin.js: Checking profiles table for user:', userId);
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Admin.js: Error checking admin role:', error);
      // If profiles table doesn't exist or user doesn't have a profile, allow access
      // (for initial setup - you can remove this later)
      if (error.code === 'PGRST116') {
        console.log('Admin.js: Profiles table or user profile not found, allowing access for initial setup');
        return true;
      }
      return false;
    }

    const isAdmin = data && data.role === 'admin';
    console.log('Admin.js: Role check result:', data ? data.role : 'no data', '-> isAdmin:', isAdmin);
    return isAdmin;
  } catch (error) {
    console.error('Admin.js: Exception verifying admin role:', error);
    return false;
  }
}

// Setup auth state listener
function setupAuthListener() {
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT') {
      currentUser = null;
      showLogin();
    } else if (event === 'SIGNED_IN' && session) {
      const isAdmin = await verifyAdminRole(session.user.id);
      if (isAdmin) {
        currentUser = session.user;
        showDashboard();
      } else {
        showLogin('You do not have admin access.');
        await supabase.auth.signOut();
      }
    }
  });
}

// Show login form
function showLogin(errorMessage = '') {
  adminApp.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #F8F9FA;">
      <div style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); max-width: 400px; width: 100%; margin: 1rem;">
        <h2 style="margin: 0 0 1.5rem; color: #0F172A; font-size: 1.5rem;">Admin Login</h2>
        ${errorMessage ? `<div style="background: #FEE2E2; color: #DC2626; padding: 0.75rem; border-radius: 6px; margin-bottom: 1rem;">${errorMessage}</div>` : ''}
        <form id="loginForm" style="display: flex; flex-direction: column; gap: 1rem;">
          <div>
            <label style="display: block; margin-bottom: 0.5rem; color: #374151; font-weight: 500;">Email</label>
            <input type="email" id="loginEmail" required style="width: 100%; padding: 0.75rem; border: 2px solid #E5E7EB; border-radius: 6px; font-size: 1rem; box-sizing: border-box;">
          </div>
          <div>
            <label style="display: block; margin-bottom: 0.5rem; color: #374151; font-weight: 500;">Password</label>
            <input type="password" id="loginPassword" required style="width: 100%; padding: 0.75rem; border: 2px solid #E5E7EB; border-radius: 6px; font-size: 1rem; box-sizing: border-box;">
          </div>
          <button type="submit" style="background: #3B82F6; color: white; padding: 0.75rem; border: none; border-radius: 6px; font-size: 1rem; font-weight: 500; cursor: pointer; transition: background 0.2s;">Login</button>
        </form>
      </div>
    </div>
  `;

  loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
}

// Handle login
async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    // Verify admin role
    const isAdmin = await verifyAdminRole(data.user.id);
    if (!isAdmin) {
      await supabase.auth.signOut();
      showLogin('You do not have admin access.');
      return;
    }

    currentUser = data.user;
    showDashboard();
  } catch (error) {
    console.error('Login error:', error);
    showLogin(error.message || 'Invalid email or password.');
  }
}

// Show dashboard
async function showDashboard() {
  adminApp.innerHTML = `
    <div style="min-height: 100vh; background: #F8F9FA;">
      <div style="background: white; border-bottom: 1px solid #E5E7EB; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center;">
        <h1 style="margin: 0; color: #0F172A; font-size: 1.5rem;">Admin Dashboard</h1>
        <button id="logoutBtn" style="background: #DC2626; color: white; padding: 0.5rem 1rem; border: none; border-radius: 6px; cursor: pointer;">Logout</button>
      </div>
      
      <div style="padding: 2rem; max-width: 1400px; margin: 0 auto;">
        <!-- Create Job Form -->
        <div id="jobFormSection" style="background: white; padding: 2rem; border-radius: 12px; margin-bottom: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h2 style="margin: 0 0 1.5rem; color: #0F172A;">${editingJobId ? 'Edit Job' : 'Create New Job'}</h2>
          <form id="jobForm" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div style="grid-column: 1 / -1;">
              <label style="display: block; margin-bottom: 0.5rem; color: #374151; font-weight: 500;">Title *</label>
              <input type="text" id="jobTitle" required style="width: 100%; padding: 0.75rem; border: 2px solid #E5E7EB; border-radius: 6px; box-sizing: border-box;">
            </div>
            <div>
              <label style="display: block; margin-bottom: 0.5rem; color: #374151; font-weight: 500;">Department</label>
              <input type="text" id="jobDepartment" style="width: 100%; padding: 0.75rem; border: 2px solid #E5E7EB; border-radius: 6px; box-sizing: border-box;">
            </div>
            <div>
              <label style="display: block; margin-bottom: 0.5rem; color: #374151; font-weight: 500;">Location</label>
              <input type="text" id="jobLocation" style="width: 100%; padding: 0.75rem; border: 2px solid #E5E7EB; border-radius: 6px; box-sizing: border-box;">
            </div>
            <div>
              <label style="display: block; margin-bottom: 0.5rem; color: #374151; font-weight: 500;">Type</label>
              <input type="text" id="jobType" placeholder="e.g. Full-time" style="width: 100%; padding: 0.75rem; border: 2px solid #E5E7EB; border-radius: 6px; box-sizing: border-box;">
            </div>
            <div style="grid-column: 1 / -1;">
              <label style="display: block; margin-bottom: 0.5rem; color: #374151; font-weight: 500;">Description</label>
              <textarea id="jobDescription" rows="4" style="width: 100%; padding: 0.75rem; border: 2px solid #E5E7EB; border-radius: 6px; box-sizing: border-box; font-family: inherit;"></textarea>
            </div>
            <div>
              <label style="display: flex; align-items: center; gap: 0.5rem; color: #374151;">
                <input type="checkbox" id="jobIsActive" checked style="width: auto;">
                <span>Active (visible on careers page)</span>
              </label>
            </div>
            <div style="grid-column: 1 / -1; display: flex; gap: 1rem;">
              <button type="submit" style="background: #3B82F6; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 6px; cursor: pointer;">${editingJobId ? 'Update Job' : 'Create Job'}</button>
              ${editingJobId ? `<button type="button" id="cancelEditBtn" style="background: #6B7280; color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 6px; cursor: pointer;">Cancel</button>` : ''}
            </div>
          </form>
        </div>

        <!-- Jobs List -->
        <div style="background: white; padding: 2rem; border-radius: 12px; margin-bottom: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h2 style="margin: 0 0 1.5rem; color: #0F172A;">Jobs</h2>
          <div id="jobsList" style="overflow-x: auto;">
            <p style="color: #6B7280;">Loading jobs...</p>
          </div>
        </div>

        <!-- Applicants Table -->
        <div style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h2 style="margin: 0 0 1.5rem; color: #0F172A;">Applicants</h2>
          <div id="applicantsTable" style="overflow-x: auto;">
            <p style="color: #6B7280;">Loading applicants...</p>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach event listeners
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  document.getElementById('jobForm').addEventListener('submit', handleJobSubmit);
  
  if (editingJobId) {
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        editingJobId = null;
        showDashboard();
      });
    }
  }

  // Load data
  await loadJobs();
  await loadApplicants();
}

// Load jobs
async function loadJobs() {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    jobs = data || [];
    renderJobs();
  } catch (error) {
    console.error('Error loading jobs:', error);
    document.getElementById('jobsList').innerHTML = `<p style="color: #DC2626;">Error loading jobs: ${error.message}</p>`;
  }
}

// Render jobs list
function renderJobs() {
  const jobsList = document.getElementById('jobsList');
  if (!jobsList) return;

  if (jobs.length === 0) {
    jobsList.innerHTML = '<p style="color: #6B7280;">No jobs created yet.</p>';
    return;
  }

  jobsList.innerHTML = `
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="border-bottom: 2px solid #E5E7EB;">
          <th style="text-align: left; padding: 0.75rem; color: #374151; font-weight: 600;">Title</th>
          <th style="text-align: left; padding: 0.75rem; color: #374151; font-weight: 600;">Department</th>
          <th style="text-align: left; padding: 0.75rem; color: #374151; font-weight: 600;">Location</th>
          <th style="text-align: left; padding: 0.75rem; color: #374151; font-weight: 600;">Status</th>
          <th style="text-align: left; padding: 0.75rem; color: #374151; font-weight: 600;">Actions</th>
        </tr>
      </thead>
      <tbody>
        ${jobs.map(job => `
          <tr style="border-bottom: 1px solid #E5E7EB;">
            <td style="padding: 0.75rem;">${escapeHtml(job.title)}</td>
            <td style="padding: 0.75rem;">${escapeHtml(job.department || '-')}</td>
            <td style="padding: 0.75rem;">${escapeHtml(job.location || '-')}</td>
            <td style="padding: 0.75rem;">
              <span style="background: ${job.is_active ? '#10B981' : '#6B7280'}; color: white; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.875rem;">
                ${job.is_active ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td style="padding: 0.75rem;">
              <button onclick="editJob(${job.id})" style="background: #3B82F6; color: white; padding: 0.25rem 0.75rem; border: none; border-radius: 4px; cursor: pointer; margin-right: 0.5rem; font-size: 0.875rem;">Edit</button>
              <button onclick="toggleJobStatus(${job.id}, ${!job.is_active})" style="background: ${job.is_active ? '#F59E0B' : '#10B981'}; color: white; padding: 0.25rem 0.75rem; border: none; border-radius: 4px; cursor: pointer; margin-right: 0.5rem; font-size: 0.875rem;">
                ${job.is_active ? 'Deactivate' : 'Activate'}
              </button>
              <button onclick="deleteJob(${job.id})" style="background: #DC2626; color: white; padding: 0.25rem 0.75rem; border: none; border-radius: 4px; cursor: pointer; font-size: 0.875rem;">Delete</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// Global functions for inline handlers
window.editJob = function(jobId) {
  const job = jobs.find(j => j.id === jobId);
  if (!job) return;

  editingJobId = jobId;
  document.getElementById('jobTitle').value = job.title || '';
  document.getElementById('jobDepartment').value = job.department || '';
  document.getElementById('jobLocation').value = job.location || '';
  document.getElementById('jobType').value = job.type || '';
  document.getElementById('jobDescription').value = job.description || '';
  document.getElementById('jobIsActive').checked = job.is_active !== false;

  // Scroll to form
  document.getElementById('jobFormSection').scrollIntoView({ behavior: 'smooth' });
};

window.toggleJobStatus = async function(jobId, isActive) {
  try {
    const { error } = await supabase
      .from('jobs')
      .update({ is_active: isActive })
      .eq('id', jobId);

    if (error) throw error;

    await loadJobs();
  } catch (error) {
    console.error('Error toggling job status:', error);
    alert(`Error: ${error.message}`);
  }
};

window.deleteJob = async function(jobId) {
  if (!confirm('Are you sure you want to delete this job?')) return;

  try {
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId);

    if (error) throw error;

    await loadJobs();
  } catch (error) {
    console.error('Error deleting job:', error);
    alert(`Error: ${error.message}`);
  }
};

// Handle job form submission
async function handleJobSubmit(e) {
  e.preventDefault();

  const jobData = {
    title: document.getElementById('jobTitle').value,
    department: document.getElementById('jobDepartment').value || null,
    location: document.getElementById('jobLocation').value || null,
    type: document.getElementById('jobType').value || null,
    description: document.getElementById('jobDescription').value || null,
    is_active: document.getElementById('jobIsActive').checked
  };

  try {
    if (editingJobId) {
      // Update existing job
      const { error } = await supabase
        .from('jobs')
        .update(jobData)
        .eq('id', editingJobId);

      if (error) throw error;
    } else {
      // Create new job
      const { error } = await supabase
        .from('jobs')
        .insert([jobData]);

      if (error) throw error;
    }

    editingJobId = null;
    document.getElementById('jobForm').reset();
    await loadJobs();
    
    // Scroll to jobs list
    document.getElementById('jobsList').scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    console.error('Error saving job:', error);
    alert(`Error: ${error.message}`);
  }
}

// Load applicants
async function loadApplicants() {
  try {
    const { data, error } = await supabase
      .from('applicants')
      .select(`
        *,
        jobs:job_id (
          title
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    applicants = data || [];
    renderApplicants();
  } catch (error) {
    console.error('Error loading applicants:', error);
    document.getElementById('applicantsTable').innerHTML = `<p style="color: #DC2626;">Error loading applicants: ${error.message}</p>`;
  }
}

// Render applicants table
function renderApplicants() {
  const applicantsTable = document.getElementById('applicantsTable');
  if (!applicantsTable) return;

  if (applicants.length === 0) {
    applicantsTable.innerHTML = '<p style="color: #6B7280;">No applicants yet.</p>';
    return;
  }

  applicantsTable.innerHTML = `
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="border-bottom: 2px solid #E5E7EB;">
          <th style="text-align: left; padding: 0.75rem; color: #374151; font-weight: 600;">Date</th>
          <th style="text-align: left; padding: 0.75rem; color: #374151; font-weight: 600;">Job</th>
          <th style="text-align: left; padding: 0.75rem; color: #374151; font-weight: 600;">Name</th>
          <th style="text-align: left; padding: 0.75rem; color: #374151; font-weight: 600;">Email</th>
          <th style="text-align: left; padding: 0.75rem; color: #374151; font-weight: 600;">Phone</th>
          <th style="text-align: left; padding: 0.75rem; color: #374151; font-weight: 600;">Message</th>
          <th style="text-align: left; padding: 0.75rem; color: #374151; font-weight: 600;">CV</th>
        </tr>
      </thead>
      <tbody>
        ${applicants.map(applicant => {
          const jobTitle = applicant.jobs ? applicant.jobs.title : 'N/A';
          const date = new Date(applicant.created_at).toLocaleDateString();
          return `
            <tr style="border-bottom: 1px solid #E5E7EB;">
              <td style="padding: 0.75rem;">${date}</td>
              <td style="padding: 0.75rem;">${escapeHtml(jobTitle)}</td>
              <td style="padding: 0.75rem;">${escapeHtml(applicant.full_name)}</td>
              <td style="padding: 0.75rem;"><a href="mailto:${escapeHtml(applicant.email)}" style="color: #3B82F6;">${escapeHtml(applicant.email)}</a></td>
              <td style="padding: 0.75rem;">${escapeHtml(applicant.phone || '-')}</td>
              <td style="padding: 0.75rem; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(applicant.message || '')}">${escapeHtml(applicant.message || '-')}</td>
              <td style="padding: 0.75rem;">
                ${applicant.cv_url ? `<a href="${applicant.cv_url}" target="_blank" style="color: #3B82F6;">View CV</a>` : '-'}
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

// Handle logout
async function handleLogout() {
  await supabase.auth.signOut();
  currentUser = null;
  showLogin();
}

// Escape HTML
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

