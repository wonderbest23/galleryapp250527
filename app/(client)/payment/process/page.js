"use client";
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Spinner } from "@heroui/react";
import { ModernLoading } from "@/app/(client)/components/ModernLoading";

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
        <ModernLoading size="lg" text="결제를 처리하고 있습니다..." />
      ) : error ? (
        <div className="flex flex-col items-center justify-center">
          <div className="p-4 bg-red-100 rounded-lg text-red-700">
            <p className="text-lg font-medium">오류 발생</p>
            <p>{error}</p>
            <p className="mt-2 text-sm">잠시 후 결제 페이지로 이동합니다.</p>
          </div>
        </div>
      ) : (
        <ModernLoading size="lg" text="결제 처리 완료. 결과 페이지로 이동 중..." />
      )}
    </div>
  );
}

export default function PaymentProcessPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center w-full min-h-[70vh] px-4">
        <ModernLoading size="xl" text="결제를 처리하고 있습니다..." />
      </div>
    }>
      <PaymentProcessor />
    </Suspense>
  );
}
