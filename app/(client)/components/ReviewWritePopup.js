"use client";
import React, { useState, useEffect } from "react";
import { FaStar } from "react-icons/fa";
import { createClient } from "@/utils/supabase/client";
import { useUserStore } from "@/stores/userStore";
import { 
  Button,
  Spinner,
} from "@heroui/react";
import Image from "next/image";

export default function ReviewWritePopup({ exhibition, customExhibitionData, onBack, onClose, onSuccess, onCustomReview }) {
  const user = useUserStore((state) => state.user);
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();
  const [authChecked, setAuthChecked] = useState(false);

  // 단계 관리 (customExhibitionData가 유효하면 전시 선택(0단계) 생략)
  const [currentStep, setCurrentStep] = useState(exhibition ? 1 : (customExhibitionData && customExhibitionData.title && customExhibitionData.gallery && customExhibitionData.visitDate ? 1 : 0)); // 0: 전시회선택, 1: 별점, 2: 리뷰내용, 3: 증빙사진
  const [canProceed, setCanProceed] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // 전시회 목록 상태
  const [exhibitions, setExhibitions] = useState([]);
  const [selectedExhibition, setSelectedExhibition] = useState(exhibition);
  const [loadingExhibitions, setLoadingExhibitions] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // 폼 상태
  const [formData, setFormData] = useState({
    exhibition_id: exhibition?.id || "",
    rating: 0,
    content: "",
    proof_image: "",
  });

  // 별점 호버 상태
  const [hoverRating, setHoverRating] = useState(0);
  
  // 이미지 업로드 관련
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = React.useRef(null);

  // 전시회 목록 가져오기
  const fetchExhibitions = async () => {
    if (exhibition || (customExhibitionData && customExhibitionData.title && customExhibitionData.gallery && customExhibitionData.visitDate)) return; // 이미 전시회가 선택되었거나 커스텀 입력인 경우
    
    setLoadingExhibitions(true);
    try {
      const { data, error } = await supabase
        .from("exhibition")
        .select("*,gallery:naver_gallery_url(*),naver_gallery_url(*)")
        .gte("end_date", new Date().toISOString()) // 종료되지 않은 전시회만
        .order("end_date", { ascending: true })
        .limit(10);

      if (error) {
        console.error("전시회 목록 가져오기 오류:", error);
        return;
      }

      setExhibitions(data || []);
    } catch (error) {
      console.error("전시회 목록 가져오기 오류:", error);
    } finally {
      setLoadingExhibitions(false);
    }
  };

  // 컴포넌트 마운트 시 전시회 목록 가져오기 (초안 관련 기능 제거)
  useEffect(() => {
    // 바디 스크롤 잠금 (iOS Safari 포함)
    const prevOverflow = document.body.style.overflow;
    const prevHtmlOverscroll = document.documentElement.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'contain';
    
    // 로그인 필수 진입 가드: 비로그인 시 즉시 마이페이지로 유도
    if (!user || !user.id) {
      if (typeof window !== 'undefined') {
        window.location.href = '/mypage';
      }
      return; // 렌더 차단
    } else {
      setAuthChecked(true);
    }

    if (!exhibition && (!customExhibitionData || !customExhibitionData.title || !customExhibitionData.gallery || !customExhibitionData.visitDate)) {
      fetchExhibitions();
    }

    return () => {
      document.body.style.overflow = prevOverflow;
      document.documentElement.style.overscrollBehavior = prevHtmlOverscroll;
    };
  }, [exhibition]);

  // 단계별 진행 가능 여부 체크
  useEffect(() => {
    switch (currentStep) {
      case 0: // 전시회 선택
        setCanProceed(selectedExhibition !== null);
        break;
      case 1: // 별점
        setCanProceed(formData.rating > 0);
        break;
      case 2: // 리뷰 내용
        setCanProceed(formData.content.length >= 10);
        break;
      case 3: // 증빙 사진
        setCanProceed(imageFile !== null);
        break;
      default:
        setCanProceed(false);
    }
  }, [currentStep, selectedExhibition, formData.rating, formData.content.length, imageFile]);

  // 다음 단계로 이동
  const goToNextStep = () => {
    if (canProceed && currentStep < 3) {
      if (currentStep === 0 && selectedExhibition) {
        // 전시회 선택 후 폼 데이터 업데이트
        setFormData({ ...formData, exhibition_id: selectedExhibition.id });
      }
      setCurrentStep(currentStep + 1);

    }
  };

  // 이전 단계로 이동
  const goToPrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // 별점 클릭 (자동으로 다음 단계로 이동)
  const handleRatingClick = (rating) => {
    setFormData({ ...formData, rating });
    // 1단계에서 별점 선택 시 자동으로 다음 단계로 이동
    setTimeout(() => {
      setCurrentStep(2);
    }, 500); // 0.5초 후 자동 이동
  };

  // 이미지 파일 선택
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

  // 이미지 제거
  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 초안 저장 기능 제거

  // 리뷰 제출
  const handleSubmit = async () => {
    if (!user || !user.id) {
      // 로그인이 필요한 경우 리뷰 초안 저장
      saveReviewDraft();
      alert("로그인이 필요합니다. 로그인 후 작성하던 리뷰를 이어서 작성할 수 있습니다.");
      
      // 로그인 페이지로 이동 (리다이렉트 URL 포함)
      window.location.href = '/mypage?redirect_to=' + encodeURIComponent(window.location.pathname);
      return;
    }

    if (formData.rating === 0) {
      alert("별점을 선택해주세요.");
      return;
    }

    if (formData.content.length < 10) {
      alert("리뷰 내용을 최소 10자 이상 작성해주세요.");
      return;
    }

    if (!imageFile) {
      alert("증빙 사진을 업로드해주세요.");
      return;
    }

    setSubmitting(true);

    try {
      // 1. 리뷰 작성 전 유효성 검사
      const validationResponse = await fetch('/api/reviews/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exhibition_id: exhibition?.id || formData.exhibition_id || null
        }),
      });

      const validationResult = await validationResponse.json();
      if (!validationResult.success) {
        alert(validationResult.error);
        setSubmitting(false);
        return;
      }

      console.log('리뷰 작성 가능:', validationResult.data);

      // 2. 이미지 업로드 처리
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `reviews/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("reviews")
        .upload(filePath, imageFile);

      if (uploadError) {
        console.error("이미지 업로드 오류:", uploadError);
        alert("이미지 업로드에 실패했습니다. 다시 시도해주세요.");
        setSubmitting(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("reviews")
        .getPublicUrl(filePath);

      // 3. 리뷰 데이터 저장 (새로운 API 사용)
      const submitResponse = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exhibition_id: customExhibitionData ? null : (exhibition?.id || formData.exhibition_id),
          rating: formData.rating,
          description: formData.content,
          proof_image: publicUrl,
          category: [],
          is_custom_review: !!customExhibitionData,
          custom_exhibition_data: customExhibitionData ? {
            title: customExhibitionData.title,
            gallery: customExhibitionData.gallery,
            visit_date: customExhibitionData.visitDate
          } : null
        }),
      });

      const submitResult = await submitResponse.json();
      if (!submitResult.success) {
        alert(submitResult.error);
        setSubmitting(false);
        return;
      }

      // 포인트 적립은 /api/reviews/submit에서 이미 처리됨
      console.log('리뷰 작성 및 포인트 적립 완료');

      // 성공 처리
      setShowSuccessModal(true);
      console.log('리뷰 작성 완료:', submitResult.data.message);
      
      // 리뷰 초안 삭제
      localStorage.removeItem('reviewDraft');

      // 2초 후 성공 콜백 호출 및 팝업 닫기
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      }, 2000);

    } catch (error) {
      console.error("리뷰 작성 오류:", error);
      alert("리뷰 작성 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // 단계별 제목과 설명
  const getStepInfo = () => {
    switch (currentStep) {
      case 0:
        return {
          title: "전시회를 선택해주세요",
          subtitle: "리뷰를 작성할 전시회를 선택하세요",
          description: "진행중인 전시회 중에서 선택해주세요"
        };
      case 1:
        return {
          title: "별점을 선택해주세요",
          subtitle: "전시회는 어떠셨나요?",
          description: "1~5점 중 선택해주세요"
        };
      case 2:
        return {
          title: "리뷰를 작성해주세요",
          subtitle: "자세한 후기를 남겨주세요",
          description: "최소 10자 이상 작성해주세요"
        };
      case 3:
        return {
          title: "증빙 사진을 업로드해주세요",
          subtitle: "방문 증명을 위한 사진이 필요해요",
          description: "현장사진, 티켓, 영수증 등을 첨부해주세요"
        };
      default:
        return { title: "", subtitle: "", description: "" };
    }
  };

  const stepInfo = getStepInfo();

  return (
    <div
      className="bg-white/80 backdrop-blur-sm rounded-2xl h-[85dvh] sm:h-[75dvh] overflow-y-auto overscroll-contain shadow-2xl"
      style={{ WebkitOverflowScrolling: 'touch', touchAction: 'manipulation' }}
    >
      {/* 헤더 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-5 py-4 flex items-center justify-between">
          {/* 왼쪽: 아이콘 + 제목 */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <div>
            <h2 className="text-xl font-bold text-gray-900">전시회 리뷰 작성</h2>
            {selectedExhibition?.contents && (
              <p className="text-sm text-gray-600 leading-relaxed">{selectedExhibition.contents}</p>
            )}
            </div>
          </div>

          {/* 오른쪽: 포인트 + 닫기 */}
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 진행 단계 표시 */}
      <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-center space-x-4">
          {[0, 1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step <= currentStep 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-300 text-gray-600'
              }`}>
                {step === 0 ? '전시' : step}
              </div>
              {step < 3 && (
                <div className={`w-8 h-1 mx-2 ${
                  step < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
        {/* 추가적인 세로 1단계 텍스트 제거 (요청사항) */}
        <div className="h-2" />
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="space-y-5">
          {/* 전시회 정보 */}
          {selectedExhibition && (
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden">
                  <Image
                    src={selectedExhibition?.photo || "/noimage.jpg"}
                    alt={selectedExhibition?.contents}
                    width={64}
                    height={64}
                    className="w-full h-full object-cover rounded-xl"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">
                    {selectedExhibition?.contents}
                  </h3>
                  <p className="text-xs text-gray-500 mb-2">
                    {selectedExhibition?.gallery?.name || selectedExhibition?.naver_gallery_url?.name || "갤러리 정보 없음"}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full font-medium">리뷰 작성</span>
                    <span className="bg-yellow-100 text-yellow-600 text-xs px-2 py-1 rounded-full font-medium">500P+</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 단계별 콘텐츠 */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 border border-gray-200/50 shadow-sm">
            <div className="text-center mb-4">
              {currentStep !== 0 && (
                <>
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{stepInfo.subtitle}</h3>
                  <p className="text-gray-500">{stepInfo.description}</p>
                </>
              )}
              {currentStep === 0 && (
                <p className="text-gray-500">진행중인 전시회 중에서 선택해주세요</p>
              )}
            </div>

            {/* 0단계: 전시회 선택 */}
            {currentStep === 0 && (
              <div>
                {/* 전시회 검색창 */}
                <div className="mb-3 sticky top-0 bg-white/90 backdrop-blur z-10 border-b border-gray-100 pb-3">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="전시회 이름 또는 갤러리로 검색"
                    className="w-full rounded-xl border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                {loadingExhibitions ? (
                  <div className="text-center py-8">
                    <Spinner size="lg" />
                    <p className="text-gray-500 mt-4">전시회 목록을 불러오는 중...</p>
                  </div>
                ) : exhibitions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-6">진행중인 전시회가 없습니다.</p>
                    {onCustomReview && (
                      <button
                        onClick={onCustomReview}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
                      >
                        새롭게 등록하기
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {exhibitions
                      .filter((exh) => {
                        if (!searchTerm.trim()) return true;
                        const q = searchTerm.toLowerCase();
                        return (
                          (exh.contents || "").toLowerCase().includes(q) ||
                          (exh.gallery?.name || exh.naver_gallery_url?.name || "").toLowerCase().includes(q)
                        );
                      })
                      .map((exh) => (
                      <button
                        key={exh.id}
                        onClick={() => {
                          setSelectedExhibition(exh);
                          setFormData(prev => ({
                            ...prev,
                            exhibition_id: exh.id
                          }));
                          // 전시회 선택 시 자동으로 다음 단계(별점)로 이동
                          setTimeout(() => {
                            setCurrentStep(1);
                          }, 300);
                        }}
                        className={`w-full p-4 border-2 rounded-xl text-left transition-all ${
                          selectedExhibition?.id === exh.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                            <Image
                              src={exh.photo || "/noimage.jpg"}
                              alt={exh.contents}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">
                              {exh.contents}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {exh.gallery?.name || exh.naver_gallery_url?.name || "갤러리 정보 없음"}
                            </p>
                          </div>
                          {selectedExhibition?.id === exh.id && (
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                    
                    {/* 새롭게 등록하기 버튼 - 전시회가 있어도 항상 표시 */}
                    {onCustomReview && (
                      <div className="pt-4 border-t border-gray-200">
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-200">
                          <div className="text-center">
                            {/* 상단 아이콘 제거 - 중복 혼란 방지 */}
                            <h4 className="text-base font-bold text-gray-900 mb-1">전시회가 목록에 없나요?</h4>
                            <p className="text-xs text-gray-600 mb-3">직접 전시회 정보를 입력하여 리뷰를 작성할 수 있습니다</p>
                            <button
                              onClick={onCustomReview}
                              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow"
                            >
                              + 새롭게 등록하기
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* 0단계에서는 다음 버튼 제거 - 전시회 선택 시 자동으로 다음 단계로 이동 */}
              </div>
            )}

            {/* 1단계: 별점 */}
            {currentStep === 1 && (
              <div className="text-center">
                <div className="flex items-center justify-center space-x-3 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingClick(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="focus:outline-none transform hover:scale-110 transition-transform"
                    >
                      <FaStar
                        className={`w-12 h-12 ${
                          star <= (hoverRating || formData.rating)
                            ? "text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {formData.rating > 0 && (
                  <div className="animate-fade-in">
                    <p className="text-lg font-medium text-gray-700 mb-4">
                      {formData.rating}점을 선택하셨습니다
                    </p>
                    <p className="text-sm text-blue-600 font-medium">
                      잠시 후 자동으로 다음 단계로 이동합니다...
                    </p>
                  </div>
                )}
                {/* 1단계에서는 다음 버튼 제거 - 별점 선택 시 자동으로 다음 단계로 이동 */}
              </div>
            )}

            {/* 2단계: 리뷰 내용 */}
            {currentStep === 2 && (
              <div>
                <textarea
                  value={formData.content}
                  onChange={(e) => {
                    setFormData({ ...formData, content: e.target.value });
                    setTimeout(() => saveReviewDraft(), 1000);
                  }}
                  placeholder="전시회에 대한 솔직한 후기를 작성해주세요..."
                  className="w-full min-h-[140px] rounded-2xl border border-gray-300 bg-white p-4 text-base leading-6 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                />
                <div className="flex justify-between items-center mt-4">
                  <p className="text-sm text-gray-500">
                    {formData.content.length}자 / 최소 10자
                  </p>
                  {formData.content.length >= 10 && (
                    <p className="text-sm text-green-600 font-medium">✓ 작성 완료</p>
                  )}
                </div>
                
                {/* 2단계 버튼 */}
                <div className="mt-4">
                  <Button
                    onClick={goToNextStep}
                    disabled={!canProceed}
                    className={`w-full font-bold py-4 text-lg ${
                      canProceed 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    다음 단계
                  </Button>
                </div>
              </div>
            )}

            {/* 3단계: 증빙 사진 */}
            {currentStep === 3 && (
              <div>
                {!imagePreview ? (
                  <label className="block">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <p className="text-gray-600 font-medium mb-1">사진을 선택해주세요</p>
                      <p className="text-xs text-gray-400">JPG, PNG 파일만 가능 (최대 5MB)</p>
                    </div>
                  </label>
                ) : (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="증빙 사진 미리보기"
                      className="w-full h-48 object-cover rounded-2xl"
                    />
                    <button
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg text-sm"
                    >
                      ×
                    </button>
                    <div className="absolute bottom-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                      ✓ 업로드 완료
                    </div>
                  </div>
                )}
                
                {/* 3단계 버튼 */}
                <div className="mt-3">
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting || !canProceed}
                    className={`w-full font-bold py-4 text-lg ${
                      canProceed && !submitting
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {submitting ? (
                      <div className="flex items-center gap-2">
                        <Spinner size="sm" color="white" />
                        작성 중...
                      </div>
                    ) : (
                      "리뷰 작성 완료"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* 하단 여백 (3단계에서 더 많은 여백) */}
          <div className={currentStep === 3 ? "h-10" : "h-4"}></div>
        </div>
      </div>

      {/* 성공 완료 팝업 */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 mx-4 max-w-sm w-full text-center shadow-2xl animate-pulse">
            {/* 성공 아이콘 */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            {/* 성공 메시지 */}
            <h3 className="text-2xl font-bold text-gray-900 mb-2">완료되었습니다!</h3>
            <p className="text-gray-600 mb-6">리뷰가 성공적으로 작성되었습니다</p>
            
            {/* 포인트 지급 안내 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6">
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span className="text-yellow-800 font-semibold">500P 지급 완료!</span>
              </div>
            </div>
            
            {/* 로딩 애니메이션 */}
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              <span className="ml-2 text-sm">잠시 후 자동으로 닫힙니다</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
