"use client";
import React from 'react';

export default function ModernSpinner({ size = "md", color = "blue", className = "" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8", 
    lg: "w-12 h-12",
    xl: "w-16 h-16"
  };

  const colorClasses = {
    blue: "border-blue-200 border-t-blue-600",
    purple: "border-purple-200 border-t-purple-600",
    green: "border-green-200 border-t-green-600",
    gray: "border-gray-200 border-t-gray-600"
  };

  return (
    <div className={`relative ${className}`}>
      {/* 외부 링 */}
      <div className={`${sizeClasses[size]} border-4 ${colorClasses[color]} rounded-full animate-spin`}></div>
      {/* 내부 링 */}
      <div className={`absolute top-0.5 left-0.5 ${size === "sm" ? "w-3 h-3" : size === "md" ? "w-6 h-6" : size === "lg" ? "w-10 h-10" : "w-14 h-14"} border-4 ${colorClasses[color].replace("border-t-", "border-t-")} rounded-full animate-spin`} 
           style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
    </div>
  );
}

