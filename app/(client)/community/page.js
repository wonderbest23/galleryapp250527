"use client";
import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/utils/supabase/client";
// import { useScrollToTop } from "./components/ScrollToTop";
import { Heart, MessageCircle, Share, Plus, MoreHorizontal, Flame, Volume2, VolumeX } from 'lucide-react';
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { PostReportModal } from "../components/post-report-modal";
import JournalistApplicationPopup from "../mypage/success/components/JournalistApplicationPopup";
import VideoPlayer from "./components/VideoPlayer";
import Head from "next/head";
import { generateSEOMeta, PAGE_SEO } from "@/utils/seo";
import { ReviewCards } from "../components/review-cards";
// 리뷰 데이터를 커뮤니티 게시글 카드 형태로 보여주는 간단한 피드 컴포넌트
function ReviewFeedCards() {
  const supabase = createClient();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const maskName = (name) => {
    if (!name) return '익명 사용자';
    if (name.includes('@')) {
      const e = name.split('@')[0];
      return e.length > 1 ? e[0] + '**' : e;
    }
    return name.length > 1 ? name[0] + '**' : name;
  };

  const cleanContent = (content) => {
    if (!content || typeof content !== 'string') return '';
    let t = content;
    const patterns = [
      /\[커스텀\s*리뷰\][^\n]*?/gi,
      /\[커스텀\s*전시회\][^\n]*?/gi,
      /\[Custom\s*Review\][^\n]*?/gi,
      /전시회:\s*[^,\n]*,?/gi,
      /갤러리:\s*[^,\n]*,?/gi,
      /장소:\s*[^,\n]*,?/gi,
      /제목:\s*[^,\n]*,?/gi,
      /방문일:\s*[^,\n]*,?/gi
    ];
    patterns.forEach(p=>{ t = t.replace(p,''); });
    t = t.replace(/\s+/g,' ').trim();
    return t;
  };

  const formatRelative = (iso) => {
    try {
      const d = new Date(iso);
      const diffMs = Date.now() - d.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays < 1) {
        const h = Math.floor(diffMs / (1000 * 60 * 60));
        if (h <= 0) return '방금 전';
        return `${h}시간 전`;
      }
      if (diffDays < 30) return `${diffDays}일 전`;
      const months = Math.floor(diffDays / 30);
      return `${months}달 전`;
    } catch { return ''; }
  };

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('exhibition_review')
        .select(`*, exhibition:exhibition_id(id, contents, photo)`) 
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(20);
      if (!error) setItems(data || []);
      setLoading(false);
    };
    fetchReviews();
  }, []);

  if (loading) return (
    <div className="space-y-4">
      {[1,2,3].map(i => (
        <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 animate-pulse">
          <div className="h-4 bg-gray-200 w-1/3 mb-3"/>
          <div className="h-3 bg-gray-200 w-2/3 mb-2"/>
          <div className="h-3 bg-gray-200 w-1/2"/>
        </div>
      ))}
    </div>
  );

  if (!items || items.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">아직 승인된 리뷰가 없습니다.</div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((rv) => (
        <div key={rv.id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
          {/* 헤더 */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gray-300 text-white flex items-center justify-center">
                  <span className="font-semibold text-gray-700">{maskName(rv.name||'U')[0]}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">{maskName(rv.name)}</h3>
                    <span className="text-xs text-gray-500">{formatRelative(rv.created_at)}</span>
                  </div>
                </div>
              </div>
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">리뷰</span>
            </div>
          </div>
          {/* 본문 */}
          <div className="p-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">{rv.exhibition?.contents || '전시회 리뷰'}</h4>
            <p className="text-gray-700 text-base leading-relaxed whitespace-pre-wrap">{cleanContent(rv.description || rv.content || '리뷰 내용')}</p>

            {/* 이미지 섹션: 내용 하단에 전체 표시 */}
            {(() => {
              let urls = [];
              if (rv.proof_images && Array.isArray(rv.proof_images)) {
                urls = rv.proof_images;
              } else if (rv.images && Array.isArray(rv.images)) {
                urls = rv.images;
              } else if (typeof rv.images === 'string') {
                try { const arr = JSON.parse(rv.images); if (Array.isArray(arr)) urls = arr; } catch {}
                if (urls.length === 0 && rv.images.includes(',')) urls = rv.images.split(',').map(v=>v.trim());
              } else if (rv.proof_image) {
                urls = [rv.proof_image];
              }
              if (urls.length === 0 && rv.exhibition?.photo) urls = [rv.exhibition.photo];
              if (urls.length === 0) return null;
              return (
                <div className="mt-3 space-y-3">
                  {urls.map((u, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={u} alt={`리뷰 이미지 ${i+1}`} className="w-full h-auto rounded-lg object-cover" />
                  ))}
                </div>
              );
            })()}
          </div>
          {/* 액션바 */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center space-x-6 text-gray-600">
              <button className="flex items-center space-x-1 hover:text-red-600 transition-colors" onClick={()=>window.location.href=`/community/${rv.id}`}><Heart className="w-5 h-5"/><span className="text-sm">{rv.likes || 0}</span></button>
              <button className="flex items-center space-x-1 hover:text-blue-600 transition-colors" onClick={()=>window.location.href=`/community/${rv.id}`}><MessageCircle className="w-5 h-5"/><span className="text-sm">댓글</span></button>
              <button className="flex items-center space-x-1 hover:text-green-600 transition-colors" onClick={()=>navigator.share?navigator.share({title:rv.title||'커뮤니티',url:`/community/${rv.id}`}):navigator.clipboard.writeText(`/community/${rv.id}`)}><Share className="w-5 h-5"/></button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// 카테고리 한글 라벨 매핑
const CATEGORY_LABELS = {
  all: '전체',
  free: '자유',
  exhibition: '전시회',
  discussion: '토론',
  '토론': '토론',
  review: '리뷰',
  journalist: '기자단'
};

// 카테고리 뱃지 스타일 (필요 시 카테고리별 색상 확장 가능)
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
    case 'journalist':
      return 'bg-slate-100 text-slate-700';
    case 'free':
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

// 상대 시간 포맷터 (예: 7일 전)
const getRelativeTime = (dateString) => {
  try {
    const date = new Date(dateString);
    const diffMs = Date.now() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 1) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours <= 0) return '방금 전';
      return `${diffHours}시간 전`;
    }
    return `${diffDays}일 전`;
  } catch (_) {
    return '';
  }
};

// 카테고리별 임시 더미 포스트 생성
const makeDummyPosts = (category, count = 3) => {
  const korean = CATEGORY_LABELS[category] || '전체';
  const samples = [
    {
      title: `${korean} 커뮤니티에서 나눠요` ,
      content: `오늘 전시 다녀온 소감 한 줄로 남겨요. 관람 동선과 조명이 특히 좋았어요. 여러분은 어떠셨나요?`,
    },
    {
      title: `${korean} 이야기 모음` ,
      content: `최근 트렌드가 확실히 보이는 듯합니다. 작은 변화들이 관람 경험을 바꾸네요.`,
    },
    {
      title: `${korean} 톡톡`,
      content: `가볍게 한마디 남겨요. 좋은 공간과 작품은 결국 사람을 불러 모으네요.`,
    },
  ];
  return Array.from({ length: count }).map((_, i) => ({
    id: `dummy-${category}-${i}-${Math.random().toString(36).slice(2,8)}`,
    user_id: null,
    category,
    title: samples[i % samples.length].title,
    content: samples[i % samples.length].content,
    created_at: new Date(Date.now() - (i + 1) * 86400000).toISOString(),
    profiles: {
      full_name: ['아트취향조사단','익명 사용자','갤러리러버'][i % 3],
      avatar_url: null
    }
  }));
};

// 실시간 인기글 캐러셀 컴포넌트
function TrendingPostsCarousel({ posts }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // 실제 DB 데이터를 우선 사용, 없으면 샘플 데이터
  const displayPosts = posts && posts.length > 0 ? posts : [
    { id: "129daaba-5be3-4cd5-af72-63b2e3157bb0", title: "요즘 미술시장 어떻게 보세요", content: "작년보단 조용하지만 꾸준히 보이네요. 디지털 작품을 소장한다는 감각이 아직 낯선 분들도 많고요.", views: 1245, likes: 89 },
    { id: "aebc75c9-0d43-4cb5-9347-48c54ed73247", title: "작품 설명이 구매에 주는 영향", content: "캡션 높이와 조도가 안정적이라 읽고 보기 편했습니다. 동선이 막히지 않게 작은 여유 공간을 둔 것도 좋았고요.", views: 567, likes: 45 },
    { id: "a23b51f4-8873-4061-9f93-7dd37e2f9d86", title: "전시 동선과 조도 얘기", content: "전시장의 동선과 조도는 관람객의 경험에 큰 영향을 미칩니다. 적절한 조명과 흐름이 중요해요.", views: 234, likes: 18 },
    { id: "00fa6277-7d1a-46c0-b78d-fdd51047ee25", title: "드로잉 입문하면서 느낀 점", content: "드로잉을 시작하면서 느낀 점들을 공유해보세요. 초보자도 쉽게 따라할 수 있는 팁들이 있으면 좋겠어요.", views: 189, likes: 23 },
    { id: "180d3bfe-1fd2-43ae-aeab-4f353eaf2030", title: "레지던시 다녀오고 남는 것", content: "레지던시 프로그램을 경험한 후 느낀 점과 배운 것들을 공유해보세요.", views: 345, likes: 67 }
  ];
  
  useEffect(() => {
    if (!displayPosts || displayPosts.length <= 1) {
      // 0개 또는 1개면 회전 애니메이션 불필요
      return;
    }
    const interval = setInterval(() => {
      setIsAnimating(true);
      // 애니메이션 완료 후 다음 인덱스로 변경
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % displayPosts.length);
        setIsAnimating(false);
      }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, [displayPosts && displayPosts.length]);
  
  if (!displayPosts || displayPosts.length === 0) return null;
  const currentPost = displayPosts[currentIndex] || displayPosts[0];
  
  return (
    <div className="bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors p-3">
      <div className="relative overflow-hidden">
        <Link href={`/community/${currentPost.id}`} className="block cursor-pointer">
          <div
            className={`flex items-center gap-3 transform transition-all duration-300 ${
              isAnimating ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'
            }`}
          >
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
              {currentIndex + 1}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">{currentPost.title}</h3>
              <p className="text-sm text-gray-500 mt-1 line-clamp-1">{currentPost.content}</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

function CommunityPageContent() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 페이지 진입 시 최상단으로 스크롤
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const [activeTab, setActiveTab] = useState('all');
  const [posts, setPosts] = useState([]);
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [mutedVideos, setMutedVideos] = useState({});
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [selectedPostTitle, setSelectedPostTitle] = useState("");
  const [showJournalistApplication, setShowJournalistApplication] = useState(false);
  
  // 댓글 관련 상태
  const [showComments, setShowComments] = useState({});
  const [commentText, setCommentText] = useState({});
  const [submittingComment, setSubmittingComment] = useState({});
  const [postComments, setPostComments] = useState({}); // 각 게시글의 댓글 목록
  const [replyTo, setReplyTo] = useState({}); // 대댓글 대상 댓글 ID
  const [lastCommentTimes, setLastCommentTimes] = useState({}); // 댓글 스팸 방지용 (postId별)
  
  // 광고 배너 상태
  const [adBanner, setAdBanner] = useState(null);
  const [adBanners, setAdBanners] = useState([]);
  const [hideJournalBanner, setHideJournalBanner] = useState(false);

  const tabs = [
    { id: 'all', label: '전체' },
    { id: 'free', label: '자유' },
    { id: 'exhibition', label: '전시회' },
    { id: 'discussion', label: '토론' },
    { id: 'review', label: '리뷰' },
    { id: 'journalist', label: '기자단' }
  ];

  useEffect(() => {
    const tab = searchParams.get('tab');
    console.log('URL 파라미터 tab:', tab);
    if (tab && ['all', 'exhibition', 'discussion', 'free', 'review'].includes(tab)) {
      console.log('탭 변경:', activeTab, '->', tab);
      setActiveTab(tab);
    }
    setIsInitialized(true);
  }, [searchParams]);

  useEffect(() => {
    // 페이지 진입 시 최상단으로 스크롤
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    initUser();
    fetchTrendingPosts();
    fetchAdBanner();
    fetchAdBanners();
  }, []);

  // 초기화 완료 후에만 fetchPosts 호출
  useEffect(() => {
    if (isInitialized) {
      console.log('초기화 완료, activeTab:', activeTab);
      fetchPosts();
    }
  }, [activeTab, isInitialized]);

  // posts 상태 변경 감지
  useEffect(() => {
    console.log('posts 상태 변경됨:', posts.length, '개 항목');
    console.log('첫 번째 항목:', posts[0]);
  }, [posts]);

  const fetchTrendingPosts = async () => {
    try {
      // 트렌딩 포스트 가져오기 (좋아요 수 기준)
      const { data, error } = await supabase
        .from('community_post')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('트렌딩 포스트 조회 오류:', error);
        return;
      }

      // profiles 정보를 별도로 가져와서 병합
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(post => post.user_id).filter(id => id))];
        
        if (userIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', userIds);
          
          if (!profilesError && profiles) {
            const profilesMap = {};
            profiles.forEach(profile => {
              profilesMap[profile.id] = profile;
            });
            
            // 게시글에 profiles 정보 병합
            const postsWithProfiles = data.map(post => ({
              ...post,
              profiles: post.user_id ? profilesMap[post.user_id] : null
            }));
            
            console.log('트렌딩 포스트:', postsWithProfiles);
            setTrendingPosts(postsWithProfiles);
            return;
          }
        }
      }

      console.log('트렌딩 포스트:', data);
      setTrendingPosts(data || []);
    } catch (error) {
      console.error('트렌딩 포스트 조회 중 오류:', error);
    }
  };

  const fetchAdBanner = async () => {
    try {
      const { data, error } = await supabase
        .from('gallery_notification')
        .select('*')
        .eq('type', 'banner')
        .eq('is_active', true)
        .order('id', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setAdBanner(data);
      }
    } catch (error) {
      console.log('광고 배너 조회 오류');
    }
  };

  const fetchAdBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('gallery_notification')
        .select('*')
        .eq('type', 'ad_banner')
        .eq('is_active', true)
        .order('id', { ascending: false })
        .limit(3);

      if (!error && data) {
        setAdBanners(data);
      }
    } catch (error) {
      console.log('광고 배너들 조회 오류');
    }
  };

  const fetchPosts = async () => {
    try {
      console.log('fetchPosts 호출됨, activeTab:', activeTab);
      
      let query = supabase
        .from('community_post')
        .select('*');

      // 카테고리별 필터링
      if (activeTab !== 'all' && activeTab !== 'review') {
        const categoryMap = {
          'free': 'free',
          'exhibition': 'exhibition',
          'discussion': '토론',
          'review': 'review',
          'journalist': 'journalist'
        };
        
        if (categoryMap[activeTab]) {
          query = query.eq('category', categoryMap[activeTab]);
        }
      }

      // 리뷰 탭은 커뮤니티 게시판이 아닌 메인 리뷰 카드 섹션을 사용하므로 별도 쿼리 불필요
      if (activeTab === 'review') {
        query = query.eq('category', 'review');
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('게시글 조회 오류:', error);
        return;
      }

      // 각 게시글의 댓글 수 계산
      if (data && data.length > 0) {
        const postIds = data.map(post => post.id);
        const { data: commentCounts, error: commentError } = await supabase
          .from('community_comments')
          .select('post_id')
          .in('post_id', postIds);

        if (!commentError && commentCounts) {
          // post_id별 댓글 수 계산
          const commentCountMap = {};
          commentCounts.forEach(comment => {
            commentCountMap[comment.post_id] = (commentCountMap[comment.post_id] || 0) + 1;
          });

          // 게시글에 댓글 수 추가
          data.forEach(post => {
            post.comments_count = commentCountMap[post.id] || 0;
          });
        }
      }

      // 사용자 정보 및 좋아요 상태 가져오기
      if (data && data.length > 0) {
        const { data: { user } } = await supabase.auth.getUser();
        const userIds = [...new Set(data.map(post => post.user_id).filter(id => id))];
        
        // profiles 정보 가져오기
        if (userIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', userIds);
          
          if (!profilesError && profiles) {
            const profilesMap = {};
            profiles.forEach(profile => {
              profilesMap[profile.id] = profile;
            });
            
            // 사용자의 좋아요 상태 가져오기
            let userLikes = {};
            if (user) {
              const postIds = data.map(post => post.id);
              const { data: likes, error: likesError } = await supabase
                .from('community_likes')
                .select('post_id')
                .eq('user_id', user.id)
                .in('post_id', postIds);
              
              if (!likesError && likes) {
                likes.forEach(like => {
                  userLikes[like.post_id] = true;
                });
              }
            }
            
            // 게시글에 profiles 정보 및 좋아요 상태 병합
            const postsWithProfiles = data.map(post => ({
              ...post,
              profiles: post.user_id ? profilesMap[post.user_id] : null,
              user_liked: userLikes[post.id] || false
            }));
            
            console.log('조회된 게시글:', postsWithProfiles.length, '개');
            setPosts(postsWithProfiles);
            return;
          }
        }
      }

      let result = data || [];

      // 활성 탭에 게시글이 없으면 더미 데이터로 채움 (UI 확인용)
      if ((activeTab !== 'all') && result.filter(p => p.category === activeTab).length === 0) {
        result = result.concat(makeDummyPosts(activeTab, 3));
      }

      console.log('조회된 게시글:', result?.length, '개');
      setPosts(result);
    } catch (error) {
      console.error('게시글 조회 중 오류:', error);
    }
  };

  const toggleMute = (postId) => {
    setMutedVideos(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handleReport = (postId, postTitle) => {
    setSelectedPostId(postId);
    setSelectedPostTitle(postTitle);
    setShowReportModal(true);
  };

  // 좋아요 기능
  const handleLike = async (postId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('로그인이 필요합니다.');
        return;
      }

      // 자기 게시글 좋아요 방지
      const targetPost = posts.find(post => post.id === postId);
      if (targetPost && user.id === targetPost.user_id) {
        alert('본인 게시글에는 좋아요를 누를 수 없습니다.');
        return;
      }

      // UI 즉시 업데이트 (낙관적 업데이트)
      setPosts(prevPosts => prevPosts.map(post => {
        if (post.id === postId) {
          const newLiked = !post.user_liked;
          return {
            ...post,
            user_liked: newLiked,
            likes: newLiked ? (post.likes || 0) + 1 : Math.max(0, (post.likes || 0) - 1)
          };
        }
        return post;
      }));

      // 좋아요 토글
      const { error } = await supabase.rpc('like_post_once', {
        p_post_id: postId,
        p_user_id: user.id
      });

      if (error) {
        console.error('좋아요 처리 오류:', error);
        // 오류 시 원래 상태로 되돌리기
        fetchPosts();
        return;
      }

      // 성공 시 최신 데이터로 동기화
      fetchPosts();
    } catch (error) {
      console.error('좋아요 처리 중 오류:', error);
      // 오류 시 원래 상태로 되돌리기
      fetchPosts();
    }
  };

  // 공유 기능
  const handleShare = async (post) => {
    try {
      const shareData = {
        title: post.title,
        text: post.content,
        url: `${window.location.origin}/community/${post.id}`,
      };

      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Web Share API가 지원되지 않는 경우 클립보드에 복사
        await navigator.clipboard.writeText(shareData.url);
        alert('링크가 클립보드에 복사되었습니다.');
      }
    } catch (error) {
      console.error('공유 중 오류 발생:', error);
    }
  };

  // 댓글 가져오기 함수
  const fetchComments = async (postId) => {
    try {
      console.log('댓글 가져오기 시작, post_id:', postId);
      const { data: comments, error } = await supabase
        .from('community_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('댓글 가져오기 오류:', error);
        return;
      }

      console.log('댓글 가져오기 성공:', comments?.length || 0, '개');
      setPostComments(prev => ({
        ...prev,
        [postId]: comments || []
      }));
    } catch (error) {
      console.error('댓글 가져오기 예외:', error);
    }
  };

  // 스팸 방지 함수들
  const checkSpamWords = (text) => {
    const spamWords = [
      '광고', '홍보', '판매', '구매', '거래', '돈', '돈벌이', '수익', '부업',
      '스팸', '도배', '반복', '클릭', '링크', '사이트', '무료', '이벤트',
      '카지노', '도박', '로또', '복권', '대출', '보험', '투자', '주식',
      '성인', '야동', '야사', '음란', '섹스', '성관계', '유흥', '마사지',
      '바이럴', '마케팅', '프로모션', '세일', '할인', '쿠폰', '적립금',
      'www.', 'http://', 'https://', '.com', '.kr', '.net', '.org'
    ];
    
    const lowerText = text.toLowerCase();
    return spamWords.some(word => lowerText.includes(word.toLowerCase()));
  };

  const checkUrlPattern = (text) => {
    const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,})/gi;
    return urlPattern.test(text);
  };

  const checkCommentSpam = (text, postId) => {
    // URL 체크
    if (checkUrlPattern(text)) {
      return { isSpam: true, message: '댓글에 URL을 포함할 수 없습니다.' };
    }
    
    // 스팸 단어 체크
    if (checkSpamWords(text)) {
      return { isSpam: true, message: '부적절한 단어가 포함되어 있습니다.' };
    }
    
    // 연속 댓글 방지 (1초 이내)
    const now = Date.now();
    const lastTime = lastCommentTimes[postId] || 0;
    if (now - lastTime < 1000) {
      return { isSpam: true, message: '너무 빠르게 연속 댓글을 작성할 수 없습니다. 잠시 후 다시 시도해주세요.' };
    }
    
    // 댓글 길이 체크
    if (text.length > 500) {
      return { isSpam: true, message: '댓글은 500자 이내로 작성해주세요.' };
    }
    
    return { isSpam: false };
  };

  // 댓글 토글 기능
  const toggleComments = (postId) => {
    const isCurrentlyShowing = showComments[postId];
    
    setShowComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));

    // 댓글을 보여줄 때만 댓글 데이터를 가져옴
    if (!isCurrentlyShowing) {
      fetchComments(postId);
    }
  };

  // 댓글 작성 기능
  const handleCommentSubmit = async (postId, parentId = null) => {
    const commentKey = parentId ? `${postId}_${parentId}` : postId;
    const comment = commentText[commentKey];
    if (!comment || !comment.trim()) {
      alert('댓글을 입력해주세요.');
      return;
    }

    // 스팸 방지 체크
    const spamCheck = checkCommentSpam(comment.trim(), postId);
    if (spamCheck.isSpam) {
      alert(spamCheck.message);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('로그인이 필요합니다.');
        return;
      }

      setSubmittingComment(prev => ({ ...prev, [commentKey]: true }));

      const { error } = await supabase
        .from('community_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: comment.trim(),
          parent_id: parentId
        });

      if (error) {
        console.error('댓글 작성 오류:', error);
        alert('댓글 작성에 실패했습니다.');
      } else {
        setCommentText(prev => ({ ...prev, [commentKey]: '' }));
        setReplyTo(prev => ({ ...prev, [postId]: null }));
        setLastCommentTimes(prev => ({ ...prev, [postId]: Date.now() })); // 댓글 작성 시간 기록
        // 댓글 목록 새로고침
        fetchComments(postId);
        // 댓글 수 업데이트를 위해 게시글 목록 새로고침
        fetchPosts();
      }
    } catch (error) {
      console.error('댓글 작성 중 오류:', error);
      alert('댓글 작성 중 오류가 발생했습니다.');
    } finally {
      setSubmittingComment(prev => ({ ...prev, [commentKey]: false }));
    }
  };

  // 댓글 렌더링 컴포넌트
  const renderComment = (comment, postId, depth = 0) => {
    const commentKey = `${postId}_${comment.id}`;
    const isReplyMode = replyTo[postId] === comment.id;
    
    return (
      <div key={comment.id} className={`${depth > 0 ? 'ml-8 border-l-2 border-gray-200 pl-3' : ''}`}>
        {/* 댓글 본문 */}
        <div className="flex items-start gap-2 py-2">
          <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
            익명
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-gray-900">익명</span>
              <span className="text-xs text-gray-500">
                {comment.created_at ? new Date(comment.created_at).toLocaleString('ko-KR') : ''}
              </span>
            </div>
            <div className="text-sm text-gray-800 mb-2 whitespace-pre-wrap break-words">
              {comment.content || '(내용 없음)'}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <button
                onClick={() => setReplyTo(prev => ({ ...prev, [postId]: comment.id }))}
                className="hover:text-blue-600 transition-colors"
              >
                답글
              </button>
              <button className="hover:text-red-600 transition-colors">신고</button>
            </div>
          </div>
        </div>

        {/* 답글 입력창 */}
        {isReplyMode && (
          <div className="ml-8 mb-3">
            <div className="bg-gray-50 p-3 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  U
                </div>
                <span className="text-sm text-gray-600">익명에게 답글</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="답글을 입력하세요..."
                  value={commentText[commentKey] || ''}
                  onChange={(e) => setCommentText(prev => ({ ...prev, [commentKey]: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleCommentSubmit(postId, comment.id);
                    }
                  }}
                />
                <button
                  onClick={() => handleCommentSubmit(postId, comment.id)}
                  disabled={submittingComment[commentKey]}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm transition-colors disabled:opacity-50"
                >
                  등록
                </button>
                <button
                  onClick={() => setReplyTo(prev => ({ ...prev, [postId]: null }))}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const seoMeta = generateSEOMeta({
    title: PAGE_SEO.community.title,
    description: PAGE_SEO.community.description,
    keywords: PAGE_SEO.community.keywords,
    url: '/community'
  });

  return (
    <>
      <Head>
        <title>{seoMeta.title}</title>
        <meta name="description" content={seoMeta.description} />
        <meta name="keywords" content={seoMeta.keywords} />
        <meta property="og:title" content={seoMeta.openGraph.title} />
        <meta property="og:description" content={seoMeta.openGraph.description} />
        <meta property="og:url" content={seoMeta.openGraph.url} />
        <meta property="og:type" content={seoMeta.openGraph.type} />
        <meta property="og:image" content={seoMeta.openGraph.images[0].url} />
        <link rel="canonical" href={seoMeta.alternates.canonical} />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-center">
              <h1 className="text-xl font-bold text-gray-900">커뮤니티</h1>
            </div>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex space-x-1 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    const url = new URL(window.location);
                    if (tab.id === 'all') {
                      url.searchParams.delete('tab');
                    } else {
                      url.searchParams.set('tab', tab.id);
                    }
                    router.push(url.pathname + url.search);
                  }}
                  className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 광고 배너 - 페이지 배경과 동일한 색상 */}
        <div className="px-4 pt-4">
          <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-4">
              {/* 광고 이미지 */}
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <div className="text-gray-600 text-xs text-center">
                  <div className="font-bold">imgbb.com</div>
                  <div className="text-xs">Image not found</div>
                </div>
              </div>
              
              {/* 광고 텍스트 */}
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg">에어로케이 특별한 추석 특가</h3>
                <p className="text-sm text-gray-600 mt-1">일본 항공권 편도 총액 4만원대~</p>
              </div>
              
              {/* 화살표 아이콘 */}
              <div className="text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* 광고 카드 섹션 */}
         {adBanners.length > 0 && (
           <div className="px-4 pt-4">
             <div className="space-y-3">
               {adBanners.map((banner, index) => (
                 <a
                   key={banner.id}
                   href={banner.link_url || '#'}
                   target={banner.link_url?.startsWith('http') ? '_blank' : '_self'}
                   rel={banner.link_url?.startsWith('http') ? 'noopener noreferrer' : ''}
                   className="block bg-gray-50 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
                 >
                   <div className="flex items-center gap-4">
                     {/* 광고 이미지 */}
                     <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                       {banner.image_url ? (
                         <img 
                           src={banner.image_url} 
                           alt={banner.title || "광고"}
                           className="w-full h-full object-cover"
                         />
                       ) : (
                         <div className="text-gray-500 text-xs text-center">
                           <div className="font-bold">광고</div>
                         </div>
                       )}
                     </div>
                     
                     {/* 광고 텍스트 */}
                     <div className="flex-1 min-w-0">
                       <h3 className="font-medium text-gray-900 truncate">{banner.title || "광고"}</h3>
                       <p className="text-sm text-gray-600 mt-1 line-clamp-2">{banner.content || "광고 내용"}</p>
                       <div className="flex items-center mt-2">
                         <span className="text-xs text-blue-600 font-medium">자세히 보기</span>
                         <svg className="w-3 h-3 text-blue-600 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                         </svg>
                       </div>
                     </div>
                   </div>
                 </a>
               ))}
             </div>
           </div>
         )}

        {/* 실시간 인기글 섹션 - 하나씩 돌아가면서 보이기 */}
        <div className="px-4 pt-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 text-red-500">
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900">실시간 인기글</h2>
              </div>
            </div>
            <div className="p-4">
              <TrendingPostsCarousel posts={trendingPosts} />
            </div>
          </div>
        </div>

        {/* 게시글 목록 - 인스타그램 피드 스타일 */}
        <div className="max-w-2xl mx-auto px-4 py-6">
          {activeTab === 'journalist' ? (
            /* 기자단 전용 섹션 - 이미지 디자인 */
            <div className="space-y-8">
              {/* 아트앤브릿지 기자단 배너 (좌측 정렬, 클릭 시 숨김) */}
              {!hideJournalBanner && (
                <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-4 sm:p-6 text-white">
                  {/* 닫기 버튼 */}
                  <button
                    aria-label="배너 닫기"
                    onClick={() => setHideJournalBanner(true)}
                    className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                  <div className="max-w-xl">
                    <h1 className="text-[22px] sm:text-[28px] font-extrabold leading-snug">아트앤브릿지 기자단</h1>
                    <p className="mt-2 text-blue-100 text-sm sm:text-base">전시회의 생생한 감동을 전하고 특별한 혜택을 누리세요!</p>
                    <button
                      onClick={() => { setShowJournalistApplication(true); setHideJournalBanner(true); }}
                      className="mt-4 inline-flex items-center gap-2 bg-white text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors"
                    >
                      기자단 신청하기
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                    </button>
                  </div>
                </div>
              )}

              {/* 명예의 전당 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <h2 className="text-xl font-bold text-gray-900">명예의 전당</h2>
                  <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <div className="grid grid-cols-3 gap-4 items-start">
                  {/* 김민준 */}
                  <div className="text-center">
                    <div className="relative w-14 h-14 mx-auto mb-2">
                      <div className="w-14 h-14 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-lg font-bold text-gray-600">김</span>
                      </div>
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white">1</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">김민준</h3>
                    <p className="text-xs text-gray-600">전시 해설가</p>
                  </div>
                  
                  {/* 이서연 */}
                  <div className="text-center">
                    <div className="relative w-14 h-14 mx-auto mb-2">
                      <div className="w-14 h-14 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-lg font-bold text-gray-600">이</span>
                      </div>
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white">2</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">이서연</h3>
                    <p className="text-xs text-gray-600">아트 칼럼니스트</p>
                  </div>
                  
                  {/* 박지훈 */}
                  <div className="text-center">
                    <div className="relative w-14 h-14 mx-auto mb-2">
                      <div className="w-14 h-14 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-lg font-bold text-gray-600">박</span>
                      </div>
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white">3</span>
                      </div>
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">박지훈</h3>
                    <p className="text-xs text-gray-600">사진 전문 기자</p>
                  </div>
                </div>
              </div>

              {/* 최신 기사 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 mb-6">최신 기사</h2>
                <div className="space-y-4">
                  {/* 임시 기자단 기사들 → 실제 기자단 게시글이 있으면 해당 상세로 이동 */}
                  {(() => {
                    const journalistPosts = posts.filter(p => p.category === 'journalist');
                    const articles = [
                    {
                      id: 'journalist-1',
                      title: 'AI가 그린 초상, 현대미술의 새로운 지평을 엿보다',
                      content: '최근 개막한 \'AI: 새로운 시선\' 전시는 인공지능이 창작의 주체가 될 수 있는지를 묻는 도발적인 질문을 던집니다. 작가와 AI의 협업으로 탄생한 작품들은 관람객들에게 새로운 미적 경험을 선사하고 있습니다.',
                      author: '이서연',
                      likes: 98,
                      image: '/images/ai-art.jpg'
                    },
                    {
                      id: 'journalist-2', 
                      title: '젊은 작가들의 도전, 전통과 현대의 조화',
                      content: '신진 작가들이 전통 기법과 현대적 감각을 결합한 작품들을 선보이며 주목받고 있습니다. 이들의 실험적 시도는 미술계에 새로운 바람을 불러일으키고 있습니다.',
                      author: '김민준',
                      likes: 76,
                      image: '/images/young-artists.jpg'
                    },
                    {
                      id: 'journalist-3',
                      title: '환경을 생각하는 예술, 지속가능한 미래를 향해',
                      content: '환경 문제에 대한 예술가들의 관심이 높아지면서, 재활용 소재를 활용한 작품들이 주목받고 있습니다. 예술을 통한 환경 메시지 전달이 새로운 트렌드로 자리잡고 있습니다.',
                      author: '박지훈', 
                      likes: 124,
                      image: '/images/eco-art.jpg'
                    }
                    ];
                    return articles.map((article, idx) => {
                      const targetId = journalistPosts[idx]?.id;
                      const href = targetId ? `/community/${targetId}` : '/community?tab=journalist';
                      return (
                        <Link href={href} key={article.id} className="flex gap-4 p-4 border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors">
                      <div className="w-28 h-28 bg-gray-200 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                        <span className="text-gray-500 text-sm">이미지</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-gray-600">{article.author.charAt(0)}</span>
                          </div>
                          <span className="text-sm text-gray-600">{article.author}</span>
                        </div>
                        <h3 className="font-extrabold text-gray-900 mb-2 line-clamp-2 text-[18px] leading-snug">{article.title}</h3>
                        <p className="text-gray-600 text-sm line-clamp-2 mb-3">{article.content}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            </svg>
                            {article.likes}
                          </span>
                        </div>
                      </div>
                        </Link>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          ) : activeTab === 'review' ? (
            <div className="max-w-2xl mx-auto w-full px-4 pt-4 pb-6">
              <ReviewFeedCards />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">아직 게시글이 없습니다.</p>
              <Link
                href="/community/write"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                첫 번째 게시글 작성하기
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {/* 게시글 헤더 - 인스타그램 스타일 */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {post.profiles?.avatar_url ? (
                          <img
                            src={post.profiles.avatar_url}
                            alt={post.profiles.full_name || '사용자'}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-500 text-white">
                            <span className="text-base font-semibold">
                              {(post.profiles?.full_name || '사용자').charAt(0)}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900">
                              {post.profiles?.full_name || '익명 사용자'}
                            </h3>
                            <span className={`px-2 py-0.5 text-xs rounded-full ${getCategoryBadgeClass(post.category)}`}>
                              {CATEGORY_LABELS[post.category] || post.category}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">{getRelativeTime(post.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleReport(post.id, post.title)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 게시글 내용 */}
                  <div className="p-4">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h2>
                    <p className="text-gray-700 leading-relaxed">{post.content}</p>
                  </div>

                  {/* 비디오 */}
                  {post.video_url && (
                    <div className="bg-black relative">
                      <VideoPlayer
                        src={post.video_url}
                        className="w-full max-h-[600px]"
                        autoPlay={false}
                        loop={true}
                        muted={mutedVideos[post.id] !== false}
                        controls={true}
                        onPlay={() => {
                          // 다른 비디오들 정지
                          setMutedVideos(prev => {
                            const newMuted = { ...prev };
                            Object.keys(newMuted).forEach(id => {
                              if (id !== post.id) {
                                newMuted[id] = true;
                              }
                            });
                            return newMuted;
                          });
                          setMutedVideos(prev => ({ ...prev, [post.id]: false }));
                        }}
                        onPause={() => {
                          setMutedVideos(prev => ({ ...prev, [post.id]: true }));
                        }}
                      />
                      
                      {/* 음소거 토글 버튼 */}
                      <button
                        onClick={() => toggleMute(post.id)}
                        className="absolute bottom-4 right-4 bg-black/50 text-white rounded-full p-2 hover:bg-black/70 transition-colors z-10"
                      >
                        {mutedVideos[post.id] !== false ? (
                          <VolumeX className="w-5 h-5" />
                        ) : (
                          <Volume2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  )}

                  {/* 이미지 (선택적) */}
                  {post.image_url && !post.video_url && (
                    <div className="bg-gray-100">
                      <img 
                        src={post.image_url}
                        alt={post.title}
                        className="w-full h-auto max-h-96 object-cover"
                      />
                    </div>
                  )}

                  {/* 액션 버튼들 - 인스타그램 스타일 */}
                  <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <button 
                          onClick={() => handleLike(post.id)}
                          className={`flex items-center space-x-1 transition-colors ${
                            post.user_liked 
                              ? 'text-red-500' 
                              : 'text-gray-600 hover:text-red-500'
                          }`}
                        >
                          <Heart 
                            className={`w-5 h-5 ${
                              post.user_liked 
                                ? 'fill-current' 
                                : 'stroke-current'
                            }`} 
                          />
                          <span className="text-sm font-medium">{post.likes || 0}</span>
                        </button>
                        <button 
                          onClick={() => toggleComments(post.id)}
                          className={`flex items-center space-x-1 transition-colors ${
                            showComments[post.id] 
                              ? 'text-blue-500' 
                              : 'text-gray-600 hover:text-blue-500'
                          }`}
                        >
                          <MessageCircle 
                            className={`w-5 h-5 ${
                              showComments[post.id] 
                                ? 'fill-current' 
                                : 'stroke-current'
                            }`} 
                          />
                          <span className="text-sm font-medium">{post.comments_count || 0}</span>
                        </button>
                        <button 
                          onClick={() => handleShare(post)}
                          className="flex items-center space-x-1 text-gray-600 hover:text-green-600 transition-colors"
                        >
                          <Share className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 댓글 섹션 - 디시인사이드 스타일 */}
                  {showComments[post.id] && (
                    <div className="border-t border-gray-200 bg-white">
                      {/* 댓글 목록 */}
                      <div className="p-4">
                        {(() => {
                          const comments = postComments[post.id] || [];
                          console.log(`게시글 ${post.id}의 댓글 목록:`, comments.length, '개');
                          
                          if (comments.length === 0) {
                            return (
                              <div className="text-center py-6 text-gray-500 text-sm border-b border-gray-100">
                                아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!
                              </div>
                            );
                          }
                          
                          // 댓글을 부모-자식 관계로 정리
                          const parentComments = comments.filter(comment => !comment.parent_id);
                          const childComments = comments.filter(comment => comment.parent_id);
                          
                          const renderCommentsWithReplies = (parentComment) => {
                            const replies = childComments.filter(child => child.parent_id === parentComment.id);
                            return (
                              <div key={parentComment.id}>
                                {renderComment(parentComment, post.id, 0)}
                                {replies.map(reply => renderComment(reply, post.id, 1))}
                              </div>
                            );
                          };
                          
                          return parentComments.map(renderCommentsWithReplies);
                        })()}
                      </div>
                      
                      {/* 댓글 작성 입력창 */}
                      <div className="border-t border-gray-100 p-4 bg-gray-50">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            U
                          </div>
                          <span className="text-sm text-gray-600">익명</span>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="댓글을 입력하세요..."
                            value={commentText[post.id] || ''}
                            onChange={(e) => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                handleCommentSubmit(post.id);
                              }
                            }}
                          />
                          <button
                            onClick={() => handleCommentSubmit(post.id)}
                            disabled={submittingComment[post.id]}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm transition-colors disabled:opacity-50"
                          >
                            등록
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 기자단 신청 팝업 */}
        {showJournalistApplication && (
          <JournalistApplicationPopup
            isOpen={showJournalistApplication}
            onClose={() => setShowJournalistApplication(false)}
          />
        )}

        {/* 신고 모달 */}
        {showReportModal && (
          <PostReportModal
            isOpen={showReportModal}
            onClose={() => {
              setShowReportModal(false);
              setSelectedPostId(null);
              setSelectedPostTitle("");
            }}
            postId={selectedPostId}
            postTitle={selectedPostTitle}
          />
        )}

        {/* 하단 플로팅 + 버튼 */}
        <div className="fixed bottom-20 right-4 z-50">
          <Link
            href="/community/write"
            className="bg-blue-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-6 h-6" />
          </Link>
        </div>
      </div>
    </>
  );
}

export default function CommunityPage() {
  return (
    <Suspense fallback={
      null
    }>
      <CommunityPageContent />
    </Suspense>
  );
}