// Dashboard Page
async function loadDashboard() {
  const content = window.AdminLayout.getContentArea();
  if (!content) return;

  content.innerHTML = `
    <div class="admin-page-header">
      <h2>Dashboard</h2>
      <p>Manage your website content from here</p>
    </div>
    <div class="admin-dashboard-grid">
      <a href="#/landing" class="admin-dashboard-card" style="text-decoration: none; color: inherit;">
        <div class="dashboard-card-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <path d="M9 22V12h6v10"/>
          </svg>
        </div>
        <h3>Landing Page</h3>
        <p>Edit homepage content, slideshow, and statistics</p>
      </a>
      <a href="#/products" class="admin-dashboard-card" style="text-decoration: none; color: inherit;">
        <div class="dashboard-card-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <path d="M3 6h18M16 10a4 4 0 01-8 0"/>
          </svg>
        </div>
        <h3>Products</h3>
        <p>Manage product catalog and categories</p>
      </a>
      <a href="#/projects" class="admin-dashboard-card" style="text-decoration: none; color: inherit;">
        <div class="dashboard-card-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
          </svg>
        </div>
        <h3>Projects</h3>
        <p>Manage project portfolio and featured projects</p>
      </a>
      <a href="#/news" class="admin-dashboard-card" style="text-decoration: none; color: inherit;">
        <div class="dashboard-card-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20.5M4 19.5A2.5 2.5 0 018.5 17H20.5M4 19.5V4.5A2.5 2.5 0 016.5 2H20.5v15H6.5A2.5 2.5 0 014 19.5z"/>
          </svg>
        </div>
        <h3>News</h3>
        <p>Manage news articles and featured content</p>
      </a>
      <div class="admin-dashboard-card" style="opacity: 0.6; cursor: not-allowed;">
        <div class="dashboard-card-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 3v18h18M7 16l4-4 4 4 6-6"/>
          </svg>
        </div>
        <h3>Statistics</h3>
        <p>Manage website statistics and metrics</p>
        <span style="font-size: 0.85rem; color: #94A3B8; margin-top: 0.5rem; display: block;">Coming soon</span>
      </div>
      <div class="admin-dashboard-card" style="opacity: 0.6; cursor: not-allowed;">
        <div class="dashboard-card-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <path d="M9 9h6v6H9z"/>
          </svg>
        </div>
        <h3>Slideshow</h3>
        <p>Manage hero slideshow images and order</p>
        <span style="font-size: 0.85rem; color: #94A3B8; margin-top: 0.5rem; display: block;">Coming soon</span>
      </div>
    </div>
  `;

  // Setup click handlers for dashboard cards
  setupDashboardCardNavigation();
}

function setupDashboardCardNavigation() {
  // Use event delegation for dashboard card links
  const dashboardGrid = document.querySelector('.admin-dashboard-grid');
  if (dashboardGrid && window.AdminRouter) {
    dashboardGrid.addEventListener('click', (e) => {
      const cardLink = e.target.closest('a.admin-dashboard-card');
      if (cardLink && cardLink.href) {
        e.preventDefault();
        const hash = cardLink.getAttribute('href');
        if (hash && hash.startsWith('#')) {
          const route = hash.substring(1);
          console.log('Dashboard card clicked, navigating to:', route);
          window.AdminRouter.navigate(route);
        }
      }
    });
  }
}

// Export for router
if (typeof window !== 'undefined') {
  window.loadDashboard = loadDashboard;
}

