"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { Heart, MessageCircle, Share, MoreHorizontal } from 'lucide-react';

export function CommunityHighlights() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPosts, setExpandedPosts] = useState({}); // 각 게시글의 확장 상태 관리
  const supabase = createClient();

  useEffect(() => {
    const fetchCommunityPosts = async () => {
      setLoading(true);
      try {
        // 커뮤니티 포스트 데이터를 가져오는 쿼리
        const { data, error } = await supabase
          .from("community_post")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(3);

        if (error) {
          console.log("Error fetching community posts:", error);
          console.log("Using sample data due to error");
          // 에러 시 샘플 데이터 사용
          setPosts([
            {
              id: 1,
              title: "현대미술 vs 고전미술, 어리분은 어느 쪽을 더 선호하시나요?",
              content: "최근에 루브르 박물관과 유명 롤 기웃는데 확실히 다른 매력이 있더라구요.. 고전 미술은 완성도와 기법이 압도적이고, 현대미술은 창의성과 실험성의 끌리는 것 같아요. 루브르의 허황된 작품들!!",
              author: "아트취향조사단",
              created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              likes: 145,
              comments: 67,
              image_url: null,
              type: "text"
            },
            {
              id: 2,
              title: "오늘 MZ세대는 왜 클래식한 작품보다 미디어아트를 좋아할까요?",
              content: "최근에 팀파티나 디지털의 갑은 곳이 인가가 많았어요. 저희 부모님은 '그게 무슨 예술이야'라고 하시는데, 전 오히려 새롭고 재미있더라구요. 인터랙티브하고 SNS에 올리기도 좋고... 전통 미술과 디지털 아트, 어떤 게 더 가치 있다고 생각하세요?",
              author: "MZ미술관러",
              created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              likes: 128,
              comments: 45,
              image_url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800",
              type: "image"
            }
          ]);
        } else {
          if (data && data.length > 0) {
            console.log("Using real community posts");
            const mappedData = data.map((post) => ({
              id: post.id,
              title: post.title || "제목 없음",
              content: post.content || "내용 없음",
              author: post.author || "사용자",
              created_at: post.created_at,
              likes: post.likes || 0,
              comments: post.comments || 0,
              image_url: post.image_url,
              type: post.type || "text"
            }));
            setPosts(mappedData);
          } else {
            console.log("No real community posts found, using sample data");
            // 실제 데이터가 없으면 샘플 데이터 사용
            setPosts([
              {
                id: 1,
                title: "현대미술 vs 고전미술, 어리분은 어느 쪽을 더 선호하시나요?",
                content: "최근에 루브르 박물관과 유명 롤 기웃는데 확실히 다른 매력이 있더라구요.. 고전 미술은 완성도와 기법이 압도적이고, 현대미술은 창의성과 실험성의 끌리는 것 같아요. 루브르의 허황된 작품들!!",
                author: "아트취향조사단",
                created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                likes: 145,
                comments: 67,
                image_url: null,
                type: "text"
              },
              {
                id: 2,
                title: "오늘 MZ세대는 왜 클래식한 작품보다 미디어아트를 좋아할까요?",
                content: "최근에 팀파티나 디지털의 갑은 곳이 인가가 많았어요. 저희 부모님은 '그게 무슨 예술이야'라고 하시는데, 전 오히려 새롭고 재미있더라구요. 인터랙티브하고 SNS에 올리기도 좋고... 전통 미술과 디지털 아트, 어떤 게 더 가치 있다고 생각하세요?",
                author: "MZ미술관러",
                created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                likes: 128,
                comments: 45,
                image_url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800",
                type: "image"
              }
            ]);
          }
        }
      } catch (error) {
        console.log("Error:", error);
        console.log("Using sample data due to catch error");
        // 에러 시 샘플 데이터 사용
        setPosts([
          {
            id: 1,
            title: "현대미술 vs 고전미술, 어리분은 어느 쪽을 더 선호하시나요?",
            content: "최근에 루브르 박물관과 유명 롤 기웃는데 확실히 다른 매력이 있더라구요.. 고전 미술은 완성도와 기법이 압도적이고, 현대미술은 창의성과 실험성의 끌리는 것 같아요. 루브르의 허황된 작품들!!",
            author: "아트취향조사단",
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            likes: 145,
            comments: 67,
            image_url: null,
            type: "text"
          },
          {
            id: 2,
            title: "오늘 MZ세대는 왜 클래식한 작품보다 미디어아트를 좋아할까요?",
            content: "최근에 팀파티나 디지털의 갑은 곳이 인가가 많았어요. 저희 부모님은 '그게 무슨 예술이야'라고 하시는데, 전 오히려 새롭고 재미있더라구요. 인터랙티브하고 SNS에 올리기도 좋고... 전통 미술과 디지털 아트, 어떤 게 더 가치 있다고 생각하세요?",
            author: "MZ미술관러",
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            likes: 128,
            comments: 45,
            image_url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800",
            type: "image"
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityPosts();
  }, []);

  const getTimeAgo = (createdAt) => {
    const now = new Date();
    const postTime = new Date(createdAt);
    const diffInMinutes = Math.floor((now - postTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return "방금 전";
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}일 전`;
  };

  // 더보기/접기 토글 함수
  const toggleExpand = (postId) => {
    setExpandedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  if (loading) {
    return (
      <div className="bg-white w-full">
        <div className="space-y-0">
          {[...Array(2)].map((_, index) => (
            <div key={index} className="border-b-8 border-gray-100 animate-pulse">
              <div className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
              <div className="px-4 pb-3">
                <div className="h-5 bg-gray-200 rounded mb-2"></div>
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
              <div className="px-4 py-3">
                <div className="flex items-center gap-6">
                  <div className="h-4 bg-gray-200 rounded w-12"></div>
                  <div className="h-4 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white w-full">
      <div className="space-y-0 pt-4">
        {posts.map((post) => {
          const isExpanded = expandedPosts[post.id];
          // 글자 수로 더보기 버튼 필요 여부 판단 (약 150자 = 3줄)
          const needsExpand = post.content && post.content.length > 150;
          
          return (
            <div key={post.id} className="border-b-8 border-gray-100">
              {/* 작성자 헤더 */}
              <div className="flex items-center gap-3 p-4">
                {/* 프로필 이미지 */}
                <img 
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(post.author)}&background=random`}
                  alt={post.author}
                  className="w-10 h-10 rounded-full object-cover" 
                />
                
                {/* 작성자 정보 */}
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900">{post.author}</p>
                  <p className="text-xs text-gray-500">{getTimeAgo(post.created_at)}</p>
                </div>
                
                {/* 더보기 메뉴 */}
                <button className="text-gray-400 p-1 hover:bg-gray-100 rounded-full transition-colors">
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>

              {/* 게시글 본문 */}
              <div className="px-4 pb-3">
                {/* 제목 (클릭 시 상세 페이지로 이동) */}
                <Link href={`/community/${post.id}`}>
                  <h3 className="font-semibold text-lg mb-2 text-gray-900 hover:text-blue-600 transition-colors">
                    {post.title}
                  </h3>
                </Link>
                
                {/* 본문 내용 */}
                <div className="text-gray-800 text-sm leading-relaxed">
                  <div className={isExpanded || !needsExpand ? "" : "line-clamp-3"}>
                    {post.content}
                  </div>
                  {needsExpand && (
                    <button 
                      onClick={() => toggleExpand(post.id)}
                      className="text-blue-500 text-sm font-medium mt-2 hover:text-blue-600 transition-colors"
                    >
                      {isExpanded ? "접기" : "더보기..."}
                    </button>
                  )}
                </div>
              </div>

              {/* 이미지/영상 (선택적) */}
              {post.image_url && (
                <div className="bg-gray-100">
                  <img 
                    src={post.image_url}
                    alt={post.title}
                    className="w-full max-h-[500px] object-contain" 
                  />
                </div>
              )}

              {/* 액션 버튼 영역 */}
              <div className="flex items-center justify-between px-4 py-3">
                {/* 좌측: 좋아요 + 댓글 */}
                <div className="flex items-center gap-6 text-gray-600">
                  {/* 좋아요 버튼 */}
                  <button className="flex items-center gap-2 transition-colors hover:text-red-500">
                    <Heart className="w-5 h-5" />
                    <span className="text-sm font-medium">{post.likes}</span>
                  </button>
                  
                  {/* 댓글 버튼 */}
                  <button className="flex items-center gap-2 transition-colors hover:text-blue-500">
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">{post.comments}</span>
                  </button>
                </div>
                
                {/* 우측: 공유 버튼 */}
                <button className="text-gray-600 hover:text-green-500 transition-colors">
                  <Share className="w-5 h-5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
