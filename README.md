# aurxon-erp

# AURXON Centralized School & Coaching ERP

> **The Complete Education Operating System for Modern Schools, Coaching Institutes, and Multi-Branch Educational Groups.**
> Built for the Indian Education Ecosystem • CBSE, U-DISE+, APAAR & RTE Compliant • Pure White Enterprise Design System.

---

## Architecture & Multi-Tenant Hierarchy

AURXON is architected around strict multi-level tenancy:

```text
AURXON PLATFORM
        │
        ├── Organization (Commercial/Trust SaaS Boundary)
        │      │
        │      ├── Institution (Operational Entity: School / Coaching)
        │      │       │
        │      │       └── Branch / Campus (Physical Facility)
        │      │                │
        │      │                └── Academic Session (e.g. 2026–2027)
        │      │
        │      └── Institution
        │
        └── Organization
```

- **Control Plane A (Customer Workspace)**: Customer school branding dominates completely (e.g. *Delhi Public School*, *Sharma Education Group*). Built with a Pure White (`#ffffff`) canvas, Glacier Blue accents, and high-density operational data tables.
- **Control Plane B (AURXON Platform Operations)**: Isolated strictly at `/aurxon` for platform provisioning, health monitoring, and SaaS licensing.

---

## Key Features

1. **Find Your Organization (Live Auto-Predict Search)**:
   - Real-time debounced database query matching registered educational entities by name, acronym, slug, code, or city.
   - Strict Data Minimization: Exposes only safe public metadata; zero internal IDs or user credentials leaked.
2. **Direct School Workspace Links**:
   - Instant routing via `/s/:slug` (e.g., `aurxon.app/s/dps`) directly into the institution's dedicated workspace.
3. **Indian Education & Regulatory Standards**:
   - **CBSE 9-Point Scale**: Automated A1–E2 letter grade evaluation and term report cards.
   - **U-DISE+ & APAAR**: Unified student master records and national identifier readiness.
   - **RTE 25% Quota Tracking**: Dedicated ledger management for subsidized and quota seats.
   - **Quarterly Indian Financial Year Fee Cycles**: Installment ledgers, concessions, and computerized GST receipts.
4. **Operational Modules**:
   - Student Information System (SIS)
   - Daily Roll Call & Biometric Attendance
   - Examinations & Grading Engine
   - Fee Allocation & Collections Reconciler
   - Admissions & Inquiry Pipeline
   - Financial Accounting Ledgers
   - Timetable & Period Scheduling
   - Secure Layered RBAC (Super Admin, Principal, Teacher, Accountant, Parent, Student)

---

## Technology Stack

- **Framework**: Next.js 14 (App Router, Server Actions, API Routes)
- **Language**: TypeScript (Strict Mode)
- **Database & ORM**: SQLite (Dev) / PostgreSQL (Prod) via Prisma ORM
- **Security**: 256-bit signed HttpOnly JWT sessions, Argon2/Bcrypt password hashing, Tenant-Isolation middleware
- **Testing**: Vitest (36 automated unit, adversarial security, and multi-tenant isolation tests)
- **Styling**: Pure Vanilla CSS Design System with CSS Tokens (`tokens.css`, `components.css`)

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Migration & Seed
```bash
npx prisma migrate dev
npx tsx prisma/seed.ts
```

### 3. Run Automated Tests
```bash
npm test
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## License
Proprietary • Copyright © 2026 AURXON Technologies. All Rights Reserved.
