/**
 * js/ui.js
 * ─────────────────────────────────────────────────────────────
 * UI Utilities:
 *   - Toast notification system
 *   - Confirm modal
 *   - Form validation engine
 *   - Shared helpers (escape, formatDate, padId, etc.)
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

/* ════════════════════════════════════════════════════════════
   TOAST NOTIFICATION SYSTEM
   ════════════════════════════════════════════════════════════ */
const Toast = (() => {

  const TYPES = {
    success: { icon: '✅', title: 'Success',  duration: 4500 },
    error:   { icon: '❌', title: 'Error',    duration: 6000 },
    warning: { icon: '⚠️', title: 'Warning',  duration: 5200 },
    info:    { icon: 'ℹ️', title: 'Info',     duration: 4000 },
  };

  function getContainer() {
    let el = document.getElementById('toast-container');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast-container';
      document.body.appendChild(el);
    }
    return el;
  }

  function show(message, type = 'info') {
    const cfg  = TYPES[type] || TYPES.info;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    toast.innerHTML = `
      <span class="toast-icon">${cfg.icon}</span>
      <div class="toast-body">
        <div class="toast-title">${cfg.title}</div>
        <div class="toast-msg">${escapeHtml(message)}</div>
      </div>
      <button class="toast-close" aria-label="Close">✕</button>
      <div class="toast-progress" style="animation: toastBar ${cfg.duration}ms linear forwards;"></div>
    `;

    // Inject the keyframe once
    if (!document.getElementById('_toast_kf')) {
      const s = document.createElement('style');
      s.id = '_toast_kf';
      s.textContent = '@keyframes toastBar { from { transform:scaleX(1) } to { transform:scaleX(0) } }';
      document.head.appendChild(s);
    }

    const dismiss = () => {
      toast.classList.add('toast-leaving');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
    };

    toast.querySelector('.toast-close').addEventListener('click', dismiss);
    setTimeout(dismiss, cfg.duration);
    getContainer().appendChild(toast);
  }

  return {
    show,
    success: (msg) => show(msg, 'success'),
    error:   (msg) => show(msg, 'error'),
    warning: (msg) => show(msg, 'warning'),
    info:    (msg) => show(msg, 'info'),
  };
})();

/* ════════════════════════════════════════════════════════════
   CONFIRM MODAL
   ════════════════════════════════════════════════════════════ */
const Modal = (() => {
  let _onConfirm = null;

  function open(employeeName, onConfirm) {
    _onConfirm = onConfirm;
    document.getElementById('modal-emp-name').textContent = employeeName;
    document.getElementById('confirm-modal').classList.add('open');
  }

  function close() {
    document.getElementById('confirm-modal').classList.remove('open');
    _onConfirm = null;
  }

  function confirm() {
    if (typeof _onConfirm === 'function') _onConfirm();
    close();
  }

  function init() {
    // Close on overlay click
    document.getElementById('confirm-modal').addEventListener('click', function(e) {
      if (e.target === this) close();
    });
    document.getElementById('modal-cancel-btn').addEventListener('click', close);
    document.getElementById('modal-confirm-btn').addEventListener('click', confirm);
  }

  return { open, close, confirm, init };
})();

/* ════════════════════════════════════════════════════════════
   FORM VALIDATION ENGINE
   ════════════════════════════════════════════════════════════ */
const Validator = (() => {

  /**
   * Validation rules — each field maps to { test(value): bool, message: string }
   */
  const RULES = {
    name: {
      test: v => v.trim().length >= 2,
      message: 'Full name must be at least 2 characters.'
    },
    email: {
      test: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
      message: 'Please enter a valid email address (e.g. name@company.in).'
    },
    phone: {
      // Indian mobile: starts 6-9, exactly 10 digits
      test: v => /^[6-9]\d{9}$/.test(v.trim()),
      message: 'Enter a valid 10-digit Indian mobile number starting with 6–9.'
    },
    department: {
      test: v => v.trim() !== '',
      message: 'Please select a department.'
    },
    role: {
      test: v => v.trim().length >= 2,
      message: 'Role / designation must be at least 2 characters.'
    },
    joining_date: {
      test: v => v !== '' && !isNaN(Date.parse(v)),
      message: 'Please select a valid joining date.'
    },
    status: {
      test: v => ['Active', 'Inactive'].includes(v),
      message: 'Please select a valid employment status.'
    },
  };

  /**
   * Validates a single field and toggles its error state.
   * @param {string} fieldId — the input element's id
   * @param {string} fieldName — key in RULES
   * @param {string} value
   * @returns {boolean}
   */
  function validateField(fieldId, fieldName, value) {
    const rule   = RULES[fieldName];
    if (!rule) return true;

    const el     = document.getElementById(fieldId);
    const errEl  = document.getElementById(fieldId + '-error');
    const isValid = rule.test(value);

    if (el) el.classList.toggle('error', !isValid);
    if (errEl) {
      errEl.textContent = rule.message;
      errEl.classList.toggle('visible', !isValid);
    }

    return isValid;
  }

  /**
   * Validates all fields in a form object.
   * @param {{ fieldId, fieldName, value }[]} fields
   * @returns {boolean} all valid
   */
  function validateAll(fields) {
    let allValid = true;
    fields.forEach(({ fieldId, fieldName, value }) => {
      if (!validateField(fieldId, fieldName, value)) allValid = false;
    });
    if (!allValid) Toast.error('Please fix the highlighted fields before saving.');
    return allValid;
  }

  /** Clears all error state on a field */
  function clearField(fieldId) {
    const el    = document.getElementById(fieldId);
    const errEl = document.getElementById(fieldId + '-error');
    if (el)    el.classList.remove('error');
    if (errEl) errEl.classList.remove('visible');
  }

  return { validateField, validateAll, clearField };
})();

/* ════════════════════════════════════════════════════════════
   SHARED HELPERS
   ════════════════════════════════════════════════════════════ */

/**
 * Escape HTML special characters to prevent XSS.
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Format an ISO date string to readable DD MMM YYYY.
 */
function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  } catch { return dateStr; }
}

/**
 * Zero-pad an ID: 7 → "0007"
 */
function padId(n) {
  return String(n).padStart(4, '0');
}

/**
 * Get "June 2025" style label for current month.
 */
function currentMonthLabel() {
  return new Date().toLocaleString('en-IN', { month: 'long', year: 'numeric' });
}

/**
 * Generate pagination HTML buttons.
 * @param {number} currentPage
 * @param {number} totalPages
 * @param {string} callbackName — global function name called with page number
 */
function buildPaginationHtml(currentPage, totalPages, callbackName) {
  if (totalPages <= 1) return '';

  let html = `<button class="page-btn" onclick="${callbackName}(${currentPage - 1})"
               ${currentPage === 1 ? 'disabled' : ''}>‹ Prev</button>`;

  for (let i = 1; i <= totalPages; i++) {
    // Ellipsis for long page ranges
    if (totalPages > 7 && Math.abs(i - currentPage) > 2 && i !== 1 && i !== totalPages) {
      if (i === 2 || i === totalPages - 1) {
        html += `<button class="page-btn" disabled>…</button>`;
      }
      continue;
    }
    html += `<button class="page-btn ${i === currentPage ? 'active' : ''}"
              onclick="${callbackName}(${i})">${i}</button>`;
  }

  html += `<button class="page-btn" onclick="${callbackName}(${currentPage + 1})"
            ${currentPage === totalPages ? 'disabled' : ''}>Next ›</button>`;

  return html;
}

/**
 * Update the sidebar badge showing total employee count.
 */
function updateSidebarBadge(count) {
  const el = document.getElementById('sidebar-emp-count');
  if (el) el.textContent = count;
}

/**
 * Set the active sidebar link.
 */
function setActiveNavLink(pageKey) {
  document.querySelectorAll('.sb-link[data-page]').forEach(el => {
    el.classList.toggle('active', el.dataset.page === pageKey);
  });
}

/**
 * Update the topbar title and breadcrumb.
 */
function setTopbarTitle(title, crumb) {
  const t = document.getElementById('topbar-title');
  const c = document.getElementById('topbar-crumb');
  if (t) t.textContent = title;
  if (c) c.textContent = crumb || `Home › ${title}`;
}

/**
 * Toggle sidebar on mobile.
 */
function toggleSidebar() {
  document.getElementById('app-sidebar').classList.toggle('sidebar-open');
}

/**
 * Close sidebar (used on navigation).
 */
function closeSidebar() {
  document.getElementById('app-sidebar')?.classList.remove('sidebar-open');
}
