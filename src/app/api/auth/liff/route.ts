import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { User } from '@/types';
import { encode } from 'next-auth/jwt';
import { cookies } from 'next/headers';

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
    } else {
      dbUser = await queryOne<User>(
        `INSERT INTO users (provider_id, provider, name, image, role, is_active)
         VALUES ($1, $2, $3, $4, 'user', true)
         RETURNING *`,
        [userId, 'line', displayName, pictureUrl || null]
      );
    }

    if (!dbUser) {
      return NextResponse.json({ error: 'Failed to create/find user' }, { status: 500 });
    }

    const secret = process.env.NEXTAUTH_SECRET!;
    const tokenData = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email || null,
      picture: dbUser.image,
      role: dbUser.role,
      provider_id: dbUser.provider_id,
      shop_name: dbUser.shop_name,
      is_active: dbUser.is_active,
      sub: dbUser.provider_id,
    };

    const sessionToken = await encode({
      token: tokenData,
      secret,
      maxAge: 30 * 24 * 60 * 60,
    });

    const isProduction = process.env.NODE_ENV === 'production';
    const cookieName = isProduction ? '__Secure-next-auth.session-token' : 'next-auth.session-token';

    const cookieStore = await cookies();
    cookieStore.set(cookieName, sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: isProduction,
      maxAge: 30 * 24 * 60 * 60,
    });

    return NextResponse.json({ callbackUrl: '/', success: true });
  } catch (error) {
    console.error('LIFF auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
