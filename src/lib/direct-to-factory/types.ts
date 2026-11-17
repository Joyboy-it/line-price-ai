export type OrderStatus = 'customer_submitted' | 'pending' | 'updated' | 'completed' | 'cancelled';

export type OrderFileKind = 'delivery_note' | 'attachment';

/** Row from factory_orders joined with names. Dates are 'YYYY-MM-DD', time is 'HH:MM'. */
export interface FactoryOrderRecord {
  id: string;
  user_id: string;
  customer_name: string | null;
  delivery_date: string;
  factory_id: string;
  factory_name: string;
  product_id: string;
  product_name: string;
  license_plate: string;
  customer_note: string | null;
  offer_id: string | null;
  agent_id: string | null;
  agent_name: string | null;
  price: string | null;
  po_number: string | null;
  delivery_note_number: string | null;
  form_file_path: string | null;
  form_file_name: string | null;
  form_mime_type: string | null;
  confirmed_date: string | null;
  delivery_time: string | null;
  confirmed_factory_id: string | null;
  confirmed_factory_name: string | null;
  confirmed_product_id: string | null;
  confirmed_product_name: string | null;
  staff_note: string | null;
  status: OrderStatus;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FactoryOrderFileRecord {
  id: string;
  kind: OrderFileKind;
  file_name: string;
  file_path: string;
  mime_type: string | null;
  file_size: number | null;
  created_at: string;
}

export interface CustomerOrderFile {
  id: string;
  kind: OrderFileKind;
  file_name: string;
  created_at: string;
}

export interface CustomerOrderView {
  id: string;
  delivery_date: string;
  factory_id: string;
  factory_name: string;
  product_id: string;
  product_name: string;
  license_plate: string;
  customer_note: string | null;
  has_form_file: boolean;
  form_file_name: string | null;
  confirmed_date: string | null;
  delivery_time: string | null;
  confirmed_factory_name: string | null;
  confirmed_product_name: string | null;
  staff_note: string | null;
  status: OrderStatus;
  status_label: string;
  can_edit: boolean;
  can_cancel: boolean;
  files: CustomerOrderFile[];
  created_at: string;
  updated_at: string;
}
