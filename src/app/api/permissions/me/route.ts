import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getRolePermissions } from '@/lib/permissions-db';

// GET /api/permissions/me - ดึงสิทธิ์ของ user ปัจจุบัน
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const role = session.user.role;
    
    // ดึงสิทธิ์ทั้งหมดจาก database
    const allPermissions = await getRolePermissions();
    
    // ส่งกลับเฉพาะสิทธิ์ของ role นี้
    const userPermissions = allPermissions[role] || [];

    return NextResponse.json({
      role,
      permissions: userPermissions,
    });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
