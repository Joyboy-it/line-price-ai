import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const branches = await query<{ id: string; name: string; code: string }>(
      `SELECT id, name, code FROM branches WHERE is_active = true ORDER BY sort_order, name`
    );

    return NextResponse.json(branches);
  } catch (error) {
    console.error('Error fetching branches:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
