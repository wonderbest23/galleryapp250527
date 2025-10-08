"use client";

import React, { useState } from "react";
import MainBannerManager from "../components/MainBannerManager";
import ExhibitionFeatureManager from "../components/ExhibitionFeatureManager";
import CommunityAdManager from "../components/CommunityAdManager";
import AdBannerManager from "../components/AdBannerManager";

export default function Banner() {
  // 전시회 관련 상태 관리
  const [exhibitionSearch, setExhibitionSearch] = useState("");
  const [exhibitionPage, setExhibitionPage] = useState(1);
  const [selectedExhibitions, setSelectedExhibitions] = useState([]);
  const [exhibitions, setExhibitions] = useState([
    { id: 1, title: "봄 특별 전시회", date: "2024-04-01 ~ 2024-04-30", location: "서울 미술관", featured: true },
    { id: 2, title: "국제 미술 페스티벌", date: "2024-05-15 ~ 2024-06-15", location: "부산 전시관", featured: false },
    { id: 3, title: "젊은 작가 특별전", date: "2024-06-01 ~ 2024-06-30", location: "대구 아트센터", featured: false },
    { id: 4, title: "여름 기획 전시", date: "2024-07-10 ~ 2024-08-10", location: "인천 갤러리", featured: true },
    { id: 5, title: "디자인 트렌드 전시", date: "2024-08-20 ~ 2024-09-20", location: "광주 전시장", featured: false },
    { id: 6, title: "가을 미술 축제", date: "2024-09-15 ~ 2024-10-15", location: "제주 아트플렉스", featured: false },
    { id: 7, title: "해외 작가 초청전", date: "2024-10-01 ~ 2024-11-01", location: "대전 아트센터", featured: false },
    { id: 8, title: "연말 특별 전시회", date: "2024-12-01 ~ 2024-12-31", location: "서울 갤러리", featured: true },
  ]);

  // 전시회 검색 핸들러
  const handleExhibitionSearch = (e) => {
    setExhibitionSearch(e.target.value);
    setExhibitionPage(1);
  };

  // 전시회 체크 핸들러
  const toggleExhibitionFeature = (id) => {
    setExhibitions(exhibitions.map(exhibition => 
      exhibition.id === id ? { ...exhibition, featured: !exhibition.featured } : exhibition
    ));
  };

  // 전시회 저장 핸들러
  const saveExhibitionFeatures = () => {
    console.log("상단 노출 전시회:", exhibitions.filter(exhibition => exhibition.featured));
    alert("전시회 상단 노출 설정이 저장되었습니다.");
  };

  // 페이지당 아이템 수
  const itemsPerPage = 4;

  return (
    <div className="w-full py-20">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">배너 관리</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 메인 배너 섹션 */}
        <MainBannerManager />
        
        {/* 전시회 상단 노출 관리 섹션 */}
        <ExhibitionFeatureManager
          exhibitions={exhibitions}
          exhibitionSearch={exhibitionSearch}
          onSearchChange={handleExhibitionSearch}
          onToggleFeature={toggleExhibitionFeature}
          onSave={saveExhibitionFeatures}
          currentPage={exhibitionPage}
          onPageChange={setExhibitionPage}
          itemsPerPage={itemsPerPage}
        />
        
        {/* 커뮤니티 광고 배너 섹션 */}
        <div className="col-span-1 lg:col-span-2">
          <CommunityAdManager />
        </div>
        
        {/* 광고 카드 관리 섹션 */}
        <div className="col-span-1 lg:col-span-2">
          <AdBannerManager />
        </div>
      </div>
    </div>
  );
}


