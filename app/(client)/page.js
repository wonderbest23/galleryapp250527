"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { FiHome, FiSearch, FiBell, FiHeart, FiMessageCircle, FiShare2, FiMoreVertical, FiChevronRight } from "react-icons/fi";
import Link from "next/link";
import Image from "next/image";
import {
  Input,
  Tabs,
  Tab,
  Card,
  CardBody,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import TopNavigation from "./components/TopNavigation";
import { ExhibitionCarousel } from "./components/exhibition-carousel";
import { CategoryButtons } from "./components/category-buttons";
import { ExhibitionCards } from "./components/exhibition-cards";
import { GallerySection } from "./components/gallery-section";
import { MagazineCarousel } from "./components/magazine-carousel";
import GalleryCards from "./components/gallery-cards";
import Artists from "./components/Artists";
import BottomNavigation from "./components/BottomNavigationbar";
import { ReviewCards } from "./components/review-cards";
import { MagazineCards } from "./components/magazine-cards";
import { LatestWorks } from "./components/latest-works";
import { TopOfWeek } from "./components/top-of-week";
import { CommunityHighlights } from "./components/community-highlights";

export default function Home() {
  const [exhibitionCategory, setExhibitionCategory] = useState("all");
  const [selectedTab, setSelectedTab] = useState("recommended");
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const exchangeRefundDisclosure = useDisclosure();
  const purchaseNoticeDisclosure = useDisclosure();
  const termsDisclosure = useDisclosure();
  const notificationDisclosure = useDisclosure();
  const [ticketCount, setTicketCount] = useState(1);
  const [ticketPrice, setTicketPrice] = useState(15000);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [search, setSearch] = useState("");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [exhibitions, setExhibitions] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const supabase = createClient();

  // 티켓 수량 증가
  const increaseTicket = () => {
    if (ticketCount < 10) {
      setTicketCount(ticketCount + 1);
    }
  };

  // 티켓 수량 감소
  const decreaseTicket = () => {
    if (ticketCount > 1) {
      setTicketCount(ticketCount - 1);
    }
  };

  // 총 금액 계산
  const totalPrice = ticketCount * ticketPrice;

  const getUser = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.log("Error fetching user:", error);
    } else {
      setUser(data?.user);
    }
  };

  useEffect(() => {
    getUser();
    fetchNotifications();
  }, []);

  // 스크롤 이벤트 리스너
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      console.log('Scroll position:', scrollTop); // 디버깅용
      setIsScrolled(scrollTop > 50); // 50px 이상 스크롤하면 작은 모양으로 변경
    };

    // 초기 스크롤 위치 확인
    handleScroll();
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 알림 데이터 가져오기
  const fetchNotifications = async () => {
    try {
      // 실제 알림 데이터를 가져오는 로직 (예시)
      const mockNotifications = [
        {
          id: 1,
          title: "새로운 전시회가 등록되었습니다",
          message: "서울시립미술관에서 '현대미술의 흐름' 전시회가 시작됩니다.",
          time: "2시간 전",
          isRead: false,
          type: "exhibition"
        },
        {
          id: 2,
          title: "좋아요를 받았습니다",
          message: "당신의 작품 '봄의 향기'에 좋아요가 추가되었습니다.",
          time: "5시간 전",
          isRead: false,
          type: "like"
        },
        {
          id: 3,
          title: "댓글이 달렸습니다",
          message: "갤러리 리뷰에 새로운 댓글이 달렸습니다.",
          time: "1일 전",
          isRead: true,
          type: "comment"
        }
      ];
      
      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.isRead).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  // 알림 읽음 처리
  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // 모든 알림 읽음 처리
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
    setUnreadCount(0);
  };

  // 검색 기능
  const handleSearch = async (searchTerm) => {
    try {
      // 전시회 데이터 검색
      const { data, error } = await supabase
        .from("exhibition")
        .select("*")
        .ilike("contents", `%${searchTerm}%`)
        .gte("end_date", new Date().toISOString());

      if (error) {
        console.error("전시회 데이터 검색 오류:", error);
      } else {
        setExhibitions(data || []);
      }

      // 갤러리 데이터 검색
      const { data: galleryData, error: galleryError } = await supabase
        .from("gallery")
        .select("*")
        .ilike("name", `%${searchTerm}%`);

      if (galleryError) {
        console.error("갤러리 데이터 검색 오류:", galleryError);
      } else {
        setGallery(galleryData || []);
      }
    } catch (e) {
      console.error("검색 중 예외 발생:", e);
    }
  };

  // 검색어 변경 시 검색 실행
  useEffect(() => {
    if (search) {
      handleSearch(search);
      setShowSearchResults(true);
    } else {
      setExhibitions([]);
      setGallery([]);
      setShowSearchResults(false);
    }
  }, [search]);

  // 링크 클릭 시 검색창 초기화
  const handleLinkClick = () => {
    setSearch("");
    setExhibitions([]);
    setGallery([]);
    setShowSearchResults(false);
  };

  const getFavorites = async () => {
    const { data, error } = await supabase
      .from("favorite")
      .select("*")
      .eq("name", user.email);
    if (error) {
      console.log("Error fetching favorites:", error);
    } else {
      setFavorites(data || []);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 상단 네비게이션 바 */}
      <div className="bg-white px-4 py-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          {/* 홈 아이콘 */}
          <div className="flex items-center">
            <Link href="/" className="cursor-pointer">
              <FiHome className="w-6 h-6 text-gray-700 hover:text-blue-500 transition-colors" />
            </Link>
          </div>

          {/* 검색바 */}
          <div className="flex-1 mx-4 relative">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="갤러리, 전시회를 검색해보세요"
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* 검색 결과 배너 */}
            {showSearchResults && search && (
              <div className="absolute w-full bg-white shadow-md rounded-b-lg p-4 z-50 top-full left-0">
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">갤러리</h3>
                  {gallery.length > 0 ? (
                    <div className="space-y-2">
                      {gallery.slice(0, 3).map((item) => (
                        <Link
                          href={`/galleries/${item.id}`}
                          key={item.id}
                          onClick={handleLinkClick}
                        >
                          <div className="flex items-center p-2 hover:bg-gray-50 rounded-lg transition">
                            <div className="flex-shrink-0 mr-3">
                              <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                                {item.thumbnail ? (
                                  <img
                                    src={item.thumbnail}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <FiHome className="text-gray-400 text-xl" />
                                )}
                              </div>
                            </div>
                            <span className="text-sm">{item.name}</span>
                          </div>
                        </Link>
                      ))}
                      {gallery.length > 3 && (
                        <div className="text-xs text-right text-gray-500">
                          외 {gallery.length - 3}개 결과
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 p-2">
                      갤러리 검색 결과가 없습니다.
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 my-2"></div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-2">전시회</h3>
                  {exhibitions.length > 0 ? (
                    <div className="space-y-2">
                      {exhibitions.slice(0, 3).map((item) => (
                        <Link
                          href={`/exhibition/${item.id}`}
                          key={item.id}
                          onClick={handleLinkClick}
                        >
                          <div className="flex items-center p-2 hover:bg-gray-50 rounded-lg transition">
                            <div className="flex-shrink-0 mr-3">
                              <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                                {item.photo ? (
                                  <img
                                    src={item.photo}
                                    alt={item.title || item.contents}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <FiHome className="text-gray-400 text-xl" />
                                )}
                              </div>
                            </div>
                            <span className="text-sm">
                              {item.title || item.contents}
                            </span>
                          </div>
                        </Link>
                      ))}
                      {exhibitions.length > 3 && (
                        <div className="text-xs text-right text-gray-500">
                          외 {exhibitions.length - 3}개 결과
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 p-2">
                      전시회 검색 결과가 없습니다.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 알림 아이콘 */}
          <div className="relative">
            <button onClick={notificationDisclosure.onOpen} className="relative">
              <FiBell className="w-6 h-6 text-gray-700" />
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex flex-col gap-3 justify-center items-center w-full">
        {/* Banner Carousel */}
        <ExhibitionCarousel user={user} />

        {/* Exhibition Tabs */}
        <div className="w-full flex flex-col mb-4 justify-center items-center mt-4">
          <div className="flex w-[90%] border-b border-gray-200 mb-2">
            <div className="flex flex-1">
              <button
                className={`text-sm py-3 px-4 font-medium ${exhibitionCategory === "all" ? "text-black border-b-2 border-black" : "text-gray-500"}`}
                onClick={() => setExhibitionCategory("all")}
              >
                전체전시
              </button>
              <button
                className={`text-sm py-3 px-4 font-medium ${exhibitionCategory === "free" ? "text-black border-b-2 border-black" : "text-gray-500"}`}
                onClick={() => setExhibitionCategory("free")}
              >
                무료전시
              </button>
              <button
                className={`text-sm py-3 px-4 font-medium ${exhibitionCategory === "recommended" ? "text-black border-b-2 border-black" : "text-gray-500"}`}
                onClick={() => setExhibitionCategory("recommended")}
              >
                추천전시
              </button>
            </div>
            <div className="flex items-center">
              <Link href="/exhibitions" className="text-sm text-blue-500 font-medium hover:text-blue-700 transition-colors">
                전체보기
              </Link>
            </div>
          </div>

          <ExhibitionCards exhibitionCategory={exhibitionCategory} user={user} />
        </div>

        {/* 전시회 리뷰 섹션 */}
        <div className="w-full flex flex-col mb-4 justify-center items-center mt-6">
          <div className="flex w-[90%] justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">전시회 리뷰</h2>
            <Link href="/community" className="text-sm text-blue-500 font-medium hover:text-blue-700 transition-colors">
              더보기 &gt;
            </Link>
          </div>
          
          <ReviewCards />
        </div>

        {/* Magazine Section */}
        <div className="w-full flex flex-col mb-4 justify-center items-center mt-6">
          <div className="flex w-[90%] justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">아트 매거진</h2>
            <Link href="/magazineList" className="text-sm text-blue-500 font-medium hover:text-blue-700 transition-colors">
              더보기 &gt;
            </Link>
          </div>
          
          <MagazineCards />
        </div>

        {/* 최신 작품 Section */}
        <div className="w-full flex flex-col mb-4 justify-center items-center mt-6">
          <div className="flex w-[90%] justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">최신 작품</h2>
            <Link href="/artstore/all" className="text-sm text-blue-500 font-medium hover:text-blue-700 transition-colors">
              더보기 &gt;
            </Link>
          </div>
          
          <LatestWorks />
        </div>

        {/* Top of Week Section */}
        <div className="w-full flex flex-col mb-4 justify-center items-center mt-6">
          <div className="flex w-[90%] justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">Top of Week</h2>
            <Link href="/artstore/all" className="text-sm text-blue-500 font-medium hover:text-blue-700 transition-colors">
              더보기 &gt;
            </Link>
          </div>
          
          <TopOfWeek />
        </div>

        {/* 커뮤니티 하이라이트 Section */}
        <div className="w-full flex flex-col mb-4 justify-center items-center mt-6">
          <div className="flex w-[90%] justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">커뮤니티 하이라이트</h2>
            <Link href="/community" className="text-sm text-blue-500 font-medium hover:text-blue-700 transition-colors">
              더보기 &gt;
            </Link>
          </div>
          
          <CommunityHighlights />
        </div>
        
        {/* 매거진과 푸터 사이 넉넉한 흰색 여백 */}
        <div style={{ height: '48px', background: '#fff', width: '100%' }} />
        
        {/* 푸터 */}
        <div className="flex flex-row gap-4 pt-4 pb-[32px] bg-[hsl(0,0%,93%)] w-full justify-center items-center">
          <div className="w-[30%] h-full flex justify-center items-center ">
            <Image
              src="/logo/artandbridge-logo.svg"
              alt="ARTANDBRIDGE"
              width={120}
              height={30}
            />
          </div>
          <div className="w-[70%] h-full text-[6px] flex flex-col justify-center items-start">
            <div className="flex flex-row justify-end w-full gap-x-4 pr-4">
              <div className="cursor-pointer" onClick={termsDisclosure.onOpen}>
                이용약관
              </div>
              <div className="cursor-pointer" onClick={exchangeRefundDisclosure.onOpen}>
                교환 및 반품
              </div>
              <div
                className="cursor-pointer"
                onClick={purchaseNoticeDisclosure.onOpen}
              >
                구매 전 유의사항
              </div>
            </div>
            <div>
              <p>(주) 아트앤브릿지 대표 : 박명서</p>
              <p>
                서울특별시 금천구 가산디지털 1 로 19, 16 층 1609-엘 04호 (가산동,
                대륭테크노타운 18 차 ){" "}
              </p>
              <p>사업자번호 137-87-03464 통신판매업 제2024-서울금천-2468호 </p>
              <p>이메일 support@artandbridge.com / 개인정보보호책임자 : 박명서</p>
              <p>연락처 : 010-8993-0271 </p>
              <p>고객센터,카카오채널 : 아트앤브릿지</p>
            </div>
          </div>
        </div>
        
        {/* 푸터와 하단 네비게이션 사이 넉넉한 여백(흰색) */}
        <div style={{ height: '32px', background: '#fff', width: '100%' }} />
      </div>

      {/* 하단 네비게이션 */}
      <BottomNavigation />
      
      {/* 디버깅용 스크롤 상태 표시 */}
      <div className="fixed top-4 right-4 z-50 bg-black text-white px-2 py-1 rounded text-xs">
        스크롤: {isScrolled ? 'ON' : 'OFF'}
      </div>

      {/* 플로팅 리뷰쓰기 버튼 */}
      <div className="fixed bottom-20 right-4 z-50">
        {isScrolled ? (
          // 스크롤 시 + 모양 (작은 원형)
          <button
            onClick={() => setShowReviewModal(true)}
            className="w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        ) : (
          // 기본 상태 (큰 직사각형)
          <button
            onClick={() => setShowReviewModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-full shadow-lg flex items-center space-x-2 transition-all duration-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="font-medium">리뷰쓰기</span>
            <span className="bg-yellow-400 text-black text-xs px-2 py-1 rounded-full font-bold">100P+</span>
          </button>
        )}
      </div>

      {/* 이용약관 모달 */}
      <Modal
        placement="bottom"
        isOpen={termsDisclosure.isOpen}
        onClose={termsDisclosure.onClose}
      >
        <ModalContent>
          <ModalHeader>이용약관 및 정책</ModalHeader>
          <ModalBody className="max-h-[60vh] overflow-y-auto">
            <div className="text-sm">
              <ol className="pl-2 space-y-4">
                <li>
                  <b>■ 제1조 (목적)</b>
                  <p className="mt-1">
                    이 약관은 [(주) 아트앤브릿지] (이하 "회사"라 합니다)가 운영하는 웹 플랫폼(아트앤브릿지)에서 제공하는 미술 정보 콘텐츠, 작품 등록 서비스 및 전시회 티켓 판매 서비스(이하 "서비스")를 이용함에 있어 회사와 이용자 간의 권리, 의무 및 책임사항 등을 규정함을 목적으로 합니다.
                  </p>
                </li>
                <li>
                  <b>■ 제2조 (정의)</b>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>"회원"이라 함은 이 약관에 동의하고 회사와 이용계약을 체결하여 아이디(ID)를 부여받은 자를 말합니다.</li>
                    <li>"비회원"이라 함은 회원 가입 없이 회사가 제공하는 서비스를 이용하는 자를 말합니다.</li>
                    <li>"작품 등록 서비스"라 함은 이용자가 미술 작품 정보를 플랫폼에 업로드할 수 있도록 회사가 제공하는 기능을 말합니다.</li>
                    <li>"전시 티켓 판매 서비스"라 함은 이용자가 전시회 티켓을 온라인으로 구매할 수 있도록 회사가 제공하는 서비스를 말합니다.</li>
                    <li>"충전 서비스"란 유료 콘텐츠 이용을 위해 이용자가 회사에 선불 방식으로 요금을 결제하는 행위를 말합니다.</li>
                    <li>"작품 등록비"란 회사가 정한 정책에 따라 회원이 유료로 구매하거나 이벤트 등으로 지급받아 플랫폼 내 유료 서비스를 사용하는 데 사용할 수 있는 결제 수단을 말합니다.</li>
                  </ul>
                </li>
                <li>
                  <b>■ 제3조 (약관의 효력 및 변경)</b>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>이 약관은 회사가 웹사이트에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력을 발생합니다.</li>
                    <li>회사는 관련 법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있으며, 개정된 약관은 제1항과 같은 방법으로 공지합니다.</li>
                  </ul>
                </li>
                <li>
                  <b>■ 제4조 (서비스의 제공 및 변경)</b>
                  <ul className="list-decimal pl-5 mt-1 space-y-1">
                    <li>미술 정보 콘텐츠 제공</li>
                    <li>미술 작품 등록 및 열람 기능</li>
                    <li>전시회 티켓 판매 및 예매</li>
                    <li>유료 서비스 및 작품 등록비 충전 기능</li>
                  </ul>
                  <p className="mt-1">회사는 서비스 제공을 위해 정기점검, 시스템 보완 등을 이유로 일정 기간 서비스 제공을 중단할 수 있으며, 이 경우 사전에 공지합니다.</p>
                </li>
                <li>
                  <b>■ 제4-2조 (큐레이션 서비스의 성격 및 범위)</b>
                  <p className="mt-1">회사는 이용자가 등록한 미술 작품을 자체 큐레이션 정책에 따라 검토, 선별 및 배치하는 유료 서비스를 제공합니다(이하 "큐레이션 서비스"). 큐레이션 서비스는 단순한 작품 게재 기능을 넘어서, 다음과 같은 콘텐츠 편집 및 기획 기능을 포함합니다.</p>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>플랫폼 내 주요 영역(메인, 추천섹션, 테마관 등)에의 작품 배치</li>
                    <li>전시 기획 및 작품 분류 큐레이션</li>
                    <li>SNS, 뉴스레터, 배너 등 외부 마케팅 채널에의 노출 기회 제공</li>
                    <li>주간 큐레이터 픽, 전시 리뷰 연동 등 자체 기획 콘텐츠와의 연계</li>
                  </ul>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>큐레이션 서비스는 회사가 직접 제공하는 유료 콘텐츠 편집 및 배치 서비스로 간주되며, 회원은 해당 서비스 이용 시 관련 비용을 납부해야 합니다.</li>
                    <li>큐레이션 서비스의 결제는 서비스 이용 신청 시점에 선결제 방식으로 이루어지며, 이용자는 등록 후 서비스 제공 여부와 무관하게 환불을 요청할 수 없습니다. 단, 회사의 귀책 사유로 인한 미제공의 경우 환불이 가능합니다.</li>
                    <li>회사는 큐레이션 기준 및 노출 방식에 대한 독자적인 판단 권한을 가지며, 회원은 이에 대해 이의를 제기할 수 없습니다.</li>
                  </ul>
                </li>
                <li>
                  <b>■ 제5조 (서비스 제공기간)</b>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>서비스 제공기간은 고객이 결제한 시점부터 실제 서비스가 종료되는 시점까지의 전체 기간(사전 예약 기간 + 실제 서비스 제공 기간)을 의미합니다.</li>
                    <li>서비스 제공기간은 결제일로부터 최대 1개월 이내로 제한되며, 이를 초과하는 경우 가상계좌 결제수단의 이용이 제한될 수 있습니다.</li>
                    <li>서비스 제공기간이 1년을 초과할 경우 토스페이먼츠 등 특정 결제수단의 이용이 제한됩니다. 회사는 해당 사실을 사전에 고지합니다.</li>
                    <li>이용자는 서비스 제공기간 내에 서비스를 이용 완료해야 하며, 기간이 경과된 후에는 서비스 이용이 제한될 수 있습니다.</li>
                  </ul>
                </li>
                <li>
                  <b>■ 제6조 (이용요금 및 결제)</b>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>회사는 유료 서비스에 대해 별도의 요금을 부과하며, 요금은 해당 서비스의 안내 페이지에 명시됩니다.</li>
                    <li>결제는 신용카드, 계좌이체, 간편결제, 가상계좌 등 회사가 제공하는 방법을 통해 이루어집니다.</li>
                    <li>환불은 회사의 환불정책에 따릅니다.</li>
                  </ul>
                </li>
                <li>
                  <b>■ 제7조 (작품 등록비 결제 및 환불 정책)</b>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>회원은 회사가 제공하는 결제 수단을 이용하여 작품 등록비를 충전하고, 해당 등록비로 유료 콘텐츠 및 서비스를 구매할 수 있습니다.</li>
                    <li>작품 등록비는 개인 간 양도가 불가능하며, 회원 본인만 사용 가능합니다.</li>
                    <li>회원은 등록비 구매 후 미사용 금액에 한하여 구매일로부터 정해진 기간 내에 결제취소 및 환불을 요청할 수 있습니다. 환불은 구매 시 사용한 결제수단으로만 진행됩니다.</li>
                    <li>이미 사용한 등록비는 원칙적으로 환불이 불가능합니다.</li>
                    <li>회사의 귀책사유로 인해 결제오류가 발생했거나, 서비스 제공이 불가능하거나 중단된 경우, 회원은 해당 결제 건에 대해 환불을 요구할 수 있습니다.</li>
                    <li>환불 시점에 따라 결제금액의 일부가 공제되거나 환불이 제한될 수 있으며, 이는 관련 법령 및 회사 정책에 따릅니다.</li>
                  </ul>
                </li>
                <li>
                  <b>■ 제8조 (티켓 구매 및 환불 정책)</b>
                  <ol className="list-decimal pl-5 mt-1 space-y-1">
                    <li>이용자는 회사 플랫폼을 통해 미술관, 전시회, 예술 공연 등의 티켓을 구매할 수 있으며, 결제 완료 시점에 해당 티켓의 전자 이용권 또는 확인번호가 발급됩니다.</li>
                    <li>티켓의 유효 기간, 사용 조건, 관람 가능 시간 등은 각 전시나 공연 주최 측의 정책을 따르며, 회사는 이를 사전에 명시하거나 상품 상세 페이지에 고지합니다.</li>
                    <li>티켓 환불은 전시 시작일 기준 7일 전까지 요청 시에만 가능하며, 전액 환불됩니다. 단, 관람일 기준 6일 전부터는 환불이 불가합니다.<br />예시) 전시 시작일이 6월 20일일 경우, 6월 13일 23:59까지 취소 시에만 환불 가능.</li>
                    <li>
                      다음의 경우에도 환불이 불가능합니다.
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        <li>전시 시작일 기준 6일 이내에 구매된 티켓</li>
                        <li>전시 당일 이후의 취소 요청</li>
                        <li>관람 당일의 무단 미입장</li>
                        <li>개인 착오(날짜/시간/장소 오기입 포함), 교통 또는 기타 외부 요인에 의한 관람 불가</li>
                      </ul>
                    </li>
                    <li>날짜 및 시간 변경은 전시 시작일 기준 7일 전까지 1회에 한하여 가능하며, 예매자 본인의 요청으로만 처리됩니다. 타인 명의로의 변경은 허용되지 않습니다.</li>
                    <li>환불 신청은 [마이페이지 - 고객센터] 또는 카카오채널 '아트앤브릿지'를 통해 접수 가능하며, 결제 수단에 따라 영업일 기준 3~7일 내 환불 처리됩니다. 단, 신용카드 결제의 경우 카드사 사정에 따라 환불 시점이 상이할 수 있습니다.</li>
                    <li>본 조항은 "전자상거래 등에서의 소비자 보호에 관한 법률" 제17조 제2항 및 같은 법 시행령 제21조에 근거하여, 공연/전시 등 특정 일시가 정해진 서비스에 해당하므로, 회사는 개별적인 환불 기준을 정하고 이를 명확히 고지하며 이에 따른 운영을 합니다.</li>
                    <li>위 환불 정책은 "교환 및 환불 안내" 별도 항목에도 고지되며, 이용자는 서비스 이용 전 해당 내용을 숙지해야 할 책임이 있습니다.</li>
                  </ol>
                </li>
                <li>
                  <b>■ 제9조 (법적 효력 강화를 위한 고지 및 이용자 책임)</b>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>본 플랫폼의 티켓 예매 서비스는 "전자상거래 등에서의 소비자보호에 관한 법률" 제17조 제2항 제5호에 따라, 공연·전시 등 특정 일시에 제공되는 서비스로서 청약철회가 제한됩니다.</li>
                    <li>회원은 환불 불가 조건에 대해 충분히 인지하고 예매를 진행해야 하며, 동의 여부는 결제 시점에 시스템상 별도 확인 절차를 통해 확보됩니다.</li>
                    <li>회사는 티켓 구매 및 환불 조건, 전시 주최 측 정책을 사전에 고지하며, 이용자는 이를 숙지할 의무가 있습니다.</li>
                  </ul>
                </li>
                <li>
                  <b>■ 제10조 (면책 조항)</b>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>회사는 이용자의 귀책사유로 인한 서비스 이용 장애에 대해 책임을 지지 않습니다.</li>
                    <li>회사는 천재지변, 전시 주최 측의 사정, 기술적 장애 등으로 인한 서비스 중단에 대해서는 사전 고지 후 책임을 면합니다.</li>
                  </ul>
                </li>
                <li>
                  <b>■ 제11조 (분쟁 해결 및 관할)</b>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>회사는 이용자의 정당한 이의제기를 신속히 처리하기 위해 고객센터 및 공식 연락채널을 운영합니다.</li>
                    <li>분쟁 발생 시, 회사와 이용자는 원활한 해결을 위해 성실히 협의하며, 협의가 어려운 경우 민사소송법에 따라 이용자의 주소지를 우선 관할로 하되, 주소 불분명 시 회사 본사 소재지를 관할하는 법원으로 합니다.</li>
                  </ul>
                </li>
              </ol>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onPress={termsDisclosure.onClose}>
              닫기
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 교환 및 반품 모달 */}
      <Modal
        placement="bottom"
        isOpen={exchangeRefundDisclosure.isOpen}
        onClose={exchangeRefundDisclosure.onClose}
      >
        <ModalContent>
          <ModalHeader>교환 및 환불 안내</ModalHeader>
          <ModalBody className="max-h-[60vh] overflow-y-auto">
            <div className="text-sm">
              <ul className="list-disc pl-5 space-y-3">
                <li>
                  <b>1. 환불 가능 기간 및 기준</b>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>관람일 7일 전(포함)까지 취소 요청 시: 전액 환불</li>
                    <li>관람일 6일 전 ~ 당일 및 이후 취소 시: 환불 불가</li>
                    <li>단, 예매일과 전시/공연일 사이가 7일 미만일 경우, 예매 즉시 환불 불가 규정이 적용됩니다.<br />예시: 전시일이 6월 21~22일이며, 6월 20일 예매 시 환불은 불가합니다.</li>
                  </ul>
                </li>
                <li>
                  <b>2. 환불 수수료</b>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>관람일 7일 전까지: 100% 환불</li>
                    <li>관람일 6일 전부터 당일 및 이후: 환불 불가</li>
                  </ul>
                </li>
                <li>
                  <b>3. 교환 및 일정 변경</b>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>관람일 7일 전(포함)까지, 1회에 한하여 날짜 및 시간 변경 가능</li>
                    <li>변경 요청은 예매자 본인에 한하여 가능하며, 타인 명의로의 양도·변경은 불가</li>
                    <li>일정 변경은 고객센터 또는 카카오채널 '아트앤브릿지'를 통해 접수해야 합니다</li>
                  </ul>
                </li>
                <li>
                  <b>4. 환불 신청 방법</b>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>마이페이지 내 고객센터 또는 카카오채널 '아트앤브릿지'로 접수</li>
                    <li>결제 수단에 따라 영업일 기준 3~7일 내 환불 처리</li>
                    <li>신용카드 결제 시, 카드사 정책에 따라 환불 시점은 상이할 수 있음</li>
                  </ul>
                </li>
                <li>
                  <b>5. 환불 불가 항목 (아래 사유는 환불 사유로 인정되지 않음)</b>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>관람일 6일 전부터 당일 이후의 취소 요청</li>
                    <li>예매자의 착오 (관람 날짜·시간 착오 포함)</li>
                    <li>개인 사정(출장, 건강, 교통 문제 등)</li>
                    <li>무단 미입장</li>
                    <li>현장 방문 후 단순 변심</li>
                    <li>기상 악화, 질병 등의 외부 요인(단, 천재지변 등 예외 사유는 내부 운영 기준에 따름)</li>
                    <li>이벤트 등을 통해 무료로 지급된 티켓은, 티켓 금액이 표시되어 있더라도 실제 결제가 이루어지지 않았기 때문에 환불 및 취소가 불가합니다.<br />이는 당첨자 또는 제공 대상자에게 무상으로 지급된 혜택으로 간주되며, 유료 서비스가 아니므로 '전자상거래법'상 청약철회 대상에 해당하지 않습니다.</li>
                  </ul>
                </li>
                <li>
                  <b>6. 예외적 환불 가능 사유</b>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>입원 등 긴급 의료 사유 (의사의 진단서 또는 입원확인서 제출)</li>
                    <li>직계가족의 사망 (사망진단서 및 가족관계증명서)</li>
                    <li>국가적 재난에 따른 이동 제한 명령 등</li>
                  </ul>
                  <p className="mt-1">단, 주최 측의 판단에 따라 전액/일부 환불 또는 거절될 수 있습니다.</p>
                </li>
                <li>
                  <b>7. 법률 고지 및 분쟁 예방 안내</b>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>본 티켓은 '전자상거래법 제17조 제2항 3호' 및 '소비자분쟁해결기준'의 "공연, 전시 등 특정 일시에 제공되는 서비스"로 분류되어, 청약철회가 제한될 수 있습니다.</li>
                    <li>예매자는 본 규정에 동의함으로써, 청약철회 불가 조건 및 환불 불가 항목에 대해 충분히 안내받았음을 인정합니다.</li>
                    <li>모든 분쟁은 대한민국 민법 및 소비자보호 관련 법령에 따라 해결되며, 주최 측과의 사전 조율 및 협의가 우선됩니다.</li>
                  </ul>
                  <p className="mt-1">✅ 문의 및 요청: 고객센터 또는 카카오톡 채널 '아트앤브릿지'</p>
                </li>
              </ul>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onPress={exchangeRefundDisclosure.onClose}>
              닫기
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 구매 전 유의사항 모달 */}
      <Modal
        isOpen={purchaseNoticeDisclosure.isOpen}
        onClose={purchaseNoticeDisclosure.onClose}
      >
        <ModalContent>
          <ModalHeader>티켓 구매 전 주의사항</ModalHeader>
          <ModalBody>
            <div className="text-sm">
              <ol className="list-decimal pl-5 space-y-2 mb-6">
                <li>
                  본 티켓은 전시 관람을 위한 입장권으로, 지정된 날짜 및 시간에만
                  유효합니다.
                </li>
                <li>티켓은 1인 1매 기준이며, 중복 사용이 불가능합니다.</li>
                <li>
                  전시 관람 시, 티켓과 함께 신분증(또는 QR코드)을 제시하셔야
                  입장 가능합니다.
                </li>
                <li>
                  전시 관람 중 사진 촬영은 허용되나, 플래시/삼각대/영상촬영은
                  금지되어 있습니다.
                </li>
                <li>
                  전시 특성상 소음, 통화, 음식물 반입 등은 제한될 수 있으니 양해
                  부탁드립니다.
                </li>
                <li>
                  주최 측의 사정에 따라 사전 공지 없이 일부 작품이 변경되거나
                  관람이 제한될 수 있습니다.
                </li>
                <li>
                  본 플랫폼은 티켓 예매 및 결제 시스템만을 제공하며, 전시 내용
                  및 운영은 주최 측의 책임 하에 진행됩니다.
                </li>
              </ol>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onPress={purchaseNoticeDisclosure.onClose}>
              닫기
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 알림 모달 */}
      <Modal
        isOpen={notificationDisclosure.isOpen}
        onClose={notificationDisclosure.onClose}
        size="lg"
      >
        <ModalContent>
          <ModalHeader className="flex justify-between items-center">
            <span>알림</span>
            {unreadCount > 0 && (
              <Button
                size="sm"
                color="primary"
                variant="light"
                onPress={markAllAsRead}
              >
                모두 읽음
              </Button>
            )}
          </ModalHeader>
          <ModalBody className="max-h-[60vh] overflow-y-auto">
            {notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border ${
                      notification.isRead 
                        ? 'bg-gray-50 border-gray-200' 
                        : 'bg-blue-50 border-blue-200'
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className={`font-medium text-sm ${
                          notification.isRead ? 'text-gray-700' : 'text-blue-900'
                        }`}>
                          {notification.title}
                        </h4>
                        <p className={`text-xs mt-1 ${
                          notification.isRead ? 'text-gray-500' : 'text-blue-700'
                        }`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">
                          {notification.time}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FiBell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>알림이 없습니다</p>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onPress={notificationDisclosure.onClose}>
              닫기
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 리뷰쓰기 모달 */}
      <Modal
        placement="center"
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        size="full"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center">
              <button
                onClick={() => setShowReviewModal(false)}
                className="mr-3 p-1 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-lg font-bold">전시회 검색</h2>
            </div>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              {/* 검색바 */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="전시회를 검색해보세요"
                  className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* 전시회 목록 */}
              <div className="space-y-3">
                {[
                  {
                    id: 1,
                    title: "PROTOTYPE - OKSEUNG CHEOL",
                    venue: "롯데뮤지엄 오브 아트",
                    dates: "2025-08-15 ~ 2025-10-28",
                    image: "/images/noimage.jpg"
                  },
                  {
                    id: 2,
                    title: "모던 아트 컬렉션",
                    venue: "국립현대미술관",
                    dates: "2025-09-01 ~ 2025-11-30",
                    image: "/images/noimage.jpg"
                  },
                  {
                    id: 3,
                    title: "디지털 아트 페스티벌",
                    venue: "서울아트센터",
                    dates: "2025-12-01 ~ 2025-12-31",
                    image: "/images/noimage.jpg"
                  },
                  {
                    id: 4,
                    title: "Unfinished @ Studio Urban",
                    venue: "Studio Urban",
                    dates: "2025-10-15 ~ 2025-12-31",
                    image: "/images/noimage.jpg"
                  }
                ].map((exhibition) => (
                  <div key={exhibition.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0">
                      <Image
                        src={exhibition.image}
                        alt={exhibition.title}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">
                        {exhibition.title}
                      </h3>
                      <p className="text-xs text-gray-600 mb-1">{exhibition.venue}</p>
                      <p className="text-xs text-gray-500">{exhibition.dates}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* 빈 상태 메시지 */}
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">방문한 전시가 없었나요?</p>
                <button className="border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                  새롭게 등록하기
                </button>
              </div>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}