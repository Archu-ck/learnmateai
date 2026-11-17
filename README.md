# LearnMate — School Admin Module Prototype

LearnMate is a prototype school Learning Management System (LMS) built with **Next.js (App Router)** for the frontend, **Node.js + Express** for the backend, **MongoDB with Mongoose** for the database, and **JWT in httpOnly cookies** for authentication.

The School Admin module provides full Role-Based Access Control (RBAC), user provisioning, class/section setup, teacher assignments, student enrollment, parent linking, dynamic role permissions matrix management, and an immutable audit log.

---

## Architecture & Project Structure

```
├── /server                 # Node.js + Express Backend
│   ├── src/
│   │   ├── constants/      # 22 permission keys & default role mappings
│   │   ├── controllers/    # auth, admin user, academic (class/subject/assignment), roles, audit
│   │   ├── middleware/     # requireAuth, requireRole, requirePermission
│   │   ├── models/         # User, Class, Subject, TeacherAssignment, RolePermission, AuditLog
│   │   ├── routes/         # authRoutes, adminUserRoutes, adminAcademicRoutes, adminRoleRoutes, adminAuditRoutes
│   │   ├── services/       # in-memory permissionCache, loginRateLimiter, tempPassword, mailer
│   │   ├── app.js          # Express app configuration & middleware
│   │   ├── db.js           # MongoDB connection (with automatic in-memory fallback)
│   │   ├── index.js        # Server entry point
│   │   └── seed.js         # Seeder for roles, permissions, admin & demo users
│   ├── test/               # Node.js native test runner test suites
│   ├── .env.example        # Backend environment variables template
│   └── package.json
│
├── /client                 # Next.js (App Router) Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── admin/      # Admin dashboard, users directory, CSV import, classes, subjects, parents, roles, audit
│   │   │   ├── login/      # Sign-in page with 1-click role presets
│   │   │   ├── change-password/ # Forced password change workflow
│   │   │   ├── student/    # Role placeholder page (403 protected)
│   │   │   ├── teacher/    # Role placeholder page (403 protected)
│   │   │   ├── parent/     # Role placeholder page (403 protected)
│   │   │   ├── principal/  # Role placeholder page (403 protected)
│   │   │   ├── coordinator/# Role placeholder page (403 protected)
│   │   │   └── counsellor/ # Role placeholder page (403 protected)
│   │   ├── components/     # RoleGuard, RoleDashboard, Toast notification provider
│   │   ├── context/        # AuthContext (user state, permissions, login/logout)
│   │   └── lib/            # api.ts fetch client with cookie credentials
│   ├── next.config.ts      # Next.js rewrites proxying /api/* to Express server
│   └── package.json
│
├── .env.example            # Root environment variables template
└── README.md               # Setup and credential documentation
```

---

## Seeded Demo Credentials

The database seed script sets up default accounts for all roles. All demo accounts use the standard password `Password123!`, except the default Administrator which uses `AdminPass123!`:

| Role | Email | Password | Default Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@learnmate.test` | `AdminPass123!` | Users, Roles, Classes, Subjects, Teachers, Students, Parents, Audit Log |
| **Teacher** | `teacher@learnmate.test` | `Password123!` | Assignments (create/grade), Attendance, Class Analytics |
| **Student** | `student@learnmate.test` | `Password123!` | View Own Marks, Use AI Tutor |
| **Parent** | `parent@learnmate.test` | `Password123!` | View Child Marks |
| **Principal** | `principal@learnmate.test` | `Password123!` | School Analytics, View All Marks, Send Announcements, Audit View |
| **Coordinator** | `coordinator@learnmate.test` | `Password123!` | Classes Manage, Subjects Manage, School & Class Analytics, View All Marks |
| **Counsellor** | `counsellor@learnmate.test` | `Password123!` | School Analytics, View All Marks, Attendance Mark |

---

## Quick Start Guide

### Prerequisites
- Node.js v18+ (tested on Node v24)
- npm v9+
- *(Optional)* Local MongoDB instance (`mongodb://127.0.0.1:27017`). If MongoDB is not running locally, the server automatically spins up an embedded in-memory MongoDB server (`mongodb-memory-server`) so the entire system works immediately with zero configuration!

### 1. Backend Setup & Run
```bash
# Navigate to backend directory
cd server

# Install dependencies (if not already installed)
npm install

# Run database seed
npm run seed

# Start Express backend server (runs on http://localhost:5000)
npm run dev
```

### 2. Frontend Setup & Run
In a new terminal window:
```bash
# Navigate to frontend directory
cd client

# Install dependencies (if not already installed)
npm install

# Start Next.js development server (runs on http://localhost:3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The login screen features convenient one-click buttons to quickly sign in as any seeded role.

---

## Running Test Suites

The backend includes automated test suites using the Node.js native test runner (`node --test`), verifying all functional requirements and acceptance criteria:

```bash
cd server

# Run authentication and middleware test suite
node --test test/auth.test.js

# Run admin user management test suite (CRUD, safeguards, CSV import)
node --test test/adminUsers.test.js

# Run academic, roles matrix, and audit test suite
node --test test/adminAcademicAndRoles.test.js

# Run full End-to-End Acceptance Checks test suite (verifying all 7 acceptance checks)
node --test test/acceptance.test.js
```

---

## Acceptance Checks Status

- [x] **Check 1: Teacher Provisioning & Forced Password Change** — Admin logs in, creates a teacher, copies the temporary password; teacher signs in, is blocked from accessing portal features, forced to change password, and then redirected to `/teacher`.
- [x] **Check 2: RBAC Protection** — Student is forbidden from accessing `/admin` pages and receives HTTP 403 on all `/api/admin/*` endpoints.
- [x] **Check 3: Academic Setup & Enrollment** — Admin creates Grade 8 with sections A and B, creates a subject, assigns teacher as class teacher, enrols students, and links parents.
- [x] **Check 4: CSV Import Validation & Deduplication** — A CSV with valid rows, duplicate email, and invalid role provisions good rows and returns a structured report identifying duplicates and row-level errors.
- [x] **Check 5: Dynamic Permission Invalidation** — When admin removes a permission from the teacher role, the in-memory cache is immediately refreshed and the teacher's subsequent request is rejected with 403.
- [x] **Check 6: Administrator Safeguards** — Admin cannot disable or demote their own account, and the system prevents removing the last active administrator account.
- [x] **Check 7: Audit Trail** — Every administrative action (user creation, password change, enrollment, assignment, permission adjustment) is logged with actor, target, timestamp, and metadata.
