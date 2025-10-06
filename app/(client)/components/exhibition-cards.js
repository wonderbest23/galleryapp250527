"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardBody,
  Divider,
  Skeleton,
  Spinner,
  addToast,
  Pagination,
} from "@heroui/react";
import { FaRegCalendar } from "react-icons/fa";
import { IoMdPin } from "react-icons/io";
import { FaRegStar, FaStar } from "react-icons/fa";
import { FaRegBookmark, FaBookmark } from "react-icons/fa6";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import useBookmarkStore from "./bookmarkStore";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FaCalendar } from "react-icons/fa6";
import { FaMoneyBillWaveAlt } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

// 스켈레톤 컴포넌트
const SkeletonCard = ({ index }) => (
  <div
    key={`skeleton-${index}`}
    className="w-full flex items-center gap-3 justify-center"
  >
    <div className="w-12 h-12 rounded-full ">
      <Skeleton className="flex rounded-full w-12 h-10" />
    </div>
    <div className="w-full flex flex-col gap-2">
      <Skeleton className="h-3 w-[80%] rounded-lg" />
      <Skeleton className="h-3 w-[40%] rounded-lg" />
    </div>
  </div>
);

// 전시회 카드 컴포넌트
const ExhibitionCard = ({ exhibition, index, isBookmarked, toggleBookmark }) => {
  const parseDate=(s)=>{if(!s) return null; if(s.includes('-')) return new Date(s); const y=s.slice(0,4); const m=s.slice(4,6); const d=s.slice(6,8); return new Date(`${y}-${m}-${d}`);} ;
  const diffDays = (()=>{const dt=parseDate(exhibition.end_date); if(!dt||isNaN(dt)) return null; return Math.ceil((dt - new Date())/86400000);} )();
  return (
  <motion.div
    layout
    key={`${exhibition.id}-${index}`}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ 
      duration: 0.5,
        delay: index * 0.05
    }}
      className="w-full mb-3 outline-none relative"
  >
    <Link href={`/exhibition/${exhibition.id}`} className="w-full justify-center items-center">
      <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-center space-x-3">
          {/* 전시회 이미지 */}
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            <Image
              src={exhibition.photo || "/images/noimage.jpg"}
              alt={exhibition.name}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          </div>

          {/* 전시회 정보 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">
                  {exhibition.gallery?.name || exhibition.naver_gallery_url?.name || '갤러리'}
                </p>
                <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-1">
                  {exhibition.contents}
                </h3>
                
                {/* 날짜 정보 */}
                <div className="flex items-center gap-1 text-[10px] mb-1">
                  <FaCalendar className="text-[#007AFF] w-[12px] h-[12px]" />
                  {exhibition.start_date?.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3")} - {exhibition.end_date?.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3")}
                </div>
                
                {/* 가격 정보 */}
                <div className="flex items-center gap-1 text-[10px] mb-1">
                  <IoMdPin className="text-[#007AFF] w-[12px] h-[12px]" />
                  {exhibition.price === 0 ? "무료" : `${exhibition.price?.toLocaleString()}원`}
                </div>
                
                {/* 평점 정보 */}
                <div className="flex items-center gap-1 text-[10px]">
                  <FaStar className="text-[#007AFF] w-[12px] h-[12px]" />
                  {exhibition.review_average?.toFixed(1) || "0.0"} ({exhibition.review_count || 0})
                </div>
              </div>
              
              {/* 상태 태그 */}
              <div className={`px-2 py-1 rounded-full text-xs font-medium ml-2 ${
                diffDays === null || diffDays < 0
                  ? "bg-gray-100 text-gray-600" 
                  : diffDays > 0 && diffDays <= 3 
                    ? "bg-red-100 text-red-800" 
                    : diffDays > 0 
                      ? "bg-green-100 text-green-800" 
                      : "bg-blue-100 text-blue-800"
              }`}>
                {diffDays === null || diffDays < 0
                  ? "종료" 
                  : diffDays > 0 && diffDays <= 3 
                    ? "종료임박" 
                    : diffDays > 0 
                      ? "진행중" 
                      : "예정"
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  </motion.div>
);
};

export function ExhibitionCards({ exhibitionCategory, user }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exhibitions, setExhibitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingBookmarks, setLoadingBookmarks] = useState(false);
  const router = useRouter();
  const PAGE_SIZE = 5;

  const supabase = createClient();

  // Zustand 북마크 스토어에서 상태와 함수 가져오기
  const { bookmarks, setBookmarks } = useBookmarkStore();

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

        // Zustand 스토어에서 북마크 제거
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

        // Zustand 스토어에 북마크 추가
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

  // 사용자의 북마크 목록 가져오기
  const fetchBookmarks = async () => {
    if (!user) return;

    try {
      setLoadingBookmarks(true);

      const { data, error } = await supabase
        .from("bookmark")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      // 북마크 데이터를 Zustand 스토어에 저장
      setBookmarks(data || []);
    } catch (error) {
      console.log("북마크 로드 에러:", error);
    } finally {
      setLoadingBookmarks(false);
    }
  };

  // 컴포넌트 마운트 시 북마크 로드
  useEffect(() => {
    fetchBookmarks();
  }, [user]);

  const getExhibitions = useCallback(
    async (pageNum = 1) => {
      try {
        setLoading(true);

        // 페이지네이션을 위한 범위 계산
        const from = (pageNum - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        // 기본 쿼리 시작 (exhibitions 페이지와 동일한 방식)
        let query = supabase
          .from("exhibition")
          .select("*,gallery:naver_gallery_url(*),naver_gallery_url(*)", { count: "exact" })
          .gte("end_date", new Date().toISOString()); // 종료되지 않은 전시회만 표시

        // 정렬: 전체전시는 종료일이 임박한 순, 그 외 카테고리는 기존 로직 유지
        if (exhibitionCategory === "all") {
          query = query.order("end_date", { ascending: true });
        } else {
          query = query.order("review_count", { ascending: false });
        }

        // exhibitionCategory에 따라 필터 적용
        if (exhibitionCategory === "free") {
          query = query.eq("isFree", true);
        } else if (exhibitionCategory === "recommended") {
          query = query.eq("isRecommended", true);
        }
        // 'all'인 경우는 추가 필터 없음

        // 서버 사이드 페이지네이션 적용 (단순화된 방식)
        const { data, error, count } = await query.range(from, to);

        console.log("Exhibition query result:", { data, error, count });

        if (error) {
          console.log("Error fetching exhibitions:", error);
          return;
        }

        console.log("Pagination debug:", {
          count,
          calculatedTotalPages: Math.ceil((count || 0) / PAGE_SIZE),
          currentPage: pageNum,
          exhibitionsLength: data?.length || 0
        });

        setTotalPages(Math.ceil((count || 0) / PAGE_SIZE));
        setTotalCount(count || 0);
        setExhibitions(data || []);
      } finally {
        setLoading(false);
      }
    },
    [exhibitionCategory, supabase, PAGE_SIZE]
  );

  // 페이지 변경 핸들러 (exhibitions 페이지와 동일한 방식)
  const handlePageChange = (page) => {
    setCurrentPage(page);
    // 페이지 변경 시 스크롤을 맨 위로 이동
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    // 카테고리가 변경되면 페이지를 1로 리셋하고 데이터를 다시 불러옵니다
    if (exhibitionCategory !== "all") {
      setCurrentPage(1);
      getExhibitions(1);
    } else {
      getExhibitions(currentPage);
    }
  }, [getExhibitions, exhibitionCategory]);

  // 페이지 변경 시 데이터 다시 가져오기
  useEffect(() => {
    getExhibitions(currentPage);
  }, [currentPage, getExhibitions]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="w-full flex justify-center items-center"
    >
      <div className="flex flex-col items-center gap-4 w-[90%] justify-center">
        <div className="w-full flex flex-col justify-center items-center gap-y-4">
          {/* 스켈레톤과 실제 컨텐츠를 같은 레이아웃으로 유지 */}
          <div className="w-full">
            {loading ? (
              // 스켈레톤 UI - 레이아웃 유지
              <motion.div
                key={`skeleton-${currentPage}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full flex flex-col gap-4 justify-center items-center"
              >
                {Array(PAGE_SIZE).fill().map((_, index) => (
                  <SkeletonCard key={`skeleton-${currentPage}-${index}`} index={index} />
                ))}
              </motion.div>
            ) : (
              // 실제 전시회 목록
              <motion.div
                key={`exhibitions-${currentPage}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ 
                  duration: 0.5
                }}
                className="w-full"
              >
                {exhibitions.map((exhibition, index) => (
                  <ExhibitionCard
                    key={`${exhibition.id}-${index}`}
                    exhibition={exhibition}
                    index={index}
                    isBookmarked={isBookmarked}
                    toggleBookmark={toggleBookmark}
                  />
                ))}
              </motion.div>
            )}
          </div>
        </div>
        

      </div>
    </motion.div>
  );
}
