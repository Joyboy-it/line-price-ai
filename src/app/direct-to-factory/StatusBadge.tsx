import { STATUS_BADGE_CLASSES } from '@/lib/direct-to-factory/format';
import { ORDER_STATUS_LABELS } from '@/lib/direct-to-factory/order-rules';
import type { OrderStatus } from '@/lib/direct-to-factory/types';

export default function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_BADGE_CLASSES[status]}`}>
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}
