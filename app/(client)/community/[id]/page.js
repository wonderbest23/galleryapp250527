"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { Button, Spinner, Divider, Avatar, addToast } from "@heroui/react";
import { HiOutlineClock, HiOutlineUser, HiOutlineEye, HiOutlineStar, HiOutlineLink, HiOutlineChat } from "react-icons/hi";
import Link from "next/link";

export default function CommunityDetail() {
  const { id } = useParams();
  const supabase = createClient();
  const router = useRouter();

  const [post, setPost] = useState(null);
  const [commentCnt, setCommentCnt] = useState(0);
  const [authorName, setAuthorName] = useState("익명");
  const [loading, setLoading] = useState(true);
  const [likeLoading, setLikeLoading] = useState(false);
  const [copyMsg, setCopyMsg] = useState("");

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
        // 댓글 수 조회
        const { count } = await supabase
          .from("community_comment")
          .select("id", { count: "exact", head: true })
          .eq("post_id", id);
        setCommentCnt(count || 0);
        setLoading(false);
        // viewerId: 로그인 사용자는 user.id, 아니면 localStorage 에 저장된 anonId 사용
        const getViewerId = () => {
          const lsKey = "anonId";
          if (currentUser?.id) return currentUser.id;
          let anon = localStorage.getItem(lsKey);
          if (!anon) {
            anon = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substring(2);
            localStorage.setItem(lsKey, anon);
          }
          return anon;
        };

        const viewerId = getViewerId();

        const { data: newCnt, error: viewErr } = await supabase.rpc("increment_view", {
          p_post_id: id,
          p_viewer: viewerId,
        });
        if (!viewErr && typeof newCnt === "number") {
          setPost((prev) => ({ ...prev, views: newCnt }));
        }
        // 작성자 이름 조회 (profiles)
        if (data.user_id) {
          const { data: prof } = await supabase
            .from("profiles")
            .select("nickname")
            .eq("id", data.user_id)
            .maybeSingle();
          if (prof?.nickname) setAuthorName(prof.nickname);
        }
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
      .maybeSingle();
    setLikeLoading(false);
    if (error) {
      addToast({ title: "추천 실패", description: error.message, color: "danger" });
    } else if (data) {
      setPost(data);
    } else {
      // RLS 등으로 업데이트 못한 경우
      addToast({ title: "추천 실패", description: "권한이 없습니다", color: "warning" });
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyMsg("링크 복사 완료!");
      setTimeout(() => setCopyMsg(""), 2000);
    } catch (e) {
      alert("복사 실패: " + e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <Spinner variant="wave" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-[700px] mx-auto px-4 py-6 gap-6">
      {/* 제목 영역 */}
      <div className="w-full">
        <div className="flex justify-between items-start gap-2 mb-2">
          <h1 className="text-[17px] font-semibold break-words flex-1 leading-snug">{post.title}</h1>
          <span className="text-[12px] text-gray-500 whitespace-nowrap">{new Date(post.created_at).toLocaleDateString("ko-KR")} {new Date(post.created_at).toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"})}</span>
        </div>

        {/* 작성자 + 메타 정보 */}
        <div className="flex flex-wrap items-center gap-3 text-[13px] text-gray-700 mb-1">
          <Avatar radius="sm" size="sm" icon={<HiOutlineUser className="w-4 h-4" />} />
          <span className="font-medium mr-2">{post.nickname || authorName}</span>
          <span className="text-gray-500 text-[12px]">조회 수 {post.views || 0}</span>
          <span className="text-gray-500 text-[12px]">추천 수 {post.likes}</span>
          <span className="text-gray-500 text-[12px]">댓글 {commentCnt}</span>
          {/* 링크 복사 버튼 */}
          <button onClick={handleCopyLink} className="ml-auto flex items-center gap-1 text-gray-500 hover:underline text-[12px]">
            <HiOutlineLink className="w-4 h-4" /> 복사
          </button>
        </div>
      </div>

      <Divider className="bg-gray-300" />

      {/* 본문 */}
      <div className="w-full whitespace-pre-wrap leading-relaxed text-[15px]">
        {post.content}
      </div>

      <Divider className="bg-gray-300" />

      {/* 추천 버튼 */}
      <div className="w-full flex justify-center">
        <Button
          color="warning"
          size="lg"
          radius="sm"
          isLoading={likeLoading}
          onPress={handleLike}
          className="font-semibold px-8 py-3 text-[15px]"
        >
          👍 추천하기 ({post.likes})
        </Button>
      </div>

      {/* 목록으로 */}
      <div className="self-end">
        <Button size="sm" variant="light" onPress={() => router.back()}>
          목록으로
        </Button>
      </div>

      {copyMsg && <div className="text-xs text-green-600 mt-1">{copyMsg}</div>}
    </div>
  );
} 