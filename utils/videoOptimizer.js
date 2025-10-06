/**
 * 비디오 최적화 유틸리티
 * 모바일 업로드 비디오를 자동으로 최적화하고 리사이징
 */

export class VideoOptimizer {
  constructor() {
    this.maxDuration = 60; // 1분 제한
    this.maxFileSize = 100 * 1024 * 1024; // 100MB 제한
    this.targetResolution = { width: 1080, height: 1920 }; // 9:16 비율 (인스타그램 릴스 스타일)
    this.targetBitrate = 2000000; // 2Mbps
    this.targetFramerate = 30;
  }

  /**
   * 비디오 파일 유효성 검사
   */
  validateVideo(file) {
    const errors = [];

    // 파일 타입 검사
    if (!file.type.startsWith('video/')) {
      errors.push('비디오 파일만 업로드 가능합니다.');
    }

    // 파일 크기 검사
    if (file.size > this.maxFileSize) {
      errors.push(`파일 크기는 ${this.maxFileSize / (1024 * 1024)}MB를 초과할 수 없습니다.`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 비디오 메타데이터 추출
   */
  async getVideoMetadata(file) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = () => {
        const duration = video.duration;
        const width = video.videoWidth;
        const height = video.videoHeight;
        
        resolve({
          duration,
          width,
          height,
          aspectRatio: width / height,
          needsOptimization: duration > this.maxDuration || 
                           width > this.targetResolution.width || 
                           height > this.targetResolution.height
        });
      };

      video.onerror = () => {
        reject(new Error('비디오 메타데이터를 읽을 수 없습니다.'));
      };

      video.src = URL.createObjectURL(file);
    });
  }

  /**
   * 비디오 최적화 (클라이언트 사이드)
   */
  async optimizeVideo(file) {
    const metadata = await this.getVideoMetadata(file);
    
    if (!metadata.needsOptimization) {
      return file;
    }

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const video = document.createElement('video');
      
      video.preload = 'metadata';
      video.muted = true;
      
      video.onloadedmetadata = () => {
        // 비율에 따른 리사이징 계산
        const { width, height } = this.calculateOptimalSize(
          video.videoWidth, 
          video.videoHeight
        );
        
        canvas.width = width;
        canvas.height = height;
        
        // MediaRecorder를 사용한 최적화
        this.recordOptimizedVideo(video, canvas, ctx, file)
          .then(resolve)
          .catch(reject);
      };

      video.onerror = () => {
        reject(new Error('비디오 최적화 중 오류가 발생했습니다.'));
      };

      video.src = URL.createObjectURL(file);
    });
  }

  /**
   * 최적 크기 계산
   */
  calculateOptimalSize(originalWidth, originalHeight) {
    const aspectRatio = originalWidth / originalHeight;
    const targetAspectRatio = this.targetResolution.width / this.targetResolution.height;

    let width, height;

    if (aspectRatio > targetAspectRatio) {
      // 가로가 더 긴 경우
      width = Math.min(this.targetResolution.width, originalWidth);
      height = width / aspectRatio;
    } else {
      // 세로가 더 긴 경우
      height = Math.min(this.targetResolution.height, originalHeight);
      width = height * aspectRatio;
    }

    return {
      width: Math.round(width),
      height: Math.round(height)
    };
  }

  /**
   * MediaRecorder를 사용한 비디오 최적화
   */
  async recordOptimizedVideo(video, canvas, ctx, originalFile) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      const stream = canvas.captureStream(this.targetFramerate);
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: this.targetBitrate
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const optimizedFile = new File([blob], originalFile.name, {
          type: 'video/webm',
          lastModified: Date.now()
        });
        
        URL.revokeObjectURL(video.src);
        resolve(optimizedFile);
      };

      mediaRecorder.onerror = (event) => {
        URL.revokeObjectURL(video.src);
        reject(new Error('비디오 녹화 중 오류가 발생했습니다.'));
      };

      // 비디오 재생 및 캔버스에 그리기
      video.currentTime = 0;
      video.play();

      const drawFrame = () => {
        if (video.paused || video.ended) {
          mediaRecorder.stop();
          return;
        }

        // 캔버스에 비디오 프레임 그리기
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        requestAnimationFrame(drawFrame);
      };

      video.onplay = () => {
        mediaRecorder.start();
        drawFrame();
      };

      // 1분 제한
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, this.maxDuration * 1000);
    });
  }

  /**
   * 비디오 트리밍 (자르기)
   */
  async trimVideo(file, startTime = 0, endTime = null) {
    const metadata = await this.getVideoMetadata(file);
    const duration = endTime || Math.min(metadata.duration, this.maxDuration);

    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      video.preload = 'metadata';
      video.muted = true;
      
      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const stream = canvas.captureStream(this.targetFramerate);
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9',
          videoBitsPerSecond: this.targetBitrate
        });

        const chunks = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const trimmedFile = new File([blob], file.name, {
            type: 'video/webm',
            lastModified: Date.now()
          });
          
          URL.revokeObjectURL(video.src);
          resolve(trimmedFile);
        };

        // 지정된 시간부터 재생
        video.currentTime = startTime;
        video.play();

        const drawFrame = () => {
          if (video.currentTime >= duration || video.ended) {
            mediaRecorder.stop();
            return;
          }

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          requestAnimationFrame(drawFrame);
        };

        video.onplay = () => {
          mediaRecorder.start();
          drawFrame();
        };

        mediaRecorder.onerror = (event) => {
          URL.revokeObjectURL(video.src);
          reject(new Error('비디오 트리밍 중 오류가 발생했습니다.'));
        };
      };

      video.onerror = () => {
        reject(new Error('비디오를 읽을 수 없습니다.'));
      };

      video.src = URL.createObjectURL(file);
    });
  }

  /**
   * 업로드 진행률 추적
   */
  async uploadWithProgress(file, uploadFunction, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          onProgress(percentComplete);
        }
      });

      xhr.onload = () => {
        if (xhr.status === 200) {
          resolve(xhr.response);
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      };

      xhr.onerror = () => {
        reject(new Error('Upload failed'));
      };

      const formData = new FormData();
      formData.append('video', file);

      xhr.open('POST', '/api/upload-video');
      xhr.send(formData);
    });
  }
}

export default VideoOptimizer;
