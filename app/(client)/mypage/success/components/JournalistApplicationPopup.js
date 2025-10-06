"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaChevronLeft, FaPlus, FaTimes, FaPenFancy, FaPhone, FaUserEdit, FaTags, FaCalendarAlt } from "react-icons/fa";
import { createClient } from "@/utils/supabase/client";
import { useUserStore } from "@/stores/userStore";
import { 
  Button,
  Input,
  Textarea,
  Checkbox,
  Select,
  SelectItem,
  Spinner
} from "@heroui/react";
import { motion } from "framer-motion";
import { PenTool, X } from "lucide-react";

export default function JournalistApplicationPopup({ isOpen, onClose }) {
  const router = useRouter();
  const user = useUserStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const supabase = createClient();

  // 폼 상태
  const [formData, setFormData] = useState({
    phone: "",
    introduction: "",
    interests: [],
    visit_frequency: ""
  });

  const interests_options = [
    "현대미술",
    "고전미술",
    "사진전",
    "조각전",
    "설치미술",
    "디지털아트",
    "한국화",
    "서양화",
    "판화",
    "도예"
  ];

  const visit_frequency_options = [
    "주 1회 이상",
    "월 2-3회",
    "월 1회",
    "분기별 1회"
  ];

  useEffect(() => {
    if (isOpen) {
      checkExistingApplication();
      // 모바일에서는 body 스크롤을 막지 않음
      if (window.innerWidth > 768) {
        document.body.style.overflow = 'hidden';
      }
    } else {
      // 팝업이 닫힐 때 body 스크롤 복원
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const checkExistingApplication = async () => {
    try {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('journalist_applications')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('기자단 신청 상태 확인 오류:', error);
      } else if (data) {
        setHasApplied(true);
        setFormData({
          phone: data.phone || "",
          introduction: data.introduction || "",
          interests: data.interests || [],
          visit_frequency: data.visit_frequency || ""
        });
      }
    } catch (error) {
      console.error('기자단 신청 상태 확인 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInterestToggle = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!formData.phone || !formData.introduction || formData.interests.length === 0 || !formData.visit_frequency) {
      alert('모든 필수 항목을 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);

      const applicationData = {
        user_id: user.id,
        phone: formData.phone,
        introduction: formData.introduction,
        interests: formData.interests,
        visit_frequency: formData.visit_frequency,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      if (hasApplied) {
        // 기존 신청 업데이트
        const { error } = await supabase
          .from('journalist_applications')
          .update(applicationData)
          .eq('user_id', user.id);

        if (error) throw error;
        alert('기자단 신청이 수정되었습니다.');
      } else {
        // 새 신청 생성
        const { error } = await supabase
          .from('journalist_applications')
          .insert([applicationData]);

        if (error) throw error;
        setHasApplied(true);
        alert('기자단 신청이 완료되었습니다.');
      }
    } catch (error) {
      console.error('기자단 신청 오류:', error);
      alert('신청 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/20" onClick={onClose}></div>
      
      {/* 팝업 컨텐츠 */}
      <div className="relative w-full max-w-5xl mx-4 mb-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl max-h-[85vh] sm:max-h-[75vh] overflow-y-auto shadow-2xl"
        >
          {/* 팝업 헤더 */}
          <div className="flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10 border-b border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-xl flex items-center justify-center">
                <PenTool className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">기자단 신청</h2>
                <p className="text-sm text-gray-600">아트 기자단 활동 신청</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* 콘텐츠 영역 */}
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">신청 정보를 불러오는 중...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 혜택 안내 */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FaPenFancy className="text-purple-600" />
                    기자단 혜택
                  </h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      전시회 무료 관람 및 프리뷰 기회
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      작가 및 갤러리 관계자와의 네트워킹
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      아트 시장 동향 및 정보 제공
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      기자단 전용 이벤트 참여
                    </li>
                  </ul>
                </div>

                {/* 신청 폼 */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* 연락처 */}
                  <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FaPhone className="text-blue-600" />
                      연락처 정보
                    </h3>
                    <Input
                      label="전화번호"
                      placeholder="010-0000-0000"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      isRequired
                      className="mb-4"
                    />
                  </div>

                  {/* 자기소개 */}
                  <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FaUserEdit className="text-green-600" />
                      자기소개
                    </h3>
                    <Textarea
                      label="간단한 자기소개를 작성해주세요"
                      placeholder="아트에 대한 관심사, 경험, 기자단 활동에 대한 의지 등을 자유롭게 작성해주세요."
                      value={formData.introduction}
                      onChange={(e) => handleInputChange('introduction', e.target.value)}
                      isRequired
                      minRows={4}
                      maxRows={8}
                    />
                  </div>

                  {/* 관심 분야 */}
                  <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FaTags className="text-purple-600" />
                      관심 분야 (복수 선택 가능)
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {interests_options.map((interest) => (
                        <Checkbox
                          key={interest}
                          isSelected={formData.interests.includes(interest)}
                          onValueChange={() => handleInterestToggle(interest)}
                          className="text-sm"
                        >
                          {interest}
                        </Checkbox>
                      ))}
                    </div>
                  </div>

                  {/* 전시회 관람 빈도 */}
                  <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FaCalendarAlt className="text-orange-600" />
                      전시회 관람 빈도
                    </h3>
                    <Select
                      label="평소 전시회 관람 빈도를 선택해주세요"
                      placeholder="관람 빈도 선택"
                      selectedKeys={formData.visit_frequency ? [formData.visit_frequency] : []}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0];
                        handleInputChange('visit_frequency', selected);
                      }}
                      isRequired
                    >
                      {visit_frequency_options.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>

                  {/* 제출 버튼 */}
                  <div className="flex justify-center pt-6">
                    <Button
                      type="submit"
                      color="primary"
                      size="lg"
                      isLoading={submitting}
                      startContent={!submitting && <FaPenFancy />}
                      className="px-12 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      {hasApplied ? '신청 수정하기' : '기자단 신청하기'}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* 하단 여백 추가 */}
          <div className="h-32"></div>
        </motion.div>
      </div>
    </div>
  );
}
