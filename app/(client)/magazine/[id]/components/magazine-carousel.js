"use client";
import React, { useState } from "react";
import { Card, CardBody } from "@heroui/react";
import Link from "next/link";
export default function MagazineCarousel({magazine}) {
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  // magazine.photo 배열에서 슬라이드 생성
  const slides = magazine?.photo || [];

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
    setTouchEnd(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    const deltaX = Math.abs(e.touches[0].clientX - touchStart);
    const deltaY = Math.abs(e.touches[0].clientY - (touchEnd?.clientY || 0));
    // 좌우 이동이 상하 이동보다 크면 상하 스크롤 방지
    if (deltaX > deltaY) {
      e.preventDefault();
    }
    setTouchEnd(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    const distance = touchStart - touchEnd;
    if (distance > 50) {
      // 왼쪽으로 스와이프
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    } else if (distance < -50) {
      // 오른쪽으로 스와이프
      setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
    }
  };

  return (
    
    <div
      className="relative pt-2 pb-4 [touch-action:pan-x]"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {slides.length > 0 ? (
        <Card classNames={{base: "w-full rounded-none p-0"}} className="w-full rounded-none" >
          <CardBody className="p-0">
            
              <div className="relative w-full h-[40vh] md:h-[60vh] overflow-hidden">
                <img
                  src={slides[currentSlide]?.url || `https://picsum.photos/800/400?random=${currentSlide}`}
                  alt={`${magazine?.title || ''} - 이미지 ${currentSlide + 1}`}
                  className="object-contain w-full h-full"
                  draggable={false}
                />
              </div>
            
          </CardBody>
        </Card>
      ) : (
        <Card className="w-full">
          <CardBody className="p-0">
            <div className="relative w-full h-[40vh] md:h-[60vh] overflow-hidden">
              <img
                src={`https://picsum.photos/800/400?random=1`}
                alt="기본 이미지"
                className="object-contain w-full h-full"
                draggable={false}
              />
            </div>
          </CardBody>
        </Card>
      )}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 p-1">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              currentSlide === index
                ? "bg-red-500"
                : "bg-white border border-gray-300"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
      
    </div>
  );
}
