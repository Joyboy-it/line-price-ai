'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2 } from 'lucide-react';
import { PriceGroup } from '@/types';

interface GroupFormProps {
  group?: PriceGroup;
  branches: { id: string; name: string; code: string }[];
}

export default function GroupForm({ group, branches }: GroupFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: group?.name || '',
    description: group?.description || '',
    branch_id: group?.branch_id || '',
    telegram_chat_id: group?.telegram_chat_id || '',
    line_group_id: group?.line_group_id || '',
    is_active: group?.is_active ?? true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
          branch_id: formData.branch_id || null,
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
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      setIsSubmitting(false);
    }
  };

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
            สาขา
          </label>
          <select
            value={formData.branch_id}
            onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">-- ไม่ระบุสาขา --</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
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
