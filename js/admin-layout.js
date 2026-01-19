// Admin Layout - Header, Sidebar, and Main Content Area
class AdminLayout {
  constructor() {
    this.sidebarOpen = true;
    this.initialized = false;
    // Don't auto-init - wait for explicit call after auth
  }

  init() {
    if (this.initialized) return;
    this.createLayout();
    this.setupNavigation();
    this.setupMobileMenu();
    this.initialized = true;
  }

  createLayout() {
    const app = document.getElementById('admin-app');
    if (!app) return;

    app.innerHTML = `
      <div class="admin-header">
        <div class="admin-header-content">
          <button class="admin-menu-toggle" id="menu-toggle" aria-label="Toggle menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 12h18M3 6h18M3 18h18"/>
            </svg>
          </button>
          <div class="admin-header-title">
            <h1>Tiba Admin Portal</h1>
          </div>
          <div class="admin-header-actions">
            <span class="admin-user-name" id="admin-username">Admin</span>
            <button class="admin-btn admin-btn-secondary" id="logout-btn">Logout</button>
          </div>
        </div>
      </div>
      <div class="admin-container">
        <aside class="admin-sidebar" id="admin-sidebar">
          <nav class="admin-nav">
            <a href="#/landing" class="admin-nav-item" data-route="/landing">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                <path d="M9 22V12h6v10"/>
              </svg>
              <span>Landing Page</span>
            </a>
            <a href="#/dashboard" class="admin-nav-item" data-route="/dashboard">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
              <span>Dashboard</span>
            </a>
            <a href="#/projects" class="admin-nav-item" data-route="/projects">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
              </svg>
              <span>Projects</span>
            </a>
            <a href="#/products" class="admin-nav-item" data-route="/products">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <path d="M3 6h18M16 10a4 4 0 01-8 0"/>
              </svg>
              <span>Products</span>
            </a>
            <a href="#/news" class="admin-nav-item" data-route="/news">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20.5M4 19.5A2.5 2.5 0 018.5 17H20.5M4 19.5V4.5A2.5 2.5 0 016.5 2H20.5v15H6.5A2.5 2.5 0 014 19.5z"/>
              </svg>
              <span>News</span>
            </a>
          </nav>
        </aside>
        <main class="admin-main" id="admin-main">
          <div class="admin-page-content" id="admin-page-content">
            <!-- Page content will be loaded here -->
          </div>
        </main>
      </div>
    `;

    // Setup logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (window.AdminAuth) {
          window.AdminAuth.logout();
        }
      });
    }

    // Update username
    this.updateUserInfo();
  }

  updateUserInfo() {
    if (window.AdminAuth) {
      const user = window.AdminAuth.getCurrentUser();
      const usernameEl = document.getElementById('admin-username');
      if (usernameEl && user) {
        usernameEl.textContent = user.username || 'Admin';
      }
    }
  }

  setupNavigation() {
    const navItems = document.querySelectorAll('.admin-nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const route = item.getAttribute('data-route');
        if (route && window.AdminRouter) {
          window.AdminRouter.navigate(route);
        }
      });
    });

    // Update active route on navigation
    if (window.AdminRouter) {
      const updateActiveRoute = () => {
        const currentRoute = window.AdminRouter.getCurrentRoute();
        navItems.forEach(item => {
          const route = item.getAttribute('data-route');
          if (route === currentRoute) {
            item.classList.add('active');
          } else {
            item.classList.remove('active');
          }
        });
      };
      window.addEventListener('hashchange', updateActiveRoute);
      updateActiveRoute();
    }
  }

  setupMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('admin-sidebar');
    
    if (menuToggle && sidebar) {
      menuToggle.addEventListener('click', () => {
        this.sidebarOpen = !this.sidebarOpen;
        sidebar.classList.toggle('open', this.sidebarOpen);
      });
    }
  }

  // Get main content area
  getContentArea() {
    return document.getElementById('admin-page-content');
  }
}

// Create singleton instance (but don't auto-init)
const adminLayout = new AdminLayout();

// Export for use in modules
if (typeof window !== 'undefined') {
  window.AdminLayout = adminLayout;
}

