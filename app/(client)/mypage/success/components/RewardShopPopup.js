"use client";
import React, { useState, useEffect } from "react";
import { ShoppingCart } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useUserStore } from "@/stores/userStore";

export default function RewardShopPopup({ isOpen, onClose, userPoints, onPurchaseComplete }) {
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
  const [rewardItems, setRewardItems] = useState([]);
  const [purchasing, setPurchasing] = useState(false);
  const [loading, setLoading] = useState(true);
  const user = useUserStore((state) => state.user);

  // 리워드샵 상품 조회
  const fetchRewardItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/reward-shop/items');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setRewardItems(data.items || []);
        }
      }
    } catch (error) {
      console.error('리워드샵 상품 조회 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 한 번만 상품 조회
  useEffect(() => {
    fetchRewardItems();
  }, []);

  // 구매 처리
  const handleRewardPurchase = async (item) => {
    if (!item || !user) return;

    // 포인트 부족 체크
    if (userPoints < item.points_required) {
      alert("포인트가 부족합니다.");
      return;
    }

    // 재고 체크
    if (item.stock <= 0) {
      alert("상품의 재고가 없습니다.");
      return;
    }

    setPurchasing(true);
    try {
      const response = await fetch("/api/reward-shop/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId: item.id,
          userId: user.id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert("구매가 완료되었습니다!");
        // 부모 컴포넌트에 구매 완료 알림 (포인트 새로고침)
        if (onPurchaseComplete) {
          onPurchaseComplete();
        }
      } else {
        alert(result.message || "구매에 실패했습니다.");
      }
    } catch (error) {
      console.log("구매 처리 중 오류:", error);
      alert("구매 처리 중 오류가 발생했습니다.");
    } finally {
      setPurchasing(false);
    }
  };

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
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">리워드샵</h2>
                <p className="text-sm text-gray-600 leading-relaxed">포인트로 다양한 혜택을 받아보세요</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-2xl font-bold text-purple-600">{userPoints.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">내 포인트</div>
                </div>
                <div className="w-px h-8 bg-gray-300"></div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-emerald-600">{rewardItems.length}</div>
                  <div className="text-xs text-gray-500">상품 수</div>
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
              {/* 로딩 상태 */}
              {loading ? (
                <div className="bg-white/90 backdrop-blur-md rounded-2xl p-12 border border-gray-200/50 shadow-sm">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">상품을 불러오는 중...</h3>
                    <p className="text-gray-500 leading-relaxed">잠시만 기다려주세요</p>
                  </div>
                </div>
              ) : rewardItems.length === 0 ? (
                <div className="bg-white/90 backdrop-blur-md rounded-2xl p-12 border border-gray-200/50 shadow-sm">
                  <div className="text-center">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShoppingCart className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">판매 중인 상품이 없습니다</h3>
                    <p className="text-gray-500 leading-relaxed">새로운 상품이 곧 출시될 예정입니다!</p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4">
                  {rewardItems.map((item, index) => {
                    const canAfford = userPoints >= item.points_required;
                    const hasStock = item.stock > 0;

                    return (
                      <div key={item.id} className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all duration-300">
                        {/* 상품 이미지 영역 */}
                        <div className="relative h-32 bg-gradient-to-br from-blue-50 to-purple-50">
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-16 h-16 bg-white/80 rounded-full flex items-center justify-center shadow-sm">
                                <ShoppingCart className="w-8 h-8 text-blue-500" />
                              </div>
                            </div>
                          )}
                          
                          {/* 상태 배지 */}
                          <div className="absolute top-3 right-3">
                            {!hasStock ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-500 text-white shadow-sm">
                                품절
                              </span>
                            ) : !canAfford ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-500 text-white shadow-sm">
                                포인트 부족
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-500 text-white shadow-sm">
                                구매 가능
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 상품 정보 영역 */}
                        <div className="p-5">
                          <div className="mb-4">
                            <h3 className="font-bold text-gray-900 text-lg mb-2 leading-tight">
                              {item.title}
                            </h3>
                            <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                              {item.description}
                            </p>
                          </div>

                          {/* 포인트 및 재고 정보 */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                                  <span className="text-white text-sm font-bold">P</span>
                                </div>
                                <div>
                                  <div className="text-xl font-bold text-gray-900">
                                    {item.points_required.toLocaleString()}
                                  </div>
                                  <div className="text-xs text-gray-500">포인트</div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-700">재고</div>
                              <div className="text-lg font-bold text-blue-600">{item.stock}개</div>
                            </div>
                          </div>

                          {/* 구매 버튼 */}
                          <button
                            onClick={() => handleRewardPurchase(item)}
                            disabled={!canAfford || !hasStock || purchasing}
                            className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 ${
                              canAfford && hasStock && !purchasing
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {purchasing ? (
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                구매 중...
                              </div>
                            ) : !hasStock ? (
                              "품절"
                            ) : !canAfford ? (
                              "포인트 부족"
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <ShoppingCart className="w-4 h-4" />
                                구매하기
                              </div>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* 하단 여백 추가 */}
              <div className="h-32"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
