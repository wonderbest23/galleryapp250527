"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { FiHeart, FiMessageCircle, FiShare2, FiMoreVertical, FiArrowLeft } from "react-icons/fi";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Head from "next/head";
import { generateSEOMeta, generateStructuredData } from "@/utils/seo";

export default function CommunityPostDetail({ params }) {
  const supabase = createClient();
  const router = useRouter();
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState([]);

  // 카테고리 한글 라벨 매핑 및 뱃지 색상
  const CATEGORY_LABELS = {
    all: '전체',
    free: '자유',
    exhibition: '전시회',
    short_video: '숏폼',
    discussion: '토론',
    review: '리뷰',
    journalist: '기자단'
  };
  const getBadgeClass = (category) => {
    switch (category) {
      case 'discussion':
        return 'bg-green-100 text-green-700';
      case 'exhibition':
        return 'bg-blue-100 text-blue-700';
      case 'review':
        return 'bg-amber-100 text-amber-700';
      case 'short_video':
        return 'bg-purple-100 text-purple-700';
      case 'journalist':
        return 'bg-slate-100 text-slate-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

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
        const { data, error } = await supabase
          .from('community_post')
          .select('*')
          .eq('id', params.id)
          .single();

        if (error) {
          console.error('Error fetching post:', error);
          return;
        }

        // profiles 정보를 별도로 가져와서 병합
        if (data && data.user_id) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', data.user_id)
            .single();
          
          if (!profileError && profile) {
            setPost({
              ...data,
              profiles: profile
            });
          } else {
            setPost(data);
          }
        } else {
          setPost(data);
        }

        // 관련 게시글 로드 (같은 카테고리, 본인 제외 상위 5개)
        if (data?.category) {
          const { data: rel } = await supabase
            .from('community_post')
            .select('id, title, created_at')
            .eq('category', data.category)
            .neq('id', data.id)
            .order('created_at', { ascending: false })
            .limit(5);
          setRelatedPosts(rel || []);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchPost();
    }
  }, [params.id]);

  // 좋아요/댓글 상태 로드
  useEffect(() => {
    const loadMeta = async () => {
      if (!post) return;
      try {
        const { count: likesCnt } = await supabase
          .from('community_likes')
          .select('id', { count: 'exact', head: true })
          .eq('post_id', post.id);
        setLikeCount(likesCnt || 0);

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: myLike } = await supabase
            .from('community_likes')
            .select('id')
            .eq('post_id', post.id)
            .eq('user_id', user.id)
            .maybeSingle();
          setLiked(!!myLike);
        }

        const { data: cmts } = await supabase
          .from('community_comments')
          .select('*')
          .eq('post_id', post.id)
          .order('created_at', { ascending: true });
        setComments(cmts || []);
      } catch (e) {
        console.log('meta load error', e);
      }
    };
    loadMeta();
  }, [post]);

  const handleLike = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { alert('로그인이 필요합니다.'); return; }
      // 낙관적 업데이트
      setLiked(prev => !prev);
      setLikeCount(prev => (liked ? Math.max(0, prev - 1) : prev + 1));

      if (!liked) {
        // 좋아요 추가 (중복 무시)
        const { error } = await supabase
          .from('community_likes')
          .upsert({ post_id: post.id, user_id: user.id }, { onConflict: 'post_id,user_id' });
        if (error) throw error;
      } else {
        // 좋아요 취소
        const { error } = await supabase
          .from('community_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
        if (error) throw error;
      }
    } catch (e) {
      console.log('like error', e);
      // 롤백
      setLiked(prev => !prev);
      setLikeCount(prev => (liked ? prev + 1 : Math.max(0, prev - 1)));
      alert('좋아요 처리 중 오류가 발생했습니다.');
    }
  };

  const handleShare = async () => {
    try {
      const shareData = { title: post.title, text: post.content, url: window.location.href };
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(shareData.url);
        alert('링크가 클립보드에 복사되었습니다.');
      }
    } catch (e) {
      console.log('share error', e);
    }
  };

  const submitComment = async () => {
    if (!commentText.trim()) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('로그인이 필요합니다.');
        return;
      }
      setSubmittingComment(true);
      const payload = {
        post_id: post.id,
        user_id: user.id,
        content: commentText.trim()
      };
      const { data, error } = await supabase.from('community_comments').insert(payload).select().single();
      if (error) throw error;
      setComments(prev => [...prev, data]);
      setCommentText("");
    } catch (e) {
      console.log('comment error', e);
      alert('댓글 작성 중 오류가 발생했습니다.');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">게시글을 찾을 수 없습니다</h1>
          <Link href="/community" className="text-blue-600 hover:text-blue-800">
            커뮤니티로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const seoMeta = generateSEOMeta({
    title: post.title,
    description: post.content?.substring(0, 160) + '...',
    keywords: `${post.category}, 예술, 커뮤니티, 전시회, 작가`,
    url: `/community/${post.id}`,
    type: 'article',
    publishedTime: post.created_at,
    modifiedTime: post.updated_at,
    author: post.profiles?.name || '아트앤브릿지',
    image: post.image_url || post.video_url
  });

  const structuredData = generateStructuredData({
    type: 'Article',
    title: post.title,
    description: post.content,
    url: `/community/${post.id}`,
    datePublished: post.created_at,
    dateModified: post.updated_at,
    author: post.profiles?.name || '아트앤브릿지',
    publisher: '아트앤브릿지',
    image: post.image_url || post.video_url
  });

  return (
    <>
      <Head>
        <title>{seoMeta.title}</title>
        <meta name="description" content={seoMeta.description} />
        <meta name="keywords" content={seoMeta.keywords} />
        
        {/* Open Graph */}
        <meta property="og:title" content={seoMeta.openGraph.title} />
        <meta property="og:description" content={seoMeta.openGraph.description} />
        <meta property="og:url" content={seoMeta.openGraph.url} />
        <meta property="og:type" content={seoMeta.openGraph.type} />
        <meta property="og:image" content={seoMeta.openGraph.images[0].url} />
        <meta property="og:site_name" content={seoMeta.openGraph.siteName} />
        
        {/* Twitter */}
        <meta name="twitter:card" content={seoMeta.twitter.card} />
        <meta name="twitter:title" content={seoMeta.twitter.title} />
        <meta name="twitter:description" content={seoMeta.twitter.description} />
        <meta name="twitter:image" content={seoMeta.twitter.images[0]} />
        
        {/* Canonical */}
        <link rel="canonical" href={seoMeta.alternates.canonical} />
        
        {/* 구조화된 데이터 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData)
          }}
        />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <FiArrowLeft className="w-5 h-5 mr-2" />
                뒤로
              </button>
              <div className="flex items-center space-x-4">
                <button className="text-gray-600 hover:text-gray-900">
                  <FiShare2 className="w-5 h-5" />
                </button>
                <button className="text-gray-600 hover:text-gray-900">
                  <FiMoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* 게시글 헤더 */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {post.profiles?.avatar_url ? (
                  <Image
                    src={post.profiles.avatar_url}
                    alt={post.profiles.name}
                    width={40}
                    height={40}
                    className="rounded-full"
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
              <span className={`px-3 py-1 text-sm rounded-full ${getBadgeClass(post.category)}`}>
                {CATEGORY_LABELS[post.category] || post.category}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">{post.title}</h1>
            
            {/* 게시글 내용 */}
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>
            </div>

            {/* 이미지 */}
            {post.image_url && (
              <div className="mt-6">
                <Image
                  src={post.image_url}
                  alt={post.title}
                  width={800}
                  height={600}
                  className="rounded-lg w-full h-auto"
                />
              </div>
            )}

            {/* 비디오 */}
            {post.video_url && (
              <div className="mt-6">
                <video
                  src={post.video_url}
                  controls
                  className="rounded-lg w-full h-auto max-h-96"
                  poster={post.image_url}
                />
              </div>
            )}
            {/* 액션 + 댓글 입력 (같은 카드 하단에 결합) */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <button onClick={handleLike} className={`flex items-center space-x-2 transition-colors ${liked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'}`}>
                    <FiHeart className="w-5 h-5" />
                    <span>{likeCount}</span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-600">
                    <FiMessageCircle className="w-5 h-5" />
                    <span>댓글 {comments.length}</span>
                  </button>
                  <button onClick={handleShare} className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors">
                    <FiShare2 className="w-5 h-5" />
                    <span>공유</span>
                  </button>
                </div>
              </div>

              {/* 댓글 입력 */}
              <div className="flex items-center gap-3 mt-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {(currentUser?.user_metadata?.full_name || 'U').charAt(0)}
                </div>
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    placeholder="댓글을 작성해보세요..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyPress={(e)=>{ if(e.key==='Enter') submitComment(); }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button onClick={submitComment} disabled={submittingComment} className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-full disabled:opacity-50">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>

            {/* 댓글 목록 */}
            <div className="mt-6 space-y-4">
              {comments.map((c) => (
                <div key={c.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600">U</div>
                  <div className="flex-1">
                    <div className="text-sm text-gray-800 whitespace-pre-wrap">{c.content}</div>
                    <div className="text-xs text-gray-500 mt-1">{new Date(c.created_at).toLocaleString('ko-KR')}</div>
                  </div>
                </div>
              ))}
            </div>
            </div>
          </div>

          {/* 관련 게시글 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">관련 게시글</h3>
            <div className="space-y-2">
              {relatedPosts && relatedPosts.length > 0 ? (
                relatedPosts.map((p) => (
                  <Link key={p.id} href={`/community/${p.id}`} className="block p-3 rounded-lg hover:bg-gray-50 border border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-900 line-clamp-1">{p.title}</span>
                      <span className="text-xs text-gray-500">{new Date(p.created_at).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </Link>
                ))
              ) : (
                <Link href="/community" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <h4 className="font-medium text-gray-900 mb-2">더 많은 커뮤니티 글 보기</h4>
                  <p className="text-sm text-gray-600">다양한 예술 관련 이야기를 만나보세요</p>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}