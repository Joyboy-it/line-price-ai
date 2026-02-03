'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  code: string;
  sort_order: number;
  is_active: boolean;
}

export default function EditBranchForm() {
  const router = useRouter();
  const params = useParams();
  const [branch, setBranch] = useState<Branch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBranch();
  }, []);

  const fetchBranch = async () => {
    try {
      const response = await fetch(`/api/admin/branches/${params.id}`);
      if (!response.ok) {
        throw new Error('Branch not found');
      }
      const data = await response.json();
      setBranch(data);
    } catch (err) {
      setError('ไม่พบข้อมูลสาขา');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branch) return;

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/branches/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(branch),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update branch');
      }

      router.push('/admin/branches');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        </div>
      </div>
    );
  }

  if (error || !branch) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error || 'ไม่พบข้อมูลสาขา'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/branches"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">แก้ไขสาขา</h1>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* ชื่อสาขา */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              ชื่อสาขา <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={branch.name}
              onChange={(e) => setBranch({ ...branch, name: e.target.value })}
              required
              placeholder="กรุงเทพมหานคร"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* รหัสสาขา */}
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              รหัสสาขา <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="code"
              value={branch.code}
              onChange={(e) => setBranch({ ...branch, code: e.target.value.toUpperCase() })}
              required
              placeholder="BKK"
              maxLength={10}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono uppercase"
            />
            <p className="text-sm text-gray-500 mt-1">รหัสสาขาสำหรับใช้ในระบบ (สูงสุด 10 ตัวอักษร)</p>
          </div>

          
          {/* สถานะ */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={branch.is_active}
              onChange={(e) => setBranch({ ...branch, is_active: e.target.checked })}
              className="w-4 h-4 text-green-500 rounded focus:ring-green-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              เปิดใช้งาน
            </label>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <Link
              href="/admin/branches"
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-center"
            >
              ยกเลิก
            </Link>
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
      </div>
    </div>
  );
}
