"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardBody, Divider, Skeleton, Spinner, Avatar, Progress } from "@heroui/react";
import { FaRegStar, FaStar } from "react-icons/fa";
import { FaPlusCircle } from "react-icons/fa";
import { createClient } from "@/utils/supabase/client";
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

export default function ExhibitionReviews({ exhibitionId }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleReviews, setVisibleReviews] = useState(3); // 초기에 3개만 표시
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [ratingStats, setRatingStats] = useState({
    average: 0,
    distribution: {
      5: 0,
      4: 0,
      3: 0,
      2: 0, 
      1: 0
    }
  });

  const supabase = createClient();

  // 리뷰 데이터 가져오기
  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      
      // exhibition_id로 리뷰 필터링하여 가져오기
      const { data, error, count } = await supabase
        .from("exhibition_review")
        .select("*", { count: 'exact' })
        .eq("exhibition_id", exhibitionId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("리뷰를 가져오는 중 오류 발생:", error);
        return;
      }
      
      setReviews(data || []);
      setTotalCount(count || 0);
      setHasMore(count > visibleReviews);

      // 평점 통계 계산
      if (data && data.length > 0) {
        const total = data.reduce((sum, review) => sum + (review.rating || 0), 0);
        const avg = total / data.length;
        
        // 각 별점별 개수 집계
        const distribution = {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0
        };
        
        data.forEach(review => {
          if (review.rating && distribution[review.rating] !== undefined) {
            distribution[review.rating]++;
          }
        });
        
        setRatingStats({
          average: avg,
          distribution
        });
      }
    } catch (error) {
      console.error("리뷰 데이터 처리 중 오류:", error);
    } finally {
      setLoading(false);
    }
  }, [exhibitionId, supabase, visibleReviews]);

  useEffect(() => {
    if (exhibitionId) {
      fetchReviews();
    }
  }, [exhibitionId, fetchReviews]);

  // 더보기 버튼 클릭 시 실행
  const loadMore = () => {
    // 3개씩 더 표시
    const newVisibleCount = visibleReviews + 3;
    setVisibleReviews(newVisibleCount);
    setHasMore(totalCount > newVisibleCount);
  };

  // 별점 표시 컴포넌트
  const RatingStars = ({ rating }) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        i <= rating ? (
          <FaStar key={i} className="text-yellow-500" />
        ) : (
          <FaRegStar key={i} className="text-gray-300" />
        )
      );
    }
    return <div className="flex">{stars}</div>;
  };

  // 리뷰 날짜 포맷팅 함수
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full justify-center">
      {/* 리뷰 평점 요약 */}
      <Card className="w-full mb-6">
        <CardBody>
          <div className="flex flex-col items-center gap-4">
            <h3 className="text-lg font-bold mb-2">방문자 리뷰</h3>
            <div className="flex items-center justify-center mb-2">
              <div className="flex text-yellow-400 items-center">
                {[...Array(5)].map((_, i) => (
                  <FaStar
                    key={i}
                    className={`w-6 h-6 ${i < Math.floor(ratingStats.average) ? "text-yellow-500" : "text-gray-300"}`}
                  />
                ))}
              </div>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">{ratingStats.average.toFixed(1)}</p>
              <p className="text-sm text-gray-500">{totalCount}개의 리뷰</p>
            </div>

            {/* 별점 분포 그래프 */}
            {totalCount > 0 && (
              <div className="w-full mt-4 space-y-2">
                {[5, 4, 3, 2, 1].map(star => (
                  <div key={star} className="flex items-center gap-2">
                    <div className="w-12 text-sm text-right">{star}점</div>
                    <Progress
                      value={(ratingStats.distribution[star] / totalCount) * 100}
                      color="warning"
                      className="flex-1 h-3"
                    />
                    <div className="w-12 text-sm text-left">{ratingStats.distribution[star]}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      <div className="w-full flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">리뷰 목록</h2>
      </div>

      {loading ? (
        // 로딩 중 스켈레톤 UI 표시
        Array(3).fill().map((_, index) => (
          <div key={index} className="w-full flex flex-col gap-3 border-b pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Skeleton className="flex rounded-full w-10 h-10" />
              <div>
                <Skeleton className="h-3 w-24 rounded-lg" />
                <Skeleton className="h-2 w-16 rounded-lg mt-1" />
              </div>
            </div>
            <Skeleton className="h-3 w-32 rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        ))
      ) : reviews.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          아직 리뷰가 없습니다. 첫 번째 리뷰를 작성해보세요!
        </div>
      ) : (
        // 실제 리뷰 목록 표시
        <div className="w-full">
          {reviews.slice(0, visibleReviews).map((review, index) => (
            <Card key={index} className="w-full mb-4 border-none shadow-none">
              <CardBody className="p-0">
                <div className="flex items-start gap-3">
                  <Avatar 
                    name={review.name?.email?.charAt(0) || "U"} 
                    size="sm" 
                    className="bg-primary text-white"
                  />
                  <div className="flex-1">
                    <div className="flex flex-col">
                      <div className="text-sm font-bold">
                        {maskName(review.name?.email?.split('@')[0] || review.name || "익명 사용자")}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(review.created_at)}
                      </div>
                    </div>
                    
                    <div className="my-2">
                      <RatingStars rating={review.rating || 0} />
                    </div>
                    
                    {review.category && review.category.length > 0 && (
                      <div className="flex flex-wrap gap-1 my-2">
                        {review.category.map((feeling, idx) => (
                          <span key={idx} className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                            {feeling}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-sm mt-2">{review.description}</p>
                    
                    {/* 증빙 사진 */}
                    {review.proof_image && (
                      <div className="mt-3 relative w-full h-40 bg-gray-100 rounded-lg overflow-hidden">
                        <Image
                          src={review.proof_image}
                          alt="리뷰 증빙 사진"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardBody>
              {index < Math.min(visibleReviews, reviews.length) - 1 && (
                <Divider className="my-4" />
              )}
            </Card>
          ))}
          
          {hasMore && (
            <div className="flex justify-center mt-4 mb-8">
              <button
                className="flex items-center gap-2 text-primary font-medium"
                onClick={loadMore}
              >
                <FaPlusCircle /> 리뷰 더보기
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 