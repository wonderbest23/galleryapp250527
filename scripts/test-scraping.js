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

async function testScraping() {
  try {
    console.log('Visit Seoul 스크래핑 테스트 시작...');
    
    const response = await makeRequest('http://localhost:3001/api/scrape-visitseoul', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        month: '202508',
        maxResults: 10,
        autoPublish: false
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log('✅ 스크래핑 성공!');
    console.log('수집된 전시 수:', result.count);
    console.log('전시 목록:');
    
    result.data.forEach((exhibition, index) => {
      console.log(`${index + 1}. ${exhibition.title}`);
      console.log(`   기간: ${exhibition.date}`);
      console.log(`   장소: ${exhibition.location}`);
      console.log(`   설명: ${exhibition.description}`);
      console.log('---');
    });

  } catch (error) {
    console.error('❌ 스크래핑 테스트 실패:', error);
  }
}

testScraping(); 