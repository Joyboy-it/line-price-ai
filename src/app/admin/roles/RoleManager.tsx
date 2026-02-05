'use client';

import { useState, useEffect } from 'react';
import { Shield, Users, Image, FolderOpen, MapPin, FileText, Bell, BarChart3, Check, Power, Search, Filter, ChevronRight } from 'lucide-react';

interface Permission {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  color: string;
  permissions: string[];
}

const PERMISSION_CATEGORIES = [
  { id: 'all', name: 'ทั้งหมด', icon: <Filter className="w-4 h-4" /> },
  { id: 'dashboard', name: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'users', name: 'ผู้ใช้', icon: <Users className="w-4 h-4" /> },
  { id: 'content', name: 'เนื้อหา', icon: <FolderOpen className="w-4 h-4" /> },
  { id: 'system', name: 'ระบบ', icon: <Shield className="w-4 h-4" /> },
];

const PERMISSIONS: Permission[] = [
  { id: 'view_dashboard', name: 'ดู Dashboard', description: 'เข้าถึงหน้า Dashboard', icon: <BarChart3 className="w-4 h-4" />, category: 'dashboard' },
  { id: 'view_analytics', name: 'ดูสถิติ', description: 'เข้าถึงหน้าสถิติและรายงาน', icon: <BarChart3 className="w-4 h-4" />, category: 'dashboard' },
  { id: 'manage_users', name: 'จัดการผู้ใช้', description: 'ดู แก้ไข ข้อมูลผู้ใช้', icon: <Users className="w-4 h-4" />, category: 'users' },
  { id: 'toggle_user_status', name: 'เปิด/ปิดผู้ใช้', description: 'เปิดหรือปิดการใช้งานผู้ใช้', icon: <Power className="w-4 h-4" />, category: 'users' },
  { id: 'approve_requests', name: 'อนุมัติคำขอ', description: 'อนุมัติ/ปฏิเสธคำขอเข้าใช้', icon: <FileText className="w-4 h-4" />, category: 'users' },
  { id: 'manage_branches', name: 'จัดการสาขา', description: 'เพิ่ม แก้ไข ลบสาขา', icon: <MapPin className="w-4 h-4" />, category: 'content' },
  { id: 'manage_price_groups', name: 'จัดการกลุ่มราคา', description: 'เพิ่ม แก้ไข ลบกลุ่มราคา', icon: <FolderOpen className="w-4 h-4" />, category: 'content' },
  { id: 'upload_images', name: 'อัปโหลดรูปภาพ', description: 'อัปโหลดรูปภาพราคา', icon: <Image className="w-4 h-4" />, category: 'content' },
  { id: 'manage_announcements', name: 'จัดการประกาศ', description: 'เพิ่ม แก้ไข ลบประกาศ', icon: <Bell className="w-4 h-4" />, category: 'content' },
  { id: 'manage_roles', name: 'จัดการสิทธิ์', description: 'กำหนดสิทธิ์ผู้ใช้', icon: <Shield className="w-4 h-4" />, category: 'system' },
];

const DEFAULT_ROLES: Role[] = [
  {
    id: 'admin',
    name: 'admin',
    displayName: 'Admin',
    description: 'ผู้ดูแลระบบ มีสิทธิ์ทั้งหมด',
    color: 'red',
    permissions: PERMISSIONS.map(p => p.id),
  },
  {
    id: 'operator',
    name: 'operator',
    displayName: 'Operator',
    description: 'ผู้ปฏิบัติงาน จัดการข้อมูลทั่วไป',
    color: 'orange',
    permissions: ['view_dashboard', 'manage_users', 'manage_branches', 'manage_price_groups', 'upload_images', 'manage_announcements', 'approve_requests', 'view_analytics'],
  },
  {
    id: 'worker',
    name: 'worker',
    displayName: 'Worker',
    description: 'พนักงาน อัปโหลดรูปภาพราคา',
    color: 'blue',
    permissions: ['view_dashboard', 'upload_images'],
  },
  {
    id: 'user',
    name: 'user',
    displayName: 'User',
    description: 'ผู้ใช้ทั่วไป ดูราคาเท่านั้น',
    color: 'gray',
    permissions: [],
  },
];

export default function RoleManager() {
  const [roles, setRoles] = useState<Role[]>(DEFAULT_ROLES);
  const [selectedRole, setSelectedRole] = useState<Role | null>(DEFAULT_ROLES[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // โหลดข้อมูลสิทธิ์จาก API
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await fetch('/api/admin/roles');
        if (!response.ok) throw new Error('Failed to fetch permissions');
        
        const data = await response.json();
        
        // อัปเดต roles ด้วยข้อมูลจาก API
        const updatedRoles = DEFAULT_ROLES.map(role => ({
          ...role,
          permissions: data[role.id] || role.permissions,
        }));
        
        setRoles(updatedRoles);
        setSelectedRole(updatedRoles[0]);
      } catch (error) {
        console.error('Error fetching permissions:', error);
        alert('ไม่สามารถโหลดข้อมูลสิทธิ์ได้');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPermissions();
  }, []);

  const handlePermissionToggle = (roleId: string, permissionId: string) => {
    setRoles(prevRoles => {
      const newRoles = prevRoles.map(role => {
        if (role.id === roleId) {
          const hasPermission = role.permissions.includes(permissionId);
          const updatedRole = {
            ...role,
            permissions: hasPermission
              ? role.permissions.filter(p => p !== permissionId)
              : [...role.permissions, permissionId],
          };
          if (selectedRole?.id === roleId) {
            setSelectedRole(updatedRole);
          }
          return updatedRole;
        }
        return role;
      });
      return newRoles;
    });
    setSaveSuccess(false);
  };

  const handleSelectAll = (roleId: string, select: boolean) => {
    if (roleId === 'admin') return;
    
    setRoles(prevRoles => {
      const newRoles = prevRoles.map(role => {
        if (role.id === roleId) {
          const updatedRole = {
            ...role,
            permissions: select ? PERMISSIONS.map(p => p.id) : [],
          };
          if (selectedRole?.id === roleId) {
            setSelectedRole(updatedRole);
          }
          return updatedRole;
        }
        return role;
      });
      return newRoles;
    });
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // บันทึกสิทธิ์ทุก role (ยกเว้น admin)
      const rolesToSave = roles.filter(role => role.id !== 'admin');
      
      for (const role of rolesToSave) {
        const response = await fetch('/api/admin/roles', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: role.id,
            permissions: role.permissions,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to save permissions');
        }
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving permissions:', error);
      alert('เกิดข้อผิดพลาดในการบันทึก: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleColor = (color: string) => {
    switch (color) {
      case 'red': return { bg: 'bg-red-500', light: 'bg-red-100 text-red-700 border-red-200', ring: 'ring-red-500' };
      case 'orange': return { bg: 'bg-orange-500', light: 'bg-orange-100 text-orange-700 border-orange-200', ring: 'ring-orange-500' };
      case 'blue': return { bg: 'bg-blue-500', light: 'bg-blue-100 text-blue-700 border-blue-200', ring: 'ring-blue-500' };
      case 'green': return { bg: 'bg-green-500', light: 'bg-green-100 text-green-700 border-green-200', ring: 'ring-green-500' };
      default: return { bg: 'bg-gray-500', light: 'bg-gray-100 text-gray-700 border-gray-200', ring: 'ring-gray-500' };
    }
  };

  const filteredPermissions = PERMISSIONS.filter(permission => {
    const matchesSearch = permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         permission.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || permission.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getPermissionCountByCategory = (rolePermissions: string[], category: string) => {
    if (category === 'all') return rolePermissions.length;
    return PERMISSIONS.filter(p => p.category === category && rolePermissions.includes(p.id)).length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">กำลังโหลดข้อมูลสิทธิ์...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2 animate-pulse">
          <Check className="w-5 h-5" />
          บันทึกการตั้งค่าสำเร็จ
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Role Selection */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-4 py-3">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <Shield className="w-5 h-5" />
                บทบาทผู้ใช้
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {roles.map(role => {
                const colors = getRoleColor(role.color);
                const isSelected = selectedRole?.id === role.id;
                
                return (
                  <div
                    key={role.id}
                    className={`p-4 cursor-pointer transition-all hover:bg-gray-50 ${
                      isSelected ? 'bg-purple-50 border-l-4 border-purple-500' : ''
                    }`}
                    onClick={() => setSelectedRole(role)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${colors.bg} flex items-center justify-center text-white font-bold`}>
                          {role.displayName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{role.displayName}</p>
                          <p className="text-xs text-gray-500">{role.permissions.length} สิทธิ์</p>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-4 text-white">
            <h3 className="font-semibold mb-3">📊 สรุปสิทธิ์</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="opacity-80">สิทธิ์ทั้งหมด</span>
                <span className="font-bold">{PERMISSIONS.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-80">บทบาททั้งหมด</span>
                <span className="font-bold">{roles.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Permission Management */}
        <div className="lg:col-span-2 space-y-4">
          {selectedRole && (
            <>
              {/* Role Header */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl ${getRoleColor(selectedRole.color).bg} flex items-center justify-center text-white text-2xl font-bold`}>
                      {selectedRole.displayName.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{selectedRole.displayName}</h2>
                      <p className="text-gray-500">{selectedRole.description}</p>
                    </div>
                  </div>
                  {selectedRole.id !== 'admin' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSelectAll(selectedRole.id, true)}
                        className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                      >
                        เลือกทั้งหมด
                      </button>
                      <button
                        onClick={() => handleSelectAll(selectedRole.id, false)}
                        className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                      >
                        ยกเลิกทั้งหมด
                      </button>
                    </div>
                  )}
                </div>

                {/* Permission Progress */}
                <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full ${getRoleColor(selectedRole.color).bg} transition-all duration-300`}
                    style={{ width: `${(selectedRole.permissions.length / PERMISSIONS.length) * 100}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {selectedRole.permissions.length} / {PERMISSIONS.length} สิทธิ์ ({Math.round((selectedRole.permissions.length / PERMISSIONS.length) * 100)}%)
                </p>
              </div>

              {/* Search and Filter */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="ค้นหาสิทธิ์..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    {PERMISSION_CATEGORIES.map(category => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition ${
                          selectedCategory === category.id
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {category.icon}
                        {category.name}
                        <span className={`ml-1 px-1.5 py-0.5 rounded text-xs ${
                          selectedCategory === category.id ? 'bg-purple-400' : 'bg-gray-200'
                        }`}>
                          {getPermissionCountByCategory(selectedRole.permissions, category.id)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Permissions Grid */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-200">
                  {filteredPermissions.map(permission => {
                    const hasPermission = selectedRole.permissions.includes(permission.id);
                    const isAdmin = selectedRole.id === 'admin';
                    
                    return (
                      <div
                        key={permission.id}
                        className={`bg-white p-4 ${!isAdmin ? 'hover:bg-gray-50 cursor-pointer' : ''}`}
                        onClick={() => !isAdmin && handlePermissionToggle(selectedRole.id, permission.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-lg ${hasPermission ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                              {permission.icon}
                            </div>
                            <div>
                              <p className="font-medium text-gray-800">{permission.name}</p>
                              <p className="text-xs text-gray-500">{permission.description}</p>
                            </div>
                          </div>
                          
                          {isAdmin ? (
                            <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                              <Check className="w-4 h-4" />
                              <span className="text-xs font-medium">เปิดเสมอ</span>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePermissionToggle(selectedRole.id, permission.id);
                              }}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                hasPermission ? 'bg-green-500' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${
                                  hasPermission ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {filteredPermissions.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>ไม่พบสิทธิ์ที่ค้นหา</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-between items-center bg-white border border-gray-200 rounded-xl p-4">
        <div className="text-sm text-gray-500">
          💡 การเปลี่ยนแปลงจะมีผลหลังจากบันทึก
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-medium py-2.5 px-6 rounded-lg flex items-center gap-2 shadow-lg shadow-purple-500/25 transition-all"
        >
          {isSaving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              กำลังบันทึก...
            </>
          ) : (
            <>
              <Shield className="w-5 h-5" />
              บันทึกการตั้งค่า
            </>
          )}
        </button>
      </div>
    </div>
  );
}
