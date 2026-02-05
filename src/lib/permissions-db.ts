// Server-side only: Database permission helpers
import { UserRole } from '@/types';
import { query } from '@/lib/db';
import { Permission } from './permissions';

interface RolePermission {
  role: UserRole;
  permission: Permission;
}

// Cache สำหรับเก็บ permissions (ลด query ไป database)
let permissionsCache: Record<UserRole, Permission[]> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 1 นาที

// ดึง permissions จาก database
async function getRolePermissionsFromDB(): Promise<Record<UserRole, Permission[]>> {
  try {
    const results = await query<RolePermission>(
      'SELECT role, permission FROM role_permissions ORDER BY role, permission'
    );

    const permissions: Record<UserRole, Permission[]> = {
      admin: [],
      operator: [],
      worker: [],
      user: [],
    };

    results.forEach(row => {
      if (permissions[row.role]) {
        permissions[row.role].push(row.permission);
      }
    });

    return permissions;
  } catch (error) {
    console.error('Error fetching permissions from database:', error);
    // Return empty if error - API will use fallback
    return {
      admin: [],
      operator: [],
      worker: [],
      user: [],
    };
  }
}

// ดึง permissions พร้อม cache
export async function getRolePermissions(): Promise<Record<UserRole, Permission[]>> {
  const now = Date.now();
  
  // ใช้ cache ถ้ายังไม่หมดอายุ
  if (permissionsCache && (now - cacheTimestamp) < CACHE_TTL) {
    return permissionsCache;
  }

  // ดึงข้อมูลใหม่จาก database
  permissionsCache = await getRolePermissionsFromDB();
  cacheTimestamp = now;
  
  return permissionsCache;
}

// Clear cache (เรียกหลังจาก update permissions)
export function clearPermissionsCache() {
  permissionsCache = null;
  cacheTimestamp = 0;
}
