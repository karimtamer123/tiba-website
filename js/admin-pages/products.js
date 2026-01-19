// Products Page
(function() {
'use strict';

let productsData = [];
let editingId = null;
let currentCategoryFilter = 'all';

async function loadProducts() {
  const content = window.AdminLayout.getContentArea();
  if (!content) return;

  content.innerHTML = `
    <div class="admin-page-header">
      <h2>Products</h2>
      <p>Manage product catalog and categories</p>
      <div class="admin-page-actions">
        <select id="category-filter" class="admin-select">
          <option value="all">All Categories</option>
          <option value="air-handling-units">Air Handling Units</option>
          <option value="chillers">Chillers</option>
          <option value="cooling-towers">Cooling Towers</option>
          <option value="fan-coil-units">Fan Coil Units</option>
          <option value="variable-refrigerant-flow">Variable Refrigerant Flow</option>
          <option value="air-outlets-dampers">Air Outlets & Dampers</option>
          <option value="pumps">Pumps</option>
        </select>
        <input type="text" id="search-input" class="admin-input" placeholder="Search products...">
        <button class="admin-btn admin-btn-primary" id="add-product-btn">Add Product</button>
      </div>
    </div>
    <div class="admin-table-container" id="products-table-container">
      ${window.AdminComponents.LoadingSpinner.create().outerHTML}
    </div>
  `;

  setupEventListeners();
  await fetchProducts();
}

function setupEventListeners() {
  const categoryFilter = document.getElementById('category-filter');
  const searchInput = document.getElementById('search-input');
  const addBtn = document.getElementById('add-product-btn');

  if (categoryFilter) {
    categoryFilter.addEventListener('change', (e) => {
      currentCategoryFilter = e.target.value;
      fetchProducts();
    });
  }

  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        filterProducts(e.target.value);
      }, 300);
    });
  }

  if (addBtn) {
    addBtn.addEventListener('click', () => openProductModal());
  }
}

async function fetchProducts() {
  const container = document.getElementById('products-table-container');
  try {
    const category = currentCategoryFilter === 'all' ? null : currentCategoryFilter;
    const data = await apiClient.getProducts(category);
    productsData = data;
    renderTable();
  } catch (error) {
    container.innerHTML = window.AdminComponents.EmptyState.create(
      'Failed to load products. Please try again.',
      'Retry',
      () => fetchProducts()
    ).outerHTML;
    window.AdminComponents.Toast.error('Failed to load products');
  }
}

function filterProducts(searchTerm) {
  const filtered = productsData.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  renderTable(filtered);
}

function renderTable(data = productsData) {
  const container = document.getElementById('products-table-container');
  if (!container) return;

  if (data.length === 0) {
    container.innerHTML = window.AdminComponents.EmptyState.create(
      'No products found. Add your first product to get started.',
      'Add Product',
      () => openProductModal()
    ).outerHTML;
    return;
  }

  container.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Image</th>
          <th>Name</th>
          <th>Category</th>
          <th>Subcategory</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${data.map(product => `
          <tr>
            <td>
              ${product.images && product.images.length > 0 ? 
                `<img src="http://localhost:3000${product.images[0].image_path}" alt="${escapeHtml(product.name)}" class="admin-table-thumb">` :
                '<span class="admin-no-image">No image</span>'
              }
            </td>
            <td><strong>${escapeHtml(product.name || '')}</strong></td>
            <td>${escapeHtml(product.category || '')}</td>
            <td>${escapeHtml(product.subcategory || '')}</td>
            <td>
              <button class="admin-btn-icon" onclick="editProduct(${product.id})" title="Edit">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="admin-btn-icon admin-btn-danger" onclick="deleteProduct(${product.id})" title="Delete">
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

function openProductModal(product = null) {
  editingId = product ? product.id : null;
  const modal = document.createElement('div');
  modal.className = 'admin-modal-overlay';
  modal.innerHTML = `
    <div class="admin-modal admin-modal-large">
      <div class="admin-modal-header">
        <h3>${editingId ? 'Edit' : 'Add'} Product</h3>
        <button class="admin-btn-icon" onclick="closeProductModal()">×</button>
      </div>
      <form id="product-form" class="admin-modal-body">
        <div class="admin-form-group">
          <label>Name *</label>
          <input type="text" id="product-name" value="${product ? escapeHtml(product.name) : ''}" required>
        </div>
        <div class="admin-form-row">
          <div class="admin-form-group">
            <label>Category *</label>
            <select id="product-category" required>
              <option value="">Select category</option>
              <option value="air-handling-units" ${product?.category === 'air-handling-units' ? 'selected' : ''}>Air Handling Units</option>
              <option value="chillers" ${product?.category === 'chillers' ? 'selected' : ''}>Chillers</option>
              <option value="cooling-towers" ${product?.category === 'cooling-towers' ? 'selected' : ''}>Cooling Towers</option>
              <option value="fan-coil-units" ${product?.category === 'fan-coil-units' ? 'selected' : ''}>Fan Coil Units</option>
              <option value="variable-refrigerant-flow" ${product?.category === 'variable-refrigerant-flow' ? 'selected' : ''}>Variable Refrigerant Flow</option>
              <option value="air-outlets-dampers" ${product?.category === 'air-outlets-dampers' ? 'selected' : ''}>Air Outlets & Dampers</option>
              <option value="pumps" ${product?.category === 'pumps' ? 'selected' : ''}>Pumps</option>
            </select>
          </div>
          <div class="admin-form-group">
            <label>Subcategory</label>
            <select id="product-subcategory">
              <option value="">Select subcategory</option>
              <!-- Options will be populated dynamically based on category -->
            </select>
          </div>
        </div>
        <div class="admin-form-group">
          <label>Description</label>
          <textarea id="product-description" rows="4">${product ? escapeHtml(product.description || '') : ''}</textarea>
        </div>
        <div class="admin-form-group">
          <label>Key Features (one per line)</label>
          <textarea id="product-features" rows="4" placeholder="Feature 1&#10;Feature 2&#10;Feature 3">${product && product.key_features ? product.key_features.join('\n') : ''}</textarea>
        </div>
        <div class="admin-form-group">
          <label>Images</label>
          <div id="product-image-uploader"></div>
          ${product && product.images && product.images.length > 0 ? `
            <div class="admin-existing-images">
              <p>Current images:</p>
              <div class="admin-image-grid">
                ${product.images.map(img => `
                  <div class="admin-image-item">
                    <img src="http://localhost:3000${img.image_path}" alt="Product image">
                    <button type="button" class="admin-btn-icon admin-btn-danger" onclick="removeProductImage(${product.id}, ${img.id})" title="Remove">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                      </svg>
                    </button>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </form>
      <div class="admin-modal-footer">
        <button class="admin-btn admin-btn-secondary" onclick="closeProductModal()">Cancel</button>
        <button class="admin-btn admin-btn-primary" onclick="saveProduct()">Save</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  
  // Initialize image uploader
  const uploaderContainer = document.getElementById('product-image-uploader');
  if (uploaderContainer) {
    const uploader = window.AdminComponents.ImageUploader.create({ multiple: true, preview: true });
    uploaderContainer.appendChild(uploader.element);
    modal.uploader = uploader;
  }

  // Define subcategory options for each category
  const subcategoryOptions = {
    'air-handling-units': [
      { value: 'Saiver', label: 'Saiver' },
      { value: 'Trox', label: 'Trox' }
    ],
    'chillers': [
      { value: 'Dunham-Bush', label: 'Dunham-Bush' }
    ],
    'cooling-towers': [
      { value: 'Open Type', label: 'Open Type' },
      { value: 'Closed Type', label: 'Closed Type' },
      { value: 'Evaporative Condensers', label: 'Evaporative Condensers' }
    ],
    'fan-coil-units': [
      { value: 'Trox', label: 'Trox' },
      { value: 'Saiver', label: 'Saiver' }
    ],
    'variable-refrigerant-flow': [], // No subcategories
    'air-outlets-dampers': [
      { value: 'Air Outlets', label: 'Air Outlets' },
      { value: 'Dampers', label: 'Dampers' }
    ],
    'pumps': [
      { value: 'Xylem', label: 'Xylem' },
      { value: 'Lowara', label: 'Lowara' },
      { value: 'Bell & Gossett', label: 'Bell & Gossett' },
      { value: 'Flygt', label: 'Flygt' }
    ]
  };

  // Function to update subcategory options based on selected category
  function updateSubcategoryOptions() {
    const categorySelect = document.getElementById('product-category');
    const subcategorySelect = document.getElementById('product-subcategory');
    const selectedCategory = categorySelect.value;
    const currentSubcategory = product ? product.subcategory : null;
    
    // Clear existing options
    subcategorySelect.innerHTML = '<option value="">Select subcategory</option>';
    
    // Add options for selected category
    if (selectedCategory && subcategoryOptions[selectedCategory]) {
      subcategoryOptions[selectedCategory].forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.label;
        // Select if it matches the current product's subcategory
        if (currentSubcategory && currentSubcategory === option.value) {
          optionElement.selected = true;
        }
        subcategorySelect.appendChild(optionElement);
      });
    }
    
    // If no subcategories for this category, disable the field and clear value
    if (!selectedCategory || subcategoryOptions[selectedCategory]?.length === 0) {
      subcategorySelect.disabled = true;
      subcategorySelect.value = '';
    } else {
      subcategorySelect.disabled = false;
    }
  }

  // Set initial subcategory options based on product's category (if editing)
  if (product && product.category) {
    // Set the category first, then update subcategories
    const categorySelect = document.getElementById('product-category');
    categorySelect.value = product.category;
  }
  updateSubcategoryOptions();
  
  // Update subcategory options when category changes
  document.getElementById('product-category').addEventListener('change', updateSubcategoryOptions);

  modal.querySelector('#product-form').addEventListener('submit', (e) => {
    e.preventDefault();
    saveProduct();
  });
}

function closeProductModal() {
  const modal = document.querySelector('.admin-modal-overlay');
  if (modal) {
    if (modal.uploader) modal.uploader.clear();
    modal.remove();
  }
  editingId = null;
}

async function saveProduct() {
  const name = document.getElementById('product-name').value;
  const category = document.getElementById('product-category').value;
  const subcategory = document.getElementById('product-subcategory').value;
  const description = document.getElementById('product-description').value;
  const featuresText = document.getElementById('product-features').value;
  const keyFeatures = featuresText.split('\n').filter(f => f.trim()).map(f => f.trim());

  if (!name || !category) {
    window.AdminComponents.Toast.error('Name and category are required');
    return;
  }

  const modal = document.querySelector('.admin-modal-overlay');
  const uploader = modal?.uploader;
  const images = uploader ? uploader.getFiles() : [];

  try {
    const productData = { name, category, subcategory, description, key_features: keyFeatures };
    
    if (editingId) {
      await apiClient.updateProduct(editingId, productData, images);
      window.AdminComponents.Toast.success('Product updated successfully');
    } else {
      await apiClient.createProduct(productData, images);
      window.AdminComponents.Toast.success('Product created successfully');
    }
    closeProductModal();
    await fetchProducts();
  } catch (error) {
    window.AdminComponents.Toast.error(error.message || 'Failed to save product');
  }
}

async function editProduct(id) {
  try {
    const product = await apiClient.getProduct(id);
    openProductModal(product);
  } catch (error) {
    window.AdminComponents.Toast.error('Failed to load product');
  }
}

function deleteProduct(id) {
  const product = productsData.find(p => p.id === id);
  if (!product) return;

  window.AdminComponents.ConfirmDialog.show(
    `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
    async () => {
      try {
        await apiClient.deleteProduct(id);
        window.AdminComponents.Toast.success('Product deleted successfully');
        await fetchProducts();
      } catch (error) {
        window.AdminComponents.Toast.error(error.message || 'Failed to delete product');
      }
    }
  );
}

async function removeProductImage(productId, imageId) {
  try {
    await apiClient.deleteProductImage(productId, imageId);
    window.AdminComponents.Toast.success('Image removed successfully');
    await editProduct(productId);
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
  window.loadProducts = loadProducts;
  window.editProduct = editProduct;
  window.deleteProduct = deleteProduct;
  window.closeProductModal = closeProductModal;
  window.saveProduct = saveProduct;
  window.openProductModal = openProductModal;
  window.removeProductImage = removeProductImage;
}

})(); // End IIFE

