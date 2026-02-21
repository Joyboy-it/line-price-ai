import { NextAuthOptions } from 'next-auth';
import { query, queryOne } from './db';
import { User } from '@/types';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    state: {
      name: 'next-auth.state',
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true,
        maxAge: 900,
      },
    },
  },
  debug: true,
  providers: [
    {
      id: 'line',
      name: 'LINE',
      type: 'oauth',
      authorization: {
        url: 'https://access.line.me/oauth2/v2.1/authorize',
        params: { scope: 'profile' }
      },
      token: 'https://api.line.me/oauth2/v2.1/token',
      userinfo: 'https://api.line.me/v2/profile',
      checks: ['state'],
      profile(profile) {
        return {
          id: profile.userId,
          name: profile.displayName,
          email: profile.email || null,
          image: profile.pictureUrl,
          role: 'user' as const,
          provider_id: profile.userId,
          is_active: true,
        };
      },
      clientId: process.env.LINE_CLIENT_ID!,
      clientSecret: process.env.LINE_CLIENT_SECRET!,
    },
  ],
  callbacks: {
    async signIn({ user, account }) {
      console.log('SignIn callback - User:', user);
      console.log('SignIn callback - Account:', account);
      
      if (account?.provider === 'line') {
        try {
          const existingUser = await queryOne<User>(
            'SELECT * FROM users WHERE provider = $1 AND provider_id = $2',
            ['line', user.id]
          );

          if (existingUser) {
            if (!existingUser.is_active) {
              return false;
            }
            await query(
              'UPDATE users SET name = $1, email = $2, image = $3, last_login_at = NOW() WHERE id = $4',
              [user.name, user.email, user.image, existingUser.id]
            );
            await logAction(existingUser.id, 'login', 'user', existingUser.id);
          } else {
            const newUser = await queryOne<User>(
              `INSERT INTO users (provider_id, provider, name, email, image, role, is_active)
               VALUES ($1, $2, $3, $4, $5, 'user', true)
               RETURNING *`,
              [user.id, 'line', user.name, user.email, user.image]
            );
            if (newUser) {
              await logAction(newUser.id, 'register', 'user', newUser.id);
            }
          }
          return true;
        } catch (error) {
          console.error('Error during sign in:', error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      console.log('JWT callback - Account:', account);
      console.log('JWT callback - User:', user);
      
      try {
        // ครั้งแรกที่ login - ดึงข้อมูลจาก LINE profile
        if (user && account?.provider === 'line') {
          const dbUser = await queryOne<User>(
            'SELECT * FROM users WHERE provider = $1 AND provider_id = $2',
            ['line', user.id]
          );
          if (dbUser) {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.provider_id = dbUser.provider_id;
            token.shop_name = dbUser.shop_name;
            token.is_active = dbUser.is_active;
          }
        } 
        // ทุกครั้งที่มี token อยู่แล้ว - ดึง role ล่าสุดจาก database
        else if (token.id) {
          const dbUser = await queryOne<User>(
            'SELECT role, shop_name, is_active, name, image FROM users WHERE id = $1',
            [token.id]
          );
          if (dbUser) {
            token.role = dbUser.role;
            token.shop_name = dbUser.shop_name;
            token.is_active = dbUser.is_active;
            token.name = dbUser.name;
            token.picture = dbUser.image;
          }
        }
        
        console.log('JWT callback - Final token:', token);
        return token;
      } catch (error) {
        console.error('JWT callback error:', error);
        // Return minimal token to allow session to continue
        return token;
      }
    },
    async session({ session, token }) {
      console.log('Session callback - Token:', token);
      if (token && token.id) {
        session.user.id = token.id as string;
        session.user.role = (token.role || 'user') as 'user' | 'worker' | 'operator' | 'admin';
        session.user.provider_id = token.provider_id as string;
        session.user.shop_name = token.shop_name as string | undefined;
        session.user.is_active = token.is_active as boolean;
        // อัพเดทชื่อและรูปจาก DB ล่าสุด
        if (token.name) session.user.name = token.name as string;
        if (token.picture) session.user.image = token.picture as string;
      }
      console.log('Session callback - Final session:', session);
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

async function logAction(
  userId: string,
  action: string,
  entityType?: string,
  entityId?: string,
  details?: Record<string, unknown>,
  ipAddress?: string | null,
  userAgent?: string | null
) {
  try {
    await query(
      `INSERT INTO user_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        userId, 
        action, 
        entityType, 
        entityId, 
        details ? JSON.stringify(details) : null,
        ipAddress,
        userAgent
      ]
    );
  } catch (error) {
    console.error('Error logging action:', error);
  }
}

export { logAction };
