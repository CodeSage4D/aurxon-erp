# AURXON Education OS — Demo Credentials & Test Accounts Registry

This registry provides authoritative login identifiers, roles, and credentials for all seeded educational organizations, faculties, administrators, and students in the AURXON ecosystem.

**Global Default Password for all test accounts:**  
```text
Password@123
```

---

## 1. Platform Super Admin (AURXON HQ Control Plane)

The Super Admin has unrestricted access to the **AURXON HQ SaaS Control Plane** (`/aurxon`), multi-tenant provisioning, database telemetry, licensing, feature flags, and audit trails.

| Name | Role | Email | Password | Access Route |
| :--- | :--- | :--- | :--- | :--- |
| **Vikramaditya Singhania** | `SUPER_ADMIN` | `superadmin@aurxon.io` | `Password@123` | `/aurxon` & `/login` |

---

## 2. Seeded Educational Organizations & Dedicated Portals

| Organization Name | Code | Slug | Board / Type | City | Dedicated Portal URL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Delhi Public School Society** | `DPS-ORG` | `dps-society` | CBSE (K-12 School Chain) | New Delhi | `http://localhost:3000/s/dps-society` |
| **Apex Coaching Classes** | `APEX` | `apex-classes` | NEET / JEE Coaching Academy | Kota / Indore | `http://localhost:3000/s/apex-classes` |
| **Sharma Tutorials** | `SHARMA` | `sharma-tutorials` | Board & Olympiad Coaching | Bhopal | `http://localhost:3000/s/sharma-tutorials` |
| **St. Mary's Convent School** | `STMARYS` | `st-marys` | ICSE (K-12 Convent) | Jaipur | `http://localhost:3000/s/st-marys` |
| **ABC International School** | `ABC` | `abc-school` | CBSE (Multi-Campus) | Indore | `http://localhost:3000/s/abc-school` |

---

## 3. School 1: Delhi Public School Society (`dps-society`)

### A. Leadership & Faculty Accounts
| Role | Staff Name | Official Email / ID | Password | Primary Campus |
| :--- | :--- | :--- | :--- | :--- |
| **Principal** | Dr. Meenakshi Sundaram | `principal.rkp@dps-society.edu` | `Password@123` | R.K. Puram (Senior Wing) |
| **Organization Admin** | Rajesh Malhotra | `admin@dps-society.edu` | `Password@123` | DPS Central Society HQ |
| **Faculty (Mathematics)** | Amit Kulkarni | `teacher.math@dps-society.edu` | `Password@123` | R.K. Puram (Senior Wing) |
| **Faculty (Science)** | Dr. Sunita Deshmukh | `teacher.science@dps-society.edu` | `Password@123` | R.K. Puram (Senior Wing) |
| **Chief Accountant** | Ramesh Bansal | `accountant@dps-society.edu` | `Password@123` | R.K. Puram (Senior Wing) |

### B. Demo Students & Parents (Class 10 - Section A)
| Admission No | Student Full Name | Class / Section | Roll | Student Login Email | Parent Login Email | Password |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `DPS-2025-001` | **Aarav Sharma** | Class 10 - Sec A | 1 | `student.aarav@dps-society.edu` | `parent.aarav@gmail.com` | `Password@123` |
| `DPS-2025-002` | **Ananya Iyer** | Class 10 - Sec A | 2 | `ananya.iyer@gmail.com` | `parent.ananya@gmail.com` | `Password@123` |
| `DPS-2025-003` | **Rohan Verma** | Class 10 - Sec A | 3 | `rohan.verma@gmail.com` | `parent.rohan@gmail.com` | `Password@123` |
| `DPS-2025-004` | **Priya Patel** | Class 10 - Sec A | 4 | `priya.patel@gmail.com` | `parent.priya@gmail.com` | `Password@123` |
| `DPS-2025-005` | **Kabir Mehta** | Class 10 - Sec A | 5 | `kabir.mehta@gmail.com` | `parent.kabir@gmail.com` | `Password@123` |

---

## 4. Coaching Institute: Apex Coaching Classes (`apex-classes`)

### A. Management & Faculty Accounts
| Role | Staff Name | Official Email / ID | Password | Center |
| :--- | :--- | :--- | :--- | :--- |
| **Director / Admin** | Rajesh Agrawal | `director@apex.edu` | `Password@123` | Kota Center |
| **Center Admin** | Vivek Singhal | `admin@apex.edu` | `Password@123` | Indore Center |
| **Faculty (Physics - JEE)**| Dr. H.C. Bhatia | `faculty.physics@apex.edu` | `Password@123` | Kota Center |

### B. Demo Students (JEE & NEET Target Batches)
| Admission No | Student Name | Target Batch | Roll | Student Login Email | Password |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `APEX-2025-001` | **Aditya Agrawal** | Target JEE Advanced 2026 | 101 | `student.priya@apex.edu` | `Password@123` |
| `APEX-2025-002` | **Sneha Reddy** | Target NEET Medical 2026 | 102 | `sneha.reddy@apex.edu` | `Password@123` |

---

## 5. Coaching Institute: Sharma Tutorials (`sharma-tutorials`)

### A. Management & Faculty Accounts
| Role | Staff Name | Official Email / ID | Password | Center |
| :--- | :--- | :--- | :--- | :--- |
| **Director** | Manoj Sharma | `director@sharma.edu` | `Password@123` | Bhopal MP Nagar |
| **Administrator** | Pooja Sharma | `admin@sharma.edu` | `Password@123` | Bhopal MP Nagar |
| **Faculty (Maths)** | R.D. Saxena | `faculty.math@sharma.edu` | `Password@123` | Bhopal MP Nagar |

### B. Demo Students
| Admission No | Student Name | Batch | Roll | Student Login Email | Password |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ST-2025-001` | **Tanmay Joshi** | Foundation Class 10 | 201 | `student.rohan@sharma.edu` | `Password@123` |

---

## 6. Convent School: St. Mary's Convent (`st-marys`)

| Role | Staff Name | Official Email / ID | Password | City |
| :--- | :--- | :--- | :--- | :--- |
| **Principal** | Sister Mary D'Souza | `principal@stmarys.edu` | `Password@123` | Jaipur |
| **Staff Admin** | John Fernandes | `admin@stmarys.edu` | `Password@123` | Jaipur |

---

## 7. Quick Copy-Paste Format for Rapid Testing

```text
Super Admin:
Username: superadmin@aurxon.io
Password: Password@123

Principal (DPS Society):
Username: principal.rkp@dps-society.edu
Password: Password@123

Faculty (Mathematics):
Username: teacher.math@dps-society.edu
Password: Password@123

Accountant (Fee Desk):
Username: accountant@dps-society.edu
Password: Password@123

Student (Class 10-A, Roll 1):
Username: student.aarav@dps-society.edu
Password: Password@123

Parent:
Username: parent.aarav@gmail.com
Password: Password@123
```
