"use client";
import React from "react";
import {
  Tabs,
  Tab,
  Card,
  CardBody,
  Button,
  Badge,
  Spinner,
  addToast,
  ToastProvider,
  Divider,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaChevronLeft } from "react-icons/fa";
import { FaPlusCircle } from "react-icons/fa";
import { useParams } from "next/navigation";
import { FiMapPin } from "react-icons/fi";
import { LuClock4 } from "react-icons/lu";
import { createClient } from "@/utils/supabase/client";
import { IoMdInformationCircleOutline } from "react-icons/io";
import { HiOutlineCurrencyDollar } from "react-icons/hi2";
import CardReview from "./components/card-review";
import { FaArrowLeft } from "react-icons/fa";
import { LuSend } from "react-icons/lu";
import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import { FaCalendar } from "react-icons/fa6";
import { FaStar } from "react-icons/fa";
import { FaMap } from "react-icons/fa";
import { FaRegCalendar } from "react-icons/fa";
import { FaMoneyBill } from "react-icons/fa";
import { motion } from "framer-motion";
import { TbClockHour8Filled } from "react-icons/tb";
import { BsFillDoorClosedFill } from "react-icons/bs";


export default function App() {
  const { id } = useParams();
  const [selected, setSelected] = useState("home");
  const router = useRouter();
  const [exhibition, setExhibition] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [gallery, setGallery] = useState(null);
  const [notice, setNotice] = useState(null);
  const [displayedNoticeCount, setDisplayedNoticeCount] = useState(3);
  const [reviews, setReviews] = useState([]);
  const [displayedReviewCount, setDisplayedReviewCount] = useState(3);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [allDataLoaded, setAllDataLoaded] = useState(false);
  const [ticketCount, setTicketCount] = useState(1);
  const [payment, setPayment] = useState(null);
  const [userData, setUserData] = useState(null);
  const supabase = createClient();
  const clientKey = process.env.NEXT_PUBLIC_TOSSPAYMENTS_API_KEY;
  const [isFreeSoldOut, setIsFreeSoldOut] = useState(false);

  // 애니메이션 변수 추가
  const fadeInVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  useEffect(() => {
    if (
      exhibition !== null &&
      notice !== null &&
      reviews !== null &&
      !isLoading
    ) {
      setAllDataLoaded(true);
    }
  }, [exhibition, notice, reviews, isLoading]);

  useEffect(() => {
    const fetchNotice = async () => {
      try {
        const { data: noticeData, error: noticeError } = await supabase
          .from("gallery_notification")
          .select("*")
          .eq("naver_gallery_url", exhibition?.gallery?.url)
          .order("created_at", { ascending: false });
        console.log("noticeData:", noticeData);
        if (noticeError) {
          console.error("공지사항을 가져오는 중 오류 발생:", noticeError);
          return;
        }

        setNotice(noticeData);
      } catch (error) {
        console.error("공지사항을 가져오는 중 오류 발생:", error);
      }
    };

    if (exhibition) {
      fetchNotice();
    }
  }, [exhibition]);

  console.log("exhibition:", exhibition);
  console.log("notice:", notice);

  useEffect(() => {
    const fetchExhibition = async () => {
      try {
        // 전시회 정보 가져오기
        const { data: exhibitionData, error: exhibitionError } = await supabase
          .from("exhibition")
          .select(
            `
            *,
            gallery:naver_gallery_url(*)
          `
          )
          .eq("id", id)
          .single();

        if (exhibitionError) {
          console.error(
            "전시회 정보를 가져오는 중 오류 발생:",
            exhibitionError
          );
          return;
        }

        // 리뷰 관련 필드가 없는 경우를 대비해 기본값 설정
        const enhancedData = {
          ...exhibitionData,
          review_count: exhibitionData.review_count || 0,
          review_average: exhibitionData.review_average || 1.0,
          review_5_count: exhibitionData.review_5_count || 0,
          review_4_count: exhibitionData.review_4_count || 0,
          review_3_count: exhibitionData.review_3_count || 0,
          review_2_count: exhibitionData.review_2_count || 0,
          review_1_count: exhibitionData.review_1_count || 0,
        };

        setExhibition(enhancedData);
        setGallery(exhibitionData.name);
        setIsLoading(false);
      } catch (error) {
        console.error("데이터를 가져오는 중 오류 발생:", error);
        setIsLoading(false);
      }
    };

    fetchExhibition();
    fetchBookmarkStatus();
  }, [id, supabase]);

  // 북마크 상태 확인 함수 추가
  const fetchBookmarkStatus = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();

      if (user && user.user) {
        const { data: bookmarks, error } = await supabase
          .from("bookmark")
          .select("*")
          .eq("user_id", user.user.id)
          .eq("exhibition_id", id);

        if (error) {
          console.error("북마크 정보를 가져오는 중 오류 발생:", error);
          return;
        }

        setIsBookmarked(bookmarks && bookmarks.length > 0);
      }
    } catch (error) {
      console.error("북마크 상태 확인 중 오류 발생:", error);
    }
  };

  // 북마크 토글 함수 추가
  const toggleBookmark = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();

      if (!user || !user.user) {
        // 로그인이 필요한 경우 처리
        alert("북마크를 위해 로그인이 필요합니다.");
        return;
      }

      if (isBookmarked) {
        // 북마크 삭제
        const { error } = await supabase
          .from("bookmark")
          .delete()
          .eq("user_id", user.user.id)
          .eq("exhibition_id", id);

        if (error) throw error;

        // 북마크 해제 토스트 메시지
        addToast({
          title: "북마크 해제",
          description: "북마크가 해제되었습니다.",
          color: "primary",
        });
      } else {
        // 북마크 추가
        const { error } = await supabase.from("bookmark").insert({
          user_id: user.user.id,
          exhibition_id: id,
          created_at: new Date().toISOString(),
        });

        if (error) throw error;

        // 북마크 추가 토스트 메시지
        addToast({
          title: "북마크 설정",
          description: "북마크가 설정되었습니다.",
          color: "success",
        });
      }

      // 북마크 상태 변경
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error("북마크 토글 중 오류 발생:", error);

      // 에러 발생 시 토스트 메시지
      addToast({
        title: "오류 발생",
        description: "북마크 처리 중 오류가 발생했습니다.",
        color: "danger",
        icon: <Icon icon="mdi:alert-circle" />,
      });
    }
  };

  const handleShare = async () => {
    try {
      const shareData = {
        title: exhibition?.contents || "전시회 정보",
        text: `${exhibition?.gallery?.name} - ${exhibition?.contents}`,
        url: window.location.href,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Web Share API가 지원되지 않는 경우
        const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareData.url)}`;
        window.open(shareUrl, "_blank");
      }
    } catch (error) {
      console.error("공유 중 오류 발생:", error);
    }
  };

  // 더 보기 버튼 클릭 핸들러
  const handleLoadMoreNotices = () => {
    setDisplayedNoticeCount((prev) => prev + 3);
  };

  // 리뷰 더 보기 버튼 클릭 핸들러
  const handleLoadMoreReviews = () => {
    setDisplayedReviewCount((prev) => prev + 3);
  };

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data: reviewData, error: reviewError } = await supabase
          .from("exhibition_review")
          .select("*,exhibition_id(*)")
          .eq("exhibition_id", id);

        if (reviewError) {
          console.error("리뷰를 가져오는 중 오류 발생:", reviewError);
          return;
        }

        setReviews(reviewData);
      } catch (error) {
        console.error("리뷰를 가져오는 중 오류 발생:", error);
      }
    };

    fetchReviews();
  }, [id]);

  // 티켓 수량 증가 함수
  const increaseTicketCount = () => {
    setTicketCount(prev => prev + 1);
  };

  // 티켓 수량 감소 함수
  const decreaseTicketCount = () => {
    setTicketCount(prev => prev > 1 ? prev - 1 : 1);
  };

  // 합계 금액 계산
  const calculateTotalPrice = () => {
    if (!exhibition || !exhibition.price) return 0;
    return exhibition.price * ticketCount;
  };

  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.log("사용자 정보 가져오기 오류:", error);
        return;
      }
      if (data && data.user) {
        setUserData(data.user);
      }
    };
    
    getUser();
  }, []);

  // 토스페이먼츠 결제 SDK 로드
  useEffect(() => {
    if (!userData || !clientKey) return;
    
    const fetchPayment = async () => {
      try {
        const tossPayments = await loadTossPayments(clientKey);
        
        // 회원 결제
        const payment = tossPayments.payment({
          customerKey: userData.id,
        });
        
        setPayment(payment);
      } catch (error) {
        console.log("결제 설정 오류:", error);
      }
    };
    
    fetchPayment();
  }, [clientKey, userData]);

  // 랜덤 문자열 생성 함수
  const generateRandomString = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };
  
  // 결제 요청 함수
  const requestPayment = async () => {
    if (!userData) {
      // 로그인되지 않은 경우 로그인 페이지로 이동
      const redirectPath = `/exhibition/${id}`;
      console.log("로그인 필요, 리다이렉트 경로:", redirectPath);
      router.push(`/mypage?redirect_to=${encodeURIComponent(redirectPath)}`);
      return;
    }

    console.log("로그인 상태 확인, 사용자:", userData);

    if (!payment || !userData || !exhibition) {
      addToast({
        title: "결제 오류",
        description: "결제 정보를 가져오는 중 오류가 발생했습니다.",
        color: "danger",
      });
      return;
    }
    
    const totalAmount = calculateTotalPrice();
    const successUrlWithParams = `${window.location.origin}/ticket/success?exhibition_id=${id}&user_id=${userData.id}&ticket_count=${ticketCount}`;

    try {
      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: totalAmount },
        orderId: generateRandomString(),
        orderName: `${exhibition.contents} 티켓 ${ticketCount}매`,
        successUrl: successUrlWithParams,
        failUrl: `${window.location.origin}/ticket/fail`,
        customerEmail: userData.email,
        customerName: userData.user_metadata?.name || "고객",
        card: {
          useEscrow: false,
          flowMode: "DEFAULT",
          useCardPoint: false,
          useAppCardOnly: false,
        },
      });
    } catch (error) {
      console.error("결제 요청 오류:", error);
      addToast({
        title: "결제 오류",
        description: "결제 처리 중 오류가 발생했습니다.",
        color: "danger",
      });
    }
  };

  // 무료티켓 여부 체크
  const isFreeTicket = exhibition && exhibition.price === 0 && exhibition.isSale;

  // 무료티켓 발급 핸들러
  const handleFreeIssue = async () => {
    if (!userData) {
      const redirectPath = `/exhibition/${id}`;
      router.push(`/mypage?redirect_to=${encodeURIComponent(redirectPath)}`);
      return;
    }
    // 이미 발급된 적 있으면 얼럿
    const { data: existing, error: checkError } = await supabase
      .from("payment_ticket")
      .select("id", { count: "exact" })
      .eq("user_id", userData.id)
      .eq("exhibition_id", exhibition.id)
      .eq("amount", 0);
    if (checkError) {
      console.log("중복 체크 오류:", checkError);
      alert("티켓 발급 오류");
      return;
    }
    if (existing && existing.length > 0) {
      alert("이미 무료티켓을 받으셨습니다.");
      return;
    }
    // 고유 order_id 생성
    const orderId = generateRandomString();
    // 주문 생성
    const { error } = await supabase
      .from("payment_ticket")
      .insert({
        user_id: userData.id,
        exhibition_id: exhibition.id,
        people_count: 1,
        amount: 0,
        status: "success",
        order_id: orderId,
      });
    if (error) {
      console.log(error);
      alert("티켓 발급 실패");
      return;
    }
    // 완료 페이지 이동(주문상세)
    router.push(`/mypage/order-detail?order_id=${orderId}&exhibition_id=${exhibition.id}&user_id=${userData.id}&people_count=1&amount=0&created_at=${encodeURIComponent(new Date().toISOString())}`);
  };

  // 무료티켓 발급 가능 여부(매진 체크)
  useEffect(() => {
    // 무료티켓 조건일 때만 매진 여부 체크
    const checkFreeSoldOut = async () => {
      if (!exhibition || !isFreeTicket) return;
      // 무료티켓 발급 총합 조회
      const { data: tickets, error } = await supabase
        .from("payment_ticket")
        .select("id, people_count")
        .eq("exhibition_id", exhibition.id)
        .eq("amount", 0);
      if (error) {
        console.log("무료티켓 매진 체크 오류:", error);
        setIsFreeSoldOut(false);
        return;
      }
      // 총 발급 수량 합산
      const totalIssued = (tickets || []).reduce((sum, t) => sum + (t.people_count || 1), 0);
      if (exhibition.free_ticket_limit !== undefined && Number(exhibition.free_ticket_limit) > 0) {
        setIsFreeSoldOut(totalIssued >= Number(exhibition.free_ticket_limit));
      } else {
        setIsFreeSoldOut(false);
      }
    };
    checkFreeSoldOut();
  }, [exhibition, isFreeTicket]);

  // 구매/무료발급 버튼 분기 렌더링
  function PurchaseSection() {
    if (!exhibition?.isSale) return (
      <Button className="w-full mt-4 bg-gray-400 text-white text-[13px] font-bold" size="lg" disabled>
        웹티켓구매 미지원
      </Button>
    );
    if (isFreeTicket) {
      return (
        <Button
          className="w-full mt-4 bg-[#004BFE] text-white text-[13px] font-bold"
          size="lg"
          onPress={handleFreeIssue}
          disabled={isFreeSoldOut}
        >
          {isFreeSoldOut ? "무료티켓 매진" : "무료티켓 발급받기"}
        </Button>
      );
    }
    return (
      <Button
        onPress={requestPayment}
        className="w-full mt-4 bg-[#004BFE] text-white text-[13px] font-bold"
        size="lg"
      >
        웹티켓 구매하기
      </Button>
    );
  }

  return (
    <>
      {!allDataLoaded ? (
        <Spinner
          variant="wave"
          color="primary"
          className="w-full h-screen flex justify-center items-center"
        />
      ) : (
        <motion.div 
          className="max-w-md mx-auto bg-white min-h-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* 상단 네비게이션 바 */}
          <motion.div 
            className="w-full mx-auto bg-white flex items-center"
            initial="hidden"
            animate="visible"
            variants={fadeInVariants}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Button
              isIconOnly
              variant="light"
              className="mr-2"
              onPress={() => router.back()}
            >
              <FaArrowLeft className="text-xl" />
            </Button>
            <h2 className="text-lg font-medium"></h2>
          </motion.div>

          {/* Image section: use same settings as product page */}
          <motion.div 
            className="relative w-full h-[40vh] mx-auto overflow-hidden"
            initial="hidden"
            animate="visible"
            variants={fadeInVariants}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <img
              src={exhibition?.photo}
              alt="전시 이미지"
              className="object-contain w-full h-full"
            />
            <div className="absolute bottom-4 right-4 flex gap-2">
              <div
                className="bg-gray-300 rounded-lg hover:cursor-pointer w-7 h-7 flex items-center justify-center"
                onClick={toggleBookmark}
              >
                <Icon
                  icon={isBookmarked ? "mdi:bookmark" : "mdi:bookmark-outline"}
                  className="text-lg text-white font-bold "
                />
              </div>
              <div
                className="bg-gray-300 rounded-lg hover:cursor-pointer w-7 h-7 flex items-center justify-center"
                onClick={handleShare}
              >
                <LuSend className="text-lg text-white font-bold " />
              </div>
            </div>
          </motion.div>

          {/* Restaurant Info */}
          <motion.div 
            className="w-[90%] mx-auto mt-4"
            initial="hidden"
            animate="visible"
            variants={fadeInVariants}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[10px] text-[#494949]">
                  {exhibition?.gallery?.name}
                </h3>
                <h1 className="text-[20px] font-bold text-[#333333]">
                  {exhibition?.contents}
                </h1>
                {exhibition?.isPreSale && (
                  <div className="mt-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium inline-block">
                    🎫 사전예매 진행중
                  </div>
                )}

                <div className="flex items-center gap-1 mt-1">
                  <div className="flex items-center">
                    {/* <Icon icon="lucide:star" className="text-yellow-400" /> */}
                    <FaStar className="w-3 h-3 text-[#007AFF]" />
                    <span className="ml-1">
                      {exhibition?.review_average?.toFixed(1) || "0.0"}
                    </span>
                    <span className="text-gray-500">
                      ({exhibition?.review_count || 0})
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <Divider orientation="horizontal" className="my-2" />

            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <FaCalendar className="w-3 h-3 text-[#007AFF]" />
                <span>
                  기간 :{" "}
                  {exhibition?.start_date?.replace(
                    /(\d{4})(\d{2})(\d{2})/,
                    "$1년$2월$3일"
                  )}{" "}
                  ~{" "}
                  {exhibition?.end_date?.replace(
                    /(\d{4})(\d{2})(\d{2})/,
                    "$1년$2월$3일"
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2">
                
                <FaMap className="w-3 h-3 text-[#007AFF]" />
                <span>위치 :{" "}{exhibition?.gallery?.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <FaMoneyBill className="w-3 h-3 text-[#007AFF]" />
                <span>
                  금액 :{" "}
                  {exhibition?.price
                    ?.toString()
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                  원
                </span>
              </div>
              <div className="flex items-center gap-2">
                <TbClockHour8Filled className="w-3 h-3 text-[#007AFF]" />
                <span>
                  운영시간 :{" "}{exhibition?.working_hour}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <BsFillDoorClosedFill className="w-3 h-3 text-[#007AFF]" />
                <span>
                  휴관일 :{" "}{exhibition?.off_date}
                </span>
              </div>
            </div>
            {/* 구매/무료발급 버튼 분기 */}
            <div className="flex flex-row gap-2">
              <div className="w-full">{PurchaseSection()}</div>
              <Button
                target="_blank"
                onPress={() => router.push(exhibition?.homepage_url)}
                className="w-full mt-4 border-3 border-gray-400 text-gray-400 text-[13px] font-bold"
                size="lg"
                variant="bordered"
              >
                사이트연결
              </Button>
            </div>
            {/* 합계금액/수량조절 UI: 무료티켓이면 숨김 */}
            {exhibition?.isSale && !isFreeTicket && (
            <div className="flex flex-row items-center justify-between mt-4 rounded-lg p-4 shadow-md">
              <div className="text-[14px] font-bold">합계금액</div>
              <div className="flex flex-row items-center gap-2">
                <div className="text-[14px] font-bold">
                  ₩ {calculateTotalPrice().toLocaleString()}
                </div>
                <div className="flex flex-row items-center border border-gray-200 rounded-lg">
                  <button 
                    className="px-3 py-1 text-gray-500"
                    onClick={decreaseTicketCount}
                  >
                    -
                  </button>
                  <div className="px-3 py-1 border-x border-gray-200">{ticketCount}</div>
                  <button 
                    className="px-3 py-1 text-gray-500"
                    onClick={increaseTicketCount}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
            )}
          </motion.div>

          {/* 커스텀 탭바 섹션 */}
          <motion.div 
            className="mt-4 pb-16 flex flex-col items-center justify-start"
            initial="hidden"
            animate="visible"
            variants={fadeInVariants}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            {/* 커스텀 탭바 - 전체 폭의 2/3 크기로 중앙 정렬 */}
            <div className="flex w-[90%] border-t border-gray-200 mb-2">
              <div className="w-1/6"></div>
              <div className="flex w-2/3">
                <button
                  className={`text-[12px] flex-1 py-3 text-center font-medium ${selected === "home" ? "border-t-4 border-black text-black" : "text-gray-500"}`}
                  onClick={() => setSelected("home")}
                >
                  홈
                </button>
                <button
                  className={`text-[12px] flex-1 py-3 text-center font-medium ${selected === "gallery" ? "border-t-4 border-black text-black" : "text-gray-500"}`}
                  onClick={() => setSelected("gallery")}
                >
                  전시회 공지
                </button>
                <button
                  className={`text-[12px] flex-1 py-3 text-center font-medium ${selected === "reviews" ? "border-t-4 border-black text-black" : "text-gray-500"}`}
                  onClick={() => setSelected("reviews")}
                >
                  리뷰
                </button>
              </div>
              <div className="w-1/6"></div>
            </div>

            {/* 탭 컨텐츠 */}
            <div className="px-2 w-full flex justify-center">
              {selected === "home" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  key="home-tab"
                  className="w-full"
                >
                  <Card className="my-4 p-2 w-full">
                    <CardBody className="p-2">
                      <h3 className="text-lg font-bold mb-2">전시회 안내</h3>
                      <div 
                        className="fr-element text-[15px] sm:text-[14px] md:text-base whitespace-pre-line"
                        style={{ 
                          lineHeight: 1.6,
                          wordBreak: 'keep-all',
                          letterSpacing: '-0.3px'
                        }}
                        dangerouslySetInnerHTML={{ __html: exhibition?.add_info }}
                      />
                    </CardBody>
                  </Card>
                </motion.div>
              )}

              {selected === "gallery" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  key="gallery-tab"
                  className="w-full"
                >
                  {notice && notice.length > 0 ? (
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {notice.slice(0, displayedNoticeCount).map((item, i) => (
                        <motion.div
                          key={item.id || i}
                          variants={itemVariants}
                        >
                          <Card className="my-4 mx-2">
                            <CardBody>
                              <h3 className="text-lg font-bold">
                                {item.title || `공지사항 ${i + 1}`}
                              </h3>
                              <p className="text-sm text-gray-500 mt-1">
                                {new Date(item.created_at).toLocaleDateString()}
                              </p>
                              <p className="mt-2">
                                {item.content ||
                                  "전시회 관람 시간 안내 및 주의사항입니다."}
                              </p>
                            </CardBody>
                          </Card>
                        </motion.div>
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div 
                      className="flex justify-center items-center text-gray-500 my-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      전시회 공지가 없습니다.
                    </motion.div>
                  )}
                  {notice && notice.length > displayedNoticeCount && (
                    <motion.div 
                      className="flex justify-center items-center my-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      <Button
                        isIconOnly
                        variant="light"
                        onPress={handleLoadMoreNotices}
                        className="hover:cursor-pointer"
                      >
                        <FaPlusCircle className="text-gray-500 text-2xl font-bold" />
                      </Button>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {selected === "reviews" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  key="reviews-tab"
                  className="w-full"
                >
                  <motion.div 
                    className="flex flex-col items-center gap-2 mx-2"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {reviews
                      .slice(0, displayedReviewCount)
                      .map((review, index) => (
                        <motion.div className="w-full" key={index} variants={itemVariants}>
                          <CardReview
                            review={review}
                            content={review.description}
                            createdAt={review.created_at}
                            rating={review.rating}
                            title={review.title}
                            user={{
                              name: review.name,
                              avatar:
                                "https://i.pravatar.cc/150?u=a04258114e29026708c",
                            }}
                          />
                        </motion.div>
                      ))}
                  </motion.div>
                  {reviews.length === 0 && (
                    <motion.div 
                      className="flex justify-center items-center my-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      <p className="text-gray-500">리뷰가 없습니다.</p>
                    </motion.div>
                  )}

                  <motion.div 
                    className="flex justify-center items-center my-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    {reviews.length > displayedReviewCount ? (
                      <Button
                        isIconOnly
                        variant="light"
                        onPress={handleLoadMoreReviews}
                        className="hover:cursor-pointer"
                      >
                        <FaPlusCircle className="text-gray-500 text-2xl font-bold" />
                      </Button>
                    ) : reviews.length > 0 &&
                      reviews.length <= displayedReviewCount ? (
                      <p className="text-gray-500">더 이상 리뷰가 없습니다.</p>
                    ) : null}
                  </motion.div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
