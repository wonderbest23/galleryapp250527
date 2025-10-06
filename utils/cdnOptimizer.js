/**
 * CDN 및 트래픽 최적화 유틸리티
 * 비디오 스트리밍과 콘텐츠 전송 최적화
 */

export class CDNOptimizer {
  constructor() {
    this.cdnBaseUrl = process.env.NEXT_PUBLIC_CDN_URL || '';
    this.fallbackUrls = [];
    this.cacheSettings = {
      video: 'public, max-age=31536000', // 1년
      thumbnail: 'public, max-age=86400', // 1일
      metadata: 'public, max-age=3600' // 1시간
    };
  }

  /**
   * 비디오 URL 최적화
   */
  optimizeVideoUrl(originalUrl, options = {}) {
    const {
      quality = 'auto',
      format = 'webm',
      adaptive = true,
      thumbnail = false
    } = options;

    if (!originalUrl) return null;

    // CDN URL이 설정된 경우
    if (this.cdnBaseUrl) {
      const url = new URL(originalUrl);
      const cdnUrl = `${this.cdnBaseUrl}${url.pathname}`;
      
      // 쿼리 파라미터 추가
      const params = new URLSearchParams();
      
      if (quality !== 'auto') {
        params.set('q', quality);
      }
      
      if (format !== 'original') {
        params.set('f', format);
      }
      
      if (adaptive) {
        params.set('adaptive', '1');
      }
      
      if (thumbnail) {
        params.set('thumbnail', '1');
      }
      
      return `${cdnUrl}?${params.toString()}`;
    }

    return originalUrl;
  }

  /**
   * 적응형 비디오 스트리밍 URL 생성
   */
  generateAdaptiveStreamingUrls(originalUrl) {
    if (!originalUrl) return [];

    const qualities = [
      { label: '720p', quality: '720', bandwidth: '2000000' },
      { label: '480p', quality: '480', bandwidth: '1000000' },
      { label: '360p', quality: '360', bandwidth: '500000' },
      { label: '240p', quality: '240', bandwidth: '250000' }
    ];

    return qualities.map(q => ({
      ...q,
      url: this.optimizeVideoUrl(originalUrl, {
        quality: q.quality,
        format: 'webm',
        adaptive: true
      })
    }));
  }

  /**
   * 비디오 썸네일 URL 생성
   */
  generateThumbnailUrl(videoUrl, timeOffset = 0) {
    if (!videoUrl) return null;

    return this.optimizeVideoUrl(videoUrl, {
      thumbnail: true,
      time: timeOffset
    });
  }

  /**
   * 지연 로딩을 위한 Intersection Observer 설정
   */
  setupLazyLoading(selector = '.lazy-video') {
    if (typeof window === 'undefined') return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const video = entry.target;
          const src = video.dataset.src;
          
          if (src) {
            video.src = src;
            video.removeAttribute('data-src');
            observer.unobserve(video);
          }
        }
      });
    }, {
      rootMargin: '50px 0px',
      threshold: 0.1
    });

    // 기존 비디오 요소들 관찰
    document.querySelectorAll(selector).forEach(video => {
      observer.observe(video);
    });

    return observer;
  }

  /**
   * 비디오 프리로딩 전략
   */
  preloadVideo(url, priority = 'low') {
    if (typeof window === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    link.as = 'video';
    link.setAttribute('data-priority', priority);
    
    // 우선순위에 따른 로딩 전략
    if (priority === 'high') {
      link.setAttribute('fetchpriority', 'high');
    } else if (priority === 'low') {
      link.setAttribute('fetchpriority', 'low');
    }

    document.head.appendChild(link);
    
    return link;
  }

  /**
   * 비디오 캐싱 전략
   */
  setupVideoCaching() {
    if (typeof window === 'undefined') return;

    // Service Worker 등록 (선택적)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw-video.js')
        .then(registration => {
          console.log('Video Service Worker 등록됨:', registration);
        })
        .catch(error => {
          console.log('Service Worker 등록 실패:', error);
        });
    }
  }

  /**
   * 네트워크 상태에 따른 품질 조정
   */
  getOptimalQuality() {
    if (typeof window === 'undefined') return 'auto';

    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (!connection) return 'auto';

    const { effectiveType, downlink } = connection;

    // 네트워크 속도에 따른 품질 선택
    if (effectiveType === '4g' && downlink > 10) {
      return '720';
    } else if (effectiveType === '4g' && downlink > 5) {
      return '480';
    } else if (effectiveType === '3g' || downlink < 2) {
      return '360';
    } else {
      return '240';
    }
  }

  /**
   * 비디오 로딩 성능 모니터링
   */
  monitorVideoPerformance(videoElement, onMetrics) {
    if (!videoElement) return;

    const startTime = performance.now();
    let loadStartTime = null;
    let canPlayTime = null;

    const metrics = {
      loadStart: 0,
      canPlay: 0,
      totalLoadTime: 0,
      buffered: 0,
      networkSpeed: 0
    };

    videoElement.addEventListener('loadstart', () => {
      loadStartTime = performance.now();
      metrics.loadStart = loadStartTime - startTime;
    });

    videoElement.addEventListener('canplay', () => {
      canPlayTime = performance.now();
      metrics.canPlay = canPlayTime - startTime;
      metrics.totalLoadTime = canPlayTime - startTime;
      
      // 네트워크 속도 계산
      if (videoElement.buffered.length > 0) {
        const bufferedBytes = videoElement.buffered.end(0) * 1000000; // 대략적인 바이트 수
        metrics.networkSpeed = bufferedBytes / (metrics.totalLoadTime / 1000);
      }
      
      onMetrics?.(metrics);
    });

    videoElement.addEventListener('progress', () => {
      if (videoElement.buffered.length > 0) {
        metrics.buffered = videoElement.buffered.end(0);
      }
    });

    return metrics;
  }

  /**
   * 비디오 압축 및 최적화
   */
  async compressVideo(file, options = {}) {
    const {
      maxSize = 50 * 1024 * 1024, // 50MB
      quality = 0.8,
      maxWidth = 1080,
      maxHeight = 1920
    } = options;

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const video = document.createElement('video');

      video.preload = 'metadata';
      video.muted = true;

      video.onloadedmetadata = () => {
        // 크기 계산
        let { width, height } = this.calculateOptimalSize(
          video.videoWidth,
          video.videoHeight,
          maxWidth,
          maxHeight
        );

        canvas.width = width;
        canvas.height = height;

        // MediaRecorder 설정
        const stream = canvas.captureStream(30);
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9',
          videoBitsPerSecond: 2000000
        });

        const chunks = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          
          if (blob.size <= maxSize) {
            const compressedFile = new File([blob], file.name, {
              type: 'video/webm',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            // 더 강한 압축 필요
            this.compressVideo(file, {
              ...options,
              quality: quality * 0.8,
              maxSize: maxSize * 0.8
            }).then(resolve).catch(reject);
          }
        };

        // 비디오 재생 및 녹화
        video.currentTime = 0;
        video.play();

        const drawFrame = () => {
          if (video.paused || video.ended) {
            mediaRecorder.stop();
            return;
          }

          ctx.drawImage(video, 0, 0, width, height);
          requestAnimationFrame(drawFrame);
        };

        video.onplay = () => {
          mediaRecorder.start();
          drawFrame();
        };

        mediaRecorder.onerror = (event) => {
          reject(new Error('비디오 압축 중 오류 발생'));
        };
      };

      video.onerror = () => {
        reject(new Error('비디오를 읽을 수 없습니다.'));
      };

      video.src = URL.createObjectURL(file);
    });
  }

  /**
   * 최적 크기 계산
   */
  calculateOptimalSize(originalWidth, originalHeight, maxWidth, maxHeight) {
    const aspectRatio = originalWidth / originalHeight;
    const maxAspectRatio = maxWidth / maxHeight;

    let width, height;

    if (aspectRatio > maxAspectRatio) {
      // 가로가 더 긴 경우
      width = Math.min(maxWidth, originalWidth);
      height = width / aspectRatio;
    } else {
      // 세로가 더 긴 경우
      height = Math.min(maxHeight, originalHeight);
      width = height * aspectRatio;
    }

    return {
      width: Math.round(width),
      height: Math.round(height)
    };
  }

  /**
   * CDN 헬스 체크
   */
  async checkCDNHealth() {
    if (!this.cdnBaseUrl) return { healthy: true };

    try {
      const response = await fetch(`${this.cdnBaseUrl}/health`, {
        method: 'HEAD',
        timeout: 5000
      });

      return {
        healthy: response.ok,
        status: response.status,
        responseTime: Date.now()
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  /**
   * 폴백 URL 설정
   */
  setFallbackUrls(urls) {
    this.fallbackUrls = urls;
  }

  /**
   * 폴백 URL로 전환
   */
  getFallbackUrl(originalUrl, attempt = 0) {
    if (attempt >= this.fallbackUrls.length) {
      return originalUrl; // 원본 URL 반환
    }

    return this.fallbackUrls[attempt];
  }
}

export default CDNOptimizer;
