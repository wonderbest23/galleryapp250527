"use client";
import React from "react";
import { 
  Input, 
  Button, 
  Textarea, 
  Checkbox, 
  addToast, 
  Select, 
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure 
} from "@heroui/react";
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
  const { isOpen, onOpen, onClose } = useDisclosure();

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
      addToast({
        title: "이미지 업로드 오류",
        description: "이미지 파일만 업로드 가능합니다.",
        color: "danger",
      });
      return;
    }

    // 파일 크기 체크 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      addToast({
        title: "이미지 업로드 오류",
        description: "파일 크기가 5MB를 초과합니다.",
        color: "danger",
      });
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
      addToast({
        title: "이미지 업로드 오류",
        description: error.message,
        color: "danger",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // 저장 처리
  const handleSave = async () => {
    // 필수 필드 검증
    if (!editedItem.title?.trim()) {
      addToast({
        title: "입력 오류",
        description: "상품명을 입력해주세요.",
        color: "danger",
      });
      return;
    }

    if (!editedItem.points_required || editedItem.points_required <= 0) {
      addToast({
        title: "입력 오류",
        description: "필요 포인트를 입력해주세요.",
        color: "danger",
      });
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

        addToast({
          title: "등록 완료",
          description: "상품이 성공적으로 등록되었습니다.",
          color: "success",
        });
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

        addToast({
          title: "저장 완료",
          description: "상품이 성공적으로 수정되었습니다.",
          color: "success",
        });
      }

      // 상품 목록 새로고침
      setRefreshToggle(refreshToggle + 1);
      
      // 수정된 상품 정보로 업데이트
      setSelectedItem(result);
      setEditedItem(result);
      setImageFile(null);

    } catch (error) {
      console.log("저장 오류:", error);
      addToast({
        title: "저장 실패",
        description: error.message,
        color: "danger",
      });
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

      addToast({
        title: "삭제 완료",
        description: "상품이 삭제되었습니다.",
        color: "success",
      });

      // 목록 새로고침
      setRefreshToggle(refreshToggle + 1);
      
      // 선택 초기화
      setSelectedItem(null);
      setSelectedKeys(new Set([]));
      
      onClose();
    } catch (error) {
      console.log("삭제 오류:", error);
      addToast({
        title: "삭제 실패",
        description: error.message,
        color: "danger",
      });
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
          <Button
            color="danger"
            variant="flat"
            startContent={<Icon icon="mdi:delete" />}
            onPress={onOpen}
          >
            삭제
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* 상품명 */}
        <Input
          label="상품명"
          placeholder="상품명을 입력하세요"
          value={editedItem.title || ""}
          onValueChange={(value) =>
            setEditedItem({ ...editedItem, title: value })
          }
          isRequired
        />

        {/* 설명 */}
        <Textarea
          label="설명"
          placeholder="상품 설명을 입력하세요"
          value={editedItem.description || ""}
          onValueChange={(value) =>
            setEditedItem({ ...editedItem, description: value })
          }
          minRows={3}
        />

        {/* 이미지 업로드 */}
        <div>
          <label className="block text-sm font-medium mb-2">상품 이미지</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            ref={fileInputRef}
            className="hidden"
          />
          <Button
            color="default"
            variant="bordered"
            startContent={<Icon icon="mdi:image-plus" />}
            onPress={() => fileInputRef.current?.click()}
            className="mb-2"
          >
            이미지 선택
          </Button>
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
        <Input
          type="number"
          label="필요 포인트"
          placeholder="0"
          value={editedItem.points_required?.toString() || ""}
          onValueChange={(value) =>
            setEditedItem({ ...editedItem, points_required: parseInt(value) || 0 })
          }
          endContent={<span className="text-gray-500">P</span>}
          isRequired
        />

        {/* 재고 */}
        <Input
          type="number"
          label="재고"
          placeholder="0"
          value={editedItem.stock?.toString() || ""}
          onValueChange={(value) =>
            setEditedItem({ ...editedItem, stock: parseInt(value) || 0 })
          }
          endContent={<span className="text-gray-500">개</span>}
        />

        {/* 카테고리 */}
        <Select
          label="카테고리"
          selectedKeys={new Set([editedItem.category || "general"])}
          onSelectionChange={(keys) => {
            const category = Array.from(keys)[0];
            setEditedItem({ ...editedItem, category });
          }}
        >
          <SelectItem key="general">일반</SelectItem>
          <SelectItem key="ticket">티켓</SelectItem>
          <SelectItem key="goods">굿즈</SelectItem>
          <SelectItem key="special">특별</SelectItem>
        </Select>

        {/* 활성 상태 */}
        <Checkbox
          isSelected={editedItem.is_active !== false}
          onValueChange={(checked) =>
            setEditedItem({ ...editedItem, is_active: checked })
          }
        >
          활성 상태 (체크하면 리워드샵에 노출됩니다)
        </Checkbox>

        {/* 저장 버튼 */}
        <div className="flex gap-2 pt-4">
          <Button
            color="primary"
            className="flex-1"
            onPress={handleSave}
            isLoading={isUploading}
          >
            {isNewItem ? "등록" : "저장"}
          </Button>
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>상품 삭제</ModalHeader>
          <ModalBody>
            <p>정말로 이 상품을 삭제하시겠습니까?</p>
            <p className="text-sm text-gray-500 mt-2">
              이 작업은 되돌릴 수 없습니다.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              취소
            </Button>
            <Button color="danger" onPress={handleDelete}>
              삭제
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

