'use client'
import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function ExhibitionCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef(null);
  const supabase = createClient();

  // Supabase에서 배너 데이터 가져오기
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const { data, error } = await supabase
          .from("banner")
          .select("*")
          .order("id", { ascending: false })
          .limit(5); // 최신 5개 배너
        
        if (error) {
          console.log('배너 데이터 로딩 실패:', error);
          // 실패 시 기본 배너 사용
          setBanners([
            {
              id: 1,
              name: '기본 배너',
              url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=1200&h=600&q=85',
            }
          ]);
        } else {
          setBanners(data || []);
        }
      } catch (error) {
        console.log('배너 데이터 로딩 실패:', error);
        // 실패 시 기본 배너 사용
        setBanners([
          {
            id: 1,
            name: '기본 배너',
            url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=1200&h=600&q=85',
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  const resetTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }

  useEffect(() => {
    if (banners.length === 0) return;
    
    resetTimeout();
    timeoutRef.current = setTimeout(
      () =>
        setCurrentIndex((prevIndex) =>
          prevIndex === banners.length - 1 ? 0 : prevIndex + 1
        ),
      4000 // 4초마다 자동 슬라이드
    );

    return () => {
      resetTimeout();
    };
  }, [currentIndex, banners.length]);

  const goToSlide = (slideIndex) => {
    setCurrentIndex(slideIndex);
  };

  const prevSlide = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? banners.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const nextSlide = () => {
    const isLastSlide = currentIndex === banners.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  if (loading) {
    return (
      <div className="relative mx-4 mt-6 mb-1 h-48 group">
        <div className="w-full h-full rounded-2xl overflow-hidden bg-gray-200 animate-pulse">
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-500">배너 로딩 중...</span>
          </div>
        </div>
      </div>
    );
  }

  if (banners.length === 0) {
    return (
      <div className="relative mx-4 mt-6 mb-1 h-48 group">
        <div className="w-full h-full rounded-2xl overflow-hidden bg-gray-200">
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-500">배너가 없습니다</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative mx-4 mt-6 mb-1 h-48 group">
      <div className="w-full h-full rounded-2xl overflow-hidden">
        <div
          className="whitespace-nowrap h-full transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {banners.map((banner, index) => (
            <div className="inline-block w-full h-full" key={banner.id || index}>
              <div className="w-full h-full relative">
                <img
                  src={
                    banner?.thumbnail_url ||
                    (banner?.url
                      ? banner.url.replace(/\.(jpg|jpeg|png)$/i, ".webp")
                      : "/noimage.jpg")
                  }
                  alt={banner?.name || banner?.title || `Slide ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 좌우 화살표 (호버 시 표시) */}
      <div className="hidden group-hover:block absolute top-1/2 -translate-y-1/2 left-2 p-1 bg-black/30 text-white rounded-full cursor-pointer transition-opacity">
        <ChevronLeft onClick={prevSlide} size={20} />
      </div>
      <div className="hidden group-hover:block absolute top-1/2 -translate-y-1/2 right-2 p-1 bg-black/30 text-white rounded-full cursor-pointer transition-opacity">
        <ChevronRight onClick={nextSlide} size={20} />
      </div>

      {/* 하단 인디케이터 점 */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2">
        {banners.map((_, slideIndex) => (
          <div
            key={slideIndex}
            onClick={() => goToSlide(slideIndex)}
            className={`h-1.5 w-1.5 rounded-full cursor-pointer transition-all duration-300 ${
              currentIndex === slideIndex ? 'bg-white w-4' : 'bg-white/50'
            }`}
          ></div>
        ))}
      </div>
    </div>
  );
}
