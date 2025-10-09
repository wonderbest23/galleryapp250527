'use client'

import React, { useState, useEffect } from "react";
import { MagazineList } from "../components/magazine-list";
import { MagazineDetail } from "../components/magazine-detail";

export default function Magazine() {
  const [selectedMagazine, setSelectedMagazine] = useState(null);
  const [selectedKeys, setSelectedKeys] = useState(new Set([]));
  const [refreshToggle, setRefreshToggle] = useState(false);
  const [refreshMagazineList, setRefreshMagazineList] = useState(null);

  // 신규 매거진 생성 함수
  const handleCreateMagazine = () => {
    // 기본 매거진 객체 생성
    const newMagazine = {
      id: null,
      title: "",
      summary: "",
      author: "",
      status: "pending",
      createdAt: new Date().toISOString().split("T")[0],
      content: "",
      thumbnail: "",
      viewCount: 0
    };
    setSelectedMagazine(newMagazine);
    setSelectedKeys(new Set([]));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">매거진 관리</h1>
              <p className="mt-2 text-gray-600">매거진을 등록하고 관리할 수 있습니다</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-white rounded-lg px-4 py-2 shadow-sm border">
                <span className="text-sm text-gray-600">총 매거진</span>
                <span className="ml-2 text-lg font-semibold text-blue-600">-</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Magazine List Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">매거진 목록</h2>
                <p className="text-sm text-gray-500 mt-1">등록된 매거진을 확인하고 선택하세요</p>
              </div>
              <div className="p-6">
                <MagazineList 
                  onSelectMagazine={setSelectedMagazine}
                  selectedKeys={selectedKeys}
                  onSelectionChange={setSelectedKeys}
                  onCreateMagazine={handleCreateMagazine}
                  onRefresh={(refreshFunc) => setRefreshMagazineList(refreshFunc)}
                  refreshToggle={refreshToggle}
                  setRefreshToggle={setRefreshToggle}
                />
              </div>
            </div>
          </div>

          {/* Magazine Detail Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">매거진 상세</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {selectedMagazine ? "선택한 매거진의 정보를 확인하고 편집하세요" : "매거진을 선택하면 상세 정보가 표시됩니다"}
                </p>
              </div>
              <div className="p-6 h-full">
                {selectedMagazine ? (
                  <MagazineDetail
                    magazine={selectedMagazine}
                    onUpdate={(updated) => setSelectedMagazine(updated)}
                    selectedMagazine={selectedMagazine}
                    setSelectedMagazine={setSelectedMagazine}
                    selectedKeys={selectedKeys}
                    setSelectedKeys={setSelectedKeys}
                    onRefresh={() => {
                      // 매거진 목록 새로고침 함수 호출
                      if (refreshMagazineList) {
                        console.log('부모 컴포넌트: 매거진 목록 새로고침 시도');
                        refreshMagazineList();
                        console.log('부모 컴포넌트: 매거진 목록 새로고침 완료');
                      } else {
                        console.log('부모 컴포넌트: refreshMagazineList 함수가 없습니다');
                      }
                    }}
                    refreshToggle={refreshToggle}
                    setRefreshToggle={setRefreshToggle}
                    onDelete={() => {
                      setSelectedMagazine(null);
                      setSelectedKeys(new Set([]));
                      // 목록 새로고침
                      setRefreshToggle(!refreshToggle);
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">매거진을 선택하세요</h3>
                    <p className="text-gray-500">왼쪽 목록에서 매거진을 선택하면 상세 정보가 표시됩니다</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 