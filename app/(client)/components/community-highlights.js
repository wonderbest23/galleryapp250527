"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { FaHeart, FaComment } from "react-icons/fa";

export function CommunityHighlights() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchCommunityPosts = async () => {
      setLoading(true);
      try {
        // 커뮤니티 포스트 데이터를 가져오는 쿼리
        const { data, error } = await supabase
          .from("community_post")
          .select(`
            *,
            profiles:user_id(name, avatar_url)
          `)
          .order("created_at", { ascending: false })
          .limit(4);

        if (error) {
          console.error("Error fetching community posts:", error);
          // 에러 시 샘플 데이터 사용
          setPosts([
            {
              id: 1,
              title: "전시 관람 후기",
              content: "방금 다녀온 전시회가 정말 인상적이었...",
              author: "박관람객",
              created_at: new Date(Date.now() - 17 * 60 * 60 * 1000).toISOString(),
              category: "숏폼",
              likes: 156,
              comments: 23,
              image_url: null,
              type: "video"
            },
            {
              id: 2,
              title: "오늘의 작업실",
              content: "새로운 작품 작업 중입니다! 여러분의 ...",
              author: "김작가",
              created_at: new Date(Date.now() - 17 * 60 * 60 * 1000).toISOString(),
              category: "작품",
              likes: 24,
              comments: 5,
              image_url: null,
              type: "image"
            },
            {
              id: 3,
              title: "처음 작품 구매해봤어요",
              content: "아트샵에서 김작가님의 추상화를 구매...",
              author: "신규컬렉터",
              created_at: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
              category: "작품",
              likes: 23,
              comments: 12,
              image_url: null,
              type: "text"
            },
            {
              id: 4,
              title: "전시회 관람 팁 공유",
              content: "전시회 갈 때 꼭 오디오 가이드 들으세...",
              author: "문화애호가",
              created_at: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
              category: "토론",
              likes: 22,
              comments: 7,
              image_url: null,
              type: "text"
            }
          ]);
        } else {
          // 실제 데이터가 있으면 사용, 없으면 샘플 데이터 사용
          if (data && data.length > 0) {
            const mappedData = data.map((post, index) => ({
              id: post.id,
              title: post.title || "제목 없음",
              content: post.content || "내용 없음",
              author: post.profiles?.name || "익명",
              created_at: post.created_at,
              category: post.category || ["숏폼", "작품", "토론"][index % 3],
              likes: post.likes || Math.floor(Math.random() * 200),
              comments: post.comments || Math.floor(Math.random() * 50),
              image_url: post.image_url,
              type: post.type || "text"
            }));
            setPosts(mappedData);
          } else {
            // 실제 데이터가 없으면 샘플 데이터 사용
            setPosts([
              {
                id: 1,
                title: "전시 관람 후기",
                content: "방금 다녀온 전시회가 정말 인상적이었...",
                author: "박관람객",
                created_at: new Date(Date.now() - 17 * 60 * 60 * 1000).toISOString(),
                category: "숏폼",
                likes: 156,
                comments: 23,
                image_url: null,
                type: "video"
              },
              {
                id: 2,
                title: "오늘의 작업실",
                content: "새로운 작품 작업 중입니다! 여러분의 ...",
                author: "김작가",
                created_at: new Date(Date.now() - 17 * 60 * 60 * 1000).toISOString(),
                category: "작품",
                likes: 24,
                comments: 5,
                image_url: null,
                type: "image"
              },
              {
                id: 3,
                title: "처음 작품 구매해봤어요",
                content: "아트샵에서 김작가님의 추상화를 구매...",
                author: "신규컬렉터",
                created_at: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
                category: "작품",
                likes: 23,
                comments: 12,
                image_url: null,
                type: "text"
              },
              {
                id: 4,
                title: "전시회 관람 팁 공유",
                content: "전시회 갈 때 꼭 오디오 가이드 들으세...",
                author: "문화애호가",
                created_at: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
                category: "토론",
                likes: 22,
                comments: 7,
                image_url: null,
                type: "text"
              }
            ]);
          }
        }
      } catch (error) {
        console.error("Error:", error);
        // 에러 시 샘플 데이터 사용
        setPosts([
          {
            id: 1,
            title: "전시 관람 후기",
            content: "방금 다녀온 전시회가 정말 인상적이었...",
            author: "박관람객",
            created_at: new Date(Date.now() - 17 * 60 * 60 * 1000).toISOString(),
            category: "숏폼",
            likes: 156,
            comments: 23,
            image_url: null,
            type: "video"
          },
          {
            id: 2,
            title: "오늘의 작업실",
            content: "새로운 작품 작업 중입니다! 여러분의 ...",
            author: "김작가",
            created_at: new Date(Date.now() - 17 * 60 * 60 * 1000).toISOString(),
            category: "작품",
            likes: 24,
            comments: 5,
            image_url: null,
            type: "image"
          },
          {
            id: 3,
            title: "처음 작품 구매해봤어요",
            content: "아트샵에서 김작가님의 추상화를 구매...",
            author: "신규컬렉터",
            created_at: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
            category: "작품",
            likes: 23,
            comments: 12,
            image_url: null,
            type: "text"
          },
          {
            id: 4,
            title: "전시회 관람 팁 공유",
            content: "전시회 갈 때 꼭 오디오 가이드 들으세...",
            author: "문화애호가",
            created_at: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
            category: "토론",
            likes: 22,
            comments: 7,
            image_url: null,
            type: "text"
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityPosts();
  }, []);

  const getCategoryColor = (category) => {
    switch (category) {
      case "숏폼":
        return "bg-red-100 text-red-800";
      case "작품":
        return "bg-purple-100 text-purple-800";
      case "토론":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTimeAgo = (createdAt) => {
    const now = new Date();
    const postTime = new Date(createdAt);
    const diffInHours = Math.floor((now - postTime) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "방금 전";
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}일 전`;
  };

  if (loading) {
    return (
      <div className="w-[90%] grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 animate-pulse">
            <div className="h-24 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-[90%] grid grid-cols-2 gap-3">
      {posts.map((post) => (
        <Link key={post.id} href={`/community/${post.id}`} className="block">
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            {/* 이미지/비디오 영역 */}
            <div className="relative h-24 bg-gray-100 rounded mb-2 flex items-center justify-center">
              {post.image_url ? (
                <Image
                  src={post.image_url}
                  alt={post.title}
                  width={200}
                  height={96}
                  className="w-full h-full object-cover rounded"
                />
              ) : (
                <div className="text-gray-400 text-2xl">
                  {post.type === "video" ? "▶️" : post.type === "image" ? "🖼️" : "💬"}
                </div>
              )}
              
              {/* 카테고리 태그 */}
              <div className="absolute top-1 left-1">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getCategoryColor(post.category)}`}>
                  {post.category}
                </span>
              </div>
            </div>

            {/* 제목 */}
            <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">
              {post.title}
            </h3>

            {/* 내용 미리보기 */}
            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
              {post.content}
            </p>

            {/* 작성자와 시간 */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">{post.author}</span>
              <span className="text-xs text-gray-400">{getTimeAgo(post.created_at)}</span>
            </div>

            {/* 좋아요와 댓글 수 */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <FaHeart className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">{post.likes}</span>
              </div>
              <div className="flex items-center gap-1">
                <FaComment className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">{post.comments}</span>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
