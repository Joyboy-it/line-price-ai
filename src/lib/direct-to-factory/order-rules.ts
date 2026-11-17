import type {
  CustomerOrderView,
  FactoryOrderFileRecord,
  FactoryOrderRecord,
  OrderStatus,
} from './types';

export const ORDER_STATUSES: OrderStatus[] = ['customer_submitted', 'pending', 'updated', 'completed', 'cancelled'];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  customer_submitted: 'ลูกค้าแจ้ง',
  pending: 'รอดำเนินการ',
  updated: 'อัพเดทข้อมูล',
  completed: 'จบรายการ',
  cancelled: 'ยกเลิก',
};

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === 'string' && (ORDER_STATUSES as string[]).includes(value);
}

export function canCustomerEdit(order: Pick<FactoryOrderRecord, 'confirmed_date' | 'status'>): boolean {
  return order.confirmed_date === null && order.status !== 'cancelled' && order.status !== 'completed';
}

/** Staff has moved the order past the customer's original submission. */
export function orderWasProcessed(order: Pick<FactoryOrderRecord, 'confirmed_date' | 'status'>): boolean {
  return order.confirmed_date !== null || order.status === 'pending' || order.status === 'updated' || order.status === 'completed';
}

/** Customers may cancel only before staff starts processing the order. */
export function canCustomerCancel(order: Pick<FactoryOrderRecord, 'confirmed_date' | 'status'>): boolean {
  return order.status === 'customer_submitted' && order.confirmed_date === null;
}

/** After processing, only an admin may cancel. Operators may cancel an untouched submission. */
export function canStaffCancel(role: string, order: Pick<FactoryOrderRecord, 'confirmed_date' | 'status'>): boolean {
  if (order.status === 'cancelled') return false;
  if (role === 'admin') return true;
  return role === 'operator' && !orderWasProcessed(order);
}

/**
 * The only shape that may leave the server on customer routes.
 * Price, agent, PO and delivery note numbers are back-office data.
 */
export function toCustomerView(order: FactoryOrderRecord, files: FactoryOrderFileRecord[]): CustomerOrderView {
  return {
    id: order.id,
    delivery_date: order.delivery_date,
    factory_id: order.factory_id,
    factory_name: order.factory_name,
    product_id: order.product_id,
    product_name: order.product_name,
    license_plate: order.license_plate,
    customer_note: order.customer_note,
    has_form_file: order.form_file_path !== null,
    form_file_name: order.form_file_name,
    confirmed_date: order.confirmed_date,
    delivery_time: order.delivery_time,
    confirmed_factory_name: order.confirmed_factory_name,
    confirmed_product_name: order.confirmed_product_name,
    staff_note: order.staff_note,
    status: order.status,
    status_label: ORDER_STATUS_LABELS[order.status],
    can_edit: canCustomerEdit(order),
    can_cancel: canCustomerCancel(order),
    files: files.map((file) => ({
      id: file.id,
      kind: file.kind,
      file_name: file.file_name,
      created_at: file.created_at,
    })),
    created_at: order.created_at,
    updated_at: order.updated_at,
  };
}
