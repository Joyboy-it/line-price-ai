'use client';

import { useState } from 'react';
import { Edit } from 'lucide-react';
import UserInfoForm from './UserInfoForm';

interface UserInfoFormWrapperProps {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    shop_name: string | null;
    phone: string | null;
    address: string | null;
    bank_info: Record<string, string> | null;
    note: string | null;
  };
}

export default function UserInfoFormWrapper({ user }: UserInfoFormWrapperProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = () => {
    window.location.reload();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="absolute top-4 right-4 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        title="แก้ไขข้อมูลผู้ใช้"
      >
        <Edit className="w-5 h-5" />
      </button>

      {isOpen && (
        <UserInfoForm
          user={user}
          onClose={() => setIsOpen(false)}
          onSave={handleSave}
        />
      )}
    </>
  );
}
