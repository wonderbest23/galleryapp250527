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

async function testPublishToCommunity() {
  try {
    console.log('Community 발행 테스트 시작...');
    
    // 1. 먼저 DB 스크랩 데이터 확인
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
    console.log(`✅ DB 스크랩 데이터: ${dbResult.data?.length || 0}개`);
    
    if (!dbResult.data || dbResult.data.length === 0) {
      console.log('❌ 발행할 스크랩 데이터가 없습니다.');
      return;
    }
    
    // 2. 첫 번째 항목만 community에 발행
    const testData = [dbResult.data[0]];
    console.log(`📝 테스트 발행: "${testData[0].title}"`);
    
    const publishResponse = await makeRequest('http://localhost:3001/api/publish-to-community', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: testData,
        deleteFromScraped: true
      })
    });

    if (!publishResponse.ok) {
      throw new Error(`발행 실패: ${publishResponse.status}`);
    }

    const publishResult = await publishResponse.json();
    console.log(`✅ Community 발행 성공: ${publishResult.published}/${publishResult.total}개`);
    console.log(`🗑️ 스크랩 데이터 삭제: ${publishResult.deletedFromScraped}개`);
    
    // 3. 발행된 포스트 확인
    if (publishResult.posts && publishResult.posts.length > 0) {
      console.log('\n📋 발행된 포스트:');
      publishResult.posts.forEach((post, index) => {
        console.log(`${index + 1}. ${post.title}`);
        console.log(`   ID: ${post.id}`);
        console.log(`   생성일: ${post.created_at}`);
        console.log('---');
      });
    }
    
    // 4. DB 스크랩 데이터 재확인
    const dbResponse2 = await makeRequest('http://localhost:3001/api/scraped-data', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!dbResponse2.ok) {
      throw new Error(`DB 재조회 실패: ${dbResponse2.status}`);
    }

    const dbResult2 = await dbResponse2.json();
    console.log(`✅ 발행 후 DB 스크랩 데이터: ${dbResult2.data?.length || 0}개`);

  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  }
}

testPublishToCommunity(); 