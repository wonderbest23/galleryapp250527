"use client";

import React, { useState } from "react";
import MainBannerManager from "../components/MainBannerManager";
import EventBannerManager from "../components/EventBannerManager";
import GalleryFeatureManager from "../components/GalleryFeatureManager";
import ExhibitionFeatureManager from "../components/ExhibitionFeatureManager";
import CommunityAdManager from "../components/CommunityAdManager";
import AdBannerManager from "../components/AdBannerManager";

export default function Banner() {
  // 메인 배너 상태 관리


  // 이벤트 배너 상태 관리
  const [eventBanners, setEventBanners] = useState({
    banner1: "",
    banner2: "",
    banner3: "",
    banner4: "",
    banner5: "",
  });

  // 갤러리 관련 상태 관리
  const [gallerySearch, setGallerySearch] = useState("");
  const [galleryPage, setGalleryPage] = useState(1);
  const [selectedGalleries, setSelectedGalleries] = useState([]);
  const [galleries, setGalleries] = useState([
    { id: 1, title: "현대 미술 전시", image: "https://via.placeholder.com/300x200?text=현대+미술", featured: false },
    { id: 2, title: "자연 사진전", image: "https://via.placeholder.com/300x200?text=자연+사진전", featured: true },
    { id: 3, title: "추상화 전시회", image: "https://via.placeholder.com/300x200?text=추상화", featured: false },
    { id: 4, title: "조각 작품 전시", image: "https://via.placeholder.com/300x200?text=조각+작품", featured: false },
    { id: 5, title: "디지털 아트 전시", image: "https://via.placeholder.com/300x200?text=디지털+아트", featured: true },
    { id: 6, title: "사진 작가 특별전", image: "https://via.placeholder.com/300x200?text=사진+작가", featured: false },
    { id: 7, title: "전통 예술 전시회", image: "https://via.placeholder.com/300x200?text=전통+예술", featured: false },
    { id: 8, title: "현대 조형물 전시", image: "https://via.placeholder.com/300x200?text=현대+조형물", featured: false },
  ]);

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

  // 메인 배너 URL 업데이트 핸들러
  const handleMainBannerChange = (e, bannerKey) => {
    setMainBanners({
      ...mainBanners,
      [bannerKey]: e.target.value,
    });
  };

  // 이벤트 배너 URL 업데이트 핸들러
  const handleEventBannerChange = (e, bannerKey) => {
    setEventBanners({
      ...eventBanners,
      [bannerKey]: e.target.value,
    });
  };

  // 메인 배너 저장 핸들러
  const saveMainBanners = () => {
    console.log("메인 배너 저장:", mainBanners);
    // 여기에 API 호출 또는 저장 로직을 추가
    alert("메인 배너가 저장되었습니다.");
  };

  // 이벤트 배너 저장 핸들러
  const saveEventBanners = () => {
    console.log("이벤트 배너 저장:", eventBanners);
    // 여기에 API 호출 또는 저장 로직을 추가
    alert("이벤트 배너가 저장되었습니다.");
  };

  // 갤러리 검색 핸들러
  const handleGallerySearch = (e) => {
    setGallerySearch(e.target.value);
    setGalleryPage(1);
  };

  // 전시회 검색 핸들러
  const handleExhibitionSearch = (e) => {
    setExhibitionSearch(e.target.value);
    setExhibitionPage(1);
  };

  // 갤러리 체크 핸들러
  const toggleGalleryFeature = (id) => {
    setGalleries(galleries.map(gallery => 
      gallery.id === id ? { ...gallery, featured: !gallery.featured } : gallery
    ));
  };

  // 전시회 체크 핸들러
  const toggleExhibitionFeature = (id) => {
    setExhibitions(exhibitions.map(exhibition => 
      exhibition.id === id ? { ...exhibition, featured: !exhibition.featured } : exhibition
    ));
  };

  // 갤러리 저장 핸들러
  const saveGalleryFeatures = () => {
    console.log("상단 노출 갤러리:", galleries.filter(gallery => gallery.featured));
    alert("갤러리 상단 노출 설정이 저장되었습니다.");
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
      <h1 className="text-2xl font-bold mb-6">배너 관리</h1>
      
      <div className="grid grid-cols-2 gap-6">
        {/* 메인 배너 섹션 */}
        <MainBannerManager 
        />
        
        {/* 이벤트 배너 섹션 */}
        <EventBannerManager 
          banners={eventBanners} 
          onBannerChange={handleEventBannerChange} 
          onSave={saveEventBanners} 
        />
        
        {/* 커뮤니티 광고 배너 섹션 */}
        <div className="col-span-2">
          <CommunityAdManager />
        </div>
        
        {/* 광고 카드 관리 섹션 */}
        <div className="col-span-2">
          <AdBannerManager />
        </div>
        
        {/* 갤러리 관리 섹션 */}
        <GalleryFeatureManager 
          galleries={galleries}
          gallerySearch={gallerySearch}
          onSearchChange={handleGallerySearch}
          onToggleFeature={toggleGalleryFeature}
          onSave={saveGalleryFeatures}
          currentPage={galleryPage}
          onPageChange={setGalleryPage}
          itemsPerPage={itemsPerPage}
        />
        
        {/* 전시회 관리 섹션 */}
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
      </div>
    </div>
  );
}


