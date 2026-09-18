/**
 * AURXON School Management System
 * Production Runtime Comprehensive Verification & Evidence Engine
 *
 * Executes live against the running Next.js production server at http://localhost:3000
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000';

export interface VerificationEvidence {
  category: string;
  test: string;
  actor: string;
  method: string;
  endpoint: string;
  expectedStatus: number;
  actualStatus: number;
  expectedResult: 'ALLOW' | 'DENY';
  actualResult: 'ALLOW' | 'DENY';
  denialCodeOrReason?: string;
  passed: boolean;
  notes?: string;
}

const evidenceLog: VerificationEvidence[] = [];

function recordEvidence(ev: VerificationEvidence) {
  evidenceLog.push(ev);
  const statusIcon = ev.passed ? '✓ PASS' : '✗ FAIL';
  console.log(`[${statusIcon}] [${ev.category}] ${ev.actor} -> ${ev.method} ${ev.endpoint} (Expected: ${ev.expectedStatus} | Actual: ${ev.actualStatus})`);
  if (ev.denialCodeOrReason) {
    console.log(`         Reason/Code: ${ev.denialCodeOrReason}`);
  }
}

async function loginUser(email: string, password = 'Password@123'): Promise<{ cookie: string; user: any }> {
  const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error(`Login failed for ${email}: ${res.status} ${await res.text()}`);
  }

  const setCookie = res.headers.get('set-cookie') || '';
  const match = setCookie.match(/aurxon_session=([^;]+)/);
  const token = match ? match[1] : '';
  const data = await res.json();
  return { cookie: `aurxon_session=${token}`, user: data.user };
}

async function run() {
  console.log('================================================================');
  console.log('🚀 AURXON LIVE PRODUCTION VERIFICATION & EVIDENCE SUITE');
  console.log(`Target: ${BASE_URL}`);
  console.log('================================================================\n');

  // Load Reference IDs from Database
  const orgDPS = await prisma.organization.findFirst({ where: { code: 'DPS-ORG' } });
  if (!orgDPS) throw new Error('DPS-ORG not found in DB');
  const orgApex = await prisma.organization.findFirst({ where: { slug: 'apex-coaching' } });

  const studentAarav = await prisma.student.findFirst({ where: { email: 'student.aarav@dps-society.edu' } });
  const studentKabir = await prisma.student.findFirst({ where: { firstName: 'Kabir', lastName: 'Mehta' } });
  if (!studentAarav || !studentKabir) throw new Error('Required students not found');

  const staffTeacher = await prisma.staffProfile.findFirst({ where: { user: { email: 'teacher.math@dps-society.edu' } } });

  // --------------------------------------------------------------------------
  // ACTOR 1: PRINCIPAL
  // --------------------------------------------------------------------------
  console.log('\n--- 1. ACTOR: PRINCIPAL (Dr. Meenakshi Sundaram) ---');
  {
    const { cookie } = await loginUser('principal.rkp@dps-society.edu');

    // 1.1 Auth Me
    const meRes = await fetch(`${BASE_URL}/api/v1/auth/me`, { headers: { Cookie: cookie } });
    const meData = await meRes.json();
    recordEvidence({
      category: 'Principal Verification',
      test: 'Verify authenticated identity & permissions',
      actor: 'Principal',
      method: 'GET',
      endpoint: '/api/v1/auth/me',
      expectedStatus: 200,
      actualStatus: meRes.status,
      expectedResult: 'ALLOW',
      actualResult: meRes.status === 200 ? 'ALLOW' : 'DENY',
      passed: meRes.status === 200 && meData.user.role === 'PRINCIPAL',
    });

    // 1.2 Dashboard
    const dashRes = await fetch(`${BASE_URL}/api/v1/dashboard`, { headers: { Cookie: cookie } });
    recordEvidence({
      category: 'Principal Verification',
      test: 'Load executive dashboard metrics',
      actor: 'Principal',
      method: 'GET',
      endpoint: '/api/v1/dashboard',
      expectedStatus: 200,
      actualStatus: dashRes.status,
      expectedResult: 'ALLOW',
      actualResult: dashRes.status === 200 ? 'ALLOW' : 'DENY',
      passed: dashRes.status === 200,
    });

    // 1.3 Accounts List
    const accRes = await fetch(`${BASE_URL}/api/v1/accounts`, { headers: { Cookie: cookie } });
    recordEvidence({
      category: 'Principal Verification',
      test: 'Access institution accounts management',
      actor: 'Principal',
      method: 'GET',
      endpoint: '/api/v1/accounts',
      expectedStatus: 200,
      actualStatus: accRes.status,
      expectedResult: 'ALLOW',
      actualResult: accRes.status === 200 ? 'ALLOW' : 'DENY',
      passed: accRes.status === 200,
    });

    // 1.4 Students List
    const studRes = await fetch(`${BASE_URL}/api/v1/students`, { headers: { Cookie: cookie } });
    recordEvidence({
      category: 'Principal Verification',
      test: 'Access student directory',
      actor: 'Principal',
      method: 'GET',
      endpoint: '/api/v1/students',
      expectedStatus: 200,
      actualStatus: studRes.status,
      expectedResult: 'ALLOW',
      actualResult: studRes.status === 200 ? 'ALLOW' : 'DENY',
      passed: studRes.status === 200,
    });

    // 1.5 Staff List
    const staffRes = await fetch(`${BASE_URL}/api/v1/staff`, { headers: { Cookie: cookie } });
    recordEvidence({
      category: 'Principal Verification',
      test: 'Access faculty & staff profiles',
      actor: 'Principal',
      method: 'GET',
      endpoint: '/api/v1/staff',
      expectedStatus: 200,
      actualStatus: staffRes.status,
      expectedResult: 'ALLOW',
      actualResult: staffRes.status === 200 ? 'ALLOW' : 'DENY',
      passed: staffRes.status === 200,
    });

    // 1.6 Audit Logs
    const auditRes = await fetch(`${BASE_URL}/api/v1/audit`, { headers: { Cookie: cookie } });
    recordEvidence({
      category: 'Principal Verification',
      test: 'Access security audit trail',
      actor: 'Principal',
      method: 'GET',
      endpoint: '/api/v1/audit',
      expectedStatus: 200,
      actualStatus: auditRes.status,
      expectedResult: 'ALLOW',
      actualResult: auditRes.status === 200 ? 'ALLOW' : 'DENY',
      passed: auditRes.status === 200,
    });

    // Logout & Session Revocation
    const logoutRes = await fetch(`${BASE_URL}/api/v1/auth/logout`, { method: 'POST', headers: { Cookie: cookie } });
    recordEvidence({
      category: 'Session Lifecycle',
      test: 'Logout principal session',
      actor: 'Principal',
      method: 'POST',
      endpoint: '/api/v1/auth/logout',
      expectedStatus: 200,
      actualStatus: logoutRes.status,
      expectedResult: 'ALLOW',
      actualResult: 'ALLOW',
      passed: logoutRes.status === 200,
    });
  }

  // --------------------------------------------------------------------------
  // ACTOR 2: ADMINISTRATOR
  // --------------------------------------------------------------------------
  console.log('\n--- 2. ACTOR: ADMINISTRATOR (Rajesh Malhotra) ---');
  {
    const { cookie } = await loginUser('admin@dps-society.edu');

    // 2.1 Authorized: Account Creation
    const newEmail = `staff.test.${Date.now()}@dps-society.edu`;
    const createAccRes = await fetch(`${BASE_URL}/api/v1/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        firstName: 'Test',
        lastName: 'Faculty',
        email: newEmail,
        password: 'Password@123',
        role: 'TEACHER',
        actorType: 'TEACHER',
        scope: 'ASSIGNED_SECTIONS',
        status: 'ACTIVE',
      }),
    });
    recordEvidence({
      category: 'Administrator Verification',
      test: 'Create new teacher account transactionally',
      actor: 'Administrator',
      method: 'POST',
      endpoint: '/api/v1/accounts',
      expectedStatus: 201,
      actualStatus: createAccRes.status,
      expectedResult: 'ALLOW',
      actualResult: createAccRes.status === 201 ? 'ALLOW' : 'DENY',
      passed: createAccRes.status === 201,
    });

    // 2.2 Attack: Unauthorized Platform Operation (Platform Control Plane)
    const platRes = await fetch(`${BASE_URL}/api/v1/aurxon/control-plane`, { headers: { Cookie: cookie } });
    recordEvidence({
      category: 'Administrator Privilege Attack',
      test: 'Attempt access to SaaS control plane (Vertical Escalation)',
      actor: 'Administrator',
      method: 'GET',
      endpoint: '/api/v1/aurxon/control-plane',
      expectedStatus: 403,
      actualStatus: platRes.status,
      expectedResult: 'DENY',
      actualResult: platRes.status === 403 ? 'DENY' : 'ALLOW',
      denialCodeOrReason: 'SUPER_ADMIN privilege required',
      passed: platRes.status === 403,
    });
  }

  // --------------------------------------------------------------------------
  // ACTOR 3: TEACHER (Amit Kulkarni - Math Teacher assigned to Section 10-A)
  // --------------------------------------------------------------------------
  console.log('\n--- 3. ACTOR: TEACHER (Amit Kulkarni) ---');
  {
    const { cookie } = await loginUser('teacher.math@dps-society.edu');

    // 3.1 Authorized: Access assigned student in Section 10-A (Aarav Sharma)
    const assignedStudRes = await fetch(`${BASE_URL}/api/v1/students/${studentAarav.id}`, { headers: { Cookie: cookie } });
    recordEvidence({
      category: 'Teacher Verification',
      test: 'Access assigned student (Aarav Sharma in Section 10-A)',
      actor: 'Teacher',
      method: 'GET',
      endpoint: `/api/v1/students/${studentAarav.id}`,
      expectedStatus: 200,
      actualStatus: assignedStudRes.status,
      expectedResult: 'ALLOW',
      actualResult: assignedStudRes.status === 200 ? 'ALLOW' : 'DENY',
      passed: assignedStudRes.status === 200,
    });

    // 3.2 Attack: Horizontal Escalation -> Access unassigned student (Kabir Mehta in Section 10-B)
    const unassignedStudRes = await fetch(`${BASE_URL}/api/v1/students/${studentKabir.id}`, { headers: { Cookie: cookie } });
    recordEvidence({
      category: 'Teacher Horizontal Attack',
      test: 'Attempt access to unassigned student (Kabir Mehta in Section 10-B)',
      actor: 'Teacher',
      method: 'GET',
      endpoint: `/api/v1/students/${studentKabir.id}`,
      expectedStatus: 403,
      actualStatus: unassignedStudRes.status,
      expectedResult: 'DENY',
      actualResult: unassignedStudRes.status === 403 ? 'DENY' : 'ALLOW',
      denialCodeOrReason: 'OUT_OF_SCOPE (Teacher not assigned to student section)',
      passed: unassignedStudRes.status === 403,
    });

    // 3.3 Attack: Vertical Escalation -> Access Accounts Management
    const accAttackRes = await fetch(`${BASE_URL}/api/v1/accounts`, { headers: { Cookie: cookie } });
    recordEvidence({
      category: 'Teacher Vertical Attack',
      test: 'Attempt access to account administration',
      actor: 'Teacher',
      method: 'GET',
      endpoint: '/api/v1/accounts',
      expectedStatus: 403,
      actualStatus: accAttackRes.status,
      expectedResult: 'DENY',
      actualResult: accAttackRes.status === 403 ? 'DENY' : 'ALLOW',
      denialCodeOrReason: 'INSUFFICIENT_ROLE_PERMISSIONS',
      passed: accAttackRes.status === 403,
    });
  }

  // --------------------------------------------------------------------------
  // ACTOR 4: ACCOUNTANT (Ramesh Bansal)
  // --------------------------------------------------------------------------
  console.log('\n--- 4. ACTOR: ACCOUNTANT (Ramesh Bansal) ---');
  {
    const { cookie } = await loginUser('accountant@dps-society.edu');

    // 4.1 Authorized: Access Fees & Collections
    const feesRes = await fetch(`${BASE_URL}/api/v1/fees`, { headers: { Cookie: cookie } });
    recordEvidence({
      category: 'Accountant Verification',
      test: 'Access fee allocations and collection structures',
      actor: 'Accountant',
      method: 'GET',
      endpoint: '/api/v1/fees',
      expectedStatus: 200,
      actualStatus: feesRes.status,
      expectedResult: 'ALLOW',
      actualResult: feesRes.status === 200 ? 'ALLOW' : 'DENY',
      passed: feesRes.status === 200,
    });

    // 4.2 Data Sensitivity: Staff endpoint must redact confidential salary and bank fields
    if (staffTeacher) {
      const staffDetailRes = await fetch(`${BASE_URL}/api/v1/staff/${staffTeacher.id}`, { headers: { Cookie: cookie } });
      const staffJson = await staffDetailRes.json();
      const hasSalary = staffJson.staff && ('basicSalary' in staffJson.staff);
      const hasBank = staffJson.staff && ('bankAccountNumber' in staffJson.staff);
      recordEvidence({
        category: 'Accountant Data Sensitivity',
        test: 'Verify basicSalary & bankAccountNumber are absent from staff API response',
        actor: 'Accountant',
        method: 'GET',
        endpoint: `/api/v1/staff/${staffTeacher.id}`,
        expectedStatus: 200,
        actualStatus: staffDetailRes.status,
        expectedResult: 'ALLOW',
        actualResult: 'ALLOW',
        passed: staffDetailRes.status === 200 && !hasSalary && !hasBank,
        notes: `basicSalary present: ${hasSalary} | bankAccountNumber present: ${hasBank}`,
      });
    }
  }

  // --------------------------------------------------------------------------
  // ACTOR 5: HR MANAGER (Vikram Malhotra)
  // --------------------------------------------------------------------------
  console.log('\n--- 5. ACTOR: HR MANAGER (Vikram Malhotra) ---');
  {
    const { cookie } = await loginUser('hr@dps-society.edu');

    // 5.1 Authorized: View Staff Details with unredacted sensitive fields
    if (staffTeacher) {
      const hrStaffRes = await fetch(`${BASE_URL}/api/v1/staff/${staffTeacher.id}`, { headers: { Cookie: cookie } });
      const hrStaffJson = await hrStaffRes.json();
      const hasSalary = hrStaffJson.staff && ('basicSalary' in hrStaffJson.staff);
      recordEvidence({
        category: 'HR Manager Verification',
        test: 'Access confidential staff profile including HR salary data',
        actor: 'HR Manager',
        method: 'GET',
        endpoint: `/api/v1/staff/${staffTeacher.id}`,
        expectedStatus: 200,
        actualStatus: hrStaffRes.status,
        expectedResult: 'ALLOW',
        actualResult: hrStaffRes.status === 200 ? 'ALLOW' : 'DENY',
        passed: hrStaffRes.status === 200 && hasSalary,
        notes: `basicSalary present for HR Manager: ${hasSalary}`,
      });
    }

    // 5.2 Attack: Fee Manipulation
    const feeCollectAttack = await fetch(`${BASE_URL}/api/v1/fees/collect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ allocationId: 'alloc-1', amount: 1000 }),
    });
    recordEvidence({
      category: 'HR Manager Attack',
      test: 'Attempt fee collection manipulation (Role Separation)',
      actor: 'HR Manager',
      method: 'POST',
      endpoint: '/api/v1/fees/collect',
      expectedStatus: 403,
      actualStatus: feeCollectAttack.status,
      expectedResult: 'DENY',
      actualResult: feeCollectAttack.status === 403 ? 'DENY' : 'ALLOW',
      denialCodeOrReason: 'INSUFFICIENT_ROLE_PERMISSIONS',
      passed: feeCollectAttack.status === 403,
    });
  }

  // --------------------------------------------------------------------------
  // ACTOR 6: RECEPTIONIST / FRONT OFFICE (Sunita Rao)
  // --------------------------------------------------------------------------
  console.log('\n--- 6. ACTOR: RECEPTIONIST (Sunita Rao) ---');
  {
    const { cookie } = await loginUser('receptionist@dps-society.edu');

    // 6.1 Authorized: Basic student lookup
    const recStudRes = await fetch(`${BASE_URL}/api/v1/students`, { headers: { Cookie: cookie } });
    recordEvidence({
      category: 'Receptionist Verification',
      test: 'Access basic student directory for front office lookup',
      actor: 'Receptionist',
      method: 'GET',
      endpoint: '/api/v1/students',
      expectedStatus: 200,
      actualStatus: recStudRes.status,
      expectedResult: 'ALLOW',
      actualResult: recStudRes.status === 200 ? 'ALLOW' : 'DENY',
      passed: recStudRes.status === 200,
    });

    // 6.2 Attack: Accounts management
    const recAccAttack = await fetch(`${BASE_URL}/api/v1/accounts`, { headers: { Cookie: cookie } });
    recordEvidence({
      category: 'Receptionist Attack',
      test: 'Attempt access to account administration',
      actor: 'Receptionist',
      method: 'GET',
      endpoint: '/api/v1/accounts',
      expectedStatus: 403,
      actualStatus: recAccAttack.status,
      expectedResult: 'DENY',
      actualResult: recAccAttack.status === 403 ? 'DENY' : 'ALLOW',
      denialCodeOrReason: 'INSUFFICIENT_ROLE_PERMISSIONS',
      passed: recAccAttack.status === 403,
    });

    // 6.3 Data Sensitivity: Student endpoint must redact fee details for Receptionist
    const recStudentDetail = await fetch(`${BASE_URL}/api/v1/students/${studentAarav.id}`, { headers: { Cookie: cookie } });
    const recStudentJson = await recStudentDetail.json();
    const hasFees = recStudentJson.student && ('feeAllocations' in recStudentJson.student);
    const hasPayments = recStudentJson.student && ('feePayments' in recStudentJson.student);
    recordEvidence({
      category: 'Receptionist Data Sensitivity',
      test: 'Verify feeAllocations and feePayments are absent from student API response',
      actor: 'Receptionist',
      method: 'GET',
      endpoint: `/api/v1/students/${studentAarav.id}`,
      expectedStatus: 200,
      actualStatus: recStudentDetail.status,
      expectedResult: 'ALLOW',
      actualResult: 'ALLOW',
      passed: recStudentDetail.status === 200 && !hasFees && !hasPayments,
      notes: `feeAllocations present: ${hasFees} | feePayments present: ${hasPayments}`,
    });
  }

  // --------------------------------------------------------------------------
  // ACTOR 7: PARENT (Sanjay Sharma - Parent of Aarav Sharma)
  // --------------------------------------------------------------------------
  console.log('\n--- 7. ACTOR: PARENT (Sanjay Sharma) ---');
  {
    const { cookie } = await loginUser('parent.aarav@gmail.com');

    // 7.1 Authorized: Access own verified child (Aarav Sharma)
    const childRes = await fetch(`${BASE_URL}/api/v1/students/${studentAarav.id}`, { headers: { Cookie: cookie } });
    recordEvidence({
      category: 'Parent Verification',
      test: 'Access own verified child (Aarav Sharma)',
      actor: 'Parent',
      method: 'GET',
      endpoint: `/api/v1/students/${studentAarav.id}`,
      expectedStatus: 200,
      actualStatus: childRes.status,
      expectedResult: 'ALLOW',
      actualResult: childRes.status === 200 ? 'ALLOW' : 'DENY',
      passed: childRes.status === 200,
    });

    // 7.2 Attack: Horizontal Escalation -> Access unverified child (Kabir Mehta)
    const unverifiedChildRes = await fetch(`${BASE_URL}/api/v1/students/${studentKabir.id}`, { headers: { Cookie: cookie } });
    recordEvidence({
      category: 'Parent Horizontal Attack',
      test: 'Attempt access to another parent child (Kabir Mehta)',
      actor: 'Parent',
      method: 'GET',
      endpoint: `/api/v1/students/${studentKabir.id}`,
      expectedStatus: 403,
      actualStatus: unverifiedChildRes.status,
      expectedResult: 'DENY',
      actualResult: unverifiedChildRes.status === 403 ? 'DENY' : 'ALLOW',
      denialCodeOrReason: 'UNVERIFIED_CHILD_RELATION',
      passed: unverifiedChildRes.status === 403,
    });

    // 7.3 Attack: Staff HR Data
    if (staffTeacher) {
      const staffAttack = await fetch(`${BASE_URL}/api/v1/staff/${staffTeacher.id}`, { headers: { Cookie: cookie } });
      recordEvidence({
        category: 'Parent Vertical Attack',
        test: 'Attempt access to faculty/staff confidential HR',
        actor: 'Parent',
        method: 'GET',
        endpoint: `/api/v1/staff/${staffTeacher.id}`,
        expectedStatus: 403,
        actualStatus: staffAttack.status,
        expectedResult: 'DENY',
        actualResult: staffAttack.status === 403 ? 'DENY' : 'ALLOW',
        passed: staffAttack.status === 403,
      });
    }
  }

  // --------------------------------------------------------------------------
  // ACTOR 8: STUDENT (Aarav Sharma)
  // --------------------------------------------------------------------------
  console.log('\n--- 8. ACTOR: STUDENT (Aarav Sharma) ---');
  {
    const { cookie } = await loginUser('student.aarav@dps-society.edu');

    // 8.1 Authorized: Access own profile
    const selfRes = await fetch(`${BASE_URL}/api/v1/students/${studentAarav.id}`, { headers: { Cookie: cookie } });
    recordEvidence({
      category: 'Student Verification',
      test: 'Access own student profile',
      actor: 'Student',
      method: 'GET',
      endpoint: `/api/v1/students/${studentAarav.id}`,
      expectedStatus: 200,
      actualStatus: selfRes.status,
      expectedResult: 'ALLOW',
      actualResult: selfRes.status === 200 ? 'ALLOW' : 'DENY',
      passed: selfRes.status === 200,
    });

    // 8.2 Attack: Access peer student profile (Kabir Mehta)
    const peerRes = await fetch(`${BASE_URL}/api/v1/students/${studentKabir.id}`, { headers: { Cookie: cookie } });
    recordEvidence({
      category: 'Student Horizontal Attack',
      test: 'Attempt access to peer student profile (Kabir Mehta)',
      actor: 'Student',
      method: 'GET',
      endpoint: `/api/v1/students/${studentKabir.id}`,
      expectedStatus: 403,
      actualStatus: peerRes.status,
      expectedResult: 'DENY',
      actualResult: peerRes.status === 403 ? 'DENY' : 'ALLOW',
      denialCodeOrReason: 'OUT_OF_SCOPE',
      passed: peerRes.status === 403,
    });
  }

  // --------------------------------------------------------------------------
  // 9. PERMISSION ESCALATION & DELEGATION PREVENTION TESTS
  // --------------------------------------------------------------------------
  console.log('\n--- 9. PERMISSION ESCALATION PREVENTION TESTS ---');
  {
    // 9.1 Self-elevation: User cannot modify their own role
    const { cookie: teacherCookie, user: teacherUser } = await loginUser('teacher.math@dps-society.edu');
    const selfElevateRes = await fetch(`${BASE_URL}/api/v1/accounts/${teacherUser.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: teacherCookie },
      body: JSON.stringify({ role: 'SUPER_ADMIN' }),
    });
    recordEvidence({
      category: 'Privilege Escalation Prevention',
      test: 'User cannot elevate own role to SUPER_ADMIN',
      actor: 'Teacher',
      method: 'PATCH',
      endpoint: `/api/v1/accounts/${teacherUser.id}`,
      expectedStatus: 403,
      actualStatus: selfElevateRes.status,
      expectedResult: 'DENY',
      actualResult: selfElevateRes.status === 403 ? 'DENY' : 'ALLOW',
      denialCodeOrReason: 'Forbidden: Users cannot change their own system role',
      passed: selfElevateRes.status === 403,
    });

    // 9.2 Delegation limit: Principal cannot delegate SUPER_ADMIN
    const { cookie: principalCookie } = await loginUser('principal.rkp@dps-society.edu');
    const delegateSuperRes = await fetch(`${BASE_URL}/api/v1/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: principalCookie },
      body: JSON.stringify({
        firstName: 'Malicious',
        lastName: 'Admin',
        email: `malicious.${Date.now()}@aurxon.io`,
        password: 'Password@123',
        role: 'SUPER_ADMIN',
        actorType: 'PLATFORM_SUPER_ADMIN',
        scope: 'PLATFORM',
        status: 'ACTIVE',
      }),
    });
    recordEvidence({
      category: 'Privilege Escalation Prevention',
      test: 'Principal cannot delegate Platform Super Admin role',
      actor: 'Principal',
      method: 'POST',
      endpoint: '/api/v1/accounts',
      expectedStatus: 403,
      actualStatus: delegateSuperRes.status,
      expectedResult: 'DENY',
      actualResult: delegateSuperRes.status === 403 ? 'DENY' : 'ALLOW',
      denialCodeOrReason: 'Cannot create a Platform Super Admin account',
      passed: delegateSuperRes.status === 403,
    });
  }

  // --------------------------------------------------------------------------
  // 10. SESSION LIFECYCLE & ACCOUNT STATUS TESTS
  // --------------------------------------------------------------------------
  console.log('\n--- 10. SESSION LIFECYCLE & STATUS TESTS ---');
  {
    // 10.1 Account Suspension Fail-Closed
    // Create a temporary test user and suspend them
    const testEmail = `suspended.test.${Date.now()}@dps-society.edu`;
    const tempUser = await prisma.user.create({
      data: {
        organizationId: orgDPS.id,
        email: testEmail,
        passwordHash: await bcrypt.hash('Password@123', 10),
        firstName: 'Suspended',
        lastName: 'Subject',
        role: 'TEACHER',
        status: 'ACTIVE',
      },
    });

    const { cookie: activeCookie } = await loginUser(testEmail);

    // Verify access while ACTIVE
    const preSuspendRes = await fetch(`${BASE_URL}/api/v1/auth/me`, { headers: { Cookie: activeCookie } });
    const preOk = preSuspendRes.status === 200;

    // Suspend user in DB
    await prisma.user.update({ where: { id: tempUser.id }, data: { status: 'SUSPENDED' } });

    // Existing session must now immediately fail closed
    const postSuspendRes = await fetch(`${BASE_URL}/api/v1/auth/me`, { headers: { Cookie: activeCookie } });
    recordEvidence({
      category: 'Session Lifecycle',
      test: 'Suspended account fails closed immediately on existing session cookie',
      actor: 'Suspended User',
      method: 'GET',
      endpoint: '/api/v1/auth/me',
      expectedStatus: 401,
      actualStatus: postSuspendRes.status,
      expectedResult: 'DENY',
      actualResult: postSuspendRes.status === 401 ? 'DENY' : 'ALLOW',
      denialCodeOrReason: 'User session invalid or suspended',
      passed: preOk && postSuspendRes.status === 401,
    });

    // Cleanup
    await prisma.user.delete({ where: { id: tempUser.id } });

    // 10.2 Logout Session Invalidation & Reuse Prevention
    const testLogoutEmail = `logout.test.${Date.now()}@dps-society.edu`;
    const tempLogoutUser = await prisma.user.create({
      data: {
        organizationId: orgDPS.id,
        email: testLogoutEmail,
        passwordHash: await bcrypt.hash('Password@123', 10),
        firstName: 'Logout',
        lastName: 'Subject',
        role: 'TEACHER',
        status: 'ACTIVE',
      },
    });

    const { cookie: logoutCookie } = await loginUser(testLogoutEmail);
    const logoutRes = await fetch(`${BASE_URL}/api/v1/auth/logout`, {
      method: 'POST',
      headers: { Cookie: logoutCookie },
    });
    const reuseOldSessionRes = await fetch(`${BASE_URL}/api/v1/auth/me`, {
      headers: { Cookie: logoutCookie },
    });
    recordEvidence({
      category: 'Session Lifecycle',
      test: 'Reuse of old session token after logout is denied immediately',
      actor: 'Logged Out User',
      method: 'GET',
      endpoint: '/api/v1/auth/me',
      expectedStatus: 401,
      actualStatus: reuseOldSessionRes.status,
      expectedResult: 'DENY',
      actualResult: reuseOldSessionRes.status === 401 ? 'DENY' : 'ALLOW',
      denialCodeOrReason: 'Token revoked or session cleared',
      passed: logoutRes.status === 200 && reuseOldSessionRes.status === 401,
    });
    await prisma.user.delete({ where: { id: tempLogoutUser.id } });

    // 10.3 Dynamic Role Recalculation on Existing Session
    const testRoleEmail = `role.test.${Date.now()}@dps-society.edu`;
    const tempRoleUser = await prisma.user.create({
      data: {
        organizationId: orgDPS.id,
        email: testRoleEmail,
        passwordHash: await bcrypt.hash('Password@123', 10),
        firstName: 'Dynamic',
        lastName: 'Role',
        role: 'TEACHER',
        status: 'ACTIVE',
      },
    });

    const { cookie: dynamicCookie } = await loginUser(testRoleEmail);
    const initialRes = await fetch(`${BASE_URL}/api/v1/accounts`, { headers: { Cookie: dynamicCookie } });
    const initialDenied = initialRes.status === 403;

    await prisma.user.update({
      where: { id: tempRoleUser.id },
      data: { role: 'ORG_ADMIN', actorType: 'LEADERSHIP' },
    });

    const updatedRes = await fetch(`${BASE_URL}/api/v1/accounts`, { headers: { Cookie: dynamicCookie } });
    const updatedAllowed = updatedRes.status === 200;

    recordEvidence({
      category: 'Session Lifecycle',
      test: 'Role change in database dynamically recalculates permissions on existing session',
      actor: 'Dynamic Role User',
      method: 'GET',
      endpoint: '/api/v1/accounts',
      expectedStatus: 200,
      actualStatus: updatedRes.status,
      expectedResult: 'ALLOW',
      actualResult: updatedAllowed ? 'ALLOW' : 'DENY',
      passed: initialDenied && updatedAllowed,
      notes: `Initial (TEACHER): ${initialRes.status} | Post-Update (ORG_ADMIN): ${updatedRes.status}`,
    });
    await prisma.user.delete({ where: { id: tempRoleUser.id } });
  }

  // --------------------------------------------------------------------------
  // 11. CROSS-TENANT ISOLATION
  // --------------------------------------------------------------------------
  console.log('\n--- 11. CROSS-TENANT ISOLATION TESTS ---');
  {
    if (orgApex) {
      const { cookie: apexAdminCookie } = await loginUser('admin@apex-coaching.edu');

      // Attempt to access DPS Society Student (studentAarav)
      const crossTenantRes = await fetch(`${BASE_URL}/api/v1/students/${studentAarav.id}`, {
        headers: { Cookie: apexAdminCookie },
      });
      recordEvidence({
        category: 'Cross-Tenant Isolation',
        test: 'Apex Coaching Admin attempts access to DPS Society student record',
        actor: 'Tenant B Admin',
        method: 'GET',
        endpoint: `/api/v1/students/${studentAarav.id}`,
        expectedStatus: 404,
        actualStatus: crossTenantRes.status,
        expectedResult: 'DENY',
        actualResult: crossTenantRes.status >= 400 ? 'DENY' : 'ALLOW',
        denialCodeOrReason: 'Student record not found / Tenant Mismatch',
        passed: crossTenantRes.status === 404 || crossTenantRes.status === 403,
      });
    }
  }

  // --------------------------------------------------------------------------
  // 12. RELATIONSHIP REVOCATION TESTS
  // --------------------------------------------------------------------------
  console.log('\n--- 12. RELATIONSHIP REVOCATION TESTS ---');
  {
    // 12.1 Parent-Child Revocation
    const { cookie: parentCookie } = await loginUser('parent.aarav@gmail.com');
    const parentGuardian = await prisma.parentGuardian.findFirst({
      where: { user: { email: 'parent.aarav@gmail.com' } },
    });
    const spRel = await prisma.studentParent.findFirst({
      where: { parentId: parentGuardian!.id, studentId: studentAarav.id },
    });

    if (spRel) {
      await prisma.studentParent.delete({ where: { id: spRel.id } });
      const revokedChildRes = await fetch(`${BASE_URL}/api/v1/students/${studentAarav.id}`, {
        headers: { Cookie: parentCookie },
      });

      await prisma.studentParent.create({
        data: {
          id: spRel.id,
          studentId: spRel.studentId,
          parentId: spRel.parentId,
          isEmergencyContact: spRel.isEmergencyContact,
        },
      });
      const restoredChildRes = await fetch(`${BASE_URL}/api/v1/students/${studentAarav.id}`, {
        headers: { Cookie: parentCookie },
      });

      recordEvidence({
        category: 'Relationship Revocation',
        test: 'Parent child link revocation immediately denies access (403), re-linking restores access (200)',
        actor: 'Parent',
        method: 'GET',
        endpoint: `/api/v1/students/${studentAarav.id}`,
        expectedStatus: 403,
        actualStatus: revokedChildRes.status,
        expectedResult: 'DENY',
        actualResult: revokedChildRes.status === 403 ? 'DENY' : 'ALLOW',
        denialCodeOrReason: 'UNVERIFIED_CHILD_RELATION',
        passed: revokedChildRes.status === 403 && restoredChildRes.status === 200,
        notes: `Revoked status: ${revokedChildRes.status} | Restored status: ${restoredChildRes.status}`,
      });
    }

    // 12.2 Teacher Section Assignment Revocation
    const { cookie: teacherCookie } = await loginUser('teacher.math@dps-society.edu');
    const teacherUser = await prisma.user.findFirst({
      where: { email: 'teacher.math@dps-society.edu' },
    });
    const subjectAssignment = await prisma.subjectAssignment.findFirst({
      where: { teacherId: teacherUser!.id, sectionId: studentAarav.sectionId! },
    });

    if (subjectAssignment) {
      await prisma.subjectAssignment.delete({ where: { id: subjectAssignment.id } });
      const revokedTeacherRes = await fetch(`${BASE_URL}/api/v1/students/${studentAarav.id}`, {
        headers: { Cookie: teacherCookie },
      });

      await prisma.subjectAssignment.create({
        data: {
          id: subjectAssignment.id,
          organizationId: subjectAssignment.organizationId,
          institutionId: subjectAssignment.institutionId,
          teacherId: subjectAssignment.teacherId,
          subjectId: subjectAssignment.subjectId,
          sectionId: subjectAssignment.sectionId,
          academicSessionId: subjectAssignment.academicSessionId,
        },
      });
      const restoredTeacherRes = await fetch(`${BASE_URL}/api/v1/students/${studentAarav.id}`, {
        headers: { Cookie: teacherCookie },
      });

      recordEvidence({
        category: 'Relationship Revocation',
        test: 'Teacher section removal immediately denies student access (403), re-assignment restores access (200)',
        actor: 'Teacher',
        method: 'GET',
        endpoint: `/api/v1/students/${studentAarav.id}`,
        expectedStatus: 403,
        actualStatus: revokedTeacherRes.status,
        expectedResult: 'DENY',
        actualResult: revokedTeacherRes.status === 403 ? 'DENY' : 'ALLOW',
        denialCodeOrReason: 'OUT_OF_SCOPE',
        passed: revokedTeacherRes.status === 403 && restoredTeacherRes.status === 200,
        notes: `Revoked status: ${revokedTeacherRes.status} | Restored status: ${restoredTeacherRes.status}`,
      });
    }

    // 12.3 Student Profile Link Revocation
    const { cookie: studentCookie } = await loginUser('student.aarav@dps-society.edu');
    const studentUser = await prisma.user.findFirst({
      where: { email: 'student.aarav@dps-society.edu' },
    });

    await prisma.student.update({
      where: { id: studentAarav.id },
      data: { userId: null },
    });
    const revokedStudentRes = await fetch(`${BASE_URL}/api/v1/students/${studentAarav.id}`, {
      headers: { Cookie: studentCookie },
    });

    await prisma.student.update({
      where: { id: studentAarav.id },
      data: { userId: studentUser!.id },
    });
    const restoredStudentRes = await fetch(`${BASE_URL}/api/v1/students/${studentAarav.id}`, {
      headers: { Cookie: studentCookie },
    });

    recordEvidence({
      category: 'Relationship Revocation',
      test: 'Student account profile unlinking immediately denies access (403), restoring link restores access (200)',
      actor: 'Student',
      method: 'GET',
      endpoint: `/api/v1/students/${studentAarav.id}`,
      expectedStatus: 403,
      actualStatus: revokedStudentRes.status,
      expectedResult: 'DENY',
      actualResult: revokedStudentRes.status === 403 ? 'DENY' : 'ALLOW',
      denialCodeOrReason: 'OUT_OF_SCOPE',
      passed: revokedStudentRes.status === 403 && restoredStudentRes.status === 200,
      notes: `Revoked status: ${revokedStudentRes.status} | Restored status: ${restoredStudentRes.status}`,
    });
  }

  // --------------------------------------------------------------------------
  // 13. FINANCIAL INTEGRITY & TRANSACTION ATOMICITY
  // --------------------------------------------------------------------------
  console.log('\n--- 13. FINANCIAL INTEGRITY & TRANSACTION ATOMICITY ---');
  {
    const { cookie: accountantCookie } = await loginUser('accountant@dps-society.edu');
    const alloc = await prisma.studentFeeAllocation.findFirst({
      where: { studentId: studentAarav.id, balanceAmount: { gt: 0 } },
    });

    if (alloc) {
      const initialPaid = alloc.paidAmount;
      const initialBalance = alloc.balanceAmount;
      const collectAmount = 100;

      const paymentRes = await fetch(`${BASE_URL}/api/v1/fees/collect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: accountantCookie },
        body: JSON.stringify({
          allocationId: alloc.id,
          amount: collectAmount,
          paymentMethod: 'UPI',
          transactionRef: `UPI-TEST-${Date.now()}`,
          remarks: 'Automated verification test payment',
        }),
      });

      const paymentJson = await paymentRes.json();
      const updatedAlloc = await prisma.studentFeeAllocation.findUnique({ where: { id: alloc.id } });
      const ledgerEntry = await prisma.financialTransaction.findFirst({
        where: { referenceNo: paymentJson.payment?.receiptNumber },
      });

      recordEvidence({
        category: 'Financial Integrity',
        test: 'Fee collection maintains atomic transaction: Payment + Allocation Update + Mirror Ledger',
        actor: 'Accountant',
        method: 'POST',
        endpoint: '/api/v1/fees/collect',
        expectedStatus: 200,
        actualStatus: paymentRes.status,
        expectedResult: 'ALLOW',
        actualResult: paymentRes.status === 200 ? 'ALLOW' : 'DENY',
        passed:
          paymentRes.status === 200 &&
          updatedAlloc?.paidAmount === initialPaid + collectAmount &&
          updatedAlloc?.balanceAmount === initialBalance - collectAmount &&
          Boolean(ledgerEntry),
        notes: `Receipt: ${paymentJson.payment?.receiptNumber} | Ledger Synced: ${Boolean(ledgerEntry)}`,
      });
    }
  }

  // --------------------------------------------------------------------------
  // 14. DATABASE OWNERSHIP & CLIENT INPUT SANITIZATION
  // --------------------------------------------------------------------------
  console.log('\n--- 14. DATABASE OWNERSHIP & CLIENT INPUT SANITIZATION ---');
  {
    const { cookie: adminCookie } = await loginUser('admin@dps-society.edu');
    const fakeOrgId = 'foreign-attacker-org-999';

    const injectRes = await fetch(`${BASE_URL}/api/v1/accounts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: adminCookie },
      body: JSON.stringify({
        firstName: 'Foreign',
        lastName: 'Inject',
        email: `inject.${Date.now()}@dps-society.edu`,
        password: 'Password@123',
        role: 'TEACHER',
        actorType: 'TEACHER',
        organizationId: fakeOrgId,
      }),
    });

    const injectJson = await injectRes.json();
    const createdInDb = await prisma.user.findFirst({
      where: { email: injectJson.user?.email },
    });

    recordEvidence({
      category: 'Database Ownership',
      test: 'Client-supplied foreign organizationId is untrusted and overridden with authenticated session tenant',
      actor: 'Administrator',
      method: 'POST',
      endpoint: '/api/v1/accounts',
      expectedStatus: 201,
      actualStatus: injectRes.status,
      expectedResult: 'ALLOW',
      actualResult: injectRes.status === 201 ? 'ALLOW' : 'DENY',
      passed: injectRes.status === 201 && createdInDb?.organizationId === orgDPS.id,
      notes: `Submitted Org: ${fakeOrgId} | Persisted Org: ${createdInDb?.organizationId}`,
    });

    if (createdInDb) {
      await prisma.user.delete({ where: { id: createdInDb.id } });
    }
  }

  // --------------------------------------------------------------------------
  // 15. PERFORMANCE SANITY & PAGINATION TESTS
  // --------------------------------------------------------------------------
  console.log('\n--- 15. PERFORMANCE SANITY & PAGINATION TESTS ---');
  {
    const { cookie: adminCookie } = await loginUser('admin@dps-society.edu');

    const tStart = Date.now();
    const accListRes = await fetch(`${BASE_URL}/api/v1/accounts?limit=10&page=1`, {
      headers: { Cookie: adminCookie },
    });
    const accLatency = Date.now() - tStart;
    const accJson = await accListRes.json();

    const tStart2 = Date.now();
    const studListRes = await fetch(`${BASE_URL}/api/v1/students?limit=10&page=1`, {
      headers: { Cookie: adminCookie },
    });
    const studLatency = Date.now() - tStart2;
    const studJson = await studListRes.json();

    recordEvidence({
      category: 'Performance Sanity',
      test: 'Account list pagination latency is under 500ms with structured pagination envelope',
      actor: 'Administrator',
      method: 'GET',
      endpoint: '/api/v1/accounts?limit=10&page=1',
      expectedStatus: 200,
      actualStatus: accListRes.status,
      expectedResult: 'ALLOW',
      actualResult: 'ALLOW',
      passed: accListRes.status === 200 && accLatency < 500 && Array.isArray(accJson.data || accJson.accounts),
      notes: `Latency: ${accLatency}ms | Total accounts: ${accJson.pagination?.total || (accJson.data || accJson.accounts)?.length}`,
    });

    recordEvidence({
      category: 'Performance Sanity',
      test: 'Student list pagination latency is under 500ms with structured pagination envelope',
      actor: 'Administrator',
      method: 'GET',
      endpoint: '/api/v1/students?limit=10&page=1',
      expectedStatus: 200,
      actualStatus: studListRes.status,
      expectedResult: 'ALLOW',
      actualResult: 'ALLOW',
      passed: studListRes.status === 200 && studLatency < 500 && Array.isArray(studJson.students),
      notes: `Latency: ${studLatency}ms | Total students: ${studJson.pagination?.total || studJson.students?.length}`,
    });
  }

  console.log('\n================================================================');
  console.log(`VERIFICATION SUMMARY: ${evidenceLog.filter((e) => e.passed).length} / ${evidenceLog.length} TESTS PASSED`);
  console.log('================================================================');

  if (evidenceLog.some((e) => !e.passed)) {
    console.error('CRITICAL: One or more live verification tests failed!');
    process.exit(1);
  }
}

run()
  .catch((err) => {
    console.error('FATAL ERROR DURING VERIFICATION RUN:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
