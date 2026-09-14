# AURXON Education OS — Software Requirements & Design Description (IEEE 830 / IEEE 1016 Standard)

**Document Reference:** AURXON-SRS-SDD-2026-V4.2  
**Standards Compliance:**
- **IEEE Std 830-1998 / ISO/IEC/IEEE 29148:2018** (Software Requirements Specification)
- **IEEE Std 1016-2009** (Standard for Information Technology — Systems Design — Software Design Descriptions)
- **IEEE Std 829-2008** (Standard for Software and System Test Documentation)
- **IEEE Std 828-2012** (Standard for Configuration Management in Systems and Software Engineering)
- **Indian National Regulatory Compliance:** CBSE Affiliation Byelaws, UDISE+ (Unified District Information System for Education Plus), APAAR (Automated Permanent Academic Account Registry), RTE Act Section 12(1)(c), NEP 2020 Holistic Progress Card guidelines.

---

## 1. Introduction (IEEE 830 Section 1)

### 1.1 Purpose
This document provides the formal architectural specification, functional requirement baseline, modular decomposition, and verification criteria for **AURXON Education OS**, a multi-tenant enterprise software system engineered for K-12 schools, coaching institutes, and educational trusts in India and globally.

### 1.2 Scope
AURXON provides unified management covering academic life-cycle, student records (SIS), biometric attendance, continuous examination evaluations, fees and financial accounting, bus fleet telematics (AIS-140), library accession circulation, staff HR and payroll, and regulatory compliance documents (CBSE 2-term report cards, official Transfer Certificates).

### 1.3 Definitions, Acronyms, and Abbreviations
- **AIS-140**: Automotive Industry Standard 140 for Intelligent Transportation Systems.
- **APAAR**: Automated Permanent Academic Account Registry (Edu-ID for Indian students).
- **CBSE**: Central Board of Secondary Education.
- **DLT**: Distributed Ledger Technology (TRAI SMS sender verification system).
- **HPC**: Holistic Progress Card under NEP 2020.
- **RBAC**: Role-Based Access Control.
- **RTE**: Right to Education Act (25% subsidized intake mandate).
- **TC**: Student Transfer Certificate / School Leaving Certificate.
- **UDISE+**: Unified District Information System for Education Plus (Ministry of Education, Govt. of India).
- **WAL**: Write-Ahead Logging (database recovery mechanism).

---

## 2. Overall Description & System Architecture (IEEE 1016 Section 4 & 5)

### 2.1 Multi-Tenant Domain Model Hierarchy
The system enforces strict 4-tier relational scoping across all persistent entities:

```text
+-------------------------------------------------------------------------+
|                  ORGANIZATION (SaaS Tenant & Trust)                     |
|  - Cryptographic Scope ID                                               |
|  - Entitlement Switchboard (Transport, Library, Payroll, LMS)           |
+------------------------------------+------------------------------------+
                                     | 1:N
                                     v
+-------------------------------------------------------------------------+
|                INSTITUTION (Operational Campus / School)                |
|  - Affiliation No. (CBSE/ICSE/State)                                   |
|  - National UDISE+ Code                                                 |
+------------------------------------+------------------------------------+
                                     | 1:N
                                     v
+-------------------------------------------------------------------------+
|                 BRANCH / WING (Physical Campus Facility)                |
|  - Senior Wing, Junior Wing, Hostel Complex, Transportation Depot       |
+------------------------------------+------------------------------------+
                                     | 1:N
                                     v
+-------------------------------------------------------------------------+
|             ACADEMIC SESSION (Temporal Operating Boundary)              |
|  - 2025-2026 Active Term                                                |
|  - Class Levels, Sections, Subject Assignments, Fee Structures          |
+-------------------------------------------------------------------------+
```

### 2.2 Security Architecture & Authorization Invariants
1. **Zero-Trust Cross-Tenant Isolation**: No database query shall retrieve or mutate data without evaluating `where: { organizationId: sessionUser.organizationId }`.
2. **Deterministic Cryptographic Tokens**: 256-bit signed JSON Web Tokens (JWT) stored in `HttpOnly`, `SameSite=Lax` cookies with strict tamper rejection.
3. **Data Minimization (Public Endpoints)**: Public search and lookup endpoints (`/api/v1/portal/search`, `/api/v1/portal/:slug`) strictly strip internal database identifiers, password hashes, and sensitive audit records.

---

## 3. Module Decomposition & Requirements Matrix (IEEE 1016 Section 6)

| Module ID | Module Name | Route | IEEE Functional Specification |
| :--- | :--- | :--- | :--- |
| **MOD-01** | Student Information System (SIS) | `/students` | Master student record management, parent/guardian linkage, APAAR/UDISE+ registration, category categorization (GEN/OBC/SC/ST/EWS), sibling identification. |
| **MOD-02** | Admissions Pipeline | `/admissions` | Multi-stage inquiry management, entrance evaluation scoring, registration fee capture, and deterministic conversion to active student records. |
| **MOD-03** | Daily Attendance & Biometrics | `/attendance` | Roll-call logging, period attendance, composite-key idempotency `(studentId, date)`, automated absent SMS triggering, ZKTeco biometric integration. |
| **MOD-04** | Academics & Timetable | `/academics`, `/timetable` | Class and section hierarchy, subject allocations, teacher load balancing, weekly grid scheduling, room collision prevention. |
| **MOD-05** | Examinations & Grading | `/examinations` | CBSE scholastic (Periodic Test, Notebook, Subject Enrichment, Term Exam) and co-scholastic grading; automated 9-point letter grade assignment (A1 to E2). |
| **MOD-06** | Fees & Invoicing Engine | `/fees` | Multi-head fee structures (Tuition, Lab, Exam, Transport), installment schedule, partial payment capture, computerized GST-compliant receipts. |
| **MOD-07** | Financial Accounting | `/finance` | Institutional cashbooks, income and expense ledgers, balance sheet reconciliation, transaction category tracking. |
| **MOD-08** | Transport & Live Telematics | `/transport` | Fleet vehicle fitness/insurance tracking, multi-point routes with arrival/departure timestamps, commuter seat allocations, simulated AIS-140 GPS radar. |
| **MOD-09** | Library & Book Circulation | `/library` | Accession register with ISBN and rack locations, circulation desk for book issue and return, automated ₹5/day overdue fine calculation, NCERT digital repo. |
| **MOD-10** | Faculty & Staff HR Directory | `/staff` | Teaching and administrative staff directory, biometric punch logs, multi-type leave approval workflows (Casual, Medical, Earned), EPF/TDS salary statement slips. |
| **MOD-11** | CBSE Reports & Document Center | `/reports` | Formatted CBSE 2-Term report cards, official Transfer Certificates (TC) with UDISE numbers, class tabulation registers, fee defaulter statements. |
| **MOD-12** | Institutional Settings | `/settings` | Board affiliation profile, active academic session switcher, modular entitlement switchboard (toggle Transport, Library, Payroll), TRAI DLT SMS and WhatsApp Cloud API settings. |

---

## 4. Test Documentation & Quality Assurance (IEEE 829 Standard)

### 4.1 Test Hierarchy
The verification framework uses Vitest with automated mock contexts, testing cryptographic correctness, RBAC boundaries, grading determinism, and multi-tenant security:

1. **Test Suite 1: `tests/erp-core.test.ts`**
   - Password hashing and verification via Argon2/Bcrypt.
   - JWT session issuance and tamper rejection.
   - RBAC permission engine (`hasPermission`, role hierarchy).
   - CBSE grading scale boundary determinism.
   - Financial fee allocation and partial payment reconciliation.
2. **Test Suite 2: `tests/multi-tenancy-security.test.ts`**
   - Cross-organization data isolation.
   - Unauthorized role escalation prevention.
3. **Test Suite 3: `tests/end-to-end-workflows.test.ts`**
   - Student enrollment lifecycle with guardian binding.
   - Fee allocation to payment collection workflow.
   - Attendance idempotency verification.
   - Examination marks entry and grade calculation.
   - Multi-campus tenant provisioning transaction.
4. **Test Suite 4: `tests/portal-enrollment.test.ts`**
   - Shortest link and acronym resolution (`/s/:slug`).
   - Public data minimization audit.
5. **Test Suite 5: `tests/portal-search.test.ts`**
   - Debounced database auto-predict search.
   - Empty, single-character, and exact query matching.
6. **Test Suite 6: `tests/security-adversarial.test.ts`**
   - SQL injection / query manipulation resistance.
   - Session forgery prevention.

---

## 5. Software Configuration Management (IEEE 828 Standard)

### 5.1 Versioning Scheme
AURXON follows **Semantic Versioning 2.0.0 (SemVer)**: `MAJOR.MINOR.PATCH`
- `MAJOR`: Incompatible API or database schema changes.
- `MINOR`: New module additions or backward-compatible feature extensions.
- `PATCH`: Backward-compatible bug fixes, security patches, or documentation updates.

### 5.2 Commit Message Standard (Conventional Commits + IEEE Traceability)
All Git commits must strictly follow the format:

```text
<type>(<scope>): <short description in imperative present tense>

[Optional Body: Detailed explanation of changes, rationale, architectural context]

[Optional Footer: IEEE Requirement Tracing ID, Closes #issue, Breaking Changes]
```

#### Permitted Types:
- `feat`: New feature or ERP module (corresponds to an SRS requirement).
- `fix`: Defect resolution.
- `docs`: Documentation updates (IEEE SRS, SDD, User Guides, README).
- `style`: Formatting, whitespace, pure CSS token adjustments without logic changes.
- `refactor`: Code restructuring without functional alterations.
- `test`: Addition or refinement of IEEE 829 test cases.
- `chore`: Build scripts, dependencies, configuration updates.

---

## 6. Regulatory & Statutory Traceability Matrix

| Statutory Requirement | Authority | System Implementation | Verification Reference |
| :--- | :--- | :--- | :--- |
| **Section 12(1)(c) RTE Subsidies** | Govt. of India | Student Category `RTE_QUOTA`, fee exemption flag in `FeeHead`. | `tests/end-to-end-workflows.test.ts` |
| **CBSE Examination Scheme** | CBSE New Delhi | 9-point grading scale (A1, A2, B1, B2, C1, C2, D, E1, E2). | `tests/erp-core.test.ts` |
| **UDISE+ Student Identifiers** | Ministry of Education | Dedicated `udiseNumber` and institutional `udiseCode` attributes. | `src/app/api/v1/reports/route.ts` |
| **AIS-140 Vehicle Tracking** | MoRTH | Real-time GPS coordinates, speed threshold alerts, and route timelines. | `src/app/api/v1/transport/route.ts` |
| **TRAI DLT SMS Compliance** | Telecom Regulatory Auth. | Registered Telemarketer Sender ID and approved template headers. | `src/app/settings/page.tsx` |
| **Data Protection & Residency** | MeitY | 100% Indian datacenter residency, AES-256 GCM encryption at rest. | `src/app/settings/page.tsx` |
