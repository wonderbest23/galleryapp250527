'use client';

import {
  $applyNodeReplacement,
  $createParagraphNode,
  $getNodeByKey,
  DecoratorNode,
} from 'lexical';
import { useState, useRef, useCallback, useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

// React Icons 추가
import { 
  MdFormatAlignLeft,
  MdFormatAlignCenter,
  MdFormatAlignRight
} from 'react-icons/md';

// 리사이징 가능한 이미지 컴포넌트
function ResizableImageComponent({ src, altText, width, height, align, nodeKey }) {
  const [editor] = useLexicalComposerContext();
  const [isResizing, setIsResizing] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const imgRef = useRef(null);
  const containerRef = useRef(null);
  const resizeStateRef = useRef({
    isResizing: false,
    direction: '',
    startPos: { x: 0, y: 0 },
    startSize: { width: 0, height: 0 }
  });

  const handleResize = useCallback((newWidth, newHeight) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node && node.setWidthAndHeight) {
        node.setWidthAndHeight(Math.round(newWidth), Math.round(newHeight));
      }
    });
  }, [editor, nodeKey]);

  const handleAlignChange = useCallback((newAlign) => {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node && node.setAlign) {
        node.setAlign(newAlign);
      }
    });
  }, [editor, nodeKey]);

  const handleMouseDown = useCallback((e, direction) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!imgRef.current) return;

    const rect = imgRef.current.getBoundingClientRect();
    
    resizeStateRef.current = {
      isResizing: true,
      direction,
      startPos: { x: e.clientX, y: e.clientY },
      startSize: { 
        width: rect.width, 
        height: rect.height 
      }
    };

    setIsResizing(true);
    
    // 리사이징 중 텍스트 선택 방지
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.cursor = e.target.style.cursor;

    const handleMouseMove = (moveEvent) => {
      const { isResizing, direction, startPos, startSize } = resizeStateRef.current;
      
      if (!isResizing) return;

      const deltaX = moveEvent.clientX - startPos.x;
      const deltaY = moveEvent.clientY - startPos.y;
      
      let newWidth = startSize.width;
      let newHeight = startSize.height;
      
      // 방향에 따른 리사이징 계산
      if (direction.includes('right')) {
        newWidth = Math.max(50, startSize.width + deltaX);
      }
      if (direction.includes('left')) {
        newWidth = Math.max(50, startSize.width - deltaX);
      }
      if (direction.includes('bottom')) {
        newHeight = Math.max(50, startSize.height + deltaY);
      }
      if (direction.includes('top')) {
        newHeight = Math.max(50, startSize.height - deltaY);
      }

      // 비례 유지 (shift키를 누르거나 모서리 핸들 사용시)
      if (moveEvent.shiftKey || ['top-left', 'top-right', 'bottom-left', 'bottom-right'].includes(direction)) {
        const aspectRatio = startSize.width / startSize.height;
        if (direction.includes('right') || direction.includes('left')) {
          newHeight = newWidth / aspectRatio;
        } else if (direction.includes('top') || direction.includes('bottom')) {
          newWidth = newHeight * aspectRatio;
        }
      }

      handleResize(newWidth, newHeight);
    };

    const handleMouseUp = () => {
      resizeStateRef.current.isResizing = false;
      setIsResizing(false);
      
      // 스타일 복원
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';
      document.body.style.cursor = '';
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [handleResize]);

  const getAlignmentStyle = () => {
    switch (align) {
      case 'left': 
        return { 
          display: 'block',
          marginLeft: '0',
          marginRight: 'auto',
          textAlign: 'left'
        };
      case 'center': 
        return { 
          display: 'block',
          marginLeft: 'auto',
          marginRight: 'auto',
          textAlign: 'center'
        };
      case 'right': 
        return { 
          display: 'block',
          marginLeft: 'auto',
          marginRight: '0',
          textAlign: 'right'
        };
      default: 
        return { 
          display: 'block',
          marginLeft: '0',
          marginRight: 'auto',
          textAlign: 'left'
        };
    }
  };

  const handleContainerClick = useCallback((e) => {
    e.stopPropagation();
    setIsSelected(true);
  }, []);

  // 컨테이너 외부 클릭 시 선택 해제
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsSelected(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'block',
        width: 'fit-content',
        maxWidth: '100%',
        ...getAlignmentStyle()
      }}
      onClick={handleContainerClick}
    >
      <img
        ref={imgRef}
        src={src}
        alt={altText}
        style={{
          width: width === 'inherit' ? 'auto' : `${width}px`,
          height: height === 'inherit' ? 'auto' : `${height}px`,
          maxWidth: '100%',
          cursor: 'default',
          border: isSelected ? '2px solid #3b82f6' : 'none',
          borderRadius: isSelected ? '4px' : '0',
        }}
        draggable="false"
      />
      
      {/* 정렬 컨트롤 */}
      {isSelected && (
        <div style={{
          position: 'absolute',
          top: '-40px',
          left: '0',
          backgroundColor: 'white',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          padding: '4px',
          display: 'flex',
          gap: '4px',
          zIndex: 10
        }}>
          <button
            onClick={() => handleAlignChange('left')}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: align === 'left' ? '#3b82f6' : '#f3f4f6',
              color: align === 'left' ? 'white' : 'black',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="왼쪽 정렬"
          >
            <MdFormatAlignLeft style={{ width: '14px', height: '14px' }} />
          </button>
          <button
            onClick={() => handleAlignChange('center')}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: align === 'center' ? '#3b82f6' : '#f3f4f6',
              color: align === 'center' ? 'white' : 'black',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="가운데 정렬"
          >
            <MdFormatAlignCenter style={{ width: '14px', height: '14px' }} />
          </button>
          <button
            onClick={() => handleAlignChange('right')}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '12px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: align === 'right' ? '#3b82f6' : '#f3f4f6',
              color: align === 'right' ? 'white' : 'black',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="오른쪽 정렬"
          >
            <MdFormatAlignRight style={{ width: '14px', height: '14px' }} />
          </button>
        </div>
      )}

      {/* 리사이징 핸들 */}
      {isSelected && (
        <>
          {/* 모서리 핸들 */}
          <div
            style={{
              position: 'absolute',
              top: '-4px',
              left: '-4px',
              width: '12px',
              height: '12px',
              backgroundColor: '#3b82f6',
              cursor: 'nw-resize',
              borderRadius: '2px',
              zIndex: 11
            }}
            onMouseDown={(e) => handleMouseDown(e, 'top-left')}
          />
          <div
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              width: '12px',
              height: '12px',
              backgroundColor: '#3b82f6',
              cursor: 'ne-resize',
              borderRadius: '2px',
              zIndex: 11
            }}
            onMouseDown={(e) => handleMouseDown(e, 'top-right')}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-4px',
              left: '-4px',
              width: '12px',
              height: '12px',
              backgroundColor: '#3b82f6',
              cursor: 'sw-resize',
              borderRadius: '2px',
              zIndex: 11
            }}
            onMouseDown={(e) => handleMouseDown(e, 'bottom-left')}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-4px',
              right: '-4px',
              width: '12px',
              height: '12px',
              backgroundColor: '#3b82f6',
              cursor: 'se-resize',
              borderRadius: '2px',
              zIndex: 11
            }}
            onMouseDown={(e) => handleMouseDown(e, 'bottom-right')}
          />
          
          {/* 측면 핸들 */}
          <div
            style={{
              position: 'absolute',
              top: '-4px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '12px',
              height: '12px',
              backgroundColor: '#3b82f6',
              cursor: 'n-resize',
              borderRadius: '2px',
              zIndex: 11
            }}
            onMouseDown={(e) => handleMouseDown(e, 'top')}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-4px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '12px',
              height: '12px',
              backgroundColor: '#3b82f6',
              cursor: 's-resize',
              borderRadius: '2px',
              zIndex: 11
            }}
            onMouseDown={(e) => handleMouseDown(e, 'bottom')}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '-4px',
              transform: 'translateY(-50%)',
              width: '12px',
              height: '12px',
              backgroundColor: '#3b82f6',
              cursor: 'w-resize',
              borderRadius: '2px',
              zIndex: 11
            }}
            onMouseDown={(e) => handleMouseDown(e, 'left')}
          />
          <div
            style={{
              position: 'absolute',
              top: '50%',
              right: '-4px',
              transform: 'translateY(-50%)',
              width: '12px',
              height: '12px',
              backgroundColor: '#3b82f6',
              cursor: 'e-resize',
              borderRadius: '2px',
              zIndex: 11
            }}
            onMouseDown={(e) => handleMouseDown(e, 'right')}
          />
        </>
      )}
    </div>
  );
}

function convertImageElement(domNode) {
  const src = domNode.getAttribute('src') || '';
  const alt = domNode.getAttribute('alt') || '';
  const width = domNode.getAttribute('width') || domNode.style.width || 'inherit';
  const height = domNode.getAttribute('height') || domNode.style.height || 'inherit';
  const align = domNode.getAttribute('data-align') || 'left';

  // 픽셀 단위 제거
  const parsedWidth = typeof width === 'string' && width.includes('px') 
    ? parseInt(width, 10) 
    : width === 'inherit' ? 'inherit' : parseInt(width, 10) || 'inherit';
    
  const parsedHeight = typeof height === 'string' && height.includes('px') 
    ? parseInt(height, 10) 
    : height === 'inherit' ? 'inherit' : parseInt(height, 10) || 'inherit';

  const node = $createImageNode({
    src,
    altText: alt,
    width: parsedWidth,
    height: parsedHeight,
    align,
  });

  return { node };
}

export class ImageNode extends DecoratorNode {
  __src;
  __altText;
  __width;
  __height;
  __align;

  static getType() {
    return 'custom-image';
  }

  static clone(node) {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__height,
      node.__align,
      node.__key,
    );
  }

  static importDOM() {
    return {
      img: (domNode) => {
        if (domNode.src) {
          return {
            conversion: convertImageElement,
            priority: 0,
          };
        }
        return null;
      },
    };
  }

  constructor(src, altText, width, height, align, key) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = width || 'inherit';
    this.__height = height || 'inherit';
    this.__align = align || 'left';
  }

  createDOM() {
    const div = document.createElement('div');
    div.style.display = 'block';
    div.style.width = '100%';
    
    // 정렬에 따른 스타일 적용
    switch (this.__align) {
      case 'center':
        div.style.textAlign = 'center';
        break;
      case 'right':
        div.style.textAlign = 'right';
        break;
      default:
        div.style.textAlign = 'left';
        break;
    }
    
    return div;
  }

  updateDOM() {
    return false;
  }

  exportDOM() {
    const element = document.createElement('img');
    element.setAttribute('src', this.__src);
    element.setAttribute('alt', this.__altText);
    
    if (this.__width !== 'inherit') {
      element.setAttribute('width', this.__width.toString());
      element.style.width = `${this.__width}px`;
    }
    
    if (this.__height !== 'inherit') {
      element.setAttribute('height', this.__height.toString());
      element.style.height = `${this.__height}px`;
    }

    // 정렬 스타일 적용
    if (this.__align) {
      element.setAttribute('data-align', this.__align);
      switch (this.__align) {
        case 'center':
          element.style.display = 'block';
          element.style.marginLeft = 'auto';
          element.style.marginRight = 'auto';
          break;
        case 'right':
          element.style.display = 'block';
          element.style.marginLeft = 'auto';
          element.style.marginRight = '0';
          break;
        case 'left':
        default:
          element.style.display = 'block';
          element.style.marginLeft = '0';
          element.style.marginRight = 'auto';
          break;
      }
    }

    return { element };
  }

  getSrc() {
    return this.__src;
  }

  getAltText() {
    return this.__altText;
  }

  getAlign() {
    return this.__align;
  }

  setWidthAndHeight(width, height) {
    const writable = this.getWritable();
    writable.__width = width;
    writable.__height = height;
  }

  setAlign(align) {
    const writable = this.getWritable();
    writable.__align = align;
  }

  decorate() {
    return (
      <ResizableImageComponent
        src={this.__src}
        altText={this.__altText}
        width={this.__width}
        height={this.__height}
        align={this.__align}
        nodeKey={this.__key}
      />
    );
  }

  static importJSON(serializedNode) {
    const { altText, height, width, src, align } = serializedNode;
    const node = $createImageNode({
      altText,
      height,
      src,
      width,
      align,
    });
    return node;
  }

  exportJSON() {
    return {
      altText: this.getAltText(),
      height: this.__height === 'inherit' ? 0 : this.__height,
      src: this.getSrc(),
      align: this.getAlign(),
      type: 'custom-image',
      version: 1,
      width: this.__width === 'inherit' ? 0 : this.__width,
    };
  }
}

export function $createImageNode({
  altText,
  height,
  src,
  width,
  align,
  key,
}) {
  return $applyNodeReplacement(
    new ImageNode(src, altText, width, height, align, key),
  );
}

export function $isImageNode(node) {
  return node instanceof ImageNode;
} 