/**
 * js/app.js
 * ─────────────────────────────────────────────────────────────
 * Application entry point.
 *   - Authentication (login / logout)
 *   - App bootstrap (init all modules, restore session)
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

/* ════════════════════════════════════════════════════════════
   AUTHENTICATION
   ════════════════════════════════════════════════════════════ */
const Auth = {

  /**
   * Attempt login with the submitted credentials.
   * On success: shows the app shell and navigates to dashboard.
   * On failure: displays an inline error with shake animation.
   */
  login() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const errEl    = document.getElementById('login-error');

    // Basic presence check
    if (!username || !password) {
      Auth._showError('Username and password are both required.');
      return;
    }

    // Credential check (client-side simulation)
    if (username !== ADMIN_CREDENTIALS.username || password !== ADMIN_CREDENTIALS.password) {
      Auth._showError('Invalid username or password. Try: admin / admin123');
      return;
    }

    // Clear error
    errEl.classList.add('hidden');

    // Persist session
    Session.save();

    // Update sidebar user block
    document.getElementById('sb-user-name').textContent = ADMIN_CREDENTIALS.name;
    document.getElementById('sb-avatar-char').textContent = ADMIN_CREDENTIALS.name.charAt(0).toUpperCase();

    // Swap visible pages
    document.getElementById('login-page').classList.add('hidden');
    document.getElementById('app-page').classList.remove('hidden');

    // Navigate to dashboard
    navigateTo('dashboard');
  },

  /**
   * Log out: clear session, show login page.
   */
  logout() {
    Session.clear();
    document.getElementById('app-page').classList.add('hidden');
    document.getElementById('login-page').classList.remove('hidden');
    // Reset login form
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('login-error').classList.add('hidden');
    Toast.info('You have been signed out.');
  },

  /** Show the inline login error */
  _showError(msg) {
    const el = document.getElementById('login-error');
    el.querySelector('span').textContent = msg;
    el.classList.remove('hidden');
    // Re-trigger shake animation
    el.style.animation = 'none';
    requestAnimationFrame(() => { el.style.animation = ''; });
  },

  /**
   * On page load, check for a persisted session.
   * If one exists, skip the login page and go straight to the app.
   */
  checkSession() {
    if (Session.exists()) {
      document.getElementById('sb-user-name').textContent = ADMIN_CREDENTIALS.name;
      document.getElementById('sb-avatar-char').textContent = ADMIN_CREDENTIALS.name.charAt(0).toUpperCase();
      document.getElementById('login-page').classList.add('hidden');
      document.getElementById('app-page').classList.remove('hidden');
      navigateTo('dashboard');
    }
  },
};

/* ════════════════════════════════════════════════════════════
   BOOTSTRAP
   ════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {

  // 1. Init data layer (loads from localStorage, seeds if empty)
  EmployeeDB.init();

  // 2. Update sidebar employee count badge
  updateSidebarBadge(EmployeeDB.getAll().length);

  // 3. Init modal (attaches event listeners)
  Modal.init();

  // 4. Login form — Enter key support
  ['login-username', 'login-password'].forEach(id => {
    document.getElementById(id)?.addEventListener('keydown', e => {
      if (e.key === 'Enter') Auth.login();
    });
  });

  // 5. Check if already logged in
  Auth.checkSession();
});
