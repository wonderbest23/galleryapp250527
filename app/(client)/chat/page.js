"use client";
import React, { Suspense } from "react";
import {
  Button,
  Skeleton,
  Input,
  Textarea,
  DatePicker,
  addToast,
  Spinner
} from "@heroui/react";
import { FaChevronLeft } from "react-icons/fa";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardBody, Divider, Image, CardFooter } from "@heroui/react";
import { FaPlusCircle } from "react-icons/fa";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { parseDate } from "@internationalized/date";
import { CiImageOn } from "react-icons/ci";
import { IoMdCloseCircleOutline } from "react-icons/io";
import ChatComplete from "./components/ChatComplete";

// SearchParams를 사용하는 컴포넌트
function ChatWithSearchParams() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hostId = searchParams.get("hostId");
  const userId = searchParams.get("userId");
  const productId = searchParams.get("productId");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatData, setChatData] = useState(null);

  console.log("hostId:", hostId);
  console.log("userId:", userId);
  console.log("productId:", productId);
  
  // 채팅 존재 확인 및 생성
  useEffect(() => {
    if (!hostId || !userId) {
      console.log("hostId 또는 userId가 없습니다");
      setLoading(false);
      addToast({
        title: "오류",
        description: "채팅 연결에 필요한 정보가 누락되었습니다.",
        color: "danger",
      });
      return;
    }

    const checkOrCreateChat = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/chat/check-or-create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            hostId,
            userId,
            productId,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "채팅 생성 중 오류가 발생했습니다.");
        }

        console.log("받은 채팅 데이터:", data);
        
        if (!data.chat) {
          throw new Error("채팅 데이터를 받아오지 못했습니다.");
        }
        
        setChatData(data.chat);
        console.log("채팅 데이터 설정됨:", data.chat);
      } catch (err) {
        console.log("채팅 확인/생성 중 오류:", err.message);
        setError(err.message);
        addToast({
          title: "채팅 연결 오류",
          description: err.message,
          color: "danger"
        });
      } finally {
        setLoading(false);
      }
    };

    checkOrCreateChat();
  }, [hostId, userId, productId, router]);

  return (
    <div className="flex flex-col items-center justify-center mx-2">
      <div className="bg-white flex items-center w-full justify-between">
        <Button
          isIconOnly
          variant="light"
          className="mr-2"
          onPress={() => router.back()}
          aria-label="뒤로 가기"
        >
          <FaArrowLeft className="text-xl" />
        </Button>
        <h2 className="text-lg font-bold text-center flex-grow">구매연결</h2>
        <div className="w-10"></div>
      </div>

      {loading ? (
        <div className="w-full h-[70vh] flex flex-col justify-center items-center">
          <Spinner variant="wave" color="primary" size="lg" />
          <p className="mt-4 text-gray-600">채팅방을 연결하고 있습니다...</p>
        </div>
      ) : chatData && (
        <ChatComplete
          hostId={hostId}
          userId={userId}
          productId={productId}
          chatData={chatData}
        />
      )}
    </div>
  );
}

// 로딩 상태를 표시하는 컴포넌트
function ChatPageLoading() {
  return (
    <div className="flex flex-col items-center justify-center mx-2">
      <div className="bg-white flex items-center w-full justify-between">
        <Button
          isIconOnly
          variant="light"
          className="mr-2"
          aria-label="뒤로 가기"
        >
          <FaArrowLeft className="text-xl" />
        </Button>
        <h2 className="text-lg font-bold text-center flex-grow">구매연결</h2>
        <div className="w-10"></div>
      </div>
      <div className="w-full h-[70vh] flex flex-col justify-center items-center space-y-6">
        <div className="relative">
          {/* 외부 링 */}
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          {/* 내부 링 */}
          <div className="absolute top-1 left-1 w-14 h-14 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          {/* 중앙 아이콘 */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        </div>
        <div className="text-center">
          <p className="text-gray-700 font-medium text-lg">채팅방을 로딩 중입니다...</p>
          <p className="text-gray-500 text-sm mt-2">잠시만 기다려주세요</p>
        </div>
        {/* 진행률 바 */}
        <div className="w-48">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 메인 페이지 컴포넌트
export default function ChatPage() {
  return (
    <Suspense fallback={<ChatPageLoading />}>
      <ChatWithSearchParams />
    </Suspense>
  );
}
