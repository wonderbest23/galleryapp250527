'use client';

import { useState } from 'react';

export default function TableInsertDialog({ isOpen, onClose, onInsert }) {
  const [rows, setRows] = useState(3);
  const [columns, setColumns] = useState(3);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rows > 0 && columns > 0) {
      onInsert({ rows, columns });
      setRows(3);
      setColumns(3);
      onClose();
    }
  };

  const handleCancel = () => {
    setRows(3);
    setColumns(3);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
        <h2 className="text-xl font-bold mb-4">테이블 삽입</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="rows" className="block text-sm font-medium text-gray-700 mb-2">
              행 수
            </label>
            <input
              type="number"
              id="rows"
              min="1"
              max="20"
              value={rows}
              onChange={(e) => setRows(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="columns" className="block text-sm font-medium text-gray-700 mb-2">
              열 수
            </label>
            <input
              type="number"
              id="columns"
              min="1"
              max="10"
              value={columns}
              onChange={(e) => setColumns(parseInt(e.target.value) || 1)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 미리보기 */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">미리보기</h3>
            <div className="border border-gray-300 rounded p-2 bg-gray-50">
              <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                {Array.from({ length: rows * columns }).map((_, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 bg-white p-1 text-xs text-center min-h-[20px] flex items-center justify-center"
                  >
                    셀
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              삽입
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 