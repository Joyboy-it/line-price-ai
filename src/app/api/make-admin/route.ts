import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Update user role to admin
    await query(
      `UPDATE users SET role = 'admin' WHERE id = $1`,
      [userId]
    );

    return NextResponse.json({ success: true, message: 'User is now admin' });
  } catch (error) {
    console.error('Make admin error:', error);
    return NextResponse.json({ error: 'Failed to make admin' }, { status: 500 });
  }
}

// GET endpoint to make Test User admin
export async function GET() {
  try {
    // Make Test User (id: 00000000-0000-0000-0000-000000000002) admin
    await query(
      `UPDATE users SET role = 'admin' WHERE id = '00000000-0000-0000-0000-000000000002'`
    );

    return NextResponse.json({ success: true, message: 'Test User is now admin' });
  } catch (error) {
    console.error('Make admin error:', error);
    return NextResponse.json({ error: 'Failed to make admin' }, { status: 500 });
  }
}
