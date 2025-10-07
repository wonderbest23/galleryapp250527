"use client";
import React, { useState } from 'react';
import { useUserStore } from '@/stores/userStore';

export default function DevLoginButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { user, setUser } = useUserStore();

  // 개발환경에서만 표시 (항상 표시하도록 수정)
  // if (process.env.NODE_ENV === 'production') {
  //   return null;
  // }

  const handleDevLogin = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/simple-dev-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'dev@test.com',
          name: '개발자'
        })
      });

      const result = await response.json();

      if (result.success) {
        // 사용자 상태 업데이트
        setUser(result.data.user);
        setIsLoggedIn(true);
        console.log('개발용 로그인 성공:', result.data);
        
        // 페이지 새로고침으로 상태 반영
        window.location.reload();
      } else {
        alert(`로그인 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('개발용 로그인 오류:', error);
      alert('개발용 로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevLogout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/dev-logout', {
        method: 'POST',
      });

      const result = await response.json();

      if (result.success) {
        setUser(null);
        setIsLoggedIn(false);
        console.log('개발용 로그아웃 성공');
        alert('개발용 로그아웃 성공!');
      } else {
        alert(`로그아웃 실패: ${result.error}`);
      }
    } catch (error) {
      console.error('개발용 로그아웃 오류:', error);
      alert('개발용 로그아웃 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      {!isLoggedIn ? (
        <button
          onClick={handleDevLogin}
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition-colors disabled:opacity-50"
        >
          {isLoading ? '로그인 중...' : '🔧 개발용 로그인'}
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm text-green-600 font-medium">
            ✅ {user?.user_metadata?.name || '개발자'}
          </span>
          <button
            onClick={handleDevLogout}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs transition-colors disabled:opacity-50"
          >
            {isLoading ? '...' : '로그아웃'}
          </button>
        </div>
      )}
    </div>
  );
}
