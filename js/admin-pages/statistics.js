// Statistics Page
(function() {
'use strict';

let statisticsData = [];
let editingId = null;

async function loadStatistics() {
  const content = window.AdminLayout.getContentArea();
  if (!content) return;

  content.innerHTML = `
    <div class="admin-page-header">
      <h2>Statistics</h2>
      <p>Manage website statistics and metrics</p>
      <button class="admin-btn admin-btn-primary" id="add-stat-btn">Add Statistic</button>
    </div>
    <div class="admin-table-container" id="statistics-table-container">
      ${window.AdminComponents.LoadingSpinner.create().outerHTML}
    </div>
  `;

  await fetchStatistics();
  setupEventListeners();
}

async function fetchStatistics() {
  const container = document.getElementById('statistics-table-container');
  try {
    const data = await apiClient.getStatistics();
    statisticsData = data;
    renderTable();
  } catch (error) {
    container.innerHTML = window.AdminComponents.EmptyState.create(
      'Failed to load statistics. Please try again.',
      'Retry',
      () => fetchStatistics()
    ).outerHTML;
    window.AdminComponents.Toast.error('Failed to load statistics');
  }
}

function renderTable() {
  const container = document.getElementById('statistics-table-container');
  if (!container) return;

  if (statisticsData.length === 0) {
    container.innerHTML = window.AdminComponents.EmptyState.create(
      'No statistics yet. Add your first statistic to get started.',
      'Add Statistic',
      () => openStatModal()
    ).outerHTML;
    return;
  }

  container.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Label</th>
          <th>Value</th>
          <th>Suffix</th>
          <th>Description</th>
          <th>Order</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${statisticsData.map(stat => `
          <tr>
            <td>${escapeHtml(stat.label || '')}</td>
            <td><strong>${escapeHtml(stat.value || '')}</strong></td>
            <td>${escapeHtml(stat.suffix || '')}</td>
            <td>${escapeHtml(stat.description || '')}</td>
            <td>${stat.display_order || 0}</td>
            <td>
              <button class="admin-btn-icon" onclick="editStatistic(${stat.id})" title="Edit">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="admin-btn-icon admin-btn-danger" onclick="deleteStatistic(${stat.id})" title="Delete">
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

function setupEventListeners() {
  const addBtn = document.getElementById('add-stat-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => openStatModal());
  }
}

function openStatModal(stat = null) {
  editingId = stat ? stat.id : null;
  const modal = document.createElement('div');
  modal.className = 'admin-modal-overlay';
  modal.innerHTML = `
    <div class="admin-modal">
      <div class="admin-modal-header">
        <h3>${editingId ? 'Edit' : 'Add'} Statistic</h3>
        <button class="admin-btn-icon" onclick="closeStatModal()">×</button>
      </div>
      <form id="stat-form" class="admin-modal-body">
        <div class="admin-form-group">
          <label>Label *</label>
          <input type="text" id="stat-label" value="${stat ? escapeHtml(stat.label) : ''}" required>
        </div>
        <div class="admin-form-group">
          <label>Value *</label>
          <input type="text" id="stat-value" value="${stat ? escapeHtml(stat.value) : ''}" required>
        </div>
        <div class="admin-form-group">
          <label>Suffix</label>
          <input type="text" id="stat-suffix" value="${stat ? escapeHtml(stat.suffix || '') : ''}" placeholder="e.g., +, %, years">
        </div>
        <div class="admin-form-group">
          <label>Description</label>
          <textarea id="stat-description" rows="3">${stat ? escapeHtml(stat.description || '') : ''}</textarea>
        </div>
        <div class="admin-form-group">
          <label>Display Order</label>
          <input type="number" id="stat-order" value="${stat ? stat.display_order || 0 : ''}" min="0">
        </div>
      </form>
      <div class="admin-modal-footer">
        <button class="admin-btn admin-btn-secondary" onclick="closeStatModal()">Cancel</button>
        <button class="admin-btn admin-btn-primary" onclick="saveStatistic()">Save</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector('#stat-form').addEventListener('submit', (e) => {
    e.preventDefault();
    saveStatistic();
  });
}

function closeStatModal() {
  const modal = document.querySelector('.admin-modal-overlay');
  if (modal) modal.remove();
  editingId = null;
}

async function saveStatistic() {
  const label = document.getElementById('stat-label').value;
  const value = document.getElementById('stat-value').value;
  const suffix = document.getElementById('stat-suffix').value;
  const description = document.getElementById('stat-description').value;
  const order = parseInt(document.getElementById('stat-order').value) || 0;

  if (!label || !value) {
    window.AdminComponents.Toast.error('Label and value are required');
    return;
  }

  try {
    const data = { label, value, suffix, description, display_order: order };
    if (editingId) {
      await apiClient.updateStatistic(editingId, data);
      window.AdminComponents.Toast.success('Statistic updated successfully');
    } else {
      await apiClient.createStatistic(data);
      window.AdminComponents.Toast.success('Statistic created successfully');
    }
    closeStatModal();
    // Refresh statistics - check if we're in the index editor or statistics page
    const editor = document.getElementById('stats-editor');
    if (editor && editor.style.display !== 'none') {
      // We're in index editor - refresh that
      if (window.loadStatsEditor) {
        await window.loadStatsEditor(editor);
      }
    }
    // Always refresh the statistics page view if container exists
    const statsContainer = document.getElementById('statistics-table-container');
    if (statsContainer) {
      await fetchStatistics();
    }
  } catch (error) {
    window.AdminComponents.Toast.error(error.message || 'Failed to save statistic');
  }
}

function editStatistic(id) {
  const stat = statisticsData.find(s => s.id === id);
  if (stat) openStatModal(stat);
}

function deleteStatistic(id) {
  const stat = statisticsData.find(s => s.id === id);
  if (!stat) return;

  window.AdminComponents.ConfirmDialog.show(
    `Are you sure you want to delete "${stat.label}"? This action cannot be undone.`,
    async () => {
      try {
        await apiClient.deleteStatistic(id);
        window.AdminComponents.Toast.success('Statistic deleted successfully');
        await fetchStatistics();
      } catch (error) {
        window.AdminComponents.Toast.error(error.message || 'Failed to delete statistic');
      }
    }
  );
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Export for router
if (typeof window !== 'undefined') {
  window.loadStatistics = loadStatistics;
  window.editStatistic = editStatistic;
  window.deleteStatistic = deleteStatistic;
  window.closeStatModal = closeStatModal;
  window.saveStatistic = saveStatistic;
  window.openStatModal = openStatModal;
}

})(); // End IIFE

