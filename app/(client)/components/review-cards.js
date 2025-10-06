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

// 리뷰 내용에서 메타데이터 제거 함수
const cleanReviewContent = (content) => {
  if (!content || typeof content !== 'string') return "리뷰 내용";
  
  console.log("원본 리뷰 내용:", content);
  
  // 메타데이터 패턴들을 제거 (더 포괄적인 패턴 추가)
  const patterns = [
    // [커스텀리뷰] 패턴들
    /\[커스텀\s*리뷰\]\s*전시회:\s*[^,]*,\s*갤러리:\s*[^,]*,\s*방문일:\s*[^,]*,\s*/gi,
    /\[커스텀\s*전시회\]\s*제목:\s*[^,]*,\s*장소:\s*[^,]*,\s*방문일:\s*[^,]*,\s*/gi,
    /\[Custom\s*Review\]\s*전시회:\s*[^,]*,\s*갤러리:\s*[^,]*,\s*방문일:\s*[^,]*,\s*/gi,
    
    // 단순한 메타데이터 패턴들
    /전시회:\s*[^,]*,\s*갤러리:\s*[^,]*,\s*방문일:\s*[^,]*,\s*/gi,
    /제목:\s*[^,]*,\s*장소:\s*[^,]*,\s*방문일:\s*[^,]*,\s*/gi,
    /방문일:\s*[^,]*,\s*/gi,
    
    // 개별 필드들
    /전시회:\s*[^,]*,\s*/gi,
    /갤러리:\s*[^,]*,\s*/gi,
    /장소:\s*[^,]*,\s*/gi,
    /제목:\s*[^,]*,\s*/gi,
    
    // 태그들
    /^\[커스텀\s*리뷰\]\s*/gi,
    /^\[커스텀\s*전시회\]\s*/gi,
    /^\[Custom\s*Review\]\s*/gi,
    /^\[커스텀\s*리뷰\]/gi,
    /^\[커스텀\s*전시회\]/gi,
    /^\[Custom\s*Review\]/gi,
    
    // 날짜 패턴들
    /방문일:\s*\d{4}-\d{2}-\d{2}\s*/gi,
    /방문일:\s*\d{4}\.\d{2}\.\d{2}\s*/gi,
    /방문일:\s*\d{4}년\s*\d{2}월\s*\d{2}일\s*/gi,
    
    // 콜론으로 시작하는 패턴들
    /^전시회:\s*/gi,
    /^갤러리:\s*/gi,
    /^장소:\s*/gi,
    /^제목:\s*/gi,
    /^방문일:\s*/gi,
    
    // 쉼표와 콜론 조합 패턴들
    /,\s*전시회:\s*[^,]*/gi,
    /,\s*갤러리:\s*[^,]*/gi,
    /,\s*장소:\s*[^,]*/gi,
    /,\s*제목:\s*[^,]*/gi,
    /,\s*방문일:\s*[^,]*/gi,
    
    // 추가적인 메타데이터 패턴들
    /^전시회:\s*[^,]*,\s*갤러리:\s*[^,]*,\s*방문일:\s*[^,]*,\s*/gi,
    /^제목:\s*[^,]*,\s*장소:\s*[^,]*,\s*방문일:\s*[^,]*,\s*/gi
  ];
  
  let cleanedContent = content;
  
  // 각 패턴을 순차적으로 제거
  patterns.forEach(pattern => {
    cleanedContent = cleanedContent.replace(pattern, '');
  });
  
  // 연속된 쉼표나 공백 정리
  cleanedContent = cleanedContent.replace(/,\s*,/g, ',');
  cleanedContent = cleanedContent.replace(/\s+/g, ' ');
  
  // 앞뒤 공백 및 쉼표 제거
  cleanedContent = cleanedContent.trim();
  cleanedContent = cleanedContent.replace(/^[,.\s]+|[,.\s]+$/g, '');
  
  // 추가 정리: 콜론으로 시작하는 부분들 제거
  const lines = cleanedContent.split('\n');
  const filteredLines = lines.filter(line => {
    const trimmedLine = line.trim();
    return !trimmedLine.match(/^(전시회|갤러리|장소|제목|방문일):/);
  });
  cleanedContent = filteredLines.join('\n').trim();
  
  // 마지막으로 남은 메타데이터 패턴들 제거
  const finalPatterns = [
    /^전시회:\s*[^,]*,\s*갤러리:\s*[^,]*,\s*방문일:\s*[^,]*,\s*/gi,
    /^제목:\s*[^,]*,\s*장소:\s*[^,]*,\s*방문일:\s*[^,]*,\s*/gi,
    /^전시회:\s*[^,]*,\s*/gi,
    /^갤러리:\s*[^,]*,\s*/gi,
    /^장소:\s*[^,]*,\s*/gi,
    /^제목:\s*[^,]*,\s*/gi,
    /^방문일:\s*[^,]*,\s*/gi
  ];
  
  finalPatterns.forEach(pattern => {
    cleanedContent = cleanedContent.replace(pattern, '');
  });
  
  // 최종 정리
  cleanedContent = cleanedContent.trim();
  cleanedContent = cleanedContent.replace(/^[,.\s]+|[,.\s]+$/g, '');
  
  // 빈 문자열이면 기본 메시지 반환
  console.log("정리된 리뷰 내용:", cleanedContent);
  return cleanedContent || "리뷰 내용";
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
              photo,
              status
            )
          `)
          .eq("status", "approved") // 승인된 리뷰만
          .order("created_at", { ascending: false })
          .limit(3);

        if (error) {
          console.error("리뷰 데이터 가져오기 오류:", error);
          // 에러 시 빈 배열로 설정하여 "리뷰가 없습니다" 메시지 표시
          setReviews([]);
        } else {
          console.log("리뷰 데이터 가져오기 성공:", data?.length || 0, "개");
          console.log("리뷰 데이터:", data);
          
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
    <div className="w-[90%] space-y-4">
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
        <div key={review.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex gap-4">
            {/* 왼쪽: 텍스트 내용 */}
            <div className="flex-1">
              {/* 전시회 제목 */}
              <div className="mb-3">
                <h3 className="text-base font-semibold text-gray-900 line-clamp-1">
                  {review.exhibition?.contents || "전시회 리뷰"}
                </h3>
                {review.is_custom_review && (
                  <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-600 rounded-full mt-1">
                    커스텀 리뷰
                  </span>
                )}
              </div>
              
              {/* 별점 + 작성자 */}
              <div className="flex items-center gap-2 mb-3">
                {/* 별점 */}
                <div className="flex items-center space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span 
                      key={star} 
                      className={`text-sm ${star <= (review.rating || 5) ? 'text-yellow-400' : 'text-gray-300'}`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                {/* 작성자 */}
                <span className="text-sm font-medium text-gray-700">
                  {maskName(review.name || "사용자")}
                </span>
              </div>
              
              {/* 리뷰 내용 */}
              <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
                {cleanReviewContent(review.description || review.content)}
              </p>
            </div>
            
            {/* 오른쪽: 증빙 사진 또는 전시회 이미지 (우측 중앙 정렬) */}
            <div className="flex flex-col items-center justify-center">
              <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden mb-2">
                {review.proof_image ? (
                  <Image
                    src={review.proof_image}
                    alt="리뷰 증빙 사진"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : review.exhibition?.photo ? (
                  <Image
                    src={review.exhibition.photo}
                    alt={review.exhibition.contents || "전시회 이미지"}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    <span className="text-lg text-gray-500">📸</span>
                  </div>
                )}
              </div>
              {/* 날짜 (이미지 바로 아래) */}
              <span className="text-xs text-gray-500">
                {new Date(review.created_at).toLocaleDateString('ko-KR')}
              </span>
            </div>
          </div>
        </div>
        ))
      )}
    </div>
  );
}
