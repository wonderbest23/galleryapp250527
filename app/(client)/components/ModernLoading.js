"use client";
import React from "react";

// 모던한 로딩 컴포넌트: 브라우저 기본 요소 기반으로 경량화
export function ModernLoading({ size = "md", text = "로딩 중...", showText = true }) {
  const widthClass = size === 'sm' ? 'w-24' : size === 'lg' ? 'w-56' : size === 'xl' ? 'w-64' : 'w-40';
  const textSize = size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : size === 'xl' ? 'text-xl' : 'text-base';
  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <progress className={`${widthClass}`} />
      {showText && (
        <p className={`${textSize} text-gray-600`}>{text}</p>
      )}
    </div>
  );
}

// 스켈레톤 로딩 컴포넌트
export function SkeletonLoading({ lines = 3, showImage = true }) {
  return (
    <div className="space-y-4 animate-pulse">
      {showImage && (
        <div className="h-48 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl"></div>
      )}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div 
            key={index}
            className={`h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full ${
              index === lines - 1 ? 'w-3/4' : 'w-full'
            }`}
          ></div>
        ))}
      </div>
    </div>
  );
}

// 파티클 로딩 애니메이션
export function ParticleLoading({ size = "md" }) {
  // 기본 progress로 통일
  return (
    <div className="flex flex-col items-center justify-center">
      <progress />
    </div>
  );
}

// 웨이브 로딩 애니메이션
export function WaveLoading({ size = "md" }) {
  return (
    <div className="flex items-center justify-center">
      <progress />
    </div>
  );
}

// 도트 로딩 애니메이션 (기존 스타일 개선)
export function DotLoading() {
  return (
    <div className="flex items-center justify-center">
      <progress />
    </div>
  );
}
