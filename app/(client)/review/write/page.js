"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FaChevronLeft, FaStar } from "react-icons/fa";
import { createClient } from "@/utils/supabase/client";
import { useUserStore } from "@/stores/userStore";
import { 
  Button,
  Textarea,
  Spinner,
  Select,
  SelectItem
} from "@heroui/react";
import Image from "next/image";

function ReviewWriteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const exhibitionId = searchParams.get("exhibitionId");
  const user = useUserStore((state) => state.user);
  
  // 디버깅용 로그
  console.log('ReviewWriteContent 렌더링됨');
  console.log('exhibitionId from searchParams:', exhibitionId);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [exhibition, setExhibition] = useState(null);
  const [exhibitions, setExhibitions] = useState([]);
  const supabase = createClient();

  // 폼 상태
  const [formData, setFormData] = useState({
    exhibition_id: exhibitionId || "",
    rating: 0,
    content: "",
    proof_image: "",
    custom_exhibition_name: "", // 새롭게 등록하기용 전시회명
  });

  // 별점 호버 상태
  const [hoverRating, setHoverRating] = useState(0);
  
  // 이미지 업로드 관련
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = React.useRef(null);
  
  // 새롭게 등록하기 모드
  const [isCustomMode, setIsCustomMode] = useState(false);

  // 전시회 정보 가져오기
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // exhibitionId가 있으면 해당 전시회 정보만 가져오기
      if (exhibitionId) {
        const { data, error } = await supabase
          .from("exhibition")
          .select("*,gallery:naver_gallery_url(*)")
          .eq("id", exhibitionId)
          .single();

        if (!error && data) {
          setExhibition(data);
          setFormData(prev => ({ ...prev, exhibition_id: exhibitionId }));
        }
      } else {
        // exhibitionId가 없으면 전시회 목록 가져오기 (진행 중인 전시회만)
        const today = new Date().toISOString();
        const { data, error } = await supabase
          .from("exhibition")
          .select("*,gallery:naver_gallery_url(*)")
          .gte("end_date", today)
          .order("end_date", { ascending: true })
          .limit(50);

        if (!error && data) {
          setExhibitions(data);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [exhibitionId]);

  // 별점 클릭
  const handleRatingClick = (rating) => {
    setFormData({ ...formData, rating });
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
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // 이미지 업로드 함수
  const uploadImage = async () => {
    if (!imageFile) return null;

    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `reviews/${fileName}`;

      // 1. 메인 이미지 업로드
      const { data, error } = await supabase.storage
        .from("reviews")
        .upload(filePath, imageFile);

      if (error) throw error;

      // 2. 썸네일 생성 및 업로드
      try {
        // 원본 이미지를 ArrayBuffer로 변환
        const arrayBuffer = await imageFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
          // Sharp로 썸네일 생성 (500x500px, JPEG 90% 품질)
          const sharp = require('sharp');
          const thumbnailBuffer = await sharp(buffer)
            .resize(500, 500)
            .jpeg({ quality: 90 })
            .toBuffer();
        
        // 썸네일 업로드
        const thumbnailPath = `thumbnails/${fileName}`;
        const { error: thumbError } = await supabase.storage
          .from("reviews")
          .upload(thumbnailPath, thumbnailBuffer, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: true
          });
        
        if (thumbError) {
          console.warn("리뷰 썸네일 생성 실패:", thumbError);
        } else {
          console.log("✅ 리뷰 썸네일 자동 생성 완료:", thumbnailPath);
        }
      } catch (thumbError) {
        console.warn("리뷰 썸네일 생성 중 오류 (메인 이미지는 정상 업로드됨):", thumbError);
      }

      const { data: { publicUrl } } = supabase.storage
        .from("reviews")
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.log("이미지 업로드 오류:", error);
      return null;
    }
  };

  // 폼 제출
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 로그인 체크
    if (!user) {
      alert("로그인이 필요합니다.");
      router.push("/mypage");
      return;
    }

    // 유효성 검사
    if (!isCustomMode && !formData.exhibition_id) {
      alert("전시회를 선택해주세요.");
      return;
    }
    
    if (isCustomMode && !formData.custom_exhibition_name.trim()) {
      alert("전시회명을 입력해주세요.");
      return;
    }

    if (formData.rating === 0) {
      alert("별점을 선택해주세요.");
      return;
    }

    if (!formData.content.trim()) {
      alert("리뷰 내용을 입력해주세요.");
      return;
    }

    if (formData.content.length < 10) {
      alert("리뷰는 최소 10자 이상 작성해주세요.");
      return;
    }

    if (!imageFile) {
      alert("증빙 사진을 첨부해주세요.");
      return;
    }

    setSubmitting(true);

    try {
      // 기존 리뷰 확인 (기존 전시회 선택 모드일 때만)
      if (!isCustomMode) {
        const { data: existingReviews, error: checkError } = await supabase
          .from("exhibition_review")
          .select("*")
          .eq("exhibition_id", formData.exhibition_id)
          .eq("user_id", user.id);

        if (!checkError && existingReviews && existingReviews.length > 0) {
          alert("이미 작성한 리뷰가 있어서 추가 작성은 불가합니다.");
          router.push(`/exhibition/${formData.exhibition_id}`);
          setSubmitting(false);
          return;
        }
      }

      // 이미지 업로드
      const imageUrl = await uploadImage();

      if (!imageUrl) {
        alert("이미지 업로드에 실패했습니다. 다시 시도해주세요.");
        setSubmitting(false);
        return;
      }

      // 사용자 이름 마스킹
      const maskedName = user.user_metadata?.name
        ? user.user_metadata.name.length > 1
          ? user.user_metadata.name[0] + '**'
          : user.user_metadata.name
        : user.email?.split('@')[0] + '**';

      // 리뷰 저장
      const reviewData = {
        user_id: user.id,
        rating: formData.rating,
        description: formData.content,
        name: maskedName,
        category: [],
        proof_image: imageUrl,
      };

      // 새롭게 등록하기 모드인 경우 exhibition_id를 null로 설정하고 전시회명을 title에 저장
      if (isCustomMode) {
        reviewData.exhibition_id = null;
        reviewData.title = formData.custom_exhibition_name;
      } else {
        reviewData.exhibition_id = formData.exhibition_id;
      }

      const { data, error } = await supabase
        .from("exhibition_review")
        .insert(reviewData)
        .select()
        .single();

      if (error) {
        console.log("리뷰 저장 오류:", error);
        throw error;
      }

      // 포인트 적립 API 호출 (500P, 잠금 상태)
      try {
        const pointResponse = await fetch('/api/points/earn', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            source: 'review',
            source_id: data.id,
            amount: 500,
            verification_required: true
          }),
        });

        const pointResult = await pointResponse.json();
        if (pointResult.success) {
          console.log('포인트 적립 완료:', pointResult.data.message);
          alert(`리뷰 작성 완료! ${pointResult.data.message}`);
        } else {
          console.error('포인트 적립 실패:', pointResult.error);
          alert('리뷰는 작성되었지만 포인트 적립에 실패했습니다.');
        }
      } catch (pointError) {
        console.error('포인트 적립 오류:', pointError);
        alert('리뷰는 작성되었지만 포인트 적립 중 오류가 발생했습니다.');
      }


      // 성공 메시지는 포인트 적립 API에서 이미 처리됨
      
      // 새롭게 등록하기 모드인 경우 커뮤니티로, 아니면 전시회 상세로 이동
      if (isCustomMode) {
        router.push("/community");
      } else {
        router.push(`/exhibition/${formData.exhibition_id}`);
      }
    } catch (error) {
      console.log("리뷰 등록 오류:", error);
      alert(`리뷰 등록 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">로그인이 필요합니다.</p>
          <Button color="primary" onPress={() => router.push("/mypage")}>
            로그인하기
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <button 
            onClick={() => {
              console.log('되돌아가기 버튼 클릭됨');
              console.log('exhibitionId:', exhibitionId);
              console.log('typeof exhibitionId:', typeof exhibitionId);
              console.log('exhibitionId length:', exhibitionId?.length);
              
              // exhibitionId가 있으면 해당 전시회 상세 페이지로, 없으면 커뮤니티로 이동
              if (exhibitionId && exhibitionId.trim() !== '') {
                console.log('전시회 상세 페이지로 이동:', `/exhibition/${exhibitionId}`);
                window.location.href = `/exhibition/${exhibitionId}`;
              } else {
                console.log('커뮤니티 리뷰 탭으로 이동');
                window.location.href = '/community?tab=review';
              }
            }} 
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
            type="button"
          >
            <FaChevronLeft className="text-xl text-gray-700" />
          </button>
          <h1 className="flex-1 text-center text-lg font-bold text-gray-900 -ml-10">
            리뷰 쓰기
          </h1>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 전시회 정보 */}
          {exhibition ? (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">전시회</h3>
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                  <Image
                    src={exhibition.photo || "/noimage.jpg"}
                    alt={exhibition.contents}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-gray-900 mb-1">{exhibition.contents}</h4>
                  <p className="text-sm text-gray-600">{exhibition.gallery?.name || exhibition.naver_gallery_url?.name || "갤러리 정보 없음"}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                전시회 선택 <span className="text-red-500">*</span>
              </h3>
              
              {!isCustomMode ? (
                <>
                  <Select
                    placeholder="전시회를 선택하세요"
                    selectedKeys={formData.exhibition_id ? new Set([formData.exhibition_id]) : new Set()}
                    onSelectionChange={(keys) => {
                      const value = Array.from(keys)[0];
                      setFormData({ ...formData, exhibition_id: value });
                    }}
                  >
                    {exhibitions.map((ex) => (
                      <SelectItem key={ex.id} textValue={ex.contents}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{ex.contents}</span>
                          <span className="text-xs text-gray-500">({ex.gallery?.name})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </Select>
                  
                  <div className="mt-4 text-center">
                    <button
                      type="button"
                      onClick={() => setIsCustomMode(true)}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      방문한 전시가 없었나요? 새롭게 등록하기
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        전시회명 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="전시회명을 입력하세요"
                        value={formData.custom_exhibition_name}
                        onChange={(e) => setFormData({ ...formData, custom_exhibition_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setIsCustomMode(false)}
                        className="text-sm text-gray-600 hover:text-gray-800 underline"
                      >
                        기존 전시회 목록에서 선택하기
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 별점 */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              별점 <span className="text-red-500">*</span>
            </h3>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingClick(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <FaStar
                    className={`text-4xl ${
                      star <= (hoverRating || formData.rating)
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-gray-600 mt-2">
              {formData.rating > 0 ? `${formData.rating}점` : "별점을 선택하세요"}
            </p>
          </div>

          {/* 리뷰 내용 */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              리뷰 내용 <span className="text-red-500">*</span>
            </h3>
            <Textarea
              placeholder="전시회는 어떠셨나요? 최소 10자 이상 작성해주세요."
              value={formData.content}
              onValueChange={(value) => setFormData({ ...formData, content: value })}
              minRows={8}
              isRequired
            />
            <div className="flex justify-start items-center mt-2">
              <p className="text-xs text-gray-500">
                {formData.content.length}자 / 최소 10자
              </p>
            </div>
          </div>

          {/* 증빙 사진 첨부 */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              증빙 사진 <span className="text-red-500">*</span>
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              현장사진, 티켓, 영수증 등을 필수로 첨부해주세요.
            </p>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />

            {imagePreview ? (
              <div className="relative">
                <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                  <Image
                    src={imagePreview}
                    alt="증빙 사진"
                    fill
                    className="object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center justify-center gap-3">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div className="text-left">
                    <span className="text-sm text-gray-700 block">클릭하여 사진 첨부</span>
                    <span className="text-xs text-gray-400">최대 5MB</span>
                  </div>
                </div>
              </button>
            )}
          </div>

          {/* 제출 버튼 */}
          <Button
            type="submit"
            color="primary"
            size="lg"
            className="w-full"
            isLoading={submitting}
            isDisabled={submitting}
          >
            리뷰 등록하기
          </Button>
        </form>
      </div>
    </div>
  );
}

function LoadingComponent() {
  return (
    <div className="w-full flex justify-center items-center h-[90vh]">
      <Spinner variant="wave" color="primary" />
    </div>
  );
}

export default function ReviewWritePage() {
  return (
    <Suspense fallback={<LoadingComponent />}>
      <ReviewWriteContent />
    </Suspense>
  );
}

