'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useCallback, useEffect, useState } from 'react';
import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $getNodeByKey,
  $insertNodes
} from 'lexical';
import { $isListNode, ListNode } from '@lexical/list';
import { $isHeadingNode } from '@lexical/rich-text';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND
} from '@lexical/list';
import { FORMAT_TEXT_COMMAND, FORMAT_ELEMENT_COMMAND } from 'lexical';
import { $setBlocksType } from '@lexical/selection';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { $createCodeNode } from '@lexical/code';
import { 
  INSERT_TABLE_COMMAND,
  $insertTableRow__EXPERIMENTAL,
  $insertTableColumn__EXPERIMENTAL,
  $deleteTableRow__EXPERIMENTAL,
  $deleteTableColumn__EXPERIMENTAL
} from '@lexical/table';
import { $createImageNode } from './ImageNode';
import ImageUploadDialog from './ImageUploadDialog';
import TableInsertDialog from './TableInsertDialog';

// React Icons 추가
import { 
  MdFormatBold,
  MdFormatItalic,
  MdFormatUnderlined,
  MdFormatStrikethrough,
  MdFormatAlignLeft,
  MdFormatAlignCenter,
  MdFormatAlignRight,
  MdFormatAlignJustify,
  MdImage,
  MdTableChart
} from 'react-icons/md';

const LowPriority = 1;

export default function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [blockType, setBlockType] = useState('paragraph');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showTableDialog, setShowTableDialog] = useState(false);

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);
      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const parentList = element.getParent();
          const type = parentList ? parentList.getListType() : element.getListType();
          setBlockType(type || 'paragraph');
        } else {
          const type = $isHeadingNode(element)
            ? element.getTag()
            : element.getType();
          setBlockType(type || 'paragraph');
        }
      }
      
      // Update text format
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
    }
  }, [editor]);

  useEffect(() => {
    return editor.registerUpdateListener(({editorState}) => {
      editorState.read(() => {
        updateToolbar();
      });
    });
  }, [updateToolbar, editor]);

  const formatParagraph = () => {
    if (blockType !== 'paragraph') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createParagraphNode());
        }
      });
    }
  };

  const formatHeading = (headingSize) => {
    if (blockType !== headingSize) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode(headingSize));
        }
      });
    }
  };

  const formatBulletList = () => {
    if (blockType !== 'bullet') {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND);
    }
  };

  const formatNumberedList = () => {
    if (blockType !== 'number') {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND);
    }
  };

  const formatQuote = () => {
    if (blockType !== 'quote') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createQuoteNode());
        }
      });
    }
  };

  const formatCode = () => {
    if (blockType !== 'code') {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createCodeNode());
        }
      });
    }
  };

  const insertImage = () => {
    setShowImageDialog(true);
  };

  const onImageInsert = (imageData) => {
    editor.update(() => {
      const imageNode = $createImageNode({
        src: imageData.src,
        altText: imageData.altText,
        width: imageData.width,
        height: imageData.height,
        align: imageData.align,
      });
      $insertNodes([imageNode]);
    });
  };

  const insertTable = () => {
    setShowTableDialog(true);
  };

  const onTableInsert = (tableData) => {
    editor.dispatchCommand(INSERT_TABLE_COMMAND, {
      columns: tableData.columns,
      rows: tableData.rows,
    });
  };

  return (
    <div className="toolbar flex flex-wrap items-center gap-2 p-2 border-b bg-gray-50 rounded-lg">
      {/* Block Type Selector */}
      <select
        className="px-2 py-1 border rounded"
        value={blockType || 'paragraph'}
        onChange={(e) => {
          const value = e.target.value;
          if (value === 'paragraph') {
            formatParagraph();
          } else if (value === 'h1') {
            formatHeading('h1');
          } else if (value === 'h2') {
            formatHeading('h2');
          } else if (value === 'h3') {
            formatHeading('h3');
          } else if (value === 'bullet') {
            formatBulletList();
          } else if (value === 'number') {
            formatNumberedList();
          } else if (value === 'quote') {
            formatQuote();
          } else if (value === 'code') {
            formatCode();
          }
        }}
      >
        <option value="paragraph">일반 텍스트</option>
        <option value="h1">제목 1</option>
        <option value="h2">제목 2</option>
        <option value="h3">제목 3</option>
        <option value="bullet">글머리 기호</option>
        <option value="number">번호 매기기</option>
        <option value="quote">인용</option>
        <option value="code">코드 블록</option>
      </select>

      <div className="h-6 w-px bg-gray-300" />

      {/* Text Format Buttons */}
      <button
        className={`px-3 py-1 border rounded flex items-center justify-center ${isBold ? 'bg-blue-200' : 'bg-white'} hover:bg-gray-100`}
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold');
        }}
        aria-label="Bold"
        title="굵게"
      >
        <MdFormatBold className="w-4 h-4" />
      </button>

      <button
        className={`px-3 py-1 border rounded flex items-center justify-center ${isItalic ? 'bg-blue-200' : 'bg-white'} hover:bg-gray-100`}
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic');
        }}
        aria-label="Italic"
        title="기울임"
      >
        <MdFormatItalic className="w-4 h-4" />
      </button>

      <button
        className={`px-3 py-1 border rounded flex items-center justify-center ${isUnderline ? 'bg-blue-200' : 'bg-white'} hover:bg-gray-100`}
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline');
        }}
        aria-label="Underline"
        title="밑줄"
      >
        <MdFormatUnderlined className="w-4 h-4" />
      </button>

      <button
        className={`px-3 py-1 border rounded flex items-center justify-center ${isStrikethrough ? 'bg-blue-200' : 'bg-white'} hover:bg-gray-100`}
        onClick={() => {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough');
        }}
        aria-label="Strikethrough"
        title="취소선"
      >
        <MdFormatStrikethrough className="w-4 h-4" />
      </button>

      <div className="h-6 w-px bg-gray-300" />

      {/* Alignment Buttons */}
      <button
        className="px-3 py-1 border rounded bg-white hover:bg-gray-100 flex items-center justify-center"
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left');
        }}
        aria-label="Left Align"
        title="왼쪽 정렬"
      >
        <MdFormatAlignLeft className="w-4 h-4" />
      </button>

      <button
        className="px-3 py-1 border rounded bg-white hover:bg-gray-100 flex items-center justify-center"
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center');
        }}
        aria-label="Center Align"
        title="가운데 정렬"
      >
        <MdFormatAlignCenter className="w-4 h-4" />
      </button>

      <button
        className="px-3 py-1 border rounded bg-white hover:bg-gray-100 flex items-center justify-center"
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right');
        }}
        aria-label="Right Align"
        title="오른쪽 정렬"
      >
        <MdFormatAlignRight className="w-4 h-4" />
      </button>

      <button
        className="px-3 py-1 border rounded bg-white hover:bg-gray-100 flex items-center justify-center"
        onClick={() => {
          editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify');
        }}
        aria-label="Justify Align"
        title="양쪽 정렬"
      >
        <MdFormatAlignJustify className="w-4 h-4" />
      </button>

      <div className="h-6 w-px bg-gray-300" />

      {/* Insert Buttons */}
      <button
        className="px-3 py-1 border rounded bg-white hover:bg-gray-100 flex items-center justify-center"
        onClick={insertImage}
        aria-label="Insert Image"
        title="이미지 삽입"
      >
        <MdImage className="w-4 h-4" />
      </button>

      <button
        className="px-3 py-1 border rounded bg-white hover:bg-gray-100 flex items-center justify-center"
        onClick={insertTable}
        aria-label="Insert Table"
        title="테이블 삽입"
      >
        <MdTableChart className="w-4 h-4" />
      </button>

      <ImageUploadDialog
        isOpen={showImageDialog}
        onClose={() => setShowImageDialog(false)}
        onInsert={onImageInsert}
      />

      <TableInsertDialog
        isOpen={showTableDialog}
        onClose={() => setShowTableDialog(false)}
        onInsert={onTableInsert}
      />
    </div>
  );
} 