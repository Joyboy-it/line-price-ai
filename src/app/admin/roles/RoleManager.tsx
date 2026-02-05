'use client';

import { useState } from 'react';
import { Shield, Users, Image, FolderOpen, MapPin, FileText, Bell, BarChart3, Check, X, Power } from 'lucide-react';

interface Permission {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  color: string;
  permissions: string[];
}

const PERMISSIONS: Permission[] = [
  { id: 'view_dashboard', name: 'ดู Dashboard', description: 'เข้าถึงหน้า Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'manage_users', name: 'จัดการผู้ใช้', description: 'ดู แก้ไข ข้อมูลผู้ใช้', icon: <Users className="w-4 h-4" /> },
  { id: 'toggle_user_status', name: 'เปิด/ปิดผู้ใช้', description: 'เปิดหรือปิดการใช้งานผู้ใช้', icon: <Power className="w-4 h-4" /> },
  { id: 'manage_branches', name: 'จัดการสาขา', description: 'เพิ่ม แก้ไข ลบสาขา', icon: <MapPin className="w-4 h-4" /> },
  { id: 'manage_price_groups', name: 'จัดการกลุ่มราคา', description: 'เพิ่ม แก้ไข ลบกลุ่มราคา', icon: <FolderOpen className="w-4 h-4" /> },
  { id: 'upload_images', name: 'อัปโหลดรูปภาพ', description: 'อัปโหลดรูปภาพราคา', icon: <Image className="w-4 h-4" /> },
  { id: 'manage_announcements', name: 'จัดการประกาศ', description: 'เพิ่ม แก้ไข ลบประกาศ', icon: <Bell className="w-4 h-4" /> },
  { id: 'approve_requests', name: 'อนุมัติคำขอ', description: 'อนุมัติ/ปฏิเสธคำขอเข้าใช้', icon: <FileText className="w-4 h-4" /> },
  { id: 'view_analytics', name: 'ดูสถิติ', description: 'เข้าถึงหน้าสถิติและรายงาน', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'manage_roles', name: 'จัดการสิทธิ์', description: 'กำหนดสิทธิ์ผู้ใช้', icon: <Shield className="w-4 h-4" /> },
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
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
          // อัปเดต selectedRole ด้วย
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
      // TODO: Save to database via API
      await new Promise(resolve => setTimeout(resolve, 500));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleColor = (color: string) => {
    switch (color) {
      case 'red': return 'bg-red-100 text-red-700 border-red-200';
      case 'orange': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'blue': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'green': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <Check className="w-5 h-5" />
          บันทึกการตั้งค่าสำเร็จ
        </div>
      )}

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map(role => (
          <div
            key={role.id}
            className={`bg-white border rounded-lg p-4 cursor-pointer transition-all ${
              selectedRole?.id === role.id ? 'ring-2 ring-purple-500 border-purple-300' : 'border-gray-200 hover:border-purple-300'
            }`}
            onClick={() => setSelectedRole(role)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(role.color)}`}>
                {role.displayName}
              </span>
              <span className="text-xs text-gray-500">
                {role.permissions.length} สิทธิ์
              </span>
            </div>
            <p className="text-sm text-gray-600">{role.description}</p>
          </div>
        ))}
      </div>

      {/* Permissions Table */}
      {selectedRole && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">
              สิทธิ์ของ <span className={`px-2 py-0.5 rounded text-sm ${getRoleColor(selectedRole.color)}`}>{selectedRole.displayName}</span>
            </h2>
            <p className="text-sm text-gray-500 mt-1">{selectedRole.description}</p>
          </div>

          <div className="divide-y divide-gray-100">
            {PERMISSIONS.map(permission => {
              const hasPermission = selectedRole.permissions.includes(permission.id);
              const isAdmin = selectedRole.id === 'admin';
              
              return (
                <div
                  key={permission.id}
                  className={`flex items-center justify-between px-6 py-4 ${isAdmin ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${hasPermission ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                      {permission.icon}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{permission.name}</p>
                      <p className="text-sm text-gray-500">{permission.description}</p>
                    </div>
                  </div>
                  
                  {isAdmin ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="w-5 h-5" />
                      <span className="text-sm">เปิดใช้งานเสมอ</span>
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
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          hasPermission ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white font-medium py-2 px-6 rounded-lg flex items-center gap-2"
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

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">📌 หมายเหตุ</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• <strong>Admin</strong> - มีสิทธิ์ทั้งหมดและไม่สามารถแก้ไขได้</li>
          <li>• <strong>Operator</strong> - จัดการข้อมูลทั่วไป ยกเว้นการจัดการสิทธิ์</li>
          <li>• <strong>Worker</strong> - อัปโหลดรูปภาพราคาเท่านั้น</li>
          <li>• <strong>User</strong> - ดูราคาเท่านั้น ไม่มีสิทธิ์ใน Admin</li>
        </ul>
      </div>
    </div>
  );
}
