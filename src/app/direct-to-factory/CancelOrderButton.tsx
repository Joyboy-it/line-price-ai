'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmModal from '@/components/ConfirmModal';
import { fetchJson } from '@/lib/direct-to-factory/fetch-json';

export default function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  const cancel = async () => {
    try {
      await fetchJson(`/api/direct-to-factory/orders/${orderId}`, { method: 'DELETE' });
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <>
      <button type="button" className="btn-danger min-h-[44px]" onClick={() => setOpen(true)}>
        ยกเลิกรายการ
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-600 w-full">
          {error}
        </p>
      )}
      <ConfirmModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={cancel}
        title="ยกเลิกรายการส่งตรงเข้าโรงงาน"
        message="เมื่อยกเลิกแล้วจะแก้ไขรายการนี้ไม่ได้อีก"
        confirmText="ยกเลิก"
      />
    </>
  );
}
