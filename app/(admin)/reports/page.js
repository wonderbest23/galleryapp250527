"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Tabs, Tab } from "@heroui/react";
import { useRouter } from "next/navigation";

export default function ReportsManagement() {
  const supabase = createClient();
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [postReports, setPostReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedPostReport, setSelectedPostReport] = useState(null);
  const [activeTab, setActiveTab] = useState("reader");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isPostReportOpen, onOpen: onPostReportOpen, onClose: onPostReportClose } = useDisclosure();

  // 관리자 권한 체크
  useEffect(() => {
    const checkAdminAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push("/admin/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile || profile.role !== "admin") {
        alert("관리자 권한이 필요합니다.");
        router.push("/");
        return;
      }
    };

    checkAdminAuth();
    fetchReports();
    fetchPostReports();
  }, []);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("reader_reports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.log("Error fetching reports:", error);
      } else {
        setReports(data || []);
      }
    } catch (error) {
      console.log("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPostReports = async () => {
    try {
      const { data, error } = await supabase
        .from("post_reports")
        .select("*, reporter_id(email, user_metadata)")
        .order("created_at", { ascending: false });

      if (error) {
        console.log("Error fetching post reports:", error);
      } else {
        setPostReports(data || []);
      }
    } catch (error) {
      console.log("Error:", error);
    }
  };

  const updateReportStatus = async (reportId, newStatus) => {
    try {
      const { error } = await supabase
        .from("reader_reports")
        .update({ status: newStatus })
        .eq("id", reportId);

      if (error) {
        console.error("Error updating status:", error);
        alert("상태 업데이트에 실패했습니다.");
      } else {
        alert("상태가 업데이트되었습니다.");
        fetchReports(); // 목록 새로고침
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const deleteReport = async (reportId) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const { error } = await supabase
        .from("reader_reports")
        .delete()
        .eq("id", reportId);

      if (error) {
        console.error("Error deleting report:", error);
        alert("삭제에 실패했습니다.");
      } else {
        alert("삭제되었습니다.");
        fetchReports(); // 목록 새로고침
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      pending: { color: "warning", label: "대기중" },
      processing: { color: "primary", label: "처리중" },
      completed: { color: "success", label: "완료" },
      rejected: { color: "danger", label: "거부" }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return <Chip color={config.color} size="sm">{config.label}</Chip>;
  };

  const viewDetail = (report) => {
    setSelectedReport(report);
    onOpen();
  };

  const viewPostReportDetail = (report) => {
    setSelectedPostReport(report);
    onPostReportOpen();
  };

  const updatePostReportStatus = async (reportId, newStatus) => {
    try {
      const { error } = await supabase
        .from("post_reports")
        .update({ status: newStatus })
        .eq("id", reportId);

      if (error) {
        console.log("Error updating status:", error);
        alert("상태 업데이트에 실패했습니다.");
      } else {
        alert("상태가 업데이트되었습니다.");
        fetchPostReports();
      }
    } catch (error) {
      console.log("Error:", error);
    }
  };

  const deletePostReport = async (reportId) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const { error } = await supabase
        .from("post_reports")
        .delete()
        .eq("id", reportId);

      if (error) {
        console.log("Error deleting report:", error);
        alert("삭제에 실패했습니다.");
      } else {
        alert("삭제되었습니다.");
        fetchPostReports();
      }
    } catch (error) {
      console.log("Error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">독자 제보 관리</h1>
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="p-6 py-20">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">신고 관리</h1>
        <Button color="primary" onClick={() => {
          fetchReports();
          fetchPostReports();
        }}>
          새로고침
        </Button>
      </div>

      {/* 탭 */}
      <Tabs 
        selectedKey={activeTab} 
        onSelectionChange={setActiveTab}
        className="mb-6"
      >
        <Tab key="reader" title={`독자 제보 (${reports.length})`}>
          <Table aria-label="독자 제보 목록">
        <TableHeader>
          <TableColumn>제목</TableColumn>
          <TableColumn>이름</TableColumn>
          <TableColumn>이메일</TableColumn>
          <TableColumn>상태</TableColumn>
          <TableColumn>제보일시</TableColumn>
          <TableColumn>액션</TableColumn>
        </TableHeader>
        <TableBody emptyContent="제보가 없습니다.">
          {reports.map((report) => (
            <TableRow key={report.id}>
              <TableCell>
                <button 
                  onClick={() => viewDetail(report)}
                  className="text-blue-600 hover:underline text-left"
                >
                  {report.title}
                </button>
              </TableCell>
              <TableCell>{report.name}</TableCell>
              <TableCell>{report.email}</TableCell>
              <TableCell>{getStatusChip(report.status)}</TableCell>
              <TableCell>{formatDate(report.created_at)}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    color="primary" 
                    variant="flat"
                    onClick={() => viewDetail(report)}
                  >
                    보기
                  </Button>
                  <Button 
                    size="sm" 
                    color="danger" 
                    variant="flat"
                    onClick={() => deleteReport(report.id)}
                  >
                    삭제
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
        </Tab>

        <Tab key="post" title={`게시글 신고 (${postReports.length})`}>
          <Table aria-label="게시글 신고 목록">
            <TableHeader>
              <TableColumn>게시글 ID</TableColumn>
              <TableColumn>신고 사유</TableColumn>
              <TableColumn>신고자</TableColumn>
              <TableColumn>상태</TableColumn>
              <TableColumn>신고일시</TableColumn>
              <TableColumn>액션</TableColumn>
            </TableHeader>
            <TableBody emptyContent="신고 내역이 없습니다.">
              {postReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>#{report.post_id}</TableCell>
                  <TableCell>
                    <button 
                      onClick={() => viewPostReportDetail(report)}
                      className="text-blue-600 hover:underline text-left"
                    >
                      {report.reason}
                    </button>
                  </TableCell>
                  <TableCell>{report.reporter_id?.email || "알 수 없음"}</TableCell>
                  <TableCell>{getStatusChip(report.status)}</TableCell>
                  <TableCell>{formatDate(report.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        color="primary" 
                        variant="flat"
                        onClick={() => viewPostReportDetail(report)}
                      >
                        보기
                      </Button>
                      <Button 
                        size="sm" 
                        color="danger" 
                        variant="flat"
                        onClick={() => deletePostReport(report.id)}
                      >
                        삭제
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Tab>
      </Tabs>

      {/* 독자 제보 상세보기 모달 */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>
            <h2 className="text-xl font-bold">제보 상세</h2>
          </ModalHeader>
          <ModalBody>
            {selectedReport && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">제목</h3>
                  <p className="text-lg">{selectedReport.title}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-1">이름</h3>
                    <p>{selectedReport.name}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-1">이메일</h3>
                    <p>{selectedReport.email}</p>
                  </div>
                </div>

                {selectedReport.phone && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-1">연락처</h3>
                    <p>{selectedReport.phone}</p>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">제보 내용</h3>
                  <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                    {selectedReport.content}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">상태 변경</h3>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      color="warning"
                      onClick={() => updateReportStatus(selectedReport.id, 'pending')}
                    >
                      대기중
                    </Button>
                    <Button 
                      size="sm" 
                      color="primary"
                      onClick={() => updateReportStatus(selectedReport.id, 'processing')}
                    >
                      처리중
                    </Button>
                    <Button 
                      size="sm" 
                      color="success"
                      onClick={() => updateReportStatus(selectedReport.id, 'completed')}
                    >
                      완료
                    </Button>
                    <Button 
                      size="sm" 
                      color="danger"
                      onClick={() => updateReportStatus(selectedReport.id, 'rejected')}
                    >
                      거부
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">제보 일시</h3>
                  <p>{formatDate(selectedReport.created_at)}</p>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="light" onPress={onClose}>
              닫기
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 게시글 신고 상세보기 모달 */}
      <Modal isOpen={isPostReportOpen} onClose={onPostReportClose} size="2xl" scrollBehavior="inside">
        <ModalContent>
          <ModalHeader>
            <h2 className="text-xl font-bold">게시글 신고 상세</h2>
          </ModalHeader>
          <ModalBody>
            {selectedPostReport && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">게시글 ID</h3>
                  <p className="text-lg">#{selectedPostReport.post_id}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">신고 사유</h3>
                  <p className="text-lg font-medium text-red-600">{selectedPostReport.reason}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">상세 내용</h3>
                  <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                    {selectedPostReport.detail}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">신고자</h3>
                  <p>{selectedPostReport.reporter_id?.email || "알 수 없음"}</p>
                </div>

                {selectedPostReport.admin_note && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-1">관리자 메모</h3>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      {selectedPostReport.admin_note}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">상태 변경</h3>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      color="warning"
                      onClick={() => updatePostReportStatus(selectedPostReport.id, 'pending')}
                    >
                      대기중
                    </Button>
                    <Button 
                      size="sm" 
                      color="primary"
                      onClick={() => updatePostReportStatus(selectedPostReport.id, 'processing')}
                    >
                      처리중
                    </Button>
                    <Button 
                      size="sm" 
                      color="success"
                      onClick={() => updatePostReportStatus(selectedPostReport.id, 'completed')}
                    >
                      완료
                    </Button>
                    <Button 
                      size="sm" 
                      color="danger"
                      onClick={() => updatePostReportStatus(selectedPostReport.id, 'rejected')}
                    >
                      거부
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">신고 일시</h3>
                  <p>{formatDate(selectedPostReport.created_at)}</p>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="default" variant="light" onPress={onPostReportClose}>
              닫기
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

