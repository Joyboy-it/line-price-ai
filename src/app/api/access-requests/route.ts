import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, logAction } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { AccessRequest } from '@/types';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isAdmin = session.user.role === 'admin' || session.user.role === 'operator';

  if (isAdmin) {
    const requests = await query<AccessRequest>(
      `SELECT ar.*, 
        json_build_object('id', u.id, 'name', u.name, 'image', u.image, 'email', u.email) as user
       FROM access_requests ar
       JOIN users u ON u.id = ar.user_id
       ORDER BY ar.created_at DESC`
    );
    return NextResponse.json(requests);
  } else {
    const requests = await query<AccessRequest>(
      `SELECT * FROM access_requests WHERE user_id = $1 ORDER BY created_at DESC`,
      [session.user.id]
    );
    return NextResponse.json(requests);
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { shop_name, note, branch_id } = body;

    if (!shop_name) {
      return NextResponse.json({ error: 'Shop name is required' }, { status: 400 });
    }

    const existingPending = await queryOne<AccessRequest>(
      `SELECT * FROM access_requests WHERE user_id = $1 AND status = 'pending'`,
      [session.user.id]
    );

    if (existingPending) {
      return NextResponse.json({ error: 'You already have a pending request' }, { status: 400 });
    }

    const newRequest = await queryOne<AccessRequest>(
      `INSERT INTO access_requests (user_id, shop_name, note, branch_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [session.user.id, shop_name, note || null, branch_id || null]
    );

    if (shop_name && !session.user.shop_name) {
      await query(
        `UPDATE users SET shop_name = $1 WHERE id = $2`,
        [shop_name, session.user.id]
      );
    }

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error('Error creating access request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
