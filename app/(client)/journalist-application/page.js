"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaChevronLeft, FaPlus, FaTimes, FaPenFancy, FaPhone, FaUserEdit, FaTags, FaCalendarAlt } from "react-icons/fa";
import { createClient } from "@/utils/supabase/client";
import { useUserStore } from "@/stores/userStore";
import { Spinner } from "@heroui/react";

export default function JournalistApplicationPage() {
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

  // 활동가능시간, 포트폴리오, 관련경험 항목 제거

  const visit_frequency_options = [
    "주 1회 이상",
    "월 2-3회",
    "월 1회",
    "2-3개월에 1회",
    "연 3-4회"
  ];

  // 기존 신청 내역 확인
  useEffect(() => {
    const checkApplication = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("journalist_applications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        setHasApplied(true);
        // 기존 신청 데이터로 폼 채우기
        const app = data[0];
        setFormData({
          phone: app.phone || "",
          introduction: app.introduction || "",
          interests: app.interests || [],
          visit_frequency: app.visit_frequency || ""
        });
      }

      setLoading(false);
    };

    checkApplication();
  }, [user]);

  // 포트폴리오 관련 로직 제거됨

  // 관심 분야 토글
  const toggleInterest = (interest) => {
    const newInterests = formData.interests.includes(interest)
      ? formData.interests.filter(i => i !== interest)
      : [...formData.interests, interest];
    
    setFormData({
      ...formData,
      interests: newInterests
    });
  };

  // 폼 제출
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 유효성 검사
    if (!formData.phone.trim()) {
      alert("연락처를 입력해주세요.");
      return;
    }

    if (!formData.introduction.trim()) {
      alert("자기소개 및 지원동기를 입력해주세요.");
      return;
    }

    if (formData.interests.length === 0) {
      alert("관심 분야를 최소 1개 이상 선택해주세요.");
      return;
    }

    if (!formData.visit_frequency) {
      alert("전시회 관람 빈도를 선택해주세요.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/journalist-application/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          ...formData
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(hasApplied 
          ? "기자단 신청이 재제출되었습니다!" 
          : "기자단 신청이 완료되었습니다!");
        router.push("/mypage/success");
      } else {
        alert(result.message || "신청에 실패했습니다.");
      }
    } catch (error) {
      console.log("신청 처리 중 오류:", error);
      alert("신청 처리 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">로그인이 필요합니다.</p>
          <button
            onClick={() => router.push("/mypage")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            로그인하기
          </button>
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
            onClick={() => router.back()} 
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FaChevronLeft className="text-xl text-gray-700" />
          </button>
          <h1 className="flex-1 text-center text-lg font-bold text-gray-900 -ml-10">
            기자단 신청
          </h1>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
          {/* 안내 박스 */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <FaPenFancy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">아트앤브릿지 기자단</h2>
              <p className="text-sm opacity-90">전시회 전문 리포터로 활동하세요</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-lg">📝</span>
              <span className="text-sm">기사 작성 시 500포인트 지급</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg">🎫</span>
              <span className="text-sm">전시회 티켓 지원 혜택</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg">📸</span>
              <span className="text-sm">전문 기자단 배지 부여</span>
            </div>
          </div>
        </div>

        {hasApplied && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              ℹ️ 이미 신청하신 내역이 있습니다. 수정하여 재제출할 수 있습니다.
            </p>
          </div>
        )}

        {/* 신청 폼 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 연락처 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <FaPhone className="text-blue-600" />
              <label className="text-sm font-semibold text-gray-900">
                연락처 <span className="text-red-500">*</span>
              </label>
            </div>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 자기소개 및 지원동기 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <FaUserEdit className="text-blue-600" />
              <label className="text-sm font-semibold text-gray-900">
                자기소개 및 지원동기 <span className="text-red-500">*</span>
              </label>
            </div>
            <textarea
              value={formData.introduction}
              onChange={(e) => setFormData({ ...formData, introduction: e.target.value })}
              rows={6}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            <div className="mt-2 text-xs text-gray-500 text-right">
              {formData.introduction.length}자
            </div>
          </div>

          {/* 관심 분야 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <FaTags className="text-blue-600" />
              <label className="text-sm font-semibold text-gray-900">
                관심 분야 (복수 선택 가능) <span className="text-red-500">*</span>
              </label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {interests_options.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${formData.interests.includes(interest)
                      ? 'bg-blue-500 text-white shadow-md transform scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                    }
                  `}
                >
                  {interest}
                </button>
              ))}
            </div>
            <div className="mt-3 text-xs text-gray-500">
              선택된 관심 분야: {formData.interests.length}개
            </div>
          </div>

          {/* 전시회 관람 빈도 */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <FaCalendarAlt className="text-blue-600" />
              <label className="text-sm font-semibold text-gray-900">
                평소 전시회 관람 빈도 <span className="text-red-500">*</span>
              </label>
            </div>
            <select
              value={formData.visit_frequency}
              onChange={(e) => setFormData({ ...formData, visit_frequency: e.target.value })}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-base text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">평소 전시회 관람 빈도를 선택해주세요</option>
              {visit_frequency_options.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={submitting}
            className={`
              w-full py-4 px-6 rounded-xl font-bold text-lg text-white
              transition-all duration-200 shadow-lg
              ${submitting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl transform hover:-translate-y-0.5'
              }
            `}
          >
            {submitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>처리 중...</span>
              </div>
            ) : (
              hasApplied ? "재제출하기" : "신청하기"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

