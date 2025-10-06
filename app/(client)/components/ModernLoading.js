"use client";
import React from "react";

// 모던한 로딩 애니메이션 컴포넌트
export function ModernLoading({ size = "md", text = "로딩 중...", showText = true }) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12", 
    lg: "w-16 h-16",
    xl: "w-20 h-20"
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg", 
    xl: "text-xl"
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      {/* 메인 로딩 애니메이션 */}
      <div className="relative">
        {/* 외부 링 - 파란색 그라데이션 */}
        <div className={`${sizeClasses[size]} border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin`}></div>
        
        {/* 내부 링 - 보라색 그라데이션 (역방향) */}
        <div 
          className={`absolute top-1 left-1 ${sizeClasses[size].replace('w-', 'w-').replace('h-', 'h-').replace('w-12', 'w-10').replace('h-12', 'h-10').replace('w-16', 'w-14').replace('h-16', 'h-14').replace('w-20', 'w-18').replace('h-20', 'h-18')} border-4 border-purple-100 border-t-purple-500 rounded-full animate-spin`}
          style={{ animationDirection: 'reverse', animationDuration: '1.2s' }}
        ></div>
        
        {/* 중앙 아이콘 - 펄스 효과 */}
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${sizeClasses[size].replace('w-12', 'w-6').replace('h-12', 'h-6').replace('w-16', 'w-8').replace('h-16', 'h-8').replace('w-20', 'w-10').replace('h-20', 'h-10')} bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse`}>
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>

      {/* 로딩 텍스트 */}
      {showText && (
        <div className="text-center">
          <p className={`${textSizeClasses[size]} font-medium text-gray-600 animate-pulse`}>
            {text}
          </p>
          {/* 점 애니메이션 */}
          <div className="flex justify-center space-x-1 mt-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
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
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32"
  };

  return (
    <div className={`${sizeClasses[size]} relative flex items-center justify-center`}>
      {/* 중앙 원 */}
      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
      
      {/* 회전하는 파티클들 */}
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="absolute w-2 h-2 bg-blue-400 rounded-full animate-ping"
          style={{
            transform: `rotate(${index * 45}deg) translateY(-${size === 'sm' ? '24px' : size === 'md' ? '36px' : '48px'})`,
            animationDelay: `${index * 0.1}s`,
            animationDuration: '1.5s'
          }}
        ></div>
      ))}
    </div>
  );
}

// 웨이브 로딩 애니메이션
export function WaveLoading({ size = "md" }) {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16", 
    lg: "w-20 h-20"
  };

  return (
    <div className={`${sizeClasses[size]} flex items-end justify-center space-x-1`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="w-1 bg-gradient-to-t from-blue-500 to-purple-600 rounded-full animate-pulse"
          style={{
            height: `${20 + index * 8}px`,
            animationDelay: `${index * 0.1}s`,
            animationDuration: '0.8s'
          }}
        ></div>
      ))}
    </div>
  );
}

// 도트 로딩 애니메이션 (기존 스타일 개선)
export function DotLoading({ size = "md", color = "blue" }) {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4"
  };

  const colorClasses = {
    blue: "bg-blue-500",
    purple: "bg-purple-500", 
    green: "bg-green-500",
    red: "bg-red-500"
  };

  return (
    <div className="flex items-center justify-center space-x-2">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-bounce`}
          style={{
            animationDelay: `${index * 0.15}s`,
            animationDuration: '0.6s'
          }}
        ></div>
      ))}
    </div>
  );
}
