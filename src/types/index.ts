export type UserRole = 'user' | 'worker' | 'operator' | 'admin';
export type RequestStatus = 'pending' | 'approved' | 'rejected';
export type LogAction = 
  | 'login' | 'logout' | 'register'
  | 'upload_image' | 'delete_image'
  | 'create_group' | 'update_group' | 'delete_group'
  | 'create_branch' | 'update_branch' | 'delete_branch'
  | 'create_announcement' | 'update_announcement' | 'delete_announcement'
  | 'approve_request' | 'reject_request'
  | 'update_user' | 'delete_user';

export interface User {
  id: string;
  provider_id: string;
  provider: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: UserRole;
  shop_name: string | null;
  phone: string | null;
  address: string | null;
  bank_info: Record<string, string> | null;
  note: string | null;
  is_active: boolean;
  email_verified_at: Date | null;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

export interface PriceGroup {
  id: string;
  name: string;
  description: string | null;
  branch_id: string | null;
  telegram_chat_id: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
  branch_name?: string;
  branch_code?: string;
  image_count?: number;
  last_image_at?: Date | null;
  user_count?: number;
}

export interface AccessRequest {
  id: string;
  user_id: string;
  branch_id: string | null;
  shop_name: string;
  note: string | null;
  status: RequestStatus;
  reject_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: Date | null;
  created_at: Date;
  updated_at: Date;
  user?: User;
  reviewer?: User;
  requested_branch?: Branch;
  branches?: Branch[];
}

export interface UserGroupAccess {
  user_id: string;
  price_group_id: string;
  granted_by: string | null;
  expires_at: Date | null;
  created_at: Date;
}

export interface PriceGroupImage {
  id: string;
  price_group_id: string;
  file_path: string;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  title: string | null;
  sort_order: number;
  uploaded_by: string | null;
  created_at: Date;
}

export interface Announcement {
  id: string;
  title: string;
  body: string | null;
  image_path: string | null;
  is_published: boolean;
  publish_at: Date | null;
  expire_at: Date | null;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
  creator_name?: string;
  image_count?: number;
  images?: AnnouncementImage[];
}

export interface AnnouncementImage {
  id: string;
  announcement_id: string;
  image_path: string;
  sort_order: number;
  created_at: Date;
}

export interface UserLog {
  id: string;
  user_id: string | null;
  action: LogAction;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
  user?: User;
}

export interface DashboardStats {
  pending_requests: number;
  approved_requests: number;
  total_users: number;
  total_groups: number;
  active_groups: number;
  total_images: number;
}
