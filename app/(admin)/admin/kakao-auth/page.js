'use client'
import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { nanoid } from 'nanoid';
import { createClient } from '@/utils/supabase/client';

export default function KakaoAuthPage() {
  const [authUrl, setAuthUrl] = useState('');
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    const restKey = process.env.NEXT_PUBLIC_KAKAO_REST_KEY;
    const redirectUri = process.env.NEXT_PUBLIC_KAKAO_REDIRECT;
    // 세션 생성
    const id = nanoid();
    setSessionId(id);
    // 서버에 세션 row 생성
    fetch('/api/kakao-session/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });

    if (restKey && redirectUri) {
      const url = `https://kauth.kakao.com/oauth/authorize?client_id=${restKey}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${id}`;
      setAuthUrl(url);
    }

    // Supabase Realtime 구독
    const supabase = createClient();
    const channel = supabase.channel('kakao_sessions');
    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'kakao_sessions', filter: `id=eq.${id}` },
      (payload) => {
        if (payload.new.verified) {
          // 쿠키 설정 (middleware 통과용)
          document.cookie = 'kakao_verified=1; path=/';
          window.location.href = '/admin/gallery';
        }
      },
    );
    channel.subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const handleClick = () => {
    if (authUrl) window.location.href = authUrl;
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-6 p-4">
      <h1 className="text-2xl font-bold">카카오 QR 2차 인증</h1>
      {authUrl && <QRCodeSVG value={authUrl} size={256} />}
      <p className="text-center leading-relaxed">
        휴대폰 카카오톡으로 QR 코드를 스캔하거나<br />
        아래 버튼을 눌러 인증 페이지로 이동해 주세요.
      </p>
      <button
        onClick={handleClick}
        className="px-6 py-2 rounded-md bg-yellow-500 text-white hover:bg-yellow-600"
      >
        카카오로 이동
      </button>
    </div>
  );
} 