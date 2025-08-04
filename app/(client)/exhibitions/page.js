"use client";
import React, { Suspense } from "react";
import { ExhibitionCards } from "./components/exhibition-cards";
import ExhibitionCarousel from "./components/exhibition-carousel";
import {
  Tabs,
  Tab,
  Button,
  Select,
  SelectItem,
  Spinner,
  Checkbox,
  addToast,
  Skeleton,
  Divider,
  Pagination,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
} from "@heroui/react";
import { FaChevronLeft, FaPlus } from "react-icons/fa";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { FaPlusCircle } from "react-icons/fa";
import { FaArrowLeft } from "react-icons/fa6";
import Link from "next/link";
import { FaRegStar, FaStar } from "react-icons/fa";
import { FiPlusCircle } from "react-icons/fi";
import Image from "next/image";
import { FaMap } from "react-icons/fa";
import { motion } from "framer-motion";

// 페이드인 애니메이션 설정
const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { 
      duration: 0.5,
      ease: "easeInOut"
    } 
  }
};

// 아이템 목록 페이드인 애니메이션 설정
const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

// useSearchParams를 사용하는 별도의 클라이언트 컴포넌트
function ExhibitionListContent() {
  const router = useRouter();
  const searchParams = useSearchParams({ suspense: true });
  const initialIsBookmark =
    searchParams.get("isBookmark") === "true" ||
    searchParams.get("isBookmark") === "1";
  const [selectedTab, setSelectedTab] = useState("all");
  const [exhibitions, setExhibitions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedRegion, setSelectedRegion] = useState("");
  const [isBookmark, setIsBookmark] = useState(initialIsBookmark);
  const [bookmarks, setBookmarks] = useState([]);
  const [user, setUser] = useState(null);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);
  const [popularExhibitions, setPopularExhibitions] = useState([]);
  const [loadingPopular, setLoadingPopular] = useState(true);
  const [highRatingExhibitions, setHighRatingExhibitions] = useState([]);
  const [loadingHighRating, setLoadingHighRating] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [requestTitle, setRequestTitle] = useState('');
  const [requestContent, setRequestContent] = useState('');

  const ITEMS_PER_PAGE = 5; // 페이지당 항목 수
  const supabase = createClient();

  useEffect(() => {
    // 북마크 필터 상태가 변경될 때마다 전시회 목록 초기화 및 다시 불러오기
    setPage(1);
    setExhibitions([]);
    setTabLoading(true); // 탭 변경 시 로딩 상태 활성화
    // 데이터를 즉시 다시 불러오기 위해 useEffect 의존성 배열에 isBookmark 추가됨
  }, [selectedTab, isBookmark, selectedRegion]);

  // 인기 전시회 및 높은 평점 전시회 데이터 불러오기
  useEffect(() => {
    const fetchRecommendedExhibitions = async () => {
      setLoadingPopular(true);
      setLoadingHighRating(true);
      
      try {
        // 인기 전시회 데이터 불러오기
        const { data: popularExhibitionsData, error: popularExhibitionsError } =
          await supabase
            .from("exhibition")
            .select("*,gallery:naver_gallery_url(*)")
            .eq("isRecommended", true)
            .gte("end_date", new Date().toISOString())
            .limit(10);

        if (popularExhibitionsError) {
          console.log("인기 전시회 데이터 로드 오류:", popularExhibitionsError);
        } else {
          setPopularExhibitions(popularExhibitionsData);
        }
        setLoadingPopular(false);

        // 높은 평점 전시회 데이터 불러오기
        const {
          data: highRatingExhibitionsData,
          error: highRatingExhibitionsError,
        } = await supabase
          .from("exhibition")
          .select("*,gallery:naver_gallery_url(*)")
          .not("gallery", "is", null)
          .order("review_average", { ascending: false })
          .gte("end_date", new Date().toISOString())
          .eq('pick', true)
          .limit(9);
          
        if (highRatingExhibitionsError) {
          console.log("높은 평점 전시회 데이터 로드 오류:", highRatingExhibitionsError);
        } else {
          setHighRatingExhibitions(highRatingExhibitionsData);
        }
        setLoadingHighRating(false);
      } catch (error) {
        console.log("전시회 추천 데이터 로드 오류:", error);
        setLoadingPopular(false);
        setLoadingHighRating(false);
      }
    };

    fetchRecommendedExhibitions();
  }, []);

  useEffect(() => {
    const fetchExhibitions = async () => {
      setLoading(true);

      try {
        console.log("fetchExhibitions 실행:", {
          isBookmark,
          userExists: !!user,
          bookmarksLength: bookmarks.length,
          loadingBookmarks,
        });

        // 북마크 필터가 활성화되어 있지만 사용자가 로그인하지 않은 경우
        if (isBookmark && !user) {
          console.log("북마크 필터 활성화됨, 로그인 필요");
          setExhibitions([]);
          setTotalPages(1);
          setTotalCount(0);
          setLoading(false);
          setTabLoading(false);
          return;
        }

        // 북마크 필터가 활성화되어 있고 사용자가 로그인했지만 북마크 데이터가 아직 로드 중인 경우
        if (isBookmark && user && loadingBookmarks) {
          console.log("북마크 데이터 로딩 중, 대기");
          return; // 북마크 데이터가 로드될 때까지 대기
        }

        let query = supabase
          .from("exhibition")
          .select("*,gallery:naver_gallery_url(*)", { count: 'exact' })
          .not("gallery", "is", null)
          .gte("end_date", new Date().toISOString());

        // 정렬 기준 변경
        if(selectedTab === "all"){
          query = query.order("end_date", { ascending: true });
        } else {
          query = query.order("review_count", { ascending: false });
        }

        // 선택된 탭에 따라 필터 적용
        if (selectedTab === "free") {
          query = query.eq("isFree", true);
        } else if (selectedTab === "recommended") {
          query = query.eq("isRecommended", true);
        }

        // 지역 필터 적용
        if (selectedRegion) {
          query = query.ilike("gallery.address", `%${selectedRegion}%`);
        }

        // 북마크 필터 적용
        if (isBookmark && user) {
          console.log("북마크 필터링 적용");

          // null이 아닌 유효한 exhibition_id만 필터링
          const bookmarkedIds = bookmarks
            .filter((b) => b.exhibition_id !== null)
            .map((b) => b.exhibition_id);

          console.log("북마크된 전시회 ID:", bookmarkedIds);

          if (bookmarkedIds.length === 0) {
            // 북마크가 없거나 모두 null인 경우 빈 결과 반환
            console.log("북마크된 전시회 없음");
            setExhibitions([]);
            setTotalPages(1);
            setTotalCount(0);
            setLoading(false);
            setTabLoading(false);
            return;
          }

          query = query.in("id", bookmarkedIds);
        }

        const { data, error, count } = await query.range(
          (page - 1) * ITEMS_PER_PAGE, 
          page * ITEMS_PER_PAGE - 1
        );

        if (error) throw error;

        console.log("가져온 전시회 데이터:", data.length);
        console.log("총 데이터 개수:", count);

        setExhibitions(data);
        setTotalCount(count || 0);
        setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE));

      } catch (error) {
        console.log("전시회 데이터를 가져오는 중 오류 발생:", error);
      } finally {
        setLoading(false);
        setTabLoading(false); // 데이터 로드 완료 시 탭 로딩 상태 비활성화
      }
    };

    fetchExhibitions();
  }, [
    page,
    selectedTab,
    selectedRegion,
    isBookmark,
    bookmarks,
    user,
    loadingBookmarks,
  ]);

  // 페이지 변경 핸들러
  const handlePageChange = (newPage) => {
    setPage(newPage);
    // 페이지 변경 시 스크롤을 맨 위로 이동
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 사용자 정보 가져오기
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      }
    };
    fetchUser();
  }, []);

  // 사용자의 북마크 목록 가져오기
  const fetchBookmarks = async () => {
    if (!user) return;

    try {
      setLoadingBookmarks(true);
      console.log("북마크 데이터 로드 중...");

      const { data, error } = await supabase
        .from("bookmark")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      console.log("북마크 데이터 로드 완료:", data?.length || 0);
      setBookmarks(data || []);
    } catch (error) {
      console.log("북마크 로드 에러:", error);
    } finally {
      setLoadingBookmarks(false);
    }
  };

  // 북마크 상태 확인하는 함수
  const isBookmarked = (exhibitionId) => {
    return bookmarks.some(
      (bookmark) => bookmark.exhibition_id === exhibitionId
    );
  };

  // 북마크 토글 함수
  const toggleBookmark = async (e, exhibition) => {
    e.preventDefault(); // 링크 이벤트 방지
    e.stopPropagation(); // 이벤트 버블링 방지

    if (!user) {
      // 사용자가 로그인하지 않은 경우 처리
      addToast({
        title: "로그인 필요",
        description: "북마크를 추가하려면 로그인이 필요합니다.",
        color: "warning",
      });
      return;
    }

    const isCurrentlyBookmarked = isBookmarked(exhibition.id);

    try {
      if (isCurrentlyBookmarked) {
        // 북마크 삭제
        const { error } = await supabase
          .from("bookmark")
          .delete()
          .eq("user_id", user.id)
          .eq("exhibition_id", exhibition.id);

        if (error) throw error;

        // 북마크 목록에서 제거
        setBookmarks(
          bookmarks.filter(
            (bookmark) => bookmark.exhibition_id !== exhibition.id
          )
        );

        // 북마크 삭제 토스트 표시
        addToast({
          title: "북마크 삭제",
          description: `${exhibition.name} 북마크가 삭제되었습니다.`,
          color: "danger",
        });
      } else {
        // 북마크 추가
        const { data, error } = await supabase
          .from("bookmark")
          .insert({
            user_id: user.id,
            exhibition_id: exhibition.id,
            created_at: new Date().toISOString(),
          })
          .select();

        if (error) throw error;

        // 북마크 목록에 추가
        setBookmarks([...bookmarks, data[0]]);

        // 북마크 추가 토스트 표시
        addToast({
          title: "북마크 추가",
          description: `${exhibition.name} 북마크에 추가되었습니다.`,
          color: "success",
        });
      }
    } catch (error) {
      console.log("북마크 토글 에러:", error);

      // 에러 토스트 표시
      addToast({
        title: "오류 발생",
        description: "북마크 처리 중 오류가 발생했습니다.",
        color: "danger",
        variant: "solid",
        timeout: 3000,
      });
    }
  };

  // 컴포넌트 마운트 시 북마크 로드
  useEffect(() => {
    if (user) {
      console.log("사용자 로그인 확인됨, 북마크 로드 시작");
      fetchBookmarks();
    }
  }, [user]);

  // URL 매개변수 업데이트 함수
  const updateBookmarkUrlParam = (isBookmarked) => {
    const url = new URL(window.location);
    if (isBookmarked) {
      url.searchParams.set("isBookmark", "true");
    } else {
      url.searchParams.delete("isBookmark");
    }
    window.history.pushState({}, "", url);
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="bg-white flex items-center w-[90%] justify-between">
        <Button
          isIconOnly
          variant="light"
          className="mr-2"
          onPress={() => router.push("/")}
          aria-label="홈으로 이동"
        >
          <FaArrowLeft className="text-xl" />
        </Button>
        <h2 className="text-lg font-bold text-center flex-grow">전시회</h2>
        <div className="w-10"></div>
      </div>

      {/* 인기 전시회 캐러셀 */}
      <div className="w-[90%] mt-4 mb-2">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-[18px] font-bold">인기 전시회</h3>
        </div>
        {loadingPopular ? (
          <div className="flex overflow-x-auto gap-4 py-2 scrollbar-hide">
            {Array(3).fill(null).map((_, i) => (
              <div key={i} className="min-w-[180px] flex-shrink-0">
                <Skeleton className="w-full h-[240px] rounded-2xl" />
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInVariants}
          >
            <ExhibitionCarousel
              exhibitions={popularExhibitions}
              user={user}
              bookmarks={bookmarks}
              toggleBookmark={toggleBookmark}
              isBookmarked={isBookmarked}
            />
          </motion.div>
        )}
      </div>


      {/* 커스텀 탭바 및 필터 영역 */}
      <div className="w-[90%] flex flex-col mb-4">
        {/* 커스텀 탭바 - 전체 폭의 2/3 크기로 중앙 정렬 */}
        <div className="flex w-full border-t border-gray-200 mb-2">
          <div className="w-1/6"></div>
          <div className="flex w-2/3">
            <button
              className={`text-[12px] flex-1 py-3 text-center font-medium ${selectedTab === "all" ? "border-t-4 border-black text-black" : "text-gray-500"}`}
              onClick={() => setSelectedTab("all")}
            >
              전시회
            </button>
            <button
              className={`text-[12px] flex-1 py-3 text-center font-medium ${selectedTab === "free" ? "border-t-4 border-black text-black" : "text-gray-500"}`}
              onClick={() => setSelectedTab("free")}
            >
              무료전시
            </button>
            <button
              className={`text-[12px] flex-1 py-3 text-center font-medium ${selectedTab === "recommended" ? "border-t-4 border-black text-black" : "text-gray-500"}`}
              onClick={() => setSelectedTab("recommended")}
            >
              추천전시
            </button>
          </div>
          <div className="w-1/6"></div>
        </div>

        {/* 필터 영역 */}
        <div className="flex justify-between items-center w-full bg-white mb-4">
          <Select
            aria-label="지역 선택"
            selectedKeys={selectedRegion ? [selectedRegion] : []}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="w-1/4"
            placeholder="지역"
            size="sm"
          >
            <SelectItem key="서울" value="서울">
              서울
            </SelectItem>
            <SelectItem key="인천" value="인천">
              인천
            </SelectItem>
            <SelectItem key="경기" value="경기">
              경기
            </SelectItem>
            <SelectItem key="대전" value="대전">
              대전
            </SelectItem>
            <SelectItem key="충북" value="충북">
              충북
            </SelectItem>
            <SelectItem key="충남" value="충남">
              충남
            </SelectItem>
            <SelectItem key="대구" value="대구">
              대구
            </SelectItem>
            <SelectItem key="경북" value="경북">
              경북
            </SelectItem>
            <SelectItem key="경남" value="경남">
              경남
            </SelectItem>
            <SelectItem key="부산" value="부산">
              부산
            </SelectItem>
            <SelectItem key="울산" value="울산">
              울산
            </SelectItem>
            <SelectItem key="광주" value="광주">
              광주
            </SelectItem>
            <SelectItem key="전남" value="전남">
              전남
            </SelectItem>
            <SelectItem key="전북" value="전북">
              전북
            </SelectItem>
            <SelectItem key="강원" value="강원">
              강원
            </SelectItem>
            <SelectItem key="제주" value="제주">
              제주
            </SelectItem>
          </Select>

          <Button
            size="sm"
            color="primary"
            variant="flat"
            onPress={() => {
              if(!user){ router.push('/mypage'); return; }
              setIsRequestOpen(true);
            }}
          >
            전시회 등록 요청
          </Button>
        </div>

        {/* 전시회 카드 */}
        {tabLoading ? (
          <div className="flex justify-center items-center w-full my-4">
            <Spinner variant="wave" size="lg" color="primary" />
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInVariants}
          >
            <ExhibitionCards
              exhibitions={exhibitions}
              user={user}
              bookmarks={bookmarks}
              toggleBookmark={toggleBookmark}
              isBookmarked={isBookmarked}
            />
          </motion.div>
        )}

        {/* 페이지네이션 */}
        {!tabLoading && exhibitions.length > 0 && totalPages > 1 && (
          <div className="flex justify-center items-center mt-6">
            <Pagination
              total={totalPages}
              page={page}
              onChange={handlePageChange}
              showControls
              color="primary"
              size="sm"
              className="gap-2"
            />
          </div>
        )}
        
        {!tabLoading && exhibitions.length === 0 && (
          <div className="flex justify-center items-center py-8">
            <p className="text-gray-500">표시할 전시회가 없습니다</p>
          </div>
        )}


      </div>

      <Divider
        orientation="horizontal"
        className="w-[90%] my-4 bg-[#eee]"
      />

              {/* 아트앤브릿지 섹션 */}
        <div className="w-[90%] flex flex-col justify-center items-center mb-24">
          <div className="w-full flex justify-between items-center">
            <h1 className="text-[18px] font-bold">아트앤브릿지</h1>
        </div>

        {loadingHighRating ? (
          <div className="w-full grid grid-cols-3 gap-4 mt-6">
            {Array(6).fill(null).map((_, i) => (
              <div key={i}>
                <Skeleton className="w-full h-[100px] rounded-lg" />
                <Skeleton className="w-3/4 h-3 mt-2 rounded-lg" />
                <Skeleton className="w-1/2 h-2 mt-1 rounded-lg" />
              </div>
            ))}
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainerVariants}
            className="w-full grid grid-cols-3 gap-4 mt-6"
          >
            {highRatingExhibitions.map((exhibition) => (
              <motion.div 
                key={exhibition.id}
                variants={fadeInVariants}
              >
                <Link href={`/exhibition/${exhibition.id}`}>
                  <div className="relative w-full h-[100px]">
                    <Image
                      src={exhibition.photo}
                      alt={exhibition.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover rounded-lg"
                      priority
                    />
                  </div>
                  <div className="text-[14px] font-bold line-clamp-1">
                    {exhibition.contents || "없음"}
                  </div>
                  <div className="text-[13px] text-gray-500 flex items-center justify-start gap-1">
                    <span className="text-yellow-500">
                      <FaStar className="text-[#007AFF]" />
                    </span>
                    <span>
                      {exhibition.review_average || "1.0"} ({exhibition.review_count || 0})
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* 전시회 등록 요청 모달 */}
      <Modal isOpen={isRequestOpen} onOpenChange={setIsRequestOpen} placement="center">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">전시회 등록 요청</ModalHeader>
              <ModalBody>
                <Input
                  label="전시회명"
                  value={requestTitle}
                  onChange={e=>setRequestTitle(e.target.value)}
                  isRequired
                />
                <Textarea
                  label="요청 내용(선택)"
                  value={requestContent}
                  onChange={e=>setRequestContent(e.target.value)}
                />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>취소</Button>
                <Button color="primary" onPress={async()=>{
                  if(!requestTitle.trim()){ alert('전시회명을 입력해주세요'); return; }
                  const supabase = createClient();
                  const todayStart = new Date();
                  todayStart.setHours(0,0,0,0);
                  const { count, error:cntErr } = await supabase
                    .from('exhibition_request')
                    .select('id', { count:'exact', head:true })
                    .eq('user_id', user?.id)
                    .gte('created_at', todayStart.toISOString());
                  if(cntErr){ console.log(cntErr); alert('요청 확인 중 오류'); return; }
                  if((count||0)>=10){ alert('하루 최대 10건까지 요청할 수 있습니다. 내일 다시 시도해주세요.'); return; }
                  await supabase.from('exhibition_request').insert({
                    user_id:user?.id,
                    title: requestTitle.trim(),
                    content: requestContent.trim(),
                  });
                  setRequestTitle(''); setRequestContent(''); onClose();
                  alert('등록 요청이 접수되었습니다!');
                }}>
                  제출
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}

// 메인 컴포넌트는 Suspense로 감싸진 컨텐츠를 렌더링
export default function ExhibitionList() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center w-full h-full mt-8">
          <Spinner variant="wave" size="lg" color="primary" />
        </div>
      }
    >
      <ExhibitionListContent />
    </Suspense>
  );
}
