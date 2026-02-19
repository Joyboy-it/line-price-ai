'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Send, Loader2 } from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  code: string;
}

interface RequestAccessFormProps {
  onSuccess?: () => void;
}

export default function RequestAccessForm({ onSuccess }: RequestAccessFormProps) {
  const { data: session, status } = useSession();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [shopName, setShopName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Fetch branches
    fetch('/api/branches')
      .then(res => res.json())
      .then(data => setBranches(data))
      .catch(err => console.error('Failed to fetch branches:', err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Session:', session);
    console.log('User ID:', session?.user?.id);
    
    if (!session?.user?.id) {
      setError('กรุณาเข้าสู่ระบบก่อนส่งคำขอ');
      return;
    }

    setIsSubmitting(true);
    setError('');

    if (!selectedBranch) {
      setError('กรุณาเลือกสาขา');
      return;
    }

    try {
      const response = await fetch('/api/access-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          branch_id: selectedBranch,
          shop_name: shopName,
          phone,
          note 
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit request');
      }

      setSuccess(true);
      setShopName('');
      setPhone('');
      setNote('');
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p className="text-gray-500">กำลังตรวจสอบสถานะ...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-800">กรุณาเข้าสู่ระบบก่อนส่งคำขอ</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Send className="w-6 h-6 text-green-600" />
        </div>
        <h3 className="text-lg font-medium text-green-800 mb-2">ส่งคำขอสำเร็จ!</h3>
        <p className="text-green-600 text-sm">
          คำขอของคุณถูกส่งเรียบร้อยแล้ว กรุณารอการอนุมัติจากผู้ดูแลระบบ
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-1">
          สาขา <span className="text-red-500">*</span>
        </label>
        <select
          id="branch"
          value={selectedBranch}
          onChange={(e) => setSelectedBranch(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="">-- เลือกสาขา --</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="shopName" className="block text-sm font-medium text-gray-700 mb-1">
          ชื่อร้านของท่าน <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="shopName"
          value={shopName}
          onChange={(e) => setShopName(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="กรอกชื่อร้านของท่าน"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          เบอร์โทรศัพท์ <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          id="phone"
          value={phone}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
            let formatted = digits;
            if (digits.length > 6) formatted = digits.slice(0, 3) + '-' + digits.slice(3, 6) + '-' + digits.slice(6);
            else if (digits.length > 3) formatted = digits.slice(0, 3) + '-' + digits.slice(3);
            setPhone(formatted);
          }}
          required
          maxLength={12}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="0XX-XXX-XXXX"
        />
        {phone && phone.replace(/\D/g, '').length < 10 && (
          <p className="text-xs text-red-500 mt-1">กรุณากรอกเบอร์โทร 10 หลัก</p>
        )}
      </div>

      <div>
        <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
          หมายเหตุ
        </label>
        <textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          placeholder="ข้อมูลเพิ่มเติม (ถ้ามี)"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || !shopName || phone.replace(/\D/g, '').length < 10}
        className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            กำลังส่ง...
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            ส่งคำขอ
          </>
        )}
      </button>
    </form>
  );
}
