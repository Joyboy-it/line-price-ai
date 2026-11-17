import { ChevronDown } from 'lucide-react';
import { formatThaiDateTime } from '@/lib/direct-to-factory/format';
import { describeFactoryOrderLog } from '@/lib/direct-to-factory/order-log';
import type { FactoryOrderActivity } from '@/lib/direct-to-factory/queries';

export default function OrderHistory({ logs }: { logs: FactoryOrderActivity[] }) {
  return (
    <details open className="card group">
      <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden min-h-11 px-4 py-3 sm:px-6 flex items-center justify-between gap-3 font-semibold text-gray-800 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500">
        <span>ประวัติการแก้ไข</span>
        <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-600">
          {logs.length} รายการ
          <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
        </span>
      </summary>
      <div className="border-t border-gray-100 px-4 sm:px-6">
        {logs.length === 0 ? (
          <p className="py-4 text-sm text-gray-600">ยังไม่มีประวัติการแก้ไข</p>
        ) : (
          <ol className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {logs.map((log) => {
              const described = describeFactoryOrderLog(log.action, log.details);
              return (
                <li key={log.id} className="py-3 flex flex-col gap-1">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{log.user_name || 'ไม่ทราบชื่อ'}</span>
                      <span className="text-gray-600"> · {described.title}</span>
                    </p>
                    {described.detail ? <p className="text-sm text-gray-600 break-words">{described.detail}</p> : null}
                  </div>
                  <time dateTime={log.created_at} className="text-sm text-gray-500 shrink-0">
                    {formatThaiDateTime(log.created_at)}
                  </time>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </details>
  );
}
