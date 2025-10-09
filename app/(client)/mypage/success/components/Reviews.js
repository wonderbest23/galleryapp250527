"use client";
import React, { useState, useEffect } from "react";
import { Card, CardBody, Divider } from "@heroui/react";
import { FaRegCalendar } from "react-icons/fa";
import { IoMdPin } from "react-icons/io";
import { FaRegStar } from "react-icons/fa";
import { FaPlusCircle } from "react-icons/fa";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Spinner } from "@heroui/react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Star, Calendar, MapPin, Plus, MessageCircle } from "lucide-react";

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

export default function Reviews({ user }) {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [displayCount, setDisplayCount] = useState(5); // 한 번에 표시할 개수
  const supabase = createClient();
  // console.log("user22:", user);

  useEffect(() => {
    // 유저의 리뷰 데이터를 가져오는 함수
    const fetchUserReviews = async () => {
      try {
        setIsLoading(true);

        // supabase에서 exhibition_review 데이터 직접 가져오기
        const { data: reviewData, error: reviewError } = await supabase
          .from("exhibition_review")
          .select("*,exhibition_id(*)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (reviewError) {
          throw new Error("리뷰 데이터를 불러오는데 실패했습니다");
        }

        // null 값 제거 및 유효한 리뷰만 필터링
        const validReviews = (reviewData || []).filter(review => 
          review && review.exhibition_id && review.exhibition_id.contents
        );
        setReviews(validReviews);
      } catch (error) {
        console.error("리뷰 가져오기 오류:", error);
        // 오류 발생 시 빈 배열로 설정
        setReviews([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserReviews();
  }, [user.id]);

  // 더보기 버튼 클릭 시 실행되는 함수
  const loadMoreReviews = () => {
    if (displayCount + 5 >= reviews.length) {
      setDisplayCount(reviews.length);
      setHasMore(false);
    } else {
      setDisplayCount(displayCount + 5);
    }
  };

  // 로딩 중일 때 표시할 컴포넌트
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">리뷰를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-2">
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.slice(0, displayCount).map((review, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Link href={`/exhibition/${review.exhibition_id.id}`}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                  
                  {/* 이미지 영역 */}
                  <div className="relative h-32 bg-gradient-to-br from-blue-50 to-indigo-50">
                    <img
                      src={(() => {
                        if (!review.exhibition_id.photo || review.exhibition_id.photo.startsWith('data:')) {
                          return "/noimage.jpg";
                        }
                        
                        // 전시회 이미지 URL에서 썸네일 경로로 변환
                        return review.exhibition_id.photo.includes('/thumbnails/')
                          ? review.exhibition_id.photo
                          : review.exhibition_id.photo.replace('/exhibition/exhibition/', '/exhibition/thumbnails/');
                      })()}
                      alt={review.exhibition_id.contents || "전시회 이미지"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "/noimage.jpg";
                      }}
                    />
                    
                    {/* 평점 배지 */}
                    <div className="absolute top-3 right-3">
                      <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-semibold text-gray-700">{review.rating}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 정보 영역 */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2">
                      {review.exhibition_id.contents}
                    </h3>
                    
                    {/* 평점 표시 */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating 
                                ? 'text-yellow-500 fill-current' 
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">({review.rating}/5)</span>
                    </div>
                    
                    {/* 리뷰 내용 */}
                    <div className="mb-4">
                      <div className="flex items-start gap-2">
                        <MessageCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                          {review.description}
                        </p>
                      </div>
                    </div>
                    
                    {/* 증빙 사진 */}
                    {review.proof_image && (
                      <div className="mt-4">
                        <div className="relative w-full h-40 bg-gray-100 rounded-xl overflow-hidden">
                          <img
                            src={review.proof_image}
                            alt="리뷰 증빙 사진"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* 작성 날짜 */}
                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {new Date(review.created_at).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">작성한 리뷰가 없습니다</h3>
          <p className="text-gray-500">전시회를 관람하고 리뷰를 작성해보세요</p>
        </div>
      )}
      
      {/* 더보기 버튼 */}
      {reviews.length > 0 && (
        <div className="flex justify-center mt-6">
          {hasMore && displayCount < reviews.length ? (
            <button
              onClick={loadMoreReviews}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              더 보기 ({reviews.length - displayCount}개)
            </button>
          ) : displayCount > 0 && !hasMore && reviews.length > 5 ? (
            <p className="text-center py-4 text-gray-500">모든 리뷰를 확인했습니다</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
