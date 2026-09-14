// AURXON Deterministic Employee & Member ID Generator
import prisma from '../prisma';

export async function generateEmployeeId(
  organizationId: string,
  organizationCode?: string,
  year?: number
): Promise<string> {
  const currentYear = year || new Date().getFullYear();
  let code = organizationCode;

  if (!code) {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { code: true },
    });
    code = org?.code || 'AURXON';
  }

  // Clean code: uppercase, strip special characters
  const cleanCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'AURXON';
  const prefix = `EMP-${cleanCode}-${currentYear}-`;

  // Count existing employees with this prefix to get deterministic sequence
  const count = await prisma.staffProfile.count({
    where: {
      organizationId,
      employeeId: {
        startsWith: prefix,
      },
    },
  });

  const nextSeq = String(count + 1).padStart(4, '0');
  return `${prefix}${nextSeq}`;
}
