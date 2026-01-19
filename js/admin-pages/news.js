// News Page
(function() {
'use strict';

let newsData = [];
let editingId = null;
let currentFilter = 'all';

async function loadNews() {
  const content = window.AdminLayout.getContentArea();
  if (!content) return;

  content.innerHTML = `
    <div class="admin-page-header">
      <h2>News</h2>
      <p>Manage news articles and featured content</p>
      <div class="admin-page-actions">
        <select id="filter-select" class="admin-select">
          <option value="all">All News</option>
          <option value="featured">Featured Only</option>
        </select>
        <input type="text" id="search-input" class="admin-input" placeholder="Search news...">
        <button class="admin-btn admin-btn-primary" id="add-news-btn">Add News</button>
      </div>
    </div>
    <div class="admin-table-container" id="news-table-container">
      ${window.AdminComponents.LoadingSpinner.create().outerHTML}
    </div>
  `;

  setupEventListeners();
  await fetchNews();
}

function setupEventListeners() {
  const filterSelect = document.getElementById('filter-select');
  const searchInput = document.getElementById('search-input');
  const addBtn = document.getElementById('add-news-btn');

  if (filterSelect) {
    filterSelect.addEventListener('change', (e) => {
      currentFilter = e.target.value;
      fetchNews();
    });
  }

  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        filterNews(e.target.value);
      }, 300);
    });
  }

  if (addBtn) {
    addBtn.addEventListener('click', () => openNewsModal());
  }
}

async function fetchNews() {
  const container = document.getElementById('news-table-container');
  try {
    const featured = currentFilter === 'featured' ? 'true' : null;
    const data = await apiClient.getNews(featured);
    newsData = data;
    renderTable();
  } catch (error) {
    container.innerHTML = window.AdminComponents.EmptyState.create(
      'Failed to load news. Please try again.',
      'Retry',
      () => fetchNews()
    ).outerHTML;
    window.AdminComponents.Toast.error('Failed to load news');
  }
}

function filterNews(searchTerm) {
  const filtered = newsData.filter(n => 
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (n.content && n.content.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  renderTable(filtered);
}

function renderTable(data = newsData) {
  const container = document.getElementById('news-table-container');
  if (!container) return;

  if (data.length === 0) {
    container.innerHTML = window.AdminComponents.EmptyState.create(
      'No news articles found. Add your first article to get started.',
      'Add News',
      () => openNewsModal()
    ).outerHTML;
    return;
  }

  container.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Image</th>
          <th>Title</th>
          <th>Date</th>
          <th>Featured</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${data.map(article => `
          <tr>
            <td>
              ${article.image_path ? 
                `<img src="http://localhost:3000${article.image_path}" alt="${escapeHtml(article.title)}" class="admin-table-thumb">` :
                '<span class="admin-no-image">No image</span>'
              }
            </td>
            <td><strong>${escapeHtml(article.title || '')}</strong></td>
            <td>${article.date ? new Date(article.date).toLocaleDateString() : '-'}</td>
            <td>${article.is_featured ? '<span class="admin-badge">Featured</span>' : '-'}</td>
            <td>
              <button class="admin-btn-icon" onclick="editNews(${article.id})" title="Edit">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="admin-btn-icon admin-btn-danger" onclick="deleteNews(${article.id})" title="Delete">
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

function openNewsModal(article = null) {
  editingId = article ? article.id : null;
  const modal = document.createElement('div');
  modal.className = 'admin-modal-overlay';
  modal.innerHTML = `
    <div class="admin-modal admin-modal-large">
      <div class="admin-modal-header">
        <h3>${editingId ? 'Edit' : 'Add'} News Article</h3>
        <button class="admin-btn-icon" onclick="closeNewsModal()">×</button>
      </div>
      <form id="news-form" class="admin-modal-body">
        <div class="admin-form-group">
          <label>Title *</label>
          <input type="text" id="news-title" value="${article ? escapeHtml(article.title) : ''}" required>
        </div>
        <div class="admin-form-row">
          <div class="admin-form-group">
            <label>Date *</label>
            <input type="date" id="news-date" value="${article ? (article.date || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0]}" required>
          </div>
          <div class="admin-form-group">
            <label>
              <input type="checkbox" id="news-featured" ${article?.is_featured ? 'checked' : ''}>
              Featured Article
            </label>
          </div>
        </div>
        <div class="admin-form-group">
          <label>Content *</label>
          <textarea id="news-content" rows="8" required>${article ? escapeHtml(article.content || '') : ''}</textarea>
        </div>
        <div class="admin-form-group">
          <label>Image</label>
          <div id="news-image-uploader"></div>
          ${article && article.image_path ? `
            <div class="admin-existing-images">
              <p>Current image:</p>
              <div class="admin-image-item">
                <img src="http://localhost:3000${article.image_path}" alt="News image">
              </div>
            </div>
          ` : ''}
        </div>
      </form>
      <div class="admin-modal-footer">
        <button class="admin-btn admin-btn-secondary" onclick="closeNewsModal()">Cancel</button>
        <button class="admin-btn admin-btn-primary" onclick="saveNews()">Save</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  // Initialize image uploader
  const uploaderContainer = document.getElementById('news-image-uploader');
  if (uploaderContainer) {
    const uploader = window.AdminComponents.ImageUploader.create({ multiple: false, preview: true });
    uploaderContainer.appendChild(uploader.element);
    modal.uploader = uploader;
  }

  modal.querySelector('#news-form').addEventListener('submit', (e) => {
    e.preventDefault();
    saveNews();
  });
}

function closeNewsModal() {
  const modal = document.querySelector('.admin-modal-overlay');
  if (modal) {
    if (modal.uploader) modal.uploader.clear();
    modal.remove();
  }
  editingId = null;
}

async function saveNews() {
  const title = document.getElementById('news-title').value;
  const content = document.getElementById('news-content').value;
  const date = document.getElementById('news-date').value;
  const isFeatured = document.getElementById('news-featured').checked;

  if (!title || !content || !date) {
    window.AdminComponents.Toast.error('Title, content, and date are required');
    return;
  }

  const modal = document.querySelector('.admin-modal-overlay');
  const uploader = modal?.uploader;
  const imageFile = uploader ? (uploader.getFiles()[0] || null) : null;

  try {
    const newsData = { title, content, date, is_featured: isFeatured };
    
    if (editingId) {
      await apiClient.updateNews(editingId, newsData, imageFile);
      window.AdminComponents.Toast.success('News article updated successfully');
    } else {
      await apiClient.createNews(newsData, imageFile);
      window.AdminComponents.Toast.success('News article created successfully');
    }
    closeNewsModal();
    await fetchNews();
  } catch (error) {
    window.AdminComponents.Toast.error(error.message || 'Failed to save news article');
  }
}

async function editNews(id) {
  try {
    const article = await apiClient.getNewsArticle(id);
    openNewsModal(article);
  } catch (error) {
    window.AdminComponents.Toast.error('Failed to load news article');
  }
}

async function deleteNews(id) {
  const article = newsData.find(n => n.id === id);
  if (!article) return;

  window.AdminComponents.ConfirmDialog.show(
    'Delete News Article',
    `Are you sure you want to delete "${article.title}"? This action cannot be undone.`,
    async () => {
      try {
        await apiClient.deleteNews(id);
        window.AdminComponents.Toast.success('News article deleted successfully');
        await fetchNews();
      } catch (error) {
        window.AdminComponents.Toast.error(error.message || 'Failed to delete news article');
      }
    }
  );
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Export for router
if (typeof window !== 'undefined') {
  window.loadNews = loadNews;
  window.editNews = editNews;
  window.deleteNews = deleteNews;
  window.closeNewsModal = closeNewsModal;
  window.saveNews = saveNews;
  window.openNewsModal = openNewsModal;
}

})(); // End IIFE

