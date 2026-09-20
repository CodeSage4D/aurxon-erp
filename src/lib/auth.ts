import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies, headers } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'aurxon-enterprise-secure-jwt-secret-key-2026-production-ready'
);

export const COOKIE_NAME = 'aurxon_session';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: string;
  institutionId?: string | null;
  branchId?: string | null;
  mustResetPassword?: boolean;
  isTemporaryPassword?: boolean;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signToken(user: AuthUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

const revokedTokens = new Set<string>();

export function revokeToken(token: string) {
  revokedTokens.add(token);
}

export function isTokenRevoked(token: string): boolean {
  return revokedTokens.has(token);
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    if (isTokenRevoked(token)) {
      return null;
    }
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as AuthUser;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    let token: string | undefined;

    // 1. Check Authorization Bearer header first (REST API / Mobile Native)
    try {
      const headerStore = headers();
      const authHeader = headerStore.get('authorization') || headerStore.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
      }
    } catch {
      // Ignore if headers() unavailable in edge context
    }

    // 2. Check aurxon_session cookie (Web Browser sessions)
    if (!token) {
      try {
        const cookieStore = cookies();
        token = cookieStore.get(COOKIE_NAME)?.value;
      } catch {
        // Ignore if cookies() unavailable
      }
    }

    if (!token) return null;
    return await verifyToken(token);
  } catch {
    return null;
  }
}

