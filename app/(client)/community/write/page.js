"use client";

import dynamic from "next/dynamic";

// 서버 사이드 렌더링 시 에디터 관련 코드가 실행되지 않도록 동적 임포트
const CommunityWriteClient = dynamic(() => import("./ClientEditor"), { ssr: false });

export default function CommunityWritePage() {
  return <CommunityWriteClient />;
} 