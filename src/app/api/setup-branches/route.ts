import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function POST() {
  try {
    await query(
      `INSERT INTO branches (name, code, sort_order, is_active) VALUES
        ('กรุงเทพมหานคร', 'BKK', 1, true),
        ('เชียงใหม่', 'CNX', 2, true),
        ('ภูเก็ต', 'HKT', 3, true),
        ('ขอนแก่น', 'KKC', 4, true),
        ('สงขลา', 'SGZ', 5, true)
       ON CONFLICT (code) DO NOTHING`
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Branches created successfully',
      branches: [
        'กรุงเทพมหานคร (BKK)',
        'เชียงใหม่ (CNX)',
        'ภูเก็ต (HKT)',
        'ขอนแก่น (KKC)',
        'สงขลา (SGZ)'
      ]
    });
  } catch (error) {
    console.error('Setup branches error:', error);
    return NextResponse.json({ error: 'Failed to create branches' }, { status: 500 });
  }
}
