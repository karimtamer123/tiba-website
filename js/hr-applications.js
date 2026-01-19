// HR Applications Management
(function() {
'use strict';

const API_BASE = 'http://localhost:3000/api/v1';

let applicationsData = [];
let currentStatusFilter = 'all';
let currentPositionFilter = 'all';
let editingId = null;

// HR API Client
const hrApiClient = {
  getToken() {
    return localStorage.getItem('hrToken');
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const url = `${API_BASE}${endpoint}`;
    
    const defaultOptions = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const mergedOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...(options.headers || {})
      }
    };

    const response = await fetch(url, mergedOptions);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  },

  async getApplications(status = null, position = null, search = null) {
    let endpoint = '/applications';
    const params = [];
    if (status && status !== 'all') params.push(`status=${encodeURIComponent(status)}`);
    if (position && position !== 'all') params.push(`position=${encodeURIComponent(position)}`);
    if (search) params.push(`search=${encodeURIComponent(search)}`);
    if (params.length > 0) endpoint += '?' + params.join('&');
    return this.request(endpoint);
  },

  async getApplication(id) {
    return this.request(`/applications/${id}`);
  },

  async updateApplication(id, data) {
    return this.request(`/applications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteApplication(id) {
    return this.request(`/applications/${id}`, {
      method: 'DELETE'
    });
  },

  async getStats() {
    return this.request('/applications/stats/summary');
  }
};

function init() {
  createLayout();
  setupEventListeners();
  fetchApplications();
  fetchStats();
}

function createLayout() {
  const app = document.getElementById('hr-app');
  if (!app) return;

  app.innerHTML = `
    <div class="hr-container">
      <header class="hr-header">
        <div class="hr-header-content">
          <div class="hr-header-title">
            <h1>HR Portal</h1>
            <p>Job Applications Management</p>
          </div>
          <div class="hr-header-actions">
            <span class="hr-user-name" id="hr-username">HR User</span>
            <button class="admin-btn admin-btn-secondary" onclick="window.HRApplications.logout()">Logout</button>
          </div>
        </div>
      </header>
      
      <main class="hr-main">
        <div class="hr-stats" id="hr-stats">
          ${window.AdminComponents.LoadingSpinner.create().outerHTML}
        </div>
        
        <div class="hr-content">
          <div class="admin-page-header">
            <h2>Job Applications</h2>
            <p>Review and manage job applications</p>
            <div class="admin-page-actions">
              <select id="status-filter" class="admin-select">
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="reviewed">Reviewed</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="rejected">Rejected</option>
                <option value="hired">Hired</option>
              </select>
              <select id="position-filter" class="admin-select">
                <option value="all">All Positions</option>
                <option value="HVAC Engineer">HVAC Engineer</option>
                <option value="Project Manager">Project Manager</option>
                <option value="Sales Engineer">Sales Engineer</option>
                <option value="Technical Support">Technical Support</option>
                <option value="Maintenance Technician">Maintenance Technician</option>
                <option value="Other">Other</option>
              </select>
              <input type="text" id="search-input" class="admin-input" placeholder="Search by name, email, or phone...">
            </div>
          </div>
          <div class="admin-table-container" id="applications-table-container">
            ${window.AdminComponents.LoadingSpinner.create().outerHTML}
          </div>
        </div>
      </main>
    </div>
  `;

  // Update username
  if (window.HRAuth && window.HRAuth.getCurrentUser()) {
    const usernameEl = document.getElementById('hr-username');
    if (usernameEl) {
      usernameEl.textContent = window.HRAuth.getCurrentUser().username || 'HR User';
    }
  }
}

function setupEventListeners() {
  const statusFilter = document.getElementById('status-filter');
  const positionFilter = document.getElementById('position-filter');
  const searchInput = document.getElementById('search-input');

  if (statusFilter) {
    statusFilter.addEventListener('change', (e) => {
      currentStatusFilter = e.target.value;
      fetchApplications();
    });
  }

  if (positionFilter) {
    positionFilter.addEventListener('change', (e) => {
      currentPositionFilter = e.target.value;
      fetchApplications();
    });
  }

  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        fetchApplications();
      }, 300);
    });
  }
}

async function fetchApplications() {
  const container = document.getElementById('applications-table-container');
  if (!container) return;

  try {
    const status = currentStatusFilter === 'all' ? null : currentStatusFilter;
    const position = currentPositionFilter === 'all' ? null : currentPositionFilter;
    const search = document.getElementById('search-input')?.value || null;
    
    const data = await hrApiClient.getApplications(status, position, search);
    applicationsData = data || [];
    renderTable();
  } catch (error) {
    console.error('Error fetching applications:', error);
    container.innerHTML = window.AdminComponents.EmptyState.create(
      'Failed to load applications. Please try again.',
      'Retry',
      () => fetchApplications()
    ).outerHTML;
    window.AdminComponents.Toast.error('Failed to load applications: ' + (error.message || 'Unknown error'));
  }
}

async function fetchStats() {
  const container = document.getElementById('hr-stats');
  if (!container) return;

  try {
    const stats = await hrApiClient.getStats();
    
    container.innerHTML = `
      <div class="hr-stat-card">
        <div class="hr-stat-value">${stats.total || 0}</div>
        <div class="hr-stat-label">Total Applications</div>
      </div>
      <div class="hr-stat-card hr-stat-new">
        <div class="hr-stat-value">${stats.new_count || 0}</div>
        <div class="hr-stat-label">New</div>
      </div>
      <div class="hr-stat-card hr-stat-reviewed">
        <div class="hr-stat-value">${stats.reviewed_count || 0}</div>
        <div class="hr-stat-label">Reviewed</div>
      </div>
      <div class="hr-stat-card hr-stat-shortlisted">
        <div class="hr-stat-value">${stats.shortlisted_count || 0}</div>
        <div class="hr-stat-label">Shortlisted</div>
      </div>
      <div class="hr-stat-card hr-stat-rejected">
        <div class="hr-stat-value">${stats.rejected_count || 0}</div>
        <div class="hr-stat-label">Rejected</div>
      </div>
      <div class="hr-stat-card hr-stat-hired">
        <div class="hr-stat-value">${stats.hired_count || 0}</div>
        <div class="hr-stat-label">Hired</div>
      </div>
    `;
  } catch (error) {
    console.error('Error fetching stats:', error);
    container.innerHTML = '<p style="color: #EF4444;">Failed to load statistics</p>';
  }
}

function renderTable(data = applicationsData) {
  const container = document.getElementById('applications-table-container');
  if (!container) return;

  if (data.length === 0) {
    container.innerHTML = window.AdminComponents.EmptyState.create(
      'No applications found. Applications submitted through the website will appear here.',
      null,
      null
    ).outerHTML;
    return;
  }

  container.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Phone</th>
          <th>Position</th>
          <th>Experience</th>
          <th>Status</th>
          <th>Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${data.map(app => `
          <tr>
            <td><strong>${escapeHtml(app.full_name || '')}</strong></td>
            <td>${escapeHtml(app.email || '')}</td>
            <td>${escapeHtml(app.phone || '')}</td>
            <td>${escapeHtml(app.position || '')}</td>
            <td>${escapeHtml(app.experience || '')}</td>
            <td>
              <span class="admin-badge admin-badge-${getStatusClass(app.status)}">${escapeHtml(app.status || 'new')}</span>
            </td>
            <td>${app.created_at ? new Date(app.created_at).toLocaleDateString() : '-'}</td>
            <td>
              <button class="admin-btn-icon" onclick="window.HRApplications.viewApplication(${app.id})" title="View">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
              <button class="admin-btn-icon admin-btn-danger" onclick="window.HRApplications.deleteApplication(${app.id})" title="Delete">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

function getStatusClass(status) {
  const statusMap = {
    'new': 'info',
    'reviewed': 'warning',
    'shortlisted': 'success',
    'rejected': 'danger',
    'hired': 'success'
  };
  return statusMap[status] || 'info';
}

async function viewApplication(id) {
  try {
    const application = await hrApiClient.getApplication(id);
    openApplicationModal(application);
  } catch (error) {
    console.error('Error fetching application:', error);
    window.AdminComponents.Toast.error('Failed to load application details.');
  }
}

function openApplicationModal(application) {
  editingId = application.id;
  const modal = document.createElement('div');
  modal.className = 'admin-modal-overlay';
  modal.innerHTML = `
    <div class="admin-modal admin-modal-large">
      <div class="admin-modal-header">
        <h3>Application Details</h3>
        <button class="admin-btn-icon" onclick="window.HRApplications.closeApplicationModal()">×</button>
      </div>
      <div class="admin-modal-body">
        <div class="admin-form-group">
          <label>Full Name</label>
          <input type="text" value="${escapeHtml(application.full_name || '')}" readonly style="background: #F8F9FA;">
        </div>
        <div class="admin-form-row">
          <div class="admin-form-group">
            <label>Email</label>
            <input type="email" value="${escapeHtml(application.email || '')}" readonly style="background: #F8F9FA;">
          </div>
          <div class="admin-form-group">
            <label>Phone</label>
            <input type="tel" value="${escapeHtml(application.phone || '')}" readonly style="background: #F8F9FA;">
          </div>
        </div>
        <div class="admin-form-row">
          <div class="admin-form-group">
            <label>Age</label>
            <input type="number" value="${application.age || ''}" readonly style="background: #F8F9FA;">
          </div>
          <div class="admin-form-group">
            <label>Position</label>
            <input type="text" value="${escapeHtml(application.position || '')}" readonly style="background: #F8F9FA;">
          </div>
        </div>
        <div class="admin-form-group">
          <label>Experience</label>
          <input type="text" value="${escapeHtml(application.experience || '')}" readonly style="background: #F8F9FA;">
        </div>
        <div class="admin-form-group">
          <label>Cover Letter</label>
          <textarea rows="4" readonly style="background: #F8F9FA;">${escapeHtml(application.cover_letter || '')}</textarea>
        </div>
        <div class="admin-form-group">
          <label>CV</label>
          <div style="display: flex; align-items: center; gap: 1rem;">
            <a href="http://localhost:3000${application.cv_path}" target="_blank" class="admin-btn admin-btn-secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 0.5rem;">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download CV
            </a>
          </div>
        </div>
        <div class="admin-form-group">
          <label>Status</label>
          <select id="application-status" class="admin-select">
            <option value="new" ${application.status === 'new' ? 'selected' : ''}>New</option>
            <option value="reviewed" ${application.status === 'reviewed' ? 'selected' : ''}>Reviewed</option>
            <option value="shortlisted" ${application.status === 'shortlisted' ? 'selected' : ''}>Shortlisted</option>
            <option value="rejected" ${application.status === 'rejected' ? 'selected' : ''}>Rejected</option>
            <option value="hired" ${application.status === 'hired' ? 'selected' : ''}>Hired</option>
          </select>
        </div>
        <div class="admin-form-group">
          <label>Notes</label>
          <textarea id="application-notes" rows="4" placeholder="Add internal notes about this application...">${escapeHtml(application.notes || '')}</textarea>
        </div>
      </div>
      <div class="admin-modal-footer">
        <button class="admin-btn admin-btn-secondary" onclick="window.HRApplications.closeApplicationModal()">Close</button>
        <button class="admin-btn admin-btn-primary" onclick="window.HRApplications.saveApplication()">Save Changes</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
}

function closeApplicationModal() {
  const modal = document.querySelector('.admin-modal-overlay');
  if (modal) modal.remove();
  editingId = null;
}

async function saveApplication() {
  if (!editingId) return;

  const status = document.getElementById('application-status').value;
  const notes = document.getElementById('application-notes').value;

  try {
    await hrApiClient.updateApplication(editingId, { status, notes });
    window.AdminComponents.Toast.success('Application updated successfully');
    closeApplicationModal();
    await fetchApplications();
    await fetchStats();
  } catch (error) {
    console.error('Error updating application:', error);
    window.AdminComponents.Toast.error(error.message || 'Failed to update application');
  }
}

async function deleteApplication(id) {
  const application = applicationsData.find(a => a.id === id);
  if (!application) return;

  window.AdminComponents.ConfirmDialog.show(
    'Delete Application',
    `Are you sure you want to delete the application from "${application.full_name}"? This action cannot be undone.`,
    async () => {
      try {
        await hrApiClient.deleteApplication(id);
        window.AdminComponents.Toast.success('Application deleted successfully');
        await fetchApplications();
        await fetchStats();
      } catch (error) {
        console.error('Error deleting application:', error);
        window.AdminComponents.Toast.error(error.message || 'Failed to delete application');
      }
    }
  );
}

function logout() {
  if (window.HRAuth) {
    window.HRAuth.logout();
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Export for global access
if (typeof window !== 'undefined') {
  window.HRApplications = {
    init,
    viewApplication,
    closeApplicationModal,
    saveApplication,
    deleteApplication,
    logout,
    fetchApplications,
    fetchStats
  };
}

})(); // End IIFE

