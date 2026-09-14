// AURXON Decision & Multi-Tier Approval Engine
// Implements Policy Routing, Four-Eyes Verification, and Anti-Self-Approval Rules

import { Role, WorkflowType, WorkflowStepRecord } from './types';

export interface WorkflowRoutingConfig {
  workflowType: WorkflowType;
  title: string;
  steps: Array<{
    stepName: string;
    allowedRoles: Role[];
    isFinalApproval: boolean;
  }>;
}

/**
 * Resolves the multi-tier approval route for a teacher leave request based on duration and policy
 */
export function resolveTeacherLeaveRoute(totalDays: number, isEmergency: boolean = false): string[] {
  if (isEmergency || totalDays > 3) {
    // Sensitive/Long leave: HOD -> Vice Principal -> Principal
    return ['COORDINATOR', 'HOD', 'VICE_PRINCIPAL', 'PRINCIPAL'];
  }
  if (totalDays > 1) {
    // 2-3 days: HOD -> Vice Principal
    return ['HOD', 'VICE_PRINCIPAL'];
  }
  // 1 day: Coordinator approval
  return ['COORDINATOR'];
}

/**
 * Resolves the multi-tier approval route for a student leave request
 */
export function resolveStudentLeaveRoute(totalDays: number, hasExamConflict: boolean = false): string[] {
  if (hasExamConflict || totalDays > 3) {
    // High-impact / Exam conflict: Class Teacher -> Vice Principal / Principal
    return ['CLASS_TEACHER', 'COORDINATOR', 'PRINCIPAL'];
  }
  if (totalDays > 2) {
    // 2-3 days: Class Teacher -> Coordinator
    return ['CLASS_TEACHER', 'COORDINATOR'];
  }
  // Short leave (<= 2 days): Class Teacher
  return ['CLASS_TEACHER'];
}

/**
 * Standard Multi-Tier Workflow Definitions
 */
export const WORKFLOW_DEFINITIONS: Record<WorkflowType, WorkflowRoutingConfig> = {
  FEE_CONCESSION: {
    workflowType: 'FEE_CONCESSION',
    title: 'Student Fee Concession / Waiver Approval',
    steps: [
      { stepName: 'ACCOUNTANT_VERIFICATION', allowedRoles: ['ACCOUNTANT', 'FINANCE_MANAGER'], isFinalApproval: false },
      { stepName: 'FINANCE_MANAGER_REVIEW', allowedRoles: ['FINANCE_MANAGER'], isFinalApproval: false },
      { stepName: 'PRINCIPAL_FINAL_APPROVAL', allowedRoles: ['PRINCIPAL', 'SUPER_ADMIN', 'ORG_ADMIN'], isFinalApproval: true },
    ],
  },
  FEE_REFUND: {
    workflowType: 'FEE_REFUND',
    title: 'Student Fee / Caution Money Refund',
    steps: [
      { stepName: 'ACCOUNTANT_AUDIT', allowedRoles: ['ACCOUNTANT', 'FINANCE_MANAGER'], isFinalApproval: false },
      { stepName: 'FINANCE_MANAGER_APPROVAL', allowedRoles: ['FINANCE_MANAGER', 'PRINCIPAL', 'ORG_ADMIN'], isFinalApproval: true },
    ],
  },
  FEE_ADJUSTMENT: {
    workflowType: 'FEE_ADJUSTMENT',
    title: 'Ledger Adjustment & Correction',
    steps: [
      { stepName: 'ACCOUNTANT_SUBMISSION', allowedRoles: ['ACCOUNTANT'], isFinalApproval: false },
      { stepName: 'FINANCE_MANAGER_APPROVAL', allowedRoles: ['FINANCE_MANAGER', 'ORG_ADMIN'], isFinalApproval: true },
    ],
  },
  EXAM_PUBLICATION: {
    workflowType: 'EXAM_PUBLICATION',
    title: 'Formal Report Card & Result Publication',
    steps: [
      { stepName: 'COORDINATOR_MODERATION', allowedRoles: ['EXAM_COORDINATOR', 'ACADEMIC_COORDINATOR', 'HOD'], isFinalApproval: false },
      { stepName: 'PRINCIPAL_PUBLICATION', allowedRoles: ['PRINCIPAL', 'SUPER_ADMIN', 'ORG_ADMIN'], isFinalApproval: true },
    ],
  },
  STAFF_LEAVE: {
    workflowType: 'STAFF_LEAVE',
    title: 'Faculty / Staff Leave Request',
    steps: [
      { stepName: 'DEPARTMENT_REVIEW', allowedRoles: ['HOD', 'ACADEMIC_COORDINATOR'], isFinalApproval: false },
      { stepName: 'ADMINISTRATIVE_APPROVAL', allowedRoles: ['VICE_PRINCIPAL', 'PRINCIPAL', 'ORG_ADMIN'], isFinalApproval: true },
    ],
  },
  STUDENT_LEAVE: {
    workflowType: 'STUDENT_LEAVE',
    title: 'Student Leave Request',
    steps: [
      { stepName: 'CLASS_TEACHER_REVIEW', allowedRoles: ['CLASS_TEACHER', 'TEACHER'], isFinalApproval: false },
      { stepName: 'HEAD_APPROVAL', allowedRoles: ['COORDINATOR', 'VICE_PRINCIPAL', 'PRINCIPAL'], isFinalApproval: true },
    ],
  },
  ATTENDANCE_CORRECTION: {
    workflowType: 'ATTENDANCE_CORRECTION',
    title: 'Historical Attendance Adjustment',
    steps: [
      { stepName: 'TEACHER_JUSTIFICATION', allowedRoles: ['TEACHER', 'CLASS_TEACHER'], isFinalApproval: false },
      { stepName: 'AUTHORITY_APPROVAL', allowedRoles: ['VICE_PRINCIPAL', 'PRINCIPAL', 'BRANCH_HEAD', 'ORG_ADMIN'], isFinalApproval: true },
    ],
  },
  STAFF_TRANSFER: {
    workflowType: 'STAFF_TRANSFER',
    title: 'Inter-Campus Staff Relocation',
    steps: [
      { stepName: 'HR_VERIFICATION', allowedRoles: ['HR_MANAGER', 'HR_OFFICER'], isFinalApproval: false },
      { stepName: 'MANAGEMENT_APPROVAL', allowedRoles: ['ORG_ADMIN', 'SUPER_ADMIN', 'DIRECTOR'], isFinalApproval: true },
    ],
  },
  ROLE_CHANGE: {
    workflowType: 'ROLE_CHANGE',
    title: 'Staff Security Role Modification',
    steps: [
      { stepName: 'ADMIN_JUSTIFICATION', allowedRoles: ['SCHOOL_ADMIN', 'HR_MANAGER'], isFinalApproval: false },
      { stepName: 'SUPERADMIN_APPROVAL', allowedRoles: ['ORG_ADMIN', 'SUPER_ADMIN'], isFinalApproval: true },
    ],
  },
};

/**
 * Validates that an approval action conforms to anti-self-approval and multi-tier routing rules
 */
export function validateApprovalAction(params: {
  requesterUserId: string;
  actorUserId: string;
  actorRole: string;
  currentStep: string;
  workflowType: WorkflowType;
}): {
  allowed: boolean;
  reason: string;
  isFinalStep: boolean;
  nextStep?: string;
} {
  const { requesterUserId, actorUserId, actorRole, currentStep, workflowType } = params;

  // 1. Absolute Rule: Requester cannot approve their own submission under four-eyes principle
  if (requesterUserId === actorUserId && actorRole !== 'SUPER_ADMIN') {
    return {
      allowed: false,
      reason: 'Self-approval is strictly disallowed under four-eyes security principles.',
      isFinalStep: false,
    };
  }

  // 2. Apex administrators have executive authority across all approval stages
  if (actorRole === 'SUPER_ADMIN' || actorRole === 'ORG_ADMIN') {
    return {
      allowed: true,
      reason: 'Apex administrator has executive authorization across all approval stages.',
      isFinalStep: true,
    };
  }

  // 3. Campus Principal / Director holds campus-level final authority
  if (actorRole === 'PRINCIPAL' || actorRole === 'DIRECTOR') {
    return {
      allowed: true,
      reason: 'Principal holds institutional authority to review and approve workflow stages.',
      isFinalStep: true,
    };
  }

  // 4. Role-Name Direct Match (e.g. currentStep is 'HOD', 'COORDINATOR', 'CLASS_TEACHER', 'VICE_PRINCIPAL')
  const roleEquivalencies: Record<string, string[]> = {
    HOD: ['HOD', 'ACADEMIC_COORDINATOR', 'VICE_PRINCIPAL'],
    COORDINATOR: ['ACADEMIC_COORDINATOR', 'EXAM_COORDINATOR', 'DISCIPLINE_COORDINATOR', 'VICE_PRINCIPAL'],
    CLASS_TEACHER: ['CLASS_TEACHER', 'TEACHER', 'ACADEMIC_COORDINATOR'],
    VICE_PRINCIPAL: ['VICE_PRINCIPAL'],
    ACCOUNTANT: ['ACCOUNTANT', 'FINANCE_MANAGER'],
    FINANCE_MANAGER: ['FINANCE_MANAGER'],
  };

  if (currentStep === actorRole || (roleEquivalencies[currentStep] && roleEquivalencies[currentStep].includes(actorRole))) {
    const isFinal = currentStep === 'VICE_PRINCIPAL' || currentStep === 'PRINCIPAL';
    return {
      allowed: true,
      reason: `Role '${actorRole}' matches required step role '${currentStep}'`,
      isFinalStep: isFinal,
    };
  }

  // 5. Standard Named Workflow Definition Resolution
  const config = WORKFLOW_DEFINITIONS[workflowType];
  if (!config) {
    return {
      allowed: false,
      reason: `Unknown workflow type '${workflowType}'`,
      isFinalStep: false,
    };
  }

  const stepIndex = config.steps.findIndex((s) => s.stepName === currentStep);
  const activeStep = stepIndex >= 0 ? config.steps[stepIndex] : config.steps[0];

  const hasRoleAuthority = activeStep.allowedRoles.includes(actorRole as Role);

  if (!hasRoleAuthority) {
    return {
      allowed: false,
      reason: `Role '${actorRole}' is not authorized to act on step '${currentStep || activeStep.stepName}'. Allowed roles: [${activeStep.allowedRoles.join(', ')}]`,
      isFinalStep: false,
    };
  }

  const isFinalStep = stepIndex === config.steps.length - 1 || activeStep.isFinalApproval;
  const nextStep = !isFinalStep && stepIndex >= 0 && stepIndex + 1 < config.steps.length
    ? config.steps[stepIndex + 1].stepName
    : undefined;

  return {
    allowed: true,
    reason: `Actor is authorized to act on step '${activeStep.stepName}'`,
    isFinalStep,
    nextStep,
  };
}
