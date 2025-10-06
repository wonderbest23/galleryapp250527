"use client";
import { useState, useEffect, Suspense } from "react";
import { createClient } from "@/utils/supabase/client";
import { Heart, MessageCircle, Share, Plus, MoreHorizontal, Flame, Volume2, VolumeX } from 'lucide-react';
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { PostReportModal } from "../components/post-report-modal";
import JournalistApplicationPopup from "../mypage/success/components/JournalistApplicationPopup";
import VideoPlayer from "./components/VideoPlayer";
import Head from "next/head";
import { generateSEOMeta, PAGE_SEO } from "@/utils/seo";

function CommunityPageContent() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('all');
  const [posts, setPosts] = useState([]);
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [mutedVideos, setMutedVideos] = useState({});
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [showJournalistApplication, setShowJournalistApplication] = useState(false);
  
  // 광고 배너 상태
  const [adBanner, setAdBanner] = useState(null);
  const [adBanners, setAdBanners] = useState([]);

  const tabs = [
    { id: 'all', label: '전체' },
    { id: 'free', label: '자유' },
    { id: 'exhibition', label: '전시회' },
    { id: 'short_video', label: '숏폼' },
    { id: 'discussion', label: '토론' },
    { id: 'review', label: '리뷰' },
    { id: 'journalist', label: '기자단' }
  ];

  useEffect(() => {
    const tab = searchParams.get('tab');
    console.log('URL 파라미터 tab:', tab);
    if (tab && ['all', 'exhibition', 'short_video', 'discussion', 'free', 'review'].includes(tab)) {
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
        .select(`
          *,
          profiles:user_id (
            id,
            name,
            avatar_url
          )
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error('트렌딩 포스트 조회 오류:', error);
        return;
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
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!error && data) {
        setAdBanner(data);
      }
    } catch (error) {
      console.error('광고 배너 조회 오류:', error);
    }
  };

  const fetchAdBanners = async () => {
    try {
      const { data, error } = await supabase
        .from('gallery_notification')
        .select('*')
        .eq('type', 'ad_banner')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(3);

      if (!error && data) {
        setAdBanners(data);
      }
    } catch (error) {
      console.error('광고 배너들 조회 오류:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      console.log('fetchPosts 호출됨, activeTab:', activeTab);
      
      let query = supabase
        .from('community_post')
        .select(`
          *,
          profiles:user_id (
            id,
            name,
            avatar_url
          )
        `)
        .or('is_published.eq.true,is_published.is.null');

      // 카테고리별 필터링
      if (activeTab !== 'all') {
        const categoryMap = {
          'free': 'free',
          'exhibition': 'exhibition',
          'short_video': 'short_video',
          'discussion': '토론',
          'review': 'review',
          'journalist': 'journalist'
        };
        
        if (categoryMap[activeTab]) {
          query = query.eq('category', categoryMap[activeTab]);
        }
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('게시글 조회 오류:', error);
        return;
      }

      console.log('조회된 게시글:', data?.length, '개');
      setPosts(data || []);
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

  const handleReport = (postId) => {
    setSelectedPostId(postId);
    setShowReportModal(true);
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
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold text-gray-900">커뮤니티</h1>
              <Link
                href="/community/write"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </Link>
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

        {/* 광고 배너 */}
        {adBanner && (
          <div className="px-4 pt-4">
            <a 
              href={adBanner.link_url || "#"} 
              target={adBanner.link_url ? "_blank" : "_self"}
              rel="noopener noreferrer"
              className="block"
            >
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <div className="relative w-full h-24">
                  <img
                    src={adBanner.image_url}
                    alt={adBanner.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <p className="text-white text-sm font-medium">{adBanner.title}</p>
                  </div>
                </div>
              </div>
            </a>
          </div>
        )}

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
                     {/* 광고 이미지 - 파란색 배경 */}
                     <div className="w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                       <div className="text-white text-xs text-center">
                         <div className="font-bold">imgbb.com</div>
                         <div className="text-xs opacity-80">image not found</div>
                       </div>
                     </div>
                     
                     {/* 광고 텍스트 */}
                     <div className="flex-1 min-w-0">
                       <h3 className="font-medium text-gray-900 truncate">{banner.title}</h3>
                       <p className="text-sm text-gray-600 mt-1 line-clamp-2">{banner.content}</p>
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

        {/* 실시간 인기글 섹션 */}
        {trendingPosts.length > 0 && (
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <h2 className="text-lg font-bold text-gray-900">실시간 인기글</h2>
                </div>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {trendingPosts.map((post, index) => (
                    <div key={post.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{post.title}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span>👁 {post.views || 0}</span>
                          <span>💬 {post.comments_count || 0}</span>
                          <span>❤️ {post.likes_count || 0}</span>
                          <span className="text-xs">{new Date(post.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Link
                          href={`/community/${post.id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          보기
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 게시글 목록 */}
        <div className="max-w-4xl mx-auto px-4 py-6">
          {activeTab === 'journalist' ? (
            /* 기자단 전용 섹션 */
            <div className="space-y-6">
              {/* 기자단 소개 카드 */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">기자단</h2>
                    <p className="text-blue-100">전문적인 예술 저널리즘을 위한 공간</p>
                  </div>
                </div>
                <p className="text-blue-100 mb-4">
                  아트앤브릿지 기자단은 예술계의 소식을 전문적으로 전달하는 역할을 합니다. 
                  전시회 리뷰, 아티스트 인터뷰, 예술계 동향 등을 다룹니다.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowJournalistApplication(true)}
                    className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                  >
                    기자단 신청하기
                  </button>
                  <Link
                    href="/community/write?category=journalist"
                    className="bg-white/20 text-white px-4 py-2 rounded-lg font-medium hover:bg-white/30 transition-colors"
                  >
                    기사 작성하기
                  </Link>
                </div>
              </div>

              {/* 기자단 활동 가이드 */}
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">기자단 활동 가이드</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">1</div>
                      <div>
                        <h4 className="font-medium text-gray-900">전시회 리뷰</h4>
                        <p className="text-sm text-gray-600">전시회를 방문하고 전문적인 관점에서 리뷰를 작성합니다.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">2</div>
                      <div>
                        <h4 className="font-medium text-gray-900">아티스트 인터뷰</h4>
                        <p className="text-sm text-gray-600">신진 작가와의 인터뷰를 통해 예술계의 새로운 소식을 전달합니다.</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">3</div>
                      <div>
                        <h4 className="font-medium text-gray-900">예술계 동향</h4>
                        <p className="text-sm text-gray-600">미술계의 최신 트렌드와 이슈를 분석하고 전달합니다.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">4</div>
                      <div>
                        <h4 className="font-medium text-gray-900">전문성 향상</h4>
                        <p className="text-sm text-gray-600">지속적인 학습과 경험을 통해 전문성을 높입니다.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 기자단 게시글 */}
              {posts.filter(post => post.category === 'journalist').length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900">기자단 기사</h3>
                  {posts.filter(post => post.category === 'journalist').map((post) => (
                    <div key={post.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">기자단</span>
                          <span className="text-sm text-gray-500">{new Date(post.created_at).toLocaleDateString()}</span>
                        </div>
                        <h3 className="font-bold text-gray-900 mb-2">{post.title}</h3>
                        <p className="text-gray-600 text-sm line-clamp-2">{post.content}</p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                          <span>👁 {post.views || 0}</span>
                          <span>💬 {post.comments_count || 0}</span>
                          <span>❤️ {post.likes_count || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">아직 기자단 기사가 없습니다.</p>
                  <Link
                    href="/community/write?category=journalist"
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    첫 번째 기사 작성하기
                  </Link>
                </div>
              )}
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
            <div className="space-y-6">
              {posts.map((post) => (
                <div key={post.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  {/* 게시글 헤더 */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {post.profiles?.avatar_url ? (
                          <img
                            src={post.profiles.avatar_url}
                            alt={post.profiles.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                            <span className="text-gray-600 font-medium">
                              {post.profiles?.name?.charAt(0) || 'U'}
                            </span>
                          </div>
                        )}
                        <div>
                          <h3 className="font-medium text-gray-900">{post.profiles?.name || '익명'}</h3>
                          <p className="text-sm text-gray-500">
                            {new Date(post.created_at).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {post.category}
                        </span>
                        <button
                          onClick={() => handleReport(post.id)}
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
                    <p className="text-gray-700 leading-relaxed line-clamp-3">{post.content}</p>
                  </div>

                  {/* 비디오 (숏폼) */}
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

                  {/* 액션 버튼들 */}
                  <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-6">
                        <button className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors">
                          <Heart className="w-5 h-5" />
                          <span>좋아요</span>
                        </button>
                        <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors">
                          <MessageCircle className="w-5 h-5" />
                          <span>댓글</span>
                        </button>
                        <button className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors">
                          <Share className="w-5 h-5" />
                          <span>공유</span>
                        </button>
                      </div>
                      <Link
                        href={`/community/${post.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        자세히 보기
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 기자단 신청 팝업 */}
        {showJournalistApplication && (
          <JournalistApplicationPopup
            showJournalistApplication={showJournalistApplication}
            setShowJournalistApplication={setShowJournalistApplication}
          />
        )}

        {/* 신고 모달 */}
        {showReportModal && (
          <PostReportModal
            postId={selectedPostId}
            onClose={() => {
              setShowReportModal(false);
              setSelectedPostId(null);
            }}
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <CommunityPageContent />
    </Suspense>
  );
}