/**
 * SEO 최적화 유틸리티
 * 네이버, 구글 검색엔진 최적화를 위한 메타데이터 생성
 */

export const SEO_CONFIG = {
  siteName: '아트앤브릿지',
  siteUrl: 'https://www.artandbridge.com',
  defaultTitle: '아트앤브릿지 - 전시회 리뷰와 예술 커뮤니티',
  defaultDescription: '전시회 리뷰를 쓰고 전시티켓을 구매하세요! 아트앤브릿지에서 즐기는 예술 여행. 최신 전시회 정보, 작가 소개, 예술 커뮤니티를 만나보세요.',
  defaultKeywords: '전시회, 예술, 미술, 갤러리, 전시회 리뷰, 전시회 티켓, 예술 커뮤니티, 작가, 아트앤브릿지',
  author: '아트앤브릿지',
  twitterHandle: '@artandbridge',
  defaultImage: '/opengraph-image.png',
  locale: 'ko_KR',
  type: 'website'
};

export function generateSEOMeta({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  publishedTime,
  modifiedTime,
  author,
  section,
  tags = []
} = {}) {
  const fullTitle = title ? `${title} | ${SEO_CONFIG.siteName}` : SEO_CONFIG.defaultTitle;
  const fullDescription = description || SEO_CONFIG.defaultDescription;
  const fullKeywords = keywords || SEO_CONFIG.defaultKeywords;
  const fullImage = image ? `${SEO_CONFIG.siteUrl}${image}` : `${SEO_CONFIG.siteUrl}${SEO_CONFIG.defaultImage}`;
  const fullUrl = url ? `${SEO_CONFIG.siteUrl}${url}` : SEO_CONFIG.siteUrl;

  return {
    title: fullTitle,
    description: fullDescription,
    keywords: fullKeywords,
    openGraph: {
      title: fullTitle,
      description: fullDescription,
      url: fullUrl,
      siteName: SEO_CONFIG.siteName,
      images: [
        {
          url: fullImage,
          width: 1200,
          height: 630,
          alt: fullTitle
        }
      ],
      locale: SEO_CONFIG.locale,
      type: type,
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(author && { authors: [author] }),
      ...(section && { section }),
      ...(tags.length > 0 && { tags })
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description: fullDescription,
      images: [fullImage],
      creator: SEO_CONFIG.twitterHandle,
      site: SEO_CONFIG.twitterHandle
    },
    alternates: {
      canonical: fullUrl
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1
      }
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
      naver: process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION,
      other: {
        'naver-site-verification': process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION
      }
    }
  };
}

export function generateStructuredData({
  type,
  title,
  description,
  image,
  url,
  datePublished,
  dateModified,
  author,
  publisher,
  price,
  availability,
  rating,
  reviewCount,
  location,
  startDate,
  endDate,
  organizer
}) {
  const baseUrl = SEO_CONFIG.siteUrl;
  const fullUrl = url ? `${baseUrl}${url}` : baseUrl;
  const fullImage = image ? `${baseUrl}${image}` : `${baseUrl}${SEO_CONFIG.defaultImage}`;

  const baseStructuredData = {
    '@context': 'https://schema.org',
    '@type': type,
    name: title,
    description: description,
    url: fullUrl,
    image: fullImage,
    publisher: {
      '@type': 'Organization',
      name: publisher || SEO_CONFIG.siteName,
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo/logo.png`
      }
    },
    ...(author && {
      author: {
        '@type': 'Person',
        name: author
      }
    }),
    ...(datePublished && { datePublished }),
    ...(dateModified && { dateModified })
  };

  switch (type) {
    case 'Article':
      return {
        ...baseStructuredData,
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': fullUrl
        },
        headline: title,
        articleSection: '예술',
        wordCount: description?.length || 0
      };

    case 'Event':
      return {
        ...baseStructuredData,
        startDate,
        endDate,
        location: {
          '@type': 'Place',
          name: location,
          address: location
        },
        organizer: {
          '@type': 'Organization',
          name: organizer || SEO_CONFIG.siteName
        },
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode'
      };

    case 'Product':
      return {
        ...baseStructuredData,
        ...(price && {
          offers: {
            '@type': 'Offer',
            price: price,
            priceCurrency: 'KRW',
            availability: availability || 'https://schema.org/InStock'
          }
        }),
        ...(rating && {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: rating,
            reviewCount: reviewCount || 0
          }
        })
      };

    case 'WebSite':
      return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SEO_CONFIG.siteName,
        url: baseUrl,
        description: SEO_CONFIG.defaultDescription,
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${baseUrl}/search?q={search_term_string}`
          },
          'query-input': 'required name=search_term_string'
        }
      };

    case 'Organization':
      return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SEO_CONFIG.siteName,
        url: baseUrl,
        logo: `${baseUrl}/logo/logo.png`,
        description: SEO_CONFIG.defaultDescription,
        sameAs: [
          'https://www.instagram.com/artandbridge',
          'https://www.facebook.com/artandbridge'
        ]
      };

    default:
      return baseStructuredData;
  }
}

export function generateBreadcrumbStructuredData(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url ? `${SEO_CONFIG.siteUrl}${item.url}` : undefined
    }))
  };
}

export function generateFAQStructuredData(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };
}

export function generateReviewStructuredData(reviews) {
  return {
    '@context': 'https://schema.org',
    '@type': 'AggregateRating',
    itemReviewed: {
      '@type': 'Thing',
      name: '아트앤브릿지'
    },
    ratingValue: reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length,
    reviewCount: reviews.length,
    bestRating: 5,
    worstRating: 1
  };
}

// 페이지별 SEO 설정
export const PAGE_SEO = {
  home: {
    title: '아트앤브릿지 - 전시회 리뷰와 예술 커뮤니티',
    description: '전시회 리뷰를 쓰고 전시티켓을 구매하세요! 아트앤브릿지에서 즐기는 예술 여행. 최신 전시회 정보, 작가 소개, 예술 커뮤니티를 만나보세요.',
    keywords: '전시회, 예술, 미술, 갤러리, 전시회 리뷰, 전시회 티켓, 예술 커뮤니티, 작가, 아트앤브릿지'
  },
  community: {
    title: '예술 커뮤니티 - 전시회 리뷰와 작가 소개',
    description: '전시회 리뷰, 작가 소개, 예술 토론이 활발한 커뮤니티. 아트앤브릿지에서 예술에 대한 다양한 이야기를 나눠보세요.',
    keywords: '예술 커뮤니티, 전시회 리뷰, 작가 소개, 예술 토론, 미술 갤러리, 전시회 정보'
  },
  exhibitions: {
    title: '전시회 정보 - 최신 전시회 일정과 티켓 구매',
    description: '최신 전시회 정보와 티켓 구매가 가능한 아트앤브릿지. 서울, 부산, 대구 등 전국 주요 갤러리의 전시회를 한눈에 확인하세요.',
    keywords: '전시회 정보, 전시회 티켓, 갤러리, 미술관, 전시회 일정, 예술 전시, 문화 행사'
  },
  artstore: {
    title: '아트 스토어 - 작가 작품 구매와 예술품 쇼핑',
    description: '인기 작가들의 작품을 직접 구매할 수 있는 아트 스토어. 독특하고 의미 있는 예술품으로 공간을 꾸며보세요.',
    keywords: '아트 스토어, 작가 작품, 예술품 구매, 미술품, 그림, 조각, 예술 쇼핑'
  },
  magazine: {
    title: '아트 매거진 - 예술가 인터뷰와 전시회 리뷰',
    description: '예술가 인터뷰, 전시회 리뷰, 예술 트렌드 분석이 담긴 아트 매거진. 깊이 있는 예술 콘텐츠를 만나보세요.',
    keywords: '아트 매거진, 예술가 인터뷰, 전시회 리뷰, 예술 트렌드, 미술 비평, 예술 분석'
  }
};

export default {
  generateSEOMeta,
  generateStructuredData,
  generateBreadcrumbStructuredData,
  generateFAQStructuredData,
  generateReviewStructuredData,
  SEO_CONFIG,
  PAGE_SEO
};
