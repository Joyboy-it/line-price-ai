import { NextResponse } from 'next/server';
import { requireCustomer } from '@/lib/direct-to-factory/customer-access';
import { listFactoryOptions } from '@/lib/direct-to-factory/queries';

export async function GET() {
  const guard = await requireCustomer();
  if (guard.error) return guard.error;

  try {
    return NextResponse.json(await listFactoryOptions());
  } catch (error) {
    console.error('Error listing factory options:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
