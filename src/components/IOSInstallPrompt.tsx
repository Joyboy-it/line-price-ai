'use client';

import { useState, useEffect } from 'react';
import { X, Share, Plus, Bell } from 'lucide-react';

export default function IOSInstallPrompt() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState<'install' | 'installed'>('install');

  useEffect(() => {
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true);

    if (!isIOS) return;
    if (isStandalone) return;

    const dismissed = localStorage.getItem('ios-install-prompt-dismissed');
    if (dismissed) return;

    const timer = setTimeout(() => setShow(true), 4000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('ios-install-prompt-dismissed', 'true');
    setShow(false);
  };

  const handleAlreadyInstalled = () => {
    setStep('installed');
    setTimeout(() => setShow(false), 3000);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-6 pointer-events-none">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 pointer-events-auto overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-white" />
            <span className="text-white font-semibold text-sm">รับแจ้งเตือนราคาบน iPhone</span>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === 'install' ? (
          <div className="p-4">
            <p className="text-gray-600 text-xs mb-4 leading-relaxed">
              ติดตั้งแอปบน iPhone เพื่อรับการแจ้งเตือนราคาสินค้าทันทีที่มีการอัพเดท
            </p>

            {/* Steps */}
            <div className="space-y-3">
              {/* Step 1 */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 font-bold text-xs">1</span>
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 text-sm font-medium">กดปุ่ม Share</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg">
                      <Share className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-xs text-gray-600">ปุ่มกลางที่แถบด้านล่าง Safari</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="w-0.5 h-4 bg-gray-200 rounded"></div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 font-bold text-xs">2</span>
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 text-sm font-medium">เลือก &quot;Add to Home Screen&quot;</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-lg">
                      <Plus className="w-3.5 h-3.5 text-gray-500" />
                      <span className="text-xs text-gray-600">เพิ่มลงในหน้าจอโฮม</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="w-0.5 h-4 bg-gray-200 rounded"></div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 font-bold text-xs">3</span>
                </div>
                <div className="flex-1">
                  <p className="text-gray-800 text-sm font-medium">เปิดแอปจาก Home Screen</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    กดไอคอน &quot;ส.เจริญชัย&quot; บนหน้าจอ → เปิดการแจ้งเตือน
                  </p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAlreadyInstalled}
                className="flex-1 py-2 px-3 bg-gray-100 text-gray-700 text-xs font-medium rounded-xl hover:bg-gray-200 transition-colors"
              >
                ติดตั้งแล้ว
              </button>
              <button
                onClick={handleDismiss}
                className="flex-1 py-2 px-3 bg-white text-gray-500 text-xs rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                ไว้ทีหลัง
              </button>
            </div>

            {/* iOS version note */}
            <p className="text-center text-xs text-gray-400 mt-3">
              ต้องใช้ iOS 16.4 ขึ้นไป
            </p>
          </div>
        ) : (
          <div className="p-4 flex flex-col items-center gap-2">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Bell className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-gray-800 font-semibold text-sm">เปิดแอปจาก Home Screen</p>
            <p className="text-gray-500 text-xs text-center">
              เปิดแอปจากไอคอนบน Home Screen แล้วกด &quot;เปิดการแจ้งเตือน&quot;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
