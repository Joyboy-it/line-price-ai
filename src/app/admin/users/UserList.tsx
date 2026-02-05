'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Filter, FileText, MapPin, Tag, Link2, Shield, Power, X, User as UserIcon } from 'lucide-react';
import { User, PriceGroup } from '@/types';
import { hasPermission } from '@/lib/permissions';

interface UserWithGroups extends User {
  groups: PriceGroup[];
  branches: string[];
}

interface UserListProps {
  users: UserWithGroups[];
  priceGroups: PriceGroup[];
  branches: { id: string; name: string; code: string }[];
  currentUserRole: 'admin' | 'operator';
}

export default function UserList({ users, priceGroups, branches, currentUserRole }: UserListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState<string>('ทั้งหมด');
  const [roleFilter, setRoleFilter] = useState<string>('ทั้งหมด');
  const [statusFilter, setStatusFilter] = useState<string>('ทั้งหมด');
  const [selectedUser, setSelectedUser] = useState<UserWithGroups | null>(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // ใช้ role จาก server-side แทน useSession เพื่อแก้ปัญหา session loading
  const canManageRoles = hasPermission(currentUserRole, 'manage_roles');
  const canToggleUserStatus = hasPermission(currentUserRole, 'toggle_user_status');

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.shop_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesBranch = branchFilter === 'ทั้งหมด' || user.branches.includes(branchFilter);
    const matchesRole = roleFilter === 'ทั้งหมด' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'ทั้งหมด' || 
      (statusFilter === 'active' && user.is_active) ||
      (statusFilter === 'inactive' && !user.is_active);
    
    return matchesSearch && matchesBranch && matchesRole && matchesStatus;
  });

  const handleToggleUserStatus = async (userId: string, userName: string, currentStatus: boolean) => {
    const action = currentStatus ? 'ปิดการใช้งาน' : 'เปิดการใช้งาน';
    if (!confirm(`คุณต้องการ${action}ผู้ใช้ "${userName}" หรือไม่?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !currentStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || `ไม่สามารถ${action}ผู้ใช้ได้`);
        return;
      }

      alert(`${action}ผู้ใช้สำเร็จ`);
      window.location.reload();
    } catch (error) {
      alert(`เกิดข้อผิดพลาดในการ${action}ผู้ใช้`);
    }
  };

  const handleRemoveGroup = async (userId: string, groupId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/groups/${groupId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove group');
      }

      window.location.reload();
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการลบกลุ่ม');
    }
  };

  const handleRemoveBranch = async (userId: string, branchName: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/branches`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchName }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove branch');
      }

      window.location.reload();
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการลบสาขา');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-medium">Admin</span>;
      case 'operator':
        return <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-medium">Operator</span>;
      case 'worker':
        return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium">Worker</span>;
      default:
        return null;
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="ค้นหาผู้ใช้ (ชื่อ, อีเมล)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option>ทั้งหมด</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.name}>
              {branch.name}
            </option>
          ))}
        </select>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option>ทั้งหมด</option>
          <option value="user">User</option>
          <option value="worker">Worker</option>
          <option value="operator">Operator</option>
          <option value="admin">Admin</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option>ทั้งหมด</option>
          <option value="active">ใช้งาน</option>
          <option value="inactive">ไม่ใช้งาน</option>
        </select>
      </div>

      {/* User Count */}
      <p className="text-sm text-gray-500 mb-4">
        แสดง {filteredUsers.length} จาก {users.length} รายการ
      </p>

      {/* User List */}
      <div className="space-y-4">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="bg-white border border-gray-200 rounded-lg p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name || 'User'}
                    width={48}
                    height={48}
                    className="rounded-full flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <UserIcon className="w-6 h-6 text-gray-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-800 truncate">{user.name || 'ไม่ระบุชื่อ'}</h3>
                  <div className="flex flex-wrap items-center gap-1 mt-1">
                    {getRoleBadge(user.role)}
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      user.is_active 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {user.is_active ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                    </span>
                  </div>
                  {user.shop_name && (
                    <p className="text-sm text-gray-500 mt-1 truncate">🏪 {user.shop_name}</p>
                  )}
                  {user.phone && (
                    <p className="text-sm text-gray-500 truncate">📞 {user.phone}</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <Link
                  href={`/admin/users/${user.id}`}
                  className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                  title="ดูและแก้ไขรายละเอียดผู้ใช้"
                >
                  <FileText className="w-5 h-5" />
                </Link>
                <button
                  onClick={() => {
                    setSelectedUser(user);
                    setShowBranchModal(true);
                  }}
                  className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-50 rounded-lg"
                  title="แก้ไขสาขา"
                >
                  <MapPin className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setSelectedUser(user);
                    setShowGroupModal(true);
                  }}
                  className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-50 rounded-lg"
                  title="แก้ไขกลุ่ม"
                >
                  <Tag className="w-5 h-5" />
                </button>
                {canManageRoles && (
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setShowEditModal(true);
                    }}
                    className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    title="แก้ไขสิทธิ์"
                  >
                    <Shield className="w-5 h-5" />
                  </button>
                )}
                {canToggleUserStatus && (
                  <button
                    onClick={() => handleToggleUserStatus(user.id, user.name || 'ผู้ใช้', user.is_active)}
                    className={`p-2 rounded-lg ${
                      user.is_active
                        ? 'text-orange-500 hover:text-orange-600 hover:bg-orange-50'
                        : 'text-green-500 hover:text-green-600 hover:bg-green-50'
                    }`}
                    title={user.is_active ? 'ปิดการใช้งาน' : 'เปิดการใช้งาน'}
                  >
                    <Power className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Groups */}
            {user.groups.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-1">กลุ่มราคา:</p>
                <div className="flex flex-wrap gap-1">
                  {user.groups.map((group) => (
                    <span
                      key={group.id}
                      className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs flex items-center gap-1"
                    >
                      {group.name}
                      <button
                        onClick={() => handleRemoveGroup(user.id, group.id)}
                        className="hover:text-green-900"
                        title="ลบกลุ่มนี้"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Branches */}
            {user.branches.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-gray-500 mb-1">สาขา:</p>
                <div className="flex flex-wrap gap-1">
                  {user.branches.map((branch, idx) => (
                    <span
                      key={idx}
                      className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs flex items-center gap-1"
                    >
                      {branch}
                      <button
                        onClick={() => handleRemoveBranch(user.id, branch)}
                        className="hover:text-blue-900"
                        title="ลบสาขานี้"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {user.note && (
              <div className="mt-2 text-sm text-gray-500">
                <span className="font-medium">หมายเหตุ:</span> {user.note}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modals */}
      {showGroupModal && selectedUser && (
        <GroupModal
          user={selectedUser}
          priceGroups={priceGroups}
          onClose={() => {
            setShowGroupModal(false);
            setSelectedUser(null);
          }}
        />
      )}

      {showBranchModal && selectedUser && (
        <BranchModal
          user={selectedUser}
          branches={branches}
          onClose={() => {
            setShowBranchModal(false);
            setSelectedUser(null);
          }}
        />
      )}

      {showEditModal && selectedUser && (
        <EditUserModal 
          user={selectedUser} 
          onClose={() => setShowEditModal(false)} 
          canManageRoles={canManageRoles}
        />
      )}
    </div>
  );
}

// Group Modal Component
function GroupModal({ user, priceGroups, onClose }: { user: UserWithGroups; priceGroups: PriceGroup[]; onClose: () => void }) {
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const availableGroups = priceGroups.filter(
    (pg) => !user.groups.some((ug) => ug.id === pg.id)
  );

  const filteredGroups = availableGroups.filter((group) =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddGroups = async () => {
    if (selectedGroups.length === 0) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupIds: selectedGroups }),
      });

      if (!response.ok) throw new Error('Failed to add groups');

      alert('เพิ่มกลุ่มสำเร็จ');
      window.location.reload();
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการเพิ่มกลุ่ม');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">จัดการกลุ่มราคา</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">ผู้ใช้: {user.name}</p>

          {/* Search Box */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="ค้นหากลุ่ม..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {filteredGroups.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              {availableGroups.length === 0 ? 'ไม่มีกลุ่มที่สามารถเพิ่มได้' : 'ไม่พบกลุ่มที่ค้นหา'}
            </p>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {filteredGroups.map((group) => (
                  <label key={group.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedGroups.includes(group.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedGroups([...selectedGroups, group.id]);
                        } else {
                          setSelectedGroups(selectedGroups.filter((id) => id !== group.id));
                        }
                      }}
                      className="w-4 h-4 text-green-500 rounded"
                    />
                    <span className="text-gray-800">{group.name}</span>
                  </label>
                ))}
              </div>

              <button
                onClick={handleAddGroups}
                disabled={isSubmitting || selectedGroups.length === 0}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg"
              >
                {isSubmitting ? 'กำลังเพิ่ม...' : `เพิ่มกลุ่ม (${selectedGroups.length})`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Branch Modal Component
function BranchModal({ user, branches, onClose }: { user: UserWithGroups; branches: { id: string; name: string; code: string }[]; onClose: () => void }) {
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableBranches = branches.filter(
    (b) => !user.branches.includes(b.name)
  );

  const handleAddBranches = async () => {
    if (selectedBranches.length === 0) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/branches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchIds: selectedBranches }),
      });

      if (!response.ok) throw new Error('Failed to add branches');

      alert('เพิ่มสาขาสำเร็จ');
      window.location.reload();
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการเพิ่มสาขา');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">จัดการสาขา</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">ผู้ใช้: {user.name}</p>

          {availableBranches.length === 0 ? (
            <p className="text-gray-500 text-center py-4">ไม่มีสาขาที่สามารถเพิ่มได้</p>
          ) : (
            <>
              <div className="space-y-2 mb-4">
                {availableBranches.map((branch) => (
                  <label key={branch.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedBranches.includes(branch.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedBranches([...selectedBranches, branch.id]);
                        } else {
                          setSelectedBranches(selectedBranches.filter((id) => id !== branch.id));
                        }
                      }}
                      className="w-4 h-4 text-purple-500 rounded"
                    />
                    <span className="text-gray-800">{branch.name}</span>
                  </label>
                ))}
              </div>

              <button
                onClick={handleAddBranches}
                disabled={isSubmitting || selectedBranches.length === 0}
                className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg"
              >
                {isSubmitting ? 'กำลังเพิ่ม...' : `เพิ่มสาขา (${selectedBranches.length})`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Edit User Modal Component
function EditUserModal({ user, onClose, canManageRoles }: { user: UserWithGroups; onClose: () => void; canManageRoles: boolean }) {
  const [formData, setFormData] = useState({
    role: user.role,
    is_active: user.is_active,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to update user');

      alert('อัปเดตข้อมูลสำเร็จ');
      window.location.reload();
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">แก้ไขสิทธ์ผู้ใช้</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-4">ผู้ใช้: {user.name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">บทบาท</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
              disabled={!canManageRoles}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="user">User</option>
              <option value="worker">Worker</option>
              <option value="operator">Operator</option>
              <option value="admin">Admin</option>
            </select>
            {!canManageRoles && (
              <p className="text-xs text-gray-500 mt-1">⚠️ คุณไม่มีสิทธิ์แก้ไขบทบาทผู้ใช้</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-green-500 rounded"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              เปิดใช้งาน
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white py-2 px-4 rounded-lg"
            >
              {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
