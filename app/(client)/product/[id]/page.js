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
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { FaPlusCircle } from "react-icons/fa";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { FiMapPin } from "react-icons/fi";
import { LuClock4 } from "react-icons/lu";
import { IoMdInformationCircleOutline, IoMdClose } from "react-icons/io";
import { FaArrowLeft } from "react-icons/fa";
import { LuSend } from "react-icons/lu";
import { Divider } from "@heroui/react";
import Image from "next/image";
import { cn } from "@/utils/cn";
import { LuWallet } from "react-icons/lu";
import { FaRegBookmark, FaBookmark } from "react-icons/fa6";
import { motion } from "framer-motion";
import dynamic from 'next/dynamic';

const Slider = dynamic(
  async () => {
    const mod = await import('react-slick');
    await import('slick-carousel/slick/slick.css');
    await import('slick-carousel/slick/slick-theme.css');
    return mod.default;
  },
  { ssr: false, loading: () => <div>슬라이더 로딩 중...</div> }
);

// 리뷰 컴포넌트 추가

export default function App() {
  const [selected, setSelected] = useState("home");
  const [isLoading, setIsLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState({
    product: false,
    bookmark: false,
  });
  const [product, setProduct] = useState(null);
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const router = useRouter();
  const { id } = useParams();
  const supabase = createClient();
  const [gallery, setGallery] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationPage, setNotificationPage] = useState(1);
  const [hasMoreNotifications, setHasMoreNotifications] = useState(true);
  const notificationsPerPage = 3;

  const [reviews, setReviews] = useState([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [hasMoreReviews, setHasMoreReviews] = useState(true);
  const [hostId, setHostId] = useState(null);
  const reviewsPerPage = 3;
  const [reviewStats, setReviewStats] = useState({
    average: 0,
    count: 0,
    fiveStars: 0,
    fourStars: 0,
    threeStars: 0,
    twoStars: 0,
    oneStars: 0,
  });

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // 매거진 스타일 전체보기 모달용 상태
  const [modalOpen, setModalOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);

  // 페이드인 애니메이션 설정
  const fadeInVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeInOut",
      },
    },
  };

  // 작가의 다른 작품 추천
  const [otherWorks, setOtherWorks] = useState([]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: user } = await supabase.auth.getUser();
      setUser(user);
      setUserId(user?.user?.id);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data, error } = await supabase
          .from("product")
          .select("*,artist_id(*)")
          .eq("id", id)
          .single();

        if (error) {
          console.log("Error fetching product:", error);
        } else {
          setProduct(data);
          setHostId(data.artist_id.id);
        }
        setDataLoaded((prev) => ({ ...prev, product: true }));
      } catch (error) {
        console.log("제품 불러오기 중 오류 발생:", error);
        setDataLoaded((prev) => ({ ...prev, product: true }));
      }
    };
    fetchProduct();
  }, [id]);

  console.log("setIsBookmarked", isBookmarked);
  useEffect(() => {
    const fetchBookmarkStatus = async () => {
      try {
        const { data: user } = await supabase.auth.getUser();

        if (user && user.user) {
          const { data: bookmarks, error } = await supabase
            .from("bookmark")
            .select("*")
            .eq("user_id", user.user.id)
            .eq("product_id", id);

          if (error) {
            console.log("북마크 정보를 가져오는 중 오류 발생:", error);
          } else {
            setIsBookmarked(bookmarks && bookmarks.length > 0);
          }
        }
        setDataLoaded((prev) => ({ ...prev, bookmark: true }));
      } catch (error) {
        console.log("북마크 상태 확인 중 오류 발생:", error);
        setDataLoaded((prev) => ({ ...prev, bookmark: true }));
      }
    };
    fetchBookmarkStatus();
  }, [id]);

  // 모든 데이터가 로드되었는지 확인하는 useEffect
  useEffect(() => {
    if (dataLoaded.product && dataLoaded.bookmark) {
      setIsLoading(false);
    }
  }, [dataLoaded]);

  // 제품 이미지 없는 경우 기본 이미지 설정
  const productImages =
    product?.image?.length > 0 ? product.image : ["/noimage.jpg"];

  // react-slick 슬라이더 설정
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false, // chevron 숨김
    cssEase: "linear",
    variableWidth: false,
    adaptiveHeight: true,
  };

  // 북마크 토글 함수
  const toggleBookmark = async () => {
    try {
      // 사용자 확인
      if (!user || !user.user) {
        // 로그인이 필요한 경우 처리
        addToast({
          title: "로그인이 필요합니다",
          description: "북마크 기능을 위해 로그인해주세요",
          variant: "warning",
        });
        router.push("/mypage?redirect_to=/product/" + id);
        return;
      }

      if (isBookmarked) {
        // 북마크 삭제
        const { error } = await supabase
          .from("bookmark")
          .delete()
          .eq("user_id", user.user.id)
          .eq("product_id", id);

        if (error) throw error;

        // 북마크 해제 토스트 메시지
        addToast({
          title: "북마크 해제",
          description: "북마크가 해제되었습니다.",
          color: "success",
        });
      } else {
        // 북마크 추가
        const { error } = await supabase.from("bookmark").insert({
          user_id: user.user.id,
          product_id: id,
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
      console.log("북마크 토글 중 오류 발생:", error);

      // 에러 발생 시 토스트 메시지
      addToast({
        title: "오류 발생",
        description: "북마크 처리 중 오류가 발생했습니다.",
        variant: "danger",
      });
    }
  };

  // 공유 기능들
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      addToast({
        title: "복사 완료",
        description: "링크가 클립보드에 복사되었습니다!",
        color: "success",
      });
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
      // 폴백: 텍스트 선택
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      addToast({
        title: "복사 완료",
        description: "링크가 클립보드에 복사되었습니다!",
        color: "success",
      });
    }
  };

  const shareToKakao = () => {
    const url = `${window.location.origin}/product/${id}`;
    const title = product?.title || '작품';
    const description = product?.description || '아트앤브릿지에서 만나보세요';
    
    if (window.Kakao && window.Kakao.isInitialized()) {
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: title,
          description: description,
          imageUrl: productImages[0] || '/logo/logo.png',
          link: {
            mobileWebUrl: url,
            webUrl: url,
          },
        },
      });
    } else {
      addToast({
        title: "공유 실패",
        description: "카카오톡 공유 기능을 사용할 수 없습니다.",
        color: "warning",
      });
    }
  };

  const shareToFacebook = () => {
    const url = `${window.location.origin}/product/${id}`;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const shareToTwitter = () => {
    const url = `${window.location.origin}/product/${id}`;
    const text = `${product?.title || '작품'} - 아트앤브릿지`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  // 메시지 전송 함수
  const sendMessage = async () => {
    if (!messageText.trim()) {
      addToast({
        title: "메시지를 입력해주세요",
        description: "작가에게 보낼 메시지를 작성해주세요",
        color: "warning",
      });
      return;
    }

    setIsSendingMessage(true);
    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiver_id: hostId,
          product_id: id,
          message: messageText.trim()
        }),
      });

      const result = await response.json();

      if (result.success) {
        addToast({
          title: "메시지가 전송되었습니다",
          description: "작가가 확인하면 답변을 드릴 예정입니다",
          color: "success",
        });
        setMessageText("");
        setMessageModalOpen(false);
      } else {
        addToast({
          title: "메시지 전송 실패",
          description: result.error || "메시지 전송에 실패했습니다",
          color: "danger",
        });
      }
    } catch (error) {
      console.log('메시지 전송 오류:', error);
      addToast({
        title: "메시지 전송 실패",
        description: "네트워크 오류가 발생했습니다",
        color: "danger",
      });
    } finally {
      setIsSendingMessage(false);
    }
  };

  // 모달 오픈 함수 (매거진 스타일)
  const openImageModal = (idx) => {
    setModalIndex(idx);
    setModalOpen(true);
  };
  // 모달 닫기 함수
  const closeImageModal = () => {
    setModalOpen(false);
  };

  useEffect(() => {
    if (!product?.artist_id?.id) return;
    const fetchOtherWorks = async () => {
      const { data, error } = await supabase
        .from("product")
        .select("*")
        .eq("artist_id", product.artist_id.id)
        .neq("id", product.id)
        .order("created_at", { ascending: false })
        .limit(4);
      if (!error) setOtherWorks(data || []);
    };
    fetchOtherWorks();
  }, [product]);

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {isLoading ? (
        <Spinner
          variant="wave"
          color="primary"
          className="w-full h-screen flex justify-center items-center"
        />
      ) : (
        <motion.div
          className="flex flex-col items-center justify-center"
          initial="hidden"
          animate="visible"
          variants={fadeInVariants}
        >
          {/* 상단 네비게이션 바 */}
          <div className="bg-white relative flex items-center justify-between w-full px-4 py-3 border-b border-gray-100">
            {/* 뒤로 가기 버튼 */}
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* 중앙 제목 - 완전한 중앙 정렬 */}
            <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-bold text-gray-900">
              작품 상세
            </h1>

            {/* 우측 아이콘들 */}
            <div className="flex items-center gap-3">
              {/* 공유 아이콘 */}
              <button 
                onClick={() => setShareModalOpen(true)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </button>
            </div>
          </div>

          {/* 이미지 슬라이더 - 이미지가 2개 이상일 때만 슬라이더 사용 */}
          <div className="relative w-full h-[40vh] mx-auto overflow-hidden">
            {productImages.length === 1 ? (
              <div className="relative w-full h-[40vh] overflow-hidden cursor-zoom-in" onClick={() => openImageModal(0)}>
                <Image
                  src={productImages[0]}
                  alt="제품 이미지"
                  className="object-cover w-full h-full rounded-bl-3xl"
                  fill
                  priority
                  unoptimized
                />
              </div>
            ) : (
              <Slider {...sliderSettings}>
                {productImages.map((img, idx) => (
                  <div key={idx} className="relative w-full h-[40vh] overflow-hidden cursor-zoom-in" onClick={() => openImageModal(idx)}>
                    <Image
                      src={img}
                      alt={`제품 이미지 ${idx + 1}`}
                      className="object-contain w-full h-full rounded-bl-3xl"
                      fill
                      priority
                      unoptimized
                    />
                  </div>
                ))}
              </Slider>
            )}
          </div>

          {/* 매거진 스타일 이미지 전체보기 모달 */}
          {modalOpen && (
            <div
              className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
              onClick={closeImageModal}
            >
              {/* 좌측 화살표 */}
              {productImages.length > 1 && (
                <button
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-50 bg-black/60 rounded-full w-12 h-12 flex items-center justify-center shadow-lg border-2 border-white/30 hover:bg-black/80 transition"
                  onClick={e => {
                    e.stopPropagation();
                    setModalIndex((prev) => (prev === 0 ? productImages.length - 1 : prev - 1));
                  }}
                  aria-label="이전 이미지"
                >
                  {/* 굵은 화살표 SVG */}
                  <svg width={32} height={32} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 8L12 16L20 24" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              )}
              <div
                className="max-w-full max-h-full overflow-auto"
                onClick={e => e.stopPropagation()}
              >
                <img
                  src={productImages[modalIndex]}
                  alt="원본 이미지"
                  className="block max-w-full max-h-[90vh] mx-auto"
                  draggable={false}
                  style={{ cursor: 'zoom-out' }}
                />
              </div>
              {/* 우측 화살표 */}
              {productImages.length > 1 && (
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-50 bg-black/60 rounded-full w-12 h-12 flex items-center justify-center shadow-lg border-2 border-white/30 hover:bg-black/80 transition"
                  onClick={e => {
                    e.stopPropagation();
                    setModalIndex((prev) => (prev === productImages.length - 1 ? 0 : prev + 1));
                  }}
                  aria-label="다음 이미지"
                >
                  {/* 굵은 화살표 SVG */}
                  <svg width={32} height={32} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 8L20 16L12 24" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              )}
              {/* dot 네비게이션 */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 p-1">
                {productImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={e => { e.stopPropagation(); setModalIndex(index); }}
                    className={`w-2 h-2 rounded-full transition-colors duration-300 ${modalIndex === index ? "bg-red-500" : "bg-white border border-gray-300"}`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 작품 정보 섹션 */}
          <div className="w-[90%] mt-4">
            {/* 상단: 제목, 작가, 평점 */}
            <div className="mb-4">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {product?.name || "제품명 없음"}
              </h1>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-blue-600 font-medium">
                    {product?.artist_id?.artist_name || "작가명 없음"}
                  </span>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">4.8</span>
                  </div>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  ₩{product?.price?.toLocaleString()}
                </div>
              </div>
            </div>

            {/* 상세 정보 박스 */}
            <div className="bg-gray-100 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-4">
                {/* 왼쪽 컬럼 */}
                <div className="space-y-3">
                  {/* 제작년도 */}
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <div className="text-sm font-medium text-gray-700">제작년도</div>
                      <div className="text-sm text-gray-900">
                        {product?.make_date !== "null" && product?.make_date !== null
                          ? product.make_date
                          : "정보 없음"}
                      </div>
                    </div>
                  </div>

                  {/* 재료/기법 */}
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                    </svg>
                    <div>
                      <div className="text-sm font-medium text-gray-700">재료/기법</div>
                      <div className="text-sm text-gray-900">
                        {product?.make_material || "정보 없음"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 오른쪽 컬럼 */}
                <div className="space-y-3">
                  {/* 크기 */}
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2M9 8h6m-6 4h6m-6 4h6" />
                    </svg>
                    <div>
                      <div className="text-sm font-medium text-gray-700">크기</div>
                      <div className="text-sm text-gray-900">
                        {product?.size || "정보 없음"}
                      </div>
                    </div>
                  </div>

                  {/* 장르 */}
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <div>
                      <div className="text-sm font-medium text-gray-700">장르</div>
                      <div className="text-sm text-gray-900">
                        {product?.genre !== "null" && product?.genre !== null ? product.genre : "정보 없음"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
          <Divider orientation="horizontal" className="w-[90%] my-2" />
          {/* Restaurant Info */}
          <div className="w-[90%] flex flex-row justify-start items-center my-2 gap-x-4 cursor-pointer" onClick={() => {
            const artistId = product?.artist_id?.id ?? product?.artist_id;
            if(artistId){ router.push(`/artist/${artistId}`); }
          }}>
            <div className="relative w-[52px] h-[52px]">
              <Image
                src={product?.artist_id?.avatar_url}
                alt="아티스트 이미지"
                className=" rounded-full object-contain"
                fill
                priority
                unoptimized
              />
            </div>
            <div className="flex flex-col">
              <p className="text-[15px] font-bold">
                {product?.artist_id?.artist_name}
              </p>
              <p className="text-[10px]">{product?.artist_id?.artist_birth}</p>
            </div>
          </div>
          <div className="w-[90%] flex flex-col gap-y-2">
            <div className="flex flex-col justify-center text-[14px] mt-2">
              <p>{product?.artist_id?.artist_intro}</p>
            </div>
          </div>
          <div className="w-[90%] flex flex-row justify-between items-center gap-x-4 my-4 h-14 mb-8">
            <Button
              isIconOnly
              className="bg-gray-200 w-[20%] h-full text-[20px] font-bold"
              onPress={toggleBookmark}
            >
              {isBookmarked ? (
                <FaBookmark className="text-red-500" />
              ) : (
                <FaRegBookmark />
              )}
            </Button>
            <Button
              className="bg-[#007AFF] text-white w-[80%] h-full text-[16px] font-bold"
              onPress={() => {
                if (userId) {
                  setMessageModalOpen(true);
                } else {
                  router.push("/mypage?redirect_to=/product/" + id);
                  addToast({
                    title: "로그인이 필요합니다",
                    description: "메시지 전송을 위해 로그인해주세요",
                    color: "warning",
                  });
                }
              }}
            >
              작가에게 문의
            </Button>
          </div>
          {/* 작가의 다른 작품 추천 섹션 */}
          {otherWorks.length > 0 && (
            <div className="w-full flex flex-col items-center mt-8 pb-24">
              <div className="w-[90%] flex flex-row justify-between items-center mb-2">
                <h2 className="text-xl font-bold">작가의 다른 작품</h2>
                {/* 전체보기 버튼 등 필요시 추가 */}
              </div>
              <div className="w-[90%] grid grid-cols-2 gap-4">
                {otherWorks.map((item) => (
                  <div key={item.id} className="bg-white rounded-xl shadow p-2 flex flex-col cursor-pointer" onClick={() => router.push(`/product/${item.id}`)}>
                    <div className="relative w-full aspect-[4/3] mb-2 overflow-hidden rounded-lg">
                      <img src={item.image?.[0] || "/noimage.jpg"} alt={item.name} className="object-cover w-full h-full" />
                    </div>
                    <div className="text-[15px] font-bold line-clamp-1 mb-1">{item.name}</div>
                    <div className="text-[13px] text-gray-500 mb-1">{item.size || ""}</div>
                    <div className="text-[14px] text-black font-bold">₩{item.price?.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ==================== 공유 모달 ==================== */}
      {shareModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">작품 공유</h3>
              <button
                onClick={() => setShareModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* 링크 복사 */}
              <button
                onClick={() => {
                  const url = `${window.location.origin}/product/${id}`;
                  copyToClipboard(url);
                }}
                className="w-full flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">링크 복사</div>
                  <div className="text-sm text-gray-500">작품 링크를 클립보드에 복사</div>
                </div>
              </button>

              {/* 카카오톡 공유 */}
              <button
                onClick={shareToKakao}
                className="w-full flex items-center gap-3 p-4 bg-yellow-50 rounded-xl hover:bg-yellow-100 transition-colors"
              >
                <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3C6.48 3 2 6.48 2 10.5c0 2.5 1.5 4.7 3.8 6.1L5 21l4.5-1.3c1.2.4 2.5.6 3.8.6 5.52 0 10-3.48 10-7.5S17.52 3 12 3z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">카카오톡</div>
                  <div className="text-sm text-gray-500">카카오톡으로 공유</div>
                </div>
              </button>

              {/* 페이스북 공유 */}
              <button
                onClick={shareToFacebook}
                className="w-full flex items-center gap-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
              >
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">페이스북</div>
                  <div className="text-sm text-gray-500">페이스북으로 공유</div>
                </div>
              </button>

              {/* 트위터 공유 */}
              <button
                onClick={shareToTwitter}
                className="w-full flex items-center gap-3 p-4 bg-sky-50 rounded-xl hover:bg-sky-100 transition-colors"
              >
                <div className="w-10 h-10 bg-sky-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">트위터</div>
                  <div className="text-sm text-gray-500">트위터로 공유</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== 메시지 전송 모달 ==================== */}
      {messageModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">작가에게 문의</h3>
              <button
                onClick={() => {
                  setMessageModalOpen(false);
                  setMessageText("");
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* 작품 정보 */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  {product?.image_url && (
                    <img 
                      src={product.image_url} 
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                  )}
                  <div>
                    <div className="font-medium text-gray-900">{product?.name}</div>
                    <div className="text-sm text-gray-500">{product?.artist_id?.artist_name}</div>
                  </div>
                </div>
              </div>

              {/* 메시지 입력 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  문의 내용
                </label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="작가에게 궁금한 점이나 문의사항을 작성해주세요..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={500}
                />
                <div className="text-right text-sm text-gray-500 mt-1">
                  {messageText.length}/500
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setMessageModalOpen(false);
                    setMessageText("");
                  }}
                  className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={sendMessage}
                  disabled={isSendingMessage || !messageText.trim()}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {isSendingMessage ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      전송 중...
                    </>
                  ) : (
                    <>
                      <LuSend className="w-4 h-4" />
                      전송
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
