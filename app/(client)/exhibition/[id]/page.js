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
  const [selected, setSelected] = useState("info");
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
      <Button 
        className="w-full bg-gray-400 text-white text-sm font-semibold hover:bg-gray-500 transition-colors" 
        size="lg" 
        disabled
      >
        웹티켓구매 미지원
      </Button>
    );
    if (isFreeTicket) {
      return (
        <Button
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
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
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
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
          {/* 상단 네비게이션 바 (뒤로가기 / 전시 상세 / 하트,공유) */}
          <motion.div 
            className="w-full mx-auto bg-white/95 backdrop-blur-sm flex items-center justify-between px-4 py-3 border-b border-gray-100 relative shadow-sm"
            initial="hidden"
            animate="visible"
            variants={fadeInVariants}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {/* Back */}
            <Button
              isIconOnly
              variant="light"
              onPress={() => router.back()}
              className="hover:bg-gray-100 transition-colors"
            >
              <FaArrowLeft className="text-xl text-gray-700" />
            </Button>

            {/* Title (정중앙 고정) */}
            <h2 className="absolute left-1/2 -translate-x-1/2 text-lg font-bold text-gray-800">전시 상세</h2>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                isIconOnly
                variant="light"
                onPress={toggleBookmark}
                className="hover:bg-red-50 transition-colors"
              >
                <Icon
                  icon={isBookmarked ? "mdi:heart" : "mdi:heart-outline"}
                  className={`text-2xl ${isBookmarked ? 'text-red-500' : 'text-gray-600'}`}
                />
              </Button>
              <Button
                isIconOnly
                variant="light"
                onPress={handleShare}
                className="hover:bg-blue-50 transition-colors"
              >
                <Icon icon="mdi:share-variant" className="text-2xl text-gray-600" />
              </Button>
            </div>
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
          </motion.div>

          {/* Exhibition Info */}
          <motion.div 
            className="w-[90%] mx-auto mt-6"
            initial="hidden"
            animate="visible"
            variants={fadeInVariants}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-sm text-gray-500 font-medium mb-1">
                    {exhibition?.gallery?.name}
                  </h3>
                  <h1 className="text-2xl font-bold text-gray-800 mb-3 leading-tight">
                    {exhibition?.contents}
                  </h1>
                  
                  {exhibition?.isPreSale && (
                    <div className="mb-3 px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 rounded-full text-sm font-semibold inline-flex items-center gap-2">
                      🎫 사전예매 진행중
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center bg-yellow-50 px-3 py-1 rounded-full">
                      <FaStar className="w-4 h-4 text-yellow-500 mr-1" />
                      <span className="text-sm font-semibold text-gray-700">
                        {exhibition?.review_average?.toFixed(1) || "0.0"}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">
                        ({exhibition?.review_count || 0})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Section - moved right after exhibition info */}
            <motion.div 
              className="mt-6"
              initial="hidden"
              animate="visible"
              variants={fadeInVariants}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              {/* Tab Navigation */}
              <div className="mb-6">
                <div className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100">
                  <div className="flex">
                    <button
                      className={`relative flex-1 py-3 px-4 text-center text-sm font-semibold transition-all rounded-xl ${
                        selected === 'info' 
                          ? 'text-blue-600 bg-blue-50 shadow-sm' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      onClick={() => setSelected('info')}
                    >
                      전시 정보
                    </button>
                    <button
                      className={`relative flex-1 py-3 px-4 text-center text-sm font-semibold transition-all rounded-xl ${
                        selected === 'reviews' 
                          ? 'text-blue-600 bg-blue-50 shadow-sm' 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                      onClick={() => setSelected('reviews')}
                    >
                      리뷰
                    </button>
                  </div>
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex justify-center">
                {selected === "info" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    key="info-tab"
                    className="w-full"
                  >
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                      <h3 className="text-xl font-bold mb-4 text-gray-800">전시회 안내</h3>
                      <div 
                        className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                        style={{ 
                          lineHeight: 1.7,
                          wordBreak: 'keep-all',
                          letterSpacing: '-0.2px'
                        }}
                        dangerouslySetInnerHTML={{ __html: exhibition?.add_info }}
                      />
                      
                      {/* Action Buttons in Info Tab */}
                      <div className="mt-6 flex flex-col gap-3">
                        <div className="flex flex-row gap-3">
                          <div className="flex-1">{PurchaseSection()}</div>
                          <Button
                            target="_blank"
                            onPress={() => router.push(exhibition?.homepage_url)}
                            className="flex-1 border-2 border-gray-300 text-gray-600 text-sm font-semibold hover:border-gray-400 hover:text-gray-700 transition-colors"
                            size="lg"
                            variant="bordered"
                          >
                            사이트연결
                          </Button>
                        </div>
                      </div>
                      
                      {/* 합계금액/수량조절 UI: 무료티켓이면 숨김 */}
                      {exhibition?.isSale && !isFreeTicket && (
                        <div className="mt-4 bg-gray-50 rounded-2xl p-4 border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="text-lg font-bold text-gray-800">합계금액</div>
                            <div className="flex items-center gap-4">
                              <div className="text-xl font-bold text-blue-600">
                                ₩ {calculateTotalPrice().toLocaleString()}
                              </div>
                              <div className="flex items-center bg-white rounded-xl border border-gray-300">
                                <button 
                                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors rounded-l-xl"
                                  onClick={decreaseTicketCount}
                                >
                                  −
                                </button>
                                <div className="px-4 py-2 border-x border-gray-300 bg-white font-semibold text-gray-800">{ticketCount}</div>
                                <button 
                                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 transition-colors rounded-r-xl"
                                  onClick={increaseTicketCount}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {selected === "reviews" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    key="reviews-tab"
                    className="w-full"
                  >
                    <motion.div 
                      className="flex flex-col gap-4"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {reviews
                        .slice(0, displayedReviewCount)
                        .map((review, index) => (
                          <motion.div className="w-full" key={index} variants={itemVariants}>
                            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
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
                            </div>
                          </motion.div>
                        ))}
                    </motion.div>
                    
                    {reviews.length === 0 && (
                      <motion.div 
                        className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                      >
                        <p className="text-gray-500 text-lg">리뷰가 없습니다.</p>
                        <p className="text-gray-400 text-sm mt-2">첫 번째 리뷰를 작성해보세요!</p>
                      </motion.div>
                    )}

                    <motion.div 
                      className="flex justify-center items-center my-6"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      {reviews.length > displayedReviewCount ? (
                        <Button
                          variant="bordered"
                          onPress={handleLoadMoreReviews}
                          className="border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
                          startContent={<FaPlusCircle className="text-gray-500" />}
                        >
                          더 보기
                        </Button>
                      ) : reviews.length > 0 &&
                        reviews.length <= displayedReviewCount ? (
                        <p className="text-gray-400 text-sm">더 이상 리뷰가 없습니다.</p>
                      ) : null}
                    </motion.div>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Exhibition Details */}
            <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4">전시 정보</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FaCalendar className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">기간</p>
                    <p className="text-sm text-gray-600">
                      {exhibition?.start_date?.replace(
                        /(\d{4})(\d{2})(\d{2})/,
                        "$1년$2월$3일"
                      )}{" "}
                      ~{" "}
                      {exhibition?.end_date?.replace(
                        /(\d{4})(\d{2})(\d{2})/,
                        "$1년$2월$3일"
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FaMap className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">위치</p>
                    <p className="text-sm text-gray-600">{exhibition?.gallery?.address}</p>
                  </div>
                </div>
                
                {exhibition?.price !== null && exhibition?.price !== undefined && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FaMoneyBill className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">금액</p>
                      <p className="text-sm text-gray-600">
                        {exhibition?.price === 0
                          ? "무료"
                          : `${exhibition?.price
                              ?.toString()
                              .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}원`}
                      </p>
                    </div>
                  </div>
                )}
                
                {exhibition?.working_hour && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <TbClockHour8Filled className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">운영시간</p>
                      <p className="text-sm text-gray-600">{exhibition?.working_hour}</p>
                    </div>
                  </div>
                )}
                
                {exhibition?.off_date && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <BsFillDoorClosedFill className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">휴관일</p>
                      <p className="text-sm text-gray-600">{exhibition?.off_date}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

        </motion.div>
      )}
      
      {/* 하단 여백 추가 */}
      <div className="h-20"></div>
    </>
  );
}
