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
          text: () => data,
          json: () => JSON.parse(data)
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

async function testVisitSeoulAPI() {
  try {
    console.log('Visit Seoul API 테스트 시작...');
    
    // 1. 메인 페이지에서 JavaScript 파일 찾기
    console.log('📄 메인 페이지 분석 중...');
    const mainResponse = await makeRequest('https://korean.visitseoul.net/exhibition#tabAll&selectedMonth=202508', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8'
      }
    });

    if (!mainResponse.ok) {
      throw new Error(`메인 페이지 접근 실패: ${mainResponse.status}`);
    }

    const mainHtml = mainResponse.text();
    console.log(`✅ 메인 페이지 로드: ${mainHtml.length}자`);
    
    // 2. API 엔드포인트 찾기
    const apiPatterns = [
      /\/api\/[^"']+/g,
      /\/ajax\/[^"']+/g,
      /\/data\/[^"']+/g,
      /\/json\/[^"']+/g
    ];
    
    const foundAPIs = [];
    for (const pattern of apiPatterns) {
      const matches = mainHtml.match(pattern);
      if (matches) {
        foundAPIs.push(...matches);
      }
    }
    
    console.log(`🔍 발견된 API 엔드포인트: ${foundAPIs.length}개`);
    foundAPIs.slice(0, 5).forEach((api, index) => {
      console.log(`  ${index + 1}. ${api}`);
    });
    
    // 3. 전시 데이터 API 시도
    const possibleAPIs = [
      'https://korean.visitseoul.net/api/exhibition/list',
      'https://korean.visitseoul.net/api/exhibition/events',
      'https://korean.visitseoul.net/ajax/exhibition/list',
      'https://korean.visitseoul.net/data/exhibition.json',
      'https://korean.visitseoul.net/api/events?category=exhibition&month=202508'
    ];
    
    for (const apiUrl of possibleAPIs) {
      console.log(`\n🔍 API 테스트: ${apiUrl}`);
      
      try {
        const apiResponse = await makeRequest(apiUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
            'Referer': 'https://korean.visitseoul.net/exhibition'
          }
        });

        if (apiResponse.ok) {
          console.log(`✅ API 응답 성공: ${apiResponse.status}`);
          const data = apiResponse.json();
          console.log(`📊 응답 데이터:`, JSON.stringify(data, null, 2).substring(0, 500) + '...');
        } else {
          console.log(`❌ API 응답 실패: ${apiResponse.status}`);
        }
      } catch (error) {
        console.log(`❌ API 호출 오류: ${error.message}`);
      }
    }
    
    // 4. 실제 전시 상세 페이지 접근 시도
    console.log('\n🔍 실제 전시 상세 페이지 접근 시도...');
    const testUrls = [
      'https://korean.visitseoul.net/exhibition/detail/seoul-ymca',
      'https://korean.visitseoul.net/exhibition/detail/hanbyeol-artfair',
      'https://korean.visitseoul.net/exhibition/detail/hangang-sound'
    ];
    
    for (const testUrl of testUrls) {
      console.log(`\n📄 ${testUrl} 접근 중...`);
      
      try {
        const detailResponse = await makeRequest(testUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8'
          }
        });

        if (detailResponse.ok) {
          const detailHtml = detailResponse.text();
          console.log(`✅ 상세 페이지 로드: ${detailHtml.length}자`);
          
          // 이미지 URL 찾기
          const imageMatches = detailHtml.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi);
          if (imageMatches) {
            console.log(`🖼️ 이미지 발견: ${imageMatches.length}개`);
            imageMatches.slice(0, 3).forEach((img, index) => {
              const srcMatch = img.match(/src=["']([^"']+)["']/);
              if (srcMatch) {
                console.log(`  ${index + 1}. ${srcMatch[1]}`);
              }
            });
          }
          
          // 전시 정보 찾기
          const titleMatch = detailHtml.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/i);
          if (titleMatch) {
            console.log(`📝 제목: ${titleMatch[1].trim()}`);
          }
          
        } else {
          console.log(`❌ 상세 페이지 접근 실패: ${detailResponse.status}`);
        }
      } catch (error) {
        console.log(`❌ 상세 페이지 오류: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ API 테스트 실패:', error);
  }
}

testVisitSeoulAPI(); 