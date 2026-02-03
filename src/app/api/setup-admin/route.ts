import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST() {
  try {
    // Create admin user for testing
    await query(
      `INSERT INTO users (id, provider_id, provider, name, email, role, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (provider, provider_id) DO NOTHING`,
      [
        '00000000-0000-0000-0000-000000000001',
        'admin_test',
        'manual',
        'Admin User',
        'admin@test.com',
        'admin',
        true
      ]
    );

    return NextResponse.json({ success: true, message: 'Admin user created' });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ error: 'Failed to setup admin' }, { status: 500 });
  }
}
