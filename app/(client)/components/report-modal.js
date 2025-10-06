"use client";
import React, { useState } from 'react';
import { X, Send } from 'lucide-react';

export function ReportModal({ isOpen, onClose }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      // 여기에 제보 제출 로직 구현
      console.log('제보 제출:', { title, content });
      
      // 성공 메시지
      alert('제보가 접수되었습니다. 검토 후 연락드리겠습니다.');
      
      // 폼 초기화
      setTitle('');
      setContent('');
      onClose();
    } catch (error) {
      console.error('제보 제출 오류:', error);
      alert('제보 제출 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">독자 제보</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* 제목 */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              제목
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제보 제목을 입력해주세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* 내용 */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              내용
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="제보 내용을 자세히 입력해주세요"
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              required
            />
          </div>

          {/* 안내 메시지 */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              <strong>제보 안내:</strong><br />
              • 정확하고 신뢰할 수 있는 정보만 제보해주세요<br />
              • 검토 후 필요시 연락드리겠습니다<br />
              • 개인정보는 안전하게 보호됩니다
            </p>
          </div>

          {/* 버튼 */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !content.trim()}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  제출 중...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  제보하기
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}