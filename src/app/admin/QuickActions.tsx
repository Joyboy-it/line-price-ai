'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Users,
  Tag,
  Megaphone,
  FileText,
  BarChart3,
  Image as ImageIcon,
  MapPin,
  Shield,
  ClipboardCheck,
} from 'lucide-react';
import { hasPermission, Permission } from '@/lib/permissions';
import { UserRole } from '@/types';

interface QuickAction {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
  bgColor: string;
  borderColor: string;
  iconColor: string;
  permission: Permission;
}

const allQuickActions: QuickAction[] = [
  { href: '/admin/users', icon: Users, label: 'จัดการผู้ใช้', desc: 'ผู้ใช้งานในระบบ', bgColor: 'bg-blue-50', borderColor: 'border-blue-100', iconColor: 'text-blue-600', permission: 'manage_users' },
  { href: '/admin/branches', icon: MapPin, label: 'จัดการสาขา', desc: 'เพิ่ม/แก้ไข/ลบสาขา', bgColor: 'bg-teal-50', borderColor: 'border-teal-100', iconColor: 'text-teal-600', permission: 'manage_branches' },
  { href: '/admin/manage-groups', icon: Tag, label: 'จัดการกลุ่มราคา', desc: 'เพิ่ม/แก้ไข/ลบกลุ่ม', bgColor: 'bg-green-50', borderColor: 'border-green-100', iconColor: 'text-green-600', permission: 'manage_price_groups' },
  { href: '/admin/price-images', icon: ImageIcon, label: 'จัดการรูปภาพราคา', desc: 'อัปโหลด/แก้ไขรูป', bgColor: 'bg-orange-50', borderColor: 'border-orange-100', iconColor: 'text-orange-600', permission: 'upload_images' },
  { href: '/admin/announcements', icon: Megaphone, label: 'จัดการประกาศ', desc: 'ประกาศประชาสัมพันธ์', bgColor: 'bg-purple-50', borderColor: 'border-purple-100', iconColor: 'text-purple-600', permission: 'manage_announcements' },
  { href: '/admin/requests', icon: ClipboardCheck, label: 'อนุมัติคำขอ', desc: 'คำขอเข้าใช้งาน', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-100', iconColor: 'text-yellow-600', permission: 'approve_requests' },
  { href: '/admin/analytics', icon: BarChart3, label: 'Analytics Dashboard', desc: 'สถิติและกราฟ', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-100', iconColor: 'text-indigo-600', permission: 'view_analytics' },
  { href: '/admin/logs', icon: FileText, label: 'ประวัติใช้งาน', desc: 'ประวัติการใช้งาน', bgColor: 'bg-slate-50', borderColor: 'border-slate-100', iconColor: 'text-slate-600', permission: 'manage_roles' },
  { href: '/admin/roles', icon: Shield, label: 'จัดการสิทธิ์', desc: 'กำหนดสิทธิ์ผู้ใช้', bgColor: 'bg-pink-50', borderColor: 'border-pink-100', iconColor: 'text-pink-600', permission: 'manage_roles' },
];

export default function QuickActions() {
  const { data: session } = useSession();
  const userRole = session?.user?.role as UserRole | undefined;

  // Filter actions based on user permissions
  const filteredActions = allQuickActions.filter(action => {
    if (!userRole) return false;
    return hasPermission(userRole, action.permission);
  });

  if (filteredActions.length === 0) {
    return null;
  }

  return (
    <section className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">⚡ Quick Actions</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredActions.map((action) => (
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
  );
}
