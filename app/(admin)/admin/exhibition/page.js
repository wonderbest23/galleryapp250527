"use client";
import React, { useState, useEffect } from "react";
import { HiUsers, HiPhotograph, HiClock, HiThumbUp } from "react-icons/hi";
import { ExhibitionList } from "../components/exhibition-list";
import { ExhibitionDetail } from "../components/exhibition-detail";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { createClient } from "@/utils/supabase/client";

// 통계 카드 컴포넌트
const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-lg shadow p-6 flex items-center">
    <div className={`rounded-full p-3 ${color}`}>{icon}</div>
    <div className="ml-4">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </div>
);

export default function Exhibition() {
  // Supabase 클라이언트 생성
  const supabase = createClient();

  // 상태 관리
  const [selectedExhibition, setSelectedExhibition] = useState(null);
  const [selectedKeys, setSelectedKeys] = useState(new Set([]));
  const [refreshToggle, setRefreshToggle] = useState(0);
  const [refreshFunction, setRefreshFunction] = useState(null);

  // 전시회 선택 시 호출되는 함수 - 개선된 버전
  const handleSelectExhibition = (exhibition) => {
    console.log('부모 컴포넌트 - handleSelectExhibition 호출됨:', exhibition);
    
    // 새로운 객체로 복사하여 참조 변경을 확실히 함
    const newSelectedExhibition = {
      ...exhibition,
      // 중첩된 객체도 새로 복사
      naver_gallery_url: exhibition.naver_gallery_url ? {
        ...exhibition.naver_gallery_url
      } : null
    };
    
    console.log('새로 선택된 전시회:', newSelectedExhibition);
    setSelectedExhibition(newSelectedExhibition);
  };

  // 전시회 업데이트 시 호출되는 함수
  const handleUpdateExhibition = (updatedExhibition) => {
    console.log('전시회 업데이트:', updatedExhibition);
    
    // 업데이트된 전시회도 새로운 객체로 복사
    const newUpdatedExhibition = {
      ...updatedExhibition,
      naver_gallery_url: updatedExhibition.naver_gallery_url ? {
        ...updatedExhibition.naver_gallery_url
      } : null
    };
    
    setSelectedExhibition(newUpdatedExhibition);
  };

  // 신규 전시회 등록 시 호출되는 함수
  const handleCreateExhibition = () => {
    console.log('신규 전시회 등록 모드');
    
    // 새 전시회 객체 생성 (빈 값으로 초기화)
    const newExhibition = {
      name: "",
      contents: "",
      photo: "",
      start_date: "",
      end_date: "",
      working_hour: "",
      off_date: "",
      add_info: "",
      homepage_url: "",
      isFree: false,
      isRecommended: false,
      review_count: 0,
      review_average: 0,
      naver_gallery_url: null,
      price: 0,
      isSale: false,
      pick: false,
      isTestSale: false,
      isPreSale: false,
    };

    setSelectedExhibition(newExhibition);
    setSelectedKeys(new Set([]));
  };

  // 새로고침 함수 설정
  const handleSetRefreshFunction = (refreshFunc) => {
    setRefreshFunction(refreshFunc);
  };

  // selectedExhibition 변경 로그
  useEffect(() => {
    console.log('selectedExhibition 상태 변경됨:', selectedExhibition);
  }, [selectedExhibition]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">전시회 관리</h1>
          <p className="mt-2 text-gray-600">전시회를 등록하고 관리할 수 있습니다</p>
        </div>

        <div className="space-y-6">
          {/* 전시회 목록 - 상단에 한 줄로 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">전시회 목록</h2>
              <p className="text-sm text-gray-500 mt-1">등록된 전시회를 확인하고 선택하세요</p>
            </div>
            <div className="p-6">
              <ExhibitionList
                onSelectExhibition={handleSelectExhibition}
                selectedKeys={selectedKeys}
                onSelectionChange={setSelectedKeys}
                onCreateExhibition={handleCreateExhibition}
                onRefresh={handleSetRefreshFunction}
                refreshToggle={refreshToggle}
                setRefreshToggle={setRefreshToggle}
              />
            </div>
          </div>

          {/* 전시회 상세 - 하단에 전체 너비로 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">전시회 상세</h2>
              <p className="text-sm text-gray-500 mt-1">
                {selectedExhibition ? "선택한 전시회의 정보를 확인하고 편집하세요" : "전시회를 선택하면 상세 정보가 표시됩니다"}
              </p>
            </div>
            <div className="p-6">
              {selectedExhibition ? (
                <ExhibitionDetail
                  key={selectedExhibition.id || 'new'}
                  exhibition={selectedExhibition}
                  onUpdate={handleUpdateExhibition}
                  selectedKeys={selectedKeys}
                  setSelectedKeys={setSelectedKeys}
                  onRefresh={() => {
                    if (refreshFunction) {
                      console.log('부모 컴포넌트: 전시회 목록 새로고침 시도');
                      refreshFunction();
                      console.log('부모 컴포넌트: 전시회 목록 새로고침 완료');
                    } else {
                      console.log('부모 컴포넌트: refreshFunction 함수가 없습니다');
                    }
                  }}
                  refreshToggle={refreshToggle}
                  setRefreshToggle={setRefreshToggle}
                  selectedExhibition={selectedExhibition}
                  setSelectedExhibition={setSelectedExhibition}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">전시회를 선택하세요</h3>
                  <p className="text-gray-500">위 목록에서 전시회를 선택하면 상세 정보가 표시됩니다</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
