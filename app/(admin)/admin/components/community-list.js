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
}) {
  const supabase = createClient();
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState("");
  const itemsPerPage = 10;
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(1);

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

  return (
    <div className="w-full bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-2">
        <Input
          size="sm"
          placeholder="제목 검색"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="max-w-xs"
        />
        <span className="text-sm text-gray-600">총 {total} 페이지</span>
      </div>

      <Table
        aria-label="community posts table"
        selectionMode="single"
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
            <TableRow key={item.id} onClick={() => handleSelectionChange(new Set([String(item.id)]))} className="cursor-pointer hover:bg-gray-50">
              <TableCell>{item.id}</TableCell>
              <TableCell className="truncate max-w-[250px]">{item.title}</TableCell>
              <TableCell>{item.likes}</TableCell>
              <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
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