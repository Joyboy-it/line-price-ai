'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, X, Loader2, Search, Tag } from 'lucide-react';
import { PriceGroup } from '@/types';

interface Branch {
  id: string;
  name: string;
  code: string;
}

interface ApproveFormProps {
  requestId: string;
  userId: string;
  priceGroups: PriceGroup[];
  branches: Branch[];
}

export default function ApproveForm({ requestId, userId, priceGroups, branches }: ApproveFormProps) {
  const router = useRouter();
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const toggleGroup = (groupId: string) => {
    setSelectedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const toggleBranch = (branchId: string) => {
    setSelectedBranches((prev) =>
      prev.includes(branchId)
        ? prev.filter((id) => id !== branchId)
        : [...prev, branchId]
    );
  };

  const filteredGroups = priceGroups.filter((group) =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleApprove = async () => {
    if (selectedGroups.length === 0) {
      setError('กรุณาเลือกกลุ่มราคาอย่างน้อย 1 กลุ่ม');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/access-requests/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          price_group_ids: selectedGroups,
          branch_ids: selectedBranches,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve request');
      }

      router.push('/admin');
      router.refresh();
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการอนุมัติ');
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt('กรุณาระบุเหตุผลในการปฏิเสธ:');
    if (!reason) return;

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/access-requests/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reject_reason: reason }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject request');
      }

      router.push('/admin');
      router.refresh();
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการปฏิเสธ');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Branch Tags */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Tag className="w-5 h-5" />
          เลือกสาขา
        </h2>
        <div className="flex flex-wrap gap-2">
          {branches.map((branch) => (
            <button
              key={branch.id}
              onClick={() => toggleBranch(branch.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedBranches.includes(branch.id)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {branch.name}
            </button>
          ))}
        </div>
        {selectedBranches.length > 0 && (
          <p className="text-sm text-gray-500 mt-3">
            เลือกแล้ว {selectedBranches.length} สาขา
          </p>
        )}
      </div>

      {/* Price Groups */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">เลือกกลุ่มราคาที่อนุญาต</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="ค้นหากลุ่มราคา..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Group List */}
        <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
          {filteredGroups.length === 0 ? (
            <p className="text-center text-gray-500 py-8">ไม่พบกลุ่มราคาที่ค้นหา</p>
          ) : (
            filteredGroups.map((group) => (
              <label
                key={group.id}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedGroups.includes(group.id)}
                  onChange={() => toggleGroup(group.id)}
                  className="w-4 h-4 text-green-500 rounded focus:ring-green-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-800">{group.name}</p>
                  {group.description && (
                    <p className="text-sm text-gray-500">{group.description}</p>
                  )}
                </div>
              </label>
            ))
          )}
        </div>

        {selectedGroups.length > 0 && (
          <p className="text-sm text-gray-500 mb-4">
            เลือกแล้ว {selectedGroups.length} กลุ่ม
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleApprove}
          disabled={isSubmitting || selectedGroups.length === 0}
          className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              กำลังดำเนินการ...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5" />
              อนุมัติ ({selectedGroups.length} กลุ่ม)
            </>
          )}
        </button>

        <button
          onClick={handleReject}
          disabled={isSubmitting}
          className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2"
        >
          <X className="w-5 h-5" />
          ปฏิเสธ
        </button>
      </div>
    </div>
  );
}
