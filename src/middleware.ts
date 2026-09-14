import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'aurxon-enterprise-secure-jwt-secret-key-2026-production-ready'
);

const COOKIE_NAME = 'aurxon_session';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow static files, api auth endpoints, public assets, portal routes, onboarding & access directory
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname === '/api/v1/auth/login' ||
    pathname === '/api/v1/auth/logout' ||
    pathname.startsWith('/api/v1/portal') ||
    pathname.startsWith('/api/v1/onboard') ||
    pathname.startsWith('/s/') ||
    pathname === '/access' ||
    pathname === '/onboard'
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;

  // Dedicated AURXON Master Control Plane Login
  if (pathname === '/aurxon/login') {
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        if (payload.role === 'SUPER_ADMIN') {
          return NextResponse.redirect(new URL('/aurxon', req.url));
        }
      } catch {
        // Token invalid, proceed to /aurxon/login
      }
    }
    return NextResponse.next();
  }

  // If visiting /aurxon without valid token
  if (pathname === '/aurxon' || pathname.startsWith('/aurxon/')) {
    if (!token) {
      return NextResponse.redirect(new URL('/aurxon/login', req.url));
    }
  }

  // If user is at /login
  if (pathname === '/login') {
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        if (payload.role === 'SUPER_ADMIN') {
          return NextResponse.redirect(new URL('/aurxon', req.url));
        }
        return NextResponse.redirect(new URL('/dashboard', req.url));
      } catch {
        // Token invalid, allow /login
      }
    }
    return NextResponse.next();
  }

  // Root /: Redirect to /aurxon or /dashboard if authenticated, else allow public launchpad
  if (pathname === '/') {
    if (token) {
      try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        if (payload.role === 'SUPER_ADMIN') {
          return NextResponse.redirect(new URL('/aurxon', req.url));
        }
        return NextResponse.redirect(new URL('/dashboard', req.url));
      } catch {
        // Token invalid, render launchpad
      }
    }
    return NextResponse.next();
  }

  // Protected App and API routes
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', req.url));
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

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ success: false, error: 'Session expired or invalid' }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL('/login', req.url));
    response.cookies.delete(COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
