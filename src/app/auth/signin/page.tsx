'use client';

import { signIn, useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';

function SignInContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  const error = searchParams.get('error');
  const [isIOS, setIsIOS] = useState(false);

  // Redirect ถ้า login แล้ว
  useEffect(() => {
    if (status === 'authenticated' && session) {
      router.push(callbackUrl);
    }
  }, [status, session, router, callbackUrl]);

  useEffect(() => {
    setIsIOS(/iPhone|iPad|iPod/.test(navigator.userAgent));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-3xl">W</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">เข้าสู่ระบบ</h1>
          <p className="text-gray-600">วงษ์พาณิชย์ ส.เจริญชัย รีไซเคิล</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">
            {error === 'OAuthSignin' && 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ LINE'}
            {error === 'OAuthCallback' && 'เกิดข้อผิดพลาดในการยืนยันตัวตน'}
            {error === 'OAuthCreateAccount' && 'ไม่สามารถสร้างบัญชีได้'}
            {error === 'Callback' && 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ'}
            {error === 'AccessDenied' && 'บัญชีของคุณถูกระงับการใช้งาน'}
            {!['OAuthSignin', 'OAuthCallback', 'OAuthCreateAccount', 'Callback', 'AccessDenied'].includes(error) && 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'}
          </div>
        )}

        {/* iOS: แสดง tip การเปิดใน LINE app */}
        {isIOS && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-4">
            <p className="text-blue-800 text-xs font-medium mb-1">💡 เปิดจากแอป LINE ได้ง่ายกว่า</p>
            <p className="text-blue-700 text-xs leading-relaxed">
              หากได้รับลิงก์ในกลุ่ม LINE ให้กดเปิดจากในแอป LINE โดยตรง เพื่อเข้าสู่ระบบอัตโนมัติ
            </p>
          </div>
        )}

        <button
          onClick={() => signIn('line', { callbackUrl })}
          className="w-full bg-[#00B900] hover:bg-[#00a000] text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-3 transition-colors"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.349 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
          </svg>
          เข้าสู่ระบบด้วย LINE
        </button>

        {isIOS && (
          <p className="text-center text-gray-400 text-xs mt-3">
            หากเข้าสู่ระบบไม่ได้ กรุณาตรวจสอบว่าคุณใช้อีเมล/รหัสผ่าน LINE
          </p>
        )}

        <p className="text-center text-gray-500 text-sm mt-4">
          เข้าสู่ระบบเพื่อดูราคาสินค้าและข่าวสารล่าสุด
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
