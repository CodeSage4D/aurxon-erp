Exactly. **Before adding more modules, we should stop and define the people who will actually use AURXON School Management System.** Otherwise we'll keep adding features without knowing who owns them, who sees them, and who is allowed to perform each action.

One terminology point first: since this is **AURXON's product provided to schools/coaching centres**, there are really two levels of actors:

**AURXON platform side** → operates the software platform
**Institution side** → school/coaching centre actually uses it
**Family side** → parents/students consume the services/information

I would model them separately.

---

# 1. AURXON School Management System — Actor Model

![Image](https://images.openai.com/static-rsc-4/z1BC0rgLTtta30lkHH_g4PZPHXzwsmeSXaJwOuNbDfxB-fSiExiNF2zdeZ3uC1UNGY8nfLUsLsHMmgkQFkMCmENcBlANYVTas3WgIv1QZm8Yls4seuXbhGrlIpWQ7DROJ686Q6FZRvFfnhgvQYe90VPd4aJR-OSXoBGYyxZ8OVpQ6xjDC1g0-EBqOem12MTe?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/XM6ljwSN3amKk63IX3uzyXkuNBnNcX5dHnSybAF8-tlZZaSC11L2Uigf7oN20_AqoWc6YjCqNol6pBsSxugAyJAjeAcC7z7RYAw6KMevofsyMwDbhVnXMe-Y6UwkU71_m3l58aAYifF2cbk4z3BhiurTje-mrGFnq6dr8vQqY-oFw4qq7JWZoKwtQedio8AU?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/k5PVbRyUiGRaXn-UXkXzaXgkkC28qJW5ppaxBmK3bJ9mTHZD4Hs-sNjTuVT1qTPigBAQRN_Qkqvjkrm5Zxyd85uOCgKC_URMHHivbP_VtVMs7sExtjRbM43ST3ccKVMRKoiyPaZKzviCb0AMN6S7Im0LdzvvCw0u2aoTkSTR1WAxUvyRuhW04csp1vwRazW_?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/dfUIMbxuC4DQSOLBgvbqCInW-Wx8JyOyD-VwE9fgQgaqZqEjqGiuTfa6aQUAHxJ4X5MYa1YiutVGuvyMKN9kpBa4_q7I7YRJCor0_J5rBN5Cl8YwngEY0H-YBIs3BGpdUOu32AW898E3CwjMc4pddbpGqJ0fy3um6zomyPofJPJ6-srj-9l51wrsEJWQ4v8T?purpose=fullsize)

![Image](https://images.openai.com/static-rsc-4/dcXjhi_Cd3GuM55dP6G0BVjOMmwMq05-hNWaZtNNzVOr8m4IkV1ZMw-2U8pYf5I05tsiKMa3vQPMtkqKX9zalas38AsHZCe4tptont9YM0umQDUu8Kj6CYd5eK1Kvytub1fRSu0Lw5VR7XFaZLdNXxg2xoFhD2Hfu03YoYL6OWOptZj-VUzGfhXziMmv44s5?purpose=fullsize)

Think of the ecosystem as:

```text
                    AURXON PLATFORM
                          │
             ┌────────────┴────────────┐
             │                         │
       AURXON OPERATIONS          AURXON SUPPORT
             │
             ▼
      SCHOOL / COACHING CENTER
             │
     ┌───────┼────────┬──────────┐
     │       │        │          │
  ADMIN   ACADEMIC  FINANCE    STAFF
     │       │        │
     └───────┼────────┘
             │
       STUDENTS / PARENTS
```

But I would **not** make all of these simply "roles" in the database.

Some are **platform actors**, some are **institution roles**, and some are **end users**.

---

# 2. AURXON Platform Users

These users belong to **AURXON**, not to a school.

## A. AURXON Platform Super Admin

### Purpose

Owns the AURXON platform itself.

### Responsibilities

* manage institutions
* activate/suspend institution accounts
* manage platform configuration
* platform-level monitoring
* subscription/licensing if eventually introduced
* system-wide security
* platform audit
* support escalation
* manage platform administrators

### Access

Potentially:

```text
AURXON
├── Institutions
├── Platform Users
├── Platform Configuration
├── System Health
├── Security
├── Audit
└── Support
```

### Behaviour

This user should **not automatically behave like a school's principal**.

That distinction is important.

AURXON support staff should not casually browse student records just because they are platform staff.

Sensitive institution data should require explicit support access / delegated access, with audit logging.

---

# 3. AURXON Support / Operations

This is different from Super Admin.

### Purpose

Help institutions operate the product.

### Responsibilities

* troubleshoot accounts
* assist onboarding
* investigate technical problems
* assist with configuration
* handle support tickets
* diagnose integration problems

### Access

Limited platform operational access.

For example:

```text
Institution metadata       ✓
System health              ✓
User account status        ✓
Student personal data      restricted
Documents                  restricted
Fees                       restricted
Payroll                    restricted
```

This is where we should eventually implement **temporary support access**, rather than permanent unrestricted access.

---

# 4. Institution-Level Users

Now we enter the actual school/coaching centre.

The institution is the customer.

A school may have:

```text
Institution
│
├── Principal / Director
├── School Administrator
├── Academic Coordinator
├── Teachers
├── Accountant / Fee Manager
├── HR / Payroll
├── Reception / Front Desk
├── Librarian
├── Transport Manager
└── Other Staff
```

Not every institution needs all of them.

Therefore, **RBAC must be configurable**.

---

# 5. Institution Owner / Principal / Director

This is the highest normal institution-level user.

For a school:

**Principal**

For a coaching centre:

**Director / Centre Head**

### Responsibilities

* oversee institution
* view overall dashboard
* approve important administrative actions
* monitor academics
* monitor attendance
* monitor fees
* monitor staff
* review reports
* manage institutional settings
* assign responsibilities

### Behaviour

This user should be able to see the institution's overall picture without necessarily performing every operational task.

For example:

```text
Principal
│
├── Dashboard
├── Students
├── Teachers
├── Academics
├── Fees
├── Staff
├── Reports
└── Administration
```

But viewing payroll ≠ editing payroll.

Viewing student information ≠ editing sensitive documents.

That's where permissions become important.

---

# 6. School Administrator

This will probably be one of the **most important operational users**.

### Purpose

Runs the day-to-day administration.

### Responsibilities

* student registration
* student records
* admissions
* class/section assignment
* staff records
* parent records
* documents
* academic setup
* basic communication
* administrative reports

### Behaviour

High operational access, but not necessarily:

* payroll approval
* financial settlement
* platform administration

---

# 7. Academic Coordinator

### Purpose

Owns academic operations.

### Responsibilities

* academic years
* classes
* sections
* subjects
* teacher assignment
* timetable
* examinations
* academic results
* academic reports
* curriculum structure

### Behaviour

Should not automatically have access to:

```text
Payroll
Salary
Bank details
Financial settlement
Sensitive government IDs
```

This is an important example of **least privilege**.

---

# 8. Teacher

Teacher is a completely different UX from administrator.

A teacher should not see a huge administration dashboard.

Their experience should be task-oriented.

```text
Teacher Dashboard

Today's Classes
Upcoming Classes
Attendance
My Students
Assignments
Exams
Results
Announcements
```

### Responsibilities

* view assigned classes
* take attendance
* manage assigned academic work
* enter marks
* view relevant students
* communicate with students/parents where allowed

### Behaviour

Teacher should only access:

**their assigned academic scope.**

Example:

```text
Teacher A
   ↓
Class 10-A
   ↓
Students belonging to 10-A
```

not:

```text
Teacher A
→ every student in school
```

unless explicitly permitted.

---

# 9. Accountant / Fee Manager

This role should be isolated from academics.

### Responsibilities

* fee structures
* fee assignments
* payment collection
* receipts
* outstanding fees
* concessions
* financial reports
* payment reconciliation

### Access

```text
Finance
├── Fee Heads
├── Fee Structures
├── Student Fees
├── Payments
├── Receipts
└── Outstanding
```

Should not automatically access:

* teacher salary
* student academic records beyond what's necessary
* sensitive documents

---

# 10. HR / Payroll Manager

### Responsibilities

* staff profiles
* employee records
* salary structures
* payroll preparation
* payroll review
* salary slips
* staff-related reports

### Behaviour

Very sensitive access.

For example:

```text
HR Manager
    ↓
Staff
    ↓
Salary
    ↓
Payroll
```

But payroll **approval/payment** can require another permission.

This gives us separation of duties.

---

# 11. Reception / Front Desk

Very important and often forgotten.

### Responsibilities

* student enquiries
* admissions assistance
* parent enquiries
* visitor information
* basic student lookup
* contact information
* document collection status

### Should NOT see:

* salary
* payroll
* financial reports
* sensitive government IDs
* confidential academic information

Their UI should be extremely simple and fast.

---

# 12. Parent / Guardian

Parent is not an administrative institution user.

They should get a completely different experience.

Potential dashboard:

```text
My Children
│
├── Attendance
├── Homework
├── Exams
├── Results
├── Fees
├── Receipts
├── Documents
├── Notices
└── Messages
```

If a parent has two children:

```text
Parent
│
├── Rahul — Class 8 A
└── Priya — Class 5 B
```

They can switch between children.

But they must **never be able to manipulate school data**.

---

# 13. Student

Student is also a separate end-user experience.

### Dashboard

```text
My Dashboard

Today's Classes
Attendance
Homework
Assignments
Exams
Results
Timetable
Notices
Documents
```

Permissions are mostly self-scoped.

```text
Student
→ own profile
→ own academic data
→ own attendance
→ own results
```

Not another student's data.

---

# 14. Important: Don't Make 20 Hardcoded Roles

This is where your current RBAC architecture can become powerful.

Instead of:

```text
if role === "teacher"
if role === "principal"
if role === "accountant"
```

Use:

```text
ROLE
   ↓
PERMISSIONS
   ↓
RESOURCE SCOPE
```

Example:

```text
Teacher

student.read
attendance.create
attendance.read
exam.read
result.create

scope:
assigned_classes
```

Whereas:

```text
Principal

student.read
student.create
student.update
attendance.read
exam.read
result.read
fee.read
staff.read
report.read

scope:
entire_organization
```

---

# 15. We Need One More Dimension: Scope

This is **very important for your architecture**.

RBAC alone isn't enough.

We need:

### Role

**What can you do?**

### Scope

**Where can you do it?**

### Relationship

**Whose data can you access?**

For example:

| User         | Permission   | Scope                    |
| ------------ | ------------ | ------------------------ |
| Principal    | student.read | Entire institution       |
| Teacher      | student.read | Assigned classes         |
| Accountant   | student.read | Finance-relevant records |
| Parent       | student.read | Own children             |
| Student      | student.read | Self                     |
| Receptionist | student.read | Basic profile only       |

This will prevent your system from becoming dangerously broad.

---

# 16. Suggested Final Actor Hierarchy

I'd initially define **10 primary user types**:

### AURXON

1. **Platform Super Admin**
2. **Platform Support/Operations**

### Institution

3. **Institution Owner / Principal / Director**
4. **School Administrator**
5. **Academic Coordinator**
6. **Teacher**
7. **Accountant / Fee Manager**
8. **HR / Payroll Manager**
9. **Reception / Front Desk**

### End Users

10. **Parent / Guardian**
11. **Student**

Technically that's **11**, and that's fine. They aren't all necessarily database roles.

---

# 17. Role vs User Type

I'd structure it like:

```text
USER
 │
 ├── Platform Membership
 │       └── AURXON role
 │
 └── Institution Membership
         │
         ├── Role
         │    └── Permissions
         │
         └── Scope
              ├── Organization
              ├── Branch
              ├── Class
              ├── Section
              └── Self/Children
```

This is much more scalable than simply:

```text
User → Role → Permissions
```

---

# 18. Behavioural Design

We should design each role around **what they come to the software to accomplish**, not around what database tables they can access.

For example:

### Principal

**Question:**

> "How is my institution performing?"

### Administrator

> "What administrative work needs to be done?"

### Teacher

> "What do I need to do for my classes today?"

### Accountant

> "What fees are due and what payments were received?"

### HR

> "What staff/payroll work needs attention?"

### Parent

> "How is my child doing?"

### Student

> "What do I need to do today?"

### AURXON Support

> "What is wrong with this institution's system?"

This should directly influence their dashboard, navigation and notifications.

---

## The architecture I'd lock before coding further

```text
                    AURXON
                       │
             ┌─────────┴─────────┐
             │                   │
       PLATFORM USERS       INSTITUTIONS
             │                   │
      ┌──────┴──────┐      ┌─────┴─────────┐
      │             │      │               │
   ADMIN         SUPPORT  STAFF          END USERS
                           │               │
              ┌────────────┼───────┐       │
              │            │       │       │
          PRINCIPAL    ACADEMIC  FINANCE   PARENT
              │         │         │          │
           ADMIN      TEACHER   ACCOUNTANT  STUDENT
                       │
                     STAFF
```

**Next, before creating more Prisma models, I'd define the complete Role × Permission × Scope matrix.** That's the foundation that will determine what every sidebar, dashboard, API endpoint, database query, document, fee record, salary record and student record can actually expose.


Yes — **these are missing from the previous prompt**.

For a proper product-level specification, especially before asking an agent to implement the Account & Role system, we should explicitly define:

1. **Functional Requirements**
2. **Non-Functional Requirements**
3. **Limitations / Current Boundaries**
4. **Future Scope**
5. **Acceptance Criteria / Definition of Done**

Otherwise the agent may technically implement the RBAC system but make assumptions about performance, security, scale, future extensibility, or unsupported features.

For AURXON, I would structure it like this:

### 1. Functional Requirements

These describe **what the system must do**.

**Identity**

* User registration/login/logout
* Session management
* Account activation/deactivation
* Password/security management

**Account Management**

* Create account
* Update account
* Disable account
* Search/filter accounts
* View account details
* Link account to staff/teacher/student/guardian

**Role Management**

* Create role
* Edit role
* Assign role
* Remove/change role
* System roles vs custom roles

**Permission Management**

* Module-level permissions
* Action-level permissions
* Read/create/update/delete/approve/publish etc.
* Effective permission calculation

**Scope Management**

* Organization scope
* Branch scope
* Class/section scope
* Subject scope
* Self scope
* Own-child scope

**Relationship Management**

* Teacher → assigned classes
* Teacher → assigned subjects
* Parent → children
* Student → own profile
* Staff → staff profile

**Authorization**

* Frontend route protection
* Sidebar permission filtering
* Page-level authorization
* API authorization
* Database-level tenant/resource filtering

**Audit**

* Account creation
* Role changes
* Permission changes
* Scope changes
* Account disablement
* Security events

---

### 2. Non-Functional Requirements

These describe **how the system must behave**.

**Security**

* HttpOnly secure session cookies
* Argon2id passwords
* No authorization based only on frontend state
* Tenant isolation
* Least privilege
* Sensitive-data minimization
* No passwords/tokens in logs
* Audit security-sensitive operations

**Performance**

* Account list should support pagination
* Permission evaluation should avoid unnecessary DB queries
* Avoid N+1 queries
* Indexed organization/user/membership relationships
* Efficient scoped student/teacher queries

**Reliability**

* Account creation should be transactional
* Role/permission changes should not leave partial state
* Failed operations should not corrupt relationships

**Scalability**

* Should support multiple institutions
* Should support multiple branches
* Should support custom roles
* Should not assume one teacher/one class
* Should not assume one parent/one child

**Maintainability**

* Central authorization service/guard
* Reusable permission definitions
* No duplicated role logic throughout frontend/backend
* Typed DTOs/API contracts
* Testable authorization policies

**Usability**

* Different users see relevant navigation
* Account creation adapts to actor type
* Sensitive information is appropriately masked
* Clear access/permission explanations

---

### 3. Current Limitations

This is **very important** because otherwise the agent will keep expanding scope.

For the first implementation, explicitly say:

* No automatic AI-based role assignment.
* No biometric authentication requirement.
* No advanced SSO initially.
* No LDAP/Active Directory integration initially.
* No government-ID verification service.
* No automatic Aadhaar verification.
* No statutory payroll compliance engine unless separately specified.
* No external identity-provider federation initially.
* No complex workflow/approval engine unless required by a module.
* No cross-institution user access unless explicitly designed.
* No unrestricted platform-admin access to institution confidential data.
* No offline authorization model initially.
* No assumption that frontend hiding equals security.
* No arbitrary permission creation that can bypass platform safeguards.

And importantly:

> **Limitations are product boundaries, not implementation excuses.**

The agent still has to fully implement everything that is inside the current scope.

---

# 4. Future Scope

Then tell the agent what the architecture **must leave room for**, without implementing everything now.

### Identity

Future:

* Google/Microsoft login
* SSO
* OAuth/OIDC
* LDAP/Active Directory
* MFA
* Passkeys/WebAuthn
* biometric authentication
* device/session management

### Authorization

Future:

```text
Role
+
Permission
+
Scope
+
Relationship
+
Policy
+
Workflow
```

Potential future capabilities:

* temporary permissions
* delegated access
* approval-based permissions
* branch-specific administrators
* department-level access
* time-based access
* emergency/support access
* permission expiry

### Institution structure

Future:

```text
Platform
 ↓
Institution
 ↓
Campus / Branch
 ↓
Department
 ↓
Academic Year
 ↓
Class
 ↓
Section
 ↓
Subject
```

The authorization model should not break when this hierarchy becomes more complex.

### Parent/Student

Future:

* multiple guardians
* guardian relationship types
* custody/access restrictions
* sibling accounts
* student self-service
* student-to-student restrictions
* parent communication permissions

### Staff

Future:

* HR hierarchy
* departments
* designations
* reporting managers
* leave permissions
* payroll approval chain
* employee self-service

### Security

Future:

* MFA
* device trust
* login anomaly detection
* session/device management
* security alerts
* privileged-access workflows
* detailed security analytics

---

## 5. Acceptance Criteria

This is the part I would **definitely add to the agent prompt**.

The agent shouldn't say:

> "RBAC implemented successfully."

It should prove it.

For example:

```text
Teacher:
Assigned Class 8-A
        ↓
Student 101 → ALLOW
Student 102 → ALLOW

Class 10-C
        ↓
Student 501 → DENY
```

Parent:

```text
Parent A
 ├── Child 101 → ALLOW
 ├── Child 102 → ALLOW
 └── Child 999 → DENY
```

Accountant:

```text
Fees       → ALLOW
Payments   → ALLOW
Receipts   → ALLOW
Payroll    → DENY
HR salary  → DENY
```

Student:

```text
Own profile       → ALLOW
Own attendance    → ALLOW
Own result        → ALLOW
Other student     → DENY
Teacher payroll   → DENY
```

Cross-tenant:

```text
Organization A user
        ↓
Organization B student
        ↓
DENY
```

And test **direct API requests**, not just UI.

---

# The final requirement structure

For this particular AURXON Account & Authorization subsystem, I'd make the agent specification:

```text
01. Product Context
02. Actors
03. Responsibilities
04. Behaviour
05. Account Model
06. Role Model
07. Permission Model
08. Scope Model
09. Relationship Model

10. Functional Requirements
11. Non-Functional Requirements

12. Frontend Requirements
13. Backend Requirements
14. Database Requirements
15. Security Requirements
16. Audit Requirements

17. Current Limitations
18. Explicitly Out of Scope
19. Future Scope

20. Testing Strategy
21. Security Test Matrix
22. Acceptance Criteria
23. Definition of Done
24. Implementation Order
25. Agent Execution Rules
```

**This is much stronger than just giving the agent a role list.**

The key distinction is:

> **Functional = what AURXON Account Management does.**
> **Non-functional = how reliably, securely, and scalably it does it.**
> **Limitations = what we deliberately aren't solving now.**
> **Future scope = what today's architecture must not prevent us from building later.**

For AURXON, I'd actually freeze this specification **before adding more account-related Prisma models**, because this decision will propagate into Students, Parents, Teachers, Fees, Payroll, Documents, Attendance, Exams, Reports and practically every future module.
