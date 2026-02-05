'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  UserCheck,
  UserX,
  Tag,
  Image as ImageIcon,
  Megaphone,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  AlertTriangle,
  BarChart3,
  Calendar,
  ArrowLeft,
  XCircle,
  UserCircle,
} from 'lucide-react';

interface AnalyticsData {
  users: {
    total: number;
    active: number;
    inactive: number;
    withAccess: number;
    withoutAccess: number;
    newLast7Days: number;
    newLast30Days: number;
    byRole: { role: string; count: number }[];
  };
  requests: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    last7Days: number;
    last30Days: number;
  };
  priceGroups: {
    total: number;
    active: number;
    inactive: number;
    usage: { id: string; name: string; userCount: number; imageCount: number }[];
  };
  images: {
    total: number;
    last7Days: number;
    last30Days: number;
  };
  announcements: {
    total: number;
    published: number;
    unpublished: number;
  };
  activity: {
    totalLogs: number;
    last7Days: number;
    last30Days: number;
    loginCount: number;
    uploadCount: number;
    dailyTrend: { date: string; logins: number; uploads: number }[];
    topUsers: { userId: string; userName: string; activityCount: number }[];
  };
  inactiveUsers: {
    id: string;
    name: string;
    email: string;
    shopName: string;
    lastLogin: string | null;
    daysInactive: number;
  }[];
  onlineUsers: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: string;
    shopName: string | null;
    lastLogin: string;
  }[];
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'7days' | '30days' | 'all'>('30days');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    } else if (session?.user && session.user.role !== 'admin' && session.user.role !== 'operator') {
      router.push('/');
    }
  }, [session, status, router]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    }
    try {
      const response = await fetch('/api/admin/analytics', {
        cache: 'no-store',
      });
      if (response.ok) {
        const result = await response.json();
        setData(result);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const SkeletonCard = () => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
      </div>
      <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-32"></div>
    </div>
  );

  if (loading || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            <div>
              <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-20 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="w-20 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="w-20 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Stats Skeleton */}
        <section className="mb-8">
          <div className="h-6 bg-gray-200 rounded w-40 mb-4 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </section>

        {/* More Skeletons */}
        <section className="mb-8">
          <div className="h-6 bg-gray-200 rounded w-40 mb-4 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </section>

        <div className="text-center mt-8">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังโหลดข้อมูล Analytics...</p>
        </div>
      </div>
    );
  }

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    color = 'bg-gray-50',
  }: { 
    title: string; 
    value: number | string; 
    subtitle?: string; 
    color?: string;
  }) => (
    <div className={`${color} rounded-lg p-6 border border-gray-200`}>
      <p className="text-sm text-gray-600 mb-2">{title}</p>
      <h3 className="text-3xl font-bold text-gray-900 mb-1">{value}</h3>
      {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-gray-600 hover:text-gray-900"
            >
              ← กลับ
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          </div>
          <button
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {refreshing ? 'กำลังรีเฟรช...' : 'รีเฟรช'}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-gray-600">สถิติและรายงานการใช้งานระบบ</p>
          {lastUpdated && (
            <span className="text-sm text-gray-400">
              • อัปเดต: {lastUpdated.toLocaleTimeString('th-TH')}
            </span>
          )}
        </div>
      </div>

      {/* Overview Stats */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">ภาพรวมระบบ</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="ผู้ใช้ทั้งหมด"
            value={data.users.total}
            subtitle={`ใหม่ ${filter === '7days' ? data.users.newLast7Days : data.users.newLast30Days} คน`}
            color="bg-blue-50"
          />
          <StatCard
            title="ผู้ใช้ที่มีสิทธิ์"
            value={data.users.withAccess}
            subtitle={`${Math.round((data.users.withAccess / data.users.total) * 100)}% ของทั้งหมด`}
            color="bg-green-50"
          />
          <StatCard
            title="กลุ่มราคา"
            value={data.priceGroups.total}
            subtitle={`Active ${data.priceGroups.active} กลุ่ม`}
            color="bg-purple-50"
          />
          <StatCard
            title="รูปภาพทั้งหมด"
            value={data.images.total}
            subtitle={`ใหม่ ${filter === '7days' ? data.images.last7Days : data.images.last30Days} รูป`}
            color="bg-orange-50"
          />
        </div>
      </section>

      {/* User Statistics */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">สถิติผู้ใช้งาน</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="ผู้ใช้ Active"
            value={data.users.active}
            color="bg-green-50"
          />
          <StatCard
            title="ผู้ใช้ Inactive"
            value={data.users.inactive}
            color="bg-gray-50"
          />
          <StatCard
            title="ยังไม่มีสิทธิ์"
            value={data.users.withoutAccess}
            color="bg-yellow-50"
          />
          <StatCard
            title="คำขอรออนุมัติ"
            value={data.requests.pending}
            color="bg-red-50"
          />
        </div>

        {/* Users by Role */}
        <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">ผู้ใช้แยกตามบทบาท</h3>
          <div className="grid grid-cols-3 gap-4">
            {data.users.byRole.map((role) => (
              <div key={role.role} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-800">{role.count}</p>
                <p className="text-sm text-gray-600 capitalize">{role.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Online Users */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Activity className="w-6 h-6 text-green-600" />
          ผู้ใช้ออนไลน์อยู่ปัจจุบัน
          <span className="ml-2 px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
            {data.onlineUsers.length}
          </span>
        </h2>
        {data.onlineUsers.length === 0 ? (
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-8 text-center">
            <UserCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">ไม่มีผู้ใช้ออนไลน์ในขณะนี้</p>
            <p className="text-sm text-gray-500 mt-1">แสดงผู้ใช้ที่เข้าใช้งานภายใน 10 นาทีที่ผ่านมา</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {data.onlineUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col items-center p-3 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border border-green-200 hover:shadow-md transition-shadow"
                >
                  <div className="relative mb-2">
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-green-400"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center border-2 border-green-400">
                        <span className="text-white font-bold text-lg">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                  <p className="text-sm font-semibold text-gray-800 text-center line-clamp-1 w-full" title={user.name}>
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize mt-0.5">
                    {user.role === 'admin' ? 'แอดมิน' : 
                     user.role === 'operator' ? 'ผู้ดูแล' : 
                     user.role === 'worker' ? 'พนักงาน' : 'ผู้ใช้'}
                  </p>
                  {user.shopName && (
                    <p className="text-xs text-gray-400 text-center line-clamp-1 w-full mt-0.5" title={user.shopName}>
                      {user.shopName}
                    </p>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                💚 แสดงผู้ใช้ที่เข้าใช้งานภายใน 10 นาทีที่ผ่านมา • อัพเดทอัตโนมัติทุก 5 นาที
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Inactive Users Alert */}
      {data.inactiveUsers.length > 0 && (
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">ผู้ใช้ที่ไม่ได้เข้าใช้งาน (30+ วัน)</h2>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <p className="text-sm text-gray-700">
                ไม่ได้เข้าใช้งานมากกว่า 30 วัน: <strong className="text-gray-900">{data.inactiveUsers.length}</strong> คน
              </p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ชื่อผู้ใช้</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ร้าน</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">เข้าใช้ครั้งล่าสุด</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ไม่ได้ใช้งาน</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {data.inactiveUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.shopName || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('th-TH') : 'ไม่เคยเข้าใช้'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.daysInactive > 90 ? 'bg-red-100 text-red-700' :
                          user.daysInactive > 60 ? 'bg-orange-100 text-orange-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {user.daysInactive > 0 ? `${user.daysInactive} วัน` : 'ไม่เคยเข้าใช้'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          ดูรายละเอียด
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* Request Statistics */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">สถิติคำขอสิทธิ์</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="คำขอทั้งหมด"
            value={data.requests.total}
            subtitle={`ใหม่ ${filter === '7days' ? data.requests.last7Days : data.requests.last30Days} คำขอ`}
          />
          <StatCard
            title="รออนุมัติ"
            value={data.requests.pending}
            color="bg-yellow-50"
          />
          <StatCard
            title="อนุมัติแล้ว"
            value={data.requests.approved}
            subtitle={`${Math.round((data.requests.approved / data.requests.total) * 100)}% ของทั้งหมด`}
            color="bg-green-50"
          />
          <StatCard
            title="ปฏิเสธแล้ว"
            value={data.requests.rejected}
            subtitle={`${Math.round((data.requests.rejected / data.requests.total) * 100)}% ของทั้งหมด`}
            color="bg-red-50"
          />
        </div>
      </section>

      {/* Price Groups Usage */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">การใช้งานกลุ่มราคา</h2>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">ชื่อกลุ่ม</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">ผู้ใช้</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">รูปภาพ</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.priceGroups.usage.map((group) => (
                <tr key={group.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{group.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{group.userCount}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{group.imageCount}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${Math.min((group.userCount / data.users.total) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Top Active Users */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">ผู้ใช้ที่ Active ที่สุด</h2>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="space-y-3">
            {data.activity.topUsers.map((user, index) => (
              <div key={user.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold bg-gray-200 text-gray-700">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{user.userName}</p>
                    <p className="text-sm text-gray-500">{user.activityCount} กิจกรรม</p>
                  </div>
                </div>
                <Link
                  href={`/admin/users/${user.userId}`}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  ดูรายละเอียด
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Other Stats */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">สถิติอื่นๆ</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            title="ประกาศทั้งหมด"
            value={data.announcements.total}
            subtitle={`เผยแพร่ ${data.announcements.published} รายการ`}
            color="bg-purple-50"
          />
          <StatCard
            title="กิจกรรมทั้งหมด"
            value={data.activity.totalLogs}
            subtitle={`${filter === '7days' ? data.activity.last7Days : data.activity.last30Days} กิจกรรมล่าสุด`}
            color="bg-indigo-50"
          />
          <StatCard
            title="การเข้าสู่ระบบ"
            value={data.activity.loginCount}
            subtitle="ทั้งหมด"
            color="bg-cyan-50"
          />
        </div>
      </section>
    </div>
  );
}
