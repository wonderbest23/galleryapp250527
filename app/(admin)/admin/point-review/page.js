"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { 
  Button, 
  Card, 
  CardBody, 
  Chip, 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  useDisclosure, 
  Textarea,
  Input,
  Tabs,
  Tab
} from "@heroui/react";
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Star, 
  Clock, 
  AlertCircle,
  RefreshCw,
  User,
  Calendar,
  DollarSign
} from "lucide-react";

export default function PointReviewPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [adminComment, setAdminComment] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedTab, setSelectedTab] = useState("pending");
  const supabase = createClient();

  useEffect(() => {
    fetchPointReviewRequests();
  }, []);

  const fetchPointReviewRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("point_review_requests")
        .select(`
          *,
          user:user_id (
            id,
            email,
            profiles!inner (
              full_name,
              points
            )
          ),
          review:review_id (
            id,
            rating,
            description,
            name,
            created_at,
            exhibition:exhibition_id (
              id,
              title,
              location
            )
          ),
          admin:admin_id (
            id,
            email,
            profiles!inner (
              full_name
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("포인트 검토 요청 조회 오류:", error);
        return;
      }

      setRequests(data || []);
    } catch (error) {
      console.error("포인트 검토 요청 조회 중 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      const { error } = await supabase.rpc('process_point_review', {
        p_request_id: requestId,
        p_admin_id: (await supabase.auth.getUser()).data.user.id,
        p_status: 'approved',
        p_admin_comment: adminComment || null
      });

      if (error) {
        console.error("포인트 승인 오류:", error);
        alert("포인트 승인에 실패했습니다.");
        return;
      }

      alert("포인트가 승인되었습니다!");
      setAdminComment("");
      onClose();
      fetchPointReviewRequests();
    } catch (error) {
      console.error("포인트 승인 처리 중 오류:", error);
      alert("포인트 승인 처리에 실패했습니다.");
    }
  };

  const handleReject = async (requestId) => {
    if (!rejectionReason.trim()) {
      alert("거부 사유를 입력해주세요.");
      return;
    }

    try {
      const { error } = await supabase.rpc('process_point_review', {
        p_request_id: requestId,
        p_admin_id: (await supabase.auth.getUser()).data.user.id,
        p_status: 'rejected',
        p_admin_comment: adminComment || null,
        p_rejection_reason: rejectionReason
      });

      if (error) {
        console.error("포인트 거부 오류:", error);
        alert("포인트 거부에 실패했습니다.");
        return;
      }

      alert("포인트가 거부되었습니다!");
      setRejectionReason("");
      setAdminComment("");
      onClose();
      fetchPointReviewRequests();
    } catch (error) {
      console.error("포인트 거부 처리 중 오류:", error);
      alert("포인트 거부 처리에 실패했습니다.");
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
      case "re_review_requested":
        return "primary";
      default:
        return "default";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "검토 대기";
      case "approved":
        return "승인됨";
      case "rejected":
        return "거부됨";
      case "re_review_requested":
        return "재검토 요청";
      default:
        return "알 수 없음";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      case "re_review_requested":
        return <RefreshCw className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const openDetailModal = (request) => {
    setSelectedRequest(request);
    setAdminComment(request.admin_comment || "");
    setRejectionReason(request.rejection_reason || "");
    onOpen();
  };

  const filteredRequests = requests.filter(request => {
    switch (selectedTab) {
      case "pending":
        return request.status === "pending";
      case "approved":
        return request.status === "approved";
      case "rejected":
        return request.status === "rejected";
      case "re_review":
        return request.status === "re_review_requested";
      default:
        return true;
    }
  });

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
        <h1 className="text-2xl font-bold">포인트 적립 검토 관리</h1>
        <Button onClick={fetchPointReviewRequests} color="primary" startContent={<RefreshCw className="w-4 h-4" />}>
          새로고침
        </Button>
      </div>

      {/* 탭 메뉴 */}
      <Tabs 
        selectedKey={selectedTab} 
        onSelectionChange={setSelectedTab}
        color="primary"
        variant="underlined"
      >
        <Tab key="pending" title={`검토 대기 (${requests.filter(r => r.status === "pending").length})`} />
        <Tab key="approved" title={`승인됨 (${requests.filter(r => r.status === "approved").length})`} />
        <Tab key="rejected" title={`거부됨 (${requests.filter(r => r.status === "rejected").length})`} />
        <Tab key="re_review" title={`재검토 요청 (${requests.filter(r => r.status === "re_review_requested").length})`} />
      </Tabs>

      <div className="grid gap-4">
        {filteredRequests.length === 0 ? (
          <Card>
            <CardBody className="text-center py-8">
              <p className="text-gray-500">
                {selectedTab === "pending" && "검토 대기 중인 포인트 요청이 없습니다."}
                {selectedTab === "approved" && "승인된 포인트 요청이 없습니다."}
                {selectedTab === "rejected" && "거부된 포인트 요청이 없습니다."}
                {selectedTab === "re_review" && "재검토 요청이 없습니다."}
              </p>
            </CardBody>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Card key={request.id}>
              <CardBody>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">
                        {request.review?.exhibition?.title || "전시회 정보 없음"}
                      </h3>
                      <Chip 
                        color={getStatusColor(request.status)} 
                        size="sm"
                        startContent={getStatusIcon(request.status)}
                      >
                        {getStatusText(request.status)}
                      </Chip>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-gray-500" />
                          <span>사용자: {request.user?.profiles?.full_name || request.user?.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="w-4 h-4 text-gray-500" />
                          <span>요청 포인트: {request.points}P</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Star className="w-4 h-4 text-gray-500" />
                          <span>리뷰 평점: {request.review?.rating}/5</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span>요청일: {new Date(request.created_at).toLocaleDateString('ko-KR')}</span>
                        </div>
                        {request.processed_at && (
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-gray-500" />
                            <span>처리일: {new Date(request.processed_at).toLocaleDateString('ko-KR')}</span>
                          </div>
                        )}
                        {request.admin && (
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-4 h-4 text-gray-500" />
                            <span>처리자: {request.admin.profiles?.full_name || request.admin.email}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg mb-2">
                      <p className="text-sm text-gray-700 line-clamp-2">
                        <strong>리뷰 내용:</strong> {request.review?.description}
                      </p>
                    </div>

                    {request.admin_comment && (
                      <div className="bg-blue-50 p-3 rounded-lg mb-2">
                        <p className="text-sm text-blue-700">
                          <strong>관리자 코멘트:</strong> {request.admin_comment}
                        </p>
                      </div>
                    )}

                    {request.rejection_reason && (
                      <div className="bg-red-50 p-3 rounded-lg mb-2">
                        <p className="text-sm text-red-700">
                          <strong>거부 사유:</strong> {request.rejection_reason}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="flat"
                      startContent={<Eye className="w-4 h-4" />}
                      onPress={() => openDetailModal(request)}
                    >
                      상세보기
                    </Button>
                    
                    {request.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          color="success"
                          startContent={<CheckCircle className="w-4 h-4" />}
                          onPress={() => {
                            setSelectedRequest(request);
                            onOpen();
                          }}
                        >
                          승인
                        </Button>
                        <Button
                          size="sm"
                          color="danger"
                          startContent={<XCircle className="w-4 h-4" />}
                          onPress={() => {
                            setSelectedRequest(request);
                            onOpen();
                          }}
                        >
                          거부
                        </Button>
                      </div>
                    )}

                    {request.status === "rejected" && (
                      <Button
                        size="sm"
                        color="warning"
                        startContent={<RefreshCw className="w-4 h-4" />}
                        onPress={() => {
                          setSelectedRequest(request);
                          onOpen();
                        }}
                      >
                        재검토
                      </Button>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))
        )}
      </div>

      {/* 상세보기/처리 모달 */}
      <Modal isOpen={isOpen} onClose={onClose} size="3xl">
        <ModalContent>
          <ModalHeader>
            <h3 className="text-lg font-semibold">포인트 검토 상세 정보</h3>
          </ModalHeader>
          <ModalBody>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">사용자 정보</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p><strong>이름:</strong> {selectedRequest.user?.profiles?.full_name || "정보 없음"}</p>
                      <p><strong>이메일:</strong> {selectedRequest.user?.email}</p>
                      <p><strong>현재 포인트:</strong> {selectedRequest.user?.profiles?.points || 0}P</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">포인트 요청 정보</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p><strong>요청 포인트:</strong> {selectedRequest.points}P</p>
                      <p><strong>상태:</strong> 
                        <Chip 
                          color={getStatusColor(selectedRequest.status)} 
                          size="sm"
                          className="ml-2"
                        >
                          {getStatusText(selectedRequest.status)}
                        </Chip>
                      </p>
                      <p><strong>요청일:</strong> {new Date(selectedRequest.created_at).toLocaleString('ko-KR')}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">전시회 정보</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p><strong>제목:</strong> {selectedRequest.review?.exhibition?.title}</p>
                    <p><strong>장소:</strong> {selectedRequest.review?.exhibition?.location}</p>
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
                              i < selectedRequest.review?.rating ? "text-yellow-400 fill-current" : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">({selectedRequest.review?.rating}/5)</span>
                    </div>
                    <p className="whitespace-pre-wrap">{selectedRequest.review?.description}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      작성일: {new Date(selectedRequest.review?.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </div>

                {selectedRequest.status === "pending" && (
                  <div>
                    <h4 className="font-medium mb-2">관리자 코멘트</h4>
                    <Textarea
                      placeholder="관리자 코멘트를 입력해주세요 (선택사항)..."
                      value={adminComment}
                      onChange={(e) => setAdminComment(e.target.value)}
                      minRows={2}
                    />
                  </div>
                )}

                {selectedRequest.status === "pending" && (
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

                {selectedRequest.status === "rejected" && selectedRequest.rejection_reason && (
                  <div>
                    <h4 className="font-medium mb-2">기존 거부 사유</h4>
                    <div className="bg-red-50 p-3 rounded-lg">
                      <p className="text-red-700">{selectedRequest.rejection_reason}</p>
                    </div>
                  </div>
                )}

                {selectedRequest.admin_comment && (
                  <div>
                    <h4 className="font-medium mb-2">관리자 코멘트</h4>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-blue-700">{selectedRequest.admin_comment}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              닫기
            </Button>
            {selectedRequest?.status === "pending" && (
              <>
                <Button
                  color="success"
                  startContent={<CheckCircle className="w-4 h-4" />}
                  onPress={() => {
                    handleApprove(selectedRequest.id);
                    onClose();
                  }}
                >
                  승인
                </Button>
                <Button
                  color="danger"
                  startContent={<XCircle className="w-4 h-4" />}
                  onPress={() => handleReject(selectedRequest.id)}
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

