'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Tag,
  Image as ImageIcon,
  Clock,
  BarChart3,
  ArrowLeft,
  RefreshCw,
  Shield,
  Upload,
  LogIn,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Megaphone,
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
    topUsers: { userId: string; userName: string; activityCount: number }[];
  };
  leastActiveUsers: {
    id: string;
    name: string;
    email: string;
    shopName: string;
    lastActivity: string | null;
    daysInactive: number | null;
  }[];
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'แอดมิน',
  operator: 'โอเปอเรเตอร์',
  worker: 'พนักงาน',
  user: 'ผู้ใช้ทั่วไป',
};

function pct(value: number, total: number): number {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    if (isRefresh) setRefreshing(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/analytics', { cache: 'no-store' });
      if (response.ok) {
        setData(await response.json());
        setLastUpdated(new Date());
      } else {
        setError('ไม่สามารถโหลดข้อมูลได้');
      }
    } catch {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ── Loading State ──
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="h-5 bg-gray-200 rounded w-16 mb-4 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-56 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-40 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-20 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Error State ──
  if (error || !data) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> กลับ
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-700 font-medium mb-4">{error || 'ไม่สามารถโหลดข้อมูลได้'}</p>
          <button
            onClick={() => fetchAnalytics(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* ── Header ── */}
      <div className="mb-8">
        <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> กลับ
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              สถิติและรายงานการใช้งานระบบ
              {lastUpdated && (
                <span className="ml-2 text-gray-400">
                  • อัปเดต {lastUpdated.toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'กำลังโหลด...' : 'รีเฟรช'}
          </button>
        </div>
      </div>

      {/* ── Overview Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-600">ผู้ใช้ทั้งหมด</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{data.users.total}</p>
          <p className="text-xs text-gray-500 mt-1">ใหม่ 30 วัน: +{data.users.newLast30Days}</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-600">มีสิทธิ์เข้าใช้</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{data.users.withAccess}</p>
          <p className="text-xs text-gray-500 mt-1">{pct(data.users.withAccess, data.users.total)}% ของทั้งหมด</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-gray-600">กลุ่มราคา</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{data.priceGroups.active}<span className="text-lg text-gray-400">/{data.priceGroups.total}</span></p>
          <p className="text-xs text-gray-500 mt-1">active / ทั้งหมด</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <ImageIcon className="w-4 h-4 text-orange-500" />
            <span className="text-sm text-gray-600">รูปภาพ</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{data.images.total}</p>
          <p className="text-xs text-gray-500 mt-1">ใหม่ 7 วัน: +{data.images.last7Days}</p>
        </div>
      </div>

      {/* ── Two Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* คำขอสิทธิ์ */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">คำขอสิทธิ์</h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-gray-900">{data.requests.pending}</p>
              <p className="text-xs text-gray-500">รออนุมัติ</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-gray-900">{data.requests.approved}</p>
              <p className="text-xs text-gray-500">อนุมัติ</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600 mx-auto mb-1" />
              <p className="text-xl font-bold text-gray-900">{data.requests.rejected}</p>
              <p className="text-xs text-gray-500">ปฏิเสธ</p>
            </div>
          </div>
          {data.requests.total > 0 && (
            <div className="flex h-2 rounded-full overflow-hidden bg-gray-100">
              <div className="bg-green-500" style={{ width: `${pct(data.requests.approved, data.requests.total)}%` }} />
              <div className="bg-yellow-400" style={{ width: `${pct(data.requests.pending, data.requests.total)}%` }} />
              <div className="bg-red-400" style={{ width: `${pct(data.requests.rejected, data.requests.total)}%` }} />
            </div>
          )}
          <div className="flex justify-between mt-3 text-xs text-gray-500">
            <span>ทั้งหมด {data.requests.total} คำขอ</span>
            <span>ใหม่ 30 วัน: {data.requests.last30Days}</span>
          </div>
        </div>

        {/* ผู้ใช้แยกตามบทบาท */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">ผู้ใช้แยกตามบทบาท</h2>
          <div className="space-y-3">
            {data.users.byRole.map((role) => (
              <div key={role.role} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${
                    role.role === 'admin' ? 'bg-red-500' :
                    role.role === 'operator' ? 'bg-blue-500' :
                    role.role === 'worker' ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                  <span className="text-sm text-gray-700">{ROLE_LABELS[role.role] || role.role}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        role.role === 'admin' ? 'bg-red-500' :
                        role.role === 'operator' ? 'bg-blue-500' :
                        role.role === 'worker' ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                      style={{ width: `${pct(role.count, data.users.total)}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-8 text-right">{role.count}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-500">
            <span>Active: {data.users.active}</span>
            <span>Inactive: {data.users.inactive}</span>
            <span>ไม่มีสิทธิ์: {data.users.withoutAccess}</span>
          </div>
        </div>
      </div>

      {/* ── กิจกรรมระบบ ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* กิจกรรม 30 วันล่าสุด */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">กิจกรรม 30 วันล่าสุด</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <LogIn className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-lg font-bold text-gray-900">{data.activity.loginCount}</p>
                <p className="text-xs text-gray-500">เข้าสู่ระบบ</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <Upload className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-lg font-bold text-gray-900">{data.activity.uploadCount}</p>
                <p className="text-xs text-gray-500">อัพโหลดรูป</p>
              </div>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
            <span>กิจกรรมทั้งหมด: {data.activity.totalLogs}</span>
            <span>7 วัน: {data.activity.last7Days} | 30 วัน: {data.activity.last30Days}</span>
          </div>
        </div>

        {/* ข้อมูลเพิ่มเติม */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-4">ข้อมูลเพิ่มเติม</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-gray-700">ประกาศ</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {data.announcements.published} เผยแพร่ / {data.announcements.total} ทั้งหมด
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-700">รูปภาพใหม่ 30 วัน</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">+{data.images.last30Days} รูป</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-700">ผู้ใช้ใหม่ 7 วัน</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">+{data.users.newLast7Days} คน</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── กลุ่มราคา ── */}
      {data.priceGroups.usage.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">การใช้งานกลุ่มราคา</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                  <th className="px-6 py-3 text-left">ชื่อกลุ่ม</th>
                  <th className="px-6 py-3 text-center">ผู้ใช้</th>
                  <th className="px-6 py-3 text-center">รูปภาพ</th>
                  <th className="px-6 py-3 text-left">สัดส่วนผู้ใช้</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.priceGroups.usage.map((group) => {
                  const userPct = pct(group.userCount, data.users.withAccess || 1);
                  return (
                    <tr key={group.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <span className="text-sm font-medium text-gray-900">{group.name}</span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className="text-sm text-gray-700">{group.userCount}</span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className="text-sm text-gray-700">{group.imageCount}</span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="bg-green-500 h-full rounded-full" style={{ width: `${userPct}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 w-10 text-right">{userPct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Top Active Users ── */}
      {data.activity.topUsers.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">ผู้ใช้ที่ Active ที่สุด (30 วัน)</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {data.activity.topUsers.map((user, index) => (
              <div key={user.userId} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index < 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-800">{user.userName}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">{user.activityCount} กิจกรรม</span>
                  <Link
                    href={`/admin/logs?user=${encodeURIComponent(user.userName)}`}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    ดู Log
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ผู้ใช้ที่เข้าใช้งานน้อย ── */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <h2 className="font-semibold text-gray-800">ผู้ใช้เรียงตามกิจกรรมล่าสุด</h2>
          </div>
          <span className="text-xs text-gray-500">เข้าใช้น้อยสุดอยู่ด้านบน</span>
        </div>
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr className="text-xs text-gray-500 uppercase">
                <th className="px-6 py-3 text-left">ชื่อผู้ใช้</th>
                <th className="px-6 py-3 text-left">ร้าน</th>
                <th className="px-6 py-3 text-left">กิจกรรมล่าสุด</th>
                <th className="px-6 py-3 text-left">ห่างจากวันนี้</th>
                <th className="px-6 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.leastActiveUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">
                    <div className="text-sm font-medium text-gray-900">{user.name || '-'}</div>
                    <div className="text-xs text-gray-400">{user.email}</div>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-600">{user.shopName || '-'}</td>
                  <td className="px-6 py-3 text-sm text-gray-600">
                    {user.lastActivity
                      ? new Date(user.lastActivity).toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', day: '2-digit', month: '2-digit', year: 'numeric' })
                      : <span className="text-gray-400">ไม่มีบันทึก</span>}
                  </td>
                  <td className="px-6 py-3">
                    {user.daysInactive != null ? (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.daysInactive > 14 ? 'bg-red-100 text-red-700' :
                        user.daysInactive > 7 ? 'bg-orange-100 text-orange-700' :
                        user.daysInactive > 3 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {user.daysInactive} วัน
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">ไม่มีบันทึก</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <Link href={`/admin/logs?user=${encodeURIComponent(user.name || '')}`} className="text-xs text-blue-600 hover:text-blue-800">
                      ดู Log
                    </Link>
                  </td>
                </tr>
              ))}
              {data.leastActiveUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">
                    ไม่มีข้อมูลผู้ใช้
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
