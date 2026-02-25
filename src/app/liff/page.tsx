'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LiffPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'browser'>('loading');
  const [message, setMessage] = useState('กำลังเชื่อมต่อ LINE...');

  useEffect(() => {
    const liffId = process.env.NEXT_PUBLIC_LIFF_ID;

    if (!liffId) {
      setStatus('error');
      setMessage('LIFF ID ไม่ถูกต้อง');
      return;
    }

    const initLiff = async () => {
      try {
        const liff = (await import('@line/liff')).default;
        await liff.init({ liffId });

        if (!liff.isInClient()) {
          setStatus('browser');
          setMessage('กรุณาเปิดจากแอป LINE');
          setTimeout(() => router.push('/auth/signin'), 2000);
          return;
        }

        if (!liff.isLoggedIn()) {
          liff.login({ redirectUri: window.location.href });
          return;
        }

        const profile = await liff.getProfile();
        const accessToken = liff.getAccessToken();

        setMessage('กำลังเข้าสู่ระบบ...');

        const res = await fetch('/api/auth/liff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: profile.userId,
            displayName: profile.displayName,
            pictureUrl: profile.pictureUrl,
            accessToken,
          }),
        });

        const data = await res.json();

        if (res.ok && data.callbackUrl) {
          setStatus('success');
          setMessage('เข้าสู่ระบบสำเร็จ กำลังเข้าหน้าหลัก...');
          window.location.href = data.callbackUrl;
        } else {
          setStatus('error');
          setMessage(data.error || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
          setTimeout(() => router.push('/auth/signin'), 2500);
        }
      } catch (err) {
        console.error('LIFF init error:', err);
        setStatus('error');
        setMessage('เกิดข้อผิดพลาด กำลังไปหน้าเข้าสู่ระบบ...');
        setTimeout(() => router.push('/auth/signin'), 2000);
      }
    };

    initLiff();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white">
      <div className="text-center px-6">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          {status === 'loading' && (
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
          )}
          {status === 'success' && (
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          )}
          {status === 'error' && (
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {status === 'browser' && (
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.349 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
            </svg>
          )}
        </div>

        <h1 className="text-lg font-bold text-gray-800 mb-2">ส.เจริญชัย รีไซเคิล</h1>
        <p className="text-gray-500 text-sm">{message}</p>

        {status === 'error' && (
          <button
            onClick={() => router.push('/auth/signin')}
            className="mt-4 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
          >
            ไปหน้าเข้าสู่ระบบ
          </button>
        )}
      </div>
    </div>
  );
}
