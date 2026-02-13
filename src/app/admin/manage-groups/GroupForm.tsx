'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, MapPin, X, Check, Search } from 'lucide-react';
import { PriceGroup } from '@/types';

interface GroupFormProps {
  group?: PriceGroup;
  branches: { id: string; name: string; code: string }[];
}

export default function GroupForm({ group, branches }: GroupFormProps) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    name: group?.name || '',
    description: group?.description || '',
    branch_ids: group?.branch_id ? group.branch_id.split(',').filter(Boolean) : [],
    telegram_chat_id: group?.telegram_chat_id || '',
    line_group_id: group?.line_group_id || '',
    is_active: group?.is_active ?? true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [branchSearch, setBranchSearch] = useState('');

  const filteredBranches = branches.filter((branch) =>
    branch.name.toLowerCase().includes(branchSearch.toLowerCase()) ||
    branch.code.toLowerCase().includes(branchSearch.toLowerCase())
  );

  const selectedBranches = branches.filter((b) => formData.branch_ids.includes(b.id));

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      const url = group 
        ? `/api/admin/price-groups/${group.id}`
        : '/api/admin/price-groups';
      
      const method = group ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          branch_id: formData.branch_ids.length > 0 ? formData.branch_ids.join(',') : null,
          telegram_chat_id: formData.telegram_chat_id || null,
          line_group_id: formData.line_group_id || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save group');
      }

      setSuccess(true);
      setIsSubmitting(false);
      
      setTimeout(() => {
        router.push('/admin/manage-groups');
        router.refresh();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      setIsSubmitting(false);
    }
  };

  if (!mounted) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm mb-4">
          ✓ บันทึกข้อมูลสำเร็จ
        </div>
      )}

      <div className="space-y-4">
        {/* ชื่อกลุ่ม */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ชื่อกลุ่ม <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="เช่น กลุ่มราคา A"
          />
        </div>

        {/* คำอธิบาย */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            คำอธิบาย
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับกลุ่มนี้"
          />
        </div>

        {/* สาขา */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="w-4 h-4 inline-block mr-1 text-green-600" />
            สาขา (เลือกได้หลายสาขา)
          </label>

          {/* Selected Tags */}
          {selectedBranches.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedBranches.map((branch) => (
                <div
                  key={branch.id}
                  className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full"
                >
                  {branch.name}
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={() => setFormData({
                      ...formData,
                      branch_ids: formData.branch_ids.filter(id => id !== branch.id)
                    })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setFormData({
                          ...formData,
                          branch_ids: formData.branch_ids.filter(id => id !== branch.id)
                        });
                      }
                    }}
                    className="hover:bg-green-200 rounded-full p-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Search & Actions */}
          <div className="flex items-center gap-2 mb-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="ค้นหาสาขา..."
                value={branchSearch}
                onChange={(e) => setBranchSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, branch_ids: branches.map(b => b.id) })}
              className="text-xs text-green-600 hover:text-green-800 hover:bg-green-50 px-2 py-1.5 rounded-lg whitespace-nowrap"
            >
              เลือกทั้งหมด
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, branch_ids: [] })}
              className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1.5 rounded-lg whitespace-nowrap"
            >
              ยกเลิกทั้งหมด
            </button>
          </div>

          {/* Branch List */}
          <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
            {branches.length === 0 ? (
              <p className="text-sm text-gray-500 p-4 text-center">ไม่มีสาขาในระบบ</p>
            ) : filteredBranches.length === 0 ? (
              <p className="text-sm text-gray-500 p-4 text-center">ไม่พบสาขาที่ค้นหา</p>
            ) : (
              filteredBranches.map((branch, idx) => {
                const isSelected = formData.branch_ids.includes(branch.id);
                return (
                  <div
                    key={branch.id}
                    onClick={() => {
                      if (isSelected) {
                        setFormData({
                          ...formData,
                          branch_ids: formData.branch_ids.filter(id => id !== branch.id)
                        });
                      } else {
                        setFormData({
                          ...formData,
                          branch_ids: [...formData.branch_ids, branch.id]
                        });
                      }
                    }}
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-green-50 hover:bg-green-100'
                        : 'hover:bg-gray-50'
                    } ${idx !== filteredBranches.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-green-500 text-white'
                        : 'border-2 border-gray-300'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1">
                      <span className="text-gray-800 text-sm font-medium">{branch.name}</span>
                      <span className="text-xs text-gray-400 ml-2">({branch.code})</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Status */}
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-500">
              {formData.branch_ids.length > 0
                ? `เลือกแล้ว ${formData.branch_ids.length} จาก ${branches.length} สาขา`
                : 'ยังไม่ได้เลือกสาขา (กลุ่มนี้จะใช้ได้กับทุกสาขา)'}
            </p>
            {formData.branch_ids.length > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                <Check className="w-3 h-3" />
                {formData.branch_ids.length} สาขา
              </span>
            )}
          </div>
        </div>

        {/* Telegram Chat ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Telegram Chat ID
          </label>
          <input
            type="text"
            value={formData.telegram_chat_id}
            onChange={(e) => setFormData({ ...formData, telegram_chat_id: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="เช่น -1001234567890"
          />
          <p className="text-xs text-gray-500 mt-1">
            ใช้สำหรับส่งการแจ้งเตือนไปยังกลุ่ม Telegram
          </p>
        </div>

        {/* LINE Group ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            LINE Group ID
          </label>
          <input
            type="text"
            value={formData.line_group_id}
            onChange={(e) => setFormData({ ...formData, line_group_id: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="เช่น C1234567890abcdef1234567890abcdef"
          />
          <p className="text-xs text-gray-500 mt-1">
            ใช้สำหรับส่งข้อความแจ้งเตือนไปยังกลุ่ม LINE (ไม่ส่งรูปภาพ)
          </p>
        </div>

        {/* สถานะ */}
        {group && (
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
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              กำลังบันทึก...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              บันทึก
            </>
          )}
        </button>
      </div>
    </form>
  );
}
