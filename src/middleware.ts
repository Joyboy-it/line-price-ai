import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// กำหนดสิทธิ์การเข้าถึงแต่ละหน้า
const PAGE_PERMISSIONS: Record<string, string[]> = {
  '/admin': ['admin', 'operator', 'worker'],
  '/admin/branches': ['admin'],
  '/admin/manage-groups': ['admin'],
  '/admin/users': ['admin'],
  '/admin/roles': ['admin'],
  '/admin/requests': ['admin'],
  '/admin/logs': ['admin'],
  '/admin/analytics': ['admin', 'operator'],
  '/admin/announcements': ['admin', 'operator'],
  '/admin/price-groups': ['admin', 'operator', 'worker'],
  '/admin/price-images': ['admin', 'operator', 'worker'],
};

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const pathname = request.nextUrl.pathname;

  // ตรวจสอบหน้า admin
  if (pathname.startsWith('/admin')) {
    // ไม่มี token -> redirect ไป signin
    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }

    const role = token.role as string;

    // หา permission ที่ตรงกับ pathname
    let allowedRoles: string[] | undefined;
    
    // ตรวจสอบ exact match ก่อน
    if (PAGE_PERMISSIONS[pathname]) {
      allowedRoles = PAGE_PERMISSIONS[pathname];
    } else {
      // ตรวจสอบ prefix match
      for (const [path, roles] of Object.entries(PAGE_PERMISSIONS)) {
        if (pathname.startsWith(path + '/')) {
          allowedRoles = roles;
          break;
        }
      }
    }

    // ถ้าไม่พบ permission -> ใช้ default (admin, operator, worker)
    if (!allowedRoles) {
      allowedRoles = ['admin', 'operator', 'worker'];
    }

    // ตรวจสอบสิทธิ์
    if (!allowedRoles.includes(role)) {
      // ถ้าไม่มีสิทธิ์ -> redirect ไป /admin
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
