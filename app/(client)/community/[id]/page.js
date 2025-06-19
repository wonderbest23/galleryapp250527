"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { Button, Spinner, Divider, Textarea } from "@heroui/react";
import Link from "next/link";

export default function CommunityDetail() {
  const { id } = useParams();
  const supabase = createClient();
  const router = useRouter();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [likeLoading, setLikeLoading] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      const { data, error } = await supabase
        .from("community_post")
        .select("*")
        .eq("id", id)
        .single();
      if (error || !data) {
        router.replace("/community");
      } else {
        setPost(data);
        setLoading(false);
      }
    };
    if (id) fetchPost();
  }, [id]);

  const handleLike = async () => {
    if (!post) return;
    setLikeLoading(true);
    // 증가 후 값을 돌려받기 위해 row_level update
    const { data, error } = await supabase
      .from("community_post")
      .update({ likes: post.likes + 1 })
      .eq("id", id)
      .select()
      .single();
    setLikeLoading(false);
    if (!error && data) setPost(data);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <Spinner variant="wave" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-[600px] mx-auto px-4 py-6 gap-4">
      <div className="w-full flex justify-between items-center">
        <h1 className="text-xl font-bold break-keep">{post.title}</h1>
        <Button size="sm" variant="light" onPress={() => router.back()}>
          목록으로
        </Button>
      </div>
      <div className="w-full text-xs text-gray-500">
        {new Date(post.created_at).toLocaleString("ko-KR")} · 추천 {post.likes}
      </div>
      <Divider className="bg-gray-300" />
      <div className="w-full whitespace-pre-wrap">
        {post.content}
      </div>
      <Divider className="bg-gray-300" />
      <Button
        color="warning"
        isLoading={likeLoading}
        onPress={handleLike}
        className="self-start"
      >
        👍 추천하기 ({post.likes})
      </Button>
    </div>
  );
} 