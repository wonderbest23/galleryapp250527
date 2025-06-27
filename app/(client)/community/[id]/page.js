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
  const [commentText, setCommentText] = useState("");
  const [sending, setSending] = useState(false);
  const [comments, setComments] = useState([]);
  const [replyTo, setReplyTo] = useState(null);

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
        // 댓글 목록 조회
        const { data: commentList } = await supabase
          .from("community_comment")
          .select("id, content, created_at, likes, user_id, parent_id")
          .eq("post_id", id)
          .order("created_at", { ascending: true });
        setComments(commentList || []);
        setLoading(false);
        // viewerId: 로그인 사용자는 user.id, 아니면 localStorage 에 저장된 anonId 사용
        const lsKey = "anonId";
        let viewerId;
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          viewerId = session.user.id;
        } else {
          let anon = localStorage.getItem(lsKey);
          if (!anon) {
            anon = (typeof crypto !== "undefined" && crypto.randomUUID)
              ? crypto.randomUUID()
              : Math.random().toString(36).substring(2);
            localStorage.setItem(lsKey, anon);
          }
          viewerId = anon;
        }

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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      addToast({ title: "로그인 필요", description: "추천하려면 로그인하세요", color: "warning" });
      setLikeLoading(false);
      return;
    }

    const { error } = await supabase.rpc("like_post_once", {
      p_post_id: id,
      p_user_id: session.user.id,
    });
    setLikeLoading(false);
    if (error) {
      if (error.code === "23505" || error.message?.includes("unique")) {
        addToast({ title: "이미 추천했습니다" });
      } else {
        addToast({ title: "추천 실패", description: error.message, color: "danger" });
      }
    } else {
      setPost((prev) => ({ ...prev, likes: prev.likes + 1 }));
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

  const handleComment = async () => {
    if (!post) return;
    setSending(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase
      .from("community_comment")
      .insert({
        post_id: id,
        content: commentText,
        user_id: session?.user?.id || null,
        parent_id: replyTo,
      });
    setSending(false);
    if (error) {
      addToast({ title: "댓글 등록 실패", description: error.message, color: "danger" });
    } else {
      setCommentText("");
      setReplyTo(null);
      // 목록에 바로 반영
      setComments((prev) => [...prev, { id: Date.now(), content: commentText, likes: 0, created_at: new Date().toISOString(), user_id: session?.user?.id ?? null, parent_id: replyTo }]);
      addToast({ title: "댓글 등록 성공", description: "댓글이 성공적으로 등록되었습니다.", color: "success" });
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
    <div className="flex flex-col items-center w-full max-w-[700px] mx-auto px-4 py-6 pb-32 gap-6">
      {/* 카테고리/Breadcrumb */}
      <div className="w-full">
        <div className="flex items-center gap-2 text-[13px] text-gray-600 mb-3 border-y border-gray-300 py-2">
          <Link href="/community" className="font-semibold hover:underline">커뮤니티</Link>
          {post.category && (
            <>
              <span className="text-gray-300">|</span>
              <span className="font-medium">{post.category}</span>
            </>
          )}
        </div>

        {/* 제목 영역 */}
        <div className="flex justify-between items-start gap-2 mb-2">
          <h1 className="text-[17px] font-semibold break-words flex-1 leading-snug">{post.title}</h1>
          <span className="text-[12px] text-gray-500 whitespace-nowrap">{new Date(post.created_at).toLocaleDateString("ko-KR")} {new Date(post.created_at).toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"})}</span>
        </div>

        {/* 작성자 + 메타 정보 */}
        <div className="flex flex-wrap items-center gap-3 text-[13px] text-gray-700 pb-2 mb-4 border-b border-gray-300">
          <Avatar radius="sm" size="sm" icon={<HiOutlineUser className="w-4 h-4" />} />
          <span className="font-medium mr-2">{post.nickname || authorName}</span>
          <span className="text-gray-500 text-[12px]">조회 수 {post.views || 0}</span>
          <span className="text-gray-500 text-[12px]">추천 수 {post.likes}</span>
          <span className="text-gray-500 text-[12px]">댓글 {commentCnt}</span>
          <button onClick={handleCopyLink} className="ml-auto flex items-center gap-1 text-gray-500 hover:underline text-[12px]">
            <HiOutlineLink className="w-4 h-4" /> 링크 복사
          </button>
        </div>
      </div>

      {/* 본문 */}
      <div
        className="w-full leading-relaxed text-[15px] prose max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

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

      {/* 댓글 목록 */}
      {comments && comments.length > 0 && (
        <div className="w-full flex flex-col gap-4">
          {/* 원댓글 렌더링 */}
          {comments.filter(cc=>!cc.parent_id).map((c) => (
            <div key={c.id} className="flex flex-col gap-2 pb-3 border-b last:border-none">
              {/* 원댓글 */}
              <div className="flex items-start gap-2">
                <HiOutlineUser className="w-6 h-6 text-gray-400 shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <span className="font-medium text-gray-700">익명</span>
                    <span>{new Date(c.created_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</span>
                    {/* like & reply icons */}
                    <button onClick={async()=>{
                      const { data, error } = await supabase.from("community_comment").update({ likes: c.likes+1 }).eq("id", c.id).select().maybeSingle();
                      if(!error && data){setComments(prev=>prev.map(pc=>pc.id===c.id?data:pc));}
                    }} className="flex items-center gap-1 text-gray-500 ml-auto text-[13px]">
                      👍 <span>{c.likes}</span>
                    </button>
                    <button onClick={()=>{setReplyTo(c.id);}} className="text-gray-500 text-[13px]">💬 댓글</button>
                  </div>
                  <p className="text-sm whitespace-pre-wrap break-words">{c.content}</p>
                </div>
              </div>
              {/* 대댓글 목록 */}
              {comments.filter(r=>r.parent_id===c.id).map(r=>(
                <div key={r.id} className="flex items-start gap-2 pl-8 pt-2">
                  <HiOutlineUser className="w-6 h-6 text-gray-400 shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                      <span className="font-medium text-gray-700">익명</span>
                      <span>{new Date(r.created_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</span>
                      <button onClick={async()=>{
                        const { data, error } = await supabase.from("community_comment").update({ likes: r.likes+1 }).eq("id", r.id).select().maybeSingle();
                        if(!error && data){setComments(prev=>prev.map(pc=>pc.id===r.id?data:pc));}
                      }} className="flex items-center gap-1 text-gray-500 ml-auto text-[13px]">
                        👍 <span>{r.likes}</span>
                      </button>
                    </div>
                    <p className="text-sm whitespace-pre-wrap break-words">{r.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* 댓글 쓰기 */}
      <div className="w-full border rounded p-4 bg-gray-50">
        <h2 className="font-semibold mb-2 text-[15px]">{replyTo?"답글 쓰기":"댓글 쓰기"}</h2>
        <textarea
          value={commentText}
          onChange={(e)=>setCommentText(e.target.value)}
          rows={4}
          placeholder='욕설이나 비난 등은 자제 부탁드립니다.'
          className="w-full border rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
        />
        <Button
          color="primary"
          className="w-full mt-3"
          isLoading={sending}
          onPress={handleComment}
        >
          등록
        </Button>
      </div>
    </div>
  );
} 