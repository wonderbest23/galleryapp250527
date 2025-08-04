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

async function testImageScraping() {
  try {
    console.log('이미지 스크래핑 테스트 시작...');
    
    // 테스트할 전시 정보
    const testExhibitions = [
      {
        title: '서울YMCA, 청년이 만든 시민의 역사',
        url: 'https://korean.visitseoul.net/exhibition/detail/서울YMCA-청년이-만든-시민의-역사'
      },
      {
        title: '제1회 한별아트페어ㅣ여여자연 如如自然',
        url: 'https://korean.visitseoul.net/exhibition/detail/한별아트페어-여여자연'
      },
      {
        title: '한강, 소리로 흐른다',
        url: 'https://korean.visitseoul.net/exhibition/detail/한강-소리로-흐른다'
      }
    ];

    for (const exhibition of testExhibitions) {
      console.log(`\n📸 ${exhibition.title} 이미지 스크래핑 중...`);
      
      const response = await makeRequest('http://localhost:3001/api/scrape-exhibition-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          exhibitionUrl: exhibition.url,
          title: exhibition.title
        })
      });

      if (!response.ok) {
        console.error(`❌ 이미지 스크래핑 실패: ${response.status}`);
        continue;
      }

      const result = await response.json();
      console.log(`✅ 이미지 스크래핑 성공: ${result.count}개 발견`);
      
      if (result.images && result.images.length > 0) {
        console.log('📋 발견된 이미지들:');
        result.images.forEach((image, index) => {
          console.log(`  ${index + 1}. ${image}`);
        });
      } else {
        console.log('⚠️ 발견된 이미지가 없습니다.');
      }
      
      if (result.note) {
        console.log(`📝 참고: ${result.note}`);
      }
    }

  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  }
}

testImageScraping(); 