"use client";
import React, { useState, useEffect, Suspense } from "react";
import { Button, Spinner } from "@heroui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useUserStore } from "@/stores/userStore";

// SearchParams를 사용하는 컴포넌트를 별도로 분리
function MyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("redirect_to") || "/mypage/success";
  console.log("MyPage - redirect_to 파라미터:", returnUrl);
  const [loading, setLoading] = useState(false);

  // 컴포넌트 마운트 시 로그인 상태 확인
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        setLoading(true);
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          // 세션이 있으면 profiles 테이블에서 사용자 정보 확인
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.log("프로필 조회 중 오류:", profileError);
            return;
          }

          // role이 'client'인 경우에만 로그인 성공으로 처리
          if (profile && profile.role === 'client') {
            console.log("클라이언트 권한 확인됨, 리다이렉트 경로:", returnUrl);
            router.push(returnUrl);
          } else {
            console.log("클라이언트 권한이 아님, 로그인 화면 유지");
          }
        }
      } catch (error) {
        console.log("로그인 상태 확인 중 오류 발생:", error);
      } finally {
        setLoading(false);
      }
    };

    checkLoginStatus();
  }, [router, returnUrl]);

  const handleKakaoLogin = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      const redirectUrl = `${window.location.origin}/auth/callback?redirect_to=${encodeURIComponent(returnUrl)}`;
      console.log("카카오 로그인 리다이렉션 URL:", redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        console.error("카카오 로그인 오류:", error);
        throw error;
      }
    } catch (error) {
      console.error("로그인 처리 중 오류가 발생했습니다:", error);
      alert("로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex justify-center items-centerh-full">
      <div className="w-full flex flex-col justify-center items-center h-[90vh] px-4">
        <div className=" text-[24px] font-bold text-[#121212] text-start w-full">
          새로운 미술플랫폼👋
        </div>
        <div className=" text-[16px] text-[#A6A6A6] text-start w-full">
          대한민국 전시회,갤러리 정보
        </div>
        <div className="text-[16px]  text-[#A6A6A6] w-full text-start mb-4">
          아티스트 작품 직거래
        </div>
        <Button
          className="w-full flex rounded-none items-center justify-center gap-2 bg-[#FEE500] text-black font-medium py-2 hover:bg-[#F6D33F] transition-colors"
          onPress={handleKakaoLogin}
          isDisabled={loading}
        >
          {loading ? (
            <Spinner variant="wave" color="primary" />
          ) : (
            <svg
              width="20"
              height="20"
              viewBox="0 0 256 256"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M128 36C70.562 36 24 72.713 24 118.304C24 147.994 43.725 174.08 73.213 187.175C71.774 192.02 66.31 211.071 65.297 215.368C64.073 220.56 68.962 225.116 73.741 222.051C77.62 219.571 100.709 204.886 108.271 200.026C114.661 201.334 121.28 202 128 202C185.438 202 232 165.287 232 118.304C232 72.713 185.438 36 128 36Z"
                fill="black"
              />
            </svg>
          )}
          {loading ? "로그인 중..." : "카카오톡 로그인"}
        </Button>

        {/* 가로선과 or 텍스트 추가 */}
        <div className="w-full flex items-center justify-center my-4">
          <div className="flex-grow h-px bg-gray-300"></div>
          <div className="px-4 text-sm text-gray-500">or with </div>
          <div className="flex-grow h-px bg-gray-300"></div>
        </div>
        <img
          className="w-[50px] h-[50px]"
          src="/login/loginlogo.png"
          alt="google"
        />
      </div>
    </div>
  );
}

// fallback UI가 표시될 로딩 컴포넌트
function LoadingComponent() {
  return (
    <div className="w-full flex justify-center items-center h-[90vh]">
      <Spinner variant="wave" color="primary" />
    </div>
  );
}

// SearchParams를 사용하는 부분을 별도 컴포넌트로 추출
function MyPageWithSearchParams() {
  return (
    <Suspense fallback={<LoadingComponent />}>
      <MyPageContent />
    </Suspense>
  );
}

// 메인 컴포넌트
export default function mypage() {
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace("/mypage/success");
    } else {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          setUser(user);
          router.replace("/mypage/success");
        }
        // 없으면 로그인 화면 유지
      });
    }
  }, [user, setUser, router]);

  if (user) return null;

  return <MyPageWithSearchParams />;
}
