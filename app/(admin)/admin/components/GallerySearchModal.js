"use client";
import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Pagination,
  addToast,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { createClient } from "@/utils/supabase/client";
import { debounce } from "lodash";

export function GallerySearchModal({ isOpen, onClose, onSelectGallery }) {
  const [search, setSearch] = useState("");
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const itemsPerPage = 10;
  const supabase = createClient();

  // 갤러리 검색 함수
  const searchGalleries = async (searchTerm = "", pageNum = 1) => {
    setLoading(true);
    try {
      const offset = (pageNum - 1) * itemsPerPage;
      
      let query = supabase
        .from("gallery")
        .select("*", { count: "exact" })
        .order("name", { ascending: true })
        .range(offset, offset + itemsPerPage - 1);

      // 검색어가 있으면 필터 적용
      if (searchTerm.trim()) {
        query = query.or(
          `name.ilike.%${searchTerm}%, address.ilike.%${searchTerm}%`
        );
      }

      const { data, error, count } = await query;

      if (error) {
        console.error("갤러리 검색 오류:", error);
        addToast({
          title: "검색 오류",
          description: "갤러리 검색 중 오류가 발생했습니다.",
          color: "danger",
        });
        return;
      }

      setGalleries(data || []);
      setTotal(Math.ceil((count || 0) / itemsPerPage));
    } catch (error) {
      console.error("갤러리 검색 중 예외 발생:", error);
    } finally {
      setLoading(false);
    }
  };

  // 디바운스된 검색 함수
  const debouncedSearch = debounce((searchTerm) => {
    setPage(1);
    searchGalleries(searchTerm, 1);
  }, 300);

  // 검색어 변경 시
  useEffect(() => {
    debouncedSearch(search);
  }, [search]);

  // 페이지 변경 시
  useEffect(() => {
    searchGalleries(search, page);
  }, [page]);

  // 모달이 열릴 때 초기 데이터 로드
  useEffect(() => {
    if (isOpen) {
      searchGalleries("", 1);
    }
  }, [isOpen]);

  // 갤러리 선택 처리
  const handleSelectGallery = (gallery) => {
    onSelectGallery(gallery);
    onClose();
  };

  // 페이지 변경 처리
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          갤러리 검색
        </ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            {/* 검색 입력 */}
            <Input
              label="갤러리명 또는 주소로 검색"
              placeholder="갤러리명이나 주소를 입력하세요..."
              value={search}
              onValueChange={setSearch}
              startContent={<Icon icon="mdi:magnify" className="text-gray-400" />}
              className="w-full"
            />

            {/* 갤러리 목록 테이블 */}
            <div className="max-h-96 overflow-y-auto">
              <Table
                aria-label="갤러리 검색 결과"
              >
                <TableHeader>
                  <TableColumn>갤러리명</TableColumn>
                  <TableColumn>주소</TableColumn>
                  <TableColumn>URL</TableColumn>
                  <TableColumn>전화번호</TableColumn>
                </TableHeader>
                <TableBody
                  items={galleries}
                  isLoading={loading}
                  loadingContent="갤러리를 검색하고 있습니다..."
                  emptyContent="검색 결과가 없습니다."
                >
                  {(gallery) => (
                    <TableRow 
                      key={gallery.id} 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSelectGallery(gallery)}
                    >
                      <TableCell>
                        <div className="font-medium">{gallery.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-600">{gallery.address}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-blue-600 truncate max-w-32">
                          {gallery.url}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{gallery.phone}</div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* 페이지네이션 */}
            {total > 1 && (
              <div className="flex justify-center">
                <Pagination
                  total={total}
                  page={page}
                  onChange={handlePageChange}
                  showControls
                  showShadow
                />
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="danger" variant="light" onPress={onClose}>
            취소
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 