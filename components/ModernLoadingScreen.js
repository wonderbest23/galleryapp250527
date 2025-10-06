"use client";
import React from 'react';
import { motion } from 'framer-motion';

export default function ModernLoadingScreen({ message = "로딩 중..." }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 배경 패턴 */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-purple-500 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-pink-500 rounded-full blur-2xl"></div>
      </div>

      {/* 메인 로딩 컨텐츠 */}
      <div className="relative z-10 text-center">
        {/* 로고/아이콘 */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ 
            duration: 0.8, 
            ease: "easeOut",
            type: "spring",
            stiffness: 100
          }}
          className="mb-8"
        >
          <div className="relative">
            {/* 외부 링 */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              className="w-24 h-24 mx-auto border-4 border-blue-200 border-t-blue-600 rounded-full"
            />
            
            {/* 내부 링 */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                ease: "linear" 
              }}
              className="absolute top-2 left-2 w-20 h-20 border-4 border-purple-200 border-t-purple-600 rounded-full"
            />
            
            {/* 중앙 아이콘 */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </motion.div>

        {/* 로딩 텍스트 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            아트앤브릿지
          </h2>
          
          <p className="text-gray-600 text-lg font-medium">
            {message}
          </p>
          
          {/* 진행률 바 */}
          <div className="w-64 mx-auto">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
              />
            </div>
          </div>
        </motion.div>

        {/* 부드러운 점들 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="flex justify-center space-x-2 mt-8"
        >
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                delay: index * 0.2,
                ease: "easeInOut"
              }}
              className="w-3 h-3 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"
            />
          ))}
        </motion.div>
      </div>

      {/* 하단 데코레이션 */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <div className="flex items-center space-x-2 text-gray-400 text-sm">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          <span>예술과 기술의 만남</span>
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
        </div>
      </motion.div>
    </div>
  );
}

