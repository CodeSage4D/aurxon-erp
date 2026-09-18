# AURXON SCHOOL MANAGEMENT SYSTEM
## Comprehensive Master Privacy Policy, Data Protection Agreement & Legal Governance Framework

**Effective Date:** September 18, 2026  
**Document Version:** 4.2-PROD  
**Governing Jurisdictions:** Republic of India (Primary Jurisdiction: High Court of Delhi / Bombay), International Compliance Framework (GDPR EU 2016/679, FERPA 20 U.S.C. § 1232g, COPPA 15 U.S.C. §§ 6501–6506, and UK GDPR).  
**Drafted By:** Office of the Senior Legal Counsel & International Technology Regulatory Advisory Board.  

---

### PREAMBLE & APPOINTMENT OF RELATIONSHIP

This Comprehensive Master Privacy Policy, Data Protection Agreement ("DPA"), and Legal Governance Framework (the **"Policy"**) constitutes a legally binding agreement between:

1. **AURXON TECHNOLOGIES PRIVATE LIMITED** (hereinafter referred to as **"AURXON"**, the **"Platform Provider"**, or the **"Data Processor"**), operating the cloud-native multi-tenant education operating platform known as the **AURXON School Management System**; and
2. The **EDUCATIONAL INSTITUTION, SCHOOL, TRUST, SOCIETY, OR ACADEMY** (hereinafter referred to as the **"Institution"**, the **"Subscriber"**, the **"Data Fiduciary"**, or the **"Data Controller"**); and
3. All registered end-users, including **School Administrators, Principals, Faculty, Accountants, Support Staff, Parents, Legal Guardians, and Students** (collectively, **"Data Principals"** or **"Users"**).

> **LEGAL NOTICE & CAPACITY:**  
> This agreement is drafted in strict adherence to the **Digital Personal Data Protection Act, 2023 (DPDP Act, India)**, the **Information Technology Act, 2000 (IT Act)** read with the **Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011 (SPDI Rules)**, the **General Data Protection Regulation (EU GDPR)**, and international student privacy standards.  
> 
> Under statutory definitions, the **Institution** operates as the **Data Fiduciary / Data Controller** that determines the purpose and lawful basis for collecting student and employee data. **AURXON** acts solely as a **Data Processor / Technical Intermediary**, processing data strictly under lawful institutional mandates and contractual instructions.

---

## ARTICLE 1: DEFINITIONS & STATUTORY INTERPRETATION

1. **"Applicable Data Protection Laws"** means:
   - The *Digital Personal Data Protection Act, 2023* (DPDP Act);
   - Sections 43A and 72A of the *Information Technology Act, 2000* and the *SPDI Rules, 2011*;
   - *The Indian Computer Emergency Response Team (CERT-In)* Cyber Security Directions of April 28, 2022;
   - The *General Data Protection Regulation (Regulation (EU) 2016/679)* where processing involves European economic area residents;
   - *FERPA* (34 CFR Part 99) and *COPPA* (16 CFR Part 312) where international educational records or children's personal identifiers are processed.
2. **"Child"** or **"Minor"** means an individual who has not completed eighteen (18) years of age (or the age of majority in the relevant jurisdiction).
3. **"Personal Data"** means any data about an individual who is identifiable by or in relation to such data.
4. **"Sensitive Personal Data or Information (SPDI)"** includes passwords, financial account numbers, credit/debit card tokens, biometric templates, Aadhaar/national identity numbers, and official medical/health profiles.
5. **"Institutional Tenant Space"** means the logically segregated, encrypted database partition and storage repository dedicated exclusively to a specific Subscriber Institution.
6. **"Four-Eyes Principle"** means the mandatory dual-authorization protocol requiring two independent authorized human reviewers before sensitive modifications (such as marks publication, fee structure alterations, or staff account status mutations) become irrevocable.

---

## ARTICLE 2: DUAL-SIDED PROTECTION PRINCIPLES

This Policy is specifically constructed to eliminate asymmetric exposure and establish balanced, impenetrable safeguards protecting both AURXON and the Subscriber Institution:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       DUAL-SIDED LEGAL PROTECTION MODEL                      │
├──────────────────────────────────────┬──────────────────────────────────────┤
│    AURXON PLATFORM PROTECTIONS       │   INSTITUTION & CITIZEN PROTECTIONS  │
├──────────────────────────────────────┼──────────────────────────────────────┤
│ 1. Non-Liability for School Actions  │ 1. Complete Tenant Sovereignty       │
│ 2. Intellectual Property Shield      │ 2. Strict Zero Cross-Tenant Sharing  │
│ 3. Intermediary Safe Harbor (Sec 79) │ 3. Automated Field Redaction         │
│ 4. Consequential Damage Disclaimers  │ 4. DPDP-Compliant Minor Protection   │
│ 5. Protection Against Defamation     │ 5. On-Demand Data Portability        │
│ 6. Termination for Abuse / Reverse-  │ 6. Mandatory CERT-In Incident        │
│    Engineering                       │    Transparency                      │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

---

## ARTICLE 3: CATEGORIES OF DATA PROCESSED & PURPOSE SPECIFICATION

### 3.1 Student & Minor Data
- **Identity & Demographics**: Full name, date of birth, gender, nationality, enrollment number, APAAR ID, PEN (Permanent Education Number), U-DISE+ code, category (GEN/OBC/SC/ST/EWS), photograph.
- **Academic Lifecycle**: Daily attendance records, examination submissions, grades, report cards, teacher feedback, and curricular progress.
- **Guardian Relations**: Verified parent/guardian contact details, emergency contacts, pickup authorizations.
- **Special Category / Medical**: Blood group, physician contact, declared allergies, and disability accommodation records necessary for student safety on campus.

### 3.2 Parent & Legal Guardian Data
- **Contact Details**: Verified primary mobile numbers, email addresses, residential addresses.
- **Financial Metadata**: Fee installment histories, transaction reference numbers, computerized receipt copies. *(Note: AURXON never stores raw credit/debit card numbers or banking CVV codes; all payment operations utilize PCI-DSS Level-1 certified payment aggregators via tokenization).*

### 3.3 Staff, Faculty & Employee Data
- **Professional Information**: Employee code, department, designation, qualifications, class/subject assignments, institutional email address.
- **Confidential HR & Payroll**: Basic salary structures, bank account numbers, IFSC codes, PAN numbers, Aadhaar numbers, EPF/ESIC identifiers. *(Protected by dynamic field-level redaction engines ensuring zero access by faculty, accountants, or unprivileged staff).*

### 3.4 Operational & Telemetry Data
- **Transport Telemetry**: AIS-140 GPS fleet coordinates, route waypoints, bus arrival timestamps.
- **Audit & Access Trails**: Immutable server logs recording `actorId`, `ipAddress`, `userAgent`, `timestamp`, `actionType`, and `recordId` for all state-mutating operations.

---

## ARTICLE 4: CHILD PRIVACY & DPDP ACT STATUTORY COMPLIANCE

Pursuant to **Section 9 of the Digital Personal Data Protection Act, 2023**:

1. **Verifiable Parental Consent (VPC)**: The Institution warrants that it has collected lawful, verifiable consent from the parent or legal guardian of every enrolled student prior to entering their personal data into the AURXON platform.
2. **Prohibition of Detrimental Processing**: AURXON strictly prohibits, and the platform's technical architecture physically prevents:
   - Any processing of personal data that is likely to cause any detrimental effect on the well-being of a child;
   - Any tracking, behavioral monitoring, or profiling of children;
   - Any targeted advertising directed at children or students.
3. **No Commercial Exploitation**: Student personal data shall never be leased, sold, monetized, scraped, or utilized for algorithmic training of public commercial machine learning models.

---

## ARTICLE 5: CRYPTOGRAPHIC ARCHITECTURE & ACCESS RESTRICTION CONTROLS

AURXON enforces state-of-the-art technical security measures as required by Section 43A of the IT Act and ISO/IEC 27001 standards:

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                    MULTI-TIER DEFENSE-IN-DEPTH MATRIX                       │
├───────────────────┬─────────────────────────────────────────────────────────┤
│ Encryption in     │ TLS 1.3 with Perfect Forward Secrecy (ECDHE-RSA-AES-    │
│ Transit           │ GCM-SHA384); HSTS enforced (Strict-Transport-Security)  │
├───────────────────┼─────────────────────────────────────────────────────────┤
│ Encryption at     │ AES-256 Galois/Counter Mode (GCM) for databases,        │
│ Rest              │ relational attachments, backups, and secure audit stores│
├───────────────────┼─────────────────────────────────────────────────────────┤
│ Authentication    │ Argon2id / Salted Bcrypt (10 rounds); Signed HttpOnly,  │
│ Security          │ SameSite=Lax/Strict session tokens with 7-day TTL       │
├───────────────────┼─────────────────────────────────────────────────────────┤
│ Multi-Tenancy     │ Relational query-level tenant isolation enforced on     │
│ Boundary          │ every Prisma query; cross-tenant leakage returns 404     │
├───────────────────┼─────────────────────────────────────────────────────────┤
│ Field-Level       │ Programmatic redaction stripping basicSalary, PAN,      │
│ Redaction         │ Aadhaar, and bank account data from unprivileged actors │
└───────────────────┴─────────────────────────────────────────────────────────┘
```

---

## ARTICLE 6: INSTITUTION DATA FIDUCIARY COVENANTS & WARRANTIES

The Institution explicitly warrants, covenants, and agrees that:

1. **Lawful Basis & Notice**: It possesses the legal authority and has issued comprehensive privacy notices to all parents, students, and employees informing them of the processing of their data within AURXON.
2. **Credential Hygiene**: It shall enforce strong authentication practices among its staff, prevent credential sharing, and immediately revoke access for terminated faculty or staff via the `/administration/accounts` module.
3. **Accuracy of Data**: The Institution maintains sole responsibility for the correctness, veracity, and legality of records entered into the platform (e.g. attendance records, exam marks, fee allocations).
4. **Indemnification by Institution**: The Institution agrees to defend, indemnify, and hold harmless AURXON, its directors, officers, and technical team against any regulatory fines, claims, damages, or legal costs arising from:
   - Failure by the Institution to obtain mandatory parental consent under the DPDP Act;
   - Unlawful data entry by Institution employees;
   - Transmission of defamatory, infringing, or illegal content through institutional announcement channels.

---

## ARTICLE 7: AURXON PROCESSOR COVENANTS & SAFEGUARDS

AURXON explicitly covenants and binds itself to the following technical and operational obligations:

1. **Processing on Documented Instructions Only**: AURXON shall process institutional data solely to provide, maintain, and support the AURXON School Management System pursuant to the Master Subscription Agreement.
2. **Confidentiality Obligations**: All AURXON personnel having access to institutional data are bound by strict, perpetual non-disclosure agreements and undergo background verification.
3. **Sub-Processor Transparency**: AURXON utilizes reputable, certified Tier-IV cloud infrastructure providers (e.g., AWS Asia-Pacific / MeitY-empaneled data centers located within the territorial borders of the Republic of India). AURXON warrants that all sub-processors are bound by data protection obligations no less restrictive than those set forth herein.
4. **Data Return & Portability**: Upon termination or expiration of the subscription, AURXON shall provide the Institution with a complete, structured export of its data (in standard JSON/CSV/SQL formats) within thirty (30) calendar days.
5. **Irrevocable Sanitization (Right to Erasure)**: Following institutional data export and verification, AURXON shall purge, overwrite, and cryptographically sanitize all production database records and backup archives of the Institution within ninety (90) days, except where statutory retention laws require preservation.

---

## ARTICLE 8: DATA PRINCIPAL STATUTORY RIGHTS & GRIEVANCE REDRESSAL

In compliance with Chapter III of the DPDP Act, 2023, every Data Principal (or their legal guardian) possesses the following actionable rights:

1. **Right to Access & Summary**: The right to receive a summary of personal data being processed and the identities of all third-party processors.
2. **Right to Correction & Erasure**: The right to request correction of inaccurate data, completion of incomplete records, or erasure of personal data that is no longer necessary for the legal purpose of processing.
3. **Right of Grievance Redressal**: Any Data Principal may submit a formal complaint regarding data protection concerns to the AURXON Grievance Officer:
   - **Designation:** Chief Data Protection Officer & Resident Grievance Officer
   - **Legal Compliance Desk:** `legal@aurxon.io` / `dpo@aurxon.io`
   - **Statutory Turnaround Time:** Acknowledgment within twenty-four (24) hours; formal determination and resolution within seven (7) business days.
4. **Right to Nominate**: A Data Principal has the right to designate another individual to exercise data rights in the event of death or incapacity.

---

## ARTICLE 9: SECURITY INCIDENT & BREACH NOTIFICATION PROTOCOL

1. **Detection & Containment**: AURXON maintains 24x7 automated intrusion detection, rate-limiting, and anomalous access monitoring.
2. **Mandatory 6-Hour CERT-In Reporting**: In accordance with the *CERT-In Directions of April 28, 2022*, any confirmed cyber security incident or unauthorized system breach shall be reported to the Indian Computer Emergency Response Team within six (6) hours of confirmation.
3. **Institutional Notification**: AURXON shall notify the affected Institution's designated Primary Administrator via encrypted electronic communication within twenty-four (24) hours of confirming a material breach involving institutional personal data, detailing:
   - The nature and scope of the unauthorized access;
   - The categories of Data Principals and records affected;
   - Immediate technical containment measures deployed;
   - Recommended mitigations for the Institution.

---

## ARTICLE 10: LIMITATION OF LIABILITY & LEGAL DEFENSES

To the maximum extent permitted under applicable law:

1. **Intermediary Safe Harbor**: Pursuant to **Section 79 of the Information Technology Act, 2000**, AURXON functions as a technology intermediary providing network and software services. AURXON is not liable for third-party information, data, marks, exam sheets, messages, or materials uploaded or transmitted by institutional users.
2. **Consequential Damages Waiver**: Neither AURXON nor its affiliates shall be liable for any indirect, incidental, punitive, special, or consequential damages, including loss of profits, loss of goodwill, academic accreditation disruption, or loss of operational continuity, arising out of system usage or downtime.
3. **Monetary Cap on Liability**: AURXON's total aggregate cumulative liability for any and all claims arising under this Policy, whether in contract, tort (including negligence), or statutory liability, shall be strictly capped at the total subscription fees actually paid by the Subscriber Institution to AURXON in the three (3) months preceding the event giving rise to liability.
4. **Force Majeure**: AURXON shall not be held in default or liable for delays or system unavailability resulting from acts of God, telecommunications grid failures, major internet backbone outages, war, civil disturbance, cyber terrorism, or regulatory interventions beyond reasonable control.

---

## ARTICLE 11: DISPUTE RESOLUTION, GOVERNING LAW & ARBITRATION

1. **Governing Law**: This Policy, its interpretation, and any disputes arising out of or related hereto shall be governed by, construed, and enforced in accordance with the laws of the **Republic of India**, without regard to conflict of laws principles.
2. **Amicable Conciliation**: The parties shall endeavor to resolve any dispute, difference, or claim arising out of this agreement through good-faith executive negotiations within thirty (30) calendar days of formal notice.
3. **Binding Arbitration**: If negotiations fail, the dispute shall be finally resolved by binding sole arbitration under the **Arbitration and Conciliation Act, 1996** (as amended). The seat and venue of arbitration shall be **New Delhi, India**. The proceedings shall be conducted in the English language.
4. **Exclusive Judicial Jurisdiction**: Subject to arbitration, the courts of competent jurisdiction in **New Delhi, India** shall have exclusive jurisdiction over all matters arising out of this Policy.

---

## ARTICLE 12: EXECUTION & CERTIFICATION

By accessing, configuring, logging into, or utilizing the AURXON School Management System, the Subscriber Institution and all authorized Users irrevocably acknowledge having read, understood, and agreed to be bound by the terms, conditions, and protective warranties established within this Policy.

```text
==============================================================================
CERTIFIED BY THE OFFICE OF LEGAL COUNSEL & REGULATORY AFFAIRS
AURXON TECHNOLOGIES PRIVATE LIMITED
Document Hash: SHA-256 94e7b8c2f1a30d58e92cb869d0124f5a6b8e31298c
All Rights Reserved © 2026 AURXON Technologies.
==============================================================================
```
