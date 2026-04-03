/**
 * js/views.js
 * ─────────────────────────────────────────────────────────────
 * All view renderers — each function writes HTML into
 * #main-view-root and wires up its own event handlers.
 *
 * Views:
 *   Views.dashboard()          — stat cards + dept chart + recent table
 *   Views.employeeList()       — search + filter + paginated table
 *   Views.employeeForm(id)     — add (id=null) or edit form
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

/* Table filter state (persists across renders within the session) */
const TableState = {
  query:  '',
  dept:   '',
  status: '',
  page:   1,
};

/* ════════════════════════════════════════════════════════════
   VIEW ROOT HELPER
   ════════════════════════════════════════════════════════════ */
function getViewRoot() {
  return document.getElementById('main-view-root');
}

/* ════════════════════════════════════════════════════════════
   DASHBOARD VIEW
   ════════════════════════════════════════════════════════════ */
const Views = {

  dashboard() {
    const root    = getViewRoot();
    const s       = EmployeeDB.stats();
    const all     = EmployeeDB.getAll();
    const recent  = all.slice(0, 5);

    root.innerHTML = `

    <!-- ── Stat cards ──────────────────────────────── -->
    <div class="stats-grid">

      <div class="stat-card total">
        <div class="stat-icon-box amber">👥</div>
        <div>
          <div class="stat-label">Total Employees</div>
          <div class="stat-value" id="dash-total">${s.total}</div>
          <div class="stat-sub">All departments combined</div>
        </div>
      </div>

      <div class="stat-card active">
        <div class="stat-icon-box green">✅</div>
        <div>
          <div class="stat-label">Active</div>
          <div class="stat-value">${s.active}</div>
          <div class="stat-sub">${s.total > 0 ? Math.round(s.active / s.total * 100) : 0}% of workforce</div>
        </div>
      </div>

      <div class="stat-card inactive">
        <div class="stat-icon-box red">⏸️</div>
        <div>
          <div class="stat-label">Inactive</div>
          <div class="stat-value">${s.inactive}</div>
          <div class="stat-sub">On leave / departed</div>
        </div>
      </div>

      <div class="stat-card new">
        <div class="stat-icon-box blue">🆕</div>
        <div>
          <div class="stat-label">Joined This Month</div>
          <div class="stat-value">${s.newThisMonth}</div>
          <div class="stat-sub">${currentMonthLabel()}</div>
        </div>
      </div>

    </div><!-- /.stats-grid -->

    <!-- ── Dashboard grid: recent + dept breakdown ─── -->
    <div class="dash-grid">

      <!-- Recent employees card -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">🕐 Recently Added</span>
          <button class="btn btn-ghost" style="font-size:12.5px;padding:6px 13px;"
                  onclick="navigateTo('employees')">View All →</button>
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${recent.length === 0
                ? `<tr><td colspan="6">
                    <div class="empty-state">
                      <div class="empty-icon">👥</div>
                      <div class="empty-title">No employees yet</div>
                      <div class="empty-sub"><a href="#" onclick="navigateTo('add');return false">Add your first employee →</a></div>
                    </div>
                  </td></tr>`
                : recent.map(e => `
                  <tr>
                    <td><div class="emp-name">${escapeHtml(e.name)}</div></td>
                    <td><span class="dept-chip">${escapeHtml(e.department)}</span></td>
                    <td>${escapeHtml(e.role)}</td>
                    <td><span class="status-pill ${e.status.toLowerCase()}">${escapeHtml(e.status)}</span></td>
                    <td style="font-size:12px;color:var(--ink-3);">${formatDate(e.joining_date)}</td>
                    <td>
                      <button class="icon-btn edit" title="Edit"
                              onclick="navigateTo('edit',{employeeId:${e.id}})">✏️</button>
                    </td>
                  </tr>`).join('')
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Department breakdown card -->
      <div class="card" style="animation-delay:.08s">
        <div class="card-header">
          <span class="card-title">🏢 By Department</span>
        </div>
        <div class="card-body">
          ${s.deptBreakdown.length === 0
            ? '<p style="font-size:13px;color:var(--ink-3);">No data yet.</p>'
            : s.deptBreakdown.map(([dept, count]) => {
                const pct = s.total > 0 ? (count / s.total) * 100 : 0;
                return `
                <div class="dept-row">
                  <span class="dept-name">${escapeHtml(dept)}</span>
                  <div class="dept-bar-track">
                    <div class="dept-bar-fill" style="width:${Math.round(pct)}%"></div>
                  </div>
                  <span class="dept-count">${count}</span>
                </div>`;
              }).join('')
          }
        </div>
      </div>

    </div><!-- /.dash-grid -->
    `;
  },

  /* ════════════════════════════════════════════════════
     EMPLOYEE LIST VIEW
     ════════════════════════════════════════════════════ */
  employeeList() {
    const root = getViewRoot();
    const all  = EmployeeDB.getAll();

    // Apply search + filters
    const query  = TableState.query.toLowerCase().trim();
    const dept   = TableState.dept.toLowerCase();
    const status = TableState.status.toLowerCase();

    const filtered = all.filter(e => {
      const searchable = [e.name, e.email, e.phone, e.department, e.role, e.status].join(' ').toLowerCase();
      return (!query  || searchable.includes(query))
          && (!dept   || e.department.toLowerCase() === dept)
          && (!status || e.status.toLowerCase()     === status);
    });

    // Pagination
    const totalRows  = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalRows / RECORDS_PER_PAGE));
    if (TableState.page > totalPages) TableState.page = 1;
    const start    = (TableState.page - 1) * RECORDS_PER_PAGE;
    const pageRows = filtered.slice(start, start + RECORDS_PER_PAGE);

    // Unique departments for dropdown
    const allDepts = [...new Set(all.map(e => e.department))].sort();

    root.innerHTML = `
    <div class="card">

      <!-- Toolbar -->
      <div class="table-toolbar">
        <div class="search-wrap">
          <span class="search-icon">🔍</span>
          <input type="text" id="tbl-search" placeholder="Search name, email, role…"
                 value="${escapeHtml(TableState.query)}"
                 oninput="Views._handleSearch(this.value)"
                 autocomplete="off">
        </div>

        <select class="filter-select" id="tbl-dept" onchange="Views._handleDeptFilter(this.value)">
          <option value="">All Departments</option>
          ${allDepts.map(d =>
            `<option value="${escapeHtml(d.toLowerCase())}"
                     ${TableState.dept.toLowerCase() === d.toLowerCase() ? 'selected' : ''}>
              ${escapeHtml(d)}
            </option>`).join('')}
        </select>

        <select class="filter-select" id="tbl-status" onchange="Views._handleStatusFilter(this.value)">
          <option value="">All Status</option>
          <option value="active"   ${TableState.status === 'active'   ? 'selected' : ''}>Active</option>
          <option value="inactive" ${TableState.status === 'inactive' ? 'selected' : ''}>Inactive</option>
        </select>

        <span class="row-count" id="row-count">
          ${totalRows === 0
            ? 'No results'
            : `${Math.min(start + 1, totalRows)}–${Math.min(start + RECORDS_PER_PAGE, totalRows)} of ${totalRows}`}
        </span>
      </div>

      <!-- Table -->
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Employee</th>
              <th>Phone</th>
              <th>Department</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${pageRows.length === 0
              ? `<tr><td colspan="8">
                  <div class="empty-state">
                    <div class="empty-icon">🔍</div>
                    <div class="empty-title">No employees found</div>
                    <div class="empty-sub">Try adjusting your search or filter criteria.</div>
                  </div>
                </td></tr>`
              : pageRows.map(e => `
                <tr>
                  <td><span class="emp-id">${padId(e.id)}</span></td>
                  <td>
                    <div class="emp-name">${escapeHtml(e.name)}</div>
                    <div class="emp-email">${escapeHtml(e.email)}</div>
                  </td>
                  <td style="font-family:var(--font-mono);font-size:12.5px;color:var(--ink-2);">
                    ${escapeHtml(e.phone)}
                  </td>
                  <td><span class="dept-chip">${escapeHtml(e.department)}</span></td>
                  <td>${escapeHtml(e.role)}</td>
                  <td>
                    <span class="status-pill ${e.status.toLowerCase()}">${escapeHtml(e.status)}</span>
                  </td>
                  <td style="font-size:12.5px;color:var(--ink-3);white-space:nowrap;">
                    ${formatDate(e.joining_date)}
                  </td>
                  <td>
                    <div style="display:flex;gap:5px;">
                      <button class="icon-btn edit" title="Edit employee"
                              onclick="navigateTo('edit',{employeeId:${e.id}})">✏️</button>
                      <button class="icon-btn delete" title="Delete employee"
                              onclick="Views._confirmDelete(${e.id})">🗑️</button>
                    </div>
                  </td>
                </tr>`).join('')
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <div class="page-info">
          Total: <strong>${all.length}</strong> employees
        </div>
        <div class="page-buttons">
          ${buildPaginationHtml(TableState.page, totalPages, 'Views._goPage')}
        </div>
      </div>

    </div><!-- /.card -->
    `;
  },

  /* ── Table event handlers ─────────────────────────── */
  _handleSearch(val) {
    TableState.query = val;
    TableState.page  = 1;
    Views.employeeList();
  },
  _handleDeptFilter(val) {
    TableState.dept = val;
    TableState.page = 1;
    Views.employeeList();
  },
  _handleStatusFilter(val) {
    TableState.status = val;
    TableState.page   = 1;
    Views.employeeList();
  },
  _goPage(p) {
    TableState.page = p;
    Views.employeeList();
  },

  /* ── Delete confirmation ─────────────────────────── */
  _confirmDelete(id) {
    const emp = EmployeeDB.getById(id);
    if (!emp) return;
    Modal.open(emp.name, () => {
      const result = EmployeeDB.remove(id);
      if (result.success) {
        Toast.success(result.message);
        updateSidebarBadge(EmployeeDB.getAll().length);
        Views.employeeList();
      } else {
        Toast.error(result.message);
      }
    });
  },

  /* ════════════════════════════════════════════════════
     EMPLOYEE FORM (ADD + EDIT)
     ════════════════════════════════════════════════════ */
  employeeForm(editId) {
    const root   = getViewRoot();
    const isEdit = editId !== null && editId !== undefined;
    const emp    = isEdit ? EmployeeDB.getById(editId) : null;

    // Helper: get existing value or blank
    const val = field => emp ? escapeHtml(emp[field] || '') : '';

    root.innerHTML = `
    <div class="card" style="max-width:820px;">

      <div class="card-header">
        <span class="card-title">
          ${isEdit ? `✏️ Editing: ${escapeHtml(emp?.name || '')}` : '➕ New Employee Record'}
        </span>
        <button class="btn btn-ghost" style="font-size:12.5px;padding:6px 13px;"
                onclick="navigateTo('employees')">← Back to List</button>
      </div>

      ${isEdit && emp ? `
      <div style="padding:10px 22px;background:var(--surface-2);border-bottom:1px solid var(--border);
                  display:flex;gap:22px;flex-wrap:wrap;font-size:11.5px;color:var(--ink-3);">
        <span>🆔 ID: <span style="font-family:var(--font-mono);">${padId(emp.id)}</span></span>
        <span>📅 Created: ${formatDate(emp.created_at)}</span>
        <span>🔄 Last Updated: ${formatDate(emp.updated_at)}</span>
      </div>` : ''}

      <div class="card-body">

        <div class="form-grid">

          <!-- Full Name -->
          <div class="form-group">
            <label for="f-name">Full Name <span class="req">*</span></label>
            <input type="text" id="f-name" class="form-control"
                   placeholder="e.g. Aarav Mehta"
                   value="${val('name')}" maxlength="120"
                   oninput="Validator.validateField('f-name','name',this.value)">
            <span class="field-error" id="f-name-error"></span>
          </div>

          <!-- Email -->
          <div class="form-group">
            <label for="f-email">Email Address <span class="req">*</span></label>
            <input type="email" id="f-email" class="form-control"
                   placeholder="e.g. aarav@company.in"
                   value="${val('email')}" maxlength="160"
                   oninput="Validator.validateField('f-email','email',this.value)">
            <span class="field-error" id="f-email-error"></span>
          </div>

          <!-- Phone -->
          <div class="form-group">
            <label for="f-phone">Phone Number <span class="req">*</span></label>
            <input type="tel" id="f-phone" class="form-control"
                   placeholder="10-digit mobile (starts 6–9)"
                   value="${val('phone')}" maxlength="15"
                   oninput="Validator.validateField('f-phone','phone',this.value)">
            <span class="field-error" id="f-phone-error"></span>
          </div>

          <!-- Department -->
          <div class="form-group">
            <label for="f-department">Department <span class="req">*</span></label>
            <select id="f-department" class="form-control"
                    onchange="Validator.validateField('f-department','department',this.value)">
              <option value="">— Select Department —</option>
              ${DEPARTMENTS.map(d =>
                `<option value="${escapeHtml(d)}"
                         ${val('department') === d ? 'selected' : ''}>${escapeHtml(d)}</option>`
              ).join('')}
            </select>
            <span class="field-error" id="f-department-error"></span>
          </div>

          <!-- Role -->
          <div class="form-group">
            <label for="f-role">Role / Designation <span class="req">*</span></label>
            <input type="text" id="f-role" class="form-control"
                   placeholder="e.g. Senior Backend Developer"
                   value="${val('role')}" maxlength="100"
                   oninput="Validator.validateField('f-role','role',this.value)">
            <span class="field-error" id="f-role-error"></span>
          </div>

          <!-- Status -->
          <div class="form-group">
            <label for="f-status">Employment Status <span class="req">*</span></label>
            <select id="f-status" class="form-control"
                    data-original="${val('status')}"
                    onchange="Views._onStatusChange(this, ${isEdit}, ${editId ?? 'null'})">
              <option value="Active"   ${(!emp || emp.status === 'Active')   ? 'selected' : ''}>✅ Active</option>
              <option value="Inactive" ${(emp && emp.status === 'Inactive')  ? 'selected' : ''}>⏸️ Inactive</option>
            </select>
            <span class="field-error" id="f-status-error"></span>
          </div>

          <!-- Joining Date -->
          <div class="form-group">
            <label for="f-joining_date">Joining Date <span class="req">*</span></label>
            <input type="date" id="f-joining_date" class="form-control"
                   value="${val('joining_date')}"
                   max="${new Date().toISOString().split('T')[0]}"
                   onchange="Validator.validateField('f-joining_date','joining_date',this.value)">
            <span class="field-error" id="f-joining_date-error"></span>
          </div>

        </div><!-- /.form-grid -->

        <!-- Info banner -->
        <div class="info-banner">
          💡 Status defaults to <strong>Active</strong> for new employees.
          The system automatically blocks duplicate email addresses.
          Timestamps (<code>created_at</code>, <code>updated_at</code>) are set automatically.
        </div>

        <!-- Form actions -->
        <div class="form-actions" style="margin-top:22px;">
          <button class="btn btn-primary" id="form-submit-btn"
                  onclick="Views._submitForm(${isEdit}, ${editId ?? 'null'})">
            💾 ${isEdit ? 'Update Employee' : 'Save Employee'}
          </button>
          <button class="btn btn-ghost" onclick="navigateTo('employees')">Cancel</button>
        </div>

      </div><!-- /.card-body -->
    </div><!-- /.card -->
    `;
  },

  /* ── Status change alert ─────────────────────────── */
  _onStatusChange(selectEl, isEdit, editId) {
    const original = selectEl.dataset.original;
    if (isEdit && original && original !== selectEl.value) {
      Toast.warning(
        `Status changing: "${original}" → "${selectEl.value}". Save to apply.`
      );
    }
  },

  /* ── Form submission ─────────────────────────────── */
  _submitForm(isEdit, editId) {
    // Collect values
    const getVal = id => (document.getElementById(id) || {}).value || '';
    const data = {
      name:         getVal('f-name'),
      email:        getVal('f-email'),
      phone:        getVal('f-phone'),
      department:   getVal('f-department'),
      role:         getVal('f-role'),
      status:       getVal('f-status'),
      joining_date: getVal('f-joining_date'),
    };

    // Validate all fields
    const fields = [
      { fieldId: 'f-name',         fieldName: 'name',         value: data.name         },
      { fieldId: 'f-email',        fieldName: 'email',        value: data.email        },
      { fieldId: 'f-phone',        fieldName: 'phone',        value: data.phone        },
      { fieldId: 'f-department',   fieldName: 'department',   value: data.department   },
      { fieldId: 'f-role',         fieldName: 'role',         value: data.role         },
      { fieldId: 'f-joining_date', fieldName: 'joining_date', value: data.joining_date },
      { fieldId: 'f-status',       fieldName: 'status',       value: data.status       },
    ];

    if (!Validator.validateAll(fields)) return;

    // Button loading state
    const btn = document.getElementById('form-submit-btn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Saving…'; }

    // Simulate async (gives the spinner a frame to render)
    setTimeout(() => {
      const result = isEdit ? EmployeeDB.update(editId, data) : EmployeeDB.create(data);

      if (result.success) {
        updateSidebarBadge(EmployeeDB.getAll().length);
        // Status change toast
        if (result.statusChanged) {
          Toast.warning(`${data.name}'s status changed to "${data.status}".`);
        }
        Toast.success(result.message);
        navigateTo('employees');
      } else {
        Toast.error(result.message);
        if (btn) { btn.disabled = false; btn.innerHTML = `💾 ${isEdit ? 'Update Employee' : 'Save Employee'}`; }
      }
    }, 80);
  },

};
