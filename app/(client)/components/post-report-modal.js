"use client";
import React, { useState } from "react";
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  Button,
  Select,
  SelectItem,
  Textarea
} from "@heroui/react";
import { createClient } from "@/utils/supabase/client";
import { Flag } from "lucide-react";

export function PostReportModal({ isOpen, onClose, postId, postTitle }) {
  const supabase = createClient();
  const [reason, setReason] = useState("");
  const [detail, setDetail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasons = [
    "스팸 또는 광고",
    "욕설 또는 비방",
    "음란물 또는 선정적 내용",
    "개인정보 노출",
    "거짓 정보",
    "저작권 침해",
    "기타"
  ];

  const handleSubmit = async () => {
    // 유효성 검사
    if (!reason) {
      alert("신고 사유를 선택해주세요.");
      return;
    }

    if (!detail.trim()) {
      alert("상세 내용을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        alert("로그인이 필요합니다.");
        setIsSubmitting(false);
        return;
      }

      // UUID 기반 신고 테이블로 저장 (타입 불일치 방지)
      const { data, error } = await supabase
        .from("post_reports_uuid")
        .insert([
          {
            post_id: postId,
            reporter_id: user.id,
            reason: reason,
            detail: detail.trim(),
            status: "pending"
          }
        ]);

      if (error) {
        console.log("Error submitting report:", error);
        alert("신고 전송에 실패했습니다. 다시 시도해주세요.");
      } else {
        alert("신고가 접수되었습니다. 검토 후 조치하겠습니다.");
        setReason("");
        setDetail("");
        onClose();
      }
    } catch (error) {
      console.log("Error:", error);
      alert("오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setReason("");
    setDetail("");
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="md"
      scrollBehavior="inside"
    >
      <ModalContent>
        <ModalHeader className="flex gap-2 items-center border-b pb-4">
          <Flag className="w-5 h-5 text-red-500" />
          <h2 className="text-lg font-bold">신고하기</h2>
        </ModalHeader>
        
        <ModalBody className="py-6">
          {/* 게시글 정보 */}
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">신고 대상 게시글</p>
            <p className="text-sm font-medium text-gray-900 mt-1 line-clamp-1">{postTitle}</p>
          </div>

          {/* 신고 사유 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              신고 사유 <span className="text-red-500">*</span>
            </label>
            <Select
              placeholder="사유를 선택해주세요"
              selectedKeys={reason ? new Set([reason]) : new Set()}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0];
                setReason(value);
              }}
            >
              {reasons.map((r) => (
                <SelectItem key={r}>{r}</SelectItem>
              ))}
            </Select>
          </div>

          {/* 상세 내용 */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              상세 내용 (선택사항)
            </label>
            <Textarea
              placeholder="신고 사유에 대해 자세히 설명해주세요..."
              value={detail}
              onValueChange={setDetail}
              minRows={4}
            />
          </div>

          {/* 안내 문구 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              허위 신고 시 계정 이용에 제재가 있을 수 있습니다.
            </p>
          </div>
        </ModalBody>

        <ModalFooter className="border-t pt-4">
          <Button
            color="default"
            variant="light"
            onPress={handleCancel}
          >
            취소
          </Button>
          <Button
            color="danger"
            onPress={handleSubmit}
            isLoading={isSubmitting}
          >
            신고하기
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

