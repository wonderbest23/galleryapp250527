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

async function testPublish() {
  try {
    console.log('스크래핑 및 발행 테스트 시작...');
    
    // 1. 먼저 스크래핑
    const scrapeResponse = await makeRequest('http://localhost:3001/api/scrape-visitseoul', {
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

    if (!scrapeResponse.ok) {
      throw new Error(`스크래핑 실패: ${scrapeResponse.status}`);
    }

    const scrapeResult = await scrapeResponse.json();
    console.log(`✅ 스크래핑 성공: ${scrapeResult.count}개 수집`);
    
    // 2. 발행
    const publishResponse = await makeRequest('http://localhost:3001/api/publish-scraped', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: scrapeResult.data,
        source: 'visitSeoul'
      })
    });

    if (!publishResponse.ok) {
      throw new Error(`발행 실패: ${publishResponse.status}`);
    }

    const publishResult = await publishResponse.json();
    console.log(`✅ 발행 성공: ${publishResult.published}/${publishResult.total}개 발행됨`);
    
    // 3. DB 확인
    const dbResponse = await makeRequest('http://localhost:3001/api/scraped-data', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!dbResponse.ok) {
      throw new Error(`DB 조회 실패: ${dbResponse.status}`);
    }

    const dbResult = await dbResponse.json();
    console.log(`✅ DB 확인: ${dbResult.data?.length || 0}개 저장됨`);
    
    // 저장된 데이터 목록
    if (dbResult.data && dbResult.data.length > 0) {
      console.log('\n📋 저장된 전시 목록:');
      dbResult.data.forEach((item, index) => {
        console.log(`${index + 1}. ${item.title}`);
        console.log(`   URL: ${item.post_url}`);
        console.log(`   출처: ${item.source}`);
        console.log('---');
      });
    }

  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  }
}

testPublish(); 