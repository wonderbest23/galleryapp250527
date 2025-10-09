"use client";

import { useState, useEffect } from "react";
import {
  Input,
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Pagination,
  Button,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { createClient } from "@/utils/supabase/client";
import { debounce } from "lodash";
import Link from "next/link";

export function MagazineList({ 
  onSelectMagazine,
  selectedKeys,
  onSelectionChange,
  onCreateMagazine,
  onRefresh,
  refreshToggle,
  setRefreshToggle
}) {
  const [search, setSearch] = useState("");
  const [magazines, setMagazines] = useState([]);
  const itemsPerPage = 5;
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(10);
  const supabase = createClient();

  const GetMagazines = async () => {
    const offset = (page - 1) * itemsPerPage;
    console.log('GetMagazines 함수 호출됨 - 페이지:', page, '검색어:', search);
    
    let query = supabase.from("magazine").select("*", {
      count: "exact",
    }).order('id', { ascending: false })
      .range(offset, offset + itemsPerPage - 1);
    
    // search 값이 있을 경우 필터 추가
    if (search.trim()) {
      query = query.or(`title.ilike.%${search}%, subtitle.ilike.%${search}%, contents.ilike.%${search}%`);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('매거진 데이터 조회 중 오류:', error);
    }
    console.log('매거진 데이터 조회 결과:', data?.length, '건, 총:', count, '건');
    setMagazines(data || []);
    setTotal(Math.ceil(count / itemsPerPage));
  };

  // 외부에서 호출할 수 있는 새로고침 함수 추가
  const refreshMagazines = () => {
    console.log('refreshMagazines 함수 호출됨 - 매거진 목록 새로고침');
    GetMagazines();
  };

  // onRefresh props가 존재하면 refreshMagazines 함수 전달
  useEffect(() => {
    if (onRefresh) {
      console.log('MagazineList: onRefresh 함수에 refreshMagazines 함수 전달');
      onRefresh(refreshMagazines);
    }
  }, [onRefresh]);

  useEffect(() => {
    if (refreshToggle !== undefined) {
      console.log('MagazineList: refreshToggle 변경 감지 - 매거진 목록 새로고침');
      GetMagazines();
    }
  }, [refreshToggle]);

  // debounce 적용한 검색 함수
  const debouncedSearch = debounce(() => {
    GetMagazines();
  }, 500);

  useEffect(() => {
    debouncedSearch();
    // 컴포넌트 언마운트 시 debounce 취소
    return () => {
      debouncedSearch.cancel();
    };
  }, [page, search]);

  // 페이지 변경 처리 함수
  const handlePageChange = (newPage) => {
    setPage(newPage);
    onSelectionChange(new Set()); // 페이지 바뀌면 선택 초기화
  };

  // 매거진 선택 처리
  const handleSelectionChange = (keys) => {
    onSelectionChange(keys);
    const selectedKey = Array.from(keys)[0];

    if (selectedKey) {
      const magazine = magazines.find((m) => m.id === Number(selectedKey));
      if (magazine) onSelectMagazine({ ...magazine });
    }
  };

  // 검색어 변경 시 선택 해제
  useEffect(()=>{ onSelectionChange(new Set()); },[search]);

  return (
    <div className="space-y-6">
      {/* Search and Create Section */}
      <div className="space-y-4">
        <div className="relative">
          <Input
            placeholder="매거진 제목, 부제목, 내용으로 검색..."
            value={search}
            onValueChange={setSearch}
            startContent={
              <Icon icon="lucide:search" className="text-gray-400 w-4 h-4" />
            }
            className="w-full"
            variant="bordered"
            size="md"
          />
        </div>
        
        <Button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
          variant="solid"
          onPress={onCreateMagazine}
          size="lg"
        >
          <Icon icon="lucide:plus" className="w-4 h-4 mr-2" />
          새 매거진 등록
        </Button>
      </div>

      {/* Magazine List */}
      <div className="space-y-3">
        {magazines.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Icon icon="lucide:book-open" className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">
              {search ? "검색 결과가 없습니다" : "등록된 매거진이 없습니다"}
            </p>
          </div>
        ) : (
          magazines.map((magazine) => {
            const isSelected = selectedKeys.has(magazine.id.toString());
            return (
              <div
                key={magazine.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50 shadow-sm' 
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
                onClick={() => {
                  const keySet = new Set([magazine.id]);
                  onSelectionChange(keySet);
                  onSelectMagazine({ ...magazine });
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-semibold text-sm truncate ${
                      isSelected ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {magazine.title || '제목 없음'}
                    </h3>
                    {magazine.subtitle && (
                      <p className={`text-xs mt-1 truncate ${
                        isSelected ? 'text-blue-700' : 'text-gray-600'
                      }`}>
                        {magazine.subtitle}
                      </p>
                    )}
                    <div className="flex items-center mt-2 space-x-3 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Icon icon="lucide:calendar" className="w-3 h-3 mr-1" />
                        {magazine.created_at ? new Date(magazine.created_at).toLocaleDateString("ko-KR") : "-"}
                      </span>
                      <span className="flex items-center">
                        <Icon icon="lucide:eye" className="w-3 h-3 mr-1" />
                        조회수 {magazine.view_count || 0}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="ml-3 flex-shrink-0">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <Icon icon="lucide:check" className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  )}
                </div>
                
                {magazine.contents && (
                  <p className={`text-xs mt-2 line-clamp-2 ${
                    isSelected ? 'text-blue-700' : 'text-gray-500'
                  }`}>
                    {magazine.contents.replace(/<[^>]*>/g, '').substring(0, 100)}...
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {magazines.length > 0 && (
        <div className="flex justify-center pt-4">
          <Pagination 
            page={page} 
            total={total} 
            initialPage={1}
            onChange={handlePageChange} 
            showControls
            size="sm"
            classNames={{
              wrapper: "gap-0 overflow-visible h-8 rounded border border-divider",
              item: "w-8 h-8 text-small rounded-none bg-transparent",
              cursor: "bg-gradient-to-b shadow-lg from-default-500 to-default-800 dark:from-default-500 dark:to-default-600 text-white font-bold",
            }}
          />
        </div>
      )}
    </div>
  );
}
