"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

// 서버 사이드 렌더링 시 에디터 관련 코드가 실행되지 않도록 동적 임포트
const CommunityWriteClient = dynamic(() => import("./ClientEditor"), { ssr: false });

export default function CommunityWritePage() {
  const [checking, setChecking] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // 로그인 페이지로 이동 후, 완료되면 다시 돌아오도록 redirect_to 파라미터 전달
        router.replace("/mypage?redirect_to=/community/write");
      } else {
        setChecking(false);
      }
    };
    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 세션을 확인하는 동안은 아무것도 렌더링하지 않음
  if (checking) return null;

  return (
    <div className="pb-32">
      <CommunityWriteClient />
    </div>
  );
} 