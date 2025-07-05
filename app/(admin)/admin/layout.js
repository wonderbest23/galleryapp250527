"use client";
import React, { useState } from "react";
// @heroui/react 패키지명이 잘못되었을 수 있습니다
// NextUI나 다른 UI 라이브러리로 바꿔보겠습니다
import { Button, Drawer } from "@heroui/react";
import { Menu } from "lucide-react"; // Icon 대신 lucide-react 직접 사용
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

          {/* 모바일 사이드바 */}
          <div
            className={`fixed top-0 left-0 z-50 h-full w-64 bg-white transform transition-transform duration-300 ease-in-out ${
              isOpen ? "translate-x-0" : "-translate-x-full"
            } lg:hidden`}
          >
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-medium">관리자 메뉴</h4>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div>
              <Sidebar onItemClick={() => setIsOpen(false)} />
            </div>
          </div>

          {/* 데스크톱 사이드바 - 작은 화면에서는 숨김 */}
          <div className="hidden lg:block fixed inset-y-0 left-0 w-64 border-r border-gray-200 bg-white">
            <Sidebar />
          </div>

          {/* 메인 콘텐츠 */}
          <main className="lg:pl-64">
            <div className="w-full h-full px-6">
              <Providers>{children}</Providers>
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
