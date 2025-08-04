const https = require('https');
const http = require('http');

function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const req = client.request(urlObj, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 300,
          status: res.statusCode,
          statusText: res.statusMessage,
          text: () => data
        });
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function analyzeExhibitionPage() {
  try {
    console.log('전시 상세 페이지 분석 시작...');
    
    // 실제 Visit Seoul 전시 목록 페이지 접근
    const mainUrl = 'https://korean.visitseoul.net/exhibition#tabAll&selectedMonth=202508';
    
    console.log(`📄 메인 페이지 접근: ${mainUrl}`);
    
    const response = await makeRequest(mainUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = response.text();
    console.log(`✅ 메인 페이지 로드 성공: ${html.length}자`);
    
    // 전시 카드 링크 찾기
    const cardLinks = extractExhibitionLinks(html);
    console.log(`📋 발견된 전시 링크: ${cardLinks.length}개`);
    
    cardLinks.forEach((link, index) => {
      console.log(`${index + 1}. ${link.title} - ${link.url}`);
    });
    
    // 첫 번째 전시 상세 페이지 분석
    if (cardLinks.length > 0) {
      const firstExhibition = cardLinks[0];
      console.log(`\n🔍 첫 번째 전시 상세 분석: ${firstExhibition.title}`);
      
      const detailResponse = await makeRequest(firstExhibition.url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });

      if (detailResponse.ok) {
        const detailHtml = detailResponse.text();
        console.log(`✅ 상세 페이지 로드 성공: ${detailHtml.length}자`);
        
        // 상세 페이지 구조 분석
        analyzeDetailPageStructure(detailHtml, firstExhibition.title);
      } else {
        console.log(`❌ 상세 페이지 로드 실패: ${detailResponse.status}`);
      }
    }

  } catch (error) {
    console.error('❌ 분석 실패:', error);
  }
}

// 전시 링크 추출
function extractExhibitionLinks(html) {
  const links = [];
  
  try {
    // 전시 카드 링크 패턴들
    const linkPatterns = [
      /<a[^>]+href=["']([^"']*exhibition[^"']*)["'][^>]*>([^<]+)<\/a>/gi,
      /<a[^>]+href=["']([^"']*detail[^"']*)["'][^>]*>([^<]+)<\/a>/gi,
      /href=["']([^"']*exhibition[^"']*)["'][^>]*>([^<]*전시[^<]*)</gi
    ];

    for (const pattern of linkPatterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        const url = match[1];
        const title = match[2].trim();
        
        if (url && title && title.length > 5 && !links.some(link => link.url === url)) {
          // 상대 URL을 절대 URL로 변환
          let fullUrl = url;
          if (url.startsWith('/')) {
            fullUrl = `https://korean.visitseoul.net${url}`;
          } else if (!url.startsWith('http')) {
            fullUrl = `https://korean.visitseoul.net/${url}`;
          }
          
          links.push({
            title: title,
            url: fullUrl
          });
        }
      }
    }

    return links.slice(0, 5); // 처음 5개만 반환

  } catch (error) {
    console.error('링크 추출 오류:', error);
    return [];
  }
}

// 상세 페이지 구조 분석
function analyzeDetailPageStructure(html, title) {
  console.log(`\n📊 "${title}" 상세 페이지 구조 분석:`);
  
  // 제목 찾기
  const titleMatch = html.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i);
  if (titleMatch) {
    console.log(`📝 제목: ${titleMatch[1].trim()}`);
  }
  
  // 이미지 찾기
  const imageMatches = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi);
  if (imageMatches) {
    console.log(`🖼️ 이미지 태그: ${imageMatches.length}개`);
    imageMatches.slice(0, 3).forEach((img, index) => {
      const srcMatch = img.match(/src=["']([^"']+)["']/);
      if (srcMatch) {
        console.log(`  ${index + 1}. ${srcMatch[1]}`);
      }
    });
  }
  
  // 설명 텍스트 찾기
  const descriptionMatches = html.match(/<p[^>]*>([^<]+)<\/p>/gi);
  if (descriptionMatches) {
    console.log(`📄 설명 문단: ${descriptionMatches.length}개`);
    descriptionMatches.slice(0, 3).forEach((p, index) => {
      const textMatch = p.match(/<p[^>]*>([^<]+)<\/p>/);
      if (textMatch) {
        const text = textMatch[1].trim();
        if (text.length > 20) {
          console.log(`  ${index + 1}. ${text.substring(0, 100)}...`);
        }
      }
    });
  }
  
  // 날짜 정보 찾기
  const dateMatches = html.match(/\d{4}\.\d{2}\.\d{2}\s*~\s*\d{4}\.\d{2}\.\d{2}/g);
  if (dateMatches) {
    console.log(`📅 날짜 정보: ${dateMatches.join(', ')}`);
  }
  
  // 장소 정보 찾기
  const locationMatches = html.match(/장소[:\s]*([^<>\n]+)/gi);
  if (locationMatches) {
    console.log(`📍 장소 정보: ${locationMatches.join(', ')}`);
  }
}

analyzeExhibitionPage(); 