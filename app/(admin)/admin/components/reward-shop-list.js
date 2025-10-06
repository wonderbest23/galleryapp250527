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
  Chip,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { createClient } from "@/utils/supabase/client";
import { debounce } from "lodash";

export function RewardShopList({
  onSelectItem,
  selectedKeys,
  setSelectedKeys,
  refreshToggle,
  onCreateItem,
}) {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]);
  const itemsPerPage = 10;
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const supabase = createClient();

  const GetItems = async () => {
    const offset = (page - 1) * itemsPerPage;
    console.log("GetItems 함수 호출됨 - 페이지:", page, "검색어:", search);

    let query = supabase
      .from("reward_shop_items")
      .select("*", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(offset, offset + itemsPerPage - 1);

    // search 값이 있을 경우 필터 추가
    if (search.trim()) {
      query = query.or(
        `title.ilike.%${search}%,description.ilike.%${search}%,category.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;

    if (error) {
      console.log("리워드샵 상품 데이터 조회 중 오류:", error);
    }
    console.log(
      "리워드샵 상품 데이터 조회 결과:",
      data?.length,
      "건, 총:",
      count,
      "건"
    );
    setItems(data || []);
    setTotalCount(count || 0);
    setTotal(Math.ceil((count || 0) / itemsPerPage));
  };

  // 컴포넌트 마운트 시 초기 데이터 로드
  useEffect(() => {
    console.log("RewardShopList: 컴포넌트 마운트 - 초기 상품 목록 로드");
    GetItems();
  }, []);

  useEffect(() => {
    if (refreshToggle) {
      console.log(
        "RewardShopList: refreshToggle 변경 감지 - 상품 목록 새로고침"
      );
      GetItems();
    }
  }, [refreshToggle]);

  // debounce 적용한 검색 함수
  const debouncedSearch = debounce(() => {
    GetItems();
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
  };

  // 상품 선택 처리
  const handleSelectionChange = (keys) => {
    setSelectedKeys(keys);
    const selectedKey = Array.from(keys)[0];

    if (selectedKey) {
      const item = items.find((i) => i.id === selectedKey);
      if (item) onSelectItem(item);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">상품 목록 ({totalCount})</h2>
        <Button
          color="primary"
          startContent={<Icon icon="mdi:plus" />}
          onPress={onCreateItem}
        >
          신규 상품 추가
        </Button>
      </div>

      {/* 검색 */}
      <Input
        placeholder="상품명, 설명, 카테고리로 검색..."
        value={search}
        onValueChange={setSearch}
        startContent={<Icon icon="mdi:magnify" />}
        className="mb-4"
      />

      {/* 테이블 */}
      <Table
        aria-label="리워드샵 상품 테이블"
        selectionMode="single"
        selectedKeys={selectedKeys}
        onSelectionChange={handleSelectionChange}
        className="mb-4"
      >
        <TableHeader>
          <TableColumn>상품명</TableColumn>
          <TableColumn>필요 포인트</TableColumn>
          <TableColumn>재고</TableColumn>
          <TableColumn>상태</TableColumn>
          <TableColumn>등록일</TableColumn>
        </TableHeader>
        <TableBody items={items} emptyContent="등록된 상품이 없습니다.">
          {(item) => (
            <TableRow key={item.id}>
              <TableCell>
                <div className="font-medium">{item.title}</div>
                <div className="text-xs text-gray-500 truncate max-w-xs">
                  {item.description}
                </div>
              </TableCell>
              <TableCell>
                <span className="font-bold text-blue-600">
                  {item.points_required?.toLocaleString()} P
                </span>
              </TableCell>
              <TableCell>
                <span className={item.stock <= 0 ? "text-red-600" : ""}>
                  {item.stock}개
                </span>
              </TableCell>
              <TableCell>
                <Chip
                  size="sm"
                  color={item.is_active ? "success" : "default"}
                  variant="flat"
                >
                  {item.is_active ? "활성" : "비활성"}
                </Chip>
              </TableCell>
              <TableCell>
                {new Date(item.created_at).toLocaleDateString()}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* 페이지네이션 */}
      {total > 1 && (
        <div className="flex justify-center">
          <Pagination
            total={total}
            page={page}
            onChange={handlePageChange}
            showControls
          />
        </div>
      )}
    </div>
  );
}

