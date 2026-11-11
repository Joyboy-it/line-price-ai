import { NextResponse } from 'next/server';
import { getServerSession, type Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';
import { getCustomerOrder, getOrder } from './queries';
import type { FactoryOrderRecord } from './types';

/** Same rule as the approved user list in /admin/users: an approved request and an active account. */
export async function isApprovedCustomer(userId: string): Promise<boolean> {
  const row = await queryOne<{ ok: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM users u
       JOIN access_requests ar ON ar.user_id = u.id
       WHERE u.id = $1 AND u.is_active = true AND ar.status = 'approved'
     ) AS ok`,
    [userId]
  );
  return row?.ok === true;
}

export function isStaff(session: Session | null): boolean {
  return !!session?.user && hasPermission(session.user.role, 'manage_factory_orders');
}

type Guard = { session: Session; error?: never } | { session?: never; error: NextResponse };

export async function requireStaff(): Promise<Guard> {
  const session = await getServerSession(authOptions);
  if (!session?.user || !isStaff(session)) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { session };
}

/** The order if the signed-in user is staff, or is the approved customer who owns it. */
export async function getOrderForViewer(orderId: string): Promise<FactoryOrderRecord | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  if (isStaff(session)) return getOrder(orderId);
  if (!(await isApprovedCustomer(session.user.id))) return null;
  return getCustomerOrder(orderId, session.user.id);
}

export async function requireCustomer(): Promise<Guard> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  if (!(await isApprovedCustomer(session.user.id))) {
    return { error: NextResponse.json({ error: 'บัญชีนี้ยังไม่ได้รับอนุญาตให้แจ้งส่งตรงเข้าโรงงาน' }, { status: 403 }) };
  }
  return { session };
}
