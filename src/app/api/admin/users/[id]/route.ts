import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { User } from '@/types';
import { logActionWithIp } from '@/lib/log-helper';
import { hasPermission } from '@/lib/permissions';
import { revalidatePath } from 'next/cache';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user || !hasPermission(session.user.role, 'manage_users')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await queryOne<User>(
    `SELECT * FROM users WHERE id = $1`,
    [id]
  );

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json(user);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user || !hasPermission(session.user.role, 'manage_users')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { shop_name, phone, address, bank_info, note, role, is_active } = body;

    // Build dynamic update query based on provided fields
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (shop_name !== undefined) {
      updateFields.push(`shop_name = COALESCE($${paramIndex}, shop_name)`);
      updateValues.push(shop_name);
      paramIndex++;
    }

    if (phone !== undefined) {
      updateFields.push(`phone = COALESCE($${paramIndex}, phone)`);
      updateValues.push(phone);
      paramIndex++;
    }

    if (address !== undefined) {
      updateFields.push(`address = COALESCE($${paramIndex}, address)`);
      updateValues.push(address);
      paramIndex++;
    }

    if (bank_info !== undefined) {
      updateFields.push(`bank_info = COALESCE($${paramIndex}, bank_info)`);
      updateValues.push(bank_info ? JSON.stringify(bank_info) : null);
      paramIndex++;
    }

    if (note !== undefined) {
      updateFields.push(`note = COALESCE($${paramIndex}, note)`);
      updateValues.push(note);
      paramIndex++;
    }

    if (role !== undefined) {
      updateFields.push(`role = $${paramIndex}`);
      updateValues.push(role);
      paramIndex++;
    }

    if (is_active !== undefined) {
      updateFields.push(`is_active = $${paramIndex}`);
      updateValues.push(is_active);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    updateValues.push(id);

    const updated = await queryOne<User>(
      `UPDATE users 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      updateValues
    );

    await logActionWithIp(request, session.user.id, 'update_user', 'user', id, {
      shop_name,
      phone,
      address,
      role,
      is_active,
    });

    revalidatePath('/admin/users');
    revalidatePath('/admin');

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const { id } = await params;

  if (!session?.user || !hasPermission(session.user.role, 'manage_users')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await queryOne<User>(
      `SELECT * FROM users WHERE id = $1`,
      [id]
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Soft delete by setting is_active to false
    await query(
      `UPDATE users SET is_active = false WHERE id = $1`,
      [id]
    );

    await logActionWithIp(request, session.user.id, 'delete_user', 'user', id, {
      name: user.name,
    });

    revalidatePath('/admin/users');
    revalidatePath('/admin');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
