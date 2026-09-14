import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'aurxon-enterprise-secure-jwt-secret-key-2026-production-ready'
);

const COOKIE_NAME = 'aurxon_session';

function applySecurityHeaders(res: NextResponse, isProtected = false): NextResponse {
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  if (isProtected) {
    // Prevent browser bfcache and intermediate proxy caches from saving authenticated user states
    res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.headers.set('Pragma', 'no-cache');
    res.headers.set('Expires', '0');
  }
  return res;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow static files, api auth endpoints, public assets, portal routes, onboarding, verification & access directory
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname === '/api/v1/auth/login' ||
    pathname === '/api/v1/auth/logout' ||
    pathname.startsWith('/api/v1/portal') ||
    pathname.startsWith('/api/v1/onboard') ||
    pathname.startsWith('/api/v1/verify') ||
    pathname.startsWith('/verify') ||
    pathname.startsWith('/s/') ||
    pathname === '/access' ||
    pathname === '/onboard'
  ) {
    return applySecurityHeaders(NextResponse.next(), false);
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;

  // Dedicated AURXON Master Control Plane Login
  if (pathname === '/aurxon/login') {
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        if (payload.role === 'SUPER_ADMIN') {
          return applySecurityHeaders(NextResponse.redirect(new URL('/aurxon', req.url)), true);
        }
      } catch {
        // Token invalid, proceed to /aurxon/login
      }
    }
    return applySecurityHeaders(NextResponse.next(), false);
  }

  // If visiting /aurxon without valid token
  if (pathname === '/aurxon' || pathname.startsWith('/aurxon/')) {
    if (!token) {
      const redirectRes = NextResponse.redirect(new URL('/aurxon/login', req.url));
      return applySecurityHeaders(redirectRes, true);
    }
  }

  // If user is at /login
  if (pathname === '/login') {
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        if (payload.role === 'SUPER_ADMIN') {
          return applySecurityHeaders(NextResponse.redirect(new URL('/aurxon', req.url)), true);
        }
        return applySecurityHeaders(NextResponse.redirect(new URL('/dashboard', req.url)), true);
      } catch {
        // Token invalid, allow /login
      }
    }
    return applySecurityHeaders(NextResponse.next(), false);
  }

  // Root /: Redirect to /aurxon or /dashboard if authenticated, else allow public launchpad
  if (pathname === '/') {
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        if (payload.role === 'SUPER_ADMIN') {
          return applySecurityHeaders(NextResponse.redirect(new URL('/aurxon', req.url)), true);
        }
        return applySecurityHeaders(NextResponse.redirect(new URL('/dashboard', req.url)), true);
      } catch {
        // Token invalid, render launchpad
      }
    }
    return applySecurityHeaders(NextResponse.next(), false);
  }

  // Protected App and API routes
  if (!token) {
    if (pathname.startsWith('/api/')) {
      const unauthorizedRes = NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      return applySecurityHeaders(unauthorizedRes, true);
    }
    const redirectLogin = NextResponse.redirect(new URL('/login', req.url));
    return applySecurityHeaders(redirectLogin, true);
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Forward tenant context headers
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-id', String(payload.id));
    requestHeaders.set('x-user-role', String(payload.role));
    requestHeaders.set('x-org-id', String(payload.organizationId));
    if (payload.institutionId) {
      requestHeaders.set('x-inst-id', String(payload.institutionId));
    }

    const nextRes = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    return applySecurityHeaders(nextRes, true);
  } catch {
    if (pathname.startsWith('/api/')) {
      const expiredRes = NextResponse.json({ success: false, error: 'Session expired or invalid' }, { status: 401 });
      return applySecurityHeaders(expiredRes, true);
    }
    const response = NextResponse.redirect(new URL('/login', req.url));
    response.cookies.delete(COOKIE_NAME);
    return applySecurityHeaders(response, true);
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
