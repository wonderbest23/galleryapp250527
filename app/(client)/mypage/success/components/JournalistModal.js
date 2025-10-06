"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter,
  Button,
  Card,
  CardBody,
  Tabs,
  Tab,
  Input,
  Textarea,
  Image,
  Spinner,
  Chip
} from "@heroui/react";
import { 
  X, 
  Calendar, 
  MapPin, 
  Users, 
  Eye, 
  Plus,
  CheckCircle,
  Clock,
  AlertCircle,
  PenTool,
  Star
} from "lucide-react";

export default function JournalistModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("exhibitions");
  const [exhibitions, setExhibitions] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExhibition, setSelectedExhibition] = useState(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applicationData, setApplicationData] = useState({
    exhibition_id: "",
    application_type: "exhibition_link",
    exhibition_link: "",
    exhibition_info: "",
    price_info: "",
    additional_notes: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 체험단 전시 목록 조회
      const { data: exhibitionsData, error: exhibitionsError } = await supabase
        .from('journalist_experience_exhibitions')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (exhibitionsError) {
        console.error('체험단 전시 조회 오류:', exhibitionsError);
      } else {
        setExhibitions(exhibitionsData || []);
      }

      // 기자단 체험 신청 내역 조회
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: applicationsData, error: applicationsError } = await supabase
          .from('journalist_experience_applications')
          .select(`
            *,
            exhibition:exhibition_id (
              id,
              title,
              location,
              start_date,
              end_date
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (applicationsError) {
          console.error('체험 신청 내역 조회 오류:', applicationsError);
        } else {
          setApplications(applicationsData || []);
        }
      }
    } catch (error) {
      console.error('데이터 조회 중 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationSubmit = async () => {
    if (!applicationData.exhibition_id || !applicationData.application_type) {
      alert("필수 정보를 입력해주세요.");
      return;
    }

    if (applicationData.application_type === "exhibition_link" && !applicationData.exhibition_link) {
      alert("전시회 링크를 입력해주세요.");
      return;
    }

    if (applicationData.application_type === "exhibition_info_price" && (!applicationData.exhibition_info || !applicationData.price_info)) {
      alert("전시회 정보와 가격 정보를 입력해주세요.");
      return;
    }

    try {
      setSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('journalist_experience_applications')
        .insert({
          user_id: user.id,
          exhibition_id: applicationData.exhibition_id,
          application_type: applicationData.application_type,
          exhibition_link: applicationData.exhibition_link,
          exhibition_info: applicationData.exhibition_info,
          price_info: applicationData.price_info,
          additional_notes: applicationData.additional_notes
        });

      if (error) {
        console.error('체험 신청 오류:', error);
        alert("체험 신청에 실패했습니다.");
        return;
      }

      alert("체험 신청이 완료되었습니다!");
      setShowApplicationForm(false);
      setApplicationData({
        exhibition_id: "",
        application_type: "exhibition_link",
        exhibition_link: "",
        exhibition_info: "",
        price_info: "",
        additional_notes: ""
      });
      fetchData();
    } catch (error) {
      console.error('체험 신청 처리 중 오류:', error);
      alert("체험 신청 처리 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
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
        return "검토 중";
      case "approved":
        return "승인됨";
      case "rejected":
        return "거절됨";
      default:
        return "알 수 없음";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <PenTool className="w-5 h-5 text-purple-600" />
            <span>기자단 전용 페이지</span>
          </div>
          <Button
            isIconOnly
            variant="light"
            onPress={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </ModalHeader>
        <ModalBody>
          <Tabs 
            selectedKey={activeTab} 
            onSelectionChange={setActiveTab}
            color="secondary"
            variant="underlined"
          >
            <Tab key="exhibitions" title="체험단 전시 목록">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : exhibitions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>진행 중인 체험단 전시가 없습니다.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {exhibitions.map((exhibition) => (
                    <Card key={exhibition.id} className="hover:shadow-md transition-shadow">
                      <CardBody className="p-4">
                        <div className="flex gap-4">
                          {exhibition.image_url && (
                            <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                              <Image
                                src={exhibition.image_url}
                                alt={exhibition.title}
                                width={96}
                                height={96}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold text-lg">{exhibition.title}</h3>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Users className="w-4 h-4" />
                                <span>{exhibition.current_participants}/{exhibition.max_participants}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span>{exhibition.location}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>{formatDate(exhibition.start_date)} - {formatDate(exhibition.end_date)}</span>
                              </div>
                            </div>

                            <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                              {exhibition.description}
                            </p>

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="flat"
                                startContent={<Eye className="w-4 h-4" />}
                                onPress={() => setSelectedExhibition(exhibition)}
                              >
                                상세보기
                              </Button>
                              <Button
                                size="sm"
                                color="primary"
                                startContent={<Plus className="w-4 h-4" />}
                                onPress={() => {
                                  setApplicationData(prev => ({ ...prev, exhibition_id: exhibition.id }));
                                  setShowApplicationForm(true);
                                }}
                              >
                                체험 신청
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              )}
            </Tab>

            <Tab key="applications" title="체험 신청 내역">
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <Spinner size="lg" />
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <PenTool className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>체험 신청 내역이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((application) => (
                    <Card key={application.id}>
                      <CardBody className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-lg">
                            {application.exhibition?.title || "전시회 정보 없음"}
                          </h3>
                          <Chip 
                            color={getStatusColor(application.status)} 
                            size="sm"
                          >
                            {getStatusText(application.status)}
                          </Chip>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>신청 유형:</strong> {
                                application.application_type === "exhibition_link" ? "전시회 링크" : "전시회 정보/가격"
                              }
                            </p>
                            {application.application_type === "exhibition_link" && application.exhibition_link && (
                              <p className="text-sm text-gray-600 mb-1">
                                <strong>링크:</strong> 
                                <a href={application.exhibition_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline ml-1">
                                  {application.exhibition_link}
                                </a>
                              </p>
                            )}
                            {application.exhibition_info && (
                              <p className="text-sm text-gray-600 mb-1">
                                <strong>전시회 정보:</strong> {application.exhibition_info}
                              </p>
                            )}
                            {application.price_info && (
                              <p className="text-sm text-gray-600 mb-1">
                                <strong>가격 정보:</strong> {application.price_info}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>신청일:</strong> {formatDate(application.created_at)}
                            </p>
                            {application.processed_at && (
                              <p className="text-sm text-gray-600 mb-1">
                                <strong>처리일:</strong> {formatDate(application.processed_at)}
                              </p>
                            )}
                          </div>
                        </div>

                        {application.additional_notes && (
                          <div className="bg-gray-50 p-3 rounded-lg mb-3">
                            <p className="text-sm text-gray-700">
                              <strong>추가 메모:</strong> {application.additional_notes}
                            </p>
                          </div>
                        )}

                        {application.admin_response && (
                          <div className="bg-blue-50 p-3 rounded-lg mb-3">
                            <p className="text-sm text-blue-700">
                              <strong>관리자 응답:</strong> {application.admin_response}
                            </p>
                            {application.admin_response_image && (
                              <div className="mt-2">
                                <Image
                                  src={application.admin_response_image}
                                  alt="관리자 응답 이미지"
                                  width={200}
                                  height={150}
                                  className="rounded-lg"
                                />
                              </div>
                            )}
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  ))}
                </div>
              )}
            </Tab>
          </Tabs>
        </ModalBody>
      </ModalContent>

      {/* 전시회 상세보기 모달 */}
      <Modal isOpen={selectedExhibition !== null} onClose={() => setSelectedExhibition(null)} size="2xl">
        <ModalContent>
          <ModalHeader>
            <h3 className="text-lg font-semibold">{selectedExhibition?.title}</h3>
          </ModalHeader>
          <ModalBody>
            {selectedExhibition && (
              <div className="space-y-4">
                {selectedExhibition.image_url && (
                  <div className="w-full h-48 rounded-lg overflow-hidden">
                    <Image
                      src={selectedExhibition.image_url}
                      alt={selectedExhibition.title}
                      width={400}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>장소:</strong> {selectedExhibition.location}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>기간:</strong> {formatDate(selectedExhibition.start_date)} - {formatDate(selectedExhibition.end_date)}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>참가자:</strong> {selectedExhibition.current_participants}/{selectedExhibition.max_participants}명
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">전시회 설명</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedExhibition.description}</p>
                </div>

                {selectedExhibition.exhibition_info && (
                  <div>
                    <h4 className="font-medium mb-2">전시회 상세 정보</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedExhibition.exhibition_info}</p>
                    </div>
                  </div>
                )}

                {selectedExhibition.ticket_info && (
                  <div>
                    <h4 className="font-medium mb-2">티켓 정보</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-gray-700 whitespace-pre-wrap">{selectedExhibition.ticket_info}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setSelectedExhibition(null)}>
              닫기
            </Button>
            <Button 
              color="primary" 
              onPress={() => {
                setApplicationData(prev => ({ ...prev, exhibition_id: selectedExhibition.id }));
                setSelectedExhibition(null);
                setShowApplicationForm(true);
              }}
            >
              체험 신청
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 체험 신청 폼 모달 */}
      <Modal isOpen={showApplicationForm} onClose={() => setShowApplicationForm(false)} size="2xl">
        <ModalContent>
          <ModalHeader>
            <h3 className="text-lg font-semibold">기자단 체험 신청</h3>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">신청 유형</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="exhibition_link"
                      checked={applicationData.application_type === "exhibition_link"}
                      onChange={(e) => setApplicationData(prev => ({ ...prev, application_type: e.target.value }))}
                      className="mr-2"
                    />
                    전시회 링크
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="exhibition_info_price"
                      checked={applicationData.application_type === "exhibition_info_price"}
                      onChange={(e) => setApplicationData(prev => ({ ...prev, application_type: e.target.value }))}
                      className="mr-2"
                    />
                    전시회 정보/가격
                  </label>
                </div>
              </div>

              {applicationData.application_type === "exhibition_link" && (
                <Input
                  label="전시회 링크"
                  placeholder="전시회 링크를 입력해주세요"
                  value={applicationData.exhibition_link}
                  onChange={(e) => setApplicationData(prev => ({ ...prev, exhibition_link: e.target.value }))}
                  required
                />
              )}

              {applicationData.application_type === "exhibition_info_price" && (
                <>
                  <Textarea
                    label="전시회 정보"
                    placeholder="전시회 정보를 입력해주세요"
                    value={applicationData.exhibition_info}
                    onChange={(e) => setApplicationData(prev => ({ ...prev, exhibition_info: e.target.value }))}
                    minRows={3}
                    required
                  />
                  <Input
                    label="가격 정보"
                    placeholder="가격 정보를 입력해주세요"
                    value={applicationData.price_info}
                    onChange={(e) => setApplicationData(prev => ({ ...prev, price_info: e.target.value }))}
                    required
                  />
                </>
              )}

              <Textarea
                label="추가 메모 (선택사항)"
                placeholder="추가로 전달하고 싶은 내용이 있으시면 입력해주세요"
                value={applicationData.additional_notes}
                onChange={(e) => setApplicationData(prev => ({ ...prev, additional_notes: e.target.value }))}
                minRows={2}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setShowApplicationForm(false)}>
              취소
            </Button>
            <Button 
              color="primary" 
              onPress={handleApplicationSubmit}
              isLoading={submitting}
            >
              신청하기
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Modal>
  );
}

