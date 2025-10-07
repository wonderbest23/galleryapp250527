"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useUserStore } from "@/stores/userStore";
import { Button, Input, Card, CardBody } from "@heroui/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import TopNavigation from "../components/TopNavigation";
import BottomNavigation from "../components/BottomNavigationbar";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const { user, setUser } = useUserStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // URL 파라미터에서 리다이렉트 정보 가져오기
  const redirect = searchParams.get('redirect') || '/';
  const autoSubmitReview = searchParams.get('autoSubmitReview');

  useEffect(() => {
    // 이미 로그인된 경우 리다이렉트
    if (user) {
      if (autoSubmitReview === 'true') {
        router.push(`/?autoSubmitReview=true`);
      } else {
        router.push(redirect);
      }
    }
  }, [user, redirect, autoSubmitReview, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.user) {
        setUser(data.user);
        setIsLoggedIn(true);
        
        // 로그인 성공 후 리다이렉트
        if (autoSubmitReview === 'true') {
          router.push(`/?autoSubmitReview=true`);
        } else {
          router.push(redirect);
        }
      }
    } catch (error) {
      setError("로그인 중 오류가 발생했습니다.");
      console.error("로그인 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${redirect}${autoSubmitReview === 'true' ? '?autoSubmitReview=true' : ''}`
        }
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      }
    } catch (error) {
      setError("Google 로그인 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  const handleKakaoLogin = async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: `${window.location.origin}${redirect}${autoSubmitReview === 'true' ? '?autoSubmitReview=true' : ''}`
        }
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      }
    } catch (error) {
      setError("카카오 로그인 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로그인 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation />
      
      <div className="max-w-md mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">로그인</h1>
          <p className="text-gray-600">
            {autoSubmitReview === 'true' 
              ? "로그인 후 리뷰가 자동으로 제출됩니다" 
              : "계정에 로그인하여 서비스를 이용하세요"
            }
          </p>
        </div>

        <Card className="shadow-lg">
          <CardBody className="p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Input
                  type="email"
                  label="이메일"
                  placeholder="이메일을 입력하세요"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  variant="bordered"
                  className="w-full"
                />
              </div>

              <div>
                <Input
                  type="password"
                  label="비밀번호"
                  placeholder="비밀번호를 입력하세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  variant="bordered"
                  className="w-full"
                />
              </div>

              {error && (
                <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                color="primary"
                className="w-full font-bold py-3"
                isLoading={loading}
                disabled={loading}
              >
                {loading ? "로그인 중..." : "로그인"}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">또는</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <Button
                  onClick={handleGoogleLogin}
                  variant="bordered"
                  className="w-full font-medium py-3"
                  disabled={loading}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google로 로그인
                </Button>

                <Button
                  onClick={handleKakaoLogin}
                  variant="bordered"
                  className="w-full font-medium py-3 bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-400"
                  disabled={loading}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#000" d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11L5.526 21.75c-.5.5-1.365.148-1.365-.592V17.25a13.5 13.5 0 0 1-1.727-1.727C1.5 13.664 1.5 8.185 1.5 3.664 1.5 3.664 6.201 3 12 3z"/>
                  </svg>
                  카카오로 로그인
                </Button>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                계정이 없으신가요?{" "}
                <Link href="/register" className="text-blue-600 hover:text-blue-800 font-medium">
                  회원가입
                </Link>
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
}
