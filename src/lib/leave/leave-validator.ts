// AURXON Leave Validation Engine
// Validates Balances, Date Overlaps, Supporting Document Rules, Exam Conflicts, and Policy Routing

import {
  LeaveType,
  LeaveBalanceInfo,
  LeaveValidationResult,
  AcademicImpactSlot,
} from '../authorization/types';
import { resolveTeacherLeaveRoute, resolveStudentLeaveRoute } from '../authorization/decision-engine';

export interface StaffLeaveValidationInput {
  staffId: string;
  leaveType: LeaveType;
  startDate: Date | string;
  endDate: Date | string;
  totalDays: number;
  isEmergency?: boolean;
  hasSupportingDoc?: boolean;
  currentBalances: LeaveBalanceInfo[];
  existingLeaves: Array<{
    startDate: Date | string;
    endDate: Date | string;
    status: string;
  }>;
  scheduledClasses?: AcademicImpactSlot[];
}

export function validateStaffLeaveApplication(
  input: StaffLeaveValidationInput
): LeaveValidationResult {
  const reasons: string[] = [];
  const warnings: string[] = [];

  const start = new Date(input.startDate);
  const end = new Date(input.endDate);

  // 1. Date Validity
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    reasons.push('Invalid start or end date format');
  } else if (end < start) {
    reasons.push('Leave end date cannot be earlier than start date');
  }

  // 2. Balance Verification
  const balance = input.currentBalances.find((b) => b.leaveType === input.leaveType);
  let hasSufficientBalance = true;

  if (balance) {
    if (input.totalDays > balance.availableDays) {
      hasSufficientBalance = false;
      reasons.push(
        `You have ${balance.availableDays} ${input.leaveType} leave days remaining, but this request requires ${input.totalDays} days.`
      );
    }
  } else if (input.leaveType !== 'UNPAID' && input.leaveType !== 'DUTY') {
    // If no quota record found and not unpaid
    warnings.push(`No active allocation found for ${input.leaveType}. Request may require unpaid approval.`);
  }

  // 3. Overlapping Leave Check
  const hasOverlap = input.existingLeaves.some((existing) => {
    if (['REJECTED', 'CANCELLED', 'WITHDRAWN'].includes(existing.status)) return false;
    const exStart = new Date(existing.startDate);
    const exEnd = new Date(existing.endDate);
    return start <= exEnd && end >= exStart;
  });

  if (hasOverlap) {
    reasons.push('Requested leave dates overlap with an existing submitted or approved leave request.');
  }

  // 4. Supporting Document Requirements (e.g. Sick leave > 2 days)
  const requiresSupportingDoc = input.leaveType === 'SICK' && input.totalDays > 2;
  if (requiresSupportingDoc && !input.hasSupportingDoc) {
    warnings.push('Medical certificate is required for sick leave exceeding 2 consecutive days.');
  }

  // 5. Notice Period Check
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const isNoticePeriodMet = input.isEmergency ? true : diffDays >= 1;
  if (!isNoticePeriodMet && !input.isEmergency) {
    warnings.push('Advance notice period not satisfied. Request will be marked as short notice.');
  }

  // 6. Policy Routing Calculation
  const recommendedApprovalRoute = resolveTeacherLeaveRoute(input.totalDays, input.isEmergency);

  return {
    valid: reasons.length === 0,
    reasons,
    warnings,
    hasSufficientBalance,
    hasOverlap,
    requiresSupportingDoc,
    isNoticePeriodMet,
    recommendedApprovalRoute,
    academicImpact: input.scheduledClasses || [],
    suggestedSubstitutes: [],
  };
}

export interface StudentLeaveValidationInput {
  studentId: string;
  startDate: Date | string;
  endDate: Date | string;
  totalDays: number;
  existingLeaves: Array<{
    startDate: Date | string;
    endDate: Date | string;
    status: string;
  }>;
  scheduledExams: Array<{
    examName: string;
    date: Date | string;
  }>;
}

export function validateStudentLeaveApplication(
  input: StudentLeaveValidationInput
): LeaveValidationResult {
  const reasons: string[] = [];
  const warnings: string[] = [];

  const start = new Date(input.startDate);
  const end = new Date(input.endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    reasons.push('Invalid start or end date format');
  } else if (end < start) {
    reasons.push('Leave end date cannot be earlier than start date');
  }

  // Overlap check
  const hasOverlap = input.existingLeaves.some((existing) => {
    if (['REJECTED', 'CANCELLED', 'WITHDRAWN'].includes(existing.status)) return false;
    const exStart = new Date(existing.startDate);
    const exEnd = new Date(existing.endDate);
    return start <= exEnd && end >= exStart;
  });

  if (hasOverlap) {
    reasons.push('Student already has a pending or approved leave overlapping these dates.');
  }

  // Exam Conflict Detection
  let hasExamConflict = false;
  let examConflictDetails: string | undefined;

  const conflictingExams = input.scheduledExams.filter((exam) => {
    const exDate = new Date(exam.date);
    return exDate >= start && exDate <= end;
  });

  if (conflictingExams.length > 0) {
    hasExamConflict = true;
    const names = conflictingExams.map((e) => `${e.examName} (${new Date(e.date).toLocaleDateString('en-IN')})`).join(', ');
    examConflictDetails = `⚠ Leave overlaps with scheduled examination(s): ${names}`;
    warnings.push(examConflictDetails);
  }

  const recommendedApprovalRoute = resolveStudentLeaveRoute(input.totalDays, hasExamConflict);

  return {
    valid: reasons.length === 0,
    reasons,
    warnings,
    hasSufficientBalance: true,
    hasOverlap,
    hasExamConflict,
    examConflictDetails,
    requiresSupportingDoc: input.totalDays > 3,
    isNoticePeriodMet: true,
    recommendedApprovalRoute,
    academicImpact: [],
    suggestedSubstitutes: [],
  };
}
