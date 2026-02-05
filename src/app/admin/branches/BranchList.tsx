'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, MapPin, Edit, Trash2, Search } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import ConfirmModal from '@/components/ConfirmModal';

interface Branch {
  id: string;
  name: string;
  code: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface BranchListProps {
  branches: Branch[];
}

export default function BranchList({ branches }: BranchListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>(branches);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => Promise<void>;
  }>({ isOpen: false, title: '', message: '', onConfirm: async () => {} });

  useEffect(() => {
    const filtered = branches.filter((branch) =>
      branch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredBranches(filtered);
  }, [searchTerm, branches]);

  const handleDelete = async (id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'ยืนยันการลบสาขา',
      message: `คุณต้องการลบสาขา "${name}" หรือไม่? การลบจะส่งผลต่อผู้ใช้ที่เข้าถึงสาขานี้`,
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/admin/branches/${id}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            const data = await response.json();
            alert(data.error || 'ไม่สามารถลบสาขาได้');
            return;
          }

          alert('ลบสาขาสำเร็จ');
          window.location.reload();
        } catch (error) {
          alert('เกิดข้อผิดพลาดในการลบสาขา');
        }
      },
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <MapPin className="w-6 h-6 text-green-600" />
          จัดการสาขา
        </h1>
        <Link
          href="/admin/branches/create"
          className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          เพิ่มสาขา
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{branches.length}</p>
              <p className="text-sm text-gray-500">สาขาทั้งหมด</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-bold">✓</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {branches.filter(b => b.is_active).length}
              </p>
              <p className="text-sm text-gray-500">สาขาที่ใช้งาน</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-bold">✕</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {branches.filter(b => !b.is_active).length}
              </p>
              <p className="text-sm text-gray-500">สาขาที่ไม่ใช้งาน</p>
            </div>
          </div>
        </div>
      </div>

      {/* Branches List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">รายชื่อสาขา</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="ค้นหาสาขา..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent w-64"
              />
            </div>
          </div>
          
          {filteredBranches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>{branches.length === 0 ? 'ยังไม่มีข้อมูลสาขา' : 'ไม่พบสาขาที่ค้นหา'}</p>
              {branches.length === 0 && (
                <Link
                  href="/admin/branches/create"
                  className="inline-flex items-center gap-2 mt-4 text-green-600 hover:text-green-700 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  เพิ่มสาขาแรก
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">ชื่อสาขา</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">รหัส</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">สถานะ</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">วันที่สร้าง</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBranches.map((branch) => (
                    <tr key={branch.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-800">{branch.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-mono">
                          {branch.code}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          branch.is_active 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {branch.is_active ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-sm">
                        {formatDateTime(branch.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/admin/branches/${branch.id}/edit`}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="แก้ไข"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(branch.id, branch.name)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="ลบ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText="yes"
        type="danger"
      />
    </div>
  );
}
