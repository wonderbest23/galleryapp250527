"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
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

  // 팝업이 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      // 모바일에서는 body 스크롤을 막지 않음
      if (window.innerWidth > 768) {
        document.body.style.overflow = 'hidden';
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // 컴포넌트 언마운트 시 스크롤 복원
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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
      fetchData(); // 데이터 새로고침
    } catch (error) {
      console.error('체험 신청 오류:', error);
      alert("체험 신청에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved': return '승인됨';
      case 'rejected': return '반려됨';
      case 'pending': return '대기중';
      default: return '알 수 없음';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/20" onClick={onClose}></div>
      
      {/* 팝업 컨텐츠 */}
      <div className="relative w-full max-w-4xl bg-white/80 backdrop-blur-sm rounded-2xl max-h-[85vh] sm:max-h-[75vh] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10 border-b border-gray-200 p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center">
              <PenTool className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">기자단 체험단</h2>
              <p className="text-sm text-gray-600">전시회 체험 및 기사 작성 활동</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-600">{exhibitions.length}</div>
                <div className="text-xs text-gray-500">체험단</div>
              </div>
              <div className="w-px h-8 bg-gray-300"></div>
              <div className="text-right">
                <div className="text-2xl font-bold text-emerald-600">{applications.length}</div>
                <div className="text-xs text-gray-500">신청</div>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
          {/* 탭 네비게이션 */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              onClick={() => setActiveTab("exhibitions")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "exhibitions"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              체험단 전시 ({exhibitions.length})
            </button>
            <button
              onClick={() => setActiveTab("applications")}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "applications"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              체험 신청 내역 ({applications.length})
            </button>
          </div>

          {/* 체험단 전시 탭 */}
          {activeTab === "exhibitions" && (
            <div>
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : exhibitions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">체험단 전시가 없습니다</h3>
                  <p className="text-gray-500">새로운 체험단 전시가 추가되면 알려드리겠습니다.</p>
                </div>
              ) : (
                <div className="grid gap-6">
                  {exhibitions.map((exhibition) => (
                    <div key={exhibition.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex gap-4">
                        {exhibition.image_url && (
                          <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={exhibition.image_url}
                              alt={exhibition.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">{exhibition.title}</h3>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              모집중
                            </span>
                          </div>
                          
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {exhibition.description}
                          </p>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                            {exhibition.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {exhibition.location}
                              </div>
                            )}
                            {exhibition.start_date && exhibition.end_date && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatDate(exhibition.start_date)} - {formatDate(exhibition.end_date)}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {exhibition.current_participants || 0}/{exhibition.max_participants}명
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={() => setSelectedExhibition(exhibition)}
                              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              상세보기
                            </button>
                            <button
                              onClick={() => {
                                setApplicationData(prev => ({ ...prev, exhibition_id: exhibition.id }));
                                setShowApplicationForm(true);
                              }}
                              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                              체험 신청
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 체험 신청 내역 탭 */}
          {activeTab === "applications" && (
            <div>
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">체험 신청 내역이 없습니다</h3>
                  <p className="text-gray-500">체험단 전시에 신청해보세요.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {applications.map((application) => (
                    <div key={application.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {application.exhibition?.title || '전시회 정보 없음'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            신청일: {formatDate(application.created_at)}
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(application.status)}`}>
                          {getStatusText(application.status)}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">신청 유형:</span> {
                            application.application_type === 'exhibition_link' ? '전시회 링크' : '전시회 정보 및 가격'
                          }
                        </div>
                        
                        {application.application_type === 'exhibition_link' && application.exhibition_link && (
                          <div>
                            <span className="font-medium">전시회 링크:</span>
                            <a href={application.exhibition_link} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline ml-2">
                              링크 보기
                            </a>
                          </div>
                        )}
                        
                        {application.application_type === 'exhibition_info_price' && application.exhibition_info && (
                          <div>
                            <span className="font-medium">전시회 정보:</span>
                            <p className="mt-1 p-2 bg-gray-50 rounded text-xs">{application.exhibition_info}</p>
                          </div>
                        )}
                        
                        {application.additional_notes && (
                          <div>
                            <span className="font-medium">추가 메모:</span>
                            <p className="mt-1 p-2 bg-gray-50 rounded text-xs">{application.additional_notes}</p>
                          </div>
                        )}
                        
                        {application.admin_response && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <span className="font-medium text-blue-900">관리자 응답:</span>
                            <p className="mt-1 text-blue-800 text-xs">{application.admin_response}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 전시회 상세보기 모달 */}
      {selectedExhibition && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedExhibition(null)}></div>
          <div className="relative w-full max-w-2xl bg-white rounded-xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">전시회 상세 정보</h3>
              <button
                onClick={() => setSelectedExhibition(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {selectedExhibition.image_url && (
              <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden mb-4">
                <img
                  src={selectedExhibition.image_url}
                  alt={selectedExhibition.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{selectedExhibition.title}</h4>
                <p className="text-gray-600 text-sm">{selectedExhibition.description}</p>
              </div>
              
              {selectedExhibition.exhibition_info && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">전시회 정보</h5>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap">{selectedExhibition.exhibition_info}</p>
                </div>
              )}
              
              {selectedExhibition.ticket_info && (
                <div>
                  <h5 className="font-medium text-gray-900 mb-2">티켓 정보</h5>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap">{selectedExhibition.ticket_info}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                {selectedExhibition.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{selectedExhibition.location}</span>
                  </div>
                )}
                {selectedExhibition.start_date && selectedExhibition.end_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {formatDate(selectedExhibition.start_date)} - {formatDate(selectedExhibition.end_date)}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    {selectedExhibition.current_participants || 0}/{selectedExhibition.max_participants}명
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 체험 신청 폼 모달 */}
      {showApplicationForm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowApplicationForm(false)}></div>
          <div className="relative w-full max-w-lg bg-white rounded-xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">체험 신청</h3>
              <button
                onClick={() => setShowApplicationForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">신청 유형</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setApplicationData(prev => ({ ...prev, application_type: 'exhibition_link' }))}
                    className={`p-3 text-sm rounded-lg border-2 transition-colors ${
                      applicationData.application_type === 'exhibition_link'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    전시회 링크
                  </button>
                  <button
                    onClick={() => setApplicationData(prev => ({ ...prev, application_type: 'exhibition_info_price' }))}
                    className={`p-3 text-sm rounded-lg border-2 transition-colors ${
                      applicationData.application_type === 'exhibition_info_price'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    전시회 정보
                  </button>
                </div>
              </div>
              
              {applicationData.application_type === 'exhibition_link' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">전시회 링크</label>
                  <input
                    type="url"
                    value={applicationData.exhibition_link}
                    onChange={(e) => setApplicationData(prev => ({ ...prev, exhibition_link: e.target.value }))}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              )}
              
              {applicationData.application_type === 'exhibition_info_price' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">전시회 정보</label>
                    <textarea
                      value={applicationData.exhibition_info}
                      onChange={(e) => setApplicationData(prev => ({ ...prev, exhibition_info: e.target.value }))}
                      placeholder="전시회에 대한 상세 정보를 입력해주세요"
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">가격 정보</label>
                    <textarea
                      value={applicationData.price_info}
                      onChange={(e) => setApplicationData(prev => ({ ...prev, price_info: e.target.value }))}
                      placeholder="티켓 가격, 할인 정보 등을 입력해주세요"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">추가 메모 (선택)</label>
                <textarea
                  value={applicationData.additional_notes}
                  onChange={(e) => setApplicationData(prev => ({ ...prev, additional_notes: e.target.value }))}
                  placeholder="추가로 전달하고 싶은 내용이 있다면 입력해주세요"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowApplicationForm(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleApplicationSubmit}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? '신청 중...' : '신청하기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}