// Slideshow Page
(function() {
'use strict';

let slideshowData = [];
let editingId = null;

async function loadSlideshow() {
  const content = window.AdminLayout.getContentArea();
  if (!content) return;

  content.innerHTML = `
    <div class="admin-page-header">
      <h2>Slideshow</h2>
      <p>Manage hero slideshow images and order. Drag items to reorder.</p>
      <div class="admin-page-actions">
        <button class="admin-btn admin-btn-secondary" id="save-order-btn" style="display: none;">Save Order</button>
        <button class="admin-btn admin-btn-primary" id="add-slide-btn">Add Slide</button>
      </div>
    </div>
    <div class="admin-table-container" id="slideshow-table-container">
      ${window.AdminComponents.LoadingSpinner.create().outerHTML}
    </div>
  `;

  setupEventListeners();
  await fetchSlideshow();
}

function setupEventListeners() {
  const addBtn = document.getElementById('add-slide-btn');
  const saveOrderBtn = document.getElementById('save-order-btn');
  
  if (addBtn) {
    addBtn.addEventListener('click', () => openSlideModal());
  }
  
  if (saveOrderBtn) {
    saveOrderBtn.addEventListener('click', () => saveOrder());
  }
}

async function fetchSlideshow() {
  const container = document.getElementById('slideshow-table-container');
  try {
    const data = await apiClient.getSlideshow();
    slideshowData = data.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    renderTable();
  } catch (error) {
    container.innerHTML = window.AdminComponents.EmptyState.create(
      'Failed to load slideshow. Please try again.',
      'Retry',
      () => fetchSlideshow()
    ).outerHTML;
    window.AdminComponents.Toast.error('Failed to load slideshow');
  }
}

function renderTable() {
  const container = document.getElementById('slideshow-table-container');
  if (!container) return;

  if (slideshowData.length === 0) {
    container.innerHTML = window.AdminComponents.EmptyState.create(
      'No slideshow images yet. Add your first slide to get started.',
      'Add Slide',
      () => openSlideModal()
    ).outerHTML;
    return;
  }

  container.innerHTML = `
    <div class="admin-slideshow-list" id="slideshow-list">
      ${slideshowData.map((slide, index) => `
        <div class="admin-slide-item" data-id="${slide.id}" draggable="true">
          <div class="admin-slide-handle">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12h18M3 6h18M3 18h18"/>
            </svg>
          </div>
          <div class="admin-slide-preview">
            ${(() => {
              let imagePath = slide.image_path || '';
              if (imagePath && !imagePath.startsWith('/')) {
                imagePath = '/' + imagePath;
              }
              // Handle old paths
              if (imagePath && !imagePath.startsWith('/uploads/')) {
                if (imagePath.startsWith('/indexbackground/')) {
                  imagePath = '/uploads/slideshow' + imagePath;
                }
              }
              const imageUrl = imagePath ? `http://localhost:3000${imagePath}` : '';
              return imageUrl ? `<img src="${imageUrl}" alt="${escapeHtml(slide.title || 'Slide')}">` : '<div style="width: 100%; height: 100%; background: #E2E8F0; display: flex; align-items: center; justify-content: center; color: #94A3B8; font-size: 12px;">No image</div>';
            })()}
          </div>
          <div class="admin-slide-info">
            <h4>${escapeHtml(slide.title || 'Untitled')}</h4>
            <p>${escapeHtml(slide.subtitle || '')}</p>
            <span class="admin-slide-order">Order: ${slide.display_order || index + 1}</span>
          </div>
          <div class="admin-slide-actions">
            <button class="admin-btn-icon" onclick="editSlide(${slide.id})" title="Edit">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="admin-btn-icon admin-btn-danger" onclick="deleteSlide(${slide.id})" title="Delete">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  setupDragAndDrop();
}

function setupDragAndDrop() {
  const list = document.getElementById('slideshow-list');
  const saveOrderBtn = document.getElementById('save-order-btn');
  if (!list) return;

  let draggedElement = null;
  let orderChanged = false;

  list.querySelectorAll('.admin-slide-item').forEach(item => {
    item.addEventListener('dragstart', (e) => {
      draggedElement = item;
      item.style.opacity = '0.5';
      orderChanged = false;
    });

    item.addEventListener('dragend', (e) => {
      item.style.opacity = '1';
      if (orderChanged && saveOrderBtn) {
        saveOrderBtn.style.display = 'inline-flex';
      }
      draggedElement = null;
    });

    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      const afterElement = getDragAfterElement(list, e.clientY);
      if (afterElement == null) {
        list.appendChild(draggedElement);
      } else {
        list.insertBefore(draggedElement, afterElement);
      }
      orderChanged = true;
    });

    item.addEventListener('drop', (e) => {
      e.preventDefault();
      orderChanged = true;
    });
  });
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.admin-slide-item:not(.dragging)')];
  
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

async function saveOrder() {
  const list = document.getElementById('slideshow-list');
  if (!list) return;

  const items = Array.from(list.querySelectorAll('.admin-slide-item'));
  const order = items.map((item, index) => ({
    id: parseInt(item.getAttribute('data-id')),
    display_order: index + 1
  }));

  try {
    await apiClient.reorderSlideshow(order);
    window.AdminComponents.Toast.success('Order updated successfully');
    const saveOrderBtn = document.getElementById('save-order-btn');
    if (saveOrderBtn) saveOrderBtn.style.display = 'none';
    await fetchSlideshow();
  } catch (error) {
    window.AdminComponents.Toast.error('Failed to update order');
  }
}

function openSlideModal(slide = null) {
  editingId = slide ? slide.id : null;
  const modal = document.createElement('div');
  modal.className = 'admin-modal-overlay';
  modal.innerHTML = `
    <div class="admin-modal">
      <div class="admin-modal-header">
        <h3>${editingId ? 'Edit' : 'Add'} Slideshow Image</h3>
        <button class="admin-btn-icon" onclick="closeSlideModal()">×</button>
      </div>
      <form id="slide-form" class="admin-modal-body">
        <div class="admin-form-group">
          <label>Image ${!editingId ? '*' : '(optional - leave empty to keep current)'}</label>
          ${editingId ? `
            <div style="margin-bottom: 1rem;">
              <label style="display: block; margin-bottom: 0.5rem; color: #64748B; font-size: 0.875rem;">Current Image:</label>
              ${(() => {
                let imagePath = slide.image_path || '';
                if (imagePath && !imagePath.startsWith('/')) {
                  imagePath = '/' + imagePath;
                }
                // Handle old paths
                if (imagePath && !imagePath.startsWith('/uploads/')) {
                  if (imagePath.startsWith('/indexbackground/')) {
                    imagePath = '/uploads/slideshow' + imagePath;
                  }
                }
                const imageUrl = imagePath ? `http://localhost:3000${imagePath}` : '';
                return imageUrl ? `<img src="${imageUrl}" alt="Slide image" style="max-width: 200px; max-height: 150px; border-radius: 8px; border: 1px solid #E2E8F0;">` : '<p style="color: #94A3B8;">No image available</p>';
              })()}
            </div>
          ` : ''}
          <div id="slide-image-uploader"></div>
        </div>
        <div class="admin-form-group">
          <label>Title</label>
          <input type="text" id="slide-title" value="${slide ? escapeHtml(slide.title || '') : ''}">
        </div>
        <div class="admin-form-group">
          <label>Subtitle</label>
          <input type="text" id="slide-subtitle" value="${slide ? escapeHtml(slide.subtitle || '') : ''}">
        </div>
      </form>
      <div class="admin-modal-footer">
        <button class="admin-btn admin-btn-secondary" onclick="closeSlideModal()">Cancel</button>
        <button class="admin-btn admin-btn-primary" onclick="saveSlide()">Save</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  // Initialize image uploader (required for new, optional for edit)
  const uploaderContainer = document.getElementById('slide-image-uploader');
  if (uploaderContainer) {
    const uploader = window.AdminComponents.ImageUploader.create({ multiple: false, preview: true });
    uploaderContainer.appendChild(uploader.element);
    modal.uploader = uploader;
  }

  modal.querySelector('#slide-form').addEventListener('submit', (e) => {
    e.preventDefault();
    saveSlide();
  });
}

function closeSlideModal() {
  const modal = document.querySelector('.admin-modal-overlay');
  if (modal) {
    if (modal.uploader) modal.uploader.clear();
    modal.remove();
  }
  editingId = null;
}

async function saveSlide() {
  const titleInput = document.getElementById('slide-title');
  const subtitleInput = document.getElementById('slide-subtitle');
  
  if (!titleInput || !subtitleInput) {
    window.AdminComponents.Toast.error('Form elements not found');
    return;
  }
  
  const title = titleInput.value;
  const subtitle = subtitleInput.value;

  if (!editingId) {
    const modal = document.querySelector('.admin-modal-overlay');
    const uploader = modal?.uploader;
    const imageFile = uploader ? (uploader.getFiles()[0] || null) : null;

    if (!imageFile) {
      window.AdminComponents.Toast.error('Image is required');
      return;
    }

    try {
      await apiClient.uploadSlideshowImage(imageFile, title, subtitle);
      window.AdminComponents.Toast.success('Slide added successfully');
      closeSlideModal();
      // Refresh slideshow - check if we're in the index editor or slideshow page
      const editor = document.getElementById('slideshow-editor');
      if (editor && editor.style.display !== 'none') {
        // We're in index editor - refresh that
        if (window.loadSlideshowEditor) {
          await window.loadSlideshowEditor(editor);
        }
      }
      // Always refresh the slideshow page view if container exists
      const slideshowContainer = document.getElementById('slideshow-table-container');
      if (slideshowContainer) {
        await fetchSlideshow();
      }
    } catch (error) {
      console.error('Error saving slide:', error);
      window.AdminComponents.Toast.error(error.message || 'Failed to add slide');
    }
  } else {
    const modal = document.querySelector('.admin-modal-overlay');
    const uploader = modal?.uploader;
    const imageFile = uploader ? (uploader.getFiles()[0] || null) : null;

    try {
      await apiClient.updateSlideshowImage(editingId, { title, subtitle }, imageFile);
      window.AdminComponents.Toast.success('Slide updated successfully');
      closeSlideModal();
      // Refresh slideshow - check if we're in the index editor or slideshow page
      const editor = document.getElementById('slideshow-editor');
      if (editor && editor.style.display !== 'none') {
        // We're in index editor - refresh that
        if (window.loadSlideshowEditor) {
          await window.loadSlideshowEditor(editor);
        }
      }
      // Always refresh the slideshow page view if container exists
      const slideshowContainer = document.getElementById('slideshow-table-container');
      if (slideshowContainer) {
        await fetchSlideshow();
      }
    } catch (error) {
      console.error('Error updating slide:', error);
      window.AdminComponents.Toast.error(error.message || 'Failed to update slide');
    }
  }
}

function editSlide(id) {
  const slide = slideshowData.find(s => s.id === id);
  if (slide) openSlideModal(slide);
}

function deleteSlide(id) {
  const slide = slideshowData.find(s => s.id === id);
  if (!slide) return;

  window.AdminComponents.ConfirmDialog.show(
    `Are you sure you want to delete this slide? This action cannot be undone.`,
    async () => {
      try {
        await apiClient.deleteSlideshowImage(id);
        window.AdminComponents.Toast.success('Slide deleted successfully');
        await fetchSlideshow();
      } catch (error) {
        window.AdminComponents.Toast.error(error.message || 'Failed to delete slide');
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
  window.loadSlideshow = loadSlideshow;
  window.editSlide = editSlide;
  window.deleteSlide = deleteSlide;
  window.closeSlideModal = closeSlideModal;
  window.saveSlide = saveSlide;
  window.openSlideModal = openSlideModal;
  window.saveOrder = saveOrder;
}

})(); // End IIFE

