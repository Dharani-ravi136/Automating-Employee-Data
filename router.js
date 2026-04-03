/**
 * js/router.js
 * ─────────────────────────────────────────────────────────────
 * Client-side SPA router.
 * Controls which "view" is shown inside #main-view-root.
 * Each view is a function in the Views module (views.js).
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

/* ── Router state ─────────────────────────────────────────── */
const RouterState = {
  currentPage: 'dashboard',
  editEmployeeId: null,
};

const PAGE_META = {
  dashboard: { title: 'Dashboard',     crumb: 'Home › Dashboard',     navKey: 'dashboard' },
  employees: { title: 'Employees',     crumb: 'Home › Employees',     navKey: 'employees' },
  add:       { title: 'Add Employee',  crumb: 'Home › Add Employee',  navKey: 'add'       },
  edit:      { title: 'Edit Employee', crumb: 'Home › Edit Employee', navKey: 'employees' },
};

/**
 * Navigate to a page.
 * @param {string} page — 'dashboard' | 'employees' | 'add' | 'edit'
 * @param {object} [params] — { employeeId: number }
 */
function navigateTo(page, params = {}) {
  RouterState.currentPage = page;
  if (params.employeeId !== undefined) {
    RouterState.editEmployeeId = params.employeeId;
  }

  const meta = PAGE_META[page] || PAGE_META.dashboard;

  // Update nav + topbar
  setActiveNavLink(meta.navKey);
  setTopbarTitle(meta.title, meta.crumb);
  closeSidebar();

  // Scroll to top
  document.getElementById('main-view-root').scrollTop = 0;

  // Render the correct view
  const root = document.getElementById('main-view-root');
  root.innerHTML = '';

  switch (page) {
    case 'dashboard': Views.dashboard(); break;
    case 'employees': Views.employeeList(); break;
    case 'add':       Views.employeeForm(null); break;
    case 'edit':      Views.employeeForm(RouterState.editEmployeeId); break;
    default:          Views.dashboard();
  }
}
