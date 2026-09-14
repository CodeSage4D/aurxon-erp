/**
 * AURXON Education OS - Authoritative Fallback Registry
 * Guarantees zero-downtime authentication and portal resolution
 * across serverless runtimes (Netlify, Vercel, Firebase, Cloudflare, etc.)
 */

export interface FallbackAccount {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: string;
  organizationName: string;
  institutionId: string;
  institutionName: string;
  branchId?: string;
  branchName?: string;
  status: 'ACTIVE';
}

export const FALLBACK_USERS: Record<string, FallbackAccount> = {
  'principal.rkp@dps-society.edu': {
    id: 'user-dps-principal',
    email: 'principal.rkp@dps-society.edu',
    firstName: 'Dr. Meenakshi',
    lastName: 'Sundaram',
    role: 'PRINCIPAL',
    organizationId: 'org-dps',
    organizationName: 'Delhi Public School Society',
    institutionId: 'inst-dps-rkp',
    institutionName: 'Delhi Public School, R.K. Puram',
    branchId: 'branch-dps-snr',
    branchName: 'Senior Wing Campus',
    status: 'ACTIVE',
  },
  'teacher.math@dps-society.edu': {
    id: 'user-dps-teacher-math',
    email: 'teacher.math@dps-society.edu',
    firstName: 'Rajesh',
    lastName: 'Kumar',
    role: 'TEACHER',
    organizationId: 'org-dps',
    organizationName: 'Delhi Public School Society',
    institutionId: 'inst-dps-rkp',
    institutionName: 'Delhi Public School, R.K. Puram',
    branchId: 'branch-dps-snr',
    branchName: 'Senior Wing Campus',
    status: 'ACTIVE',
  },
  'teacher.science@dps-society.edu': {
    id: 'user-dps-teacher-sci',
    email: 'teacher.science@dps-society.edu',
    firstName: 'Dr. Sunita',
    lastName: 'Sharma',
    role: 'TEACHER',
    organizationId: 'org-dps',
    organizationName: 'Delhi Public School Society',
    institutionId: 'inst-dps-rkp',
    institutionName: 'Delhi Public School, R.K. Puram',
    branchId: 'branch-dps-snr',
    branchName: 'Senior Wing Campus',
    status: 'ACTIVE',
  },
  'accountant@dps-society.edu': {
    id: 'user-dps-accountant',
    email: 'accountant@dps-society.edu',
    firstName: 'Amit',
    lastName: 'Bansal',
    role: 'ACCOUNTANT',
    organizationId: 'org-dps',
    organizationName: 'Delhi Public School Society',
    institutionId: 'inst-dps-rkp',
    institutionName: 'Delhi Public School, R.K. Puram',
    branchId: 'branch-dps-snr',
    branchName: 'Senior Wing Campus',
    status: 'ACTIVE',
  },
  'student.aarav@dps-society.edu': {
    id: 'user-dps-student',
    email: 'student.aarav@dps-society.edu',
    firstName: 'Aarav',
    lastName: 'Sharma',
    role: 'STUDENT',
    organizationId: 'org-dps',
    organizationName: 'Delhi Public School Society',
    institutionId: 'inst-dps-rkp',
    institutionName: 'Delhi Public School, R.K. Puram',
    branchId: 'branch-dps-snr',
    branchName: 'Senior Wing Campus',
    status: 'ACTIVE',
  },
  'parent.aarav@gmail.com': {
    id: 'user-dps-parent',
    email: 'parent.aarav@gmail.com',
    firstName: 'Dr. Alok',
    lastName: 'Sharma',
    role: 'PARENT',
    organizationId: 'org-dps',
    organizationName: 'Delhi Public School Society',
    institutionId: 'inst-dps-rkp',
    institutionName: 'Delhi Public School, R.K. Puram',
    branchId: 'branch-dps-snr',
    branchName: 'Senior Wing Campus',
    status: 'ACTIVE',
  },
  'admin@dps-society.edu': {
    id: 'user-dps-admin',
    email: 'admin@dps-society.edu',
    firstName: 'Ashok',
    lastName: 'Chandra',
    role: 'ORG_ADMIN',
    organizationId: 'org-dps',
    organizationName: 'Delhi Public School Society',
    institutionId: 'inst-dps-rkp',
    institutionName: 'Delhi Public School, R.K. Puram',
    branchId: 'branch-dps-snr',
    branchName: 'Senior Wing Campus',
    status: 'ACTIVE',
  },
  'superadmin@aurxon.io': {
    id: 'user-super-admin',
    email: 'superadmin@aurxon.io',
    firstName: 'Vikramaditya',
    lastName: 'Singhania',
    role: 'SUPER_ADMIN',
    organizationId: 'org-platform',
    organizationName: 'AURXON SaaS Global',
    institutionId: 'inst-platform',
    institutionName: 'AURXON Central Command',
    status: 'ACTIVE',
  },
  'admin@apex-coaching.edu': {
    id: 'user-apex-admin',
    email: 'admin@apex-coaching.edu',
    firstName: 'Er. Rajesh',
    lastName: 'Maheshwari',
    role: 'ORG_ADMIN',
    organizationId: 'org-apex',
    organizationName: 'Apex IIT-JEE & NEET Academy',
    institutionId: 'inst-apex-kota',
    institutionName: 'Apex Kota Central Campus',
    status: 'ACTIVE',
  },
  'faculty.physics@apex-coaching.edu': {
    id: 'user-apex-physics',
    email: 'faculty.physics@apex-coaching.edu',
    firstName: 'Prof. Alok',
    lastName: 'Gupta',
    role: 'TEACHER',
    organizationId: 'org-apex',
    organizationName: 'Apex IIT-JEE & NEET Academy',
    institutionId: 'inst-apex-kota',
    institutionName: 'Apex Kota Central Campus',
    status: 'ACTIVE',
  },
  'director@sharma-group.in': {
    id: 'user-sharma-director',
    email: 'director@sharma-group.in',
    firstName: 'Dr. Ramesh',
    lastName: 'Sharma',
    role: 'ORG_ADMIN',
    organizationId: 'org-sharma',
    organizationName: 'Sharma Education Group',
    institutionId: 'inst-sps-indore',
    institutionName: 'Sharma Public School, Indore',
    status: 'ACTIVE',
  },
  'principal@sris-edu.in': {
    id: 'user-sris-principal',
    email: 'principal@sris-edu.in',
    firstName: 'Dr. Raghav',
    lastName: 'Sharma',
    role: 'PRINCIPAL',
    organizationId: 'org-sris',
    organizationName: 'Shri Ram International School',
    institutionId: 'inst-sris',
    institutionName: 'Shri Ram Public School',
    status: 'ACTIVE',
  },
};

// Global in-memory dynamic caches across serverless invocations
const dynamicUsers = new Map<string, FallbackAccount>();
const dynamicOrgs = new Map<string, any>();

export function registerFallbackUser(user: FallbackAccount) {
  const clean = user.email.toLowerCase().trim();
  dynamicUsers.set(clean, user);
}

export function registerFallbackOrganization(org: any) {
  const cleanSlug = org.slug.toLowerCase().trim();
  dynamicOrgs.set(cleanSlug, org);
}

export function getFallbackUser(email: string): FallbackAccount | null {
  const clean = email.toLowerCase().trim();
  if (dynamicUsers.has(clean)) {
    return dynamicUsers.get(clean)!;
  }
  return FALLBACK_USERS[clean] || null;
}

export const FALLBACK_ORGANIZATIONS = [
  {
    name: 'Delhi Public School Society',
    slug: 'dps-society',
    code: 'DPS-ORG',
    city: 'New Delhi',
    organizationType: 'K-12 School Chain',
    board: 'CBSE Affiliated',
    logoUrl: null,
  },
  {
    name: 'Apex IIT-JEE & NEET Academy',
    slug: 'apex-coaching',
    code: 'APEX-KOTA',
    city: 'Kota',
    organizationType: 'Competitive Coaching',
    board: 'NEET & JEE',
    logoUrl: null,
  },
  {
    name: 'Sharma Education Group',
    slug: 'sharma-education-group',
    code: 'SEG-INDORE',
    city: 'Indore',
    organizationType: 'School & Coaching Hybrid',
    board: 'CBSE & MP Board',
    logoUrl: null,
  },
  {
    name: 'Shri Ram International School',
    slug: 'sris',
    code: 'SRIS-IND',
    city: 'Indore',
    organizationType: 'International School',
    board: 'CBSE & Cambridge',
    logoUrl: null,
  },
  {
    name: 'Global Indian World School',
    slug: 'giws',
    code: 'GIWS-DEL',
    city: 'New Delhi',
    organizationType: 'K-12 School',
    board: 'CBSE Affiliated',
    logoUrl: null,
  },
];

export function getFallbackOrganizations(): any[] {
  const dynList = Array.from(dynamicOrgs.values());
  return [...dynList, ...FALLBACK_ORGANIZATIONS];
}

export function getFallbackOrganization(slug: string): any | null {
  const clean = slug.toLowerCase().trim();
  if (dynamicOrgs.has(clean)) {
    return dynamicOrgs.get(clean);
  }
  return FALLBACK_ORGANIZATIONS.find((o) => o.slug.toLowerCase() === clean) || null;
}
