'use client';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';

export default function NotificationPrompt() {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true);

    if (isIOS && !isStandalone) {
      return;
    }

    if (Notification.permission !== 'default') {
      return;
    }

    const dismissed = localStorage.getItem('notification-prompt-dismissed');
    if (dismissed) return;

    const timer = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleEnable = async () => {
    setLoading(true);
    try {
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        const vapidKey = urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!);
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKey.buffer as ArrayBuffer,
        });

        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription }),
        });
      } else {
        localStorage.setItem('notification-prompt-dismissed', 'true');
      }

      setShow(false);
    } catch (error) {
      console.error('Notification subscribe error:', error);
      setShow(false);
    }
    setLoading(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('notification-prompt-dismissed', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed top-20 left-4 right-4 z-40 md:left-auto md:right-4 md:w-96">
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1 text-sm">
              เปิดการแจ้งเตือนราคา
            </h3>
            <p className="text-xs text-gray-600 mb-3">
              รับข่าวสารราคาล่าสุดทันทีที่มีการอัพเดท แม้ไม่ได้เปิดเว็บ
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleEnable}
                disabled={loading}
                className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'กำลังเปิด...' : 'เปิดการแจ้งเตือน'}
              </button>
              <button
                onClick={handleDismiss}
                className="px-3 py-1.5 bg-white text-gray-700 text-xs font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                ไว้ทีหลัง
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
