/**
 * SEO 감사 및 최적화 체크 스크립트
 */

const fs = require('fs');
const path = require('path');

// SEO 체크리스트
const SEO_CHECKLIST = {
  metaTags: {
    title: '페이지 제목이 적절한 길이(30-60자)인가?',
    description: '메타 설명이 적절한 길이(120-160자)인가?',
    keywords: '키워드가 설정되어 있는가?',
    canonical: 'Canonical URL이 설정되어 있는가?',
    robots: 'Robots 메타태그가 설정되어 있는가?'
  },
  
  structuredData: {
    jsonLd: 'JSON-LD 구조화된 데이터가 있는가?',
    schema: 'Schema.org 마크업이 적절한가?',
    breadcrumbs: 'Breadcrumb 구조화된 데이터가 있는가?'
  },
  
  technical: {
    sitemap: '사이트맵이 생성되고 있는가?',
    robots: 'robots.txt가 적절히 설정되어 있는가?',
    manifest: 'Web App Manifest가 있는가?',
    favicon: 'Favicon이 설정되어 있는가?',
    mobile: '모바일 최적화가 되어 있는가?'
  },
  
  content: {
    headings: 'H1, H2, H3 태그가 적절히 사용되고 있는가?',
    images: '이미지에 alt 텍스트가 있는가?',
    links: '링크에 적절한 텍스트가 있는가?',
    content: '콘텐츠가 충분한 길이인가?'
  },
  
  performance: {
    speed: '페이지 로딩 속도가 빠른가?',
    images: '이미지가 최적화되어 있는가?',
    css: 'CSS가 최적화되어 있는가?',
    js: 'JavaScript가 최적화되어 있는가?'
  }
};

// 파일 존재 여부 확인
function checkFileExists(filePath) {
  return fs.existsSync(path.resolve(filePath));
}

// 파일 내용 확인
function checkFileContent(filePath, searchText) {
  try {
    const content = fs.readFileSync(path.resolve(filePath), 'utf8');
    return content.includes(searchText);
  } catch (error) {
    return false;
  }
}

// SEO 감사 실행
function runSEOAudit() {
  console.log('🔍 SEO 감사 시작...\n');
  
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    details: []
  };

  // 1. 메타 태그 체크
  console.log('📋 메타 태그 체크');
  console.log('================');
  
  const headFile = 'app/head.js';
  if (checkFileExists(headFile)) {
    const headContent = fs.readFileSync(headFile, 'utf8');
    
    // Title 체크
    if (headContent.includes('<title>')) {
      console.log('✅ 페이지 제목 설정됨');
      results.passed++;
    } else {
      console.log('❌ 페이지 제목 누락');
      results.failed++;
    }
    
    // Description 체크
    if (headContent.includes('meta name="description"')) {
      console.log('✅ 메타 설명 설정됨');
      results.passed++;
    } else {
      console.log('❌ 메타 설명 누락');
      results.failed++;
    }
    
    // Keywords 체크
    if (headContent.includes('meta name="keywords"')) {
      console.log('✅ 키워드 설정됨');
      results.passed++;
    } else {
      console.log('⚠️  키워드 누락 (선택사항)');
      results.warnings++;
    }
    
    // Canonical 체크
    if (headContent.includes('rel="canonical"')) {
      console.log('✅ Canonical URL 설정됨');
      results.passed++;
    } else {
      console.log('❌ Canonical URL 누락');
      results.failed++;
    }
    
    // Robots 체크
    if (headContent.includes('meta name="robots"')) {
      console.log('✅ Robots 메타태그 설정됨');
      results.passed++;
    } else {
      console.log('❌ Robots 메타태그 누락');
      results.failed++;
    }
  } else {
    console.log('❌ head.js 파일을 찾을 수 없습니다');
    results.failed++;
  }
  
  console.log('');

  // 2. 구조화된 데이터 체크
  console.log('🏗️  구조화된 데이터 체크');
  console.log('=======================');
  
  if (checkFileExists('utils/seo.js')) {
    console.log('✅ SEO 유틸리티 파일 존재');
    results.passed++;
    
    const seoContent = fs.readFileSync('utils/seo.js', 'utf8');
    
    if (seoContent.includes('generateStructuredData')) {
      console.log('✅ 구조화된 데이터 생성 함수 존재');
      results.passed++;
    } else {
      console.log('❌ 구조화된 데이터 생성 함수 누락');
      results.failed++;
    }
    
    if (seoContent.includes('Schema.org')) {
      console.log('✅ Schema.org 마크업 지원');
      results.passed++;
    } else {
      console.log('❌ Schema.org 마크업 누락');
      results.failed++;
    }
  } else {
    console.log('❌ SEO 유틸리티 파일 누락');
    results.failed++;
  }
  
  console.log('');

  // 3. 기술적 SEO 체크
  console.log('⚙️  기술적 SEO 체크');
  console.log('==================');
  
  // 사이트맵 체크
  if (checkFileExists('app/sitemap.js')) {
    console.log('✅ 동적 사이트맵 생성됨');
    results.passed++;
  } else {
    console.log('❌ 동적 사이트맵 누락');
    results.failed++;
  }
  
  // robots.txt 체크
  if (checkFileExists('public/robots.txt')) {
    console.log('✅ robots.txt 존재');
    results.passed++;
    
    const robotsContent = fs.readFileSync('public/robots.txt', 'utf8');
    if (robotsContent.includes('Sitemap:')) {
      console.log('✅ 사이트맵 URL 포함됨');
      results.passed++;
    } else {
      console.log('⚠️  사이트맵 URL 누락');
      results.warnings++;
    }
  } else {
    console.log('❌ robots.txt 누락');
    results.failed++;
  }
  
  // Web App Manifest 체크
  if (checkFileExists('public/site.webmanifest')) {
    console.log('✅ Web App Manifest 존재');
    results.passed++;
  } else {
    console.log('⚠️  Web App Manifest 누락');
    results.warnings++;
  }
  
  // Favicon 체크
  if (checkFileExists('public/favicon.ico')) {
    console.log('✅ Favicon 존재');
    results.passed++;
  } else {
    console.log('❌ Favicon 누락');
    results.failed++;
  }
  
  console.log('');

  // 4. Next.js 설정 체크
  console.log('⚡ Next.js 설정 체크');
  console.log('===================');
  
  if (checkFileExists('next.config.js')) {
    const nextConfig = fs.readFileSync('next.config.js', 'utf8');
    
    if (nextConfig.includes('headers')) {
      console.log('✅ 커스텀 헤더 설정됨');
      results.passed++;
    } else {
      console.log('⚠️  커스텀 헤더 설정 누락');
      results.warnings++;
    }
    
    if (nextConfig.includes('images')) {
      console.log('✅ 이미지 최적화 설정됨');
      results.passed++;
    } else {
      console.log('❌ 이미지 최적화 설정 누락');
      results.failed++;
    }
  } else {
    console.log('❌ next.config.js 파일을 찾을 수 없습니다');
    results.failed++;
  }
  
  console.log('');

  // 5. 결과 요약
  console.log('📊 SEO 감사 결과 요약');
  console.log('=====================');
  console.log(`✅ 통과: ${results.passed}개`);
  console.log(`❌ 실패: ${results.failed}개`);
  console.log(`⚠️  경고: ${results.warnings}개`);
  
  const total = results.passed + results.failed + results.warnings;
  const score = Math.round((results.passed / total) * 100);
  
  console.log(`\n🎯 SEO 점수: ${score}점`);
  
  if (score >= 90) {
    console.log('🌟 훌륭합니다! SEO가 매우 잘 최적화되어 있습니다.');
  } else if (score >= 80) {
    console.log('👍 좋습니다! SEO가 잘 최적화되어 있습니다.');
  } else if (score >= 70) {
    console.log('⚠️  개선이 필요합니다. SEO 최적화를 더 진행해주세요.');
  } else {
    console.log('❌ SEO 최적화가 많이 부족합니다. 즉시 개선이 필요합니다.');
  }
  
  console.log('\n📝 개선 권장사항:');
  if (results.failed > 0) {
    console.log('- 실패한 항목들을 우선적으로 수정해주세요.');
  }
  if (results.warnings > 0) {
    console.log('- 경고 항목들을 검토하여 개선해주세요.');
  }
  
  console.log('\n🔗 유용한 링크:');
  console.log('- 구글 서치 콘솔: https://search.google.com/search-console');
  console.log('- 네이버 서치 어드바이저: https://searchadvisor.naver.com');
  console.log('- PageSpeed Insights: https://pagespeed.web.dev/');
  console.log('- 구조화된 데이터 테스트: https://search.google.com/test/rich-results');
  
  return results;
}

// 스크립트 실행
if (require.main === module) {
  runSEOAudit();
}

module.exports = {
  runSEOAudit,
  SEO_CHECKLIST
};
