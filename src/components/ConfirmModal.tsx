'use client';

import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  type?: 'danger' | 'warning';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'yes',
  type = 'danger',
}: ConfirmModalProps) {
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (inputValue.toLowerCase() !== confirmText.toLowerCase()) {
      return;
    }

    setIsSubmitting(true);
    await onConfirm();
    setIsSubmitting(false);
    handleClose();
  };

  const handleClose = () => {
    setInputValue('');
    setIsSubmitting(false);
    onClose();
  };

  const isValid = inputValue.toLowerCase() === confirmText.toLowerCase();

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-xl shadow-xl max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`border-b px-6 py-4 flex items-center justify-between ${
          type === 'danger' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              type === 'danger' ? 'bg-red-100' : 'bg-yellow-100'
            }`}>
              <AlertTriangle className={`w-6 h-6 ${
                type === 'danger' ? 'text-red-600' : 'text-yellow-600'
              }`} />
            </div>
            <h2 className={`text-xl font-bold ${
              type === 'danger' ? 'text-red-900' : 'text-yellow-900'
            }`}>
              {title}
            </h2>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 hover:bg-white/50 rounded-lg"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-700">{message}</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              พิมพ์ <span className="font-bold text-red-600">{confirmText}</span> เพื่อยืนยัน
            </label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`พิมพ์ "${confirmText}" ที่นี่`}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none ${
                inputValue && !isValid
                  ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300 focus:ring-green-500 focus:border-green-500'
              }`}
              disabled={isSubmitting}
              autoFocus
            />
            {inputValue && !isValid && (
              <p className="text-xs text-red-600 mt-1">
                กรุณาพิมพ์ "{confirmText}" ให้ถูกต้อง
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!isValid || isSubmitting}
              className={`flex-1 px-4 py-2 rounded-lg font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed ${
                type === 'danger'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-yellow-600 hover:bg-yellow-700'
              }`}
            >
              {isSubmitting ? 'กำลังดำเนินการ...' : 'ยืนยันการลบ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
