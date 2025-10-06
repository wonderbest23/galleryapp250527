"use client";
import React, { useEffect } from "react";
import { Gift } from "lucide-react";

export default function RewardBenefitsPopup({ isOpen, onClose }) {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/20" onClick={onClose}></div>
      
      {/* 팝업 컨텐츠 */}
      <div className="relative w-full max-w-5xl mx-4 mb-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl max-h-[85vh] sm:max-h-[75vh] overflow-y-auto shadow-2xl">
          <div className="flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10 border-b border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Gift className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">리워드 혜택</h2>
                <p className="text-sm text-gray-600">등급별 다양한 혜택을 확인하세요</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-2xl font-bold text-yellow-600">4</div>
                  <div className="text-xs text-gray-500">등급</div>
                </div>
                <div className="w-px h-8 bg-gray-300"></div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-emerald-600">∞</div>
                  <div className="text-xs text-gray-500">혜택</div>
                </div>
              </div>
              
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
          
          <div className="p-6">
            <div className="space-y-6">
              {/* 인트로 섹션 */}
              <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <Gift className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">아트앤브릿지 멤버십</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      활동하고 포인트를 모아 더 많은 혜택을 누려보세요!
                    </p>
                  </div>
                </div>
              </div>

              {/* 등급별 혜택 카드 */}
              <div className="grid gap-4">
                {[
                  {
                    name: "브론즈 등급",
                    points: "0 P 이상",
                    icon: "🥉",
                    color: "from-orange-400 to-orange-500",
                    bgColor: "from-orange-50 to-orange-100",
                    benefits: ["리뷰/게시글 작성 시 포인트 적립"]
                  },
                  {
                    name: "실버 등급", 
                    points: "1,000 P 이상",
                    icon: "🥈",
                    color: "from-gray-400 to-gray-500",
                    bgColor: "from-gray-50 to-gray-100",
                    benefits: ["게시글 작성 시 +5P 추가 적립", "리워드샵 일부 상품 구매 가능"]
                  },
                  {
                    name: "골드 등급",
                    points: "5,000 P 이상", 
                    icon: "🥇",
                    color: "from-yellow-400 to-yellow-500",
                    bgColor: "from-yellow-50 to-yellow-100",
                    benefits: ["게시글 작성 시 +10P 추가 적립", "리워드샵 모든 상품 구매 가능", "월 1회 전시 티켓 10% 할인 쿠폰"]
                  },
                  {
                    name: "플래티넘 등급",
                    points: "10,000 P 이상",
                    icon: "💎", 
                    color: "from-purple-400 to-purple-500",
                    bgColor: "from-purple-50 to-purple-100",
                    benefits: ["게시글 작성 시 +15P 추가 적립", "리워드샵 VIP 상품 구매 가능", "월 1회 전시 티켓 20% 할인 쿠폰", "특별 굿즈 제공"]
                  }
                ].map((tier, index) => (
                  <div key={index} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all duration-300 hover:-translate-y-1">
                    {/* 등급 헤더 영역 */}
                    <div className={`bg-gradient-to-r ${tier.bgColor} p-6`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 bg-gradient-to-br ${tier.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                          <span className="text-3xl">{tier.icon}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-1">{tier.name}</h3>
                          <p className="text-sm text-gray-600 font-medium">{tier.points}</p>
                        </div>
                      </div>
                    </div>

                    {/* 혜택 목록 영역 */}
                    <div className="p-6">
                      <div className="space-y-3">
                        {tier.benefits.map((benefit, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <div className={`w-6 h-6 bg-gradient-to-br ${tier.color} rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm`}>
                              <span className="text-white text-xs font-bold">✓</span>
                            </div>
                            <p className="text-sm text-gray-700 flex-1 leading-relaxed font-medium">{benefit}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 추가 안내 */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-white text-2xl">✨</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg mb-2">포인트 적립 안내</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">다양한 방법으로 포인트를 모아보세요</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl p-6 border border-blue-100 shadow-sm">
                    <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">P</span>
                      </div>
                      포인트 적립 방법
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-sm font-bold">50</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">전시 리뷰 작성</div>
                          <div className="text-xs text-gray-500">상세한 리뷰 작성 시</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-sm font-bold">10</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">커뮤니티 게시글</div>
                          <div className="text-xs text-gray-500">의미있는 게시글 작성 시</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-xs font-bold">1%</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">작품 구매</div>
                          <div className="text-xs text-gray-500">결제금액의 1% 적립</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-6 border border-emerald-100 shadow-sm">
                    <h4 className="font-bold text-emerald-900 mb-4 flex items-center gap-2">
                      <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">★</span>
                      </div>
                      등급 산정 기준
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                          <span className="text-emerald-600 text-xs">📊</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">누적 포인트 기준</div>
                          <div className="text-xs text-gray-500">총 적립 포인트로 등급 결정</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                          <span className="text-emerald-600 text-xs">⚡</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">자동 산정 시스템</div>
                          <div className="text-xs text-gray-500">실시간으로 등급 업데이트</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                          <span className="text-emerald-600 text-xs">🔄</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">실시간 업데이트</div>
                          <div className="text-xs text-gray-500">포인트 적립 즉시 반영</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 하단 여백 추가 */}
              <div className="h-32"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
