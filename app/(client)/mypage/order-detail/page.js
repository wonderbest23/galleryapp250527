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
  const [isConfirmed, setIsConfirmed] = useState(false);

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

  // 입장확인 버튼 클릭 핸들러
  const handleConfirmEntry = async () => {
    console.log('입장확인 버튼 클릭');
    if (!orderInfo.orderId) {
      console.log('orderId 없음');
      return;
    }
    // 티켓 id 가져오기
    const { data: ticketData } = await supabase
      .from("payment_ticket")
      .select("id")
      .eq("order_id", orderInfo.orderId)
      .maybeSingle();
    console.log('ticketData:', ticketData);
    if (!ticketData) return;
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("payment_ticket")
      .update({ status: "used", used_at: now })
      .eq("id", ticketData.id);
    if (updateError) {
      console.log('updateError:', updateError);
    }
    if (!updateError) {
      setTicketStatus("used");
      setUsedAt(now);
      setIsConfirmed(true);
    }
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="flex flex-col min-h-[100dvh] relative bg-white mx-1">
      <div className="flex-1 flex flex-col items-center overflow-y-auto">
        <div className="w-full flex flex-col items-center mt-2">
          <div className="text-[26px] font-bold text-center">주문 상세</div>
          <div className="text-[12px] text-black font-medium text-center mt-1 mb-2">
            {orderInfo.exhibition?.contents}
          </div>
          <div className="w-full max-w-xs bg-[#FAFAFA] rounded-xl p-4 flex flex-col items-center gap-3 shadow-md">
            {/* 구매 정보 */}
            <div className="w-full text-[14px] text-black font-medium text-left">
              <p>구매날짜: {orderInfo.created_at?.split('T')[0]}</p>
              <p>티켓 구매 수: {orderInfo.peopleCount}매</p>
              <p>구매번호: {orderInfo.orderId}</p>
              <p>총 결제금액: {Number(orderInfo.amount).toLocaleString()}원</p>
            </div>
            {/* QR코드 */}
            <QRCodeSVG value={`${typeof window !== 'undefined' ? window.location.origin : ''}/mypage/order-detail?order_id=${orderInfo.orderId}&exhibition_id=${orderInfo.exhibition?.id}&user_id=${orderInfo.user?.id}&people_count=${orderInfo.peopleCount}&amount=${orderInfo.amount}&created_at=${orderInfo.created_at}&qr=1`} size={140} />
            {/* 상태별 안내 */}
            <div className="w-full flex flex-col items-center gap-1">
              {isQrMode ? (
                ticketStatus === 'used' ? (
                  <>
                    <FaCircleCheck className="text-blue-500 text-[32px] mb-1" />
                    <div className="text-[15px] text-blue-700 font-extrabold text-center mb-1">이미 사용한 티켓입니다.</div>
                    {usedAt && (
                      <div className="text-[12px] text-gray-700 font-semibold mb-1">입장시간: {dayjs(usedAt).format('YYYY-MM-DD HH:mm:ss')}</div>
                    )}
                    <div className="text-[12px] text-red-500 font-bold">재입장은 불가합니다.</div>
                  </>
                ) : (
                  isConfirmed ? (
                    <div className="px-4 py-2 rounded-lg border-2 border-blue-500 bg-blue-50 text-blue-700 text-[16px] font-bold text-center shadow-md mt-2 mb-1">입장 처리가 완료되었습니다.</div>
                  ) : (
                    <Button
                      className="w-full px-4 py-2 rounded-lg border-2 border-blue-500 bg-blue-50 text-blue-700 text-[16px] font-bold text-center shadow-md mt-2 mb-1"
                      onClick={handleConfirmEntry}
                    >
                      입장확인
                    </Button>
                  )
                )
              ) : (
                ticketStatus === 'used' ? (
                  <>
                    <FaCircleCheck className="text-blue-500 text-[32px] mb-1" />
                    <div className="text-[15px] text-blue-700 font-extrabold text-center mb-1">입장이 완료된 티켓입니다.</div>
                    {usedAt && (
                      <div className="text-[12px] text-gray-700 font-semibold mb-1">입장시간: {dayjs(usedAt).format('YYYY-MM-DD HH:mm:ss')}</div>
                    )}
                  </>
                ) : (
                  <>
                    <FaCircleCheck className="text-green-500 text-[24px]" />
                    <div className="text-[13px] text-black font-medium">구매 완료된 티켓입니다.</div>
                  </>
                )
              )}
            </div>
          </div>
        </div>
      </div>
      {/* 하단 버튼 */}
      <div className="w-full flex flex-col items-center mb-1 mt-1">
        <Button
          onPress={() => router.back()}
          className="w-[98%] font-bold bg-white border-2 border-black text-black text-[15px] py-2"
          size="md"
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