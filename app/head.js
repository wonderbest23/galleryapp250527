import { generateSEOMeta, generateStructuredData, SEO_CONFIG } from '@/utils/seo';

export default function Head() {
  const seoMeta = generateSEOMeta();
  const structuredData = generateStructuredData({
    type: 'WebSite',
    title: SEO_CONFIG.defaultTitle,
    description: SEO_CONFIG.defaultDescription
  });

  return (
    <>
      <title>{seoMeta.title}</title>
      <meta name="description" content={seoMeta.description} />
      <meta name="keywords" content={seoMeta.keywords} />
      <meta name="author" content={seoMeta.author || SEO_CONFIG.author} />
      
      {/* iPhone Safari 포함 모든 모바일에서 화면 폭에 맞춰 줍니다 */}
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
      
      {/* 검색엔진 검증 */}
      <meta name="naver-site-verification" content="bad7ac6c90f1c11f1dfa8f9ef1d8bb44d3fc597c" />
      {process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION && (
        <meta name="google-site-verification" content={process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION} />
      )}

      {/* 아이콘 관련 메타태그 */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/site.webmanifest" />

      {/* Open Graph 메타태그 */}
      <meta property="og:title" content={seoMeta.openGraph.title} />
      <meta property="og:description" content={seoMeta.openGraph.description} />
      <meta property="og:url" content={seoMeta.openGraph.url} />
      <meta property="og:site_name" content={seoMeta.openGraph.siteName} />
      <meta property="og:type" content={seoMeta.openGraph.type} />
      <meta property="og:locale" content={seoMeta.openGraph.locale} />
      <meta property="og:image" content={seoMeta.openGraph.images[0].url} />
      <meta property="og:image:width" content={seoMeta.openGraph.images[0].width} />
      <meta property="og:image:height" content={seoMeta.openGraph.images[0].height} />
      <meta property="og:image:alt" content={seoMeta.openGraph.images[0].alt} />

      {/* Twitter 메타태그 */}
      <meta name="twitter:card" content={seoMeta.twitter.card} />
      <meta name="twitter:title" content={seoMeta.twitter.title} />
      <meta name="twitter:description" content={seoMeta.twitter.description} />
      <meta name="twitter:image" content={seoMeta.twitter.images[0]} />
      <meta name="twitter:creator" content={seoMeta.twitter.creator} />
      <meta name="twitter:site" content={seoMeta.twitter.site} />

      {/* Canonical URL */}
      <link rel="canonical" href={seoMeta.alternates.canonical} />

      {/* Robots 메타태그 */}
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />

      {/* 구조화된 데이터 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />

      {/* 추가 SEO 메타태그 */}
      <meta name="theme-color" content="#000000" />
      <meta name="msapplication-TileColor" content="#000000" />
      <meta name="format-detection" content="telephone=no" />
      
      {/* 언어 및 지역 설정 */}
      <meta httpEquiv="content-language" content="ko" />
      <meta name="geo.region" content="KR" />
      <meta name="geo.placename" content="서울" />
    </>
  );
} 