'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Bell, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

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

export default function NotificationSettingsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(true);

  const checkSubscription = useCallback(async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setSupported(false);
      return;
    }

    setPermission(Notification.permission);

    if (Notification.permission === 'granted') {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch {
        setIsSubscribed(false);
      }
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  const handleEnable = async () => {
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        const vapidKey = urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!);
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKey.buffer as ArrayBuffer,
        });

        const res = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription }),
        });

        if (res.ok) {
          setIsSubscribed(true);
          localStorage.removeItem('notification-prompt-dismissed');
        }
      }
    } catch (error) {
      console.error('Enable notification error:', error);
    }
    setLoading(false);
  };

  const handleDisable = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });

        await subscription.unsubscribe();
        setIsSubscribed(false);
      }
    } catch (error) {
      console.error('Disable notification error:', error);
    }
    setLoading(false);
  };

  if (status === 'loading') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-32" />
          <div className="h-32 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm font-medium">กลับหน้าแรก</span>
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 bg-green-600 rounded-xl flex items-center justify-center shadow-sm">
          <Bell className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">การแจ้งเตือน</h1>
          <p className="text-sm text-gray-500">ตั้งค่าการรับแจ้งเตือนราคาอัพเดท</p>
        </div>
      </div>

      {!supported ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-yellow-800 text-sm font-medium">
            เบราว์เซอร์ของคุณไม่รองรับการแจ้งเตือน
          </p>
          <p className="text-yellow-700 text-xs mt-1">
            กรุณาใช้ Chrome, Edge หรือ Firefox เวอร์ชันล่าสุด
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSubscribed ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <Bell className={`w-5 h-5 ${isSubscribed ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 text-sm">
                    การแจ้งเตือนราคาอัพเดท
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    รับแจ้งเตือนเมื่อมีราคาใหม่ในกลุ่มที่เข้าถึงได้
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {permission === 'denied' ? (
                  <span className="text-xs text-red-600 font-medium">ถูกบล็อก</span>
                ) : isSubscribed ? (
                  <>
                    <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                      <CheckCircle className="w-3.5 h-3.5" />
                      เปิดอยู่
                    </span>
                    <button
                      onClick={handleDisable}
                      disabled={loading}
                      className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-medium rounded-lg border border-red-200 hover:bg-red-100 disabled:opacity-50 transition-colors"
                    >
                      ปิด
                    </button>
                  </>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                      <XCircle className="w-3.5 h-3.5" />
                      ปิดอยู่
                    </span>
                    <button
                      onClick={handleEnable}
                      disabled={loading}
                      className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {loading ? 'กำลังเปิด...' : 'เปิด'}
                    </button>
                  </>
                )}
              </div>
            </div>

            {permission === 'denied' && (
              <div className="px-4 pb-4">
                <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                  <p className="text-xs text-red-700">
                    คุณได้ปฏิเสธการแจ้งเตือนไปแล้ว กรุณาเปิดใช้งานในการตั้งค่าเบราว์เซอร์
                    (Settings → Site Settings → Notifications)
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-700 mb-2">📱 การแจ้งเตือนจะแสดงเมื่อ:</p>
            <ul className="space-y-1.5">
              <li className="text-xs text-gray-600 flex items-start gap-2">
                <span className="text-green-500 mt-0.5">•</span>
                มีการอัพเดทราคาในกลุ่มที่คุณมีสิทธิ์เข้าถึง
              </li>
              <li className="text-xs text-gray-600 flex items-start gap-2">
                <span className="text-green-500 mt-0.5">•</span>
                แม้คุณไม่ได้เปิดเว็บไซต์อยู่
              </li>
              <li className="text-xs text-gray-600 flex items-start gap-2">
                <span className="text-green-500 mt-0.5">•</span>
                คลิกการแจ้งเตือนเพื่อเปิดดูราคาทันที
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
