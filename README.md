# 📋 EMS — Employee Data Management System
## Pure HTML · CSS · JavaScript  |  No server required

---

## 📁 Folder Structure

```
EMS/                          ← Root folder (open index.html from here)
│
├── index.html                ← Main entry point — contains ALL pages
│
├── css/
│   └── style.css             ← Complete design system (800+ lines)
│                               Design: Dark sidebar + Amber accent
│                               Fonts:  Playfair Display + DM Sans + JetBrains Mono
│
├── js/
│   ├── data.js               ← Data layer: localStorage, CRUD, seed data
│   ├── ui.js                 ← Toast system, Modal, Validator, helpers
│   ├── router.js             ← SPA router: navigateTo()
│   ├── views.js              ← All page renderers (Dashboard, List, Form)
│   └── app.js                ← Auth (login/logout) + app bootstrap
│
└── README.md                 ← This file
```

---

## 🚀 How to Run

**Just double-click `index.html`** — works in any modern browser.

No server. No npm. No installation. No build step.

> For a better experience (avoids file:// CORS quirks with some browsers), you can use VS Code's Live Server extension or Python's built-in server:
> ```bash
> cd EMS
> python -m http.server 8080
> # Then open: http://localhost:8080
> ```

---

## 🔐 Login Credentials

```
Username:  admin
Password:  admin123
```

The system remembers your session across page refreshes (via localStorage).
To log out, click **Sign Out** in the sidebar.

---

## ✅ Features

### Pages
| Page | Description |
|---|---|
| **Login** | Dual-panel design with credential validation |
| **Dashboard** | 4 live stat cards + department bar chart + recent employees |
| **Employee List** | Searchable, filterable, paginated table (10 per page) |
| **Add Employee** | Validated form with real-time field errors |
| **Edit Employee** | Pre-filled form with status-change alert |

### Automation
| Feature | How |
|---|---|
| Default status = Active | `data.js` sets `status = 'Active'` if not provided |
| Duplicate email block | Checked before every INSERT and UPDATE |
| Auto timestamps | `created_at` set on create; `updated_at` set on every update |
| Status-change alert | JS detects change vs original value and shows a warning toast |

### Security / Quality
| Feature | Implementation |
|---|---|
| XSS prevention | All output goes through `escapeHtml()` in `ui.js` |
| Input validation | Client-side via `Validator` module (`ui.js`) with regex rules |
| Session persistence | `localStorage` via `Session` object (`data.js`) |
| Module separation | Each JS file has one responsibility |

---

## 📦 JavaScript Architecture

```
data.js    ── EmployeeDB (CRUD, persistence), Session, DEPARTMENTS constant
ui.js      ── Toast, Modal, Validator, escapeHtml(), formatDate(), padId()...
router.js  ── RouterState, navigateTo(page, params)
views.js   ── Views.dashboard(), Views.employeeList(), Views.employeeForm()
app.js     ── Auth.login(), Auth.logout(), DOMContentLoaded bootstrap
```

Script load order in `index.html`:
```html
<script src="js/data.js"></script>    <!-- 1. Constants + DB  -->
<script src="js/ui.js"></script>      <!-- 2. UI utilities     -->
<script src="js/router.js"></script>  <!-- 3. Router           -->
<script src="js/views.js"></script>   <!-- 4. View renderers   -->
<script src="js/app.js"></script>     <!-- 5. Auth + bootstrap -->
```

---

## 🧪 Sample Data

12 employees are automatically seeded on first load:

| Name | Department | Status |
|---|---|---|
| Aarav Mehta | Engineering | Active |
| Priya Nair | Human Resources | Active |
| Rahul Verma | Finance | Active |
| Sneha Pillai | Marketing | Active |
| Karthik Rajan | Engineering | Active |
| Divya Krishnan | Design | Active |
| Mohan Das | Operations | **Inactive** |
| Lakshmi Iyer | Engineering | Active |
| Suresh Babu | Sales | Active |
| Ananya Menon | Finance | Active |
| Vijay Kumar | Marketing | **Inactive** |
| Nisha Reddy | Design | Active |

---

## 🔄 Resetting the App

To clear all data and start fresh, open the browser console and run:
```javascript
localStorage.clear();
location.reload();
```

---

## 🌐 Browser Support

Works in all modern browsers: Chrome, Firefox, Edge, Safari.
Requires JavaScript enabled.
