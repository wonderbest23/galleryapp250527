"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { FiCalendar, FiMapPin, FiClock, FiHeart, FiShare2 } from "react-icons/fi";
import SafeImage from "@/components/SafeImage";
import Link from "next/link";
// 이미지 최적화: SafeImage 또는 기본 img 사용
import Head from "next/head";
import { generateSEOMeta, generateStructuredData } from "@/utils/seo";

export default function ExhibitionDetailPage({ params }) {
  const supabase = createClient();
  const [exhibition, setExhibition] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    const fetchExhibition = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('exhibition')
          .select(`
            *,
            gallery:gallery_id (
              id,
              name,
              address,
              phone,
              website
            )
          `)
          .eq('id', params.id)
          .single();

        if (error) {
          console.error('Error fetching exhibition:', error);
          return;
        }

        setExhibition(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchExhibition();
    }
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!exhibition) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">전시회 정보를 찾을 수 없습니다</h1>
          <Link href="/exhibitions" className="text-blue-600 hover:text-blue-800">
            전시회 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const seoMeta = generateSEOMeta({
    title: exhibition.name,
    description: exhibition.contents?.substring(0, 160) + '...',
    keywords: `${exhibition.name}, 전시회, ${exhibition.gallery?.name}, 예술, 미술`,
    url: `/exhibitions/${exhibition.id}`,
    type: 'article',
    publishedTime: exhibition.created_at,
    modifiedTime: exhibition.updated_at,
    image: exhibition.image_url
  });

  const structuredData = generateStructuredData({
    type: 'Event',
    title: exhibition.name,
    description: exhibition.contents,
    url: `/exhibitions/${exhibition.id}`,
    startDate: exhibition.start_date,
    endDate: exhibition.end_date,
    location: exhibition.gallery?.name,
    organizer: exhibition.gallery?.name,
    image: exhibition.image_url
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
        {/* 메인 이미지 */}
        {exhibition.image_url && (
          <div className="relative h-96 bg-gray-200">
            <SafeImage
              src={exhibition.image_url}
              alt={exhibition.name}
              width={1920}
              height={540}
              className="object-cover w-full h-full"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black bg-opacity-30" />
            <div className="absolute bottom-6 left-6 text-white">
              <h1 className="text-4xl font-bold mb-2">{exhibition.name}</h1>
              <p className="text-lg">{exhibition.gallery?.name}</p>
            </div>
          </div>
        )}

        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* 기본 정보 카드 */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-center space-x-3">
                <FiCalendar className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-500">기간</p>
                  <p className="font-medium">
                    {new Date(exhibition.start_date).toLocaleDateString('ko-KR')} - {new Date(exhibition.end_date).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <FiMapPin className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-500">장소</p>
                  <p className="font-medium">{exhibition.gallery?.name}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <FiClock className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-500">관람시간</p>
                  <p className="font-medium">{exhibition.opening_hours || '문의'}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <FiCalendar className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-500">입장료</p>
                  <p className="font-medium">{exhibition.price || '문의'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* 탭 메뉴 */}
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'info'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  전시회 정보
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'reviews'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  리뷰
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'info' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">전시회 소개</h3>
                    <div className="prose max-w-none">
                      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {exhibition.contents}
                      </p>
                    </div>
                  </div>

                  {exhibition.gallery && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">갤러리 정보</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">{exhibition.gallery.name}</h4>
                        <p className="text-gray-600 mb-2">{exhibition.gallery.address}</p>
                        {exhibition.gallery.phone && (
                          <p className="text-gray-600 mb-2">전화: {exhibition.gallery.phone}</p>
                        )}
                        {exhibition.gallery.website && (
                          <a
                            href={exhibition.gallery.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            웹사이트 방문
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-4">
                    <button className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                      <FiCalendar className="w-5 h-5" />
                      <span>티켓 구매</span>
                    </button>
                    <button className="flex items-center space-x-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <FiHeart className="w-5 h-5" />
                      <span>관심 전시회</span>
                    </button>
                    <button className="flex items-center space-x-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <FiShare2 className="w-5 h-5" />
                      <span>공유하기</span>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">전시회 리뷰</h3>
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">아직 리뷰가 없습니다.</p>
                    <Link
                      href={`/review/write?exhibition_id=${exhibition.id}`}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      첫 번째 리뷰 작성하기
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 관련 전시회 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">관련 전시회</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/exhibitions" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <h4 className="font-medium text-gray-900 mb-2">더 많은 전시회 보기</h4>
                <p className="text-sm text-gray-600">다양한 전시회 정보를 확인해보세요</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
