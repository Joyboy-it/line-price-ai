import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { User } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { logAction } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { userId, displayName, pictureUrl, accessToken } = await req.json();

    if (!userId || !displayName || !accessToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const verifyRes = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!verifyRes.ok) {
      return NextResponse.json({ error: 'Invalid LINE access token' }, { status: 401 });
    }

    const lineProfile = await verifyRes.json();

    if (lineProfile.userId !== userId) {
      return NextResponse.json({ error: 'User ID mismatch' }, { status: 401 });
    }

    let dbUser = await queryOne<User>(
      'SELECT * FROM users WHERE provider = $1 AND provider_id = $2',
      ['line', userId]
    );

    if (dbUser) {
      if (!dbUser.is_active) {
        return NextResponse.json({ error: 'บัญชีถูกระงับการใช้งาน' }, { status: 403 });
      }
      await query(
        'UPDATE users SET name = $1, image = $2, last_login_at = NOW() WHERE id = $3',
        [displayName, pictureUrl || null, dbUser.id]
      );
      await logAction(dbUser.id, 'login', 'user', dbUser.id, { method: 'liff' });
    } else {
      dbUser = await queryOne<User>(
        `INSERT INTO users (provider_id, provider, name, image, role, is_active)
         VALUES ($1, $2, $3, $4, 'user', true)
         RETURNING *`,
        [userId, 'line', displayName, pictureUrl || null]
      );
      if (dbUser) {
        await logAction(dbUser.id, 'register', 'user', dbUser.id, { method: 'liff' });
      }
    }

    if (!dbUser) {
      return NextResponse.json({ error: 'Failed to create/find user' }, { status: 500 });
    }

    const oneTimeToken = uuidv4();
    await query(
      `INSERT INTO liff_tokens (user_id, token) VALUES ($1, $2)`,
      [dbUser.id, oneTimeToken]
    );

    // Cleanup expired tokens
    await query('DELETE FROM liff_tokens WHERE expires_at < NOW()');

    return NextResponse.json({
      success: true,
      token: oneTimeToken,
    });
  } catch (error) {
    console.error('LIFF auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
