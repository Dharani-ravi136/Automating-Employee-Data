/**
 * js/data.js
 * ─────────────────────────────────────────────────────────────
 * Data layer — localStorage persistence, employee CRUD,
 * session management, and seed data.
 * ─────────────────────────────────────────────────────────────
 */

'use strict';

/* ── App-wide constants ──────────────────────────────────── */
const ADMIN_CREDENTIALS = { username: 'admin', password: 'admin123', name: 'HR Administrator' };

const DEPARTMENTS = [
  'Engineering', 'Human Resources', 'Finance', 'Marketing',
  'Design', 'Operations', 'Sales', 'Legal', 'IT Support', 'Product'
];

const RECORDS_PER_PAGE = 10;

/* ── LocalStorage keys ───────────────────────────────────── */
const STORE_KEY   = 'ems_employees_v1';
const SESSION_KEY = 'ems_session_v1';

/* ════════════════════════════════════════════════════════════
   SESSION MANAGEMENT
   ════════════════════════════════════════════════════════════ */
const Session = {
  save()   { localStorage.setItem(SESSION_KEY, '1'); },
  clear()  { localStorage.removeItem(SESSION_KEY); },
  exists() { return localStorage.getItem(SESSION_KEY) === '1'; },
};

/* ════════════════════════════════════════════════════════════
   EMPLOYEE DATA  (in-memory + localStorage)
   ════════════════════════════════════════════════════════════ */
const EmployeeDB = (() => {

  let records = [];  // In-memory cache

  /* ── Persistence ─────────────────────────────────── */
  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      records   = raw ? JSON.parse(raw) : [];
    } catch {
      records = [];
    }
  }

  function persist() {
    localStorage.setItem(STORE_KEY, JSON.stringify(records));
  }

  /* ── ID generation ───────────────────────────────── */
  function nextId() {
    return records.reduce((max, e) => Math.max(max, e.id), 0) + 1;
  }

  /* ── Seed data (first-time load) ─────────────────── */
  function seed() {
    const now = new Date().toISOString();
    records = [
      { id:  1, name: 'Aarav Mehta',     email: 'aarav.mehta@company.in',    phone: '9876543210', department: 'Engineering',     role: 'Senior Backend Developer',  status: 'Active',   joining_date: '2021-03-15', created_at: now, updated_at: now },
      { id:  2, name: 'Priya Nair',      email: 'priya.nair@company.in',     phone: '9876543211', department: 'Human Resources', role: 'HR Business Partner',       status: 'Active',   joining_date: '2020-07-01', created_at: now, updated_at: now },
      { id:  3, name: 'Rahul Verma',     email: 'rahul.verma@company.in',    phone: '9876543212', department: 'Finance',         role: 'Senior Accountant',         status: 'Active',   joining_date: '2022-01-10', created_at: now, updated_at: now },
      { id:  4, name: 'Sneha Pillai',    email: 'sneha.pillai@company.in',   phone: '9876543213', department: 'Marketing',       role: 'Growth Marketing Lead',     status: 'Active',   joining_date: '2021-09-22', created_at: now, updated_at: now },
      { id:  5, name: 'Karthik Rajan',   email: 'karthik.rajan@company.in',  phone: '9876543214', department: 'Engineering',     role: 'DevOps Engineer',           status: 'Active',   joining_date: '2020-11-05', created_at: now, updated_at: now },
      { id:  6, name: 'Divya Krishnan',  email: 'divya.krishnan@company.in', phone: '9876543215', department: 'Design',          role: 'Lead UI/UX Designer',       status: 'Active',   joining_date: '2022-04-18', created_at: now, updated_at: now },
      { id:  7, name: 'Mohan Das',       email: 'mohan.das@company.in',      phone: '9876543216', department: 'Operations',      role: 'Operations Manager',        status: 'Inactive', joining_date: '2019-04-12', created_at: now, updated_at: now },
      { id:  8, name: 'Lakshmi Iyer',    email: 'lakshmi.iyer@company.in',   phone: '9876543217', department: 'Engineering',     role: 'QA Lead',                   status: 'Active',   joining_date: '2021-08-30', created_at: now, updated_at: now },
      { id:  9, name: 'Suresh Babu',     email: 'suresh.babu@company.in',    phone: '9876543218', department: 'Sales',           role: 'Regional Sales Manager',    status: 'Active',   joining_date: '2022-06-07', created_at: now, updated_at: now },
      { id: 10, name: 'Ananya Menon',    email: 'ananya.menon@company.in',   phone: '9876543219', department: 'Finance',         role: 'Financial Analyst',         status: 'Active',   joining_date: '2021-05-14', created_at: now, updated_at: now },
      { id: 11, name: 'Vijay Kumar',     email: 'vijay.kumar@company.in',    phone: '9876543220', department: 'Marketing',       role: 'Content Strategist',        status: 'Inactive', joining_date: '2020-02-25', created_at: now, updated_at: now },
      { id: 12, name: 'Nisha Reddy',     email: 'nisha.reddy@company.in',    phone: '9876543221', department: 'Design',          role: 'Brand Designer',            status: 'Active',   joining_date: '2022-10-28', created_at: now, updated_at: now },
    ];
    persist();
  }

  /* ── CRUD ────────────────────────────────────────── */

  /** Returns a copy of all records */
  function getAll() { return [...records]; }

  /** Finds one record by id */
  function getById(id) { return records.find(e => e.id === id) || null; }

  /**
   * Creates a new employee record.
   * @returns {{ success: boolean, message: string, employee?: object }}
   */
  function create(data) {
    // Duplicate email check (case-insensitive)
    const dup = records.find(e => e.email.toLowerCase() === data.email.toLowerCase());
    if (dup) return { success: false, message: `Email "${data.email}" is already registered.` };

    const now = new Date().toISOString();
    const emp = {
      id:           nextId(),
      name:         data.name.trim(),
      email:        data.email.trim().toLowerCase(),
      phone:        data.phone.trim(),
      department:   data.department.trim(),
      role:         data.role.trim(),
      status:       data.status || 'Active',   // Default = Active (automation)
      joining_date: data.joining_date,
      created_at:   now,
      updated_at:   now,
    };

    records.unshift(emp);
    persist();
    return { success: true, message: `${emp.name} has been added successfully!`, employee: emp };
  }

  /**
   * Updates an existing employee.
   * @returns {{ success: boolean, message: string, statusChanged?: boolean }}
   */
  function update(id, data) {
    const idx = records.findIndex(e => e.id === id);
    if (idx === -1) return { success: false, message: 'Employee record not found.' };

    // Duplicate email check (exclude current record)
    const dup = records.find(e => e.email.toLowerCase() === data.email.toLowerCase() && e.id !== id);
    if (dup) return { success: false, message: `Email "${data.email}" is already used by another employee.` };

    const prev          = records[idx];
    const statusChanged = prev.status !== data.status;

    records[idx] = {
      ...prev,
      name:         data.name.trim(),
      email:        data.email.trim().toLowerCase(),
      phone:        data.phone.trim(),
      department:   data.department.trim(),
      role:         data.role.trim(),
      status:       data.status,
      joining_date: data.joining_date,
      updated_at:   new Date().toISOString(), // Auto-update timestamp (automation)
    };

    persist();
    return { success: true, message: `${records[idx].name} updated successfully.`, statusChanged, oldStatus: prev.status };
  }

  /**
   * Deletes an employee by id.
   * @returns {{ success: boolean, message: string }}
   */
  function remove(id) {
    const emp = getById(id);
    if (!emp) return { success: false, message: 'Employee not found.' };
    records = records.filter(e => e.id !== id);
    persist();
    return { success: true, message: `${emp.name} has been removed from the system.` };
  }

  /* ── Stats ───────────────────────────────────────── */
  function stats() {
    const total    = records.length;
    const active   = records.filter(e => e.status === 'Active').length;
    const inactive = total - active;
    const now      = new Date();
    const newThisMonth = records.filter(e => {
      const d = new Date(e.created_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const deptMap = {};
    records.forEach(e => { deptMap[e.department] = (deptMap[e.department] || 0) + 1; });
    const deptBreakdown = Object.entries(deptMap).sort((a, b) => b[1] - a[1]);

    return { total, active, inactive, newThisMonth, deptBreakdown };
  }

  /* ── Init ────────────────────────────────────────── */
  function init() {
    load();
    if (records.length === 0) seed();
  }

  return { init, getAll, getById, create, update, remove, stats };
})();
