// Admin Auth Guard - Token verification and route protection
class AdminAuth {
  constructor() {
    this.isAuthenticated = false;
    this.currentUser = null;
    this.checkingAuth = false; // Prevent multiple simultaneous checks
  }

  // Verify token on page load
  async verifyToken() {
    const token = localStorage.getItem('adminToken');
    console.log('Verifying token, token exists:', token ? 'Yes' : 'No');
    
    if (!token) {
      console.log('No token found');
      this.isAuthenticated = false;
      this.currentUser = null;
      return false;
    }

    try {
      // Check if apiClient exists
      if (!window.apiClient) {
        console.error('API client not available');
        this.isAuthenticated = false;
        this.currentUser = null;
        localStorage.removeItem('adminToken');
        return false;
      }

      console.log('Calling verifyToken API...');
      const response = await apiClient.verifyToken();
      console.log('Verify token response:', response);
      
      // Backend returns { valid: true, user: {...} }
      if (response.valid && response.user) {
        this.isAuthenticated = true;
        this.currentUser = response.user;
        console.log('Token verified successfully, user:', this.currentUser);
        return true;
      } else {
        console.error('Invalid verify response structure:', response);
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response
      });
      this.isAuthenticated = false;
      this.currentUser = null;
      // Clear token on any error
      localStorage.removeItem('adminToken');
      return false;
    }
  }

  // Check if user is authenticated
  async checkAuth() {
    // Prevent multiple simultaneous checks
    if (this.checkingAuth) {
      console.log('Auth check already in progress, waiting...');
      return this.isAuthenticated;
    }

    this.checkingAuth = true;
    try {
      console.log('=== AUTH CHECK ===');
      // Always check token, don't rely on cached state
      const verified = await this.verifyToken();
      console.log('Auth verification result:', verified);
      
      if (!verified) {
        console.log('Not authenticated, redirecting to login...');
        // Redirect to login (only if not already there, and use replace to prevent back button issues)
        if (!window.location.href.includes('admin-login.html')) {
          window.location.replace('admin-login.html');
        }
        return false;
      }
      
      console.log('Authentication successful');
      return true;
    } catch (error) {
      console.error('=== AUTH CHECK ERROR ===');
      console.error('Error:', error);
      console.error('Error message:', error.message);
      // If check fails, redirect to login
      if (!window.location.href.includes('admin-login.html')) {
        window.location.replace('admin-login.html');
      }
      return false;
    } finally {
      this.checkingAuth = false;
    }
  }

  // Logout
  logout() {
    apiClient.logout();
    this.isAuthenticated = false;
    this.currentUser = null;
    window.location.href = 'admin-login.html';
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }
}

// Create and export singleton instance
const adminAuth = new AdminAuth();

// Export for use in modules
if (typeof window !== 'undefined') {
  window.AdminAuth = adminAuth;
}

