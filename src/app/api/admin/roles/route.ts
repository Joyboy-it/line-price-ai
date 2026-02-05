import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';
import { logActionWithIp } from '@/lib/log-helper';
import { getRolePermissions, clearPermissionsCache } from '@/lib/permissions-db';

// GET /api/admin/roles - ดึงข้อมูลสิทธิ์ทั้งหมด
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !hasPermission(session.user.role, 'manage_roles')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const rolePermissions = await getRolePermissions();
    return NextResponse.json(rolePermissions);
  } catch (error) {
    console.error('Error fetching role permissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/roles - อัปเดตสิทธิ์ของ role
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !hasPermission(session.user.role, 'manage_roles')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { role, permissions } = body;

    if (!role || !Array.isArray(permissions)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // ป้องกันการแก้ไขสิทธิ์ของ admin
    if (role === 'admin') {
      return NextResponse.json({ error: 'Cannot modify admin permissions' }, { status: 403 });
    }

    // ตรวจสอบว่า role ถูกต้อง
    const validRoles = ['operator', 'worker', 'user'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // เริ่ม transaction
    // 1. ลบสิทธิ์เดิมทั้งหมดของ role นี้
    await query(
      `DELETE FROM role_permissions WHERE role = $1`,
      [role]
    );

    // 2. เพิ่มสิทธิ์ใหม่
    if (permissions.length > 0) {
      const values = permissions.map((permission: string, index: number) => 
        `($1, $${index + 2})`
      ).join(', ');

      await query(
        `INSERT INTO role_permissions (role, permission) VALUES ${values}`,
        [role, ...permissions]
      );
    }

    // Log action
    await logActionWithIp(request, session.user.id, 'update_user', 'role_permissions', role, {
      role,
      permissions,
    });

    // Clear cache เพื่อให้ดึงข้อมูลใหม่
    clearPermissionsCache();

    return NextResponse.json({ 
      success: true,
      message: `Updated permissions for ${role}`,
      role,
      permissions,
    });
  } catch (error) {
    console.error('Error updating role permissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
