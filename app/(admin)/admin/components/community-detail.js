"use client";
import { useState } from "react";
import { Button, Input, Textarea, addToast, Divider } from "@heroui/react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

export function CommunityDetail({ post, onUpdate, onDelete, onRefresh }) {
  const supabase = createClient();
  const [likes, setLikes] = useState(post.likes || 0);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const saveLikes = async () => {
    setUpdating(true);
    const { data, error } = await supabase
      .from("community_post")
      .update({ likes })
      .eq("id", post.id)
      .select()
      .single();
    if (error) {
      addToast({ title: "수정 실패", description: error.message, color: "danger" });
    } else {
      addToast({ title: "저장됨", description: "추천수가 업데이트되었습니다.", color: "success" });
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
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-xl font-bold mb-2">게시글 상세</h2>
      <div className="mb-2 text-lg font-medium break-keep">{post.title}</div>
      <Divider className="my-2" />
      <Textarea readOnly value={post.content || "(내용 없음)"} minRows={6} className="mb-4" />

      <div className="flex items-center gap-2 mb-4">
        <label className="text-sm font-medium">추천수</label>
        <Input type="number" value={likes} onChange={(e)=>setLikes(Number(e.target.value))} className="w-32" />
        <Button color="primary" isLoading={updating} onPress={saveLikes}>저장</Button>
      </div>

      <div className="flex gap-2">
        <Link href={`/community/${post.id}`} target="_blank" className="border px-3 py-1 rounded bg-gray-50 hover:bg-gray-100 text-sm">게시글 보기</Link>
        <Button color="danger" isLoading={deleting} onPress={deletePost}>삭제</Button>
      </div>
    </div>
  );
} 