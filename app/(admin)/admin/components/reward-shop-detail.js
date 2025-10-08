"use client";
import React from "react";
import { Icon } from "@iconify/react";
import { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";

export function RewardShopDetail({
  item,
  onUpdate,
  selectedKeys,
  setSelectedKeys,
  onRefresh,
  refreshToggle,
  setRefreshToggle,
  selectedItem,
  setSelectedItem,
}) {
  // 상품 ID가 없으면 신규 등록 모드로 간주
  const isNewItem = !item?.id;
  const [editedItem, setEditedItem] = React.useState(item || {});
  const prevItemIdRef = React.useRef(null);
  const supabase = createClient();
  
  // 이미지 업로드 관련 상태
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // 삭제 확인 모달
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (item && prevItemIdRef.current !== item.id) {
      setEditedItem(item);
      prevItemIdRef.current = item.id;
      
      // 이미지 미리보기 설정
      if (item.image_url) {
        setImagePreview(item.image_url);
      } else {
        setImagePreview("");
      }
      setImageFile(null);
    }
  }, [item]);

  // 이미지 파일 변경 핸들러
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 파일 유효성 검사
    if (!file.type.includes("image")) {
      alert("이미지 파일만 업로드 가능합니다.");
      return;
    }

    // 파일 크기 체크 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      alert("파일 크기가 5MB를 초과합니다.");
      return;
    }

    setImageFile(file);

    // 이미지 미리보기 생성
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // 이미지 업로드 함수
  const uploadImage = async () => {
    if (!imageFile) return editedItem.image_url || null;

    try {
      setIsUploading(true);
      const fileName = `${uuidv4()}.${imageFile.name.split('.').pop()}`;
      const filePath = `reward-shop/${fileName}`;

      // Supabase Storage에 이미지 업로드
      const { data, error } = await supabase.storage
        .from("reward-shop")
        .upload(filePath, imageFile, {
          contentType: imageFile.type,
        });

      if (error) throw error;

      // 공개 URL 가져오기
      const {
        data: { publicUrl },
      } = supabase.storage.from("reward-shop").getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.log("이미지 업로드 오류:", error);
      alert(`이미지 업로드 오류: ${error.message}`);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // 저장 처리
  const handleSave = async () => {
    // 필수 필드 검증
    if (!editedItem.title?.trim()) {
      alert("상품명을 입력해주세요.");
      return;
    }

    if (!editedItem.points_required || editedItem.points_required <= 0) {
      alert("필요 포인트를 입력해주세요.");
      return;
    }

    try {
      // 이미지 업로드
      const imageUrl = await uploadImage();

      const itemData = {
        title: editedItem.title,
        description: editedItem.description || "",
        image_url: imageUrl || editedItem.image_url || "",
        points_required: parseInt(editedItem.points_required),
        stock: parseInt(editedItem.stock || 0),
        is_active: editedItem.is_active !== false,
        category: editedItem.category || "general",
      };

      let result;

      if (isNewItem) {
        // 신규 등록
        const { data, error } = await supabase
          .from("reward_shop_items")
          .insert([itemData])
          .select()
          .single();

        if (error) throw error;
        result = data;

        alert("상품이 성공적으로 등록되었습니다.");
      } else {
        // 업데이트
        itemData.updated_at = new Date().toISOString();
        
        const { data, error } = await supabase
          .from("reward_shop_items")
          .update(itemData)
          .eq("id", editedItem.id)
          .select()
          .single();

        if (error) throw error;
        result = data;

        alert("상품이 성공적으로 수정되었습니다.");
      }

      // 상품 목록 새로고침
      setRefreshToggle(refreshToggle + 1);
      
      // 수정된 상품 정보로 업데이트
      setSelectedItem(result);
      setEditedItem(result);
      setImageFile(null);

    } catch (error) {
      console.log("저장 오류:", error);
      alert(`저장 실패: ${error.message}`);
    }
  };

  // 삭제 처리
  const handleDelete = async () => {
    if (isNewItem) return;

    try {
      const { error } = await supabase
        .from("reward_shop_items")
        .delete()
        .eq("id", editedItem.id);

      if (error) throw error;

      alert("상품이 삭제되었습니다.");

      // 목록 새로고침
      setRefreshToggle(refreshToggle + 1);
      
      // 선택 초기화
      setSelectedItem(null);
      setSelectedKeys(new Set([]));
      
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.log("삭제 오류:", error);
      alert(`삭제 실패: ${error.message}`);
    }
  };

  if (!item) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">
          상품을 선택하거나 신규 상품을 추가하세요.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">
          {isNewItem ? "신규 상품 등록" : "상품 정보"}
        </h2>
        {!isNewItem && (
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <Icon icon="mdi:delete" />
            삭제
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* 상품명 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            상품명 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="상품명을 입력하세요"
            value={editedItem.title || ""}
            onChange={(e) =>
              setEditedItem({ ...editedItem, title: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* 설명 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            설명
          </label>
          <textarea
            placeholder="상품 설명을 입력하세요"
            value={editedItem.description || ""}
            onChange={(e) =>
              setEditedItem({ ...editedItem, description: e.target.value })
            }
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
          />
        </div>

        {/* 이미지 업로드 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">상품 이미지</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            ref={fileInputRef}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors mb-2"
          >
            <Icon icon="mdi:image-plus" />
            이미지 선택
          </button>
          {imagePreview && (
            <div className="mt-2 relative w-40 h-40 border rounded-lg overflow-hidden">
              <Image
                src={imagePreview}
                alt="상품 이미지"
                fill
                className="object-cover"
              />
            </div>
          )}
        </div>

        {/* 필요 포인트 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            필요 포인트 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              placeholder="0"
              value={editedItem.points_required?.toString() || ""}
              onChange={(e) =>
                setEditedItem({ ...editedItem, points_required: parseInt(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">P</span>
          </div>
        </div>

        {/* 재고 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">재고</label>
          <div className="relative">
            <input
              type="number"
              placeholder="0"
              value={editedItem.stock?.toString() || ""}
              onChange={(e) =>
                setEditedItem({ ...editedItem, stock: parseInt(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">개</span>
          </div>
        </div>

        {/* 카테고리 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">카테고리</label>
          <select
            value={editedItem.category || "general"}
            onChange={(e) =>
              setEditedItem({ ...editedItem, category: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="general">일반</option>
            <option value="ticket">티켓</option>
            <option value="goods">굿즈</option>
            <option value="special">특별</option>
          </select>
        </div>

        {/* 활성 상태 */}
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="is_active"
            checked={editedItem.is_active !== false}
            onChange={(e) =>
              setEditedItem({ ...editedItem, is_active: e.target.checked })
            }
            className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
            활성 상태 (체크하면 리워드샵에 노출됩니다)
          </label>
        </div>

        {/* 저장 버튼 */}
        <div className="flex gap-2 pt-4">
          <button
            onClick={handleSave}
            disabled={isUploading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? "처리 중..." : (isNewItem ? "등록" : "저장")}
          </button>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">상품 삭제</h3>
            <p className="text-gray-700 mb-2">정말로 이 상품을 삭제하시겠습니까?</p>
            <p className="text-sm text-gray-500 mb-6">
              이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

