'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin/kakao-auth');
  }, [router]);

  return null; // 렌더링 없이 즉시 이동
}

