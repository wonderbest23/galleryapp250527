"use client";
import Hero from "@/components/hero";
import ConnectSupabaseSteps from "@/components/tutorial/connect-supabase-steps";
import SignUpUserSteps from "@/components/tutorial/sign-up-user-steps";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { ExhibitionCarousel } from "./components/exhibition-carousel";
import { CategoryButtons } from "./components/category-buttons";
import { ExhibitionCards } from "./components/exhibition-cards";
import { GallerySection } from "./components/gallery-section";
import { MagazineCarousel } from "./components/magazine-carousel";
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
import { useEffect, useState } from "react";
import GalleryCards from "./components/gallery-cards";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import { FiPlus, FiMinus } from "react-icons/fi";
import Artists from "./components/Artists";
export default function Home() {
  const [exhibitionCategory, setExhibitionCategory] = useState("all");
  const [selectedTab, setSelectedTab] = useState("recommended");
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const exchangeRefundDisclosure = useDisclosure();
  const purchaseNoticeDisclosure = useDisclosure();
  const termsDisclosure = useDisclosure();
  const [ticketCount, setTicketCount] = useState(1);
  const [ticketPrice, setTicketPrice] = useState(15000); // 기본 티켓 가격
  const supabase = createClient();

  // 티켓 수량 증가
  const increaseTicket = () => {
    if (ticketCount < 10) {
      // 최대 10매로 제한
      setTicketCount(ticketCount + 1);
    }
  };

  // 티켓 수량 감소
  const decreaseTicket = () => {
    if (ticketCount > 1) {
      // 최소 1매로 제한
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
  }, []);
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
    <div className="flex flex-col gap-3 justify-center items-center w-full">
      {/* Banner Carousel */}
      <ExhibitionCarousel user={user} />

      {/* Category Buttons */}
      <CategoryButtons />

      {/* Exhibition Tabs */}
      <div className="w-full flex flex-col mb-4 justify-center items-center mt-4">
        <div className="flex w-[90%] border-t border-gray-200 mb-2">
          <div className="w-1/6"></div>
          <div className="flex w-2/3">
            <button
              className={`text-[12px] flex-1 py-3 text-center font-medium ${exhibitionCategory === "all" ? "border-t-4 border-black text-black" : "text-gray-500"}`}
              onClick={() => setExhibitionCategory("all")}
            >
              전체전시
            </button>
            <button
              className={`text-[12px] flex-1 py-3 text-center font-medium ${exhibitionCategory === "free" ? "border-t-4 border-black text-black" : "text-gray-500"}`}
              onClick={() => setExhibitionCategory("free")}
            >
              무료전시
            </button>
            <button
              className={`text-[12px] flex-1 py-3 text-center font-medium ${exhibitionCategory === "recommended" ? "border-t-4 border-black text-black" : "text-gray-500"}`}
              onClick={() => setExhibitionCategory("recommended")}
            >
              추천전시
            </button>
          </div>
          <div className="w-1/6"></div>
        </div>

        <ExhibitionCards exhibitionCategory={exhibitionCategory} user={user} />
      </div>

      {/* Gallery Section */}
      <div className="w-full flex flex-col mb-4 justify-center items-center">
        <div className="flex w-[90%] border-t border-gray-200 mb-2">
          <div className="w-1/6"></div>
          <div className="flex w-2/3">
            <button
              className={`text-[12px] flex-1 py-3 text-center font-medium ${selectedTab === "recommended" ? "border-t-4 border-black text-black" : "text-gray-500"}`}
              onClick={() => setSelectedTab("recommended")}
            >
              추천갤러리
            </button>
            <button
              className={`text-[12px] flex-1 py-3 text-center font-medium ${selectedTab === "new" ? "border-t-4 border-black text-black" : "text-gray-500"}`}
              onClick={() => setSelectedTab("new")}
            >
              신규갤러리
            </button>
            <button
              className={`text-[12px] flex-1 py-3 text-center font-medium ${selectedTab === "now" ? "border-t-4 border-black text-black" : "text-gray-500"}`}
              onClick={() => setSelectedTab("now")}
            >
              전시갤러리
            </button>
          </div>
          <div className="w-1/6"></div>
        </div>

        <GalleryCards selectedTab={selectedTab} user={user} />
      </div>

      <Artists />

      {/* Magazine Section */}
      <MagazineCarousel />
      <div className="flex flex-row gap-4 pt-4 pb-[80px] bg-[hsl(0,0%,93%)] w-full justify-center items-center">
        <div className="w-[30%] h-full flex justify-center items-center ">
          <Image
            src="/logo/logomain.png"
            alt="logo"
            width={37}
            height={37}
          />
        </div>
        <div className="w-[70%] h-full text-[6px] flex flex-col justify-center items-start">
          <div className="flex flex-row justify-end w-full gap-x-4 pr-4">
            <div className="cursor-pointer" onClick={termsDisclosure.onOpen}>
              이용약관
            </div>
            <div
              className="cursor-pointer"
              onClick={() => alert(`교환 및 환불 규정 (전시/공연 관람권)\n\n본 규정은 『전자상거래 등에서의 소비자보호에 관한 법률』, 『공연법』, 『공연관람표 표준약관(공정거래위원회 제10023호)』 및 관련 지침을 준수하여 작성되었습니다. 예매 전 반드시 아래 내용을 숙지하시기 바랍니다.\n\n1. 환불 가능 기간 및 기준\n관람일 7일 전(포함)까지 취소 요청 시: 전액 환불\n\n관람일 6일 전 ~ 당일 및 이후 취소 시: 환불 불가\n\n단, 예매일과 전시/공연일 사이가 7일 미만일 경우, 예매 즉시 환불 불가 규정이 적용됩니다.\n예시: 전시일이 6월 21~22일이며, 6월 20일 예매 시 환불은 불가합니다.\n\n2. 환불 수수료\n관람일 7일 전까지: 100% 환불 (수수료 없음)\n\n관람일 6일 전부터 당일 및 이후: 환불 불가\n\n3. 교환 및 일정 변경\n관람일 7일 전(포함)까지, 1회에 한하여 날짜 및 시간 변경 가능\n\n변경 요청은 예매자 본인에 한하여 가능하며, 타인 명의로의 양도·변경은 불가\n\n일정 변경은 고객센터 또는 카카오채널 '아트앤브릿지'를 통해 접수해야 합니다\n\n4. 환불 신청 방법\n마이페이지 내 고객센터 또는 카카오채널 '아트앤브릿지'로 접수\n\n결제 수단에 따라 영업일 기준 3~7일 내 환불 처리\n\n신용카드 결제 시, 카드사 정책에 따라 환불 시점은 상이할 수 있음\n\n5. 환불 불가 항목 (아래 사유는 환불 사유로 인정되지 않음)\n관람일 6일 전부터 당일 이후의 취소 요청\n\n예매자의 착오 (관람 날짜·시간 착오 포함)\n\n개인 사정(출장, 건강, 교통 문제 등)\n\n무단 미입장\n\n현장 방문 후 단순 변심\n\n기상 악화, 질병 등의 외부 요인(단, 천재지변 등 예외 사유는 내부 운영 기준에 따름)\n\n6. 예외적 환불 가능 사유\n다음의 경우에 한해, 증빙 서류 제출 시 예외적으로 환불이 검토될 수 있습니다.\n단, 주최 측의 판단에 따라 전액/일부 환불 또는 거절될 수 있습니다.\n\n입원 등 긴급 의료 사유 (의사의 진단서 또는 입원확인서 제출)\n\n직계가족의 사망 (사망진단서 및 가족관계증명서)\n\n국가적 재난에 따른 이동 제한 명령 등\n\n7. 법률 고지 및 분쟁 예방 안내\n본 티켓은 '전자상거래법 제17조 제2항 3호' 및 '소비자분쟁해결기준'의 "공연, 전시 등 특정 일시에 제공되는 서비스"로 분류되어, 청약철회가 제한될 수 있습니다.\n\n예매자는 본 규정에 동의함으로써, 청약철회 불가 조건 및 환불 불가 항목에 대해 충분히 안내받았음을 인정합니다.\n\n모든 분쟁은 대한민국 민법 및 소비자보호 관련 법령에 따라 해결되며, 주최 측과의 사전 조율 및 협의가 우선됩니다.\n\n✅ 문의 및 요청:\n고객센터 또는 카카오톡 채널 '아트앤브릿지'`)}>교환 및 반품</div>
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
            <p>이메일 rena35200@gmail.com / 개인정보보호책임자 : 김주홍</p>
            <p>연락처 : 010-8685-9866 </p>
            <p>고객센터,카카오채널 : 아트앤브릿지</p>
          </div>
        </div>
      </div>

      {/* 이용약관 모달 */}
      <Modal
        className="h-full max-h-[75vh] overflow-y-auto "
        size="2xl"
        isOpen={termsDisclosure.isOpen}
        onClose={termsDisclosure.onClose}
      >
        <ModalContent>
          <ModalHeader>이용약관</ModalHeader>
          <ModalBody>
            <div className="text-sm">
              <div className="mb-3">
                <h3 className="font-semibold mb-1">■ 제1조 (목적)</h3>
                <p className="mb-2">
                  이 약관은 [(주)아트앤브릿지] (이하 "회사"라 합니다)가 운영하는
                  웹 플랫폼(미술예술랭)에서 제공하는 미술 정보 콘텐츠, 작품 등록
                  서비스 및 전시회 티켓 판매 서비스(이하 "서비스")를 이용함에
                  있어 회사와 이용자 간의 권리, 의무 및 책임사항 등을 규정함을
                  목적으로 합니다.
                </p>
              </div>

              <div className="mb-3">
                <h3 className="font-semibold mb-1">■ 제2조 (정의)</h3>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>
                    "회원"이라 함은 이 약관에 동의하고 회사와 이용계약을
                    체결하여 아이디(ID)를 부여받은 자를 말합니다.
                  </li>
                  <li>
                    "비회원"이라 함은 회원 가입 없이 회사가 제공하는 서비스를
                    이용하는 자를 말합니다.
                  </li>
                  <li>
                    "작품 등록 서비스"라 함은 이용자가 미술 작품 정보를 플랫폼에
                    업로드할 수 있도록 회사가 제공하는 기능을 말합니다.
                  </li>
                  <li>
                    "전시 티켓 판매 서비스"라 함은 이용자가 전시회 티켓을
                    온라인으로 구매할 수 있도록 회사가 제공하는 서비스를
                    말합니다.
                  </li>
                  <li>
                    "충전 서비스"란 유료 콘텐츠 이용을 위해 이용자가 회사에 선불
                    방식으로 요금을 결제하는 행위를 말합니다.
                  </li>
                  <li>
                    "포인트"란 회사가 정한 정책에 따라 회원이 유료로 구매하거나
                    이벤트 등으로 지급받아 플랫폼 내 유료 서비스를 사용하는 데
                    사용할 수 있는 결제 수단을 말합니다.
                  </li>
                </ol>
              </div>

              <div className="mb-3">
                <h3 className="font-semibold mb-1">
                  ■ 제3조 (약관의 효력 및 변경)
                </h3>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>
                    이 약관은 회사가 웹사이트에 게시하거나 기타의 방법으로
                    회원에게 공지함으로써 효력을 발생합니다.
                  </li>
                  <li>
                    회사는 관련 법령을 위배하지 않는 범위에서 이 약관을 개정할
                    수 있으며, 개정된 약관은 제1항과 같은 방법으로 공지합니다.
                  </li>
                </ol>
              </div>

              <div className="mb-3">
                <h3 className="font-semibold mb-1">
                  ■ 제4조 (서비스의 제공 및 변경)
                </h3>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>
                    회사는 다음과 같은 서비스를 제공합니다. (1) 미술 정보 콘텐츠
                    제공 (2) 미술 작품 등록 및 열람 기능 (3) 전시회 티켓 판매 및
                    예매 (4) 유료 서비스 및 포인트 충전 기능
                  </li>
                  <li>
                    회사는 서비스 제공을 위해 정기점검, 시스템 보완 등을 이유로
                    일정 기간 서비스 제공을 중단할 수 있으며, 이 경우 사전에
                    공지합니다.
                  </li>
                </ol>
              </div>

              <div className="mb-3">
                <h3 className="font-semibold mb-1">
                  ■ 제4-2조 (큐레이션 서비스의 성격 및 범위)
                </h3>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>
                    회사는 이용자가 등록한 미술 작품을 자체 큐레이션 정책에 따라
                    검토, 선별 및 배치하는 유료 서비스를 제공합니다(이하
                    "큐레이션 서비스").
                  </li>
                  <li>
                    큐레이션 서비스는 단순한 작품 게재 기능을 넘어서, 다음과
                    같은 콘텐츠 편집 및 기획 기능을 포함합니다.
                    <ul className="list-disc pl-5 space-y-1">
                      <li>
                        플랫폼 내 주요 영역(메인, 추천섹션, 테마관 등)에의 작품
                        배치
                      </li>
                      <li>전시 기획 및 작품 분류 큐레이션</li>
                      <li>
                        SNS, 뉴스레터, 배너 등 외부 마케팅 채널에의 노출 기회
                        제공
                      </li>
                      <li>
                        주간 큐레이터 픽, 전시 리뷰 연동 등 자체 기획 콘텐츠와의
                        연계
                      </li>
                    </ul>
                  </li>
                  <li>
                    큐레이션 서비스는 회사가 직접 제공하는 유료 콘텐츠 편집 및
                    배치 서비스로 간주되며, 회원은 해당 서비스 이용 시 관련
                    비용을 납부해야 합니다.
                  </li>
                  <li>
                    큐레이션 서비스의 결제는 서비스 이용 신청 시점에 선결제
                    방식으로 이루어지며, 이용자는 등록 후 서비스 제공 여부와
                    무관하게 환불을 요청할 수 없습니다. 단, 회사의 귀책 사유로
                    인한 미제공의 경우 환불이 가능합니다.
                  </li>
                  <li>
                    회사는 큐레이션 기준 및 노출 방식에 대한 독자적인 판단
                    권한을 가지며, 회원은 이에 대해 이의를 제기할 수 없습니다.
                  </li>
                </ol>
              </div>

              <div className="mb-3">
                <h3 className="font-semibold mb-1">
                  ■ 제5조 (서비스 제공기간)
                </h3>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>
                    서비스 제공기간은 고객이 결제한 시점부터 실제 서비스가
                    종료되는 시점까지의 전체 기간(사전 예약 기간 + 실제 서비스
                    제공 기간)을 의미합니다.
                  </li>
                  <li>
                    서비스 제공기간은 결제일로부터 최대 1개월 이내로 제한되며,
                    이를 초과하는 경우 가상계좌 결제수단의 이용이 제한될 수
                    있습니다.
                  </li>
                  <li>
                    서비스 제공기간이 1년을 초과할 경우 토스페이먼츠 등 특정
                    결제수단의 이용이 제한됩니다. 회사는 해당 사실을 사전에
                    고지합니다.
                  </li>
                  <li>
                    이용자는 서비스 제공기간 내에 서비스를 이용 완료해야 하며,
                    기간이 경과된 후에는 서비스 이용이 제한될 수 있습니다.
                  </li>
                </ol>
              </div>

              <div className="mb-3">
                <h3 className="font-semibold mb-1">
                  ■ 제6조 (이용요금 및 결제)
                </h3>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>
                    회사는 유료 서비스에 대해 별도의 요금을 부과하며, 요금은
                    해당 서비스의 안내 페이지에 명시됩니다.
                  </li>
                  <li>
                    결제는 신용카드, 계좌이체, 간편결제, 가상계좌 등 회사가
                    제공하는 방법을 통해 이루어집니다.
                  </li>
                  <li>환불은 회사의 환불정책에 따릅니다.</li>
                </ol>
              </div>

              <div className="mb-3">
                <h3 className="font-semibold mb-1">
                  ■ 제7조 (포인트 결제 및 환불 정책)
                </h3>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>
                    회원은 회사가 제공하는 결제 수단을 이용하여 포인트를
                    충전하고, 해당 포인트로 유료 콘텐츠 및 서비스를 구매할 수
                    있습니다.
                  </li>
                  <li>
                    포인트는 개인 간 양도가 불가능하며, 회원 본인만 사용
                    가능합니다.
                  </li>
                  <li>
                    회원은 포인트 구매 후 미사용 포인트에 한하여 구매일로부터
                    정해진 기간 내에 결제취소 및 환불을 요청할 수 있습니다.
                    환불은 구매 시 사용한 결제수단으로만 진행됩니다.
                  </li>
                  <li>이미 사용한 포인트는 원칙적으로 환불이 불가능합니다.</li>
                  <li>
                    회사의 귀책사유로 인해 결제오류가 발생했거나, 서비스 제공이
                    불가능하거나 중단된 경우, 회원은 해당 결제 건에 대해 환불을
                    요구할 수 있습니다.
                  </li>
                  <li>
                    환불 시점에 따라 결제금액의 일부가 공제되거나 환불이 제한될
                    수 있으며, 이는 관련 법령 및 회사 정책에 따릅니다.
                  </li>
                </ol>
              </div>

              <div className="mb-3">
                <h3 className="font-semibold mb-1">
                  ■ 제8조 (티켓 구매 및 환불 정책)
                </h3>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>
                    이용자는 회사 플랫폼을 통해 미술관, 전시회, 예술 공연 등의
                    티켓을 구매할 수 있으며, 결제 완료 시점에 해당 티켓의 전자
                    이용권 또는 확인번호가 발급됩니다.
                  </li>
                  <li>
                    티켓의 유효 기간, 사용 조건, 관람 가능 시간 등은 각 전시나
                    공연 주최 측의 정책을 따르며, 회사는 사전에 이를 명시합니다.
                  </li>
                  <li>
                    이용자는 결제일로부터 관람일 전까지 일정 기간 이내에는
                    구매한 티켓에 대해 취소 또는 환불을 요청할 수 있으며, 이는
                    각 전시/공연별 환불 정책 및 법령 기준에 따릅니다.
                  </li>
                  <li>
                    일부 전시나 기획전은 환불이 제한될 수 있으며, 이 경우 회사는
                    구매 전 해당 내용을 고지합니다.
                  </li>
                  <li>
                    환불 요청 시, 티켓이 사용되지 않았음을 확인해야 하며, 환불은
                    원 결제 수단으로 처리됩니다.
                  </li>
                  <li>
                    회사 또는 주최 측의 귀책사유(예: 전시 취소, 일정 변경 등)로
                    인해 관람이 불가한 경우, 전액 환불 또는 대체 티켓 제공 등의
                    조치가 이루어집니다.
                  </li>
                </ol>
              </div>

              <div className="mb-3">
                <h3 className="font-semibold mb-1">■ 제9조 (회원의 의무)</h3>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>
                    회원은 회원가입 시 정확한 정보를 제공해야 하며, 허위 정보
                    제공 시 서비스 이용이 제한될 수 있습니다.
                  </li>
                  <li>
                    회원은 본 약관 및 관계 법령을 준수하여야 하며, 플랫폼의
                    건전한 운영에 방해가 되는 행위를 해서는 안 됩니다.
                  </li>
                </ol>
              </div>

              <div className="mb-3">
                <h3 className="font-semibold mb-1">■ 제10조 (저작권)</h3>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>
                    이용자가 등록한 작품 및 콘텐츠에 대한 저작권은 해당
                    이용자에게 있으며, 회사는 전시 및 홍보 목적으로 이를 사용할
                    수 있습니다.
                  </li>
                  <li>
                    회사가 작성한 저작물에 대한 저작권은 회사에 귀속됩니다.
                  </li>
                </ol>
              </div>

              <div className="mb-3">
                <h3 className="font-semibold mb-1">■ 제11조 (책임 제한)</h3>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>
                    회사는 이용자가 업로드한 콘텐츠에 대한 신뢰도, 진위 여부에
                    대해 책임을 지지 않습니다.
                  </li>
                  <li>
                    회사는 천재지변, 시스템 오류 등 회사의 통제 밖의 사유로 인해
                    발생한 손해에 대해서는 책임을 지지 않습니다.
                  </li>
                </ol>
              </div>

              <div className="mb-3">
                <h3 className="font-semibold mb-1">■ 제12조 (분쟁 해결)</h3>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>
                    회사와 이용자 간 분쟁은 원칙적으로 협의를 통해 해결하며,
                    협의가 이루어지지 않을 경우 민사소송법상의 관할 법원에
                    제소할 수 있습니다.
                  </li>
                </ol>
              </div>

              <div className="mb-3">
                <p className="font-semibold">
                  부칙. 이 약관은 2025년 5월 12일부터 시행합니다.
                </p>
              </div>
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
        isOpen={exchangeRefundDisclosure.isOpen}
        onClose={exchangeRefundDisclosure.onClose}
      >
        <ModalContent>
          <ModalHeader>교환 및 환불 안내</ModalHeader>
          <ModalBody>
            <div className="text-sm">
              <div className="mb-3">
                <h3 className="font-semibold mb-1">1. 환불 가능 기간</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>관람 7일 전까지 취소 시: 전액 환불 가능</li>
                  <li>관람 당일 취소: 환불 불가</li>
                </ul>
              </div>

              <div className="mb-3">
                <h3 className="font-semibold mb-1">2. 환불 수수료</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>관람 7일 전까지: 100% 환불</li>
                  <li>관람 2일 전 ~ 1일 전: 환불 불가</li>
                  <li>관람 당일 및 이후: 환불 불가</li>
                </ul>
              </div>

              <div className="mb-3">
                <h3 className="font-semibold mb-1">3. 교환/변경</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    날짜 및 시간 변경은 관람 7일 전까지 1회에 한하여 가능합니다.
                  </li>
                  <li>
                    예매자 본인의 요청에 한해 처리되며, 타인 명의로 변경은
                    불가합니다.
                  </li>
                </ul>
              </div>

              <div className="mb-3">
                <h3 className="font-semibold mb-1">4. 환불 방법</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>마이페이지-고객센터 혹은 카카오채널 '아트앤브릿지' 를 통해 환불신청 가능합니다.</li>
                  <li>결제 수단에 따라 영업일 기준 3~7일 내 환불됩니다.</li>
                  <li>
                    신용카드 결제 시, 카드사 사정에 따라 환불 일자가 상이할 수
                    있습니다.
                  </li>
                </ul>
              </div>

              <div className="mb-3">
                <h3 className="font-semibold mb-1">5. 환불 불가 항목</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>본인의 착오로 인한 예매 (날짜/시간 착오 포함)</li>
                  <li>무단 미입장</li>
                  <li>외부 요인 (교통, 개인 사정 등)에 의한 취소</li>
                </ul>
              </div>
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
    </div>
  );
}
