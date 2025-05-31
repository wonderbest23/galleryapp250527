'use client';

import { $getRoot, $getSelection, $createParagraphNode } from 'lexical';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';

// Nodes
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { MarkNode } from '@lexical/mark';
import { TableNode, TableCellNode, TableRowNode } from '@lexical/table';
import { ImageNode } from './ImageNode';

import ToolbarPlugin from './ToolbarPlugin';
import TableActionMenuPlugin from './TableActionMenuPlugin';

const theme = {
  // Headings
  heading: {
    h1: 'text-3xl font-bold mb-4',
    h2: 'text-2xl font-bold mb-3',
    h3: 'text-xl font-bold mb-2',
    h4: 'text-lg font-bold mb-2',
    h5: 'text-base font-bold mb-1',
    h6: 'text-sm font-bold mb-1',
  },
  // Lists
  list: {
    nested: {
      listitem: 'list-none',
    },
    ol: 'list-decimal list-inside ml-4',
    ul: 'list-disc list-inside ml-4',
    listitem: 'mb-1',
  },
  // Code
  code: 'bg-gray-100 font-mono p-4 rounded border text-sm',
  codeHighlight: {
    atrule: 'text-purple-600',
    attr: 'text-blue-600',
    boolean: 'text-red-600',
    builtin: 'text-purple-600',
    cdata: 'text-gray-500',
    char: 'text-green-600',
    class: 'text-blue-600',
    'class-name': 'text-blue-600',
    comment: 'text-gray-500',
    constant: 'text-red-600',
    deleted: 'text-red-600',
    doctype: 'text-gray-500',
    entity: 'text-orange-600',
    function: 'text-purple-600',
    important: 'text-red-600',
    inserted: 'text-green-600',
    keyword: 'text-purple-600',
    namespace: 'text-blue-600',
    number: 'text-orange-600',
    operator: 'text-gray-600',
    prolog: 'text-gray-500',
    property: 'text-blue-600',
    punctuation: 'text-gray-600',
    regex: 'text-green-600',
    selector: 'text-green-600',
    string: 'text-green-600',
    symbol: 'text-red-600',
    tag: 'text-red-600',
    url: 'text-blue-600',
    variable: 'text-orange-600',
  },
  // Text formatting
  text: {
    bold: 'font-bold',
    italic: 'italic',
    strikethrough: 'line-through',
    underline: 'underline',
    underlineStrikethrough: 'underline line-through',
  },
  // Quote
  quote: 'border-l-4 border-gray-300 pl-4 italic text-gray-600 my-4',
  // Links
  link: 'text-blue-600 underline hover:text-blue-800',
  // Mark
  mark: 'bg-yellow-200',
  // Paragraph
  paragraph: 'mb-2 whitespace-pre-wrap',
  // Table
  table: 'border-collapse border border-gray-300 w-full my-4',
  tableCell: 'border border-gray-300 p-2 min-w-[50px]',
  tableCellHeader: 'border border-gray-300 p-2 min-w-[50px] bg-gray-50 font-semibold',
  tableRow: '',
  // Image
  image: {
    container: 'my-4 block',
    left: 'text-left',
    center: 'text-center', 
    right: 'text-right',
  },
};

// Error handler
function onError(error) {
  // 에러를 조용히 처리
  if (process.env.NODE_ENV === 'development') {
    // console.warn 대신 더 안전한 방식으로 처리
    if (typeof window !== 'undefined' && window.console) {
      window.console.warn('Lexical Editor Error:', error);
    }
  }
}

const nodes = [
  HeadingNode,
  ListNode,
  ListItemNode,
  QuoteNode,
  CodeNode,
  CodeHighlightNode,
  LinkNode,
  AutoLinkNode,
  MarkNode,
  TableNode,
  TableCellNode,
  TableRowNode,
  ImageNode,
];

// HTML 콘텐츠 초기화를 위한 컴포넌트
function InitialContentPlugin({ contents, isExternalChange }) {
  const [editor] = useLexicalComposerContext();
  const isInitializedRef = useRef(false);
  const lastContentsRef = useRef('');

  const updateEditor = useCallback((newContents) => {
    // newContents가 undefined나 null인 경우 빈 문자열로 처리
    const safeNewContents = newContents ?? '';
    
    if (safeNewContents && safeNewContents.trim() !== '') {
      try {
        editor.update(() => {
          const root = $getRoot();
          root.clear();
          
          // HTML을 DOM으로 변환
          const parser = new DOMParser();
          const dom = parser.parseFromString(safeNewContents, 'text/html');
          
          // DOM을 Lexical 노드로 변환
          const nodes = $generateNodesFromDOM(editor, dom);
          
          if (nodes.length > 0) {
            root.append(...nodes);
          } else {
            // HTML이 비어있거나 파싱에 실패한 경우 빈 paragraph 추가
            const paragraph = $createParagraphNode();
            root.append(paragraph);
          }
        });
      } catch (error) {
        // HTML 파싱 실패 시 빈 에디터로 시작
        editor.update(() => {
          const root = $getRoot();
          root.clear();
          const paragraph = $createParagraphNode();
          root.append(paragraph);
        });
      }
    } else {
      // contents가 빈 문자열인 경우
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        const paragraph = $createParagraphNode();
        root.append(paragraph);
      });
    }
  }, [editor]);

  useEffect(() => {
    // contents를 안전한 값으로 변환
    const safeContents = contents ?? '';
    const lastContents = lastContentsRef.current ?? '';
    
    // 동일한 컨텐츠면 처리하지 않음
    if (safeContents === lastContents) return;
    
    // 외부 변경이거나 첫 마운트일 때만 업데이트
    const shouldUpdate = !isInitializedRef.current || isExternalChange;

    if (shouldUpdate) {
      updateEditor(safeContents);
      isInitializedRef.current = true;
    }
    
    lastContentsRef.current = safeContents;
  }, [contents, isExternalChange, updateEditor]);

  return null;
}

// 에디터 변경사항을 HTML로 변환하는 플러그인
function OnChangeHTML({ setContents, isExternalChange }) {
  const [editor] = useLexicalComposerContext();
  const lastContentRef = useRef('');
  const timeoutRef = useRef(null);

  const handleChange = useCallback((editorState) => {
    // 외부 변경 중에는 setContents 호출하지 않음 (무한 루프 및 포커스 이동 방지)
    if (isExternalChange) {
      return;
    }

    // setContents가 함수인지 확인
    if (typeof setContents !== 'function') {
      return;
    }

    // 이전 타이머 제거
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 새로운 타이머 설정 (디바운싱)
    timeoutRef.current = setTimeout(() => {
      editor.read(() => {
        const htmlString = $generateHtmlFromNodes(editor, null);
        
        // 이전 내용과 같으면 업데이트하지 않음
        if (htmlString !== lastContentRef.current) {
          lastContentRef.current = htmlString;
          setContents(htmlString);
        }
      });
    }, 300); // 300ms 디바운싱
  }, [editor, setContents, isExternalChange]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return <OnChangePlugin onChange={handleChange} />;
}

export default function RichTextEditor({ contents, setContents, className = "" }) {
  const [isExternalChange, setIsExternalChange] = useState(false);
  const lastExternalContentsRef = useRef('');

  // contents prop에 기본값 설정하여 undefined 방지
  const safeContents = contents ?? '';

  const initialConfig = {
    namespace: 'RichTextEditor',
    theme,
    onError,
    nodes,
  };

  // 외부에서 contents가 변경된 경우 감지
  useEffect(() => {
    if (safeContents !== lastExternalContentsRef.current) {
      setIsExternalChange(true);
      lastExternalContentsRef.current = safeContents;
      
      // 외부 변경 플래그를 잠시 후 해제
      setTimeout(() => {
        setIsExternalChange(false);
      }, 500);
    }
  }, [safeContents]);

  return (
    <div className={`editor-container border rounded-lg shadow-sm ${className}`}>
      <LexicalComposer initialConfig={initialConfig}>
        <ToolbarPlugin />
        <div className="editor-inner relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="editor-input min-h-[200px] p-3 focus:outline-none whitespace-pre-wrap break-words overflow-wrap-anywhere"
                aria-placeholder="추가 정보를 입력하세요..."
                placeholder={
                  <div className="editor-placeholder absolute top-3 left-3 text-gray-400 pointer-events-none">
                    추가 정보를 입력하세요...
                  </div>
                }
              />
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <OnChangeHTML setContents={setContents} isExternalChange={isExternalChange} />
          <InitialContentPlugin contents={safeContents} isExternalChange={isExternalChange} />
          <ListPlugin />
          <CheckListPlugin />
          <TabIndentationPlugin />
          <TablePlugin />
          <TableActionMenuPlugin />
        </div>
      </LexicalComposer>
    </div>
  );
} 