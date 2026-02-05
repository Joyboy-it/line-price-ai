import { query } from '@/lib/db';
import Link from 'next/link';
import {
  Users,
  Tag,
  Megaphone,
  FileText,
  Clock,
  CheckCircle,
  UserCheck,
  BarChart3,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';
import { DashboardStats, AccessRequest, User } from '@/types';
import { formatRelativeTime } from '@/lib/utils';

async function getDashboardStats(): Promise<DashboardStats> {
  const [pending, approved, users, groups, activeGroups, images] = await Promise.all([
    query<{ count: string }>(`SELECT COUNT(*) as count FROM access_requests WHERE status = 'pending'`),
    query<{ count: string }>(`SELECT COUNT(*) as count FROM access_requests WHERE status = 'approved'`),
    query<{ count: string }>(`SELECT COUNT(*) as count FROM users WHERE is_active = true`),
    query<{ count: string }>(`SELECT COUNT(*) as count FROM price_groups`),
    query<{ count: string }>(`SELECT COUNT(*) as count FROM price_groups WHERE is_active = true`),
    query<{ count: string }>(`SELECT COUNT(*) as count FROM price_group_images`),
  ]);

  return {
    pending_requests: parseInt(pending[0]?.count || '0'),
    approved_requests: parseInt(approved[0]?.count || '0'),
    total_users: parseInt(users[0]?.count || '0'),
    total_groups: parseInt(groups[0]?.count || '0'),
    active_groups: parseInt(activeGroups[0]?.count || '0'),
    total_images: parseInt(images[0]?.count || '0'),
  };
}

async function getPendingRequests(): Promise<(AccessRequest & { user: User })[]> {
  return query<AccessRequest & { user: User }>(
    `SELECT ar.*, 
      json_build_object(
        'id', u.id, 'name', u.name, 'image', u.image, 'email', u.email
      ) as user
     FROM access_requests ar
     JOIN users u ON u.id = ar.user_id
     WHERE ar.status = 'pending'
     ORDER BY ar.created_at DESC
     LIMIT 10`
  );
}

async function getRecentRequests(): Promise<(AccessRequest & { user: User })[]> {
  return query<AccessRequest & { user: User }>(
    `SELECT ar.*, 
      json_build_object(
        'id', u.id, 'name', u.name, 'image', u.image, 'email', u.email
      ) as user
     FROM access_requests ar
     JOIN users u ON u.id = ar.user_id
     ORDER BY ar.created_at DESC
     LIMIT 20`
  );
}

export default async function AdminDashboardPage() {
  const [stats, pendingRequests, recentRequests] = await Promise.all([
    getDashboardStats(),
    getPendingRequests(),
    getRecentRequests(),
  ]);

  const quickActions = [
    { href: '/admin/users', icon: Users, label: 'จัดการผู้ใช้', desc: 'ผู้ใช้งานในระบบ', bgColor: 'bg-blue-50', borderColor: 'border-blue-100', iconColor: 'text-blue-600' },
    { href: '/admin/manage-groups', icon: Tag, label: 'จัดการกลุ่มราคา', desc: 'เพิ่ม/แก้ไข/ลบกลุ่ม', bgColor: 'bg-green-50', borderColor: 'border-green-100', iconColor: 'text-green-600' },
    { href: '/admin/announcements', icon: Megaphone, label: 'จัดการประกาศ', desc: 'ประกาศประชาสัมพันธ์', bgColor: 'bg-purple-50', borderColor: 'border-purple-100', iconColor: 'text-purple-600' },
    { href: '/admin/price-images', icon: ImageIcon, label: 'จัดการรูปภาพราคา', desc: 'อัปโหลด/แก้ไขรูป', bgColor: 'bg-orange-50', borderColor: 'border-orange-100', iconColor: 'text-orange-600' },
    { href: '/admin/logs', icon: FileText, label: 'ประวัติใช้งาน', desc: 'ประวัติการใช้งาน', bgColor: 'bg-slate-50', borderColor: 'border-slate-100', iconColor: 'text-slate-600' },
    { href: '/admin/analytics', icon: BarChart3, label: 'Analytics Dashboard', desc: 'สถิติและกราฟ', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-100', iconColor: 'text-indigo-600' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-600">จัดการคำขอสิทธิ์และผู้ใช้งาน</p>
        </div>
      </div>

      {/* Quick Actions */}
      <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">⚡ Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={`flex items-center gap-3 p-4 ${action.bgColor} rounded-lg border ${action.borderColor} hover:shadow-md transition`}
            >
              <action.icon className={`w-5 h-5 ${action.iconColor}`} />
              <div>
                <p className="font-medium text-gray-900 text-sm">{action.label}</p>
                <p className="text-xs text-gray-500">{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="mb-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.pending_requests}</p>
                <p className="text-sm text-gray-500">รอการอนุมัติ</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.total_users}</p>
                <p className="text-sm text-gray-500">ผู้ใช้ทั้งหมด</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Tag className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.total_groups}</p>
                <p className="text-sm text-gray-500">กลุ่มราคา</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.active_groups}</p>
                <p className="text-sm text-gray-500">Active {Math.round((stats.active_groups / stats.total_groups) * 100 || 0)}%</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.total_images}</p>
                <p className="text-sm text-gray-500">รูปภาพทั้งหมด</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pending Requests */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">คำขอที่รออนุมัติ</h2>
        <div className="bg-white rounded-lg border border-gray-200">
          {pendingRequests.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              ไม่มีคำขอที่รออนุมัติ
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {pendingRequests.map((request) => (
                <div key={request.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">
                        {typeof request.user === 'object' ? request.user.name : 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-500">ร้าน: {request.shop_name}</p>
                    </div>
                  </div>
                  <Link
                    href={`/admin/requests/${request.id}`}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
                  >
                    อนุมัติแล้ว
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Recent Requests History */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">ประวัติคำขอ</h2>
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">แสดง {recentRequests.length} รายการล่าสุด</span>
            <input
              type="text"
              placeholder="ค้นหาชื่อผู้ใช้..."
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {recentRequests.map((request) => (
              <div key={request.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    request.status === 'approved' ? 'bg-green-100' :
                    request.status === 'rejected' ? 'bg-red-100' : 'bg-yellow-100'
                  }`}>
                    <CheckCircle className={`w-4 h-4 ${
                      request.status === 'approved' ? 'text-green-600' :
                      request.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {typeof request.user === 'object' ? request.user.name : 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-500">ร้าน: {request.shop_name}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  request.status === 'approved' ? 'bg-green-100 text-green-700' :
                  request.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {request.status === 'approved' ? 'อนุมัติแล้ว' :
                   request.status === 'rejected' ? 'ปฏิเสธแล้ว' : 'รออนุมัติ'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
