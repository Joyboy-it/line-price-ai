'use client';

import { useEffect, useState } from 'react';
import { MessageSquare, CheckCircle, AlertTriangle, BarChart3 } from 'lucide-react';

interface LineUsageData {
  totalMessages: number;
  thisMonth: number;
  lastMonth: number;
  freeQuotaRemaining: number;
  freeQuotaLimit: number;
  percentUsed: number;
  error: string | null;
}

export default function LineUsage() {
  const [data, setData] = useState<LineUsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLineUsage();
  }, []);

  const fetchLineUsage = async () => {
    try {
      const response = await fetch('/api/admin/line-usage', {
        cache: 'no-store',
      });
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching LINE usage:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-green-600" />
          LINE Messaging API Usage
        </h2>
        <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </section>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-green-600" />
        LINE Messaging API Usage
      </h2>
      
      {data.error ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-800 mb-1">ไม่สามารถดึงข้อมูลการใช้งาน LINE API</h3>
              <p className="text-sm text-yellow-700">{data.error}</p>
              <p className="text-xs text-yellow-600 mt-2">
                ตรวจสอบว่า LINE_CHANNEL_ACCESS_TOKEN ถูกต้องใน .env.local
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Messages This Month */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <p className="text-sm text-gray-600">ข้อความเดือนนี้</p>
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-2">{data.thisMonth}</h3>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div
                className={`h-2 rounded-full ${
                  data.percentUsed > 80 ? 'bg-red-500' :
                  data.percentUsed > 50 ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min(data.percentUsed, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">
              {data.percentUsed}% ของ Free Quota
            </p>
          </div>

          {/* Quota Remaining */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-sm text-gray-600">Quota คงเหลือ</p>
              </div>
            </div>
            <h3 className="text-3xl font-bold text-green-700 mb-2">{data.freeQuotaRemaining}</h3>
            <p className="text-xs text-gray-600">
              จาก {data.freeQuotaLimit} ข้อความฟรี/เดือน
            </p>
          </div>

          {/* Status */}
          <div className={`border rounded-lg p-6 ${
            data.percentUsed > 80 ? 'bg-red-50 border-red-200' :
            data.percentUsed > 50 ? 'bg-yellow-50 border-yellow-200' :
            'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className={`w-5 h-5 ${
                  data.percentUsed > 80 ? 'text-red-600' :
                  data.percentUsed > 50 ? 'text-yellow-600' :
                  'text-blue-600'
                }`} />
                <p className="text-sm text-gray-600">สถานะ</p>
              </div>
            </div>
            <h3 className={`text-2xl font-bold mb-2 ${
              data.percentUsed > 80 ? 'text-red-700' :
              data.percentUsed > 50 ? 'text-yellow-700' :
              'text-blue-700'
            }`}>
              {data.percentUsed > 80 ? '⚠️ ใกล้หมด' :
               data.percentUsed > 50 ? '⚡ ปานกลาง' :
               '✅ ปกติ'}
            </h3>
            <p className="text-xs text-gray-600">
              {data.percentUsed > 80 ? 'ควรระวังการใช้งาน' :
               data.percentUsed > 50 ? 'ยังใช้งานได้ปกติ' :
               'ใช้งานได้อย่างสบาย'}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
