'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Calendar, Image as ImageIcon } from 'lucide-react';
import { PriceGroup } from '@/types';
import { formatDateTime } from '@/lib/utils';

interface PriceImagesListProps {
  priceGroups: (PriceGroup & { last_image_at: Date | null; branch_name: string | null })[];
  branches: { id: string; name: string; code: string }[];
}

export default function PriceImagesList({ priceGroups, branches }: PriceImagesListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [branchFilter, setBranchFilter] = useState<string>('');

  const filteredGroups = priceGroups.filter((group) => {
    // Search filter
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchTerm.toLowerCase());

    // Date filter (Updated Today / No Updates)
    const matchesDate = dateFilter === '' || 
      (dateFilter === 'today' && group.last_image_at && 
       new Date(group.last_image_at).toDateString() === new Date().toDateString()) ||
      (dateFilter === 'no-updates' && !group.last_image_at);

    // Branch filter
    const matchesBranch = branchFilter === '' ||
      (branchFilter === 'none' && !group.branch_name) ||
      (branchFilter !== 'none' && group.branch_name?.includes(branchFilter));

    return matchesSearch && matchesDate && matchesBranch;
  });

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="ค้นหากลุ่มราคา..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        <select 
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          <option value="">ทั้งหมด</option>
          <option value="today">อัปเดทวันนี้</option>
          <option value="no-updates">ไม่มีอัปเดท</option>
        </select>
        <select 
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          <option value="">ทุกสาขา</option>
          <option value="none">ไม่ระบุสาขา</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.name}>
              {branch.name}
            </option>
          ))}
        </select>
      </div>

      {/* Price Groups List */}
      <div className="space-y-3">
        {filteredGroups.map((group) => (
          <Link
            key={group.id}
            href={`/admin/price-groups/${group.id}`}
            className="block bg-white border border-gray-200 rounded-lg p-4 hover:border-orange-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-blue-600">{group.name}</h3>
                  {group.last_image_at && new Date(group.last_image_at).toDateString() === new Date().toDateString() && (
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      อัปเดทวันนี้
                    </span>
                  )}
                </div>
                {group.description && (
                  <p className="text-sm text-gray-500">{group.description}</p>
                )}
                {group.branch_name && (
                  <p className="text-xs text-gray-500 mt-1">
                    📍 {group.branch_name}
                  </p>
                )}
                {group.last_image_at && (
                  <p className="text-xs text-gray-400 mt-1">
                    อัปเดตล่าสุด: {formatDateTime(group.last_image_at)}
                  </p>
                )}
              </div>
              <div className="text-right">
                <span className="text-sm text-gray-500">
                  {group.image_count || 0} รูป
                </span>
              </div>
            </div>
          </Link>
        ))}

        {filteredGroups.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            {searchTerm || dateFilter || branchFilter ? 'ไม่พบกลุ่มราคาที่ค้นหา' : 'ไม่มีกลุ่มราคา'}
          </div>
        )}
      </div>
    </div>
  );
}
