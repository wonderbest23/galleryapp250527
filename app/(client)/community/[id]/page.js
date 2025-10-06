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
          .select(`
            *,
            profiles:user_id (
              id,
              name,
              avatar_url
            )
          `)
          .eq('id', params.id)
          .single();

        if (error) {
          console.error('Error fetching post:', error);
          return;
        }

        setPost(data);
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
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                {post.category}
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
          </div>

          {/* 액션 버튼들 */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <button className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors">
                  <FiHeart className="w-5 h-5" />
                  <span>좋아요</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors">
                  <FiMessageCircle className="w-5 h-5" />
                  <span>댓글</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors">
                  <FiShare2 className="w-5 h-5" />
                  <span>공유</span>
                </button>
              </div>
            </div>
          </div>

          {/* 관련 게시글 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">관련 게시글</h3>
            <div className="space-y-4">
              <Link href="/community" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <h4 className="font-medium text-gray-900 mb-2">더 많은 커뮤니티 글 보기</h4>
                <p className="text-sm text-gray-600">다양한 예술 관련 이야기를 만나보세요</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}