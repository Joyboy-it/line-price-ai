import { Truck } from 'lucide-react';

export default function ShipmentNoticePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <Truck className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">แจ้งส่งสินค้า</h1>
          <p className="text-gray-600">ยังไม่มีรายการ</p>
        </div>
      </div>
    </div>
  );
}
