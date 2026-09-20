# AURXON School ERP - Prioritized Remediation Backlog & Blueprint

**Document Reference**: AURXON-REMEDIATION-BACKLOG-2026-V1  
**Target Maturity Target**: **LEVEL G4 -> LEVEL G5 (Production Candidate & Sellable Commercial ERP)**  

---

## Remediation Tasks Overview

| Priority | Task ID | Module | Title | Target File(s) | Estimated Effort |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **P0** | **FIX-01** | Database Engine | Resolve SQLite PRAGMA execution warning in Prisma init | `src/lib/prisma.ts` | 1 hour |
| **P1** | **FIX-02** | API Security | Standardize all API route mutations onto `authorize()` decision engine | `src/app/api/v1/students/[id]/route.ts`, `src/app/api/v1/academics/classes/route.ts` | 3 hours |
| **P1** | **FIX-03** | Academics | Implement Academic Session Bulk Student Promotion Engine & History | `prisma/schema.prisma`, `src/app/api/v1/academics/promote/route.ts` | 5 hours |
| **P1** | **FIX-04** | Finance | Implement Automated Late Fee Accrual & Concession Calculation Engine | `src/app/api/v1/fees/route.ts`, `src/lib/fees.ts` | 4 hours |
| **P2** | **FIX-05** | Document Security | Secure Document Storage with Private Expiring Signed URL Signatures | `src/lib/authorization/engine.ts`, `src/app/api/v1/staff/[id]/route.ts` | 3 hours |
| **P2** | **FIX-06** | UX / Workflow | Add Smart Role-Context Pre-Selection to Attendance & Marks Entry Modals | `src/app/attendance/page.tsx`, `src/app/examinations/page.tsx` | 3 hours |

---

## Detailed Task Blueprint Specifications

### TASK FIX-01: Resolve SQLite PRAGMA Connection Execution Warning [P0]
- **Problem**: `prisma.$executeRawUnsafe('PRAGMA busy_timeout = 10000;')` causes a non-critical SQLite result error during client initialization.
- **Root Cause**: SQLite returns a single-row result for PRAGMAs in Prisma runtime, throwing when called with `$executeRawUnsafe`.
- **Solution**: Replace `$executeRawUnsafe` with `$queryRawUnsafe` or add PRAGMA connection parameters directly to `DATABASE_URL` in `src/lib/prisma.ts`.
- **Verification**: Re-run `npm run test` and verify zero warning messages in stdout.

### TASK FIX-02: Unified API Authorization Guard Standardization [P1]
- **Problem**: Mutation endpoints in secondary routes check legacy `hasPermission(user.role, ...)` instead of `authorize(actor, action, resource)`.
- **Root Cause**: Partial migration to the pure functional decision engine.
- **Solution**: In `PATCH`/`DELETE` handlers across `/api/v1/students`, `/api/v1/academics`, `/api/v1/staff`, resolve `getSecurityActor(user)` and invoke `authorize(actor, action, targetResource)`.
- **Verification**: Execute `npx vitest run tests/authorization-comprehensive-boundaries.test.ts`.

### TASK FIX-03: Academic Session Bulk Student Promotion Engine [P1]
- **Problem**: Students cannot be cleanly promoted to the next academic year without losing historical session references.
- **Solution**:
  1. Add `StudentEnrollmentHistory` model to `prisma/schema.prisma`.
  2. Implement `POST /api/v1/academics/promote` endpoint to atomically archive current section/session and link students to the target session/class level.
- **Verification**: Run promotion workflow test verifying historical academic records remain accessible under past sessions.

### TASK FIX-04: Automated Late Fee & Concession Engine [P1]
- **Problem**: Late fees must be calculated dynamically based on due dates and institution grace periods.
- **Solution**: Add late fee calculation helper in `src/lib/fees.ts` that updates `StudentFeeAllocation` balance based on days overdue.
- **Verification**: Test fee allocation calculation for overdue dates.

### TASK FIX-05: Private Signed Document Gateway [P2]
- **Problem**: Uploaded student/staff documents store static URLs without tokenized access controls.
- **Solution**: Gate document download URLs through `/api/v1/documents/[id]/download` which verifies `authorize(actor, 'documents.download', resource)` before returning a short-lived tokenized stream or pre-signed URL.
- **Verification**: Attempt document download from an unauthorized role and verify HTTP 403 Forbidden.

---

## Summary & Target Milestone
Executing these 5 prioritized tasks will bring AURXON ERP from **LEVEL G3** to **LEVEL G4 (Production Candidate)** and **LEVEL G5 (Fully Deployable Commercial School & Coaching ERP)**.
