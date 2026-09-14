# AURXON Centralized School & Coaching ERP

> **The Complete Education Operating System for Modern Schools, Coaching Networks, and Multi-Branch Educational Trusts.**  
> Built for the Indian Education Ecosystem • CBSE, U-DISE+, APAAR & RTE Compliant • Pure White Enterprise Design System.  
> **Engineering Specification:** Formally documented under **IEEE Std 830 / IEEE Std 1016** in [`docs/IEEE_SRS_SDD.md`](docs/IEEE_SRS_SDD.md).

---

## Architecture & Multi-Tenant Hierarchy

AURXON is architected around strict 4-level relational tenancy:

```text
AURXON PLATFORM
        │
        ├── Organization (Commercial/Trust SaaS Boundary)
        │      │
        │      ├── Institution (Operational Entity: School / Coaching)
        │      │       │
        │      │       └── Branch / Campus (Physical Facility)
        │      │                │
        │      │                └── Academic Session (e.g. 2025–2026)
        │      │
        │      └── Institution
        │
        └── Organization
```

- **Customer Workspace**: Dominated by customer school branding (e.g., *Delhi Public School*, *Sharma Education Group*). Built with a Pure White (`#ffffff`) canvas, Glacier Blue (`#0284c7`) and Deep Ocean (`#0c4a6e`) accents, and high-density operational data tables. Zero 3D tilt, zero performance overhead.
- **Platform Operations**: Isolated at `/aurxon` for multi-tenant provisioning, health telemetry, and licensing.

---

## Comprehensive 12-Module Operating Matrix

AURXON provides complete coverage across academic, administrative, and facility lifecycles:

| # | Module | Route | Capabilities |
| :---: | :--- | :--- | :--- |
| 1 | **Student Information (SIS)** | `/students` | Master student profiles, guardian relationships, APAAR/UDISE+ registration, category tracking (GEN/OBC/SC/ST/EWS). |
| 2 | **Admissions Pipeline** | `/admissions` | Multi-stage inquiry management, entrance exam evaluations, document verification, and 1-click student conversion. |
| 3 | **Attendance & Biometrics** | `/attendance` | Period and roll-call attendance, composite-key idempotency `(studentId, date)`, automated absent SMS notifications. |
| 4 | **Academics & Timetable** | `/academics`, `/timetable` | Class and section hierarchy, subject allocations, teacher load balancing, weekly grid scheduling, room collision prevention. |
| 5 | **Exams & Grading** | `/examinations` | CBSE scholastic (Periodic Test, Notebook, Subject Enrichment, Term Exam) and co-scholastic grading; automated 9-point letter grade assignment (A1 to E2). |
| 6 | **Fees & Collections** | `/fees` | Multi-head fee structures (Tuition, Lab, Exam, Transport), installment schedule, partial payments, computerized GST receipts. |
| 7 | **Financial Accounting** | `/finance` | Institutional cashbooks, income and expense ledgers, balance sheet reconciliation, transaction category tracking. |
| 8 | **Transport & Fleet GPS** | `/transport` | Fleet vehicle fitness/insurance tracking, multi-point routes with arrival/departure timestamps, commuter allocations, AIS-140 GPS radar. |
| 9 | **Library & Circulation** | `/library` | Accession register with ISBN and shelf locations, circulation desk for book issue and return, automated ₹5/day overdue fines, NCERT e-library. |
| 10 | **Faculty & Staff HR** | `/staff` | Teaching and administrative directory, biometric punch logs, multi-type leave approval workflows, EPF/TDS salary statement slips. |
| 11 | **CBSE Reports & TC** | `/reports` | Formatted CBSE 2-Term report cards, official Transfer Certificates (TC) with UDISE numbers, class tabulation registers, fee defaulter statements. |
| 12 | **Institutional Settings** | `/settings` | Board affiliation profile, active academic session switcher, modular entitlement switchboards, TRAI DLT SMS and WhatsApp Cloud API settings. |

---

## IEEE Engineering & Verification Standards

AURXON development strictly adheres to IEEE standards:
- **IEEE Std 830 / ISO/IEC/IEEE 29148**: Software Requirements Specification baseline.
- **IEEE Std 1016**: Software Design Description and modular decomposition.
- **IEEE Std 829**: Automated test documentation and test cases (`npm test` executes 36 automated suites).
- **IEEE Std 828**: Configuration Management and Conventional Commit standards.

### Conventional Commit Standard
All commits must follow the IEEE / Conventional Commits format:
```text
<type>(<scope>): <short imperative description>

[Detailed body with technical context and architectural rationale]

[Footer: Traceability reference, e.g. IEEE-SRS: MOD-08]
```

Permitted types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.

---

## Technology Stack

- **Framework**: Next.js 14 (App Router, Server Actions, Dynamic & Static Route Optimization)
- **Language**: TypeScript (Strict Mode, 0 compile errors)
- **Database & ORM**: SQLite (Dev) / PostgreSQL (Prod) via Prisma ORM
- **Security**: 256-bit signed `HttpOnly` JWT sessions, Argon2/Bcrypt password hashing, Tenant-Isolation middleware
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

### 4. Verify TypeScript Compilation
```bash
npx tsc --noEmit
```

### 5. Build for Production
```bash
npm run build
```

### 6. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Default Seed Credentials (1-Click Fill on Login Page)

| Role | Email | Password | Scope |
| :--- | :--- | :--- | :--- |
| **Principal** | `principal.rkp@dps-society.edu` | `Password@123` | DPS R.K. Puram |
| **Faculty** | `teacher.math@dps-society.edu` | `Password@123` | DPS R.K. Puram |
| **Accountant** | `accountant@dps-society.edu` | `Password@123` | DPS R.K. Puram |
| **Student** | `student.aarav@dps-society.edu` | `Password@123` | DPS R.K. Puram |
| **HQ Admin** | `superadmin@aurxon.io` | `Password@123` | AURXON SaaS Platform |

---

## License
Proprietary • Copyright © 2026 AURXON Technologies. All Rights Reserved.
