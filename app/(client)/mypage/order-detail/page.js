"use client";
import React, { useEffect, useState, Suspense } from "react";
import { Button, Skeleton } from "@heroui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { FaArrowLeft, FaCircleCheck } from "react-icons/fa6";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import dayjs from "dayjs";

// 로딩 상태를 위한 컴포넌트
function LoadingSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-y-6 mt-12">
      {[...Array(5)].map((_, index) => (
        <div
          key={index}
          className="max-w-[300px] w-full flex items-center gap-3"
        >
          <div>
            <Skeleton className="flex rounded-full w-12 h-12" />
          </div>
          <div className="w-full flex flex-col gap-2">
            <Skeleton className="h-3 w-3/5 rounded-lg" />
            <Skeleton className="h-3 w-4/5 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

// 주문 상세 컨텐츠 컴포넌트
function OrderDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [orderInfo, setOrderInfo] = useState({
    exhibition: null,
    user: null,
    peopleCount: 0,
    purchaseDate: null,
    orderId: "",
    amount: 0
  });
  const supabase = createClient();
  const [ticketStatus, setTicketStatus] = useState("success");
  const [isQrMode, setIsQrMode] = useState(false);
  const [usedAt, setUsedAt] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const exhibitionId = searchParams.get('exhibition_id');
        const userId = searchParams.get('user_id');
        const peopleCount = searchParams.get('people_count') || 1;
        const orderId = searchParams.get('order_id');
        const amount = searchParams.get('amount');
        const createdAt = searchParams.get('created_at');
        const isQr = searchParams.get('qr') === '1';
        setIsQrMode(isQr);
        // 전시회 정보 가져오기
        const { data: exhibitionData } = await supabase
          .from("exhibition")
          .select("*, gallery:naver_gallery_url(*)")
          .eq("id", exhibitionId)
          .single();
        // 사용자 정보 가져오기
        const { data: userData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single();
        // 티켓 상태 가져오기
        let status = "success";
        let ticketId = null;
        let usedAtValue = null;
        const { data: ticketData } = await supabase
          .from("payment_ticket")
          .select("id, status, used_at")
          .eq("order_id", orderId)
          .maybeSingle();
        if (ticketData) {
          status = ticketData.status;
          ticketId = ticketData.id;
          usedAtValue = ticketData.used_at;
        }
        // QR모드(관계자)에서 미사용 티켓이면 사용처리
        if (isQr && status === "success" && ticketId) {
          const now = new Date().toISOString();
          const { error: updateError } = await supabase
            .from("payment_ticket")
            .update({ status: "used", used_at: now })
            .eq("id", ticketId);
          if (!updateError) {
            status = "used";
            usedAtValue = now;
          }
        }
        setTicketStatus(status);
        setUsedAt(usedAtValue);
        setOrderInfo({
          exhibition: exhibitionData,
          user: userData || { name: "게스트" },
          peopleCount: parseInt(peopleCount),
          purchaseDate: createdAt,
          orderId: orderId,
          amount: amount,
          created_at: createdAt
        });
        setIsLoading(false);
      } catch (error) {
        console.log("데이터 가져오기 오류:", error);
        setIsLoading(false);
      }
    };
    fetchData();
  }, [searchParams]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen flex flex-col justify-between items-center mx-2 bg-white">
      <div className="w-full flex flex-col items-center">
        {/* 상단 영역 */}
        <div className="w-[90%] flex flex-col gap-y-8 mt-6">
          <div className="flex flex-col items-center justify-center">
            <div className="text-[36px] text-black font-bold">
              <h1 className='text-[36px] text-black font-bold text-center mt-2'>주문 상세</h1>
              <div className="text-[10px] text-black font-medium text-center mt-2">
                {orderInfo.exhibition?.contents}
              </div>
            </div>
          </div>
          <div className="w-full py-8 text-[14px] text-black font-medium text-start bg-[#FAFAFA] px-8 rounded-2xl">
            <p>구매날짜: {orderInfo.created_at?.split('T')[0]}</p>
            <p>티켓 구매 수: {orderInfo.peopleCount}매</p>
            <p>구매번호: {orderInfo.orderId}</p>
            <p>총 결제금액: {Number(orderInfo.amount).toLocaleString()}원</p>
          </div>
          <div className="flex flex-col items-center justify-center gap-y-4">
            {/* QR코드 영역 */}
            <div className="my-4">
              <QRCodeSVG value={`${typeof window !== 'undefined' ? window.location.origin : ''}/mypage/order-detail?order_id=${orderInfo.orderId}&exhibition_id=${orderInfo.exhibition?.id}&user_id=${orderInfo.user?.id}&people_count=${orderInfo.peopleCount}&amount=${orderInfo.amount}&created_at=${orderInfo.created_at}&qr=1`} size={160} />
            </div>
            {/* 상태별 안내 */}
            {ticketStatus === 'used' ? (
              <>
                <FaCircleCheck className="text-blue-500 text-[48px] mb-2" />
                <div className="text-[22px] text-blue-700 font-extrabold text-center mb-2">사용 완료된 티켓입니다.</div>
                {usedAt && (
                  <div className="text-[16px] text-gray-700 font-semibold mb-2">입장시간: {dayjs(usedAt).format('YYYY-MM-DD HH:mm:ss')}</div>
                )}
                {isQrMode && <div className="text-[14px] text-gray-500">입장 확인이 완료되었습니다.</div>}
              </>
            ) : (
              <>
                <FaCircleCheck className="text-green-500 text-[40px]" />
                <div className="text-[18px] text-black font-medium">구매 완료된 티켓입니다.</div>
                {isQrMode && <div className="text-[14px] text-gray-500">입장 처리가 완료되었습니다.</div>}
              </>
            )}
          </div>
        </div>
      </div>
      {/* 하단 버튼 */}
      <div className="w-full flex flex-col items-center mb-2 mt-2">
        <Button
          onPress={() => router.back()}
          className="w-[90%] font-bold bg-white border-2 border-black text-black text-[18px] py-4"
          size="lg"
        >
          돌아가기
        </Button>
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  return (
    <div className="flex flex-col items-center justify-center mx-2">
      <Suspense fallback={<LoadingSkeleton />}>
        <OrderDetailContent />
      </Suspense>
    </div>
  );
} 