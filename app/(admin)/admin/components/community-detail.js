"use client";
import { useState } from "react";
import { Button, Input, Textarea, addToast, Divider, Select, SelectItem, Chip } from "@heroui/react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

export function CommunityDetail({ post, onUpdate, onDelete, onRefresh }) {
  const supabase = createClient();
  const [likes, setLikes] = useState(post.likes || 0);
  const [category, setCategory] = useState(post.category || 'free');
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const categories = [
    { value: "free", label: "자유" },
    { value: "exhibition", label: "전시회" },
    { value: "discussion", label: "토론" },
    { value: "short_video", label: "숏폼" },
    { value: "review", label: "리뷰" },
    { value: "journalist", label: "기자단" },
  ];

  const saveChanges = async () => {
    setUpdating(true);
    const { data, error } = await supabase
      .from("community_post")
      .update({ 
        likes: likes,
        category: category
      })
      .eq("id", post.id)
      .select()
      .maybeSingle();
    if (error) {
      addToast({ title: "수정 실패", description: error.message, color: "danger" });
    } else {
      addToast({ title: "저장됨", description: "게시글 정보가 업데이트되었습니다.", color: "success" });
      onUpdate?.(data);
      onRefresh?.();
    }
    setUpdating(false);
  };

  const deletePost = async () => {
    if (!confirm("정말로 삭제하시겠습니까?")) return;
    setDeleting(true);
    const { error } = await supabase.from("community_post").delete().eq("id", post.id);
    if (error) {
      addToast({ title: "삭제 실패", description: error.message, color: "danger" });
    } else {
      addToast({ title: "삭제됨", color: "success" });
      onDelete?.();
      onRefresh?.();
    }
    setDeleting(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">게시글 상세 관리</h2>
        <div className="flex gap-2">
          <Link 
            href={`/community/${post.id}`} 
            target="_blank" 
            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
          >
            게시글 보기 →
          </Link>
          <Button 
            color="danger" 
            variant="flat"
            isLoading={deleting} 
            onPress={deletePost}
          >
            게시글 삭제
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-semibold text-gray-700 mb-2 block">제목</label>
          <div className="p-3 bg-gray-50 rounded-lg text-gray-900 font-medium">{post.title}</div>
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-700 mb-2 block">내용</label>
          <Textarea 
            readOnly 
            value={post.content || "(내용 없음)"} 
            minRows={6} 
            className="bg-gray-50"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">게시글 ID</label>
            <div className="p-3 bg-gray-50 rounded-lg text-gray-600 text-sm font-mono">{post.id}</div>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-2 block">작성일</label>
            <div className="p-3 bg-gray-50 rounded-lg text-gray-600 text-sm">
              {new Date(post.created_at).toLocaleString('ko-KR')}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">카테고리</label>
            <Select
              selectedKeys={[category]}
              onSelectionChange={(keys) => setCategory(Array.from(keys)[0])}
              size="sm"
            >
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </Select>
          </div>
          
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">추천수</label>
            <Input 
              type="number" 
              value={likes} 
              onChange={(e) => setLikes(Number(e.target.value))} 
              size="sm"
            />
          </div>

          <div className="flex flex-col justify-end">
            <Button 
              color="primary" 
              size="sm"
              isLoading={updating} 
              onPress={saveChanges}
            >
              변경사항 저장
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 