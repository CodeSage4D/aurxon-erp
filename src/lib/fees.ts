/**
 * AURXON ERP Financial & Fee Calculation Module
 * Provides server-authoritative calculations for fee structures, late fee penalties,
 * concessions, and outstanding balance reconciliation.
 */

export interface FeeCalculationPolicy {
  lateFeeEnabled: boolean;
  lateFeeRatePerDay: number; // e.g. ₹50/day
  gracePeriodDays: number;   // e.g. 5 days after due date
  maxLateFeeAmount: number;  // e.g. ₹2000 cap
}

export const DEFAULT_FEE_POLICY: FeeCalculationPolicy = {
  lateFeeEnabled: true,
  lateFeeRatePerDay: 50,
  gracePeriodDays: 5,
  maxLateFeeAmount: 2000,
};

export interface AllocationFeeSummary {
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
  paidAmount: number;
  baseBalance: number;
  dueDate: Date | null;
  daysOverdue: number;
  lateFeeApplied: number;
  totalOutstanding: number;
  status: 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE';
}

/**
 * Calculates authoritative late fee penalty and total outstanding balance for a fee allocation
 */
export function calculateLateFeeAndBalance(
  allocation: {
    grossAmount: number;
    discountAmount: number;
    netAmount: number;
    paidAmount: number;
    balanceAmount: number;
    dueDate?: Date | string | null;
    status: string;
  },
  policy: Partial<FeeCalculationPolicy> = {},
  now: Date = new Date()
): AllocationFeeSummary {
  const mergedPolicy = { ...DEFAULT_FEE_POLICY, ...policy };

  const grossAmount = Math.max(0, allocation.grossAmount || 0);
  const discountAmount = Math.max(0, allocation.discountAmount || 0);
  const netAmount = Math.max(0, grossAmount - discountAmount);
  const paidAmount = Math.max(0, allocation.paidAmount || 0);
  const baseBalance = Math.max(0, netAmount - paidAmount);

  // If fully paid, no late fee applies
  if (baseBalance <= 0) {
    return {
      grossAmount,
      discountAmount,
      netAmount,
      paidAmount,
      baseBalance: 0,
      dueDate: allocation.dueDate ? new Date(allocation.dueDate) : null,
      daysOverdue: 0,
      lateFeeApplied: 0,
      totalOutstanding: 0,
      status: 'PAID',
    };
  }

  let daysOverdue = 0;
  let lateFeeApplied = 0;

  if (allocation.dueDate) {
    const due = new Date(allocation.dueDate);
    const diffTime = now.getTime() - due.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));

    if (diffDays > 0) {
      daysOverdue = diffDays;

      if (
        mergedPolicy.lateFeeEnabled &&
        daysOverdue > mergedPolicy.gracePeriodDays
      ) {
        const billableDays = daysOverdue - mergedPolicy.gracePeriodDays;
        const uncappedFee = billableDays * mergedPolicy.lateFeeRatePerDay;
        lateFeeApplied = Math.min(uncappedFee, mergedPolicy.maxLateFeeAmount);
      }
    }
  }

  const totalOutstanding = Math.round((baseBalance + lateFeeApplied) * 100) / 100;
  const status = daysOverdue > mergedPolicy.gracePeriodDays ? 'OVERDUE' : paidAmount > 0 ? 'PARTIAL' : 'UNPAID';

  return {
    grossAmount,
    discountAmount,
    netAmount,
    paidAmount,
    baseBalance,
    dueDate: allocation.dueDate ? new Date(allocation.dueDate) : null,
    daysOverdue,
    lateFeeApplied,
    totalOutstanding,
    status,
  };
}
