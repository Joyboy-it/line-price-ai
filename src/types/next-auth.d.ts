import { DefaultSession, DefaultUser } from 'next-auth';
import { UserRole } from './index';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      provider_id: string;
      shop_name?: string | null;
      is_active: boolean;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    id: string;
    role: UserRole;
    provider_id: string;
    shop_name?: string | null;
    is_active: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    provider_id: string;
    shop_name?: string | null;
    is_active: boolean;
  }
}
