'use client';

import { useState, useRef } from 'react';

// React Icons 추가
import { 
  MdLink,
  MdUpload,
  MdFormatAlignLeft,
  MdFormatAlignCenter,
  MdFormatAlignRight,
  MdClose,
  MdCheck
} from 'react-icons/md';

export default function ImageUploadDialog({ isOpen, onClose, onInsert }) {
  const [imageUrl, setImageUrl] = useState('');
  const [altText, setAltText] = useState('');
  const [uploadMethod, setUploadMethod] = useState('url'); // 'url' or 'file'
  const [align, setAlign] = useState('left'); // 'left', 'center', 'right'
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        await uploadToSupabase(file);
      } else {
        console.log("이미지 파일만 선택할 수 있습니다.");
      }
    }
  };

  const uploadToSupabase = async (file) => {
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setImageUrl(result.url);
        console.log("이미지가 성공적으로 업로드되었습니다.");
      } else {
        console.log("업로드 실패:", result.error || "이미지 업로드에 실패했습니다.");
      }
    } catch (error) {
      console.log("네트워크 오류가 발생했습니다:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleInsert = () => {
    if (imageUrl.trim()) {
      onInsert({
        src: imageUrl,
        altText: altText || '이미지',
        width: 'inherit',
        height: 'inherit',
        align: align,
      });
      handleClose();
    }
  };

  const handleClose = () => {
    setImageUrl('');
    setAltText('');
    setAlign('left');
    setUploadMethod('url');
    setUploading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">이미지 삽입</h3>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="닫기"
          >
            <MdClose className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mb-4">
          <div className="flex gap-2 mb-3">
            <button
              className={`px-3 py-1 rounded flex items-center gap-2 ${uploadMethod === 'url' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setUploadMethod('url')}
              disabled={uploading}
            >
              <MdLink className="w-4 h-4" />
              URL로 추가
            </button>
            <button
              className={`px-3 py-1 rounded flex items-center gap-2 ${uploadMethod === 'file' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              onClick={() => setUploadMethod('file')}
              disabled={uploading}
            >
              <MdUpload className="w-4 h-4" />
              파일 업로드
            </button>
          </div>

          {uploadMethod === 'url' ? (
            <div>
              <label className="block text-sm font-medium mb-1">이미지 URL</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={uploading}
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-1">이미지 파일</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full p-2 border rounded"
                disabled={uploading}
                value=""
              />
              {uploading && (
                <div className="mt-2 text-sm text-blue-600 flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  Supabase Storage에 업로드 중...
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">대체 텍스트 (선택사항)</label>
          <input
            type="text"
            value={altText}
            onChange={(e) => setAltText(e.target.value)}
            placeholder="이미지 설명"
            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={uploading}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">정렬</label>
          <div className="flex gap-2">
            <button
              className={`px-3 py-2 rounded border flex items-center gap-2 ${align === 'left' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-300'}`}
              onClick={() => setAlign('left')}
              disabled={uploading}
            >
              <MdFormatAlignLeft className="w-4 h-4" />
              왼쪽
            </button>
            <button
              className={`px-3 py-2 rounded border flex items-center gap-2 ${align === 'center' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-300'}`}
              onClick={() => setAlign('center')}
              disabled={uploading}
            >
              <MdFormatAlignCenter className="w-4 h-4" />
              가운데
            </button>
            <button
              className={`px-3 py-2 rounded border flex items-center gap-2 ${align === 'right' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-gray-700 border-gray-300'}`}
              onClick={() => setAlign('right')}
              disabled={uploading}
            >
              <MdFormatAlignRight className="w-4 h-4" />
              오른쪽
            </button>
          </div>
        </div>

        {imageUrl && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">미리보기</label>
            <div className={`border rounded p-2 ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'}`}>
              <img
                src={imageUrl}
                alt="미리보기"
                className="max-w-full h-32 object-contain"
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-100 flex items-center gap-2"
            disabled={uploading}
          >
            <MdClose className="w-4 h-4" />
            취소
          </button>
          <button
            onClick={handleInsert}
            disabled={!imageUrl.trim() || uploading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 flex items-center gap-2"
          >
            <MdCheck className="w-4 h-4" />
            삽입
          </button>
        </div>
      </div>
    </div>
  );
} 