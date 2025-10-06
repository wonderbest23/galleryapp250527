"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "@heroui/react";

function PaymentProcessor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const processPayment = async () => {
      try {
        // URL 파라미터 확인
        const paymentKey = searchParams.get("paymentKey");
        const orderId = searchParams.get("orderId");
        const amount = searchParams.get("amount");

        if (paymentKey && orderId && amount) {
          // 결제 성공 페이지로 리다이렉트
          router.push(`/payment/success?paymentKey=${paymentKey}&orderId=${orderId}&amount=${amount}`);
        } else {
          // 필요한 정보가 없는 경우
          // 3초 후 결제 페이지로 리다이렉트
          setTimeout(() => {
            router.push("/payment");
          }, 3000);
          
          throw new Error("결제 정보가 올바르지 않습니다.");
        }
      } catch (error) {
        console.error("결제 처리 오류:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    processPayment();
  }, [searchParams, router]);

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[70vh] px-4">
      {loading ? (
        <div className="flex flex-col items-center justify-center">
          <Spinner size="lg" color="primary" />
          <p className="mt-4 text-lg">결제를 처리하고 있습니다...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center">
          <div className="p-4 bg-red-100 rounded-lg text-red-700">
            <p className="text-lg font-medium">오류 발생</p>
            <p>{error}</p>
            <p className="mt-2 text-sm">잠시 후 결제 페이지로 이동합니다.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center">
          <Spinner size="lg" color="primary" />
          <p className="mt-4 text-lg">결제 처리 완료. 결과 페이지로 이동 중...</p>
        </div>
      )}
    </div>
  );
}

export default function PaymentProcessPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center w-full min-h-[70vh] px-4 space-y-6">
        <div className="relative">
          {/* 외부 링 */}
          <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          {/* 내부 링 */}
          <div className="absolute top-1 left-1 w-18 h-18 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          {/* 중앙 아이콘 */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
        </div>
        <div className="text-center">
          <p className="text-gray-700 font-medium text-xl">결제를 처리하고 있습니다...</p>
          <p className="text-gray-500 text-sm mt-2">잠시만 기다려주세요</p>
        </div>
        {/* 진행률 바 */}
        <div className="w-64">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    }>
      <PaymentProcessor />
    </Suspense>
  );
}
