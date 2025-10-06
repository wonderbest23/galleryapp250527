"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import Image from "next/image";

// 이름 마스킹 함수
const maskName = (name) => {
  if (!name || typeof name !== 'string') return "익명";
  
  // 이메일인 경우
  if (name.includes('@')) {
    const emailPart = name.split('@')[0];
    return emailPart.length > 1 ? emailPart[0] + '**' : emailPart;
  }
  
  // 일반 이름인 경우
  return name.length > 1 ? name[0] + '**' : name;
};

export function ReviewCards() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        // 실제 리뷰 데이터를 가져오는 쿼리 (승인된 리뷰만)
        const { data, error } = await supabase
          .from("exhibition_review")
          .select(`
            *,
            exhibition:exhibition_id (
              id,
              contents,
              location,
              photo,
              status
            )
          `)
          .order("created_at", { ascending: false })
          .limit(3);

        if (error) {
          console.error("리뷰 데이터 가져오기 오류:", error);
          // 에러 시 빈 배열로 설정하여 "리뷰가 없습니다" 메시지 표시
          setReviews([]);
        } else {
          console.log("리뷰 데이터 가져오기 성공:", data?.length || 0, "개");
          
          // 실제 데이터가 있으면 사용, 없으면 빈 배열
          setReviews(data || []);
        }
      } catch (error) {
        console.error("리뷰 데이터 가져오기 예외:", error);
        // 예외 발생 시 빈 배열로 설정
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  if (loading) {
    return (
      <div className="w-[90%] space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-[90%] space-y-3">
      {reviews.length === 0 ? (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 text-center">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">아직 리뷰가 없습니다</h3>
          <p className="text-sm text-gray-500">첫 번째 리뷰를 작성해보세요!</p>
        </div>
      ) : (
        reviews.map((review) => (
        <div key={review.id} className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
          <div className="flex gap-3">
            {/* 왼쪽: 텍스트 내용 */}
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span 
                      key={star} 
                      className={`text-xs ${star <= (review.rating || 5) ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">{review.title || "리뷰 제목"}</h3>
                {review.is_custom_review && (
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full">
                    커스텀
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600 mb-1 line-clamp-1">{maskName(review.author_name || review.name || "사용자")}</p>
              <p className="text-xs text-gray-700 line-clamp-2">{review.description || review.content || "리뷰 내용"}</p>
            </div>
            
            {/* 오른쪽: 증빙 사진 또는 전시회 이미지 (우측 중앙 정렬) */}
            <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-md overflow-hidden self-center">
              {review.proof_image ? (
                <Image
                  src={review.proof_image}
                  alt="리뷰 증빙 사진"
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              ) : review.exhibition?.photo ? (
                <Image
                  src={review.exhibition.photo}
                  alt={review.exhibition.contents || "전시회 이미지"}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                  <span className="text-xs text-gray-500">📸</span>
                </div>
              )}
            </div>
          </div>
        </div>
        ))
      )}
    </div>
  );
}
