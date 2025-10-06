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
  Tab,
  Image,
  Spinner
} from "@heroui/react";
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Calendar, 
  MapPin, 
  Users,
  Plus,
  Edit,
  Trash2,
  Upload,
  AlertCircle
} from "lucide-react";

export default function JournalistExperiencePage() {
  const [activeTab, setActiveTab] = useState("exhibitions");
  const [exhibitions, setExhibitions] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExhibition, setSelectedExhibition] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [exhibitionForm, setExhibitionForm] = useState({
    title: "",
    description: "",
    image_url: "",
    exhibition_info: "",
    ticket_info: "",
    location: "",
    start_date: "",
    end_date: "",
    max_participants: 10
  });
  const [applicationResponse, setApplicationResponse] = useState({
    admin_response: "",
    admin_response_image: ""
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const supabase = createClient();

  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 체험단 전시 목록 조회
      const { data: exhibitionsData, error: exhibitionsError } = await supabase
        .from('journalist_experience_exhibitions')
        .select('*')
        .order('created_at', { ascending: false });

      if (exhibitionsError) {
        console.error('체험단 전시 조회 오류:', exhibitionsError);
      } else {
        setExhibitions(exhibitionsData || []);
      }

      // 기자단 체험 신청 내역 조회
      const { data: applicationsData, error: applicationsError } = await supabase
        .from('journalist_experience_applications')
        .select(`
          *,
          user:user_id (
            id,
            email,
            profiles!inner (
              full_name
            )
          ),
          exhibition:exhibition_id (
            id,
            title,
            location
          )
        `)
        .order('created_at', { ascending: false });

      if (applicationsError) {
        console.error('체험 신청 내역 조회 오류:', applicationsError);
      } else {
        setApplications(applicationsData || []);
      }
    } catch (error) {
      console.error('데이터 조회 중 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `journalist-experience/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) {
        console.error('이미지 업로드 오류:', uploadError);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('이미지 업로드 처리 중 오류:', error);
      return null;
    }
  };

  const handleExhibitionSubmit = async () => {
    try {
      let imageUrl = exhibitionForm.image_url;
      
      if (imageFile) {
        imageUrl = await handleImageUpload(imageFile);
        if (!imageUrl) {
          alert("이미지 업로드에 실패했습니다.");
          return;
        }
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      const exhibitionData = {
        ...exhibitionForm,
        image_url: imageUrl,
        created_by: user.id
      };

      if (isEditing && selectedExhibition) {
        // 수정
        const { error } = await supabase
          .from('journalist_experience_exhibitions')
          .update(exhibitionData)
          .eq('id', selectedExhibition.id);

        if (error) {
          console.error('전시회 수정 오류:', error);
          alert("전시회 수정에 실패했습니다.");
          return;
        }
      } else {
        // 생성
        const { error } = await supabase
          .from('journalist_experience_exhibitions')
          .insert(exhibitionData);

        if (error) {
          console.error('전시회 생성 오류:', error);
          alert("전시회 생성에 실패했습니다.");
          return;
        }
      }

      alert(isEditing ? "전시회가 수정되었습니다." : "전시회가 생성되었습니다.");
      resetForm();
      fetchData();
    } catch (error) {
      console.error('전시회 처리 중 오류:', error);
      alert("전시회 처리 중 오류가 발생했습니다.");
    }
  };

  const handleApplicationProcess = async (applicationId, status) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      let responseData = {
        processed_by: user.id,
        processed_at: new Date().toISOString()
      };

      if (status === 'approved' || status === 'rejected') {
        responseData = {
          ...responseData,
          admin_response: applicationResponse.admin_response,
          admin_response_image: applicationResponse.admin_response_image
        };
      }

      const { error } = await supabase.rpc('process_journalist_application', {
        p_application_id: applicationId,
        p_admin_id: user.id,
        p_status: status,
        p_admin_response: applicationResponse.admin_response,
        p_admin_response_image: applicationResponse.admin_response_image
      });

      if (error) {
        console.error('신청 처리 오류:', error);
        alert("신청 처리에 실패했습니다.");
        return;
      }

      alert(status === 'approved' ? "신청이 승인되었습니다." : "신청이 거절되었습니다.");
      setApplicationResponse({ admin_response: "", admin_response_image: "" });
      fetchData();
    } catch (error) {
      console.error('신청 처리 중 오류:', error);
      alert("신청 처리 중 오류가 발생했습니다.");
    }
  };

  const resetForm = () => {
    setExhibitionForm({
      title: "",
      description: "",
      image_url: "",
      exhibition_info: "",
      ticket_info: "",
      location: "",
      start_date: "",
      end_date: "",
      max_participants: 10
    });
    setImageFile(null);
    setImagePreview("");
    setIsEditing(false);
    setSelectedExhibition(null);
    onClose();
  };

  const editExhibition = (exhibition) => {
    setSelectedExhibition(exhibition);
    setExhibitionForm({
      title: exhibition.title,
      description: exhibition.description,
      image_url: exhibition.image_url,
      exhibition_info: exhibition.exhibition_info,
      ticket_info: exhibition.ticket_info,
      location: exhibition.location,
      start_date: exhibition.start_date,
      end_date: exhibition.end_date,
      max_participants: exhibition.max_participants
    });
    setImagePreview(exhibition.image_url);
    setIsEditing(true);
    onOpen();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "warning";
      case "approved":
        return "success";
      case "rejected":
        return "danger";
      case "active":
        return "success";
      case "inactive":
        return "default";
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
      case "active":
        return "진행 중";
      case "inactive":
        return "비활성";
      default:
        return "알 수 없음";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">기자단 체험 관리</h1>
        <Button 
          onClick={() => {
            resetForm();
            onOpen();
          }} 
          color="primary"
          startContent={<Plus className="w-4 h-4" />}
        >
          전시회 추가
        </Button>
      </div>

      <Tabs 
        selectedKey={activeTab} 
        onSelectionChange={setActiveTab}
        color="primary"
        variant="underlined"
      >
        <Tab key="exhibitions" title={`체험단 전시 (${exhibitions.length})`}>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Spinner size="lg" />
            </div>
          ) : exhibitions.length === 0 ? (
            <Card>
              <CardBody className="text-center py-8">
                <p className="text-gray-500">등록된 체험단 전시가 없습니다.</p>
              </CardBody>
            </Card>
          ) : (
            <div className="grid gap-4">
              {exhibitions.map((exhibition) => (
                <Card key={exhibition.id}>
                  <CardBody>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{exhibition.title}</h3>
                          <Chip color={getStatusColor(exhibition.status)} size="sm">
                            {getStatusText(exhibition.status)}
                          </Chip>
                        </div>
                        
                        <div className="flex items-center gap-4 mb-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{exhibition.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(exhibition.start_date)} - {formatDate(exhibition.end_date)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{exhibition.current_participants}/{exhibition.max_participants}</span>
                          </div>
                        </div>

                        <p className="text-gray-700 line-clamp-2 mb-2">
                          {exhibition.description}
                        </p>

                        <div className="text-xs text-gray-500">
                          생성일: {formatDate(exhibition.created_at)}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
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
                          startContent={<Edit className="w-4 h-4" />}
                          onPress={() => editExhibition(exhibition)}
                        >
                          수정
                        </Button>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </Tab>

        <Tab key="applications" title={`체험 신청 (${applications.length})`}>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <Spinner size="lg" />
            </div>
          ) : applications.length === 0 ? (
            <Card>
              <CardBody className="text-center py-8">
                <p className="text-gray-500">체험 신청 내역이 없습니다.</p>
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-4">
              {applications.map((application) => (
                <Card key={application.id}>
                  <CardBody>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">
                            {application.exhibition?.title || "전시회 정보 없음"}
                          </h3>
                          <Chip color={getStatusColor(application.status)} size="sm">
                            {getStatusText(application.status)}
                          </Chip>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>신청자:</strong> {application.user?.profiles?.full_name || application.user?.email}
                            </p>
                            <p className="text-sm text-gray-600 mb-1">
                              <strong>신청 유형:</strong> {
                                application.application_type === "exhibition_link" ? "전시회 링크" : "전시회 정보/가격"
                              }
                            </p>
                            {application.exhibition_link && (
                              <p className="text-sm text-gray-600 mb-1">
                                <strong>링크:</strong> 
                                <a href={application.exhibition_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline ml-1">
                                  {application.exhibition_link}
                                </a>
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

                        {application.exhibition_info && (
                          <div className="bg-gray-50 p-3 rounded-lg mb-2">
                            <p className="text-sm text-gray-700">
                              <strong>전시회 정보:</strong> {application.exhibition_info}
                            </p>
                          </div>
                        )}

                        {application.price_info && (
                          <div className="bg-gray-50 p-3 rounded-lg mb-2">
                            <p className="text-sm text-gray-700">
                              <strong>가격 정보:</strong> {application.price_info}
                            </p>
                          </div>
                        )}

                        {application.additional_notes && (
                          <div className="bg-gray-50 p-3 rounded-lg mb-2">
                            <p className="text-sm text-gray-700">
                              <strong>추가 메모:</strong> {application.additional_notes}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        {application.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              color="success"
                              startContent={<CheckCircle className="w-4 h-4" />}
                              onPress={() => {
                                setSelectedApplication(application);
                                setApplicationResponse({ admin_response: "", admin_response_image: "" });
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
                                setSelectedApplication(application);
                                setApplicationResponse({ admin_response: "", admin_response_image: "" });
                                onOpen();
                              }}
                            >
                              거절
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </Tab>
      </Tabs>

      {/* 전시회 생성/수정 모달 */}
      <Modal isOpen={isOpen && !selectedApplication} onClose={resetForm} size="3xl">
        <ModalContent>
          <ModalHeader>
            <h3 className="text-lg font-semibold">
              {isEditing ? "전시회 수정" : "전시회 추가"}
            </h3>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="전시회 제목"
                placeholder="전시회 제목을 입력해주세요"
                value={exhibitionForm.title}
                onChange={(e) => setExhibitionForm(prev => ({ ...prev, title: e.target.value }))}
                required
              />

              <Textarea
                label="전시회 설명"
                placeholder="전시회 설명을 입력해주세요"
                value={exhibitionForm.description}
                onChange={(e) => setExhibitionForm(prev => ({ ...prev, description: e.target.value }))}
                minRows={3}
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="장소"
                  placeholder="전시회 장소를 입력해주세요"
                  value={exhibitionForm.location}
                  onChange={(e) => setExhibitionForm(prev => ({ ...prev, location: e.target.value }))}
                  required
                />
                <Input
                  label="최대 참가자 수"
                  type="number"
                  placeholder="최대 참가자 수를 입력해주세요"
                  value={exhibitionForm.max_participants}
                  onChange={(e) => setExhibitionForm(prev => ({ ...prev, max_participants: parseInt(e.target.value) }))}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="시작일"
                  type="date"
                  value={exhibitionForm.start_date}
                  onChange={(e) => setExhibitionForm(prev => ({ ...prev, start_date: e.target.value }))}
                  required
                />
                <Input
                  label="종료일"
                  type="date"
                  value={exhibitionForm.end_date}
                  onChange={(e) => setExhibitionForm(prev => ({ ...prev, end_date: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">전시회 이미지</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setImageFile(file);
                      const reader = new FileReader();
                      reader.onload = (e) => setImagePreview(e.target.result);
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {imagePreview && (
                  <div className="mt-2">
                    <Image
                      src={imagePreview}
                      alt="미리보기"
                      width={200}
                      height={150}
                      className="rounded-lg"
                    />
                  </div>
                )}
              </div>

              <Textarea
                label="전시회 상세 정보 (관리자 수기 입력)"
                placeholder="전시회 상세 정보를 입력해주세요"
                value={exhibitionForm.exhibition_info}
                onChange={(e) => setExhibitionForm(prev => ({ ...prev, exhibition_info: e.target.value }))}
                minRows={4}
              />

              <Textarea
                label="티켓 정보 (관리자 수기 입력)"
                placeholder="티켓 정보를 입력해주세요"
                value={exhibitionForm.ticket_info}
                onChange={(e) => setExhibitionForm(prev => ({ ...prev, ticket_info: e.target.value }))}
                minRows={3}
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={resetForm}>
              취소
            </Button>
            <Button color="primary" onPress={handleExhibitionSubmit}>
              {isEditing ? "수정" : "추가"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 신청 처리 모달 */}
      <Modal isOpen={isOpen && selectedApplication} onClose={() => { setSelectedApplication(null); onClose(); }} size="2xl">
        <ModalContent>
          <ModalHeader>
            <h3 className="text-lg font-semibold">
              {selectedApplication?.status === "pending" ? "신청 처리" : "신청 상세"}
            </h3>
          </ModalHeader>
          <ModalBody>
            {selectedApplication && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">신청자 정보</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p><strong>이름:</strong> {selectedApplication.user?.profiles?.full_name || "정보 없음"}</p>
                    <p><strong>이메일:</strong> {selectedApplication.user?.email}</p>
                    <p><strong>전시회:</strong> {selectedApplication.exhibition?.title}</p>
                    <p><strong>신청일:</strong> {formatDate(selectedApplication.created_at)}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">신청 내용</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p><strong>신청 유형:</strong> {
                      selectedApplication.application_type === "exhibition_link" ? "전시회 링크" : "전시회 정보/가격"
                    }</p>
                    {selectedApplication.exhibition_link && (
                      <p><strong>링크:</strong> 
                        <a href={selectedApplication.exhibition_link} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline ml-1">
                          {selectedApplication.exhibition_link}
                        </a>
                      </p>
                    )}
                    {selectedApplication.exhibition_info && (
                      <p><strong>전시회 정보:</strong> {selectedApplication.exhibition_info}</p>
                    )}
                    {selectedApplication.price_info && (
                      <p><strong>가격 정보:</strong> {selectedApplication.price_info}</p>
                    )}
                    {selectedApplication.additional_notes && (
                      <p><strong>추가 메모:</strong> {selectedApplication.additional_notes}</p>
                    )}
                  </div>
                </div>

                {selectedApplication.status === "pending" && (
                  <div>
                    <h4 className="font-medium mb-2">관리자 응답</h4>
                    <Textarea
                      label="응답 내용"
                      placeholder="신청자에게 전달할 내용을 입력해주세요"
                      value={applicationResponse.admin_response}
                      onChange={(e) => setApplicationResponse(prev => ({ ...prev, admin_response: e.target.value }))}
                      minRows={4}
                    />
                    <div className="mt-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">응답 이미지 (선택사항)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (e) => setApplicationResponse(prev => ({ ...prev, admin_response_image: e.target.result }));
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                  </div>
                )}

                {selectedApplication.admin_response && (
                  <div>
                    <h4 className="font-medium mb-2">기존 관리자 응답</h4>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-blue-700">{selectedApplication.admin_response}</p>
                      {selectedApplication.admin_response_image && (
                        <div className="mt-2">
                          <Image
                            src={selectedApplication.admin_response_image}
                            alt="관리자 응답 이미지"
                            width={200}
                            height={150}
                            className="rounded-lg"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => { setSelectedApplication(null); onClose(); }}>
              닫기
            </Button>
            {selectedApplication?.status === "pending" && (
              <>
                <Button
                  color="success"
                  startContent={<CheckCircle className="w-4 h-4" />}
                  onPress={() => handleApplicationProcess(selectedApplication.id, 'approved')}
                >
                  승인
                </Button>
                <Button
                  color="danger"
                  startContent={<XCircle className="w-4 h-4" />}
                  onPress={() => handleApplicationProcess(selectedApplication.id, 'rejected')}
                >
                  거절
                </Button>
              </>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

