'use client';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useState } from 'react';
import {
  $getSelection,
  $isRangeSelection,
} from 'lexical';
import {
  $getTableCellNodeFromLexicalNode,
  $insertTableRow__EXPERIMENTAL,
  $insertTableColumn__EXPERIMENTAL,
  $deleteTableRow__EXPERIMENTAL,
  $deleteTableColumn__EXPERIMENTAL,
  $isTableNode,
  TableCellNode,
  TableRowNode,
} from '@lexical/table';

// React Icons 추가
import { MdSettings } from 'react-icons/md';

export default function TableActionMenuPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isInTable, setIsInTable] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMenu) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showMenu]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const nodes = selection.getNodes();
          const isInTableNow = nodes.some(node => {
            const tableCell = $getTableCellNodeFromLexicalNode(node);
            return tableCell !== null;
          });
          setIsInTable(isInTableNow);
        } else {
          setIsInTable(false);
        }
      });
    });
  }, [editor]);

  const getTableRowFromCell = (tableCell) => {
    let parent = tableCell.getParent();
    while (parent) {
      if (parent instanceof TableRowNode) {
        return parent;
      }
      parent = parent.getParent();
    }
    return null;
  };

  const handleTableAction = (action) => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const nodes = selection.getNodes();
        const firstNode = nodes[0];
        
        const tableCell = $getTableCellNodeFromLexicalNode(firstNode);
        
        if (tableCell) {
          const tableRow = getTableRowFromCell(tableCell);
          
          if (tableRow) {
            switch (action) {
              case 'insertRowAbove':
                $insertTableRow__EXPERIMENTAL(false);
                break;
              case 'insertRowBelow':
                $insertTableRow__EXPERIMENTAL(true);
                break;
              case 'insertColumnLeft':
                $insertTableColumn__EXPERIMENTAL(false);
                break;
              case 'insertColumnRight':
                $insertTableColumn__EXPERIMENTAL(true);
                break;
              case 'deleteRow':
                $deleteTableRow__EXPERIMENTAL();
                break;
              case 'deleteColumn':
                $deleteTableColumn__EXPERIMENTAL();
                break;
            }
          }
        }
      }
    });
    setShowMenu(false);
  };

  if (!isInTable) {
    return null;
  }

  return (
    <div className="table-action-menu">
      <button
        className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-1"
        onClick={(e) => {
          setMenuPosition({ x: e.clientX, y: e.clientY });
          setShowMenu(!showMenu);
        }}
        title="테이블 편집"
      >
        <MdSettings className="w-3 h-3" />
        테이블
      </button>
      
      {showMenu && (
        <div 
          className="fixed bg-white border shadow-lg rounded py-1 z-50"
          style={{ 
            left: menuPosition.x, 
            top: menuPosition.y + 30,
            minWidth: '150px'
          }}
        >
          <button
            className="block w-full text-left px-3 py-1 hover:bg-gray-100 text-sm"
            onClick={() => handleTableAction('insertRowAbove')}
          >
            위에 행 추가
          </button>
          <button
            className="block w-full text-left px-3 py-1 hover:bg-gray-100 text-sm"
            onClick={() => handleTableAction('insertRowBelow')}
          >
            아래에 행 추가
          </button>
          <button
            className="block w-full text-left px-3 py-1 hover:bg-gray-100 text-sm"
            onClick={() => handleTableAction('insertColumnLeft')}
          >
            왼쪽에 열 추가
          </button>
          <button
            className="block w-full text-left px-3 py-1 hover:bg-gray-100 text-sm"
            onClick={() => handleTableAction('insertColumnRight')}
          >
            오른쪽에 열 추가
          </button>
          <hr className="my-1" />
          <button
            className="block w-full text-left px-3 py-1 hover:bg-gray-100 text-sm text-red-600"
            onClick={() => handleTableAction('deleteRow')}
          >
            행 삭제
          </button>
          <button
            className="block w-full text-left px-3 py-1 hover:bg-gray-100 text-sm text-red-600"
            onClick={() => handleTableAction('deleteColumn')}
          >
            열 삭제
          </button>
        </div>
      )}
    </div>
  );
} 