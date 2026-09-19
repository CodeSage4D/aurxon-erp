/**
 * AURXON ERP - Indian Examination & CBSE 9-Point Grading Engine
 */

export interface CBSEGradeInfo {
  grade: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'D' | 'E1' | 'E2';
  gradePoint: number;
  description: string;
  isPass: boolean;
}

export const INDIAN_EXAM_TYPES = [
  { code: 'UNIT_TEST_1', label: 'Unit Test I', category: 'FORMATIVE', defaultWeightage: 10 },
  { code: 'PERIODIC_TEST_1', label: 'Periodic Test I (PT-1)', category: 'FORMATIVE', defaultWeightage: 10 },
  { code: 'HALF_YEARLY', label: 'Half Yearly / Mid-Term Exam', category: 'SUMMATIVE', defaultWeightage: 30 },
  { code: 'UNIT_TEST_2', label: 'Unit Test II', category: 'FORMATIVE', defaultWeightage: 10 },
  { code: 'PERIODIC_TEST_2', label: 'Periodic Test II (PT-2)', category: 'FORMATIVE', defaultWeightage: 10 },
  { code: 'ANNUAL', label: 'Annual / Final Examination', category: 'SUMMATIVE', defaultWeightage: 50 },
  { code: 'PRE_BOARD_1', label: 'Pre-Board Examination I', category: 'BOARD_PREP', defaultWeightage: 100 },
  { code: 'PRE_BOARD_2', label: 'Pre-Board Examination II', category: 'BOARD_PREP', defaultWeightage: 100 },
  { code: 'MOCK_TEST', label: 'NEET / JEE Mock Test', category: 'COACHING', defaultWeightage: 100 },
  { code: 'BOARD_EXAM', label: 'Board Public Examination', category: 'BOARD_PUBLIC', defaultWeightage: 100 },
] as const;

export function calculateCBSEGrade(marksObtained: number, maxMarks: number = 100): CBSEGradeInfo {
  if (maxMarks <= 0) {
    return { grade: 'E2', gradePoint: 0.0, description: 'Invalid Marks', isPass: false };
  }

  const percentage = (marksObtained / maxMarks) * 100;

  if (percentage >= 91.0) {
    return { grade: 'A1', gradePoint: 10.0, description: 'Outstanding', isPass: true };
  } else if (percentage >= 81.0) {
    return { grade: 'A2', gradePoint: 9.0, description: 'Excellent', isPass: true };
  } else if (percentage >= 71.0) {
    return { grade: 'B1', gradePoint: 8.0, description: 'Very Good', isPass: true };
  } else if (percentage >= 61.0) {
    return { grade: 'B2', gradePoint: 7.0, description: 'Good', isPass: true };
  } else if (percentage >= 51.0) {
    return { grade: 'C1', gradePoint: 6.0, description: 'Above Average', isPass: true };
  } else if (percentage >= 41.0) {
    return { grade: 'C2', gradePoint: 5.0, description: 'Average', isPass: true };
  } else if (percentage >= 33.0) {
    return { grade: 'D', gradePoint: 4.0, description: 'Fair', isPass: true };
  } else if (percentage >= 21.0) {
    return { grade: 'E1', gradePoint: 0.0, description: 'Needs Improvement', isPass: false };
  } else {
    return { grade: 'E2', gradePoint: 0.0, description: 'Essential Repeat', isPass: false };
  }
}

export function calculateDivision(overallPercentage: number): string {
  if (overallPercentage >= 75.0) return 'Distinction (1st Division)';
  if (overallPercentage >= 60.0) return '1st Division';
  if (overallPercentage >= 48.0) return '2nd Division';
  if (overallPercentage >= 33.0) return '3rd Division';
  return 'Essential Repeat (Fail)';
}
