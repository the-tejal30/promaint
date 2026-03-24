# ProMaint — Maintenance Management System

A full-stack web application for managing preventive maintenance schedules, equipment tracking, work orders, and technicians.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router v6 |
| Backend | Node.js, Express.js (ESM) |
| Database | MongoDB Atlas (Mongoose ODM) |
| Auth | JWT (8h expiry), stored in localStorage |
| Fonts | Poppins, JetBrains Mono |

---

## Project Structure

```
promaint/
├── backend/
│   ├── data/
│   │   ├── models.js         # Mongoose schemas
│   │   └── seed.js           # Initial seed (693 equipment + schedule records)
│   ├── middleware/
│   │   └── auth.js           # JWT authenticate + requireAdmin
│   ├── routes/
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   ├── equipment.js
│   │   ├── schedule.js
│   │   ├── technicians.js
│   │   └── workorders.js
│   ├── .env
│   └── server.js
└── frontend/
    ├── public/
    │   └── logo.svg           # Custom gear logo (favicon + sidebar)
    └── src/
        ├── api/               # Axios client
        ├── components/        # Topbar, Sidebar, Modal, Badge, Toast
        ├── context/           # AuthContext (JWT login/logout)
        ├── icons/             # SVG icon components
        ├── pages/             # Dashboard, Equipment, Schedule, WorkOrders, Technicians, Reports
        └── index.css
```

---

## Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account

### 1. Backend Setup

```bash
cd backend
npm install
```

Create `.env`:

```env
PORT=5001
JWT_SECRET=your_jwt_secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_password
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/promaint?appName=...
```

> If your MongoDB password contains special characters (e.g. `@`), URL-encode them (`@` → `%40`).

```bash
npm run dev     # development (auto-restart with node --watch)
npm start       # production
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5001`

---

## Authentication

- **Public (no login needed):** All GET endpoints — anyone can view data
- **Logged in (any user):** POST on work orders and schedule
- **Admin only:** DELETE on all, PUT/PATCH on equipment, managing technicians

### Admin Login
- Login via the sidebar popover (bottom of sidebar)
- Credentials stored in `.env` as `ADMIN_USERNAME` / `ADMIN_PASSWORD`
- On wrong password: shows **"Wrong username or password"** (not raw HTTP error)
- JWT token valid for 8 hours

---

## Data Seeding

On first startup, if the Equipment collection is **empty**, the database auto-seeds:
- **693 equipment records** from the 52 Week Maintenance Plan PDF
- **693 PM schedule tasks** (one per equipment, `nextDue: null` by default)
- **1 admin user** from `.env` credentials
- **No technician data** — client adds their own

Seeding is **skipped** on all subsequent restarts (checks `Equipment.countDocuments()`).

---

## Dashboard

### KPI Cards (4 counters with animated count-up)
| Card | Logic |
|------|-------|
| Total Equipment | `Equipment.countDocuments()` |
| Overdue Tasks | `Schedule.countDocuments({ status: 'Overdue' })` — uses stored status (updated from schedule GET) |
| Completed This Month | Work orders where `status === 'Completed'` AND `dueDate or createdDate >= start of current month` |
| Open Work Orders | Work orders where `status !== 'Completed'` |

### Upcoming PM Tasks
- Fetched from Schedule, sorted by `nextDue` ascending, limited to **8 tasks**
- Shows: Equipment Name, Description, Due Date, Priority, Status
- Priority shows badge if set, otherwise `—`
- Overdue rows are highlighted in red

### Equipment Status Donut Chart
- Canvas-drawn donut chart
- Counts equipment by status: **Active** (green), **Under Maintenance** (yellow), **Inactive** (grey)
- Center shows total count
- Data computed server-side from all equipment

### Recent Activity
- Last **10 activity entries**, sorted by `id` descending (id = `Date.now()` timestamp)
- Time shown as relative: "Today", "Yesterday", "X days ago", or "In X days"
- Activity is only written by 3 events (see Activity Logic below)

### Dashboard Caching
- Dashboard data is **module-level cached** in the frontend — does not re-fetch on route changes within the same session. Prevents flicker when navigating back.

---

## Equipment Registry

### Columns
Pair · Level · Zone · Area · Assets Type · Asset Code · Frequency · Status

### Data Source
All 693 records imported from the **52 Week Maintenance Plan PDF** with fields:
- `pair`, `level`, `zone`, `area`, `assetType`, `assetCode`, `frequency`, `status`

### Filters
- Search: by asset code, type, area, zone, pair
- Filter by Pair (dynamic list from data)
- Filter by Frequency
- Filter by Status

### Admin Actions
- **Add** new equipment (Asset Code becomes the unique ID)
- **Edit** existing equipment
- **Delete** equipment (with confirmation modal)

---

## PM Schedule

### How Tasks Are Created
- 693 tasks auto-seeded — one per equipment from the PDF
- All seeded with `nextDue: null`, `priority: ''`, `status: 'Scheduled'`
- Admin sets `nextDue`, `priority`, assigned technician by editing each task

### Status Logic (computed LIVE on every GET request)
```
nextDue is null   → Scheduled
nextDue < today   → Overdue
nextDue = today   → Due Today
nextDue > today   → Scheduled
```
Status is **never stale** — recalculated on every fetch, not stored.

### Mark Done Logic
When a task is marked Done (`PATCH /schedule/:id/done`):
1. Sets `lastDone` = today
2. Calculates `nextDue` = today + frequency days
3. Sets `status` = `'Scheduled'`
4. Logs to Activity feed

### Frequency → Day Cycle
| Frequency | Days |
|-----------|------|
| Weekly | 7 |
| Monthly | 30 |
| Bi Monthly | 60 |
| Quarterly | 91 |
| Half Yearly | 182 |
| Annually | 365 |

### Priority Display
- Shows badge if priority is set
- Shows `—` if empty (not forced on seeded data)

### Admin Actions
- Add new PM task
- Edit task (set nextDue, priority, assigned technician, frequency)
- Mark Done (auto-advances next due date)
- Delete task (admin only)

---

## Work Orders

### WO Number Generation
Auto-generated on creation: `WO-{year}-{padded count}` e.g. `WO-2026-001`
Uses `WorkOrder.countDocuments()` at time of creation.

### Types
`Corrective` · `Preventive` · `Modification` · `Emergency` · `Inspection`

### Status Flow
`Open` → `In Progress` → `Completed`
- Mark complete via the **Complete** button (PATCH endpoint)
- No automatic status changes — manual only

### "Completed This Month" Logic (Dashboard)
Filters work orders where:
- `status === 'Completed'`
- AND `dueDate OR createdDate >= first day of current month`

### Admin Actions
- Create work order (Equipment + Type + Description required)
- Mark as Completed
- Delete (admin only)

---

## Technicians

- No seed data — client adds their own
- Fields: ID, Name, Specialization, Phone, Email, Status
- Admin: Add / Delete technicians
- Used in PM Schedule and Work Order forms for assignment dropdowns

---

## Recent Activity (Activity Feed)

Activity is written to the database on exactly **3 events**:

| Event | Message | Icon |
|-------|---------|------|
| Work Order created | `Work Order WO-XXXX created for [equipment]` | 📋 |
| Work Order completed | `Work Order WO-XXXX marked as Completed` | ✅ |
| PM Task marked done | `PM Task PM-XXXX completed for [equipment]` | ✅ |

- Activity `id` = `Date.now()` (Unix ms timestamp) — used for sorting newest first
- Dashboard shows latest 10 entries
- No activity logged for: login/logout, editing equipment, adding technicians

---

## Notifications (Bell Icon)

- Fetches `/schedule` on every page navigation
- Filters tasks where `status === 'Overdue'` (computed live, see PM Schedule Status Logic)
- Shows badge count on bell icon
- Dropdown shows up to **10 overdue tasks**
- If more than 10: shows `+X more overdue — View all` link → navigates to PM Schedule
- Dropdown closes on outside click

---

## Global Search (Topbar)

- Searches across: **Equipment**, **PM Schedule**, **Work Orders**, **Technicians**
- Data fetched once and **cached** (module-level `allData`) — not re-fetched on every keystroke
- Keyboard navigation: `↑` `↓` to move, `Enter` to navigate, `Escape` to close
- Results capped at **12 entries**
- Navigates to the relevant page on click/enter
- Search clears on route change

---

## Badge Color Logic

### Status Badges
| Status | Color |
|--------|-------|
| Active / Completed / Scheduled | Green |
| Under Maintenance / In Progress / Due Today | Yellow |
| Inactive / Overdue | Red |
| Open | Blue |

### Priority Badges
| Priority | Color |
|----------|-------|
| Critical | Red |
| High | Orange |
| Medium | Yellow |
| Low | Grey/Default |

### Frequency Badges (Equipment tab)
| Frequency | Color |
|-----------|-------|
| Weekly | Red (Critical) |
| Monthly | Yellow (Warning) |
| Bi Monthly | Blue (Info) |
| Quarterly | Blue (Info) |
| Half Yearly | Grey (Default) |

---

## API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | Public | Returns JWT token |

### Equipment
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/equipment` | Public | List all equipment |
| POST | `/api/equipment` | Admin | Add equipment |
| PUT | `/api/equipment/:id` | Admin | Update equipment |
| DELETE | `/api/equipment/:id` | Admin | Delete equipment |

### Schedule
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/schedule` | Public | List all tasks (status computed live) |
| POST | `/api/schedule` | Login | Add PM task |
| PUT | `/api/schedule/:id` | Login | Update task |
| PATCH | `/api/schedule/:id/done` | Login | Mark done, advance nextDue |
| DELETE | `/api/schedule/:id` | Admin | Delete task |

### Work Orders
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/workorders` | Public | List all work orders |
| POST | `/api/workorders` | Login | Create work order (auto WO number) |
| PATCH | `/api/workorders/:num/complete` | Login | Mark completed |
| DELETE | `/api/workorders/:num` | Admin | Delete |

### Technicians
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/technicians` | Public | List technicians |
| POST | `/api/technicians` | Admin | Add technician |
| DELETE | `/api/technicians/:id` | Admin | Delete technician |

### Dashboard
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/dashboard` | Public | All KPIs, upcoming tasks, activity, charts |
