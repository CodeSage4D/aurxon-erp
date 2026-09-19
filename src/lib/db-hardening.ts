/**
 * AURXON ERP Security & Database Hardening Utility Module
 * Provides defense-in-depth against SQL injection, XSS vectors, and unsafe database parameterization.
 */

/**
 * Sanitizes input strings to strip dangerous control characters and potential SQL payload fragments.
 * Note: Prisma uses parameterized prepared statements natively, but this provides extra hygiene for raw filters or dynamic search queries.
 */
export function sanitizeSearchQuery(query: string | null | undefined): string {
  if (!query) return '';
  // Remove null bytes, backslashes, quotes, and dangerous comment characters used in SQL injection payloads
  return query
    .replace(/\0/g, '')
    .replace(/['"\\;]/g, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    .trim();
}

/**
 * Validates and formats Aadhar Card number (12-digit Indian National ID)
 */
export function validateAadharNumber(aadhar: string | null | undefined): boolean {
  if (!aadhar) return false;
  const clean = aadhar.replace(/[\s-]/g, '');
  return /^\d{12}$/.test(clean);
}

/**
 * Formats 12-digit Aadhar number into standard 4-4-4 format: "1234 5678 9012"
 */
export function formatAadharNumber(aadhar: string | null | undefined): string {
  if (!aadhar) return '';
  const clean = aadhar.replace(/\D/g, '');
  if (clean.length !== 12) return aadhar;
  return `${clean.slice(0, 4)} ${clean.slice(4, 8)} ${clean.slice(8, 12)}`;
}

/**
 * Formats Indian Currency (INR - ₹) with standard lakhs and crores grouping (e.g. ₹1,50,000.00)
 */
export function formatIndianCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Validates Indian PAN card format (5 letters, 4 digits, 1 letter)
 */
export function validatePAN(pan: string | null | undefined): boolean {
  if (!pan) return false;
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase());
}
