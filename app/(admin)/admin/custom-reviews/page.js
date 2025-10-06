"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button, Card, CardBody, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Textarea } from "@heroui/react";
import { CheckCircle, XCircle, Eye, Star } from "lucide-react";

export default function CustomReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [rejectionReason, setRejectionReason] = useState("");
  const supabase = createClient();

  useEffect(() => {
    fetchCustomReviews();
  }, []);

  const fetchCustomReviews = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("exhibition_review")
        .select(`
          *,
          exhibition:exhibition_id (
            id,
            title,
            location,
            start_date,
            end_date,
            status,
            is_custom,
            created_by
          )
        `)
        .eq("is_custom_review", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("커스텀 리뷰 조회 오류:", error);
        return;
      }

      setReviews(data || []);
    } catch (error) {
      console.error("커스텀 리뷰 조회 중 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId) => {
    try {
      // 리뷰 승인
      const { error: reviewError } = await supabase
        .from("exhibition_review")
        .update({ status: "approved" })
        .eq("id", reviewId);

      if (reviewError) {
        console.error("리뷰 승인 오류:", reviewError);
        alert("리뷰 승인에 실패했습니다.");
        return;
      }

      // 전시회 승인
      const { error: exhibitionError } = await supabase
        .from("exhibition")
        .update({ status: "active" })
        .eq("id", reviews.find(r => r.id === reviewId).exhibition_id);

      if (exhibitionError) {
        console.error("전시회 승인 오류:", exhibitionError);
        alert("전시회 승인에 실패했습니다.");
        return;
      }

      alert("승인되었습니다!");
      fetchCustomReviews();
    } catch (error) {
      console.error("승인 처리 중 오류:", error);
      alert("승인 처리에 실패했습니다.");
    }
  };

  const handleReject = async (reviewId) => {
    if (!rejectionReason.trim()) {
      alert("거부 사유를 입력해주세요.");
      return;
    }

    try {
      // 리뷰 거부
      const { error: reviewError } = await supabase
        .from("exhibition_review")
        .update({ 
          status: "rejected",
          rejection_reason: rejectionReason
        })
        .eq("id", reviewId);

      if (reviewError) {
        console.error("리뷰 거부 오류:", reviewError);
        alert("리뷰 거부에 실패했습니다.");
        return;
      }

      alert("거부되었습니다!");
      setRejectionReason("");
      onClose();
      fetchCustomReviews();
    } catch (error) {
      console.error("거부 처리 중 오류:", error);
      alert("거부 처리에 실패했습니다.");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending_approval":
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
      case "pending_approval":
        return "승인 대기";
      case "approved":
        return "승인됨";
      case "rejected":
        return "거부됨";
      default:
        return "알 수 없음";
    }
  };

  const openDetailModal = (review) => {
    setSelectedReview(review);
    onOpen();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">커스텀 리뷰 승인 관리</h1>
        <Button onClick={fetchCustomReviews} color="primary">
          새로고침
        </Button>
      </div>

      <div className="grid gap-4">
        {reviews.length === 0 ? (
          <Card>
            <CardBody className="text-center py-8">
              <p className="text-gray-500">승인 대기 중인 커스텀 리뷰가 없습니다.</p>
            </CardBody>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id}>
              <CardBody>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">
                        {review.exhibition?.title || "전시회 정보 없음"}
                      </h3>
                      <Chip color={getStatusColor(review.status)} size="sm">
                        {getStatusText(review.status)}
                      </Chip>
                    </div>
                    
                    <div className="flex items-center gap-4 mb-2 text-sm text-gray-600">
                      <span>작성자: {review.name}</span>
                      <span>장소: {review.exhibition?.location || "정보 없음"}</span>
                      <span>방문일: {review.exhibition?.start_date || "정보 없음"}</span>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">({review.rating}/5)</span>
                    </div>

                    <p className="text-gray-700 line-clamp-2">
                      {review.description}
                    </p>

                    <div className="text-xs text-gray-500 mt-2">
                      작성일: {new Date(review.created_at).toLocaleDateString('ko-KR')}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="flat"
                      startContent={<Eye className="w-4 h-4" />}
                      onPress={() => openDetailModal(review)}
                    >
                      상세보기
                    </Button>
                    
                    {review.status === "pending_approval" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          color="success"
                          startContent={<CheckCircle className="w-4 h-4" />}
                          onPress={() => handleApprove(review.id)}
                        >
                          승인
                        </Button>
                        <Button
                          size="sm"
                          color="danger"
                          startContent={<XCircle className="w-4 h-4" />}
                          onPress={() => {
                            setSelectedReview(review);
                            onOpen();
                          }}
                        >
                          거부
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))
        )}
      </div>

      {/* 상세보기/거부 모달 */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader>
            <h3 className="text-lg font-semibold">리뷰 상세 정보</h3>
          </ModalHeader>
          <ModalBody>
            {selectedReview && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">전시회 정보</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p><strong>제목:</strong> {selectedReview.exhibition?.title}</p>
                    <p><strong>장소:</strong> {selectedReview.exhibition?.location}</p>
                    <p><strong>방문일:</strong> {selectedReview.exhibition?.start_date}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">리뷰 내용</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < selectedReview.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">({selectedReview.rating}/5)</span>
                    </div>
                    <p className="whitespace-pre-wrap">{selectedReview.description}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">작성자 정보</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p><strong>이름:</strong> {selectedReview.name}</p>
                    <p><strong>작성일:</strong> {new Date(selectedReview.created_at).toLocaleDateString('ko-KR')}</p>
                  </div>
                </div>

                {selectedReview.status === "pending_approval" && (
                  <div>
                    <h4 className="font-medium mb-2">거부 사유</h4>
                    <Textarea
                      placeholder="거부 사유를 입력해주세요..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      minRows={3}
                    />
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              닫기
            </Button>
            {selectedReview?.status === "pending_approval" && (
              <>
                <Button
                  color="success"
                  startContent={<CheckCircle className="w-4 h-4" />}
                  onPress={() => {
                    handleApprove(selectedReview.id);
                    onClose();
                  }}
                >
                  승인
                </Button>
                <Button
                  color="danger"
                  startContent={<XCircle className="w-4 h-4" />}
                  onPress={() => handleReject(selectedReview.id)}
                >
                  거부
                </Button>
              </>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

