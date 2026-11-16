# Implementation Plan: LearnMate School Admin Module

## Simplest Reasonable Choices Noted
- **Database**: Default to `process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/learnmate"`; fallback to `mongodb-memory-server` automatically if local MongoDB is not running, ensuring demo works out of the box.
- **School ID**: Default to `"school-default-01"` for single-tenant prototype while enforcing `schoolId` on all documents.
- **Email Service**: Use Nodemailer with Ethereal / console logger when SMTP environment variables are not configured.
- **Temporary Passwords**: Generated using secure 10-character alphanumeric random strings, returned once upon creation/reset.
- **Permission Cache**: Kept in-memory in server process and invalidated/refreshed immediately upon role permission updates.
- **Project Structure**: `/server` for Express backend, `/client` for Next.js App Router frontend, with root setup and environment files.

---

## Numbered Checklist (in Build Order)

- [x] **1. Project Setup and Directory Structure**
  - *Description*: Structure the repository into `/server` and `/client`, initialize backend dependencies, configure CORS/cookies and environment templates.
  - *Done when*: Server runs with health check endpoint, environment variables load from `.env`, and client is linked cleanly.

- [x] **2. Data Models and Seeding (models and seed)**
  - *Description*: Define Mongoose schemas for User, Class, Subject, TeacherAssignment, RolePermission, and AuditLog with schoolId, and write a database seed script.
  - *Done when*: Seed script runs successfully, populating default permissions for all roles, admin user, and sample users per role.

- [x] **3. Auth and Middleware (auth and middleware)**
  - *Description*: Implement login with rate-limiting (5 attempts per 15 min per email), JWT in httpOnly cookie, logout, me, change-password, and requireAuth/requireRole/requirePermission middleware with in-memory caching.
  - *Done when*: Login returns JWT cookie, rate-limiting blocks the 6th failed attempt, change-password clears mustChangePassword, and middleware enforces permissions.

- [x] **4. Admin User Management APIs (admin user APIs)**
  - *Description*: Build endpoints for user creation (temp password + email attempt), user list (search, filters, pagination), edit user, reset password, disable/enable with self/last-admin safeguards, and CSV import with per-row validation and error reporting.
  - *Done when*: All user management endpoints function, audit logs are generated for changes, admin self-demote/disable is blocked, and CSV import handles duplicates and bad rows with descriptive reports.

- [x] **5. Class, Subject, Assignment, Role, and Audit APIs (class and role APIs)**
  - *Description*: Implement CRUD for classes and subjects, teacher assignment (with unique class-teacher validation), bulk student enrollment, parent-child linking, role-permissions matrix update (with lockout guard), and audit log retrieval with filters.
  - *Done when*: Endpoints pass tests for class-teacher uniqueness, permission updates take effect immediately, admin lockout is prevented, and audit logs are queryable.

- [x] **6. Frontend Auth, Routing & Non-Admin Pages**
  - *Description*: Implement `/login` page with role redirection, `/change-password` forced redirect when mustChangePassword is true, and non-admin placeholder pages (/student, /teacher, /parent, /principal, /coordinator, /counsellor) with 403 access control.
  - *Done when*: Users can sign in, mustChangePassword forces password update before any page access, and non-admin users cannot access unauthorized pages.

- [x] **7. Frontend Admin Management Pages (frontend pages)**
  - *Description*: Build admin layout (sidebar + topbar), Admin Dashboard (/admin), User Directory (/admin/users with add user modal & temp password copy), CSV Import (/admin/users/import), Classes & Sections (/admin/classes), Subjects (/admin/subjects), Parent Links (/admin/parents), Roles Matrix (/admin/roles), and Audit Log (/admin/audit).
  - *Done when*: All admin pages are functional, styled cleanly with consistent flat theme, toasts, inline validation, and interact end-to-end with backend APIs.

- [ ] **8. Acceptance Checks Verification and Documentation**
  - *Description*: Execute end-to-end automated and manual verification against all 7 acceptance checks, and produce README.md with setup guide and credentials.
  - *Done when*: All 7 acceptance checks pass with recorded evidence, README.md is complete, and system is fully verified.
