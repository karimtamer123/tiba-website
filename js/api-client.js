// API Client for Tiba Manzalawi Group Website
// Centralized API calls and authentication handling

const API_BASE_URL = 'http://localhost:3000/api/v1';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('adminToken') || null;
  }

  // Get authorization header
  getAuthHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  // Set auth token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('adminToken', token);
    } else {
      localStorage.removeItem('adminToken');
    }
  }

  // Clear auth token
  clearToken() {
    this.token = null;
    localStorage.removeItem('adminToken');
  }

  // Generic fetch wrapper
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers
      }
    };

    try {
      console.log('API request:', url, config);
      const response = await fetch(url, config);
      
      // Check if response is JSON
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error(`Server returned non-JSON response: ${text.substring(0, 100)}`);
      }

      if (!response.ok) {
        console.error('API error response:', data);
        throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Cannot connect to server. Please make sure the backend is running on http://localhost:3000');
      }
      throw error;
    }
  }

  // GET request
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // POST request
  async post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  // PUT request
  async put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // POST with FormData (for file uploads)
  async postFormData(endpoint, formData) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {};
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // PUT with FormData (for file uploads)
  async putFormData(endpoint, formData) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {};
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: headers,
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // ============ AUTHENTICATION ============

  async login(username, password) {
    try {
      const data = await this.post('/admin/login', { username, password });
      console.log('Login API response:', data);
      if (data.token) {
        this.setToken(data.token);
        console.log('Token set in apiClient');
        // Verify it was stored
        const stored = localStorage.getItem('adminToken');
        console.log('Token verified in localStorage:', stored ? 'Yes' : 'No');
      } else {
        console.error('No token in login response');
      }
      return data;
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  }

  async verifyToken() {
    try {
      console.log('API: Verifying token...');
      console.log('API: Current token in apiClient:', this.token ? 'Yes' : 'No');
      console.log('API: Token from localStorage:', localStorage.getItem('adminToken') ? 'Yes' : 'No');
      
      // Make sure we have the latest token
      this.token = localStorage.getItem('adminToken') || this.token;
      
      const response = await this.get('/admin/verify');
      console.log('API: Verify response:', response);
      return response;
    } catch (error) {
      console.error('API: Verify token error:', error);
      this.clearToken();
      throw error;
    }
  }

  logout() {
    this.clearToken();
  }

  // ============ SLIDESHOW ============

  async getSlideshow() {
    return this.get('/slideshow');
  }

  async getSlideshowImage(id) {
    return this.get(`/slideshow/${id}`);
  }

  async uploadSlideshowImage(imageFile, title, subtitle) {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('title', title || '');
    formData.append('subtitle', subtitle || '');
    return this.postFormData('/slideshow', formData);
  }

  async updateSlideshowImage(id, data, imageFile = null) {
    // Always use FormData since backend expects multipart/form-data
    // This allows optional image upload while still updating other fields
    const formData = new FormData();
    if (imageFile) {
      formData.append('image', imageFile);
    }
    if (data.title !== undefined) formData.append('title', data.title);
    if (data.subtitle !== undefined) formData.append('subtitle', data.subtitle);
    if (data.display_order !== undefined) formData.append('display_order', data.display_order);
    return this.putFormData(`/slideshow/${id}`, formData);
  }

  async deleteSlideshowImage(id) {
    return this.delete(`/slideshow/${id}`);
  }

  async reorderSlideshow(order) {
    return this.post('/slideshow/reorder', { order });
  }

  // ============ STATISTICS ============

  async getStatistics() {
    return this.get('/statistics');
  }

  async getStatistic(id) {
    return this.get(`/statistics/${id}`);
  }

  async createStatistic(data) {
    return this.post('/statistics', data);
  }

  async updateStatistic(id, data) {
    return this.put(`/statistics/${id}`, data);
  }

  async deleteStatistic(id) {
    return this.delete(`/statistics/${id}`);
  }

  // ============ PROJECTS ============

  async getProjects(category = null, featured = null) {
    let endpoint = '/projects';
    const params = [];
    if (category) params.push(`category=${encodeURIComponent(category)}`);
    if (featured) params.push(`featured=${featured}`);
    if (params.length > 0) endpoint += '?' + params.join('&');
    return this.get(endpoint);
  }

  async getProject(id) {
    return this.get(`/projects/${id}`);
  }

  async getFeaturedProjects() {
    return this.get('/projects/featured/list');
  }

  async createProject(projectData, images = []) {
    const formData = new FormData();
    formData.append('title', projectData.title);
    formData.append('location', projectData.location);
    formData.append('description', projectData.description || '');
    formData.append('equipment', projectData.equipment || '');
    formData.append('category', projectData.category || 'all');
    formData.append('is_featured', projectData.is_featured || 'false');

    images.forEach(image => {
      formData.append('images', image);
    });

    return this.postFormData('/projects', formData);
  }

  async updateProject(id, projectData, newImages = []) {
    const formData = new FormData();
    if (projectData.title) formData.append('title', projectData.title);
    if (projectData.location) formData.append('location', projectData.location);
    if (projectData.description !== undefined) formData.append('description', projectData.description);
    if (projectData.equipment !== undefined) formData.append('equipment', projectData.equipment);
    if (projectData.category) formData.append('category', projectData.category);
    if (projectData.is_featured !== undefined) formData.append('is_featured', projectData.is_featured);

    newImages.forEach(image => {
      formData.append('images', image);
    });

    return this.putFormData(`/projects/${id}`, formData);
  }

  async deleteProject(id) {
    return this.delete(`/projects/${id}`);
  }

  async deleteProjectImage(projectId, imageId) {
    return this.delete(`/projects/${projectId}/images/${imageId}`);
  }

  // ============ PRODUCTS ============

  async getProducts(category = null) {
    let endpoint = '/products';
    if (category) endpoint += `?category=${encodeURIComponent(category)}`;
    return this.get(endpoint);
  }

  async getProduct(id) {
    return this.get(`/products/${id}`);
  }

  async createProduct(productData, images = []) {
    const formData = new FormData();
    formData.append('name', productData.name);
    formData.append('description', productData.description || '');
    formData.append('category', productData.category);
    formData.append('subcategory', productData.subcategory || '');
    formData.append('key_features', JSON.stringify(productData.key_features || []));
    if (productData.display_order) formData.append('display_order', productData.display_order);

    images.forEach(image => {
      formData.append('images', image);
    });

    return this.postFormData('/products', formData);
  }

  async updateProduct(id, productData, newImages = []) {
    const formData = new FormData();
    if (productData.name) formData.append('name', productData.name);
    if (productData.description !== undefined) formData.append('description', productData.description);
    if (productData.category) formData.append('category', productData.category);
    if (productData.subcategory !== undefined) formData.append('subcategory', productData.subcategory);
    if (productData.key_features !== undefined) formData.append('key_features', JSON.stringify(productData.key_features));
    if (productData.display_order !== undefined) formData.append('display_order', productData.display_order);

    newImages.forEach(image => {
      formData.append('images', image);
    });

    return this.putFormData(`/products/${id}`, formData);
  }

  async deleteProduct(id) {
    return this.delete(`/products/${id}`);
  }

  async deleteProductImage(productId, imageId) {
    return this.delete(`/products/${productId}/images/${imageId}`);
  }

  // ============ NEWS ============

  async getNews(featured = null) {
    let endpoint = '/news';
    if (featured) endpoint += `?featured=${featured}`;
    return this.get(endpoint);
  }

  async getNewsArticle(id) {
    return this.get(`/news/${id}`);
  }

  async getFeaturedNews() {
    return this.get('/news/featured/list');
  }

  async createNews(newsData, imageFile = null) {
    const formData = new FormData();
    formData.append('title', newsData.title);
    formData.append('content', newsData.content);
    formData.append('date', newsData.date || new Date().toISOString().split('T')[0]);
    formData.append('is_featured', newsData.is_featured || 'false');

    if (imageFile) {
      formData.append('image', imageFile);
    }

    return this.postFormData('/news', formData);
  }

  async updateNews(id, newsData, imageFile = null) {
    const formData = new FormData();
    if (newsData.title) formData.append('title', newsData.title);
    if (newsData.content !== undefined) formData.append('content', newsData.content);
    if (newsData.date) formData.append('date', newsData.date);
    if (newsData.is_featured !== undefined) formData.append('is_featured', newsData.is_featured);

    if (imageFile) {
      formData.append('image', imageFile);
    }

    return this.putFormData(`/news/${id}`, formData);
  }

  async deleteNews(id) {
    return this.delete(`/news/${id}`);
  }
}

// Create and export singleton instance
const apiClient = new ApiClient();

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = apiClient;
}

// Export to window for browser use
if (typeof window !== 'undefined') {
  window.apiClient = apiClient;
}

