import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Mapping: path -> required permission
// ถ้าไม่มีใน mapping = ต้องการแค่ view_dashboard
const PATH_TO_PERMISSION: Record<string, string> = {
  '/admin/branches': 'manage_branches',
  '/admin/manage-groups': 'manage_price_groups',
  '/admin/users': 'manage_users',
  '/admin/roles': 'manage_roles',
  '/admin/requests': 'approve_requests',
  '/admin/logs': 'manage_roles', // admin only
  '/admin/analytics': 'view_analytics',
  '/admin/announcements': 'manage_announcements',
  '/admin/price-groups': 'upload_images',
  '/admin/price-images': 'upload_images',
};

// Default permissions สำหรับแต่ละ role (fallback)
const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: [
    'view_dashboard', 'manage_users', 'toggle_user_status', 'manage_branches',
    'manage_price_groups', 'upload_images', 'manage_announcements',
    'approve_requests', 'view_analytics', 'manage_roles',
  ],
  operator: [
    'view_dashboard', 'manage_users', 'manage_branches', 'manage_price_groups',
    'upload_images', 'manage_announcements', 'approve_requests', 'view_analytics',
  ],
  worker: ['view_dashboard', 'upload_images'],
  user: [],
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

    // Admin มีสิทธิ์ทุกอย่าง
    if (role === 'admin') {
      return NextResponse.next();
    }

    // หา permission ที่ต้องการสำหรับ path นี้
    let requiredPermission: string | undefined;
    
    // ตรวจสอบ exact match ก่อน
    if (PATH_TO_PERMISSION[pathname]) {
      requiredPermission = PATH_TO_PERMISSION[pathname];
    } else {
      // ตรวจสอบ prefix match
      for (const [path, permission] of Object.entries(PATH_TO_PERMISSION)) {
        if (pathname.startsWith(path + '/')) {
          requiredPermission = permission;
          break;
        }
      }
    }

    // ถ้าไม่พบ permission -> ต้องการแค่ view_dashboard
    if (!requiredPermission) {
      requiredPermission = 'view_dashboard';
    }

    // ตรวจสอบว่า role มีสิทธิ์หรือไม่ (ใช้ default permissions)
    const rolePermissions = DEFAULT_ROLE_PERMISSIONS[role] || [];
    
    if (!rolePermissions.includes(requiredPermission)) {
      // ถ้าไม่มีสิทธิ์ -> redirect ไป /admin
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
