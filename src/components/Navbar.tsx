'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import {
  Menu,
  X,
  User,
  MapPin,
  LogOut,
  Settings,
  LayoutDashboard,
  ChevronDown,
  FolderOpen,
  Shield,
  Users,
  BarChart3,
  Bell,
  Image as ImageIcon,
  FileText,
} from 'lucide-react';
import { Permission } from '@/lib/permissions';
import { usePermissions } from '@/hooks/usePermissions';

export default function Navbar() {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const isAdmin = session?.user?.role === 'admin';
  const isOperator = session?.user?.role === 'operator';
  const isWorker = session?.user?.role === 'worker';
  
  // Use permissions from database
  const { hasPermission: canAccess, isLoading: permissionsLoading } = usePermissions();

  // Close dropdown and mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo-v2.png"
                alt="ส.เจริญชัย รีไซเคิล "
                width={40}
                height={40}
                className="rounded-full"
              />
              <span className="font-semibold text-gray-800 hidden sm:block">
                ส.เจริญชัย รีไซเคิล 
              </span>
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-4">
            {status === 'authenticated' && session?.user && (
              <>
                {(isAdmin || isOperator || isWorker) && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1 text-gray-600 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    <Settings className="w-4 h-4" />
                    Admin
                  </Link>
                )}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 text-gray-700 hover:text-green-600 px-3 py-2 rounded-md"
                  >
                    {session.user.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || 'User'}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-500" />
                      </div>
                    )}
                    <span className="text-sm font-medium">{session.user.name}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-200">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{session.user.name}</p>
                        <p className="text-xs text-gray-500">{session.user.email}</p>
                      </div>
                      {canAccess('view_dashboard') && (
                        <>
                          <Link
                            href="/admin"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setIsDropdownOpen(false)}
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            Dashboard
                          </Link>
                          {canAccess('manage_users') && (
                            <Link
                              href="/admin/users"
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              <Users className="w-4 h-4" />
                              จัดการผู้ใช้
                            </Link>
                          )}
                          {canAccess('manage_branches') && (
                            <Link
                              href="/admin/branches"
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              <MapPin className="w-4 h-4" />
                              จัดการสาขา
                            </Link>
                          )}
                          {canAccess('manage_price_groups') && (
                            <Link
                              href="/admin/manage-groups"
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              <FolderOpen className="w-4 h-4" />
                              จัดการกลุ่มราคา
                            </Link>
                          )}
                          {canAccess('upload_images') && (
                            <Link
                              href="/admin/price-images"
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              <ImageIcon className="w-4 h-4" />
                              อัปโหลดรูปภาพ
                            </Link>
                          )}
                          {canAccess('manage_announcements') && (
                            <Link
                              href="/admin/announcements"
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              <Bell className="w-4 h-4" />
                              จัดการประกาศ
                            </Link>
                          )}
                          {canAccess('view_analytics') && (
                            <Link
                              href="/admin/analytics"
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              <BarChart3 className="w-4 h-4" />
                              ดูสถิติ
                            </Link>
                          )}
                          {canAccess('manage_roles') && (
                            <Link
                              href="/admin/logs"
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              <FileText className="w-4 h-4" />
                              ประวัติการใช้งาน
                            </Link>
                          )}
                          {canAccess('manage_roles') && (
                            <Link
                              href="/admin/roles"
                              className="flex items-center gap-2 px-4 py-2 text-sm text-purple-600 hover:bg-purple-50"
                              onClick={() => setIsDropdownOpen(false)}
                            >
                              <Shield className="w-4 h-4" />
                              จัดการสิทธิ์
                            </Link>
                          )}
                        </>
                      )}
                      <button
                        onClick={() => signOut()}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        <LogOut className="w-4 h-4" />
                        ออกจากระบบ
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
            {status === 'unauthenticated' && (
              <button
                onClick={() => signIn('line')}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.349 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                </svg>
                เข้าสู่ระบบด้วย LINE
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-500 hover:text-gray-700 p-2"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white" ref={mobileMenuRef}>
          <div className="px-4 py-3 space-y-3">
            {status === 'authenticated' && session?.user && (
              <>
                <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                  {session.user.image ? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{session.user.name}</p>
                    <p className="text-sm text-gray-500">{session.user.email}</p>
                  </div>
                </div>
                {canAccess('view_dashboard') && (
                  <>
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 text-gray-700 hover:text-green-600 py-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <LayoutDashboard className="w-5 h-5" />
                      Dashboard
                    </Link>
                    {canAccess('manage_users') && (
                      <Link
                        href="/admin/users"
                        className="flex items-center gap-2 text-gray-700 hover:text-green-600 py-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Users className="w-5 h-5" />
                        จัดการผู้ใช้
                      </Link>
                    )}
                    {canAccess('manage_branches') && (
                      <Link
                        href="/admin/branches"
                        className="flex items-center gap-2 text-gray-700 hover:text-green-600 py-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <MapPin className="w-5 h-5" />
                        จัดการสาขา
                      </Link>
                    )}
                    {canAccess('manage_price_groups') && (
                      <Link
                        href="/admin/manage-groups"
                        className="flex items-center gap-2 text-gray-700 hover:text-green-600 py-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <FolderOpen className="w-5 h-5" />
                        จัดการกลุ่มราคา
                      </Link>
                    )}
                    {canAccess('upload_images') && (
                      <Link
                        href="/admin/price-images"
                        className="flex items-center gap-2 text-gray-700 hover:text-green-600 py-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <ImageIcon className="w-5 h-5" />
                        อัปโหลดรูปภาพ
                      </Link>
                    )}
                    {canAccess('manage_announcements') && (
                      <Link
                        href="/admin/announcements"
                        className="flex items-center gap-2 text-gray-700 hover:text-green-600 py-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Bell className="w-5 h-5" />
                        จัดการประกาศ
                      </Link>
                    )}
                    {canAccess('view_analytics') && (
                      <Link
                        href="/admin/analytics"
                        className="flex items-center gap-2 text-gray-700 hover:text-green-600 py-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <BarChart3 className="w-5 h-5" />
                        ดูสถิติ
                      </Link>
                    )}
                    {canAccess('manage_roles') && (
                      <Link
                        href="/admin/logs"
                        className="flex items-center gap-2 text-gray-700 hover:text-green-600 py-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <FileText className="w-5 h-5" />
                        ประวัติการใช้งาน
                      </Link>
                    )}
                    {canAccess('manage_roles') && (
                      <Link
                        href="/admin/roles"
                        className="flex items-center gap-2 text-purple-600 hover:text-purple-700 py-2"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Shield className="w-5 h-5" />
                        จัดการสิทธิ์
                      </Link>
                    )}
                  </>
                )}
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-2 text-red-600 py-2 w-full"
                >
                  <LogOut className="w-5 h-5" />
                  ออกจากระบบ
                </button>
              </>
            )}
            {status === 'unauthenticated' && (
              <button
                onClick={() => signIn('line')}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 w-full justify-center"
              >
                เข้าสู่ระบบด้วย LINE
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
