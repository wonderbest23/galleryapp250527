"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function ScrollToTop() {
  const pathname = usePathname();

  useEffect(() => {
    // 즉시 스크롤을 맨 위로 이동
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    
    // DOM이 완전히 로드된 후 다시 한번 확인
    const handleLoad = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    };
    
    // 페이지 로드 완료 후 실행
    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
    }
    
    // 추가적인 스크롤 초기화 (여러 타이밍에 걸쳐)
    const timers = [
      setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }), 50),
      setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }), 100),
      setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }), 200),
      setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' }), 500)
    ];
    
    return () => {
      window.removeEventListener('load', handleLoad);
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [pathname]);

  // 컴포넌트 마운트 시에도 스크롤 초기화
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  return null;
}
