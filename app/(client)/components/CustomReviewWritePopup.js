"use client";
import React, { useState, useEffect } from "react";
import { FaStar } from "react-icons/fa";
import { createClient } from "@/utils/supabase/client";
import { useUserStore } from "@/stores/userStore";
import { 
  Button,
  Textarea,
  Spinner,
  Input,
} from "@heroui/react";
import Image from "next/image";
import { motion } from "framer-motion";

export default function CustomReviewWritePopup({ onBack, onClose, onSuccess }) {
  const user = useUserStore((state) => state.user);
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();

  // 단계 관리
  const [currentStep, setCurrentStep] = useState(1); // 1: 전시회 정보, 2: 별점, 3: 리뷰내용, 4: 증빙사진
  const [canProceed, setCanProceed] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // 폼 상태
  const [formData, setFormData] = useState({
    exhibition_title: "",
    exhibition_location: "",
    exhibition_date: "",
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

  // 단계별 진행 가능 여부 체크
  useEffect(() => {
    switch (currentStep) {
      case 1: // 전시회 정보
        setCanProceed(
          formData.exhibition_title.trim().length > 0 &&
          formData.exhibition_location.trim().length > 0 &&
          formData.exhibition_date.trim().length > 0
        );
        break;
      case 2: // 별점
        setCanProceed(formData.rating > 0);
        break;
      case 3: // 리뷰 내용
        setCanProceed(formData.content.length >= 10);
        break;
      case 4: // 증빙 사진
        setCanProceed(imageFile !== null);
        break;
      default:
        setCanProceed(false);
    }
  }, [currentStep, formData, imageFile]);

  // 단계 정보
  const getStepInfo = () => {
    switch (currentStep) {
      case 1:
        return {
          title: "전시회 정보 입력",
          subtitle: "방문하신 전시회의 기본 정보를 입력해주세요",
          description: "정확한 정보를 입력해주세요"
        };
      case 2:
        return {
          title: "별점 평가",
          subtitle: "전시회에 대한 평점을 선택해주세요",
          description: "별을 터치하여 평점을 선택하세요"
        };
      case 3:
        return {
          title: "리뷰 작성",
          subtitle: "전시회에 대한 솔직한 후기를 작성해주세요",
          description: "최소 10자 이상 작성해주세요"
        };
      case 4:
        return {
          title: "증빙 사진",
          subtitle: "방문 증빙 사진을 업로드해주세요",
          description: "티켓, 포스터, 전시장 내부 사진 등"
        };
      default:
        return { title: "", subtitle: "", description: "" };
    }
  };

  // 다음 단계로 이동
  const goToNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  // 이전 단계로 이동
  const goToPrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // 별점 클릭 핸들러
  const handleRatingClick = (rating) => {
    setFormData({ ...formData, rating });
    if (currentStep === 2) {
      // 2단계에서 별점 선택 시 자동으로 다음 단계로 이동
      setTimeout(() => setCurrentStep(3), 500);
    }
  };

  // 이미지 파일 선택
  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageFile(file);
      
      // 미리보기 생성
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 이미지 삭제
  const handleImageDelete = () => {
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 제출 처리
  const handleSubmit = async () => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }

    setSubmitting(true);

    try {
      let imageUrl = "";

      // 이미지 업로드
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `reviews/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("reviews")
          .upload(filePath, imageFile);

        if (uploadError) {
          console.error("이미지 업로드 오류:", uploadError);
          alert("이미지 업로드에 실패했습니다.");
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("reviews")
          .getPublicUrl(filePath);
        imageUrl = publicUrl;
      }

      // 리뷰 데이터 저장
      const maskedName = user.user_metadata?.name
        ? user.user_metadata.name.length > 1
          ? user.user_metadata.name[0] + '**'
          : user.user_metadata.name
        : user.email;

      // 커스텀 전시회 정보를 description에 포함
      const customDescription = `[커스텀 전시회]
제목: ${formData.exhibition_title}
장소: ${formData.exhibition_location}
방문일: ${formData.exhibition_date}

${formData.content}`;

      // 1. 리뷰 작성 전 유효성 검사
      const validationResponse = await fetch('/api/reviews/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exhibition_id: null // 커스텀 리뷰는 exhibition_id가 없음
        }),
      });

      const validationResult = await validationResponse.json();
      if (!validationResult.success) {
        alert(validationResult.error);
        setSubmitting(false);
        return;
      }

      // 2. 먼저 커스텀 전시회를 exhibition 테이블에 등록
      const { data: customExhibition, error: exhibitionError } = await supabase
        .from("exhibition")
        .insert({
          title: formData.exhibition_title,
          contents: `[커스텀 전시회] ${formData.exhibition_title}`,
          location: formData.exhibition_location,
          start_date: formData.exhibition_date,
          end_date: formData.exhibition_date,
          photo: null,
          status: 'pending_approval', // 관리자 승인 대기 상태
          created_by: user.id,
          is_custom: true // 커스텀 전시회 표시
        })
        .select()
        .single();

      if (exhibitionError) {
        console.error("커스텀 전시회 등록 오류:", exhibitionError);
        alert("전시회 등록에 실패했습니다.");
        setSubmitting(false);
        return;
      }

      // 3. 커스텀 리뷰 데이터 저장 (새로운 API 사용)
      const submitResponse = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exhibition_id: customExhibition.id,
          rating: formData.rating,
          description: customDescription,
          proof_image: imageUrl,
          category: [],
          is_custom_review: true,
          custom_exhibition_data: {
            title: formData.exhibition_title,
            location: formData.exhibition_location,
            date: formData.exhibition_date
          }
        }),
      });

      const submitResult = await submitResponse.json();
      if (!submitResult.success) {
        alert(submitResult.error);
        setSubmitting(false);
        return;
      }

      // 성공 처리
      setShowSuccessModal(true);
      console.log('커스텀 리뷰 작성 완료:', submitResult.data.message);

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

  const stepInfo = getStepInfo();

  if (showSuccessModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-8 mx-4 max-w-sm w-full text-center"
        >
          {/* 체크 아이콘 */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          {/* 완료 메시지 */}
          <h2 className="text-2xl font-bold text-gray-900 mb-4">완료되었습니다!</h2>
          
          {/* 포인트 안내 */}
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
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <span className="text-sm ml-2">잠시 후 자동으로 닫힙니다</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-t-3xl w-full max-w-md mx-auto max-h-[90vh] flex flex-col"
      >
        {/* 헤더 */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md z-10 border-b border-gray-200 p-6 rounded-t-3xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{stepInfo.title}</h2>
              <p className="text-sm text-gray-500 mt-1">{stepInfo.subtitle}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 뒤로가기 버튼 */}
          {currentStep > 1 && (
            <button
              onClick={currentStep === 1 ? onBack : goToPrevStep}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">뒤로</span>
            </button>
          )}

          {/* 단계 진행 표시 */}
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  step <= currentStep ? 'bg-blue-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* 내용 영역 */}
        <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: 'calc(90vh - 120px)' }}>
          {/* 1단계: 전시회 정보 입력 */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <p className="text-gray-600 text-sm">{stepInfo.description}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    전시회 제목 *
                  </label>
                  <Input
                    placeholder="예: 옥승철: 프로토타입"
                    value={formData.exhibition_title}
                    onChange={(e) => setFormData({ ...formData, exhibition_title: e.target.value })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    전시 장소 *
                  </label>
                  <Input
                    placeholder="예: 롯데뮤지엄"
                    value={formData.exhibition_location}
                    onChange={(e) => setFormData({ ...formData, exhibition_location: e.target.value })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    방문 날짜 *
                  </label>
                  <Input
                    type="date"
                    value={formData.exhibition_date}
                    onChange={(e) => setFormData({ ...formData, exhibition_date: e.target.value })}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="mt-6">
                <Button
                  onClick={goToNextStep}
                  disabled={!canProceed}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-xl"
                >
                  다음 단계
                </Button>
              </div>
            </div>
          )}

          {/* 2단계: 별점 평가 */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaStar className="w-8 h-8 text-yellow-500" />
                </div>
                <p className="text-gray-600 text-sm">{stepInfo.description}</p>
              </div>

              {/* 별점 표시 */}
              <div className="flex justify-center gap-2 mb-8">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRatingClick(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="text-4xl transition-colors duration-200"
                  >
                    <FaStar
                      className={
                        star <= (hoverRating || formData.rating)
                          ? "text-yellow-400"
                          : "text-gray-300"
                      }
                    />
                  </button>
                ))}
              </div>

              {/* 별점 설명 */}
              <div className="text-center">
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {formData.rating > 0 ? `${formData.rating}점` : "별을 선택해주세요"}
                </p>
                <p className="text-sm text-gray-500">
                  {formData.rating > 0 && "잠시 후 자동으로 다음 단계로 이동합니다..."}
                </p>
              </div>
            </div>
          )}

          {/* 3단계: 리뷰 내용 */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <p className="text-gray-600 text-sm">{stepInfo.description}</p>
              </div>

              <Textarea
                placeholder="전시회에 대한 솔직한 후기를 작성해주세요..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                minRows={6}
                className="w-full"
              />

              <div className="text-right text-sm text-gray-500">
                {formData.content.length}/10자 이상
              </div>

              <div className="mt-6">
                <Button
                  onClick={goToNextStep}
                  disabled={!canProceed}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-xl"
                >
                  다음 단계
                </Button>
              </div>
            </div>
          )}

          {/* 4단계: 증빙 사진 */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-gray-600 text-sm">{stepInfo.description}</p>
              </div>

              {!imagePreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium mb-2">사진을 업로드해주세요</p>
                  <p className="text-sm text-gray-500">JPG, PNG 파일만 가능합니다</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="h-48 bg-gray-100 rounded-2xl overflow-hidden">
                    <Image
                      src={imagePreview}
                      alt="증빙 사진"
                      width={400}
                      height={200}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    onClick={handleImageDelete}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  <div className="absolute bottom-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                    업로드 완료
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />

              <div className="mt-6">
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !canProceed}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 rounded-xl"
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <Spinner size="sm" />
                      <span>작성 중...</span>
                    </div>
                  ) : (
                    "리뷰 작성 완료"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* 하단 여백 */}
          <div className={currentStep === 4 ? "h-16" : "h-8"}></div>
        </div>
      </motion.div>
    </div>
  );
}
