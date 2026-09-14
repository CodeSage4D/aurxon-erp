// AURXON Staff Digital QR Code Generation Utility
import QRCode from 'qrcode';

export interface StaffQRInput {
  staffId?: string;
  employeeId: string;
  staffName?: string;
  schoolName?: string;
  designation?: string;
  department?: string;
  institutionId?: string;
  branchName?: string;
  organizationCode?: string;
  issuedDate?: string;
  baseUrl?: string;
}

/**
 * Generates a scannable Data URL QR Code embedding staff credential verification
 */
export async function generateStaffQRCode(
  staffIdOrInput: string | StaffQRInput,
  employeeId?: string,
  organizationCode?: string,
  baseUrl: string = 'https://aurxon.app'
): Promise<string> {
  let finalStaffId = '';
  let finalEmployeeId = '';
  let finalOrgCode = '';
  let finalBaseUrl = baseUrl;

  if (typeof staffIdOrInput === 'object') {
    finalStaffId = staffIdOrInput.staffId || staffIdOrInput.employeeId;
    finalEmployeeId = staffIdOrInput.employeeId;
    finalOrgCode = staffIdOrInput.organizationCode || 'AURXON';
    if (staffIdOrInput.baseUrl) finalBaseUrl = staffIdOrInput.baseUrl;
  } else {
    finalStaffId = staffIdOrInput;
    finalEmployeeId = employeeId || staffIdOrInput;
    finalOrgCode = organizationCode || 'AURXON';
  }

  const verificationUrl = `${finalBaseUrl}/verify/staff/${encodeURIComponent(finalEmployeeId || finalStaffId)}`;

  try {
    const dataUrl = await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 280,
      color: {
        dark: '#192D55', // Glacier Dark Navy
        light: '#FFFFFF', // Pure White
      },
    });
    return dataUrl;
  } catch (error) {
    console.error('[QR_GENERATION_ERROR]', error);
    // Fallback minimal SVG Data URI
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23FFFFFF"/><text x="50" y="55" font-family="Arial" font-size="8" fill="%23192D55" text-anchor="middle">${finalEmployeeId}</text></svg>`;
  }
}
