// Admin UI Components - Reusable components for admin portal
class AdminComponents {
  constructor() {
    this.toastContainer = null;
    this.initToastContainer();
  }

  // Initialize toast container
  initToastContainer() {
    if (!document.getElementById('toast-container')) {
      const container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 10px;
      `;
      document.body.appendChild(container);
      this.toastContainer = container;
    }
  }

  // Toast notifications
  Toast = {
    show(message, type = 'info', duration = 3000) {
      const toast = document.createElement('div');
      toast.className = `admin-toast admin-toast-${type}`;
      toast.textContent = message;
      toast.style.cssText = `
        background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
        min-width: 250px;
        max-width: 400px;
      `;

      const container = document.getElementById('toast-container') || document.body;
      container.appendChild(toast);

      setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }, duration);
    },

    success(message) {
      this.show(message, 'success');
    },

    error(message) {
      this.show(message, 'error', 5000);
    },

    info(message) {
      this.show(message, 'info');
    }
  };

  // Loading Spinner
  LoadingSpinner = {
    create() {
      const spinner = document.createElement('div');
      spinner.className = 'admin-loading-spinner';
      spinner.innerHTML = `
        <div class="spinner"></div>
        <p>Loading...</p>
      `;
      spinner.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px;
        gap: 16px;
      `;
      return spinner;
    }
  };

  // Empty State
  EmptyState = {
    create(message = 'No items found', actionLabel = null, actionCallback = null) {
      const empty = document.createElement('div');
      empty.className = 'admin-empty-state';
      empty.innerHTML = `
        <div style="text-align: center; padding: 60px 20px;">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: #94A3B8; margin-bottom: 16px;">
            <path d="M9 12h6m-3-3v6m-9 1V7a2 2 0 012-2h10a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
          </svg>
          <p style="color: #64748B; font-size: 16px; margin-bottom: 16px;">${message}</p>
          ${actionLabel ? `<button class="admin-btn admin-btn-primary" id="empty-action-btn">${actionLabel}</button>` : ''}
        </div>
      `;
      
      if (actionLabel && actionCallback) {
        empty.querySelector('#empty-action-btn').addEventListener('click', actionCallback);
      }
      
      return empty;
    }
  };

  // Confirm Dialog
  ConfirmDialog = {
    show(message, onConfirm, onCancel = null) {
      const overlay = document.createElement('div');
      overlay.className = 'admin-modal-overlay';
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.2s ease;
      `;

      const dialog = document.createElement('div');
      dialog.className = 'admin-confirm-dialog';
      dialog.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 24px;
        max-width: 400px;
        width: 90%;
        box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      `;

      dialog.innerHTML = `
        <h3 style="margin: 0 0 16px 0; color: #1E293B; font-size: 18px; font-weight: 600;">Confirm Action</h3>
        <p style="margin: 0 0 24px 0; color: #64748B; line-height: 1.5;">${message}</p>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button class="admin-btn admin-btn-secondary" id="confirm-cancel">Cancel</button>
          <button class="admin-btn admin-btn-danger" id="confirm-ok">Confirm</button>
        </div>
      `;

      overlay.appendChild(dialog);
      document.body.appendChild(overlay);

      const close = () => {
        overlay.style.animation = 'fadeOut 0.2s ease';
        setTimeout(() => overlay.remove(), 200);
      };

      dialog.querySelector('#confirm-ok').addEventListener('click', () => {
        close();
        if (onConfirm) onConfirm();
      });

      dialog.querySelector('#confirm-cancel').addEventListener('click', () => {
        close();
        if (onCancel) onCancel();
      });

      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          close();
          if (onCancel) onCancel();
        }
      });
    }
  };

  // Image Uploader Component
  ImageUploader = {
    create(options = {}) {
      const { multiple = false, preview = true, accept = 'image/*', maxSize = 10 * 1024 * 1024 } = options;
      
      const container = document.createElement('div');
      container.className = 'admin-image-uploader';
      
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = accept;
      input.multiple = multiple;
      input.style.display = 'none';
      
      const previewContainer = document.createElement('div');
      previewContainer.className = 'admin-image-preview';
      previewContainer.style.cssText = `
        display: ${preview ? 'grid' : 'none'};
        grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
        gap: 12px;
        margin-top: 12px;
      `;
      
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'admin-btn admin-btn-secondary';
      button.textContent = 'Choose Image' + (multiple ? 's' : '');
      button.style.cssText = `
        padding: 10px 20px;
        border: 1px solid #CBD5E1;
        background: white;
        color: #1E293B;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
      `;
      
      container.appendChild(input);
      container.appendChild(button);
      container.appendChild(previewContainer);
      
      const files = [];
      
      input.addEventListener('change', (e) => {
        const selectedFiles = Array.from(e.target.files);
        files.length = 0;
        
        selectedFiles.forEach((file, index) => {
          if (file.size > maxSize) {
            AdminComponents.Toast.error(`File ${file.name} is too large. Max size: ${maxSize / 1024 / 1024}MB`);
            return;
          }
          
          files.push(file);
          
          if (preview) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const previewItem = document.createElement('div');
              previewItem.style.cssText = `
                position: relative;
                border-radius: 8px;
                overflow: hidden;
                border: 1px solid #E2E8F0;
              `;
              
              const img = document.createElement('img');
              img.src = event.target.result;
              img.style.cssText = `
                width: 100%;
                height: 120px;
                object-fit: cover;
                display: block;
              `;
              
              const removeBtn = document.createElement('button');
              removeBtn.textContent = '×';
              removeBtn.style.cssText = `
                position: absolute;
                top: 4px;
                right: 4px;
                background: rgba(239, 68, 68, 0.9);
                color: white;
                border: none;
                border-radius: 4px;
                width: 24px;
                height: 24px;
                cursor: pointer;
                font-size: 18px;
                line-height: 1;
              `;
              
              removeBtn.addEventListener('click', () => {
                files.splice(index, 1);
                previewItem.remove();
                updateInput();
              });
              
              previewItem.appendChild(img);
              previewItem.appendChild(removeBtn);
              previewContainer.appendChild(previewItem);
            };
            reader.readAsDataURL(file);
          }
        });
        
        updateInput();
      });
      
      button.addEventListener('click', () => input.click());
      
      const updateInput = () => {
        const dt = new DataTransfer();
        files.forEach(file => dt.items.add(file));
        input.files = dt.files;
      };
      
      return {
        element: container,
        getFiles: () => files,
        clear: () => {
          files.length = 0;
          previewContainer.innerHTML = '';
          input.value = '';
        }
      };
    }
  };
}

// Create and export singleton instance
const adminComponents = new AdminComponents();

// Export for use in modules
if (typeof window !== 'undefined') {
  window.AdminComponents = adminComponents;
}

// Add CSS animations
if (!document.getElementById('admin-components-styles')) {
  const style = document.createElement('style');
  style.id = 'admin-components-styles';
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes fadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
    .admin-loading-spinner .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #E2E8F0;
      border-top-color: #3B82F6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

