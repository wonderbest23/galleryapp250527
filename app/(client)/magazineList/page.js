"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { User, Calendar, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from "next/link";
import Image from "next/image";
import { ReportModal } from "../components/report-modal";
import { ModernLoading } from "../components/ModernLoading";
// import { useScrollToTop } from "../components/ScrollToTop";

export default function MagazineList() {
  const supabase = createClient();
  const [magazines, setMagazines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [currentPage, setCurrentPage] = useState(1);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const itemsPerPage = 11; // 4(이미지+텍스트) + 5(텍스트만) + 2(그리드)
  
  // 페이지 진입 시 최상단으로 스크롤
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  
  const categories = ["전체", "전시리뷰", "작가인터뷰", "아트뉴스", "트렌드"];

  // 카테고리 변경 시 페이지를 1로 리셋
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  useEffect(() => {
    // 페이지 진입 시 최상단으로 스크롤
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    const fetchMagazines = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("magazine")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching magazines:", error);
          setMagazines([]);
        } else {
          setMagazines(data || []);
        }
      } catch (error) {
        console.error("Error:", error);
        setMagazines([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMagazines();
  }, []);

  // 카테고리별 필터링 (카테고리가 없으면 "전시리뷰"로 간주)
  const filteredMagazines = magazines.filter(magazine => {
    if (selectedCategory === "전체") return true;
    const magazineCategory = magazine.category || "전시리뷰";
    return magazineCategory === selectedCategory;
  });

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredMagazines.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMagazines = filteredMagazines.slice(startIndex, endIndex);

  // Featured 매거진 (첫 페이지의 첫 번째)
  const featuredMagazine = currentPage === 1 ? paginatedMagazines[0] : null;
  // 나머지 매거진들
  const remainingMagazines = currentPage === 1 ? paginatedMagazines.slice(1) : paginatedMagazines;
  
  // 섹션별로 분리
  // 1페이지: 대표 1개 제외 후 남은 10개를 4(이미지+텍스트) + 4(텍스트만) + 2(그리드)
  // 2페이지 이상: 11개를 4(이미지+텍스트) + 5(텍스트만) + 2(그리드)
  const imageTextList = remainingMagazines.slice(0, 4);
  const textOnlyEndIndex = currentPage === 1 ? 8 : 9;
  const textOnlyList = remainingMagazines.slice(4, textOnlyEndIndex);
  const gridList = remainingMagazines.slice(textOnlyEndIndex, textOnlyEndIndex + 2);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white min-h-screen flex flex-col items-center justify-center">
        <ModernLoading size="lg" text="매거진을 불러오는 중..." />
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-20">
      
      {/* ==================== 헤더 ==================== */}
      <div className="bg-white px-4 py-4 border-b sticky top-0 z-10">
        <h1 className="text-lg font-bold text-center">아트 매거진</h1>
      </div>

      {/* ==================== Featured Article (대표 기사) ==================== */}
      {featuredMagazine && (
        <Link href={`/magazine/${featuredMagazine.id}`} className="block">
          <div className="relative h-64 bg-white">
            {/* 배경 이미지 */}
            {featuredMagazine.photo?.[0]?.url ? (
              <Image
                src={featuredMagazine.photo[0].url}
                alt={featuredMagazine.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800"></div>
            )}
            
            {/* 그라데이션 오버레이 */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            
            {/* 텍스트 영역 */}
            <div className="absolute bottom-6 left-4 right-4 text-white">
              {/* Featured 배지 */}
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 bg-white/20 backdrop-blur-sm">
                FEATURED
              </span>
              
              {/* 제목 */}
              <h2 className="font-bold text-xl mb-2 line-clamp-2 leading-tight">
                {featuredMagazine.title}
              </h2>
              
              {/* 메타 정보 */}
              <div className="flex items-center gap-4 text-sm opacity-90">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{featuredMagazine.subtitle || "에디터"}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(featuredMagazine.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* ==================== 카테고리 탭 ==================== */}
      <div className="bg-white border-b">
        <div className="flex gap-2 p-4 overflow-x-auto scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryChange(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === category
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* ==================== 독자 제보 배너 ==================== */}
      <div className="p-4">
        <button 
          onClick={() => setIsReportModalOpen(true)}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-all"
        >
          <Edit className="w-5 h-5 mr-3 text-red-500" />
          <p className="font-medium text-gray-700">
            <span className="text-red-500">독자 여러분의 제보</span>를 기다립니다
          </p>
        </button>
      </div>

      {/* 제보 모달 */}
      <ReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
      />

      {/* ==================== 매거진 리스트 ==================== */}
      <div className="border-t border-gray-200">
        
        {/* Section 1: 이미지+텍스트 리스트 (4개) */}
        {imageTextList.length > 0 && (
          <div className="divide-y divide-gray-200">
            {imageTextList.map((magazine) => (
              <Link
                key={magazine.id}
                href={`/magazine/${magazine.id}`}
                className="flex gap-4 p-4 hover:bg-gray-50 transition-colors"
              >
                {/* 썸네일 이미지 */}
                <div className="flex-shrink-0 w-28 h-[74px]">
                  {magazine.photo?.[0]?.url ? (
                    <Image
                      src={magazine.photo[0].url}
                      alt={magazine.title}
                      width={112}
                      height={74}
                      className="w-full h-full object-cover rounded-md"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 rounded-md flex items-center justify-center">
                      <span className="text-gray-500 text-2xl">📰</span>
                    </div>
                  )}
                </div>
                
                {/* 텍스트 영역 */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-medium text-gray-900 line-clamp-2 leading-snug mb-1">
                    {magazine.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {magazine.subtitle || "에디터"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Section 2: 텍스트 헤드라인만 (5개) */}
        {textOnlyList.length > 0 && (
          <div className="border-t border-gray-200 px-4">
            {textOnlyList.map((magazine) => (
              <Link
                key={magazine.id}
                href={`/magazine/${magazine.id}`}
                className="block py-4 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors"
              >
                <h3 className="text-base font-medium text-gray-800 truncate hover:text-blue-600 transition-colors">
                  {magazine.title}
                </h3>
              </Link>
            ))}
          </div>
        )}
        
        {/* Section 3: 이미지 그리드 (2열, 2개) */}
        {gridList.length > 0 && (
          <div className="p-4 grid grid-cols-2 gap-x-4 gap-y-6 pt-6">
            {gridList.map((magazine) => (
              <Link
                key={magazine.id}
                href={`/magazine/${magazine.id}`}
                className="block group"
              >
                {/* 이미지 */}
                <div className="overflow-hidden rounded-md aspect-[4/3] bg-gray-200">
                  {magazine.photo?.[0]?.url ? (
                    <Image
                      src={magazine.photo[0].url}
                      alt={magazine.title}
                      width={400}
                      height={300}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <span className="text-gray-500 text-3xl">📰</span>
                    </div>
                  )}
                </div>
                
                {/* 제목 */}
                <h4 className="mt-3 text-sm font-semibold text-gray-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                  {magazine.title}
                </h4>
              </Link>
            ))}
          </div>
        )}

        {/* 매거진 없을 때 */}
        {remainingMagazines.length === 0 && !featuredMagazine && (
          <div className="text-center py-12 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📰</span>
            </div>
            <p className="text-sm mb-2">등록된 매거진이 없습니다</p>
            <p className="text-xs text-gray-400">새로운 매거진이 등록되면 여기에 표시됩니다</p>
          </div>
        )}
      </div>

      {/* ==================== 페이지네이션 ==================== */}
      {totalPages > 1 && (
        <div className="py-8">
          <div className="flex items-center justify-center gap-3">
            {/* Prev */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${
                currentPage === 1
                  ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-white'
                  : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50'
              }`}
              aria-label="이전 페이지"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page numbers (최대 5개 표시) */}
            {[...Array(Math.min(totalPages, 5))].map((_, index) => {
              const pageNumber = index + 1;
              const isActive = currentPage === pageNumber;
              return (
                <button
                  key={pageNumber}
                  onClick={() => handlePageChange(pageNumber)}
                  className={`w-9 h-9 rounded-lg border font-medium flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}

            {/* Next */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${
                currentPage === totalPages
                  ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-white'
                  : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50'
              }`}
              aria-label="다음 페이지"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
