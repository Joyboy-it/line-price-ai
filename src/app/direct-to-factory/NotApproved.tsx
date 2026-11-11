import Link from 'next/link';
import { Lock } from 'lucide-react';

export default function NotApproved() {
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Lock className="w-8 h-8 text-yellow-700" />
      </div>
      <h1 className="text-xl font-semibold text-gray-800 mb-2">ยังไม่ได้รับอนุญาต</h1>
      <p className="text-gray-600 mb-6">บัญชีนี้ต้องได้รับการอนุมัติก่อน จึงจะแจ้งส่งตรงเข้าโรงงานได้</p>
      <Link href="/" className="btn-secondary inline-block">
        กลับหน้าแรก
      </Link>
    </div>
  );
}
