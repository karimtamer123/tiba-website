// HR Authentication Module
class HRAuth {
  constructor() {
    this.isAuthenticated = false;
    this.currentUser = null;
    this.checkingAuth = false;
  }

  async verifyToken() {
    if (this.checkingAuth) return false;
    this.checkingAuth = true;
    
    try {
      const token = localStorage.getItem('hrToken');
      if (!token) {
        this.isAuthenticated = false;
        this.currentUser = null;
        return false;
      }

      const response = await fetch('http://localhost:3000/api/v1/hr/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Token verification failed');
      }

      const data = await response.json();
      this.isAuthenticated = true;
      this.currentUser = data.user || { username: 'HR User' };
      return true;
    } catch (error) {
      console.error('HR Token verification error:', error);
      localStorage.removeItem('hrToken');
      this.isAuthenticated = false;
      this.currentUser = null;
      return false;
    } finally {
      this.checkingAuth = false;
    }
  }

  async checkAuth() {
    const verified = await this.verifyToken();
    if (!verified) {
      if (!window.location.href.includes('hr-login.html')) {
        window.location.replace('hr-login.html');
      }
      return false;
    }
    return true;
  }

  logout() {
    localStorage.removeItem('hrToken');
    this.isAuthenticated = false;
    this.currentUser = null;
    window.location.replace('hr-login.html');
  }

  getCurrentUser() {
    return this.currentUser;
  }
}

const hrAuth = new HRAuth();

if (typeof window !== 'undefined') {
  window.HRAuth = hrAuth;
}

