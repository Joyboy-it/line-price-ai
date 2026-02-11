'use client';

import { useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { User as UserIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface LogWithUser {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Date;
  user_name: string | null;
  user_image: string | null;
}

interface LogsClientProps {
  logs: LogWithUser[];
  actionLabels: Record<string, { label: string; color: string }>;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  currentAction: string;
}

export default function LogsClient({ logs, actionLabels, currentPage, totalPages, totalCount, currentAction }: LogsClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('user') || '');

  const navigateTo = (page: number, action?: string) => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', page.toString());
    if (action) params.set('action', action);
    const query = params.toString();
    router.push(`/admin/logs${query ? `?${query}` : ''}`);
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch = !searchTerm || 
        log.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ip_address?.includes(searchTerm);
      return matchesSearch;
    });
  }, [logs, searchTerm]);

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="ค้นหาชื่อผู้ใช้หรือ IP..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
        <select 
          value={currentAction}
          onChange={(e) => navigateTo(1, e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        >
          <option value="">ทุกกิจกรรม</option>
          <optgroup label="การเข้าใช้งาน">
            <option value="login">เข้าสู่ระบบ</option>
            <option value="logout">ออกจากระบบ</option>
            <option value="register">ลงทะเบียน</option>
          </optgroup>
          <optgroup label="รูปภาพ">
            <option value="upload_image">อัปโหลดรูป</option>
            <option value="delete_image">ลบรูป</option>
          </optgroup>
          <optgroup label="กลุ่มราคา">
            <option value="create_group">สร้างกลุ่มราคา</option>
            <option value="update_group">แก้ไขกลุ่มราคา</option>
            <option value="delete_group">ลบกลุ่มราคา</option>
          </optgroup>
          <optgroup label="สาขา">
            <option value="create_branch">สร้างสาขา</option>
            <option value="update_branch">แก้ไขสาขา</option>
            <option value="delete_branch">ลบสาขา</option>
          </optgroup>
          <optgroup label="ประกาศ">
            <option value="create_announcement">สร้างประกาศ</option>
            <option value="update_announcement">แก้ไขประกาศ</option>
            <option value="delete_announcement">ลบประกาศ</option>
          </optgroup>
          <optgroup label="คำขอเข้าใช้งาน">
            <option value="approve_request">อนุมัติคำขอ</option>
            <option value="reject_request">ปฏิเสธคำขอ</option>
          </optgroup>
          <optgroup label="ผู้ใช้">
            <option value="update_user">แก้ไขผู้ใช้</option>
            <option value="delete_user">ลบผู้ใช้</option>
          </optgroup>
        </select>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        แสดง {filteredLogs.length} จาก {totalCount} รายการ (หน้า {currentPage}/{totalPages || 1})
        {(searchTerm || currentAction) && (
          <button
            onClick={() => {
              setSearchTerm('');
              navigateTo(1);
            }}
            className="ml-2 text-green-600 hover:text-green-700 underline"
          >
            ล้างตัวกรอง
          </button>
        )}
      </p>

      {/* Logs Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
          {filteredLogs.map((log) => {
            const actionInfo = actionLabels[log.action] || { 
              label: log.action, 
              color: 'bg-gray-100 text-gray-700' 
            };
            return (
              <div key={log.id} className="p-4 flex items-center gap-4">
                {log.user_image ? (
                  <Image
                    src={log.user_image}
                    alt={log.user_name || 'User'}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-gray-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">
                      {log.user_name || 'Unknown'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${actionInfo.color}`}>
                      {actionInfo.label}
                    </span>
                  </div>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <p className="text-sm text-gray-500 truncate">
                      {JSON.stringify(log.details)}
                    </p>
                  )}
                </div>
                <div className="text-right text-sm text-gray-500 whitespace-nowrap">
                  <p>{formatDateTime(log.created_at)}</p>
                  {log.ip_address && (
                    <p className="text-xs text-gray-400">IP: {log.ip_address}</p>
                  )}
                </div>
              </div>
            );
          })}

          {filteredLogs.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              {searchTerm || currentAction 
                ? 'ไม่พบประวัติการใช้งานที่ตรงกับเงื่อนไข' 
                : 'ไม่มีประวัติการใช้งาน'}
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => navigateTo(currentPage - 1, currentAction || undefined)}
            disabled={currentPage <= 1}
            className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            ก่อนหน้า
          </button>
          <span className="text-sm text-gray-600">
            หน้า {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => navigateTo(currentPage + 1, currentAction || undefined)}
            disabled={currentPage >= totalPages}
            className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ถัดไป
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
}
