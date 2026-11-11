import type { OrderStatus } from './types';

/** 'YYYY-MM-DD' -> Thai date, without any timezone shift. */
export function formatThaiDate(value: string | null): string {
  if (!value) return '-';
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('th-TH', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatThaiDateTime(value: string): string {
  return new Date(value).toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    day: 'numeric',
    month: 'short',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const STATUS_BADGE_CLASSES: Record<OrderStatus, string> = {
  customer_submitted: 'bg-blue-100 text-blue-700',
  pending: 'bg-yellow-100 text-yellow-800',
  updated: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-200 text-gray-700',
};
