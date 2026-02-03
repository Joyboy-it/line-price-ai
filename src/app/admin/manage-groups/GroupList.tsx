'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Tag, Edit, Trash2 } from 'lucide-react';
import { PriceGroup } from '@/types';

interface GroupListProps {
  groups: PriceGroup[];
}

export default function GroupList({ groups }: GroupListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (groupId: string) => {
    if (!confirm('คุณต้องการลบกลุ่มราคานี้หรือไม่?')) return;
    
    try {
      const response = await fetch(`/api/admin/price-groups/${groupId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  return (
    <div>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="ค้นหากลุ่มราคา..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      <div className="space-y-3">
        {filteredGroups.map((group) => (
          <div
            key={group.id}
            className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Tag className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/price-groups/${group.id}`}
                    className="font-medium text-blue-600 hover:text-blue-800"
                  >
                    {group.name}
                  </Link>
                  {!group.is_active && (
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                      ปิดใช้งาน
                    </span>
                  )}
                </div>
                {group.description && (
                  <p className="text-sm text-gray-500">{group.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  {(group as any).branch_name && (
                    <span>📍 {(group as any).branch_name}</span>
                  )}
                  {(group as any).user_count !== undefined && (
                    <span>👥 {(group as any).user_count} ผู้ใช้</span>
                  )}
                  {(group as any).image_count !== undefined && (
                    <span>🖼️ {(group as any).image_count} รูป</span>
                  )}
                  <span>🔢 ลำดับ: {group.sort_order}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/admin/manage-groups/${group.id}/edit`}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                <Edit className="w-5 h-5" />
              </Link>
              <button
                onClick={() => handleDelete(group.id)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}

        {filteredGroups.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            ไม่พบกลุ่มราคาที่ค้นหา
          </div>
        )}
      </div>
    </div>
  );
}
