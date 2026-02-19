import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
import { User, PriceGroup } from '@/types';
import UserList from './UserList';

const PAGE_SIZE = 100;

interface UserWithGroups extends User {
  groups: PriceGroup[];
  branches: string[];
}

interface GetUsersOptions {
  page: number;
  search: string;
  branch: string;
  role: string;
  status: string;
}

async function getUsers(opts: GetUsersOptions): Promise<{ users: UserWithGroups[]; totalCount: number }> {
  const { page, search, branch, role, status } = opts;
  const offset = (page - 1) * PAGE_SIZE;

  const conditions: string[] = ['ar.status = \'approved\''];
  const params: unknown[] = [];
  let idx = 1;

  if (search) {
    conditions.push(`(u.name ILIKE $${idx} OR u.shop_name ILIKE $${idx} OR u.phone ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }
  if (role && role !== 'ทั้งหมด') {
    conditions.push(`u.role = $${idx}`);
    params.push(role);
    idx++;
  }
  if (status && status !== 'ทั้งหมด') {
    conditions.push(`u.is_active = $${idx}`);
    params.push(status === 'active');
    idx++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(DISTINCT u.id) as count FROM users u
     INNER JOIN access_requests ar ON ar.user_id = u.id
     ${whereClause}`,
    params
  );
  const totalCount = parseInt(countResult[0]?.count || '0');

  let users = await query<User>(
    `SELECT DISTINCT u.* FROM users u
     INNER JOIN access_requests ar ON ar.user_id = u.id
     ${whereClause}
     ORDER BY u.created_at DESC
     LIMIT ${PAGE_SIZE} OFFSET ${offset}`,
    params
  );

  if (branch && branch !== 'ทั้งหมด') {
    const branchFiltered = await Promise.all(
      users.map(async (user) => {
        const bs = await query<{ name: string }>(
          `SELECT b.name FROM branches b INNER JOIN user_branches ub ON ub.branch_id = b.id WHERE ub.user_id = $1`,
          [user.id]
        );
        return bs.some((b) => b.name === branch) ? user : null;
      })
    );
    users = branchFiltered.filter(Boolean) as User[];
  }

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
      return { ...user, groups, branches: branches.map((b) => b.name) };
    })
  );

  return { users: usersWithGroups, totalCount };
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

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string; branch?: string; role?: string; status?: string }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  const sp = await searchParams;

  const page = Math.max(1, parseInt(sp.page || '1'));
  const search = sp.search || '';
  const branch = sp.branch || 'ทั้งหมด';
  const role = sp.role || 'ทั้งหมด';
  const status = sp.status || 'ทั้งหมด';

  const [{ users, totalCount }, priceGroups, branches] = await Promise.all([
    getUsers({ page, search, branch, role, status }),
    getAllPriceGroups(),
    getAllBranches(),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

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
        totalCount={totalCount}
        currentPage={page}
        totalPages={totalPages}
        currentSearch={search}
        currentBranch={branch}
        currentRole={role}
        currentStatus={status}
      />
    </div>
  );
}
