"use client";
import React from "react";
import { 
  Button, 
  Chip,
  Textarea,
  addToast,
  Select,
  SelectItem,
  Divider
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export function JournalistDetail({
  application,
  onUpdate,
  selectedKeys,
  setSelectedKeys,
  onRefresh,
  refreshToggle,
  setRefreshToggle,
  selectedApplication,
  setSelectedApplication,
}) {
  const [editedApplication, setEditedApplication] = useState(application || {});
  const [isSaving, setIsSaving] = useState(false);
  const prevApplicationIdRef = React.useRef(null);
  const supabase = createClient();

  useEffect(() => {
    if (application && prevApplicationIdRef.current !== application.id) {
      setEditedApplication(application);
      prevApplicationIdRef.current = application.id;
    }
  }, [application]);

  // 승인 처리
  const handleApprove = async () => {
    if (!editedApplication.id) return;

    setIsSaving(true);
    try {
      // 신청 상태를 승인으로 변경
      const { error: appError } = await supabase
        .from("journalist_applications")
        .update({ 
          status: "approved",
          updated_at: new Date().toISOString()
        })
        .eq("id", editedApplication.id);

      if (appError) throw appError;

      // 프로필에 기자단 여부 업데이트
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ is_journalist: true })
        .eq("id", editedApplication.user_id);

      if (profileError) throw profileError;

      addToast({
        title: "승인 완료",
        description: "기자단 신청이 승인되었습니다.",
        color: "success",
      });

      // 목록 새로고침
      setRefreshToggle(refreshToggle + 1);
      
      // 수정된 데이터로 업데이트
      const updatedApp = { ...editedApplication, status: "approved" };
      setEditedApplication(updatedApp);
      setSelectedApplication(updatedApp);

    } catch (error) {
      console.log("승인 처리 오류:", error);
      addToast({
        title: "승인 실패",
        description: error.message,
        color: "danger",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 반려 처리
  const handleReject = async () => {
    if (!editedApplication.id) return;

    if (!editedApplication.admin_note?.trim()) {
      addToast({
        title: "입력 오류",
        description: "반려 사유를 입력해주세요.",
        color: "danger",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("journalist_applications")
        .update({ 
          status: "rejected",
          admin_note: editedApplication.admin_note,
          updated_at: new Date().toISOString()
        })
        .eq("id", editedApplication.id);

      if (error) throw error;

      addToast({
        title: "반려 완료",
        description: "기자단 신청이 반려되었습니다.",
        color: "success",
      });

      // 목록 새로고침
      setRefreshToggle(refreshToggle + 1);
      
      // 수정된 데이터로 업데이트
      const updatedApp = { ...editedApplication, status: "rejected" };
      setEditedApplication(updatedApp);
      setSelectedApplication(updatedApp);

    } catch (error) {
      console.log("반려 처리 오류:", error);
      addToast({
        title: "반려 실패",
        description: error.message,
        color: "danger",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 메모 저장
  const handleSaveNote = async () => {
    if (!editedApplication.id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("journalist_applications")
        .update({ 
          admin_note: editedApplication.admin_note,
          updated_at: new Date().toISOString()
        })
        .eq("id", editedApplication.id);

      if (error) throw error;

      addToast({
        title: "저장 완료",
        description: "메모가 저장되었습니다.",
        color: "success",
      });

      // 목록 새로고침
      setRefreshToggle(refreshToggle + 1);

    } catch (error) {
      console.log("메모 저장 오류:", error);
      addToast({
        title: "저장 실패",
        description: error.message,
        color: "danger",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "warning";
      case "approved":
        return "success";
      case "rejected":
        return "danger";
      default:
        return "default";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "대기중";
      case "approved":
        return "승인";
      case "rejected":
        return "반려";
      default:
        return status;
    }
  };

  if (!application) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">
          신청 내역을 선택하세요.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">신청 상세</h2>
        <Chip
          size="lg"
          color={getStatusColor(editedApplication.status)}
          variant="flat"
        >
          {getStatusText(editedApplication.status)}
        </Chip>
      </div>

      <div className="space-y-4">
        {/* 신청자 정보 */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">신청자 정보</h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">이름:</span>
              <span className="text-sm font-medium">
                {application.profiles?.full_name || "이름 없음"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">이메일:</span>
              <span className="text-sm font-medium">
                {application.profiles?.email}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">연락처:</span>
              <span className="text-sm font-medium">{application.phone}</span>
            </div>
          </div>
        </div>

        <Divider />

        {/* 자기소개 및 지원동기 */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">자기소개 및 지원동기</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm whitespace-pre-wrap">{application.introduction}</p>
          </div>
        </div>

        {/* 관련 경험 */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">관련 경험</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm whitespace-pre-wrap">{application.experience}</p>
          </div>
        </div>

        {/* 포트폴리오 링크 */}
        {application.portfolio_links && application.portfolio_links.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">포트폴리오 링크</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              {application.portfolio_links.map((link, index) => (
                <a
                  key={index}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline block"
                >
                  {link}
                </a>
              ))}
            </div>
          </div>
        )}

        {/* 관심 분야 */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">관심 분야</h3>
          <div className="flex flex-wrap gap-2">
            {application.interests?.map((interest, index) => (
              <Chip key={index} size="sm" color="primary" variant="flat">
                {interest}
              </Chip>
            ))}
          </div>
        </div>

        {/* 활동 정보 */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">활동 정보</h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">활동 가능 시간:</span>
              <span className="text-sm font-medium">{application.available_time}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">관람 빈도:</span>
              <span className="text-sm font-medium">{application.visit_frequency}</span>
            </div>
          </div>
        </div>

        <Divider />

        {/* 관리자 메모 */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">관리자 메모</h3>
          <Textarea
            placeholder="관리자 메모를 입력하세요"
            value={editedApplication.admin_note || ""}
            onValueChange={(value) =>
              setEditedApplication({ ...editedApplication, admin_note: value })
            }
            minRows={3}
          />
          <Button
            color="default"
            size="sm"
            className="mt-2"
            onPress={handleSaveNote}
            isLoading={isSaving}
          >
            메모 저장
          </Button>
        </div>

        <Divider />

        {/* 신청일/수정일 */}
        <div className="text-xs text-gray-500">
          <div>신청일: {new Date(application.created_at).toLocaleString()}</div>
          <div>수정일: {new Date(application.updated_at).toLocaleString()}</div>
        </div>

        {/* 처리 버튼 */}
        {editedApplication.status === "pending" && (
          <div className="flex gap-2 pt-4">
            <Button
              color="success"
              className="flex-1"
              onPress={handleApprove}
              isLoading={isSaving}
              startContent={<Icon icon="mdi:check" />}
            >
              승인
            </Button>
            <Button
              color="danger"
              className="flex-1"
              onPress={handleReject}
              isLoading={isSaving}
              startContent={<Icon icon="mdi:close" />}
            >
              반려
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

