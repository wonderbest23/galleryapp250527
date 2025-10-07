"use client";
import React, { useEffect, useState } from "react";
import { ExhibitionCards } from "./components/BookmarkedExhibition";
import JournalistModal from "./components/JournalistModal";
import {
  Tabs,
  Tab,
  Button,
  Select,
  SelectItem,
  Divider,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Input,
  Textarea,
} from "@heroui/react";
import { 
  ChevronRight, Gift, Ticket, LogOut, Award, 
  Palette, CheckCircle, Clock, Shield, MessageCircle, 
  Bell, HelpCircle, ShoppingCart, PenTool, Heart, User 
} from 'lucide-react';
import { FaChevronLeft, FaFileContract, FaCheckCircle, FaClock, FaUserSlash, FaPlus, FaPlusSquare } from "react-icons/fa";
import { BiSupport } from "react-icons/bi";
import { FiLogOut } from "react-icons/fi";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import BookmarkedExhibition from "./components/BookmarkedExhibition";
import Reviews from "./components/Reviews";
import OrderHistory from "./components/OrderHistory";
import GalleryCards from "./components/gallery-cards";
import { FaArrowLeft } from "react-icons/fa";
import { FaChevronRight } from "react-icons/fa";
import MyArtworks from "./components/MyArtworks";
import Messages from "./components/Messages";
import RewardShopPopup from "./components/RewardShopPopup";
import RewardBenefitsPopup from "./components/RewardBenefitsPopup";
import NewMessages from "./components/NewMessages";
import BookmarkedExhibitionPopup from "./components/BookmarkedExhibitionPopup";
import ReviewsPopup from "./components/ReviewsPopup";
import MessagesPopup from "./components/MessagesPopup";
import JournalistApplicationPopup from "./components/JournalistApplicationPopup";
import AnnouncementsPopup from "./components/AnnouncementsPopup";
import { MdCircleNotifications } from "react-icons/md";
import Link from "next/link";
import { useUserStore } from "@/stores/userStore";
import { useDisclosure as useDisclosure2 } from "@heroui/react";

const Success = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { isOpen: isRejectOpen, onOpen: openReject, onOpenChange: onRejectChange } = useDisclosure();
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const [loading, setLoading] = useState(true);
  const [policy, setPolicy] = useState(null);
  const [customerService, setCustomerService] = useState(null);
  const [title, setTitle] = useState(null);
  const [content, setContent] = useState(null);
  const [selectedModal, setSelectedModal] = useState(null);
  const [selectedTab, setSelectedTab] = useState(null); // null로 변경 (초기에는 아무것도 선택 안됨)
  const [showJournalistModal, setShowJournalistModal] = useState(false);
  const [showBookmarkedExhibition, setShowBookmarkedExhibition] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [showJournalistApplication, setShowJournalistApplication] = useState(false);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [selectedGalleryTab, setSelectedGalleryTab] = useState("recommended");
  const [isArtist, setIsArtist] = useState(false);
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [rejectReason, setRejectReason] = useState("");
  const [alarmExhibition, setAlarmExhibition] = useState(null);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [requestTitle, setRequestTitle] = useState("");
  const [requestContent, setRequestContent] = useState("");
  
  // 각 탭별 모달 상태
  const [isFavoriteOpen, setIsFavoriteOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [isMyArtOpen, setIsMyArtOpen] = useState(false);
  const [isRewardShopOpen, setIsRewardShopOpen] = useState(false);
  const [isRewardBenefitsOpen, setIsRewardBenefitsOpen] = useState(false);
  const [isJournalistOpen, setIsJournalistOpen] = useState(false);
  const [isAnnouncementsOpen, setIsAnnouncementsOpen] = useState(false);
  const [userPoints, setUserPoints] = useState(0);

  // 포인트 상태 조회
  const [pointStatus, setPointStatus] = useState({
    total_points: 0,
    available_points: 0,
    locked_points: 0,
    grade: 'bronze',
    exchange_points: 1500,
    next_unlock: null
  });

  const getPolicy = async () => {
    const supabase = createClient();
    const { data, error } = await supabase.from("policy").select("*");
    if (error) {
      console.error("정책 정보를 가져오는 중 오류가 발생했습니다:", error);
    }

    if (data && data.length > 0) {
      const policyData = data.find((item) => item.title === "이용약관");
      const csData = data.find((item) => item.title === "고객센터");

      setPolicy(policyData);
      setCustomerService(csData);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (!user) {
          const { data: { user: fetchedUser }, error } = await createClient().auth.getUser();
          if (error || !fetchedUser) {
            router.push("/mypage");
            setLoading(false);
            return;
          }
          setUser(fetchedUser);
        }
        const currentUser = user || (await createClient().auth.getUser()).data.user;
        if (currentUser) {
          const { data: profileData } = await createClient()
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();  
          if (profileData) {
            setIsArtist(profileData.isArtist);
            setProfile(profileData);

            // 반려 상태 확인 → 경고 후 재등록 페이지로 이동
            if (profileData.is_artist_rejected) {
              setRejectReason(profileData.reject_reason || "작가 신청이 반려되었습니다. 정보를 수정해 다시 신청해 주세요.");
          }

          // 알림 불러오기
          const { data: notiData } = await createClient()
            .from("notification")
            .select("*")
            .eq("user_id", currentUser.id)
            .order("created_at", { ascending: false })
            .limit(1);
          setNotifications(notiData || []);
          // 전시회 정보도 함께 조회
          if (notiData && notiData.length > 0) {
            const { data: exhibition } = await createClient()
              .from("exhibition")
              .select("*, gallery(*)")
              .eq("id", notiData[0].exhibition_id)
              .single();
            setAlarmExhibition(exhibition);
            }
          } else {
            router.push("/mypage");
          }
        } else {
          router.push("/mypage");
        }
      } catch (error) {
        console.error("사용자 정보를 가져오는 중 오류가 발생했습니다:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router, setUser]);

  // 사용 가능한 티켓이 있으면 자동으로 주문내역 탭으로 이동
  useEffect(() => {
    const checkAvailableTickets = async () => {
      if (!user) return;
      const supabase = createClient();
      const { data: tickets, error } = await supabase
        .from('payment_ticket')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'success');
      if (!error && tickets && tickets.length > 0) {
        setSelectedTab('order');
      }
    };
    checkAvailableTickets();
  }, [user]);

  useEffect(() => {
    if (selectedModal === "policy") {
      setTitle(policy?.title);
      setContent(policy?.content);
    }
    if (selectedModal === "customerService") {
      setTitle(customerService?.title);
      setContent(customerService?.content);
    }
  }, [selectedModal, policy, customerService]);

  useEffect(() => {
    getPolicy();
  }, []);

  useEffect(() => {
    const fetchPointStatus = async () => {
      try {
        const response = await fetch('/api/points/status');
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setPointStatus(data.data);
            setUserPoints(data.data.available_points || 0);
            
            // 등급 자동 업데이트 로직 (DB에 grade 컬럼 추가됨)
            const totalPoints = data.data.available_points + data.data.locked_points;
            const reviewCount = Math.floor(totalPoints / 500);
            
            // 등급 기준에 따른 자동 등급 업데이트
            let newGrade = data.data.grade;
            if (reviewCount >= 25) {
              newGrade = 'platinum';
            } else if (reviewCount >= 10) {
              newGrade = 'gold';
            } else if (reviewCount >= 3) {
              newGrade = 'silver';
            } else {
              newGrade = 'bronze';
            }
            
            // 등급이 변경된 경우 프로필 업데이트
            if (newGrade !== data.data.grade) {
              console.log(`등급 업데이트 필요: ${data.data.grade} → ${newGrade} (리뷰 ${reviewCount}개)`);
              
              try {
                const supabase = createClient();
                const { error } = await supabase
                  .from('profiles')
                  .update({ grade: newGrade })
                  .eq('id', user.id);
                
                if (error) {
                  console.error('등급 업데이트 오류:', error);
                } else {
                  // 상태 업데이트
                  setPointStatus(prev => ({ ...prev, grade: newGrade }));
                  console.log(`등급 업데이트 완료: ${data.data.grade} → ${newGrade}`);
                  
                  // 사용자에게 알림
                  alert(`축하합니다! ${newGrade === 'silver' ? '실버' : newGrade === 'gold' ? '골드' : newGrade === 'platinum' ? '플래티넘' : '브론즈'} 등급으로 승급되었습니다!`);
                  
                  // 페이지 새로고침으로 등급 변경사항 반영
                  setTimeout(() => {
                    window.location.reload();
                  }, 2000);
                }
              } catch (error) {
                console.error('등급 업데이트 중 오류:', error);
              }
            }
            
            console.log('포인트 상태 로드 완료:', {
              grade: data.data.grade,
              totalPoints: data.data.available_points + data.data.locked_points,
              reviewCount: Math.floor((data.data.available_points + data.data.locked_points) / 500)
            });
          }
        }
      } catch (error) {
        console.error('포인트 상태 조회 오류:', error);
      }
    };

    if (user) {
      fetchPointStatus();
    }
  }, [user]);


  // 작가 인증 계정이면 자동으로 [나의작품] 탭으로 이동
  useEffect(() => {
    if (profile && isArtist && profile.isArtistApproval && selectedTab !== "myArt") {
      setSelectedTab("myArt");
    }
  }, [profile, isArtist]);

  // console.log("policy", policy);
  // console.log("customerService", customerService);
  // console.log("isArtist", isArtist);

  const handleLogout = async () => {
    try {
      // 카카오 로그아웃 확인
      if (window.Kakao && window.Kakao.Auth.getAccessToken()) {
        if (!window.Kakao.isInitialized()) {
          window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_APP_KEY);
        }
        window.Kakao.Auth.logout(() => {
          console.log("카카오 로그아웃 완료");
        });
      }

      // Supabase 로그아웃
      await createClient().auth.signOut();
      setUser(null); // 상태 초기화
      window.location.href = "/"; // 강제 새로고침
    } catch (error) {
      console.error("로그아웃 중 오류가 발생했습니다:", error);
    }
  };

  const handleDeleteAlarm = async () => {
    if (!notifications[0]) return;
    await createClient().from("notification").delete().eq("id", notifications[0].id);
    setNotifications([]);
    setAlarmExhibition(null);
  };

  // 카카오 연결 해제 및 로그아웃
  const handleWithdraw = async () => {
    setWithdrawLoading(true);
    try {
      // 카카오 연결 해제
      if (window.Kakao && window.Kakao.Auth.getAccessToken()) {
        if (!window.Kakao.isInitialized()) {
          window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_APP_KEY);
        }
        await new Promise((resolve, reject) => {
          window.Kakao.API.request({
            url: '/v1/user/unlink',
            success: function(res) { resolve(res); },
            fail: function(err) { reject(err); }
          });
        });
      }
      // Supabase 로그아웃
      await createClient().auth.signOut();
      setUser(null);
      window.location.href = "/";
    } catch (error) {
      alert("탈퇴 처리 중 오류가 발생했습니다. 다시 시도해 주세요.");
      console.log(error);
    } finally {
      setWithdrawLoading(false);
      setIsWithdrawOpen(false);
    }
  };

  const handleSubmitRequest = async () => {
    if(!requestTitle.trim()) { alert("전시회명을 입력해주세요"); return; }
    const supabase = createClient();
    // 오늘 00:00 기준 ISO
    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);
    const { count, error: cntErr } = await supabase
      .from('exhibition_request')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user?.id)
      .gte('created_at', todayStart.toISOString());
    if (cntErr) { console.log(cntErr); alert('요청 확인 중 오류가 발생했습니다'); return; }
    if ((count || 0) >= 10) { alert('하루 최대 10건까지 요청할 수 있습니다. 내일 다시 시도해주세요.'); return; }

    await supabase.from('exhibition_request').insert({
      user_id: user?.id,
      title: requestTitle.trim(),
      content: requestContent.trim(),
    });
    setIsRequestOpen(false);
    setRequestTitle("");
    setRequestContent("");
    alert("등록 요청이 접수되었습니다!");
  };

  // 개인정보 처리방침 내용 최신화
  const privacyPolicy = `
    <h3>■ 제1조 (개인정보 수집 항목 및 수집 방법)</h3>
    <p>회사는 카카오 로그인을 통해 회원가입 시 다음과 같은 개인정보를 수집합니다.</p>
    <ul>
      <li><b>필수 항목:</b> 전화번호 (카카오 계정 기반)</li>
      <li><b>선택 항목:</b> 이름, 성별, 출생연도</li>
    </ul>
    <p>※ 위 항목은 카카오 로그인 시 이용자의 동의를 통해 회원가입 시점에 수집되며,<br />서비스 제공 및 본인 확인, 주요 안내 메시지 발송 등을 위해 사용됩니다.</p>
    <p>또한, 서비스 이용 중에는 아래와 같은 정보가 자발적으로 추가 수집될 수 있습니다:</p>
    <ul>
      <li>관심 전시 분야, 구매 이력, 사용자 리뷰, 문의 응답 등</li>
    </ul>
    <p>개인정보는 아래 방법으로 수집됩니다:</p>
    <ul>
      <li>카카오 로그인 연동 시 자동 수집</li>
      <li>서비스 이용 중 사용자의 자발적 입력</li>
    </ul>
    <h3>■ 제2조 (개인정보 수집 및 이용 목적)</h3>
    <p>회사는 수집한 개인정보를 다음 목적을 위해 활용합니다.</p>
    <ul>
      <li>회원 가입 및 본인 확인</li>
      <li>전시 티켓 예매, 예약 확인 등 서비스 제공</li>
      <li>카카오 알림톡 또는 문자 등을 통한 필수 안내 메시지 발송</li>
      <li>서비스 품질 향상 및 고객 응대</li>
      <li>관련 법령에 따른 기록 보존</li>
    </ul>
    <h3>■ 제3조 (개인정보 제3자 제공)</h3>
    <p>회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다.<br />단, 다음의 경우는 예외로 합니다.</p>
    <ul>
      <li>이용자가 사전에 명시적으로 동의한 경우</li>
      <li>관계 법령에 따라 제출 의무가 있는 경우</li>
    </ul>
    <h3>■ 제4조 (개인정보 보유 및 이용기간)</h3>
    <p>회사는 수집한 개인정보를 목적 달성 후 즉시 파기하며,<br />관련 법령에 따라 아래와 같이 일정 기간 보관할 수 있습니다:</p>
    <table border="1" cellpadding="4" style="border-collapse:collapse; margin:10px 0;">
      <thead><tr><th>보존 항목</th><th>보유 기간</th><th>관련 법령</th></tr></thead>
      <tbody>
        <tr><td>계약 및 청약철회 기록</td><td>5년</td><td>전자상거래법</td></tr>
        <tr><td>결제 및 재화 공급 기록</td><td>5년</td><td>전자상거래법</td></tr>
        <tr><td>소비자 불만 및 분쟁처리 기록</td><td>3년</td><td>전자상거래법</td></tr>
      </tbody>
    </table>
    <h3>■ 제5조 (개인정보 처리 위탁)</h3>
    <p>회사는 원활한 서비스 운영을 위해 아래와 같이 개인정보 처리를 위탁할 수 있습니다.</p>
    <table border="1" cellpadding="4" style="border-collapse:collapse; margin:10px 0;">
      <thead><tr><th>수탁자</th><th>위탁 업무 내용</th></tr></thead>
      <tbody>
        <tr><td>카카오(주)</td><td>로그인 및 메시지 발송 API 연동</td></tr>
        <tr><td>Supabase Inc.</td><td>사용자 데이터베이스 저장 및 인증 처리</td></tr>
        <tr><td>Amazon Web Services</td><td>클라우드 인프라 및 데이터 백업 운영</td></tr>
      </tbody>
    </table>
    <p>※ 회사는 위탁 시 관련 법령에 따라 개인정보 보호를 위한 계약을 체결하고 관리·감독을 수행합니다.</p>
    <h3>■ 제6조 (이용자의 권리와 행사 방법)</h3>
    <p>이용자는 언제든지 본인의 개인정보에 대해 열람, 정정, 삭제를 요청할 수 있으며,<br />회원 탈퇴를 통해 수집 및 이용 동의를 철회할 수 있습니다.</p>
    <ul>
      <li>연락처: support@artandbridge.com</li>
      <li>고객센터 또는 마이페이지를 통해 요청 가능</li>
    </ul>
    <h3>■ 제7조 (개인정보 자동 수집 장치의 설치 및 거부)</h3>
    <p>회사는 이용자 맞춤형 서비스 제공을 위해 쿠키를 사용할 수 있습니다.<br />이용자는 브라우저 설정을 통해 쿠키 저장을 거부하거나 삭제할 수 있습니다.</p>
    <h3>■ 제8조 (개인정보 보호책임자)</h3>
    <ul>
                      <li>성명: 박명서</li>
      <li>이메일: support@artandbridge.com</li>
      <li>담당 업무: 개인정보 보호 및 관련 민원 응대</li>
    </ul>
    <h3>■ 부칙</h3>
    <p>이 개인정보처리방침은 2025년 6월 13일부터 시행됩니다.</p>
  `;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen w-full">
        <Spinner variant="wave" color="primary" />
      </div>
    );
  }


  // 등급 정보 계산 (실제 리뷰 수 기반)
  const getGradeInfo = () => {
    const grade = pointStatus.grade;
    const totalPoints = pointStatus.available_points + pointStatus.locked_points;
    const reviewCount = Math.floor(totalPoints / 500); // 리뷰당 500P
    
    // 등급별 기준 리뷰 수
    const gradeRequirements = {
      bronze: 0,
      silver: 3,
      gold: 10,
      platinum: 25
    };
    
    // 현재 등급의 기준 리뷰 수
    const currentGradeRequirement = gradeRequirements[grade] || 0;
    
    // 다음 등급까지 필요한 리뷰 수
    const getNextGradeRequirement = (currentGrade) => {
      switch (currentGrade) {
        case 'bronze': return gradeRequirements.silver;
        case 'silver': return gradeRequirements.gold;
        case 'gold': return gradeRequirements.platinum;
        default: return gradeRequirements.platinum;
      }
    };
    
    const nextGradeRequirement = getNextGradeRequirement(grade);
    const remainingReviews = Math.max(0, nextGradeRequirement - reviewCount);
    
    // 진행률 계산 (현재 등급 내에서의 진행률)
    let progress = 0;
    let nextGoal = '';
    
    switch (grade) {
      case 'platinum':
        progress = 100;
        nextGoal = '최고 등급입니다';
        break;
      case 'gold':
        // 골드 등급에서 플래티넘까지의 진행률 (10~25개 리뷰)
        const goldProgress = Math.min(100, Math.round((reviewCount - gradeRequirements.gold) / (gradeRequirements.platinum - gradeRequirements.gold) * 100));
        progress = Math.max(0, goldProgress);
        nextGoal = `플래티넘 등급까지 ${remainingReviews}개 이상의 리뷰가 필요합니다`;
        break;
      case 'silver':
        // 실버 등급에서 골드까지의 진행률 (3~10개 리뷰)
        const silverProgress = Math.min(100, Math.round((reviewCount - gradeRequirements.silver) / (gradeRequirements.gold - gradeRequirements.silver) * 100));
        progress = Math.max(0, silverProgress);
        nextGoal = `골드 등급까지 ${remainingReviews}개 이상의 리뷰가 필요합니다`;
        break;
      default: // bronze
        // 브론즈 등급에서 실버까지의 진행률 (0~3개 리뷰)
        const bronzeProgress = Math.min(100, Math.round(reviewCount / gradeRequirements.silver * 100));
        progress = Math.max(0, bronzeProgress);
        nextGoal = `실버 등급까지 ${remainingReviews}개 이상의 리뷰가 필요합니다`;
        break;
    }
    
    // 등급별 색상 및 교환 포인트
    const gradeConfig = {
      platinum: { color: 'text-blue-300', exchangePoints: 1200 },
      gold: { color: 'text-yellow-400', exchangePoints: 1300 },
      silver: { color: 'text-gray-400', exchangePoints: 1400 },
      bronze: { color: 'text-yellow-600', exchangePoints: 1500 }
    };
    
    const config = gradeConfig[grade] || gradeConfig.bronze;
    
    return {
      label: grade === 'bronze' ? '브론즈' : grade === 'silver' ? '실버' : grade === 'gold' ? '골드' : '플래티넘',
      color: config.color,
      progress: Math.max(0, progress),
      nextGoal,
      exchangePoints: config.exchangePoints,
      reviewCount,
      remainingReviews
    };
  };
  
  const gradeInfo = getGradeInfo();
  
  // 디버깅용 로그
  console.log('등급 정보 디버깅:', {
    grade: pointStatus.grade,
    totalPoints: pointStatus.available_points + pointStatus.locked_points,
    reviewCount: gradeInfo.reviewCount,
    progress: gradeInfo.progress,
    nextGoal: gradeInfo.nextGoal,
    remainingReviews: gradeInfo.remainingReviews,
    gradeRequirements: {
      bronze: 0,
      silver: 3,
      gold: 10,
      platinum: 25
    }
  });

  return (
    <div className="bg-gray-100 min-h-screen pb-20">
      
      {/* ==================== 홍보 헤더 - 기자단 승인 계정은 기자단 전용 버튼 표시 ==================== */}
      {profile?.is_journalist_approved ? (
        <header className="bg-gradient-to-r from-purple-500 to-pink-600 px-4 py-4 sticky top-0 z-10 shadow-sm">
          <div className="text-center">
            <button
              onClick={() => setShowJournalistModal(true)}
              className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-6 py-3 text-white font-semibold hover:bg-white/30 transition-all duration-300 shadow-lg"
            >
              <div className="flex items-center gap-2">
                <PenTool className="w-5 h-5" />
                <span>기자단 전용 페이지</span>
              </div>
            </button>
            <p className="text-purple-100 text-xs mt-2">기자단 전용 기능을 이용해보세요</p>
          </div>
        </header>
      ) : (
        <header className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-4 sticky top-0 z-10 shadow-sm">
          <div className="text-center">
            <h1 className="text-lg font-bold text-white mb-1">전시회 리뷰쓰고 전시티켓 구매하기!</h1>
            <p className="text-blue-100 text-xs">아트앤브릿지에서 즐기는 예술 여행</p>
          </div>
        </header>
      )}

      {/* ==================== 프로필 카드 ==================== */}
      <div className="bg-white rounded-2xl p-6 mx-4 mt-4 border border-gray-100 shadow-sm">
        
        {/* 프로필 정보 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* 프로필 이미지 */}
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center shadow-lg">
                {(() => {
                  const raw = (isArtist && profile?.isArtistApproval && profile?.avatar_url)
                    ? profile.avatar_url
                    : (user?.user_metadata?.picture || user?.user_metadata?.avatar_url);
                  if(!raw) {
                    return <span className="text-3xl font-bold text-gray-600">👤</span>;
                  }
                  const safeSrc = raw.startsWith('http://')
                    ? raw.replace('http://', 'https://')
                    : (raw.startsWith('//') ? `https:${raw}` : raw);
                  return <img src={safeSrc} alt="프로필" className="w-full h-full object-cover" />;
                })()}
              </div>
              
              {/* 상태 배지 */}
              {(isArtist && profile?.isArtistApproval) && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-md">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            
            {/* 이름 + 배지 */}
            <div className="flex-1">
              <div className="flex items-center mb-2 gap-3 overflow-hidden">
                {(() => {
                  const displayName = user?.user_metadata?.full_name || user?.email || "사용자";
                  const len = (displayName || '').length;
                  // 길이에 따른 폰트 크기 스케일 조정 (더 공격적으로 축소)
                  const sizeClass = len > 32 ? 'text-base' : len > 24 ? 'text-lg' : len > 16 ? 'text-xl' : 'text-2xl';
                  return (
                    <div className="min-w-0 max-w-[50%] sm:max-w-[60%]">
                      <h2 className={`${sizeClass} font-bold text-gray-900 truncate`}>{displayName}</h2>
                    </div>
                  );
                })()}
                
                {/* 배지들 */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* 작가 배지 */}
                  {isArtist && profile?.isArtistApproval && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      인증 작가
                    </span>
                  )}

                  {/* 기자단 배지 */}
                  {profile?.is_journalist && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      기자단
                    </span>
                  )}
                  
                  {/* 승인 대기중 배지 */}
                  {isArtist && !profile?.isArtistApproval && !profile?.is_artist_rejected && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border border-yellow-200 whitespace-nowrap">
                      <Clock className="w-3 h-3 mr-1" />
                      승인 대기중
                    </span>
                  )}
                  
                  {/* 작가 재등록 필요 배지 */}
                  {isArtist && profile?.is_artist_rejected && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">
                      <Clock className="w-3 h-3 mr-1" />
                      재등록 필요
                    </span>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>
          
          {/* 설정 버튼 */}
          <button 
            onClick={() => router.push('/mypage/settings')}
            className="p-3 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <User className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* ==================== 포인트/등급 카드 ==================== */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200 mt-6">
          
          {/* 등급 + 포인트 헤더 */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 bg-gradient-to-br ${gradeInfo.color.includes('yellow') ? 'from-yellow-400 to-orange-500' : gradeInfo.color.includes('gray') ? 'from-gray-400 to-gray-500' : gradeInfo.color.includes('purple') ? 'from-purple-400 to-purple-500' : 'from-orange-400 to-orange-500'} rounded-2xl flex items-center justify-center shadow-lg`}>
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{gradeInfo.label}</h3>
                <p className="text-sm text-gray-600">멤버십 등급</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">P</span>
                </div>
                <div className="flex flex-col justify-center h-12">
                  <div className="text-3xl font-bold text-gray-900 leading-none mb-1 pt-3">
                    {pointStatus.available_points.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">사용 가능</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 포인트 상세 정보 */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-blue-100">
              <div className="text-sm text-gray-500 mb-1">총 포인트</div>
              <div className="text-lg font-bold text-gray-900">{(pointStatus.available_points + pointStatus.locked_points).toLocaleString()}P</div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-blue-100">
              <div className="text-sm text-gray-500 mb-1">검토 필요</div>
              <div className="text-lg font-bold text-blue-600">{pointStatus.locked_points.toLocaleString()}P</div>
            </div>
          </div>
          
          {/* 프로그레스 바 */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">등급 진행률</span>
              <span className="text-sm font-bold text-blue-600">{gradeInfo.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${gradeInfo.progress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-600 mt-2 text-center">
              {gradeInfo.nextGoal}
            </p>
            <div className="text-xs text-gray-500 mt-1 text-center">
              현재 리뷰 수: {gradeInfo.reviewCount}개
            </div>
          </div>
          
          {/* 다음 해제 시간 */}
          {pointStatus.next_unlock && (
            <div className="bg-white/80 rounded-xl p-4 border border-blue-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-700">다음 해제:</span>
                <span className="text-sm font-medium text-blue-600">
                  {new Date(pointStatus.next_unlock).toLocaleString('ko-KR', { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>


      {/* ==================== 통합 메뉴 영역 ==================== */}
      <div className="px-4 space-y-4 mt-6">
        
        {/* 주요 기능 그리드 */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">주요 기능</h3>
          <div className="grid grid-cols-2 gap-4 justify-items-start -ml-2">
            
            {/* 즐겨찾기 */}
            <button
              onClick={() => setIsFavoriteOpen(true)}
              className="w-full flex items-center gap-4 pl-3 pr-4 py-4 rounded-xl hover:bg-red-50 hover:border-red-200 border border-transparent transition-all duration-200 hover:-translate-y-1 justify-start"
            >
              <div className="icon-48 w-12 h-12 bg-gradient-to-br from-red-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                <Heart className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <div className="text-gray-900 font-semibold whitespace-nowrap">즐겨찾기</div>
                <div className="text-xs text-gray-500 whitespace-nowrap">저장한 전시회</div>
              </div>
            </button>
            
            {/* 나의 예매 */}
            <button 
              onClick={() => setIsOrderOpen(true)}
              className="w-full flex items-center gap-4 pl-3 pr-4 py-4 rounded-xl hover:bg-orange-50 hover:border-orange-200 border border-transparent transition-all duration-200 hover:-translate-y-1 justify-start"
            >
              <div className="icon-48 w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                <Ticket className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <div className="text-gray-900 font-semibold whitespace-nowrap">나의 예매</div>
                <div className="text-xs text-gray-500 whitespace-nowrap">예매 내역 확인</div>
              </div>
            </button>
            
            {/* 리뷰 */}
            <button
              onClick={() => setIsReviewOpen(true)}
              className="w-full flex items-center gap-4 pl-3 pr-4 py-4 rounded-xl hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-all duration-200 hover:-translate-y-1 justify-start"
            >
              <div className="icon-48 w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                <MessageCircle className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <div className="text-gray-900 font-semibold whitespace-nowrap">리뷰</div>
                <div className="text-xs text-gray-500 whitespace-nowrap">작성한 리뷰</div>
              </div>
            </button>
            
            {/* 메시지 */}
            <button
              onClick={() => setIsMessageOpen(true)}
              className="w-full flex items-center gap-4 pl-3 pr-4 py-4 rounded-xl hover:bg-green-50 hover:border-green-200 border border-transparent transition-all duration-200 hover:-translate-y-1 justify-start"
            >
              <div className="icon-48 w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                <MessageCircle className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <div className="text-gray-900 font-semibold whitespace-nowrap">메시지</div>
                <div className="text-xs text-gray-500 whitespace-nowrap">받은 메시지</div>
              </div>
            </button>
          </div>
        </div>

        {/* 리워드 섹션 */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">리워드</h3>
          <div className="grid grid-cols-2 gap-4 justify-items-start -ml-2">
            
            {/* 리워드샵 */}
            <button 
              onClick={() => setIsRewardShopOpen(true)}
              className="w-full flex items-center gap-4 pl-3 pr-4 py-4 rounded-xl hover:bg-purple-50 hover:border-purple-200 border border-transparent transition-all duration-200 hover:-translate-y-1 justify-start"
            >
              <div className="icon-48 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                <ShoppingCart className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <div className="text-gray-900 font-semibold whitespace-nowrap">리워드샵</div>
                <div className="text-xs text-gray-500 whitespace-nowrap">포인트로 구매</div>
              </div>
            </button>
            
            {/* 리워드 혜택 */}
            <button 
              onClick={() => setIsRewardBenefitsOpen(true)}
              className="w-full flex items-center gap-4 pl-3 pr-4 py-4 rounded-xl hover:bg-yellow-50 hover:border-yellow-200 border border-transparent transition-all duration-200 hover:-translate-y-1 justify-start"
            >
              <div className="icon-48 w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Gift className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <div className="text-gray-900 font-semibold whitespace-nowrap">리워드 혜택</div>
                <div className="text-xs text-gray-500 whitespace-nowrap">등급별 혜택</div>
              </div>
            </button>
          </div>
        </div>

        {/* 특별 활동 섹션 */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">특별 활동</h3>
          <div className="grid grid-cols-2 gap-4 justify-items-start -ml-2">
            
            {/* 기자단 신청 */}
            <button 
              onClick={() => setIsJournalistOpen(true)}
              className="w-full flex items-center gap-4 pl-3 pr-4 py-4 rounded-xl hover:bg-purple-50 hover:border-purple-200 border border-transparent transition-all duration-200 hover:-translate-y-1 justify-start"
            >
              <div className="icon-48 w-12 h-12 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                <PenTool className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <div className="text-gray-900 font-semibold whitespace-nowrap">기자단 신청</div>
                <div className="text-xs text-gray-500 whitespace-nowrap">아트 기자단 활동</div>
              </div>
            </button>
            
            {/* 나의 작품 (인증 작가만) */}
            {isArtist && profile?.isArtistApproval && (
              <button
                onClick={() => setIsMyArtOpen(true)}
                className="w-full flex items-center gap-4 pl-3 pr-4 py-4 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 border border-transparent transition-all duration-200 hover:-translate-y-1 justify-start"
              >
                <div className="icon-48 w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Palette className="w-7 h-7 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-gray-900 font-semibold whitespace-nowrap">나의 작품</div>
                  <div className="text-xs text-gray-500 whitespace-nowrap">등록한 작품 관리</div>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* ==================== 설정 및 도움말 ==================== */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">설정 및 도움말</h3>
          <div className="space-y-3 -ml-2">
            
            {/* 작가 등록/재등록 (작가 미등록 또는 재등록 필요 시) */}
            {(!isArtist || profile?.is_artist_rejected) && (
              <button
                onClick={() => profile?.is_artist_rejected ? openReject() : router.push("/register")}
                className="w-full flex items-center gap-4 pl-3 pr-4 py-4 rounded-xl hover:bg-orange-50 hover:border-orange-200 border border-transparent transition-all duration-200"
              >
                <div className={`w-10 h-10 bg-gradient-to-br ${profile?.is_artist_rejected ? 'from-orange-400 to-red-500' : 'from-blue-400 to-indigo-500'} rounded-xl flex items-center justify-center shadow-lg`}>
                  <PenTool className="w-5 h-5 text-white" />
                </div>
                <div className="text-left flex-1">
                  <div className="text-gray-900 font-semibold whitespace-nowrap">
                    {profile?.is_artist_rejected ? '작가 재등록' : '작가 등록하기'}
                  </div>
                  <div className="text-xs text-gray-500 whitespace-nowrap">
                    {profile?.is_artist_rejected ? '작가 정보를 다시 등록해주세요' : '작가로 활동을 시작해보세요'}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            )}
            
            {/* 작가 정보 수정 (승인된 작가만) */}
            {isArtist && profile?.isArtistApproval && (
              <button
                onClick={() => router.push('/register')}
                className="w-full flex items-center gap-4 pl-3 pr-4 py-4 rounded-xl hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-all duration-200"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="text-left flex-1">
                  <div className="text-gray-900 font-semibold whitespace-nowrap">작가 정보 수정</div>
                  <div className="text-xs text-gray-500 whitespace-nowrap">작가 프로필 정보 수정</div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            )}
            
            {/* 고객센터 */}
            <a 
              href="http://pf.kakao.com/_sBnXn" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full flex items-center gap-4 pl-3 pr-4 py-4 rounded-xl hover:bg-green-50 hover:border-green-200 border border-transparent transition-all duration-200"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <div className="text-left flex-1">
                <div className="text-gray-900 font-semibold whitespace-nowrap">고객센터</div>
                <div className="text-xs text-gray-500 whitespace-nowrap">카카오톡으로 문의하기</div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </a>
            
            {/* 공지사항 */}
            <button 
              onClick={() => setIsAnnouncementsOpen(true)}
              className="w-full flex items-center gap-4 pl-3 pr-4 py-4 rounded-xl hover:bg-yellow-50 hover:border-yellow-200 border border-transparent transition-all duration-200"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div className="text-left flex-1">
                <div className="text-gray-900 font-semibold whitespace-nowrap">공지사항</div>
                <div className="text-xs text-gray-500 whitespace-nowrap">최신 소식 및 업데이트</div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </button>
            
            {/* 관리자 페이지 (관리자만) */}
            {user && profile?.role === 'admin' && (
              <Link href="/admin" className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-blue-50 hover:border-blue-200 border border-transparent transition-all duration-200">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div className="text-left flex-1">
                  <div className="text-gray-900 font-semibold whitespace-nowrap">관리자 페이지</div>
                  <div className="text-xs text-gray-500 whitespace-nowrap">시스템 관리 및 설정</div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
            )}
          </div>
        </div>
        
        {/* ==================== 하단 액션 버튼 ==================== */}
        <div className="flex gap-3 pt-4 pb-8">
          <button 
            onClick={() => {
              setTitle("개인정보 처리방침");
              setContent(privacyPolicy);
              onOpen();
            }}
            className="flex-1 py-3 text-sm text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors font-medium border border-gray-200 whitespace-nowrap"
          >
            개인정보 처리방침
          </button>
          <button 
            onClick={() => setIsWithdrawOpen(true)}
            className="flex-1 py-3 text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors font-medium border border-gray-200 whitespace-nowrap"
          >
            회원 탈퇴
          </button>
        </div>
      </div>

      {/* ==================== 각 탭별 모달 ==================== */}
      
      {/* 즐겨찾기 팝업 */}
      <BookmarkedExhibitionPopup 
        isOpen={isFavoriteOpen} 
        onClose={() => setIsFavoriteOpen(false)}
        user={user}
        alarmExhibition={alarmExhibition}
      />

      {/* 리뷰 팝업 */}
      <ReviewsPopup 
        isOpen={isReviewOpen} 
        onClose={() => setIsReviewOpen(false)}
        user={user}
      />

      {/* 메시지 팝업 */}
      <MessagesPopup 
        isOpen={isMessageOpen} 
        onClose={() => setIsMessageOpen(false)}
        user={user}
      />

      {/* 나의 예매 팝업 */}
      {isOrderOpen && <OrderHistory user={user} onClose={() => setIsOrderOpen(false)} />}

      {/* 나의 작품 팝업 */}
      {isArtist && profile?.isArtistApproval && isMyArtOpen && <MyArtworks user={user} profile={profile} onClose={() => setIsMyArtOpen(false)} />}

      {/* 리워드샵 팝업 */}
      <RewardShopPopup 
        isOpen={isRewardShopOpen} 
        onClose={() => setIsRewardShopOpen(false)}
        userPoints={userPoints}
        onPurchaseComplete={async () => {
          // 포인트 상태 새로고침
          try {
            const response = await fetch('/api/points/status');
            if (response.ok) {
              const data = await response.json();
              if (data.success) {
                setPointStatus(data.data);
                setUserPoints(data.data.available_points || 0);
              }
            }
          } catch (error) {
            console.error('포인트 상태 조회 오류:', error);
          }
        }}
      />

      {/* 리워드 혜택 팝업 */}
      <RewardBenefitsPopup 
        isOpen={isRewardBenefitsOpen} 
        onClose={() => setIsRewardBenefitsOpen(false)}
      />

      {/* ==================== 모달들 ==================== */}
      
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">{title}</ModalHeader>
              <ModalBody className="max-h-[80vh] overflow-y-auto">
                <div
                  className="text-sm"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </ModalBody>
              <ModalFooter>
                <Button color="primary" onPress={onClose}>
                  확인
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      {/* 탈퇴 동의 모달 */}
      <Modal isOpen={isWithdrawOpen} onOpenChange={setIsWithdrawOpen}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-red-600">정말 탈퇴하시겠습니까?</ModalHeader>
              <ModalBody>
                <div className="text-sm text-gray-700">
                  탈퇴 시 모든 정보가 즉시 삭제되며, 카카오 계정 연동도 해제됩니다.<br/>
                  <span className="text-red-500 font-bold">이 작업은 되돌릴 수 없습니다.</span>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" isLoading={withdrawLoading} onPress={handleWithdraw}>
                  동의하고 탈퇴
                </Button>
                <Button color="default" onPress={onClose} disabled={withdrawLoading}>
                  취소
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={isRejectOpen} onOpenChange={onRejectChange} placement="center">
        <ModalContent>
          {(onClose)=>(<>
            <ModalHeader>작가 등록 전 꼭 확인해주세요</ModalHeader>
            <ModalBody>
              <p className="whitespace-pre-wrap text-sm text-gray-700">{rejectReason}</p>
            </ModalBody>
            <ModalFooter>
              <Button color="primary" onPress={()=>{ onClose(); router.push('/register'); }}>확인</Button>
            </ModalFooter>
          </>)}
        </ModalContent>
      </Modal>

      {/* 전시 등록 요청 모달 */}
      <Modal isOpen={isRequestOpen} onOpenChange={setIsRequestOpen} placement="center">
        <ModalContent>
          {(onClose)=>(<>
            <ModalHeader>전시회 등록 요청</ModalHeader>
            <ModalBody className="flex flex-col gap-4">
              <Input label="전시회명" value={requestTitle} onChange={(e)=>setRequestTitle(e.target.value)} required />
              <Textarea label="내용(선택)" value={requestContent} onChange={(e)=>setRequestContent(e.target.value)} rows={4} />
            </ModalBody>
            <ModalFooter>
              <Button color="primary" onPress={handleSubmitRequest}>제출</Button>
              <Button onPress={onClose}>취소</Button>
            </ModalFooter>
          </>)}
        </ModalContent>
      </Modal>

      {/* 기자단 신청 팝업 */}
      <JournalistApplicationPopup 
        isOpen={isJournalistOpen} 
        onClose={() => setIsJournalistOpen(false)}
      />

      {/* 공지사항 팝업 */}
      <AnnouncementsPopup 
        isOpen={isAnnouncementsOpen} 
        onClose={() => setIsAnnouncementsOpen(false)}
      />

      {/* 기자단 전용 모달 */}
      <JournalistModal 
        isOpen={showJournalistModal} 
        onClose={() => setShowJournalistModal(false)}
      />
    </div>
  );
};

export default Success;
