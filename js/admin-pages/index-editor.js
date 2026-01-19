// Index Editor Page - Homepage content management
(function() {
'use strict';

let slideshowData = [];
let statisticsData = [];
let featuredProjects = [];
let featuredNews = [];

async function loadIndexEditor() {
  const content = window.AdminLayout.getContentArea();
  if (!content) return;

  content.innerHTML = `
    <div class="admin-page-header">
      <h2>Landing Page</h2>
      <p>Edit homepage content sections</p>
    </div>
    <div class="admin-index-sections">
      <div class="admin-index-section" id="slideshow-section">
        <div class="admin-section-header">
          <h3>Slideshow</h3>
          <button class="admin-btn admin-btn-secondary" onclick="toggleSection('slideshow')">
            <span id="slideshow-toggle-text">Edit</span>
          </button>
        </div>
        <div id="slideshow-content">
          <p class="admin-section-desc">Manage hero slideshow images displayed on the homepage.</p>
          <div id="slideshow-preview" class="admin-section-preview">
            ${window.AdminComponents.LoadingSpinner.create().outerHTML}
          </div>
        </div>
        <div id="slideshow-editor" class="admin-section-editor" style="display: none;">
          <!-- Slideshow editor will be loaded here -->
        </div>
      </div>
      <div class="admin-index-section" id="stats-section">
        <div class="admin-section-header">
          <h3>Statistics</h3>
          <button class="admin-btn admin-btn-secondary" onclick="toggleSection('stats')">
            <span id="stats-toggle-text">Edit</span>
          </button>
        </div>
        <div id="stats-content">
          <p class="admin-section-desc">Manage statistics displayed on the homepage.</p>
          <div id="statistics-preview" class="admin-section-preview">
            ${window.AdminComponents.LoadingSpinner.create().outerHTML}
          </div>
        </div>
        <div id="stats-editor" class="admin-section-editor" style="display: none;">
          <!-- Statistics editor will be loaded here -->
        </div>
      </div>
      <div class="admin-index-section" id="featured-projects-section">
        <div class="admin-section-header">
          <h3>Featured Projects</h3>
          <button class="admin-btn admin-btn-secondary" onclick="toggleSection('featured-projects')">
            <span id="featured-projects-toggle-text">Edit</span>
          </button>
        </div>
        <div id="featured-projects-content">
          <p class="admin-section-desc">Projects marked as featured will appear on the homepage.</p>
          <div id="featured-projects-preview" class="admin-section-preview">
            ${window.AdminComponents.LoadingSpinner.create().outerHTML}
          </div>
        </div>
        <div id="featured-projects-editor" class="admin-section-editor" style="display: none;">
          <!-- Featured projects editor will be loaded here -->
        </div>
      </div>
      <div class="admin-index-section" id="latest-news-section">
        <div class="admin-section-header">
          <h3>Latest News</h3>
          <button class="admin-btn admin-btn-secondary" onclick="toggleSection('latest-news')">
            <span id="latest-news-toggle-text">Edit</span>
          </button>
        </div>
        <div id="latest-news-content">
          <p class="admin-section-desc">News articles marked as featured will appear on the homepage.</p>
          <div id="featured-news-preview" class="admin-section-preview">
            ${window.AdminComponents.LoadingSpinner.create().outerHTML}
          </div>
        </div>
        <div id="latest-news-editor" class="admin-section-editor" style="display: none;">
          <!-- Latest news editor will be loaded here -->
        </div>
      </div>
    </div>
  `;

  await loadAllData();
  setupSectionToggles();
}

async function loadAllData() {
  try {
    // Load slideshow
    slideshowData = await apiClient.getSlideshow();
    renderSlideshowPreview();

    // Load statistics
    statisticsData = await apiClient.getStatistics();
    renderStatisticsPreview();

    // Load featured projects
    featuredProjects = await apiClient.getFeaturedProjects();
    renderFeaturedProjectsPreview();

    // Load featured news
    featuredNews = await apiClient.getFeaturedNews();
    renderFeaturedNewsPreview();
  } catch (error) {
    window.AdminComponents.Toast.error('Failed to load homepage data');
  }
}

function renderSlideshowPreview() {
  const container = document.getElementById('slideshow-preview');
  if (!container) return;

  if (slideshowData.length === 0) {
    container.innerHTML = '<p style="color: #64748B;">No slideshow images. <a href="#/slideshow">Add slides</a></p>';
    return;
  }

  container.innerHTML = `
    <div class="admin-preview-grid">
      ${slideshowData.slice(0, 3).map(slide => `
        <div class="admin-preview-item">
          <img src="http://localhost:3000${slide.image_path}" alt="${escapeHtml(slide.title || 'Slide')}">
          <p>${escapeHtml(slide.title || 'Untitled')}</p>
        </div>
      `).join('')}
    </div>
    <p style="color: #64748B; margin-top: 12px; font-size: 14px;">
      ${slideshowData.length} slide${slideshowData.length !== 1 ? 's' : ''} total
    </p>
  `;
}

function renderStatisticsPreview() {
  const container = document.getElementById('statistics-preview');
  if (!container) return;

  if (statisticsData.length === 0) {
    container.innerHTML = '<p style="color: #64748B;">No statistics. <a href="#/statistics">Add statistics</a></p>';
    return;
  }

  container.innerHTML = `
    <div class="admin-stats-preview">
      ${statisticsData.slice(0, 4).map(stat => `
        <div class="admin-stat-preview-item">
          <div class="admin-stat-value">${escapeHtml(stat.value || '')}${escapeHtml(stat.suffix || '')}</div>
          <div class="admin-stat-label">${escapeHtml(stat.label || '')}</div>
        </div>
      `).join('')}
    </div>
    <p style="color: #64748B; margin-top: 12px; font-size: 14px;">
      ${statisticsData.length} statistic${statisticsData.length !== 1 ? 's' : ''} total
    </p>
  `;
}

function renderFeaturedProjectsPreview() {
  const container = document.getElementById('featured-projects-preview');
  if (!container) return;

  if (featuredProjects.length === 0) {
    container.innerHTML = '<p style="color: #64748B;">No featured projects. Mark projects as featured in the <a href="#/projects">Projects</a> section.</p>';
    return;
  }

  container.innerHTML = `
    <div class="admin-preview-grid">
      ${featuredProjects.slice(0, 3).map(project => `
        <div class="admin-preview-item">
          ${project.images && project.images.length > 0 ? 
            `<img src="http://localhost:3000${project.images[0].image_path}" alt="${escapeHtml(project.title)}">` :
            '<div class="admin-no-image">No image</div>'
          }
          <p>${escapeHtml(project.title || '')}</p>
        </div>
      `).join('')}
    </div>
    <p style="color: #64748B; margin-top: 12px; font-size: 14px;">
      ${featuredProjects.length} featured project${featuredProjects.length !== 1 ? 's' : ''}
    </p>
  `;
}

function renderFeaturedNewsPreview() {
  const container = document.getElementById('featured-news-preview');
  if (!container) return;

  if (featuredNews.length === 0) {
    container.innerHTML = '<p style="color: #64748B;">No featured news. Mark articles as featured in the <a href="#/news">News</a> section.</p>';
    return;
  }

  container.innerHTML = `
    <div class="admin-news-preview">
      ${featuredNews.slice(0, 3).map(article => `
        <div class="admin-news-preview-item">
          ${article.image_path ? 
            `<img src="http://localhost:3000${article.image_path}" alt="${escapeHtml(article.title)}">` :
            '<div class="admin-no-image">No image</div>'
          }
          <div>
            <h4>${escapeHtml(article.title || '')}</h4>
            <p style="color: #64748B; font-size: 14px;">${article.date ? new Date(article.date).toLocaleDateString() : ''}</p>
          </div>
        </div>
      `).join('')}
    </div>
    <p style="color: #64748B; margin-top: 12px; font-size: 14px;">
      ${featuredNews.length} featured article${featuredNews.length !== 1 ? 's' : ''}
    </p>
  `;
}

function setupSectionToggles() {
  // This will be called after page loads
  window.toggleSection = function(sectionName) {
    const section = document.getElementById(sectionName + '-section');
    const content = document.getElementById(sectionName + '-content');
    const editor = document.getElementById(sectionName + '-editor');
    const toggleText = document.getElementById(sectionName + '-toggle-text');
    
    if (!section || !content || !editor) return;
    
    const isEditing = editor.style.display !== 'none';
    
    if (isEditing) {
      // Switch to preview mode
      editor.style.display = 'none';
      content.style.display = 'block';
      toggleText.textContent = 'Edit';
      // Reload preview data
      loadAllData();
    } else {
      // Switch to edit mode
      content.style.display = 'none';
      editor.style.display = 'block';
      toggleText.textContent = 'Cancel';
      // Load editor for this section
      loadSectionEditor(sectionName);
    }
  };
}

async function loadSectionEditor(sectionName) {
  const editor = document.getElementById(sectionName + '-editor');
  if (!editor) return;
  
  try {
    switch(sectionName) {
      case 'slideshow':
        await loadSlideshowEditor(editor);
        break;
      case 'stats':
        await loadStatsEditor(editor);
        break;
      case 'featured-projects':
        await loadFeaturedProjectsEditor(editor);
        break;
      case 'latest-news':
        await loadLatestNewsEditor(editor);
        break;
    }
  } catch (error) {
    console.error('Error loading editor:', error);
    window.AdminComponents.Toast.error('Failed to load editor');
  }
}

async function loadSlideshowEditor(container) {
  try {
    const slides = await apiClient.getSlideshow();
    slideshowData = slides.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    
    // Store slideshowData globally for editSlideshowItem to access
    window.indexEditorSlideshowData = slideshowData;
    
    console.log('Loaded slideshow data:', slideshowData);
    
    container.innerHTML = `
      <div style="margin-top: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h4>Slideshow Images</h4>
          <button class="admin-btn admin-btn-primary" onclick="window.addSlideshowItem()">Add Slide</button>
        </div>
        <div id="slideshow-list" class="admin-slideshow-list">
          ${slideshowData.length === 0 ? '<p style="color: #64748B;">No slideshow images yet.</p>' : ''}
          ${slideshowData.map((slide, index) => {
            // Fix image path - ensure it starts with /
            let imagePath = slide.image_path || '';
            if (imagePath && !imagePath.startsWith('/')) {
              imagePath = '/' + imagePath;
            }
            // Handle old paths that might not be in /uploads/slideshow/
            if (imagePath && !imagePath.startsWith('/uploads/')) {
              // If path starts with /indexbackground/, try /uploads/slideshow/indexbackground/
              if (imagePath.startsWith('/indexbackground/')) {
                imagePath = '/uploads/slideshow' + imagePath;
              }
            }
            const imageUrl = imagePath ? `http://localhost:3000${imagePath}` : '';
            return `
            <div class="admin-slide-item" data-id="${slide.id}">
              <div class="admin-slide-handle">
                <span style="color: #94A3B8; font-weight: 600;">${index + 1}</span>
              </div>
              <div class="admin-slide-preview">
                ${slide.image_path ? `
                  <img src="${imageUrl}" 
                       alt="${escapeHtml(slide.title || 'Slide')}"
                       onerror="console.error('Failed to load image: ${imageUrl}'); this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'120\' height=\'80\'%3E%3Crect fill=\'%23E2E8F0\' width=\'120\' height=\'80\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'%2394A3B8\' font-size=\'12\'%3EImage not found%3C/text%3E%3C/svg%3E';"
                       style="width: 100%; height: 100%; object-fit: cover; display: block;">
                ` : `
                  <div style="width: 100%; height: 100%; background: #E2E8F0; display: flex; align-items: center; justify-content: center; color: #94A3B8; font-size: 12px;">No image</div>
                `}
              </div>
              <div class="admin-slide-info">
                <h4>${escapeHtml(slide.title || 'Untitled')}</h4>
                <p>${escapeHtml(slide.subtitle || '')}</p>
              </div>
              <div class="admin-slide-actions">
                <button class="admin-btn-icon" onclick="window.editSlideshowItem(${slide.id})" title="Edit">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button class="admin-btn-icon admin-btn-danger" onclick="window.deleteSlideshowItem(${slide.id})" title="Delete">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                  </svg>
                </button>
              </div>
            </div>
          `;
          }).join('')}
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error loading slideshow editor:', error);
    container.innerHTML = '<p style="color: #EF4444;">Failed to load slideshow data: ' + escapeHtml(error.message) + '</p>';
  }
}

async function loadStatsEditor(container) {
  try {
    const stats = await apiClient.getStatistics();
    statisticsData = stats;
    
    // Store statisticsData globally for editStatisticInline to access
    window.indexEditorStatisticsData = statisticsData;
    
    container.innerHTML = `
      <div style="margin-top: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h4>Statistics</h4>
          <button class="admin-btn admin-btn-primary" onclick="window.addStatistic()">Add Statistic</button>
        </div>
        <div id="statistics-list">
          ${statisticsData.length === 0 ? '<p style="color: #64748B;">No statistics yet.</p>' : ''}
          ${statisticsData.map(stat => `
            <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: #F8F9FA; border-radius: 8px; margin-bottom: 0.5rem;">
              <div style="flex: 1;">
                <strong>${escapeHtml(stat.label || '')}</strong>: ${escapeHtml(stat.value || '')}${escapeHtml(stat.suffix || '')}
                ${stat.description ? `<br><small style="color: #64748B;">${escapeHtml(stat.description)}</small>` : ''}
              </div>
              <button class="admin-btn-icon" onclick="editStatisticInline(${stat.id})" title="Edit">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } catch (error) {
    container.innerHTML = '<p style="color: #EF4444;">Failed to load statistics data.</p>';
  }
}

async function loadFeaturedProjectsEditor(container) {
  try {
    const projects = await apiClient.getProjects(null, 'true');
    featuredProjects = projects;
    
    container.innerHTML = `
      <div style="margin-top: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h4>Featured Projects</h4>
          <a href="#/projects" class="admin-btn admin-btn-secondary" style="text-decoration: none;">Manage All Projects</a>
        </div>
        <p style="color: #64748B; margin-bottom: 1rem;">Mark projects as featured in the Projects section to show them here.</p>
        <div id="featured-projects-list">
          ${featuredProjects.length === 0 ? `
            <div style="padding: 2rem; text-align: center; background: #F8F9FA; border-radius: 8px; border: 2px dashed #E2E8F0;">
              <p style="color: #64748B; margin: 0 0 1rem 0; font-size: 0.95rem;">No featured projects yet.</p>
              <p style="color: #94A3B8; margin: 0 0 1.5rem 0; font-size: 0.875rem;">To feature projects on the homepage, go to the <a href="#/projects" style="color: #3B82F6; text-decoration: none; font-weight: 500;">Projects</a> section and mark them as featured.</p>
              <a href="#/projects" class="admin-btn admin-btn-secondary" style="text-decoration: none;">Go to Projects</a>
            </div>
          ` : ''}
          ${featuredProjects.map(project => `
            <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: #F8F9FA; border-radius: 8px; margin-bottom: 0.5rem;">
              ${project.images && project.images.length > 0 ? 
                `<img src="http://localhost:3000${project.images[0].image_path}" alt="${escapeHtml(project.title)}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 6px;">` :
                '<div class="admin-no-image" style="width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; background: #E2E8F0; border-radius: 6px;">No image</div>'
              }
              <div style="flex: 1;">
                <strong>${escapeHtml(project.title || '')}</strong>
                <br><small style="color: #64748B;">${escapeHtml(project.location || '')}</small>
              </div>
              <a href="#/projects" class="admin-btn admin-btn-secondary" style="text-decoration: none;">Edit</a>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } catch (error) {
    container.innerHTML = '<p style="color: #EF4444;">Failed to load featured projects data.</p>';
  }
}

async function loadLatestNewsEditor(container) {
  try {
    const news = await apiClient.getFeaturedNews();
    featuredNews = news;
    
    container.innerHTML = `
      <div style="margin-top: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h4>Latest News</h4>
          <a href="#/news" class="admin-btn admin-btn-secondary" style="text-decoration: none;">Manage All News</a>
        </div>
        <p style="color: #64748B; margin-bottom: 1rem;">Mark news articles as featured in the News section to show them here.</p>
        <div id="latest-news-list">
          ${featuredNews.length === 0 ? `
            <div style="padding: 2rem; text-align: center; background: #F8F9FA; border-radius: 8px; border: 2px dashed #E2E8F0;">
              <p style="color: #64748B; margin: 0 0 1rem 0; font-size: 0.95rem;">No featured news yet.</p>
              <p style="color: #94A3B8; margin: 0 0 1.5rem 0; font-size: 0.875rem;">To feature news articles on the homepage, go to the <a href="#/news" style="color: #3B82F6; text-decoration: none; font-weight: 500;">News</a> section and mark them as featured.</p>
              <a href="#/news" class="admin-btn admin-btn-secondary" style="text-decoration: none;">Go to News</a>
            </div>
          ` : ''}
          ${featuredNews.map(article => `
            <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem; background: #F8F9FA; border-radius: 8px; margin-bottom: 0.5rem;">
              ${article.image_path ? 
                `<img src="http://localhost:3000${article.image_path}" alt="${escapeHtml(article.title)}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 6px;">` :
                '<div class="admin-no-image" style="width: 80px; height: 80px; display: flex; align-items: center; justify-content: center; background: #E2E8F0; border-radius: 6px;">No image</div>'
              }
              <div style="flex: 1;">
                <strong>${escapeHtml(article.title || '')}</strong>
                <br><small style="color: #64748B;">${article.date ? new Date(article.date).toLocaleDateString() : ''}</small>
              </div>
              <a href="#/news" class="admin-btn admin-btn-secondary" style="text-decoration: none;">Edit</a>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } catch (error) {
    container.innerHTML = '<p style="color: #EF4444;">Failed to load latest news data.</p>';
  }
}

// Helper functions for inline editing
window.addSlideshowItem = async function() {
  console.log('addSlideshowItem called, openSlideModal available:', !!window.openSlideModal);
  if (window.openSlideModal) {
    // Store original close function
    const originalClose = window.closeSlideModal;
    window.closeSlideModal = function() {
      if (originalClose) originalClose();
      // Refresh slideshow editor after modal closes
      setTimeout(() => {
        const editor = document.getElementById('slideshow-editor');
        if (editor && editor.style.display !== 'none') {
          loadSlideshowEditor(editor);
        }
        loadAllData(); // Refresh preview too
      }, 100);
    };
    window.openSlideModal();
  } else {
    console.error('openSlideModal not available');
    window.AdminComponents.Toast.error('Add functionality not available. Please ensure slideshow.js is loaded.');
  }
};

window.editSlideshowItem = async function(id) {
  console.log('editSlideshowItem called with id:', id);
  console.log('Available data:', window.indexEditorSlideshowData);
  console.log('openSlideModal available:', !!window.openSlideModal);
  
  // Find slide data from the loaded slideshowData
  try {
    let slide = null;
    
    // First try to get from window.indexEditorSlideshowData (stored when editor loads)
    if (window.indexEditorSlideshowData) {
      slide = window.indexEditorSlideshowData.find(s => s.id === id);
      console.log('Found slide in loaded data:', slide);
    }
    
    // If not found, try to fetch it
    if (!slide) {
      console.log('Slide not in loaded data, fetching from API...');
      slide = await apiClient.getSlideshowImage(id);
      console.log('Fetched slide from API:', slide);
    }
    
    if (!slide) {
      window.AdminComponents.Toast.error('Slide not found');
      return;
    }
    
    // Open modal with slide data
    if (window.openSlideModal) {
      // Store original close function
      const originalClose = window.closeSlideModal;
      window.closeSlideModal = function() {
        if (originalClose) originalClose();
        // Refresh slideshow editor after modal closes
        setTimeout(() => {
          const editor = document.getElementById('slideshow-editor');
          if (editor && editor.style.display !== 'none') {
            loadSlideshowEditor(editor);
          }
          loadAllData(); // Refresh preview too
        }, 100);
      };
      console.log('Opening modal with slide:', slide);
      window.openSlideModal(slide);
    } else {
      console.error('openSlideModal not available');
      window.AdminComponents.Toast.error('Edit functionality not available. Please ensure slideshow.js is loaded.');
    }
  } catch (error) {
    console.error('Error editing slide:', error);
    window.AdminComponents.Toast.error('Failed to load slide for editing: ' + (error.message || 'Unknown error'));
  }
};

window.deleteSlideshowItem = async function(id) {
  if (window.deleteSlide) {
    window.deleteSlide(id);
    // Refresh after delete
    setTimeout(() => {
      const editor = document.getElementById('slideshow-editor');
      if (editor && editor.style.display !== 'none') {
        loadSlideshowEditor(editor);
      }
      loadAllData();
    }, 500);
  }
};

window.addStatistic = async function() {
  if (window.openStatModal) {
    // Store original close function
    const originalClose = window.closeStatModal;
    window.closeStatModal = function() {
      if (originalClose) originalClose();
      // Refresh stats editor after modal closes
      setTimeout(() => {
        const editor = document.getElementById('stats-editor');
        if (editor && editor.style.display !== 'none') {
          loadStatsEditor(editor);
        }
        loadAllData(); // Refresh preview too
      }, 100);
    };
    window.openStatModal();
  }
};

window.addStatistic = async function() {
  if (window.openStatModal) {
    // Store original close function
    const originalClose = window.closeStatModal;
    window.closeStatModal = function() {
      if (originalClose) originalClose();
      // Refresh stats editor after modal closes
      setTimeout(() => {
        const editor = document.getElementById('stats-editor');
        if (editor && editor.style.display !== 'none') {
          loadStatsEditor(editor);
        }
        loadAllData(); // Refresh preview too
      }, 100);
    };
    window.openStatModal();
  }
};

window.addStatistic = async function() {
  if (window.openStatModal) {
    // Store original close function
    const originalClose = window.closeStatModal;
    window.closeStatModal = function() {
      if (originalClose) originalClose();
      // Refresh stats editor after modal closes
      setTimeout(() => {
        const editor = document.getElementById('stats-editor');
        if (editor && editor.style.display !== 'none') {
          loadStatsEditor(editor);
        }
        loadAllData(); // Refresh preview too
      }, 100);
    };
    window.openStatModal();
  }
};

window.editStatisticInline = async function(id) {
  console.log('editStatisticInline called with id:', id);
  console.log('Available data:', window.indexEditorStatisticsData);
  console.log('openStatModal available:', !!window.openStatModal);
  
  try {
    let stat = null;
    
    // First try to get from window.indexEditorStatisticsData (stored when editor loads)
    if (window.indexEditorStatisticsData) {
      stat = window.indexEditorStatisticsData.find(s => s.id === id);
      console.log('Found stat in loaded data:', stat);
    }
    
    // If not found, try to fetch it
    if (!stat) {
      console.log('Stat not in loaded data, fetching from API...');
      stat = await apiClient.getStatistic(id);
      console.log('Fetched stat from API:', stat);
    }
    
    if (!stat) {
      window.AdminComponents.Toast.error('Statistic not found');
      return;
    }
    
    // Open modal with stat data
    if (window.openStatModal) {
      // Store original close function
      const originalClose = window.closeStatModal;
      window.closeStatModal = function() {
        if (originalClose) originalClose();
        // Refresh stats editor after modal closes
        setTimeout(() => {
          const editor = document.getElementById('stats-editor');
          if (editor && editor.style.display !== 'none') {
            loadStatsEditor(editor);
          }
          loadAllData(); // Refresh preview too
        }, 100);
      };
      console.log('Opening modal with stat:', stat);
      window.openStatModal(stat);
    } else {
      console.error('openStatModal not available');
      window.AdminComponents.Toast.error('Edit functionality not available. Please ensure statistics.js is loaded.');
    }
  } catch (error) {
    console.error('Error editing statistic:', error);
    window.AdminComponents.Toast.error('Failed to load statistic for editing: ' + (error.message || 'Unknown error'));
  }
};

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Export loadSlideshowEditor and loadStatsEditor so other modules can refresh them
window.loadSlideshowEditor = loadSlideshowEditor;
window.loadStatsEditor = loadStatsEditor;

// Export for router
if (typeof window !== 'undefined') {
  window.loadIndexEditor = loadIndexEditor;
  window.loadLandingPage = loadIndexEditor; // Alias for /landing route
}

})(); // End IIFE

