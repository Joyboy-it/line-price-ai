'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Tag, Clock, ChevronRight, Search } from 'lucide-react';
import { PriceGroup } from '@/types';
import { formatRelativeTime } from '@/lib/utils';

interface PriceGroupListProps {
  groups: PriceGroup[];
}

function isToday(dateValue: string | Date): boolean {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  const today = new Date();
  
  // เปรียบเทียบแค่วันที่ (YYYY-MM-DD) โดยไม่สนเวลา
  const dateOnly = date.toISOString().split('T')[0];
  const todayOnly = today.toISOString().split('T')[0];
  
  return dateOnly === todayOnly;
}

export default function PriceGroupList({ groups }: PriceGroupListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGroups = groups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="ค้นหากลุ่มราคา..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      <div className="space-y-2">
        {filteredGroups.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            ไม่พบกลุ่มราคาที่ค้นหา
          </div>
        ) : (
          filteredGroups.map((group) => {
            const updatedToday = group.last_image_at && isToday(group.last_image_at);
            
            return (
              <Link
                key={group.id}
                href={`/price-groups/${group.id}`}
                className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-green-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Tag className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-blue-600 hover:text-blue-800">
                          {group.name}
                        </h3>
                        {updatedToday && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            อัปเดตวันนี้
                          </span>
                        )}
                      </div>
                      {group.description && (
                        <p className="text-sm text-gray-500 mt-0.5">
                          {group.description}
                        </p>
                      )}
                      {group.last_image_at && (
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                          <Clock className="w-3 h-3" />
                          <span suppressHydrationWarning>อัปเดต {formatRelativeTime(group.last_image_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
