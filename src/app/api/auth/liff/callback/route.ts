import { NextRequest, NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';
import { User } from '@/types';
import { encode } from 'next-auth/jwt';

interface LiffToken {
  id: string;
  user_id: string;
  token: string;
  used: boolean;
  expires_at: Date;
}

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/auth/signin?error=MissingToken', req.url));
    }

    const liffToken = await queryOne<LiffToken>(
      'SELECT * FROM liff_tokens WHERE token = $1 AND used = FALSE AND expires_at > NOW()',
      [token]
    );

    if (!liffToken) {
      return NextResponse.redirect(new URL('/auth/signin?error=InvalidToken', req.url));
    }

    await query('UPDATE liff_tokens SET used = TRUE WHERE id = $1', [liffToken.id]);

    const dbUser = await queryOne<User>(
      'SELECT * FROM users WHERE id = $1',
      [liffToken.user_id]
    );

    if (!dbUser || !dbUser.is_active) {
      return NextResponse.redirect(new URL('/auth/signin?error=AccessDenied', req.url));
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

    const response = NextResponse.redirect(new URL('/', req.url));
    response.cookies.set(cookieName, sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: isProduction,
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error('LIFF callback error:', error);
    return NextResponse.redirect(new URL('/auth/signin?error=Callback', req.url));
  }
}
