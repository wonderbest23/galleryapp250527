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

  const generateAnonymousName = (userId, postId) => {
    // postId를 기반으로 각 글마다 다른 익명 번호 생성
    if (!postId) return '익명의1234';
    
    // postId의 해시값을 사용해서 각 글마다 다른 숫자 생성
    let hash = 0;
    for (let i = 0; i < postId.length; i++) {
      const char = postId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit integer로 변환
    }
    const randomNum = Math.abs(hash) % 99999 + 1000; // 1000-99999 범위
    return `익명의${randomNum}`;
  };

  useEffect(() => {
    const fetchCommunityPosts = async () => {
      setLoading(true);
      try {
        // 최신 글 10개 가져온 뒤, 영상/숏폼 제외를 클라이언트에서 필터링
        const { data, error } = await supabase
          .from("community_post")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) {
          console.log("Error fetching community posts:", error);
          console.log("Using sample data due to error");
          setPosts([
            {
              id: 1,
              title: "현대미술 vs 고전미술, 어리분은 어느 쪽을 더 선호하시나요?",
              content: "최근에 루브르 박물관과 유명 롤 기웃는데 확실히 다른 매력이 있더라구요.. 고전 미술은 완성도와 기법이 압도적이고, 현대미술은 창의성과 실험성의 끌리는 것 같아요. 루브르의 허황된 작품들!!",
              author: "아트취향조사단",
              authorAvatar: "",
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
              authorAvatar: "",
              created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              likes: 128,
              comments: 45,
              image_url: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800",
              type: "image"
            }
          ]);
        } else {
          const safeData = Array.isArray(data) ? data : [];
          // 영상 제외 규칙: category === 'short_video' 또는 video_url 존재 시 제외
          const filtered = safeData.filter((p) => {
            const category = p.category || p.type || "";
            const hasVideo = typeof p.video_url === "string" && p.video_url.trim().length > 0;
            return category !== "short_video" && !hasVideo;
          });

          // 관련 프로필 조회 (user_id 수집)
          const userIds = Array.from(new Set(filtered.map(p => p.user_id).filter(Boolean)));
          let profileMap = {};
          if (userIds.length > 0) {
            const { data: profiles, error: pErr } = await supabase
              .from("profiles")
              .select("id, full_name, name, nickname, avatar_url")
              .in("id", userIds);
            if (pErr) {
              console.log("profiles fetch error", pErr);
            } else if (Array.isArray(profiles)) {
              profileMap = profiles.reduce((acc, cur) => {
                acc[cur.id] = cur;
                return acc;
              }, {});
            }
          }

          // 매핑 후 상위 3개만 노출
          const mappedData = filtered.slice(0, 3).map((post) => {
            const prof = post.user_id ? profileMap[post.user_id] : null;
            const authorName = prof?.full_name || prof?.name || prof?.nickname || post.author || post.nickname || "익명 사용자";
            const avatar = prof?.avatar_url || '';
            return {
              id: post.id,
              title: post.title || "제목 없음",
              content: post.content || post.description || "내용 없음",
              // 커뮤니티와 동일하게 profiles 사용
              profiles: prof ? { full_name: prof.full_name || prof.name || prof.nickname || authorName, avatar_url: avatar } : null,
              created_at: post.created_at,
              likes: post.likes || post.likes_count || 0,
              comments: post.comments || post.comments_count || 0,
              image_url: post.image_url || null,
              category: post.category || post.type || 'free',
              video_url: post.video_url || null,
              type: post.type || "text"
            };
          });

          if (mappedData.length > 0) {
            console.log("Using real community posts (synced)");
            setPosts(mappedData);
          } else {
            console.log("No eligible posts (after filter). Using sample data");
            setPosts([
              {
                id: 1,
                title: "현대미술 vs 고전미술, 어리분은 어느 쪽을 더 선호하시나요?",
                content: "최근에 루브르 박물관과 유명 롤 기웃는데 확실히 다른 매력이 있더라구요.. 고전 미술은 완성도와 기법이 압도적이고, 현대미술은 창의성과 실험성의 끌리는 것 같아요. 루브르의 허황된 작품들!!",
                author: "아트취향조사단",
                authorAvatar: "",
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
                authorAvatar: "",
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
        setPosts([
          {
            id: 1,
            title: "현대미술 vs 고전미술, 어리분은 어느 쪽을 더 선호하시나요?",
            content: "최근에 루브르 박물관과 유명 롤 기웃는데 확실히 다른 매력이 있더라구요.. 고전 미술은 완성도와 기법이 압도적이고, 현대미술은 창의성과 실험성의 끌리는 것 같아요. 루브르의 허황된 작품들!!",
            author: "아트취향조사단",
            authorAvatar: "",
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
            authorAvatar: "",
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

    // 실시간 동기화: community_post 테이블 변경 시 재조회
    const channel = supabase
      .channel("community_highlights_sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "community_post" },
        () => {
          // 영상 제외 규칙 유지한 재조회
          fetchCommunityPosts();
        }
      )
      .subscribe();

    return () => {
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        console.log("unsubscribe error", e);
      }
    };
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

  const CATEGORY_LABELS = {
    all: '전체',
    free: '자유',
    exhibition: '전시회',
    short_video: '숏폼',
    discussion: '토론',
    review: '리뷰',
    journalist: '기자단'
  };
  const getCategoryBadgeClass = (category) => {
    const key = CATEGORY_LABELS[category] ? category : (category || '');
    switch (key) {
      case 'discussion':
      case '토론':
        return 'bg-green-100 text-green-700';
      case 'exhibition':
        return 'bg-blue-100 text-blue-700';
      case 'review':
        return 'bg-amber-100 text-amber-700';
      case 'short_video':
        return 'bg-purple-100 text-purple-700';
      case 'journalist':
        return 'bg-slate-100 text-slate-700';
      case 'free':
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white w-full">
      <div className="space-y-4 pt-2">
        {posts.map((post) => {
          const isExpanded = expandedPosts[post.id];
          const needsExpand = post.content && post.content.length > 150;
          const category = post.category || post.type || 'free';
          
          return (
            <div key={post.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* 게시글 헤더 - 인스타그램 스타일 (커뮤니티와 동일) */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {/* 아이콘 제거 */}
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{generateAnonymousName(post.user_id, post.id)}</h3>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getCategoryBadgeClass(category)}`}>
                          {CATEGORY_LABELS[category] || category}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">{getTimeAgo(post.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 게시글 내용 */}
              <div className="p-4">
                <Link href={`/community/${post.id}`}>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h2>
                </Link>
                <p className="text-gray-700 leading-relaxed">
                  {isExpanded || !needsExpand ? post.content : post.content?.slice(0, 150)}
                </p>
                {needsExpand && (
                  <button onClick={() => toggleExpand(post.id)} className="text-blue-500 text-sm font-medium mt-2 hover:text-blue-600 transition-colors">
                    {isExpanded ? '접기' : '더보기...'}
                  </button>
                )}
              </div>

              {/* 이미지 (영상 제외 정책 유지) */}
              {post.image_url && !post.video_url && (
                <div className="bg-gray-100">
                  <img 
                    src={post.image_url}
                    alt={post.title}
                    className="w-full h-auto max-h-96 object-cover"
                  />
                </div>
              )}

              {/* 액션 버튼들 - 인스타그램 스타일 (커뮤니티와 동일) */}
              <div className="p-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <button className="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors">
                      <Heart className="w-5 h-5" />
                      <span className="text-sm font-medium">{post.likes || 0}</span>
                    </button>
                    <button className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors">
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">{post.comments || 0}</span>
                    </button>
                    <button className="flex items-center space-x-1 text-gray-600 hover:text-green-600 transition-colors">
                      <Share className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}