import { ORDER_STATUS_LABELS } from '@/lib/direct-to-factory/order-rules';
import type { OrderStatus } from '@/lib/direct-to-factory/types';

const STEPS = ['customer_submitted', 'pending', 'updated', 'completed'] as const;

function dotClass(state: 'done' | 'current' | 'upcoming', compact: boolean): string {
  const size = compact ? 'w-2.5 h-2.5' : 'w-3 h-3';
  if (state === 'upcoming') return `${size} rounded-full border-2 border-gray-400 bg-white shrink-0`;
  if (state === 'current') return `${size} rounded-full bg-green-600 ring-2 ring-green-600 ring-offset-2 shrink-0`;
  return `${size} rounded-full bg-green-600 shrink-0`;
}

export default function StatusStepper({ status, compact = false }: { status: OrderStatus; compact?: boolean }) {
  if (status === 'cancelled') {
    return <p className="text-sm font-medium text-gray-700">ยกเลิก</p>;
  }

  const current = STEPS.indexOf(status);

  return (
    <div className={compact ? 'flex items-center gap-2 min-w-0' : 'w-full'}>
      <ol className={`flex items-start ${compact ? '' : 'w-full'}`} aria-label="สถานะรายการ">
        {STEPS.map((step, index) => {
          const state = index < current ? 'done' : index === current ? 'current' : 'upcoming';
          const connector = index < current ? 'bg-green-600' : 'bg-gray-200';
          return (
            <li key={step} className={compact ? 'flex items-center' : 'flex-1 min-w-0'} aria-current={state === 'current' ? 'step' : undefined}>
              <div className={`flex items-center ${compact ? '' : 'w-full'}`}>
                <span className={dotClass(state, compact)} />
                {index < STEPS.length - 1 && (
                  <span className={`${compact ? 'w-3' : 'flex-1'} h-0.5 ${connector}`} aria-hidden="true" />
                )}
              </div>
              {!compact && (
                <span className={`mt-2 block text-xs leading-4 ${state === 'current' ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                  {ORDER_STATUS_LABELS[step]}
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {compact && <span className="text-sm font-medium text-gray-800">{ORDER_STATUS_LABELS[status]}</span>}
    </div>
  );
}
