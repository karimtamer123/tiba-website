import { supabase } from '/js/supabaseClient.js';

// State
let selectedJobId = null;

// DOM Elements
const jobsList = document.getElementById('jobsList') || document.getElementById('careersGrid');
const applicationForm = document.getElementById('applicationForm');
const statusDiv = document.getElementById('status');

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  await loadJobs();
  setupJobCardHandlers();
});

// Fetch and render jobs
async function loadJobs() {
  try {
    statusDiv && (statusDiv.innerHTML = 'Loading jobs...');
    
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (statusDiv) statusDiv.innerHTML = '';

    if (!jobs || jobs.length === 0) {
      if (jobsList) {
        jobsList.innerHTML = '<p style="text-align: center; color: #64748B; padding: 2rem;">No job openings available at the moment. Please check back later.</p>';
      }
      return;
    }

    renderJobs(jobs);
  } catch (error) {
    console.error('Error loading jobs:', error);
    if (statusDiv) {
      statusDiv.innerHTML = `<p style="color: #dc3545;">Error loading jobs: ${error.message}</p>`;
    }
    if (jobsList) {
      jobsList.innerHTML = '<p style="text-align: center; color: #dc3545;">Error loading jobs. Please refresh the page.</p>';
    }
  }
}

// Render jobs list
function renderJobs(jobs) {
  if (!jobsList) return;

  jobsList.innerHTML = jobs.map((job, index) => {
    const chips = [job.type, job.location, job.department].filter(Boolean);
    const chipsHtml = chips.map(c => `<span class="job-chip">${c}</span>`).join('');
    const description = job.description || '';
    const summary = description.length > 140 ? description.slice(0, 140) + '…' : description;
    
    return `
      <div class="job-card" aria-expanded="false" data-job-id="${job.id}">
        <button class="job-toggle" aria-controls="job-details-${job.id}" aria-expanded="false">
          <div class="job-summary">
            <h3>${escapeHtml(job.title)}</h3>
            <p>${escapeHtml(summary)}</p>
          </div>
          <div class="job-right">
            ${chipsHtml ? `<div class="job-meta">${chipsHtml}</div>` : ''}
            <svg class="job-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M6 9l6 6 6-6" stroke="#1A1A1A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </button>
        <div id="job-details-${job.id}" class="job-details" hidden>
          <div class="job-content" style="padding:0">
            <div class="job-section">
              <div class="job-section-title">About the job</div>
              <p>${escapeHtml(description)}</p>
            </div>
            <div class="form-actions" style="padding: 0 0 0.5rem; display: flex; justify-content: flex-end;">
              <button class="job-apply-btn job-apply-small" onclick="showApplicationForm(${job.id}, '${escapeHtml(job.title)}')">Apply Now</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  setupJobCardHandlers();
}

// Setup job card toggle handlers
function setupJobCardHandlers() {
  const jobCards = document.querySelectorAll('.job-card');
  jobCards.forEach(card => {
    const toggle = card.querySelector('.job-toggle');
    const details = card.querySelector('.job-details');
    
    if (toggle && details) {
      toggle.addEventListener('click', () => {
        const isExpanded = card.getAttribute('aria-expanded') === 'true';
        card.setAttribute('aria-expanded', !isExpanded);
        toggle.setAttribute('aria-expanded', !isExpanded);
        if (isExpanded) {
          details.hidden = true;
          details.classList.remove('open');
        } else {
          details.hidden = false;
          details.classList.add('open');
        }
      });
    }
  });
}

// Show application form (called from button onclick)
window.showApplicationForm = function(jobId, jobTitle) {
  selectedJobId = jobId;
  
  if (applicationForm) {
    const jobTitleInput = applicationForm.querySelector('#jobTitle');
    if (jobTitleInput) {
      jobTitleInput.value = jobTitle;
    }
    applicationForm.style.display = 'block';
    applicationForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    // Redirect to apply.html if form not on same page
    window.location.href = `apply.html?job=${encodeURIComponent(jobTitle)}&jobId=${jobId}`;
  }
};

// Handle application form submission
if (applicationForm) {
  applicationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!selectedJobId) {
      showStatus('Please select a job first.', 'error');
      return;
    }

    const formData = new FormData(applicationForm);
    const fullName = formData.get('fullName') || formData.get('full_name');
    const email = formData.get('email');
    const phone = formData.get('phone');
    const message = formData.get('message') || formData.get('coverLetter');
    const cvFile = formData.get('cv') || formData.get('cvFile');

    if (!fullName || !email || !phone) {
      showStatus('Please fill in all required fields.', 'error');
      return;
    }

    try {
      showStatus('Submitting application...', 'info');

      let cvUrl = null;

      // Upload CV if provided
      if (cvFile && cvFile.size > 0) {
        const fileExt = cvFile.name.split('.').pop();
        const fileName = `${selectedJobId}/${Date.now()}_${cvFile.name}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('cvs')
          .upload(fileName, cvFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('cvs')
          .getPublicUrl(fileName);

        cvUrl = urlData.publicUrl;
      }

      // Insert applicant record
      const { data, error } = await supabase
        .from('applicants')
        .insert([
          {
            full_name: fullName,
            email: email,
            phone: phone,
            message: message || null,
            cv_url: cvUrl,
            job_id: selectedJobId
          }
        ])
        .select();

      if (error) throw error;

      showStatus('Application submitted successfully! We will contact you soon.', 'success');
      applicationForm.reset();
      
      // Hide form after 3 seconds
      setTimeout(() => {
        if (applicationForm) applicationForm.style.display = 'none';
      }, 3000);

    } catch (error) {
      console.error('Error submitting application:', error);
      showStatus(`Error submitting application: ${error.message}`, 'error');
    }
  });
}

// Show status message
function showStatus(message, type = 'info') {
  if (!statusDiv) {
    alert(message);
    return;
  }

  const colors = {
    success: '#10b981',
    error: '#dc3545',
    info: '#3b82f6'
  };

  statusDiv.innerHTML = `<p style="color: ${colors[type] || colors.info}; padding: 1rem; background: ${colors[type] || colors.info}15; border-radius: 8px; margin: 1rem 0;">${escapeHtml(message)}</p>`;
  
  if (type === 'success') {
    setTimeout(() => {
      if (statusDiv) statusDiv.innerHTML = '';
    }, 5000);
  }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Also handle URL parameters for apply.html page
if (window.location.pathname.includes('apply.html')) {
  const urlParams = new URLSearchParams(window.location.search);
  const jobTitle = urlParams.get('job');
  const jobId = urlParams.get('jobId');
  
  if (jobTitle) {
    const jobTitleInput = document.getElementById('jobTitle');
    if (jobTitleInput) {
      jobTitleInput.value = jobTitle;
    }
  }
  
  if (jobId) {
    selectedJobId = parseInt(jobId);
    const jobIdInput = document.getElementById('jobId');
    if (jobIdInput) {
      jobIdInput.value = jobId;
    }
  }
  
  // Setup form handler for apply.html
  const form = document.getElementById('applicationForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (!selectedJobId) {
        alert('Please select a job first by clicking "Apply Now" on the careers page.');
        return;
      }

      const formData = new FormData(form);
      const fullName = formData.get('fullName');
      const email = formData.get('email');
      const phone = formData.get('phone');
      const message = formData.get('coverLetter');
      const cvFile = formData.get('cv');

      if (!fullName || !email || !phone) {
        alert('Please fill in all required fields.');
        return;
      }

      if (!cvFile || cvFile.size === 0) {
        alert('Please upload your CV.');
        return;
      }

      try {
        const submitButton = form.querySelector('.submit-btn');
        const originalText = submitButton ? submitButton.textContent : 'Submit';
        if (submitButton) {
          submitButton.disabled = true;
          submitButton.textContent = 'Submitting...';
        }

        // Upload CV
        const fileExt = cvFile.name.split('.').pop();
        const fileName = `${selectedJobId}/${Date.now()}_${cvFile.name}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('cvs')
          .upload(fileName, cvFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('cvs')
          .getPublicUrl(fileName);

        const cvUrl = urlData.publicUrl;

        // Insert applicant record
        const { data, error } = await supabase
          .from('applicants')
          .insert([
            {
              full_name: fullName,
              email: email,
              phone: phone,
              message: message || null,
              cv_url: cvUrl,
              job_id: selectedJobId
            }
          ])
          .select();

        if (error) throw error;

        // Show success message
        const successOverlay = document.getElementById('successOverlay');
        if (successOverlay) {
          successOverlay.style.display = 'flex';
        } else {
          alert('Application submitted successfully! We will contact you soon.');
        }

        // Redirect after 3 seconds
        setTimeout(() => {
          window.location.href = 'application-success.html';
        }, 3000);

      } catch (error) {
        console.error('Error submitting application:', error);
        alert(`Error submitting application: ${error.message}`);
        const submitButton = form.querySelector('.submit-btn');
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.textContent = 'Submit Application';
        }
      }
    });
  }
}

