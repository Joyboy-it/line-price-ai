import { UserRole } from '@/types';

export type Permission =
  | 'view_dashboard'
  | 'manage_users'
  | 'toggle_user_status'
  | 'manage_branches'
  | 'manage_price_groups'
  | 'upload_images'
  | 'manage_announcements'
  | 'approve_requests'
  | 'view_analytics'
  | 'manage_roles';

// Default permissions (ใช้ทั้ง client และ server)
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'view_dashboard',
    'manage_users',
    'toggle_user_status',
    'manage_branches',
    'manage_price_groups',
    'upload_images',
    'manage_announcements',
    'approve_requests',
    'view_analytics',
    'manage_roles',
  ],
  operator: [
    'view_dashboard',
    'manage_users',
    'manage_branches',
    'manage_price_groups',
    'upload_images',
    'manage_announcements',
    'approve_requests',
    'view_analytics',
  ],
  worker: [
    'view_dashboard',
    'upload_images',
  ],
  user: [],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

export function canAccessAdmin(role: UserRole): boolean {
  return hasPermission(role, 'view_dashboard');
}
