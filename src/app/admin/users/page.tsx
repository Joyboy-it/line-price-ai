import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Users, Search, Filter, FileText, Tag, Edit, Trash2, Shield } from 'lucide-react';
import { User, PriceGroup } from '@/types';
import UserList from './UserList';

interface UserWithGroups extends User {
  groups: PriceGroup[];
  branches: string[];
}

async function getUsers(): Promise<UserWithGroups[]> {
  // แสดงเฉพาะผู้ใช้ที่ผ่านการอนุมัติแล้ว (มี access_request ที่ approved)
  const users = await query<User>(
    `SELECT DISTINCT u.* FROM users u
     INNER JOIN access_requests ar ON ar.user_id = u.id
     WHERE ar.status = 'approved'
     ORDER BY u.created_at DESC`
  );

  const usersWithGroups = await Promise.all(
    users.map(async (user) => {
      const groups = await query<PriceGroup>(
        `SELECT pg.* FROM price_groups pg
         INNER JOIN user_group_access uga ON uga.price_group_id = pg.id
         WHERE uga.user_id = $1`,
        [user.id]
      );
      const branches = await query<{ name: string }>(
        `SELECT b.name FROM branches b
         INNER JOIN user_branches ub ON ub.branch_id = b.id
         WHERE ub.user_id = $1`,
        [user.id]
      );
      return {
        ...user,
        groups,
        branches: branches.map((b) => b.name),
      };
    })
  );

  return usersWithGroups;
}

async function getAllPriceGroups(): Promise<PriceGroup[]> {
  return query<PriceGroup>(
    `SELECT * FROM price_groups WHERE is_active = true ORDER BY sort_order, name`
  );
}

async function getAllBranches() {
  return query<{ id: string; name: string; code: string }>(
    `SELECT id, name, code FROM branches WHERE is_active = true ORDER BY sort_order, name`
  );
}

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);

  const [users, priceGroups, branches] = await Promise.all([
    getUsers(),
    getAllPriceGroups(),
    getAllBranches(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-green-600 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        กลับ
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
          <Users className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">จัดการผู้ใช้</h1>
          <p className="text-gray-600">แก้ไขกลุ่มและสิทธิ์ของผู้ใช้</p>
        </div>
      </div>

      <UserList 
        users={users} 
        priceGroups={priceGroups} 
        branches={branches}
        currentUserRole={(session?.user?.role || 'user') as 'admin' | 'operator' | 'worker' | 'user'}
      />
    </div>
  );
}
