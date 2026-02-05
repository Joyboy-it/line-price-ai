'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  UserCheck,
  UserX,
  Tag,
  Image as ImageIcon,
  Megaphone,
  TrendingUp,
  Activity,
  Clock,
  AlertTriangle,
  BarChart3,
  ArrowLeft,
  RefreshCw,
  MapPin,
  Shield,
  CheckCircle,
  XCircle,
  Eye,
  Upload,
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
    usage: { id: string; name: string; branchName: string; userCount: number; imageCount: number }[];
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
  branches: {
    total: number;
    active: number;
  };
  activity: {
    totalLogs: number;
    last7Days: number;
    last30Days: number;
    loginCount: number;
    uploadCount: number;
    dailyTrend: { date: string; logins: number; uploads: number; total: number }[];
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
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    }
    try {
      const response = await fetch('/api/admin/analytics');
      if (response.ok) {
        const result = await response.json();
        setData(result);
        setLastUpdated(new Date());
        setError(null);
      } else {
        setError('ไม่สามารถโหลดข้อมูลได้');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700';
      case 'operator': return 'bg-orange-100 text-orange-700';
      case 'worker': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'operator': return 'Operator';
      case 'worker': return 'Worker';
      case 'user': return 'User';
      default: return role;
    }
  };

  // Loading State
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">กำลังโหลดข้อมูล Analytics...</p>
            <p className="text-sm text-gray-400 mt-2">กรุณารอสักครู่</p>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-gray-800 font-medium text-lg">{error || 'ไม่สามารถโหลดข้อมูลได้'}</p>
            <button
              onClick={() => fetchAnalytics()}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        </div>
      </div>
    );
  }

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
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
          ภาพรวมระบบ
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-blue-700 font-medium">ผู้ใช้</span>
            </div>
            <p className="text-3xl font-bold text-blue-900">{data.users.total}</p>
            <p className="text-xs text-blue-600 mt-1">+{data.users.newLast30Days} ใน 30 วัน</p>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <UserCheck className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-700 font-medium">มีสิทธิ์</span>
            </div>
            <p className="text-3xl font-bold text-green-900">{data.users.withAccess}</p>
            <p className="text-xs text-green-600 mt-1">{data.users.total > 0 ? Math.round((data.users.withAccess / data.users.total) * 100) : 0}% ของทั้งหมด</p>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-purple-700 font-medium">กลุ่มราคา</span>
            </div>
            <p className="text-3xl font-bold text-purple-900">{data.priceGroups.total}</p>
            <p className="text-xs text-purple-600 mt-1">Active {data.priceGroups.active} กลุ่ม</p>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon className="w-5 h-5 text-orange-600" />
              <span className="text-sm text-orange-700 font-medium">รูปภาพ</span>
            </div>
            <p className="text-3xl font-bold text-orange-900">{data.images.total}</p>
            <p className="text-xs text-orange-600 mt-1">+{data.images.last30Days} ใน 30 วัน</p>
          </div>
          
          <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-4 border border-teal-200">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-teal-600" />
              <span className="text-sm text-teal-700 font-medium">สาขา</span>
            </div>
            <p className="text-3xl font-bold text-teal-900">{data.branches.total}</p>
            <p className="text-xs text-teal-600 mt-1">Active {data.branches.active} สาขา</p>
          </div>
          
          <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl p-4 border border-pink-200">
            <div className="flex items-center gap-2 mb-2">
              <Megaphone className="w-5 h-5 text-pink-600" />
              <span className="text-sm text-pink-700 font-medium">ประกาศ</span>
            </div>
            <p className="text-3xl font-bold text-pink-900">{data.announcements.total}</p>
            <p className="text-xs text-pink-600 mt-1">เผยแพร่ {data.announcements.published} รายการ</p>
          </div>
        </div>
      </section>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User Statistics */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            สถิติผู้ใช้งาน
          </h3>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-700">{data.users.active}</p>
              <p className="text-xs text-green-600">Active</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-700">{data.users.inactive}</p>
              <p className="text-xs text-gray-600">Inactive</p>
            </div>
          </div>
          
          <h4 className="text-sm font-medium text-gray-700 mb-3">แยกตามบทบาท</h4>
          <div className="space-y-2">
            {data.users.byRole.map((role) => (
              <div key={role.role} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(role.role)}`}>
                  {getRoleLabel(role.role)}
                </span>
                <span className="font-bold text-gray-800">{role.count} คน</span>
              </div>
            ))}
          </div>
        </div>

        {/* Request Statistics */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            สถิติคำขอสิทธิ์
          </h3>
          
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-yellow-50 rounded-lg p-3 text-center border-2 border-yellow-200">
              <p className="text-2xl font-bold text-yellow-700">{data.requests.pending}</p>
              <p className="text-xs text-yellow-600">รออนุมัติ</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-700">{data.requests.total}</p>
              <p className="text-xs text-blue-600">คำขอทั้งหมด</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700">อนุมัติแล้ว</span>
              </div>
              <span className="font-bold text-green-800">{data.requests.approved}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-700">ปฏิเสธแล้ว</span>
              </div>
              <span className="font-bold text-red-800">{data.requests.rejected}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">คำขอใน 30 วัน</span>
              <span className="font-bold text-gray-800">+{data.requests.last30Days}</span>
            </div>
          </div>
        </div>
      </div>

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

      {/* Activity Stats */}
      <section className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-600" />
          สถิติกิจกรรม
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
            <p className="text-sm text-indigo-700 font-medium mb-1">กิจกรรมทั้งหมด</p>
            <p className="text-2xl font-bold text-indigo-900">{data.activity.totalLogs.toLocaleString()}</p>
            <p className="text-xs text-indigo-600 mt-1">+{data.activity.last30Days} ใน 30 วัน</p>
          </div>
          <div className="bg-cyan-50 rounded-xl p-4 border border-cyan-200">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="w-4 h-4 text-cyan-600" />
              <p className="text-sm text-cyan-700 font-medium">เข้าสู่ระบบ</p>
            </div>
            <p className="text-2xl font-bold text-cyan-900">{data.activity.loginCount.toLocaleString()}</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
            <div className="flex items-center gap-2 mb-1">
              <Upload className="w-4 h-4 text-amber-600" />
              <p className="text-sm text-amber-700 font-medium">อัปโหลด</p>
            </div>
            <p className="text-2xl font-bold text-amber-900">{data.activity.uploadCount.toLocaleString()}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <p className="text-sm text-gray-700 font-medium mb-1">กิจกรรม 7 วัน</p>
            <p className="text-2xl font-bold text-gray-900">{data.activity.last7Days.toLocaleString()}</p>
          </div>
        </div>
      </section>

      {/* Daily Activity Trend */}
      {data.activity.dailyTrend.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            แนวโน้มกิจกรรม 14 วันล่าสุด
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="space-y-2">
              {data.activity.dailyTrend.slice(0, 7).map((day) => (
                <div key={day.date} className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 w-24">
                    {new Date(day.date).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </span>
                  <div className="flex-1 flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full"
                        style={{ width: `${Math.min((day.total / Math.max(...data.activity.dailyTrend.map(d => d.total))) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700 w-16 text-right">{day.total} รายการ</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
