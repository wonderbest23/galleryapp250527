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

async function testDetailedPublish() {
  try {
    console.log('상세 정보 포함 발행 테스트 시작...');
    
    // 1. 먼저 스크래핑
    const scrapeResponse = await makeRequest('http://localhost:3001/api/scrape-visitseoul', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        month: '202508',
        maxResults: 3,
        autoPublish: false
      })
    });

    if (!scrapeResponse.ok) {
      throw new Error(`스크래핑 실패: ${scrapeResponse.status}`);
    }

    const scrapeResult = await scrapeResponse.json();
    console.log(`✅ 스크래핑 성공: ${scrapeResult.count}개 수집`);
    
    // 2. 상세 정보 확인
    console.log('\n📋 스크랩된 상세 정보:');
    scrapeResult.data.forEach((item, index) => {
      console.log(`${index + 1}. ${item.title}`);
      console.log(`   URL: ${item.url}`);
      console.log(`   이미지: ${item.imageUrl}`);
      console.log(`   상세내용 길이: ${item.detailedContent?.length || 0}자`);
      console.log('---');
    });
    
    // 3. community에 발행
    const publishResponse = await makeRequest('http://localhost:3001/api/publish-to-community', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: scrapeResult.data,
        deleteFromScraped: true
      })
    });

    if (!publishResponse.ok) {
      throw new Error(`발행 실패: ${publishResponse.status}`);
    }

    const publishResult = await publishResponse.json();
    console.log(`✅ Community 발행 성공: ${publishResult.published}/${publishResult.total}개`);
    
    // 4. 발행된 포스트 내용 확인
    if (publishResult.posts && publishResult.posts.length > 0) {
      console.log('\n📋 발행된 포스트 내용 미리보기:');
      publishResult.posts.forEach((post, index) => {
        console.log(`${index + 1}. ${post.title}`);
        console.log(`   내용 길이: ${post.content.length}자`);
        console.log(`   내용 미리보기: ${post.content.substring(0, 200)}...`);
        console.log('---');
      });
    }

  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  }
}

testDetailedPublish(); 