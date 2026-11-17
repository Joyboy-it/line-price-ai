import { NextResponse } from 'next/server';
import { getServerSession, type Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';
import { getCustomerOrder, getOrder } from './queries';
import type { FactoryOrderRecord } from './types';

export type FactoryAccess = 'view' | 'create';

const FACTORY_ACCESS_COLUMN: Record<FactoryAccess, string> = {
  view: 'can_view_factory_orders',
  create: 'can_create_factory_order',
};

/** Approved, active, and allowed to see the list or to open the new-order form. */
export async function hasFactoryAccess(userId: string, access: FactoryAccess): Promise<boolean> {
  const column = FACTORY_ACCESS_COLUMN[access];
  const row = await queryOne<{ ok: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM users u
       JOIN access_requests ar ON ar.user_id = u.id
       WHERE u.id = $1 AND u.is_active = true AND u.${column} = true AND ar.status = 'approved'
     ) AS ok`,
    [userId]
  );
  return row?.ok === true;
}

export async function getFactoryHomeAccess(userId: string): Promise<{ view: boolean; create: boolean }> {
  const view = await hasFactoryAccess(userId, 'view');
  return { view, create: view };
}

/** Approved, active, and allowed to open แจ้งรับสินค้า. Separate from factory orders. */
export async function canReceiveGoods(userId: string): Promise<boolean> {
  const row = await queryOne<{ ok: boolean }>(
    `SELECT EXISTS (
       SELECT 1 FROM users u
       JOIN access_requests ar ON ar.user_id = u.id
       WHERE u.id = $1 AND u.is_active = true AND u.can_receive_goods = true AND ar.status = 'approved'
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
  if (!(await hasFactoryAccess(session.user.id, 'view'))) return null;
  return getCustomerOrder(orderId, session.user.id);
}

export async function requireCustomer(access: FactoryAccess): Promise<Guard> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  if (!(await hasFactoryAccess(session.user.id, access))) {
    return { error: NextResponse.json({ error: 'บัญชีนี้ยังไม่ได้รับอนุญาตให้ใช้ส่วนนี้' }, { status: 403 }) };
  }
  return { session };
}
