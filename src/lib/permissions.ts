// AURXON Centralized School & Coaching ERP - Role Based Access Control (RBAC)

export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ['*'],
  ORG_ADMIN: [
    'org.view',
    'org.update',
    'institution.create',
    'institution.view',
    'institution.update',
    'module.manage',
    'user.create',
    'user.view',
    'user.update',
    'user.archive',
    'student.create',
    'student.view',
    'student.update',
    'student.archive',
    'academic.manage',
    'attendance.manage',
    'attendance.view',
    'exam.manage',
    'fee.manage',
    'fee.collect',
    'finance.manage',
    'report.view',
    'announcement.create',
    'audit.view',
  ],
  PRINCIPAL: [
    'institution.view',
    'academic.manage',
    'academic.view',
    'student.create',
    'student.view',
    'student.update',
    'student.archive',
    'teacher.view',
    'teacher.assign',
    'attendance.manage',
    'attendance.view',
    'exam.manage',
    'exam.publish',
    'fee.view',
    'fee.collect',
    'report.view',
    'announcement.create',
    'audit.view',
  ],
  TEACHER: [
    'academic.view',
    'student.view',
    'attendance.mark',
    'attendance.view',
    'exam.view',
    'exam.enter_marks',
    'timetable.view',
    'announcement.view',
    'announcement.create',
  ],
  FACULTY: [
    'academic.view',
    'student.view',
    'attendance.mark',
    'attendance.view',
    'exam.view',
    'exam.enter_marks',
    'timetable.view',
    'announcement.view',
    'announcement.create',
  ],
  ACCOUNTANT: [
    'student.view',
    'fee.manage',
    'fee.view',
    'fee.collect',
    'fee.receipt',
    'finance.manage',
    'finance.view',
    'report.view',
    'announcement.view',
  ],
  PARENT: [
    'student.view_own',
    'attendance.view_own',
    'exam.view_own',
    'fee.view_own',
    'timetable.view_own',
    'announcement.view',
  ],
  STUDENT: [
    'student.view_own',
    'attendance.view_own',
    'exam.view_own',
    'fee.view_own',
    'timetable.view_own',
    'announcement.view',
  ],
};

export function hasPermission(
  role: string,
  permission: string,
  customPermissions: string[] = []
): boolean {
  if (role === 'SUPER_ADMIN') return true;

  const defaultPerms = DEFAULT_ROLE_PERMISSIONS[role] || [];
  const allPerms = new Set([...defaultPerms, ...customPermissions]);

  if (allPerms.has('*')) return true;
  if (allPerms.has(permission)) return true;

  // Wildcard scope check, e.g. "attendance.*" or "attendance.manage" covers "attendance.mark"
  const [domain] = permission.split('.');
  if (allPerms.has(`${domain}.*`) || allPerms.has(`${domain}.manage`)) return true;

  return false;
}
