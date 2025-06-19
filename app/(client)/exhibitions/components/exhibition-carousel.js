"use client";
import { Card, CardBody, Skeleton } from "@heroui/react";
import { FaRegStar } from "react-icons/fa";
import { FaStar } from "react-icons/fa";
import { FaRegBookmark, FaBookmark } from "react-icons/fa6";
import Link from "next/link";
import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";

export default function ExhibitionCarousel({ exhibitions, user, bookmarks, toggleBookmark, isBookmarked }) {
  // 슬라이더 ref
  const sliderRef = useRef(null);
  // 드래그 상태를 추적하는 ref
  const isDraggingRef = useRef(false);
  // 슬라이더 요소에서만 동작하도록 체크하는 ref
  const isSliderClickRef = useRef(false);

  // 로딩 상태에서 사용할 스켈레톤 UI 컴포넌트
  const SkeletonCard = () => (
    <div className="w-[200px] h-[300px] ">
      <Card className="w-[200px] space-y-5 p-4" radius="lg" shadow="none" >
        <Skeleton className="rounded-lg">
          <div className="h-24 rounded-lg bg-default-300" />
        </Skeleton>
        <div className="space-y-3">
          <Skeleton className="w-3/5 rounded-lg">
            <div className="h-3 w-3/5 rounded-lg bg-default-200" />
          </Skeleton>
          <Skeleton className="w-4/5 rounded-lg">
            <div className="h-3 w-4/5 rounded-lg bg-default-200" />
          </Skeleton>
          <Skeleton className="w-2/5 rounded-lg">
            <div className="h-3 w-2/5 rounded-lg bg-default-300" />
          </Skeleton>
        </div>
      </Card>
    </div>
  );

  // 이미지 URL 반환 함수
  function getImageUrl(url) {
    return url || "/images/noimage.jpg";
  }

  // 전시회 카드 컴포넌트
  const ExhibitionCard = useCallback(
    ({ exhibition }) => (
      <Link
        href={`/exhibition/${exhibition.id}`}
        className="flex-shrink-0 w-[180px] h-[240px] block"
        onClick={(e) => {
          // 드래그 중에는 링크 이동을 방지
          if (isDraggingRef.current) {
            e.preventDefault();
          }
        }}
      >
        <Card className="h-[240px] overflow-hidden shadow hover:shadow-lg transition-shadow rounded-xl">
          <div className="relative">
            <Image
              src={getImageUrl(exhibition.photo)}
              alt={exhibition.name || "전시회 이미지"}
              width={280}
              height={140}
              className="h-[140px] w-full object-cover"
            />
            {/* <div
              className="absolute top-2 right-2 z-10 p-1 rounded-full bg-white/70"
              onClick={(e) => toggleBookmark(e, exhibition)}
            >
              {isBookmarked(exhibition.id) ? (
                <FaBookmark className="text-red-500 text-lg" />
              ) : (
                <FaRegBookmark className="text-gray-600 text-lg" />
              )}
            </div> */}
          </div>
          <CardBody className="flex flex-col justify-between h-[100px] p-3">
            <div className="text-[16px] font-bold line-clamp-1">{exhibition.contents}</div>
            <div className="text-[10px]">
              <p className="line-clamp-1 text-[#BDBDBD]">
                {exhibition.gallery?.address || "주소 정보 없음"}
              </p>
            </div>
            <div className="flex text-sm justify-between items-center">
              <div className="rounded-md text-[10px] text-[#BDBDBD]">평균별점</div>
              <div className="flex items-center gap-x-1">
                <span className="text-[10px] text-[#007AFF]">{exhibition.review_average || "1.0"}</span>
                <FaStar className="text-[#007AFF]" />
              </div>
            </div>
          </CardBody>
        </Card>
      </Link>
    ),
    [isBookmarked, toggleBookmark]
  );

  // 마우스 이벤트 핸들러
  const handleMouseDown = useCallback((e) => {
    isSliderClickRef.current = true;
    e.preventDefault();
    
    if (sliderRef.current) {
      isDraggingRef.current = false;
      sliderRef.current.style.cursor = "grabbing";
      
      const slider = sliderRef.current;
      const startX = e.pageX;
      const scrollLeft = slider.scrollLeft;
      
      // 마우스 이동 이벤트 핸들러
      const onMouseMove = (e) => {
        if (!isSliderClickRef.current) return;
        
        e.preventDefault();
        isDraggingRef.current = true;
        
        const x = e.pageX;
        // 자연스러운 1:1 이동으로 변경
        const walk = startX - x;
        slider.scrollLeft = scrollLeft + walk;
      };
      
      // 마우스 업 이벤트 핸들러
      const onMouseUp = (e) => {
        isSliderClickRef.current = false;
        slider.style.cursor = "grab";
        
        // 드래그 상태 해제 시간 더 단축
        setTimeout(() => {
          isDraggingRef.current = false;
        }, 10);
        
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };
      
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    }
  }, []);

  // 터치 이벤트 핸들러
  const handleTouchStart = useCallback((e) => {
    isSliderClickRef.current = true;
    
    if (sliderRef.current) {
      isDraggingRef.current = false;
      const slider = sliderRef.current;
      const startX = e.touches[0].clientX;
      const scrollLeft = slider.scrollLeft;
      
      // 터치 이동 이벤트 핸들러
      const onTouchMove = (e) => {
        if (!isSliderClickRef.current) return;
        
        isDraggingRef.current = true;
        
        const x = e.touches[0].clientX;
        // 자연스러운 1:1 이동으로 변경
        const walk = startX - x;
        slider.scrollLeft = scrollLeft + walk;
      };
      
      // 터치 종료 이벤트 핸들러
      const onTouchEnd = () => {
        isSliderClickRef.current = false;
        
        // 지연시간 최소화
        setTimeout(() => {
          isDraggingRef.current = false;
        }, 10);
        
        slider.removeEventListener("touchmove", onTouchMove);
        slider.removeEventListener("touchend", onTouchEnd);
      };
      
      slider.addEventListener("touchmove", onTouchMove, { passive: false });
      slider.addEventListener("touchend", onTouchEnd);
    }
  }, []);

  return (
    <div className="w-full max-w-full overflow-hidden my-4">
      {exhibitions.length === 0 ? (
        // 로딩 중 스켈레톤 UI
        <div className="w-full">
          <div
            className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide"
            style={{ scrollBehavior: "smooth" }}
          >
            {Array(8)
              .fill()
              .map((_, index) => (
                <SkeletonCard key={index} />
              ))}
          </div>
        </div>
      ) : (
        // 전시회 캐러셀
        <div className="w-full relative overflow-hidden">
          <div
            ref={sliderRef}
            className="flex overflow-x-auto gap-3 pb-1 scrollbar-hide h-full slider-container"
            style={{
              scrollSnapType: "x mandatory",
              scrollBehavior: "auto",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
              cursor: "grab",
              touchAction: "pan-x", 
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            <div className="flex gap-3  pr-8 relative z-10">
              {exhibitions.map((exhibition, index) => (
                <ExhibitionCard key={index} exhibition={exhibition} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 