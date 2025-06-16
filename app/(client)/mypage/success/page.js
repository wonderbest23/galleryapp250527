"use client";
import React, { useEffect, useState } from "react";
import { ExhibitionCards } from "./components/BookmarkedExhibition";
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
} from "@heroui/react";
import { FaChevronLeft, FaFileContract, FaCheckCircle, FaClock } from "react-icons/fa";
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
import { MdCircleNotifications } from "react-icons/md";
import Link from "next/link";
import { useUserStore } from "@/stores/userStore";

const Success = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const [loading, setLoading] = useState(true);
  const [policy, setPolicy] = useState(null);
  const [customerService, setCustomerService] = useState(null);
  const [title, setTitle] = useState(null);
  const [content, setContent] = useState(null);
  const [selectedModal, setSelectedModal] = useState(null);
  const [selectedTab, setSelectedTab] = useState("favorite");
  const [selectedGalleryTab, setSelectedGalleryTab] = useState("recommended");
  const [isArtist, setIsArtist] = useState(false);
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [alarmExhibition, setAlarmExhibition] = useState(null);

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
      } catch (error) {
        console.error("사용자 정보를 가져오는 중 오류가 발생했습니다:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router, setUser]);

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

  // 작가 인증 계정이면 자동으로 [나의작품] 탭으로 이동
  useEffect(() => {
    if (profile && isArtist && profile.isArtistApproval && selectedTab !== "myArt") {
      setSelectedTab("myArt");
    }
  }, [profile, isArtist]);

  console.log("policy", policy);
  console.log("customerService", customerService);
  console.log("isArtist", isArtist);

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

  // 개인정보 처리방침 내용 최신화
  const privacyPolicy = `
    <h3>■ 제1조 (개인정보 수집 항목 및 수집 방법)</h3>
    <p>회사는 회원가입 및 카카오 로그인 연동을 통해 다음과 같은 개인정보를 수집합니다.</p>
    <ol>
      <li><b>필수 수집 항목 (회원가입 시 수집)</b>
        <ul>
          <li>이메일 주소</li>
          <li>카카오계정 식별자(UID)</li>
          <li>닉네임</li>
          <li>프로필 이미지</li>
          <li>이름</li>
          <li>성별</li>
          <li>출생연도</li>
          <li>카카오계정 전화번호</li>
        </ul>
        <p>※ 위 항목은 회원가입 시점에 이용자 동의를 통해 수집되며, 서비스 제공을 위한 최소한의 정보입니다.</p>
      </li>
      <li><b>선택 수집 항목 (서비스 이용 중 추가 수집될 수 있음)</b>
        <ul>
          <li>생년월일</li>
          <li>휴대폰 번호</li>
          <li>관심 전시/작품 분야</li>
        </ul>
      </li>
      <li><b>수집 방법</b>
        <ul>
          <li>카카오 로그인 연동 시 API를 통해 자동 수집</li>
          <li>홈페이지 회원가입 양식 작성 시</li>
          <li>서비스 이용 중 이용자 자발적 입력</li>
        </ul>
      </li>
    </ol>
    <h3>■ 제2조 (개인정보 수집 및 이용 목적)</h3>
    <p>회사는 수집한 개인정보를 다음 목적에 따라 이용합니다.</p>
    <ol>
      <li><b>회원관리</b>
        <ul>
          <li>회원가입 의사 확인 및 본인 확인</li>
          <li>부정이용 방지 및 이용자 식별</li>
        </ul>
      </li>
      <li><b>기본 서비스 제공</b>
        <ul>
          <li>전시 예약, 티켓 발급 등 기본 기능 제공</li>
          <li>전시 관람 정보 기록 및 조회 기능</li>
        </ul>
      </li>
      <li><b>맞춤형 콘텐츠 및 알림 서비스</b>
        <p>※ 아래 항목은 이용자 선택 동의 시 별도로 수집 및 활용됩니다.</p>
        <ul>
          <li>성별, 출생연도 기반 관심 전시 추천</li>
          <li>카카오 메시지를 통한 전시 알림, 티켓 관련 안내</li>
          <li>구매 이력 기반 전시 추천 및 알림 발송</li>
          <li>이벤트 정보 제공 및 마케팅 메시지 발송</li>
        </ul>
      </li>
    </ol>
    <h3>■ 제3조 (개인정보 제3자 제공)</h3>
    <p>회사는 원칙적으로 이용자의 사전 동의 없이 개인정보를 외부에 제공하지 않으며, 다음의 경우 예외로 합니다.</p>
    <ul>
      <li>법령에 근거한 요청이 있을 경우</li>
      <li>이용자가 사전에 명시적으로 동의한 경우</li>
    </ul>
    <h3>■ 제4조 (개인정보 보유 및 이용기간)</h3>
    <p>수집된 개인정보는 회원 탈퇴 시 또는 수집 목적 달성 시까지 보관하며, 관련 법령에 따라 아래와 같이 예외적으로 보관할 수 있습니다.</p>
    <ul>
      <li>계약 및 청약철회 기록: 5년</li>
      <li>결제 및 재화 제공 기록: 5년</li>
      <li>소비자 불만 또는 분쟁처리 기록: 3년</li>
    </ul>
    <h3>■ 제5조 (개인정보 처리 위탁)</h3>
    <p>회사는 서비스 운영을 위해 다음과 같이 개인정보 처리 업무를 외부에 위탁할 수 있습니다.</p>
    <ul>
      <li>카카오(주): 카카오 로그인 및 메시지 API</li>
      <li>Supabase Inc.: 사용자 데이터베이스 및 인증 관리</li>
      <li>Amazon Web Services: 클라우드 서버 운영 및 백업</li>
    </ul>
    <h3>■ 제6조 (이용자의 권리 및 행사 방법)</h3>
    <p>이용자는 언제든지 자신의 개인정보를 조회하거나 수정할 수 있으며, 회원 탈퇴 및 개인정보 삭제를 요청할 수 있습니다.<br />권리 행사는 이메일 또는 고객센터를 통해 가능합니다.</p>
    <h3>■ 제7조 (쿠키의 설치 및 거부)</h3>
    <p>회사는 서비스 개선을 위해 쿠키를 사용할 수 있으며, 이용자는 브라우저 설정을 통해 이를 거부할 수 있습니다.</p>
    <h3>■ 제8조 (개인정보 보호책임자)</h3>
    <ul>
      <li>성명: 김주홍</li>
      <li>이메일: support@artandbridge.com</li>
      <li>담당 업무: 개인정보 보호 및 민원 처리</li>
    </ul>
    <h3>■ 부칙</h3>
    <p>본 개인정보 처리방침은 2025년 6월 13일부터 시행됩니다.</p>
  `;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen w-full">
        <Spinner variant="wave" color="primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center ">
      <div className="bg-white flex items-center w-[90%] justify-between">
        <Button
          isIconOnly
          variant="light"
          className="mr-2"
          onPress={() => router.push("/")}
        >
          <FaArrowLeft className="text-xl" />
        </Button>
        <h2 className="text-lg font-bold text-center flex-grow">마이페이지</h2>
        <div className="w-10"></div>
      </div>
      <div className="w-full h-auto flex justify-center items-center my-6 flex-col gap-y-4">
        <div className="w-24 h-24 flex justify-center items-center bg-black rounded-full relative overflow-hidden">
          {(isArtist && profile?.isArtistApproval && profile?.avatar_url) ? (
            <Image
              src={profile.avatar_url}
              alt="프로필 이미지"
              fill
              className="rounded-full object-cover"
            />
          ) : (
            user?.user_metadata?.avatar_url && (
              <Image
                src={user.user_metadata.avatar_url}
                alt="프로필 이미지"
                fill
                className="rounded-full object-cover"
              />
            )
          )}
        </div>
        <div className="text-lg font-bold flex flex-col justify-center items-center">
          <div className="flex flex-row items-center gap-x-2 text-[#0B437E]">
            {(isArtist && profile?.isArtistApproval && profile?.artist_name)
              ? profile.artist_name
              : (user?.user_metadata?.full_name || user?.email || "사용자")}
          </div>
          <div className="flex flex-row items-center text-sm justify-center gap-x-1 mt-2">
            {isArtist ? (
              profile?.isArtistApproval === false ? (
                <button
                  className="px-4 py-2 rounded-lg border border-yellow-400 bg-yellow-50 text-yellow-700 font-semibold flex items-center gap-2 cursor-not-allowed select-none"
                  type="button"
                  disabled
                >
                  <FaClock className="text-yellow-500 text-sm animate-pulse" /> 승인 대기중
                </button>
              ) : (
                <button
                  className="px-4 py-2 rounded-lg border border-blue-500 bg-blue-50 text-blue-700 font-semibold flex items-center gap-2 shadow-sm hover:bg-blue-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-300"
              onClick={() => router.push("/register")}
                  type="button"
                >
                  <FaCheckCircle className="text-blue-500 text-sm" /> 작가 정보 수정하기
                </button>
              )
            ) : (
              <button
                className="px-4 py-2 rounded-lg border border-gray-400 bg-white text-gray-700 font-semibold flex items-center gap-2 shadow-sm hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                onClick={() => router.push("/register")}
                type="button"
              >
                작가 등록하기 <FaChevronRight className="text-sm" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 첫 번째 커스텀 탭바 */}
      <div className="flex flex-row w-[90%] border-t border-gray-200 mb-2 justify-center items-center">
        <div className="w-[5%]"></div>
        <div className={`flex w-full${!isArtist ? ' justify-center' : ''}`}>
          <button
            className={`text-[12px] flex-1 py-3 text-center font-medium ${selectedTab === "favorite" ? "border-t-4 border-black text-black" : "text-gray-500"}`}
            onClick={() => setSelectedTab("favorite")}
          >
            즐겨찾기
          </button>
          <button
            className={`text-[12px] flex-1 py-3 text-center font-medium ${selectedTab === "review" ? "border-t-4 border-black text-black" : "text-gray-500"}`}
            onClick={() => setSelectedTab("review")}
          >
            리뷰
          </button>
          <button
            className={`text-[12px] flex-1 py-3 text-center font-medium ${selectedTab === "message" ? "border-t-4 border-black text-black" : "text-gray-500"}`}
            onClick={() => setSelectedTab("message")}
          >
            메시지
          </button>
          <button
            className={`text-[12px] flex-1 py-3 text-center font-medium ${selectedTab === "order" ? "border-t-4 border-black text-black" : "text-gray-500"}`}
            onClick={() => setSelectedTab("order")}
          >
            주문내역
          </button>
          {isArtist && (
            <button
              className={`text-[12px] flex-1 py-3 text-center font-medium ${selectedTab === "myArt" ? "border-t-4 border-black text-black" : "text-gray-500"}`}
              onClick={() => setSelectedTab("myArt")}
            >
              나의 작품
            </button>
          )}
        </div>
        <div className="w-[5%]"></div>
      </div>

      {/* 즐겨찾기 탭 상단 알림 영역 */}
      {selectedTab === "favorite" && notifications.length > 0 && alarmExhibition && (
        <div className="w-full flex flex-col items-center justify-center mb-4">
          <div className="relative flex flex-col items-center justify-center w-full max-w-md mx-auto">
            <div
              className="w-full bg-yellow-100 border border-yellow-300 rounded-lg p-3 flex flex-col gap-2 items-center justify-center cursor-pointer transition hover:bg-yellow-200"
              onClick={async () => {
                if (!notifications[0]) return;
                await createClient().from("notification").delete().eq("id", notifications[0].id);
                setNotifications([]);
                setAlarmExhibition(null);
                window.location.href = `/exhibition/${alarmExhibition.id}`;
              }}
            >
              <div className="flex items-center gap-2 text-yellow-700 font-semibold justify-center">
                <MdCircleNotifications className="text-xl" />
                {notifications[0].message}
              </div>
              <div className="flex flex-col items-center gap-2 mt-2">
                <img src={alarmExhibition.photo} alt="전시회 이미지" className="w-20 h-20 rounded-md object-cover mx-auto" />
                <div className="flex flex-col items-center">
                  <span className="font-bold text-black text-center">{alarmExhibition.contents}</span>
                  <span className="text-xs text-gray-500 text-center">{alarmExhibition.start_date} ~ {alarmExhibition.end_date}</span>
                </div>
              </div>
            </div>
            {/* X 버튼 */}
            <button
              onClick={handleDeleteAlarm}
              className="absolute left-2 bottom-2 bg-white border border-gray-300 rounded-full w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-200 z-10"
              title="알림 닫기"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="w-full px-2 flex justify-center items-center">
        {selectedTab === "favorite" && <BookmarkedExhibition user={user} alarmExhibition={alarmExhibition} />}
        {selectedTab === "review" && <Reviews user={user} />}
        {selectedTab === "message" && <Messages user={user} />}
        {selectedTab === "order" && <OrderHistory user={user} />}
        {isArtist && selectedTab === "myArt" && <MyArtworks user={user} profile={profile} />}
      </div>

      {/* 북마크 없음 안내와 하단 메뉴 사이에 여백 추가 */}
      <div className="h-6" />

      <div className="w-full h-auto flex justify-center items-center flex-col gap-y-4 mb-24 px-4">
        <div
          onClick={() => {
            setSelectedModal("policy");
            onOpen();
          }}
          className="flex items-center gap-x-2 w-full cursor-pointer"
        >
          <FaFileContract className="text-gray-600" size={20} />
          <span>이용약관 및 정책</span>
        </div>
        <Divider></Divider>
        <div
          className="flex items-center gap-x-2 w-full cursor-pointer"
          onClick={() => {
            router.push("http://pf.kakao.com/_sBnXn/chat");
          }}
        >
          <BiSupport className="text-gray-600" size={20} />
          <span>고객센터</span>
        </div>
        <Divider></Divider>
        <div
          className="flex items-center gap-x-2 w-full cursor-pointer"
          onClick={handleLogout}
        >
          <FiLogOut className="text-gray-600" size={20} />
          <span>로그아웃</span>
        </div>
        <span
          className="text-xs text-gray-500 underline cursor-pointer text-center mt-2"
          onClick={() => {
            setTitle("개인정보 처리방침");
            setContent(privacyPolicy);
            onOpen();
          }}
        >
          개인정보 처리방침
        </span>
      </div>
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
    </div>
  );
};

export default Success;
