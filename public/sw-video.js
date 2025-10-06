/**
 * 비디오 스트리밍을 위한 Service Worker
 * 캐싱 및 오프라인 지원
 */

const CACHE_NAME = 'video-cache-v1';
const VIDEO_CACHE_NAME = 'video-files-v1';
const STATIC_CACHE_NAME = 'static-resources-v1';

// 캐시할 리소스들
const STATIC_RESOURCES = [
  '/',
  '/community',
  '/community/write',
  '/_next/static/css/app/(client)/layout.css',
  '/_next/static/css/app/(client)/page.css',
  '/_next/static/css/app/(client)/community/page.css'
];

// 비디오 파일 확장자
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.ogg', '.mov', '.avi'];

// 설치 이벤트
self.addEventListener('install', (event) => {
  console.log('Service Worker 설치 중...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('정적 리소스 캐싱 중...');
        return cache.addAll(STATIC_RESOURCES);
      })
      .then(() => {
        console.log('Service Worker 설치 완료');
        return self.skipWaiting();
      })
  );
});

// 활성화 이벤트
self.addEventListener('activate', (event) => {
  console.log('Service Worker 활성화 중...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== VIDEO_CACHE_NAME && 
                cacheName !== STATIC_CACHE_NAME) {
              console.log('오래된 캐시 삭제:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker 활성화 완료');
        return self.clients.claim();
      })
  );
});

// 페치 이벤트
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 비디오 파일 처리
  if (isVideoRequest(request)) {
    event.respondWith(handleVideoRequest(request));
    return;
  }

  // API 요청 처리
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // 정적 리소스 처리
  if (isStaticResource(request)) {
    event.respondWith(handleStaticRequest(request));
    return;
  }

  // 기본 네트워크 요청
  event.respondWith(fetch(request));
});

// 비디오 요청 처리
async function handleVideoRequest(request) {
  const cache = await caches.open(VIDEO_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    console.log('비디오 캐시에서 로드:', request.url);
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // 비디오 파일을 캐시에 저장
      const responseClone = networkResponse.clone();
      cache.put(request, responseClone);
      console.log('비디오 캐시에 저장:', request.url);
    }

    return networkResponse;
  } catch (error) {
    console.error('비디오 로드 실패:', error);
    
    // 폴백 비디오 반환
    return new Response(
      '<div style="display:flex;align-items:center;justify-content:center;height:200px;background:#000;color:#fff;">비디오를 로드할 수 없습니다</div>',
      {
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}

// API 요청 처리
async function handleApiRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    // 성공적인 API 응답을 캐시에 저장
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('API 요청 실패:', error);
    
    // 캐시에서 응답 찾기
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }

    return new Response(
      JSON.stringify({ error: '네트워크 오류' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// 정적 리소스 요청 처리
async function handleStaticRequest(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('정적 리소스 로드 실패:', error);
    return new Response('리소스를 로드할 수 없습니다', { status: 404 });
  }
}

// 비디오 요청인지 확인
function isVideoRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname.toLowerCase();
  
  return VIDEO_EXTENSIONS.some(ext => pathname.endsWith(ext)) ||
         request.headers.get('accept')?.includes('video/') ||
         pathname.includes('community-videos');
}

// 정적 리소스인지 확인
function isStaticResource(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  return pathname.startsWith('/_next/static/') ||
         pathname.endsWith('.css') ||
         pathname.endsWith('.js') ||
         pathname.endsWith('.png') ||
         pathname.endsWith('.jpg') ||
         pathname.endsWith('.jpeg') ||
         pathname.endsWith('.gif') ||
         pathname.endsWith('.svg');
}

// 백그라운드 동기화 (선택적)
self.addEventListener('sync', (event) => {
  if (event.tag === 'video-upload') {
    event.waitUntil(handleVideoUploadSync());
  }
});

// 비디오 업로드 동기화 처리
async function handleVideoUploadSync() {
  try {
    // 오프라인 상태에서 실패한 업로드 재시도
    const cache = await caches.open('upload-queue');
    const requests = await cache.keys();
    
    for (const request of requests) {
      try {
        await fetch(request);
        await cache.delete(request);
        console.log('업로드 재시도 성공:', request.url);
      } catch (error) {
        console.error('업로드 재시도 실패:', error);
      }
    }
  } catch (error) {
    console.error('동기화 처리 실패:', error);
  }
}

// 푸시 알림 처리 (선택적)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: data.tag || 'video-notification',
      data: data.data || {}
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const url = event.notification.data?.url || '/community';
  
  event.waitUntil(
    clients.openWindow(url)
  );
});

console.log('비디오 Service Worker 로드됨');
