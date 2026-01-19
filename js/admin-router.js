// Admin Router - Hash-based client-side routing
class AdminRouter {
  constructor() {
    this.routes = {};
    this.currentRoute = null;
    this.init();
  }

  init() {
    // Listen for hash changes
    window.addEventListener('hashchange', () => this.handleRoute());
    // Don't auto-handle route on init - wait for explicit call after auth
  }

  // Register a route
  register(path, handler) {
    this.routes[path] = handler;
  }

  // Navigate to a route
  navigate(path, replace = false) {
    console.log('Router navigate called with path:', path, 'replace:', replace);
    // Ensure path starts with /
    const normalizedPath = path.startsWith('/') ? path : '/' + path;
    if (replace) {
      // Use replaceState to avoid adding to history and triggering unnecessary events
      window.history.replaceState(null, '', '#' + normalizedPath);
      this.handleRoute();
    } else {
      window.location.hash = normalizedPath;
    }
  }

  // Get current route from hash
  getCurrentRoute() {
    const hash = window.location.hash.slice(1);
    if (!hash) return '/landing';
    // Ensure route starts with /
    const route = hash.startsWith('/') ? hash : '/' + hash;
    return route;
  }

  // Handle route change
  async handleRoute() {
    const route = this.getCurrentRoute();
    console.log('Handling route:', route);
    console.log('Available routes:', Object.keys(this.routes));
    const handler = this.routes[route];

    if (handler) {
      this.currentRoute = route;
      console.log('Route handler found, executing...');
      try {
        await handler();
        console.log('Route handler completed successfully');
      } catch (error) {
        console.error('Route handler error:', error);
        console.error('Error stack:', error.stack);
        this.showError('Failed to load page. Please try again.');
      }
    } else {
      console.warn('Route handler not found for:', route);
      console.warn('Available routes:', Object.keys(this.routes));
      // Don't auto-redirect - show error instead
      this.showError(`Page "${route}" not found. Available routes: ${Object.keys(this.routes).join(', ')}`);
    }
  }

  // Show error message
  showError(message) {
    if (window.AdminComponents && window.AdminComponents.Toast) {
      window.AdminComponents.Toast.error(message);
    } else {
      alert(message);
    }
  }
}

// Create and export singleton instance
const adminRouter = new AdminRouter();

// Export for use in modules
if (typeof window !== 'undefined') {
  window.AdminRouter = adminRouter;
}

