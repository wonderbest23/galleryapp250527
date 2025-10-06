"use client";
import React, { useState, useRef, useCallback } from 'react';
import { FiUpload, FiX, FiPlay, FiPause, FiRotateCcw } from 'react-icons/fi';
import VideoOptimizer from '@/utils/videoOptimizer';

export default function VideoUploader({ 
  onVideoSelect, 
  onVideoRemove, 
  selectedVideo, 
  videoPreview 
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState(0);
  const [showEditor, setShowEditor] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(60);
  
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const optimizer = useRef(new VideoOptimizer());

  const handleFileSelect = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 파일 유효성 검사
    const validation = optimizer.current.validateVideo(file);
    if (!validation.isValid) {
      alert(validation.errors.join('\n'));
      return;
    }

    try {
      setIsOptimizing(true);
      setOptimizationProgress(0);

      // 비디오 메타데이터 확인
      const metadata = await optimizer.current.getVideoMetadata(file);
      console.log('Video metadata:', metadata);

      // 1분 초과 시 자동 트리밍
      if (metadata.duration > 60) {
        const shouldTrim = confirm(
          `비디오가 1분을 초과합니다 (${Math.round(metadata.duration)}초). 1분으로 자동 자르시겠습니까?`
        );
        
        if (shouldTrim) {
          const optimizedFile = await optimizer.current.trimVideo(file, 0, 60);
          onVideoSelect(optimizedFile);
          setTrimEnd(60);
        } else {
          return;
        }
      } else {
        // 최적화가 필요한 경우 자동 최적화
        if (metadata.needsOptimization) {
          const optimizedFile = await optimizer.current.optimizeVideo(file);
          onVideoSelect(optimizedFile);
        } else {
          onVideoSelect(file);
        }
      }

      setDuration(Math.min(metadata.duration, 60));
      setTrimEnd(Math.min(metadata.duration, 60));
      setShowEditor(true);

    } catch (error) {
      console.error('Video processing error:', error);
      alert('비디오 처리 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsOptimizing(false);
      setOptimizationProgress(0);
    }
  }, [onVideoSelect]);

  const handleUpload = useCallback(async () => {
    if (!selectedVideo) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('video', selectedVideo);

      const response = await fetch('/api/upload-video', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      console.log('Upload result:', result);
      
      // 업로드 완료 후 처리
      alert('비디오 업로드가 완료되었습니다!');

    } catch (error) {
      console.error('Upload error:', error);
      alert('업로드 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [selectedVideo]);

  const handleTrim = useCallback(async () => {
    if (!selectedVideo) return;

    try {
      setIsOptimizing(true);
      const trimmedVideo = await optimizer.current.trimVideo(
        selectedVideo, 
        trimStart, 
        trimEnd
      );
      onVideoSelect(trimmedVideo);
      alert('비디오가 성공적으로 자르기되었습니다!');
    } catch (error) {
      console.error('Trim error:', error);
      alert('비디오 자르기 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsOptimizing(false);
    }
  }, [selectedVideo, trimStart, trimEnd, onVideoSelect]);

  const handlePlayPause = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSliderChange = (type, value) => {
    if (!videoRef.current) return;
    
    if (type === 'start') {
      setTrimStart(parseFloat(value));
      videoRef.current.currentTime = parseFloat(value);
    } else {
      setTrimEnd(parseFloat(value));
    }
  };

  return (
    <div className="w-full">
      {/* 파일 선택 영역 */}
      {!selectedVideo && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          <FiUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-900 mb-2">
            비디오 업로드
          </p>
          <p className="text-sm text-gray-500 mb-4">
            최대 1분, 100MB까지 업로드 가능
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            파일 선택
          </button>
        </div>
      )}

      {/* 비디오 미리보기 및 편집기 */}
      {selectedVideo && (
        <div className="space-y-4">
          {/* 비디오 플레이어 */}
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              src={videoPreview}
              className="w-full h-auto max-h-96"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  setDuration(videoRef.current.duration);
                }
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            
            {/* 플레이어 컨트롤 */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handlePlayPause}
                  className="text-white hover:text-blue-400 transition-colors"
                >
                  {isPlaying ? <FiPause size={24} /> : <FiPlay size={24} />}
                </button>
                
                <div className="flex-1">
                  <div className="text-white text-sm mb-1">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </div>
                  <div className="w-full bg-gray-600 rounded-full h-1">
                    <div 
                      className="bg-blue-500 h-1 rounded-full transition-all"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 편집 컨트롤 */}
          {showEditor && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <h3 className="font-medium text-gray-900">비디오 편집</h3>
              
              {/* 트리밍 슬라이더 */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  시작 시간: {formatTime(trimStart)}
                </label>
                <input
                  type="range"
                  min="0"
                  max={duration}
                  step="0.1"
                  value={trimStart}
                  onChange={(e) => handleSliderChange('start', e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  종료 시간: {formatTime(trimEnd)}
                </label>
                <input
                  type="range"
                  min="0"
                  max={duration}
                  step="0.1"
                  value={trimEnd}
                  onChange={(e) => handleSliderChange('end', e.target.value)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={handleTrim}
                  disabled={isOptimizing}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isOptimizing ? '자르는 중...' : '자르기 적용'}
                </button>
                
                <button
                  onClick={() => setShowEditor(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  완료
                </button>
              </div>
            </div>
          )}

          {/* 액션 버튼들 */}
          <div className="flex space-x-2">
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? `업로드 중... ${Math.round(uploadProgress)}%` : '업로드'}
            </button>
            
            <button
              onClick={onVideoRemove}
              className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>

          {/* 진행률 표시 */}
          {(isOptimizing || isUploading) && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>{isOptimizing ? '최적화 중...' : '업로드 중...'}</span>
                <span>{Math.round(isOptimizing ? optimizationProgress : uploadProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${isOptimizing ? optimizationProgress : uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
