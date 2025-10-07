"use client";
import { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Pagination,
  Input,
  Button,
  addToast,
} from "@heroui/react";
import { createClient } from "@/utils/supabase/client";

export function CommunityList({
  onSelectPost,
  selectedKeys,
  onSelectionChange,
  refreshToggle = 0,
  onBulkDelete,
}) {
  const supabase = createClient();
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState("");
  const itemsPerPage = 10;
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(1);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [page, search, refreshToggle]);

  const fetchPosts = async () => {
    const offset = (page - 1) * itemsPerPage;
    let query = supabase
      .from("community_post")
      .select("id, title, likes, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + itemsPerPage - 1);

    if (search.trim()) {
      query = query.ilike("title", `%${search}%`);
    }

    const { data, error, count } = await query;
    if (error) {
      console.log("community list error", error);
      addToast({ title: "조회 오류", description: error.message, color: "danger" });
      return;
    }
    setPosts(data || []);
    setTotal(Math.ceil((count || 1) / itemsPerPage));
  };

  const handleSelectionChange = (keys) => {
    onSelectionChange(keys);
    const first = Array.from(keys)[0];
    if (first) {
      const post = posts.find((p) => p.id === first);
      if (post) onSelectPost(post);
    }
  };

  // 대량 삭제 기능
  const handleBulkDelete = async () => {
    const selectedIds = Array.from(selectedKeys);
    if (selectedIds.length === 0) {
      addToast({ title: "선택 오류", description: "삭제할 게시글을 선택해주세요.", color: "warning" });
      return;
    }

    if (!confirm(`선택된 ${selectedIds.length}개의 게시글을 정말로 삭제하시겠습니까?`)) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("community_post")
        .delete()
        .in("id", selectedIds);

      if (error) {
        console.error("대량 삭제 오류:", error);
        addToast({ title: "삭제 실패", description: error.message, color: "danger" });
      } else {
        addToast({ title: "삭제 완료", description: `${selectedIds.length}개의 게시글이 삭제되었습니다.`, color: "success" });
        onSelectionChange(new Set([])); // 선택 해제
        onBulkDelete?.(); // 새로고침 콜백
      }
    } catch (error) {
      console.error("대량 삭제 중 오류:", error);
      addToast({ title: "삭제 실패", description: "대량 삭제 중 오류가 발생했습니다.", color: "danger" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <Input
            size="sm"
            placeholder="제목 검색"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="max-w-xs"
          />
          {selectedKeys.size > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {selectedKeys.size}개 게시글 선택됨
              </span>
              <Button
                size="sm"
                color="danger"
                variant="flat"
                onPress={handleBulkDelete}
                isLoading={deleting}
              >
                선택 삭제
              </Button>
            </div>
          )}
        </div>
        <span className="text-sm text-gray-600">총 {total} 페이지</span>
      </div>

      <Table
        aria-label="community posts table"
        selectionMode="multiple"
        selectedKeys={selectedKeys}
        onSelectionChange={handleSelectionChange}
      >
        <TableHeader>
          <TableColumn>ID</TableColumn>
          <TableColumn>제목</TableColumn>
          <TableColumn>추천수</TableColumn>
          <TableColumn>작성일</TableColumn>
        </TableHeader>
        <TableBody emptyContent="데이터가 없습니다." items={posts}>
          {(item) => (
            <TableRow key={String(item.id)} className="cursor-pointer hover:bg-gray-50">
              <TableCell>{String(item.id).slice(0,8)}...</TableCell>
              <TableCell className="truncate max-w-[250px]">{item.title}</TableCell>
              <TableCell>{item.likes || 0}</TableCell>
              <TableCell>{new Date(item.created_at).toLocaleDateString('ko-KR')}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex justify-center mt-3">
        <Pagination
          total={total}
          page={page}
          onChange={setPage}
          color="primary"
          size="sm"
        />
      </div>
    </div>
  );
} 