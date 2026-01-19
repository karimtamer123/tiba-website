// Projects Page
(function() {
'use strict';

let projectsData = [];
let editingId = null;
let currentCategoryFilter = 'all';

async function loadProjects() {
  console.log('loadProjects function called');
  const content = window.AdminLayout.getContentArea();
  if (!content) {
    console.error('No content area found in loadProjects');
    return;
  }
  console.log('Loading projects page...');
  
  // Reset filters
  currentCategoryFilter = 'all';

  content.innerHTML = `
    <div class="admin-page-header">
      <div>
        <h2>Projects</h2>
        <p>Manage your project portfolio by category. Add, edit, or remove projects and their images.</p>
      </div>
      <div class="admin-page-actions">
        <select id="category-filter" class="admin-select">
          <option value="all">All Categories</option>
          <option value="government">Government</option>
          <option value="healthcare">Healthcare</option>
          <option value="religion-education">Religion & Education</option>
          <option value="entertainment-sports">Entertainment & Sports</option>
          <option value="power-electricity">Power & Electricity</option>
          <option value="financial">Financial Institutions</option>
          <option value="transport-tourism">Transportation & Tourism</option>
          <option value="industrial">Industrial Buildings</option>
        </select>
        <input type="text" id="search-input" class="admin-input" placeholder="Search projects...">
        <button class="admin-btn admin-btn-primary" id="add-project-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 0.5rem;">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Add Project
        </button>
      </div>
    </div>
    <div class="admin-table-container" id="projects-table-container">
      ${window.AdminComponents.LoadingSpinner.create().outerHTML}
    </div>
  `;

  setupEventListeners();
  await fetchProjects();
}

function setupEventListeners() {
  const categoryFilter = document.getElementById('category-filter');
  const searchInput = document.getElementById('search-input');
  const addBtn = document.getElementById('add-project-btn');

  if (categoryFilter) {
    categoryFilter.addEventListener('change', (e) => {
      currentCategoryFilter = e.target.value;
      fetchProjects();
    });
  }

  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        filterProjects(e.target.value);
      }, 300);
    });
  }

  if (addBtn) {
    addBtn.addEventListener('click', () => openProjectModal());
  }
}

async function fetchProjects() {
  const container = document.getElementById('projects-table-container');
  if (!container) {
    console.error('projects-table-container not found');
    return;
  }
  
  try {
    console.log('Fetching projects with category filter:', currentCategoryFilter);
    const category = currentCategoryFilter === 'all' ? null : currentCategoryFilter;
    console.log('Calling apiClient.getProjects with category:', category);
    
    const data = await apiClient.getProjects(category);
    console.log('API response received:', data);
    console.log('Response type:', typeof data);
    console.log('Is array:', Array.isArray(data));
    console.log('Number of projects:', data ? data.length : 0);
    
    if (data && Array.isArray(data)) {
      console.log('First project sample:', data[0]);
      if (data[0] && data[0].images) {
        console.log('First project images:', data[0].images);
        if (data[0].images[0]) {
          console.log('First image path:', data[0].images[0].image_path);
        }
      }
      projectsData = data;
    } else {
      console.error('Unexpected response format:', data);
      projectsData = [];
    }
    
    renderTable();
  } catch (error) {
    console.error('Error fetching projects:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    container.innerHTML = window.AdminComponents.EmptyState.create(
      'Failed to load projects. Please try again.',
      'Retry',
      () => fetchProjects()
    ).outerHTML;
    window.AdminComponents.Toast.error('Failed to load projects: ' + (error.message || 'Unknown error'));
  }
}

function filterProjects(searchTerm) {
  const filtered = projectsData.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.location && p.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  renderTable(filtered);
}

function renderTable(data = projectsData) {
  const container = document.getElementById('projects-table-container');
  if (!container) {
    console.error('projects-table-container not found');
    return;
  }

  console.log('Rendering table with data:', data);
  console.log('Data length:', data ? data.length : 0);

  if (!data || data.length === 0) {
    console.log('No projects to display');
    container.innerHTML = window.AdminComponents.EmptyState.create(
      'No projects found. Add your first project to get started.',
      'Add Project',
      () => openProjectModal()
    ).outerHTML;
    return;
  }

  container.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Image</th>
          <th>Title</th>
          <th>Location</th>
          <th>Category</th>
          <th>Featured</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${data.map(project => {
          let imageUrl = '';
          if (project.images && project.images.length > 0) {
            let imagePath = project.images[0].image_path || '';
            if (imagePath && !imagePath.startsWith('/')) {
              imagePath = '/' + imagePath;
            }
            imageUrl = `http://localhost:3000${imagePath}`;
          }
          return `
          <tr>
            <td>
              ${imageUrl ? 
                `<img src="${imageUrl}" alt="${escapeHtml(project.title)}" class="admin-table-thumb">` :
                '<span class="admin-no-image">No image</span>'
              }
            </td>
            <td><strong>${escapeHtml(project.title || '')}</strong></td>
            <td>${escapeHtml(project.location || '')}</td>
            <td>${escapeHtml(project.category || 'all')}</td>
            <td>${project.is_featured ? '<span class="admin-badge">Featured</span>' : '-'}</td>
            <td>
              <button class="admin-btn-icon" onclick="editProject(${project.id})" title="Edit">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="admin-btn-icon admin-btn-danger" onclick="deleteProject(${project.id})" title="Delete">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
              </button>
            </td>
          </tr>
        `;
        }).join('')}
      </tbody>
    </table>
  `;
}

function openProjectModal(project = null) {
  editingId = project ? project.id : null;
  const modal = document.createElement('div');
  modal.className = 'admin-modal-overlay';
  modal.innerHTML = `
    <div class="admin-modal admin-modal-large">
      <div class="admin-modal-header">
        <h3>${editingId ? 'Edit' : 'Add'} Project</h3>
        <button class="admin-btn-icon" onclick="closeProjectModal()">×</button>
      </div>
      <form id="project-form" class="admin-modal-body">
        <div class="admin-form-group">
          <label>Title *</label>
          <input type="text" id="project-title" value="${project ? escapeHtml(project.title) : ''}" required>
        </div>
        <div class="admin-form-row">
          <div class="admin-form-group">
            <label>Location *</label>
            <input type="text" id="project-location" value="${project ? escapeHtml(project.location) : ''}" required>
          </div>
          <div class="admin-form-group">
            <label>Category</label>
            <select id="project-category">
              <option value="all" ${project?.category === 'all' ? 'selected' : ''}>All</option>
              <option value="government" ${project?.category === 'government' ? 'selected' : ''}>Government</option>
              <option value="healthcare" ${project?.category === 'healthcare' ? 'selected' : ''}>Healthcare</option>
              <option value="religion-education" ${project?.category === 'religion-education' ? 'selected' : ''}>Religion & Education</option>
              <option value="entertainment-sports" ${project?.category === 'entertainment-sports' ? 'selected' : ''}>Entertainment & Sports</option>
              <option value="power-electricity" ${project?.category === 'power-electricity' ? 'selected' : ''}>Power & Electricity</option>
              <option value="financial" ${project?.category === 'financial' ? 'selected' : ''}>Financial Institutions</option>
              <option value="transport-tourism" ${project?.category === 'transport-tourism' ? 'selected' : ''}>Transportation & Tourism</option>
              <option value="industrial" ${project?.category === 'industrial' ? 'selected' : ''}>Industrial Buildings</option>
            </select>
          </div>
        </div>
        <div class="admin-form-group">
          <label>
            <input type="checkbox" id="project-featured" ${project?.is_featured ? 'checked' : ''}>
            Featured Project
          </label>
        </div>
        <div class="admin-form-group">
          <label>Description</label>
          <textarea id="project-description" rows="4">${project ? escapeHtml(project.description || '') : ''}</textarea>
        </div>
        <div class="admin-form-group">
          <label>Equipment Used</label>
          <textarea id="project-equipment" rows="3" placeholder="Air Handling Units, Chillers, Cooling Towers">${project ? escapeHtml(project.equipment || '') : ''}</textarea>
        </div>
        <div class="admin-form-group">
          <label>Project Images ${!editingId ? '*' : ''}</label>
          <p style="font-size: 0.875rem; color: #64748B; margin-bottom: 0.5rem;">
            ${!editingId ? 'Upload one or more images for this project. You can select multiple files at once.' : 'Add new images or remove existing ones. New images will be added to the project.'}
          </p>
          <div id="project-image-uploader"></div>
          ${project && project.images && project.images.length > 0 ? `
            <div class="admin-existing-images" style="margin-top: 1rem;">
              <p style="font-weight: 600; margin-bottom: 0.75rem;">Current Images:</p>
              <div class="admin-image-grid">
                ${project.images.map(img => {
                  let imagePath = img.image_path || '';
                  if (imagePath && !imagePath.startsWith('/')) {
                    imagePath = '/' + imagePath;
                  }
                  const imageUrl = imagePath ? `http://localhost:3000${imagePath}` : '';
                  return `
                  <div class="admin-image-item">
                    ${imageUrl ? `<img src="${imageUrl}" alt="Project image" onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'150\' height=\'150\'%3E%3Crect fill=\'%23E2E8F0\' width=\'150\' height=\'150\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%2394A3B8\' font-size=\'12\'%3EImage not found%3C/text%3E%3C/svg%3E';">` : '<div style="width: 150px; height: 150px; background: #E2E8F0; display: flex; align-items: center; justify-content: center; color: #94A3B8; border-radius: 8px;">No image</div>'}
                    <button type="button" class="admin-btn-icon admin-btn-danger" onclick="removeProjectImage(${project.id}, ${img.id})" title="Remove Image">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                      </svg>
                    </button>
                  </div>
                `;
                }).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </form>
      <div class="admin-modal-footer">
        <button class="admin-btn admin-btn-secondary" onclick="closeProjectModal()">Cancel</button>
        <button class="admin-btn admin-btn-primary" onclick="saveProject()">Save</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  // Initialize image uploader
  const uploaderContainer = document.getElementById('project-image-uploader');
  if (uploaderContainer) {
    const uploader = window.AdminComponents.ImageUploader.create({ multiple: true, preview: true });
    uploaderContainer.appendChild(uploader.element);
    modal.uploader = uploader;
  }

  modal.querySelector('#project-form').addEventListener('submit', (e) => {
    e.preventDefault();
    saveProject();
  });
}

function closeProjectModal() {
  const modal = document.querySelector('.admin-modal-overlay');
  if (modal) {
    if (modal.uploader) modal.uploader.clear();
    modal.remove();
  }
  editingId = null;
}

async function saveProject() {
  const title = document.getElementById('project-title').value;
  const location = document.getElementById('project-location').value;
  const category = document.getElementById('project-category').value;
  const description = document.getElementById('project-description').value;
  const equipment = document.getElementById('project-equipment').value;
  const isFeatured = document.getElementById('project-featured').checked;

  if (!title || !location) {
    window.AdminComponents.Toast.error('Title and location are required');
    return;
  }

  const modal = document.querySelector('.admin-modal-overlay');
  const uploader = modal?.uploader;
  const images = uploader ? uploader.getFiles() : [];

  try {
    const projectData = { title, location, category, description, equipment, is_featured: isFeatured };
    
    if (editingId) {
      await apiClient.updateProject(editingId, projectData, images);
      window.AdminComponents.Toast.success('Project updated successfully');
    } else {
      await apiClient.createProject(projectData, images);
      window.AdminComponents.Toast.success('Project created successfully');
    }
    closeProjectModal();
    await fetchProjects();
  } catch (error) {
    window.AdminComponents.Toast.error(error.message || 'Failed to save project');
  }
}

async function editProject(id) {
  try {
    const project = await apiClient.getProject(id);
    openProjectModal(project);
  } catch (error) {
    window.AdminComponents.Toast.error('Failed to load project');
  }
}

function deleteProject(id) {
  const project = projectsData.find(p => p.id === id);
  if (!project) return;

  window.AdminComponents.ConfirmDialog.show(
    `Are you sure you want to delete "${project.title}"? This action cannot be undone.`,
    async () => {
      try {
        await apiClient.deleteProject(id);
        window.AdminComponents.Toast.success('Project deleted successfully');
        await fetchProjects();
      } catch (error) {
        window.AdminComponents.Toast.error(error.message || 'Failed to delete project');
      }
    }
  );
}

async function removeProjectImage(projectId, imageId) {
  try {
    await apiClient.deleteProjectImage(projectId, imageId);
    window.AdminComponents.Toast.success('Image removed successfully');
    await editProject(projectId);
  } catch (error) {
    window.AdminComponents.Toast.error('Failed to remove image');
  }
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Export for router
if (typeof window !== 'undefined') {
  window.loadProjects = loadProjects;
  window.editProject = editProject;
  window.deleteProject = deleteProject;
  window.closeProjectModal = closeProjectModal;
  window.saveProject = saveProject;
  window.openProjectModal = openProjectModal;
  window.removeProjectImage = removeProjectImage;
}

})(); // End IIFE

