import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface UserCookie {
  userId: string;
  userType: 'admin' | 'doctor' | 'patient' | 'sponsor';
  email: string;
  patientId?: string;
  doctorId?: string;
}

/**
 * Production-ready middleware for route protection.
 * Checks for accessToken in cookies and enforces role-based access.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 1. Get token and user from cookies
  const token = request.cookies.get('accessToken')?.value;
  const userCookie = request.cookies.get('user')?.value;
  let user: UserCookie | null = null;

  if (userCookie) {
    try {
      user = JSON.parse(decodeURIComponent(userCookie)) as UserCookie;
    } catch (e) {
      console.error('Middleware: Failed to parse user cookie', e);
    }
  }

  // 2. Define path classifications
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
  const isPatientPath = pathname.startsWith('/patient');
  const isDoctorPath = pathname.startsWith('/doctor');
  const isAdminPath = pathname.startsWith('/admin');
  const isSponsorPath = pathname.startsWith('/sponsor');
  const isDashboardPath = isPatientPath || isDoctorPath || isAdminPath || isSponsorPath;

  // 3. Handle Authentication Logic
  
  // If user is trying to access a dashboard but isn't logged in
  if (isDashboardPath && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is logged in but tries to access login/register
  if (isAuthPage && token && user) {
    // Redirect to their respective dashboard
    const roleBase = user.userType === 'admin' ? '/admin' : user.userType === 'doctor' ? '/doctor' : user.userType === 'sponsor' ? '/sponsor' : '/patient';
    return NextResponse.redirect(new URL(roleBase, request.url));
  }

  // 4. Handle Role-based Authorization
  if (token && user) {
    if (isPatientPath && user.userType !== 'patient') {
      const target = user.userType === 'admin' ? '/admin' : '/doctor';
      return NextResponse.redirect(new URL(target, request.url));
    }
    if (isDoctorPath && user.userType !== 'doctor') {
      const target = user.userType === 'admin' ? '/admin' : '/patient';
      return NextResponse.redirect(new URL(target, request.url));
    }
    if (isSponsorPath && user.userType !== 'sponsor') {
      const target = user.userType === 'admin' ? '/admin' : user.userType === 'doctor' ? '/doctor' : '/patient';
      return NextResponse.redirect(new URL(target, request.url));
    }
    if (isAdminPath && user.userType !== 'admin') {
      const target = user.userType === 'doctor' ? '/doctor' : '/patient';
      return NextResponse.redirect(new URL(target, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /assets, /images, /favicon.ico (static assets)
     */
    '/((?!api|_next|assets|images|favicon.ico).*)',
  ],
};
