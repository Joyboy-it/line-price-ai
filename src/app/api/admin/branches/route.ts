import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { Branch } from '@/types';
import { logActionWithIp } from '@/lib/log-helper';
import { hasPermission } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';

export async function GET() {
  try {
    const branches = await query<{
      id: string;
      name: string;
      code: string;
      sort_order: number;
      is_active: boolean;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT * FROM branches ORDER BY sort_order, name`
    );

    return NextResponse.json(branches);
  } catch (error) {
    console.error('Error fetching branches:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user || !hasPermission(session.user.role, 'manage_branches')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, code, is_active } = body;

    if (!name || !code) {
      return NextResponse.json({ error: 'Name and code are required' }, { status: 400 });
    }

    // Get max sort_order and increment by 1
    const maxOrder = await query<{ max: number }>(
      `SELECT COALESCE(MAX(sort_order), 0) as max FROM branches`
    );
    const nextOrder = ((maxOrder as any)[0]?.max || 0) + 1;

    const branch = await query(
      `INSERT INTO branches (name, code, sort_order, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, code.toUpperCase(), nextOrder, is_active ?? true]
    );

    await logActionWithIp(request, session.user.id, 'create_branch', 'branch', (branch as any)[0].id, {
      name,
      code,
    });

    revalidatePath('/admin/branches');
    revalidatePath('/admin/manage-groups');

    return NextResponse.json((branch as any)[0]);
  } catch (error) {
    console.error('Error creating branch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
