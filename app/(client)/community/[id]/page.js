"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { FiHeart, FiMessageCircle, FiShare2, FiMoreVertical, FiArrowLeft } from "react-icons/fi";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function CommunityPostDetail({ params }) {
  const supabase = createClient();
  const router = useRouter();
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchPost = async () => {
      setIsLoading(true);
      try {
        // 실제 포스트 데이터를 가져오는 쿼리
        const { data, error } = await supabase
          .from("community_post")
          .select(`
            *,
            profiles:user_id(name, avatar_url)
          `)
          .eq("id", params.id)
          .single();

        if (error) {
          console.error("Error fetching post:", error);
          // 에러 시 샘플 데이터 사용
          setPost({
            id: params.id,
            title: "전시 관람 후기",
            content: "방금 다녀온 전시회가 정말 인상적이었습니다. 작가의 새로운 시도와 표현 방식이 돋보였고, 특히 색감과 구도가 매우 인상적이었습니다. 전시장 분위기도 좋았고, 관람객들도 많아서 활기찬 분위기였습니다. 다음에도 이런 전시회가 열리면 꼭 가보고 싶습니다.\n\n작가의 작품 세계를 이해하는 데 도움이 되는 오디오 가이드도 정말 유용했습니다. 각 작품의 배경과 작가의 의도를 자세히 설명해주어서 더욱 깊이 있게 감상할 수 있었습니다.",
            user_id: "test-user-3",
            profiles: { name: "박관람객", avatar_url: null },
            created_at: new Date(Date.now() - 17 * 60 * 60 * 1000).toISOString(),
            likes: 156,
            comments: 23,
            category: "exhibition",
            image_url: null
          });
        } else {
          setPost(data);
        }
      } catch (error) {
        console.error("Error:", error);
        setPost(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchPost();
    }
  }, [params.id]);

  const getTimeAgo = (createdAt) => {
    const now = new Date();
    const postTime = new Date(createdAt);
    const diffInHours = Math.floor((now - postTime) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "방금 전";
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}일 전`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16">
        <div className="bg-white border-b border-gray-200">
          <div className="px-4 py-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="ml-3">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded w-16 mt-1 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4 animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-4/5 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16">
        <div className="bg-white border-b border-gray-200">
          <div className="px-4 py-4">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-3 p-1 hover:bg-gray-100 rounded-full"
              >
                <FiArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-lg font-bold">게시글</h1>
            </div>
          </div>
        </div>
        <div className="p-4 text-center">
          <p className="text-gray-500">게시글을 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="mr-3 p-1 hover:bg-gray-100 rounded-full"
            >
              <FiArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold">게시글</h1>
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="bg-white">
        {/* Post Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">아트</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {post.profiles?.name || "익명"}
              </p>
              <p className="text-xs text-gray-500">
                {getTimeAgo(post.created_at)}
              </p>
            </div>
          </div>
          <button className="p-1">
            <FiMoreVertical className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Post Title */}
        <div className="px-4 py-3 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-900">
            {post.title}
          </h1>
        </div>

        {/* Post Content */}
        <div className="px-4 py-4">
          <div className="text-gray-900 leading-relaxed">
            <p className="whitespace-pre-wrap">
              {post.content}
            </p>
          </div>
        </div>

        {/* Post Actions */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <div className="flex items-center space-x-6">
            <button className="flex items-center space-x-2">
              <FiHeart className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500">{post.likes || 0}</span>
            </button>
            <button className="flex items-center space-x-2">
              <FiMessageCircle className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500">{post.comments || 0}</span>
            </button>
            <button className="flex items-center space-x-2">
              <FiShare2 className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="bg-white mt-2">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-medium text-gray-900">댓글 {post.comments || 0}개</h3>
        </div>
        <div className="p-4 text-center text-gray-500">
          <p>아직 댓글이 없습니다.</p>
        </div>
      </div>
    </div>
  );
}