"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

// 페이지 진입 시 최상단으로 스크롤하는 훅
export function useScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    // 페이지 로드 시 최상단으로 스크롤
    window.scrollTo(0, 0);
  }, [pathname]);
}

// 수동으로 최상단으로 스크롤하는 함수
export function scrollToTop() {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: 'smooth'
  });
}

// 즉시 최상단으로 스크롤하는 함수 (애니메이션 없음)
export function scrollToTopImmediate() {
  window.scrollTo(0, 0);
}

// ScrollToTop 컴포넌트 (JSX에서 사용 가능)
export default function ScrollToTop() {
  useScrollToTop();
  return null; // 렌더링할 내용이 없음
}