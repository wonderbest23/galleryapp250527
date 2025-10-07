"use client";
import React, { useState } from "react";
// @heroui/react 패키지명이 잘못되었을 수 있습니다
// NextUI나 다른 UI 라이브러리로 바꿔보겠습니다
import { Button, Drawer } from "@heroui/react";
import { Menu, Shield } from "lucide-react"; // Icon 대신 lucide-react 직접 사용
import Link from "next/link";
import  Providers  from "./components/providers";

import Sidebar from "./components/sidebar";
import "@/app/globals.css";

export default function AdminLayout({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <html lang="ko">
      <body>
        <div className="min-h-screen bg-gray-50 w-full overflow-x-hidden">
      {/* 모바일 메뉴 버튼 - 작은 화면에서만 표시 */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-md bg-white/80 backdrop-blur-lg shadow-sm"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* 모바일 사이드바 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 모바일 사이드바 - 개선된 디자인 */}
      <div
        className={`fixed top-0 left-0 z-50 h-full w-80 bg-white transform transition-transform duration-300 ease-in-out shadow-2xl ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:hidden`}
      >
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">Admin</h4>
                <p className="text-blue-100 text-sm">관리자 패널</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
            >
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Sidebar onItemClick={() => setIsOpen(false)} />
        </div>
      </div>

      {/* 데스크톱 사이드바 - 좁은 너비로 개선 */}
      <div className="hidden lg:block fixed inset-y-0 left-0 w-72 bg-white shadow-lg">
        <Sidebar />
      </div>

      {/* 메인 콘텐츠 - 상단바 포함 */}
      <main className="lg:pl-72">
        {/* 상단 네비게이션 바 */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">관리자 패널</h1>
              <p className="text-sm text-gray-500">사이트 전체를 효율적으로 관리하세요</p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                사이트 보기 →
              </Link>
            </div>
          </div>
        </header>
        
        {/* 페이지 컨텐츠 */}
        <div className="p-6">
          <Providers>{children}</Providers>
        </div>
      </main>
        </div>
      </body>
    </html>
  );
}
