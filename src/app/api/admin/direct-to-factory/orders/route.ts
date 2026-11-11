import { NextRequest, NextResponse } from 'next/server';
import { requireStaff } from '@/lib/direct-to-factory/customer-access';
import { listStaffOrders, STAFF_PAGE_SIZE } from '@/lib/direct-to-factory/queries';
import { parseStaffOrderFilters } from '@/lib/direct-to-factory/validation';

export async function GET(request: NextRequest) {
  const guard = await requireStaff();
  if (guard.error) return guard.error;

  try {
    const filters = parseStaffOrderFilters((key) => request.nextUrl.searchParams.get(key));
    const result = await listStaffOrders(filters);
    return NextResponse.json({ ...result, page: filters.page, pageSize: STAFF_PAGE_SIZE });
  } catch (error) {
    console.error('Error listing staff orders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
