import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST() {
  try {
    // Create test users
    await query(
      `INSERT INTO users (id, provider_id, provider, name, email, role, is_active)
       VALUES 
        ('00000000-0000-0000-0000-000000000001', 'test_admin', 'credentials', 'Admin User', 'admin@test.com', 'admin', true),
        ('00000000-0000-0000-0000-000000000002', 'test_user', 'credentials', 'Test User', 'user@test.com', 'user', true)
       ON CONFLICT (provider, provider_id) DO NOTHING`
    );

    // Create sample price groups
    await query(
      `INSERT INTO price_groups (id, name, description, is_active, sort_order)
       VALUES 
        ('00000000-0000-0000-0000-000000000001', 'ราคาพลาสติก', 'ราคาพลาสติกขาว ขาวแดง ทุกขนาด', true, 1),
        ('00000000-0000-0000-0000-000000000002', 'ราคากระดาษ', 'ราคากระดาษลัง กล่อง ทุกชนิด', true, 2)
       ON CONFLICT DO NOTHING`
    );

    // Create sample announcement
    await query(
      `INSERT INTO announcements (id, title, body, is_published, created_by)
       VALUES 
        ('00000000-0000-0000-0000-000000000001', 'ประกาศราคาใหม่', 'มีการปรับราคาซื้อพลาสติกขาวและกระดาษลัง ตั้งแต่วันที่ 1 กุมภาพันธ์ 2568', true, '00000000-0000-0000-0000-000000000001')
       ON CONFLICT DO NOTHING`
    );

    return NextResponse.json({ success: true, message: 'Test data created' });
  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({ error: 'Failed to setup test data' }, { status: 500 });
  }
}
