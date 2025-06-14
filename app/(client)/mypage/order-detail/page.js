"use client";
import React, { useEffect, useState, Suspense } from "react";
import { Button, Skeleton } from "@heroui/react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { FaArrowLeft, FaCircleCheck } from "react-icons/fa6";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import dayjs from "dayjs";
import { v4 as uuidv4 } from "uuid";

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
      {/* 상단바: ← 주문상세 */}
      <div className="w-full flex items-center justify-start px-2 py-2 bg-white z-10">
        <Button
          isIconOnly
          variant="light"
          className="mr-2"
          onPress={() => router.back()}
        >
          <FaArrowLeft className="text-xl" />
        </Button>
        <span className="text-lg font-bold ml-0">주문상세</span>
      </div>
      {/* 카드(주문 상세) */}
      <div className="flex-1 flex flex-col items-center overflow-y-auto pt-2">
        <div className="w-full flex flex-col items-center mt-2">
          <div className="w-full max-w-md bg-[#FAFAFA] rounded-xl p-4 flex flex-col items-center gap-3 mx-auto">
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
                      onPress={handleConfirmEntry}
                    >
                      입장확인
                    </Button>
                  )
                )
              ) : (
                ticketStatus === 'used' ? (
                  <>
                    <FaCircleCheck className="text-blue-500 text-[32px] mb-1" />
                    <div className="text-[15px] text-red-500 font-extrabold text-center mb-1">이미 사용완료된 티켓입니다.</div>
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
          {/* 교환 및 반품 안내문구: 카드 아래에 위치 */}
          <div className="w-full flex justify-center items-center py-4">
            <div className="text-center text-xs text-gray-600 font-medium cursor-pointer underline" onClick={() => alert(`교환 및 환불 규정 (전시/공연 관람권)\n\n본 규정은 『전자상거래 등에서의 소비자보호에 관한 법률』, 『공연법』, 『공연관람표 표준약관(공정거래위원회 제10023호)』 및 관련 지침을 준수하여 작성되었습니다. 예매 전 반드시 아래 내용을 숙지하시기 바랍니다.\n\n1. 환불 가능 기간 및 기준\n관람일 7일 전(포함)까지 취소 요청 시: 전액 환불\n\n관람일 6일 전 ~ 당일 및 이후 취소 시: 환불 불가\n\n단, 예매일과 전시/공연일 사이가 7일 미만일 경우, 예매 즉시 환불 불가 규정이 적용됩니다.\n예시: 전시일이 6월 21~22일이며, 6월 20일 예매 시 환불은 불가합니다.\n\n2. 환불 수수료\n관람일 7일 전까지: 100% 환불 (수수료 없음)\n\n관람일 6일 전부터 당일 및 이후: 환불 불가\n\n3. 교환 및 일정 변경\n관람일 7일 전(포함)까지, 1회에 한하여 날짜 및 시간 변경 가능\n\n변경 요청은 예매자 본인에 한하여 가능하며, 타인 명의로의 양도·변경은 불가\n\n일정 변경은 고객센터 또는 카카오채널 '아트앤브릿지'를 통해 접수해야 합니다\n\n4. 환불 신청 방법\n마이페이지 내 고객센터 또는 카카오채널 '아트앤브릿지'로 접수\n\n결제 수단에 따라 영업일 기준 3~7일 내 환불 처리\n\n신용카드 결제 시, 카드사 정책에 따라 환불 시점은 상이할 수 있음\n\n5. 환불 불가 항목 (아래 사유는 환불 사유로 인정되지 않음)\n관람일 6일 전부터 당일 이후의 취소 요청\n\n예매자의 착오 (관람 날짜·시간 착오 포함)\n\n개인 사정(출장, 건강, 교통 문제 등)\n\n무단 미입장\n\n현장 방문 후 단순 변심\n\n기상 악화, 질병 등의 외부 요인(단, 천재지변 등 예외 사유는 내부 운영 기준에 따름)\n\n6. 예외적 환불 가능 사유\n다음의 경우에 한해, 증빙 서류 제출 시 예외적으로 환불이 검토될 수 있습니다.\n단, 주최 측의 판단에 따라 전액/일부 환불 또는 거절될 수 있습니다.\n\n입원 등 긴급 의료 사유 (의사의 진단서 또는 입원확인서 제출)\n\n직계가족의 사망 (사망진단서 및 가족관계증명서)\n\n국가적 재난에 따른 이동 제한 명령 등\n\n7. 법률 고지 및 분쟁 예방 안내\n본 티켓은 『전자상거래법 제17조 제2항 3호』 및 『소비자분쟁해결기준』의 "공연, 전시 등 특정 일시에 제공되는 서비스"로 분류되어, 청약철회가 제한될 수 있습니다.\n\n예매자는 본 규정에 동의함으로써, 청약철회 불가 조건 및 환불 불가 항목에 대해 충분히 안내받았음을 인정합니다.\n\n모든 분쟁은 대한민국 민법 및 소비자보호 관련 법령에 따라 해결되며, 주최 측과의 사전 조율 및 협의가 우선됩니다.\n\n✅ 문의 및 요청:\n고객센터 또는 카카오톡 채널 '아트앤브릿지'`)}>교환 및 반품</div>
          </div>
        </div>
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