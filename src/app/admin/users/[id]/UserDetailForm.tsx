'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { User as UserIcon, Save, Loader2 } from 'lucide-react';
import { User } from '@/types';

interface UserDetailFormProps {
  user: User;
}

export default function UserDetailForm({ user }: UserDetailFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    shop_name: user.shop_name || '',
    phone: user.phone || '',
    address: user.address || '',
    bank_name: (user.bank_info as any)?.bank_name || '',
    bank_account: (user.bank_info as any)?.bank_account || '',
    note: user.note || '',
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
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_name: formData.shop_name,
          phone: formData.phone,
          address: formData.address,
          bank_info: {
            bank_name: formData.bank_name,
            bank_account: formData.bank_account,
          },
          note: formData.note,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update user');
      }

      setSuccess(true);
      setIsSubmitting(false);
      
      setTimeout(() => {
        router.push('/admin/users');
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6">
      {/* User Profile Header */}
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name || 'User'}
            width={64}
            height={64}
            className="rounded-full"
          />
        ) : (
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
            <UserIcon className="w-8 h-8 text-gray-500" />
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold text-gray-800">{user.name || 'ไม่ระบุชื่อ'}</h2>
          <p className="text-gray-500 text-sm">{user.email || 'ไม่มีอีเมล'}</p>
        </div>
      </div>

      {/* Messages */}
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

      {/* Form Fields */}
      <div className="space-y-4">
        {/* ชื่อร้าน */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            🏪 ชื่อร้าน
          </label>
          <input
            type="text"
            value={formData.shop_name}
            onChange={(e) => setFormData({ ...formData, shop_name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="scharoenchai / Local Host"
          />
        </div>

        {/* เบอร์โทรศัพท์ */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            📞 เบอร์โทรศัพท์
          </label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="0xx-xxx-xxxx"
          />
        </div>

        {/* ที่อยู่ */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            📍 ที่อยู่
          </label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="ที่อยู่สำหรับจัดส่ง"
          />
        </div>

        {/* ธนาคาร และ เลขบัญชี */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              🏦 ธนาคาร
            </label>
            <input
              type="text"
              value={formData.bank_name}
              onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="ชื่อธนาคาร"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              💳 เลขบัญชี
            </label>
            <input
              type="text"
              value={formData.bank_account}
              onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="xxx-x-xxxxx-x"
            />
          </div>
        </div>

        {/* หมายเหตุ */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            📝 หมายเหตุ
          </label>
          <textarea
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="หมายเหตุเพิ่มเติม"
          />
        </div>
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
