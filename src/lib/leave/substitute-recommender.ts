// AURXON Intelligent Substitute Teacher Recommendation Engine
// Ranks qualified, available faculty candidates during leave-induced period clashes

import { SubstituteTeacherCandidate, AcademicImpactSlot } from '../authorization/types';

export interface CandidateFacultyInput {
  staffId: string;
  fullName: string;
  designation: string;
  department: string;
  subjectSpecializations: string[];
  branchId?: string;
  busySlots: Array<{ dayOfWeek: number; periodNumber: number }>;
  weeklyPeriodCount: number;
  maxWeeklyPeriodQuota?: number;
}

/**
 * Calculates candidate match score and generates recommendations
 */
export function rankSubstituteCandidates(
  affectedSlots: AcademicImpactSlot[],
  candidatePool: CandidateFacultyInput[],
  targetBranchId?: string
): SubstituteTeacherCandidate[] {
  const neededSubjects = Array.from(new Set(affectedSlots.map((s) => s.subjectName.toLowerCase())));

  const results: SubstituteTeacherCandidate[] = candidatePool.map((candidate) => {
    let matchScore = 0;
    const reasons: string[] = [];

    // 1. Subject Specialization Matching (Up to 40 pts)
    const candidateSubjects = candidate.subjectSpecializations.map((s) => s.toLowerCase());
    const hasSubjectMatch = candidateSubjects.some((s) =>
      neededSubjects.some((needed) => needed.includes(s) || s.includes(needed))
    );

    if (hasSubjectMatch) {
      matchScore += 40;
      reasons.push('Teaches same subject domain');
    } else if (candidate.department.toLowerCase().includes('academic') || candidate.department.toLowerCase().includes('science') || candidate.department.toLowerCase().includes('math')) {
      matchScore += 15;
      reasons.push('Relevant faculty department');
    }

    // 2. Branch / Campus Co-location (Up to 30 pts)
    if (targetBranchId && candidate.branchId === targetBranchId) {
      matchScore += 30;
      reasons.push('Same campus branch');
    } else if (!targetBranchId) {
      matchScore += 20;
    }

    // 3. Timetable Availability Check (Up to 20 pts)
    const hasClash = affectedSlots.some((slot) =>
      candidate.busySlots.some(
        (busy) => busy.dayOfWeek === slot.dayOfWeek && busy.periodNumber === slot.periodNumber
      )
    );

    const isFreeDuringPeriod = !hasClash;
    if (isFreeDuringPeriod) {
      matchScore += 20;
      reasons.push('Zero timetable clashes in affected periods');
    } else {
      reasons.push('Has existing class commitments during period');
    }

    // 4. Workload Policy Balance (Up to 10 pts)
    const maxQuota = candidate.maxWeeklyPeriodQuota || 28;
    if (candidate.weeklyPeriodCount < maxQuota) {
      matchScore += 10;
      reasons.push(`Workload optimal (${candidate.weeklyPeriodCount}/${maxQuota} periods)`);
    } else {
      reasons.push('High weekly workload');
    }

    return {
      staffId: candidate.staffId,
      fullName: candidate.fullName,
      designation: candidate.designation,
      department: candidate.department,
      subjectSpecialization: candidate.subjectSpecializations,
      branchId: candidate.branchId,
      matchScore: Math.min(100, Math.max(0, matchScore)),
      isFreeDuringPeriod,
      currentWeeklyLoad: candidate.weeklyPeriodCount,
      recommendedReason: reasons.join(' • '),
    };
  });

  // Sort by match score descending, prioritizing free candidates
  return results.sort((a, b) => {
    if (a.isFreeDuringPeriod && !b.isFreeDuringPeriod) return -1;
    if (!a.isFreeDuringPeriod && b.isFreeDuringPeriod) return 1;
    return b.matchScore - a.matchScore;
  });
}
