"use client";
import React, { useState, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { 
  Button, 
  Input, 
  Textarea,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter
} from "@heroui/react";
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Link as LinkIcon, 
  Image as ImageIcon,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Heading1,
  Heading2,
  Heading3,
  X
} from "lucide-react";
import Image from "next/image";

export default function JournalistEditor({ 
  title, 
  setTitle, 
  content, 
  setContent, 
  onSubmit, 
  isSubmitting,
  category 
}) {
  const [showImageModal, setShowImageModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const editorRef = useRef(null);
  const supabase = createClient();

  // 텍스트 포맷팅 함수들
  const execCommand = useCallback((command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  }, []);

  const insertImage = useCallback(async (file) => {
    if (!file) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `journalist-images/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("images")
        .upload(filePath, file);

      if (uploadError) {
        console.error("이미지 업로드 오류:", uploadError);
        alert("이미지 업로드에 실패했습니다.");
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("images")
        .getPublicUrl(filePath);

      // 에디터에 이미지 삽입
      const img = `<img src="${publicUrl}" alt="${imageAlt || '이미지'}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 16px 0;" />`;
      
      // 현재 커서 위치에 이미지 삽입
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        
        const div = document.createElement('div');
        div.innerHTML = img;
        const imgElement = div.firstChild;
        range.insertNode(imgElement);
        
        // 커서를 이미지 뒤로 이동
        range.setStartAfter(imgElement);
        range.setEndAfter(imgElement);
        selection.removeAllRanges();
        selection.addRange(range);
      }

      setShowImageModal(false);
      setImageUrl("");
      setImageAlt("");
    } catch (error) {
      console.error("이미지 처리 오류:", error);
      alert("이미지 처리 중 오류가 발생했습니다.");
    } finally {
      setUploadingImage(false);
    }
  }, [supabase, imageAlt]);

  const insertLink = useCallback(() => {
    const url = prompt("링크 URL을 입력하세요:");
    if (url) {
      execCommand('createLink', url);
    }
  }, [execCommand]);

  const insertQuote = useCallback(() => {
    const quote = prompt("인용문을 입력하세요:");
    if (quote) {
      const quoteHtml = `<blockquote style="border-left: 4px solid #e2e8f0; padding-left: 16px; margin: 16px 0; font-style: italic; color: #64748b;">${quote}</blockquote>`;
      
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        
        const div = document.createElement('div');
        div.innerHTML = quoteHtml;
        const quoteElement = div.firstChild;
        range.insertNode(quoteElement);
        
        range.setStartAfter(quoteElement);
        range.setEndAfter(quoteElement);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }, []);

  const handleContentChange = useCallback(() => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
    }
  }, [setContent]);

  const toolbarButtons = [
    { icon: Bold, command: 'bold', tooltip: '굵게' },
    { icon: Italic, command: 'italic', tooltip: '기울임' },
    { icon: Underline, command: 'underline', tooltip: '밑줄' },
    { separator: true },
    { icon: Heading1, command: 'formatBlock', value: 'h1', tooltip: '제목 1' },
    { icon: Heading2, command: 'formatBlock', value: 'h2', tooltip: '제목 2' },
    { icon: Heading3, command: 'formatBlock', value: 'h3', tooltip: '제목 3' },
    { separator: true },
    { icon: AlignLeft, command: 'justifyLeft', tooltip: '왼쪽 정렬' },
    { icon: AlignCenter, command: 'justifyCenter', tooltip: '가운데 정렬' },
    { icon: AlignRight, command: 'justifyRight', tooltip: '오른쪽 정렬' },
    { separator: true },
    { icon: List, command: 'insertUnorderedList', tooltip: '글머리 기호' },
    { icon: ListOrdered, command: 'insertOrderedList', tooltip: '번호 매기기' },
    { separator: true },
    { icon: ImageIcon, action: () => setShowImageModal(true), tooltip: '이미지 삽입' },
    { icon: LinkIcon, action: insertLink, tooltip: '링크 삽입' },
    { icon: Quote, action: insertQuote, tooltip: '인용문 삽입' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* 제목 입력 */}
      <div className="mb-6">
        <Input
          placeholder="기사 제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-2xl font-bold"
          variant="bordered"
        />
      </div>

      {/* 툴바 */}
      <div className="border border-gray-200 rounded-t-lg bg-gray-50 p-3">
        <div className="flex flex-wrap items-center gap-2">
          {toolbarButtons.map((button, index) => {
            if (button.separator) {
              return <div key={index} className="w-px h-6 bg-gray-300 mx-1" />;
            }
            
            const Icon = button.icon;
            const handleClick = () => {
              if (button.action) {
                button.action();
              } else if (button.command) {
                execCommand(button.command, button.value);
              }
            };

            return (
              <button
                key={index}
                onClick={handleClick}
                className="p-2 hover:bg-gray-200 rounded transition-colors"
                title={button.tooltip}
                type="button"
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      </div>

      {/* 에디터 영역 */}
      <div className="border-l border-r border-b border-gray-200 rounded-b-lg min-h-[500px]">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleContentChange}
          className="p-6 min-h-[500px] focus:outline-none"
          style={{
            lineHeight: '1.6',
            fontSize: '16px'
          }}
          suppressContentEditableWarning={true}
          data-placeholder="기사 내용을 작성하세요..."
        />
      </div>

      {/* 이미지 삽입 모달 */}
      <Modal isOpen={showImageModal} onClose={() => setShowImageModal(false)} size="md">
        <ModalContent>
          <ModalHeader>이미지 삽입</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이미지 파일
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setImageUrl(URL.createObjectURL(file));
                      insertImage(file);
                    }
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  대체 텍스트 (선택사항)
                </label>
                <Input
                  placeholder="이미지 설명을 입력하세요"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                />
              </div>

              {imageUrl && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">미리보기:</p>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <Image
                      src={imageUrl}
                      alt="미리보기"
                      width={300}
                      height={200}
                      className="rounded-lg mx-auto"
                    />
                  </div>
                </div>
              )}

              {uploadingImage && (
                <div className="flex items-center justify-center py-4">
                  <Spinner size="sm" />
                  <span className="ml-2 text-sm text-gray-600">이미지 업로드 중...</span>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setShowImageModal(false)}>
              취소
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 제출 버튼 */}
      <div className="mt-6 flex justify-end">
        <Button
          color="primary"
          size="lg"
          onPress={onSubmit}
          isLoading={isSubmitting}
          disabled={!title.trim() || !content.trim()}
          className="px-8"
        >
          {isSubmitting ? "발행 중..." : "기사 발행"}
        </Button>
      </div>

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        
        [contenteditable] h1 {
          font-size: 2rem;
          font-weight: bold;
          margin: 1rem 0;
          line-height: 1.2;
        }
        
        [contenteditable] h2 {
          font-size: 1.5rem;
          font-weight: bold;
          margin: 0.8rem 0;
          line-height: 1.3;
        }
        
        [contenteditable] h3 {
          font-size: 1.25rem;
          font-weight: bold;
          margin: 0.6rem 0;
          line-height: 1.4;
        }
        
        [contenteditable] p {
          margin: 0.5rem 0;
        }
        
        [contenteditable] blockquote {
          border-left: 4px solid #e2e8f0;
          padding-left: 16px;
          margin: 16px 0;
          font-style: italic;
          color: #64748b;
        }
        
        [contenteditable] ul, [contenteditable] ol {
          margin: 1rem 0;
          padding-left: 2rem;
        }
        
        [contenteditable] li {
          margin: 0.25rem 0;
        }
        
        [contenteditable] img {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin: 16px 0;
        }
        
        [contenteditable] a {
          color: #3b82f6;
          text-decoration: underline;
        }
        
        [contenteditable] a:hover {
          color: #1d4ed8;
        }
      `}</style>
    </div>
  );
}
