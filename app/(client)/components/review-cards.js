"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

export function ReviewCards() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        // 실제 리뷰 데이터를 가져오는 쿼리
        const { data, error } = await supabase
          .from("exhibition_review")
          .select(`
            *,
            exhibition:exhibition_id (
              title,
              contents,
              photo
            )
          `)
          .order("created_at", { ascending: false })
          .limit(3);

        if (error) {
          console.error("Error fetching reviews:", error);
          // 에러 시 샘플 데이터 사용
          setReviews([
            {
              id: 1,
              title: "정말 인상깊은 전시였어요",
              content: "미완성이라는 주제로 새로운 시각을 제시한 전시였습니다. 특히 작가들의 창작 과정을 볼 수 있어서 좋았어요.",
              rating: 5,
              author_name: "김미술",
              exhibition: {
                title: "Unfinished @ Studio Urban"
              },
              view_count: 12
            },
            {
              id: 2,
              title: "창의적인 작품들",
              content: "프로토타입이라는 개념을 아트로 풀어낸 것이 신선했습니다. 젊은 작가들의 실험정신이 돋보였어요.",
              rating: 4,
              author_name: "박예술",
              exhibition: {
                title: "육술실: 프로토타입(PROTOTYPE)"
              },
              view_count: 8
            },
            {
              id: 3,
              title: "역사와 현대의 만남",
              content: "과거와 현재를 연결하는 훌륭한 기획이었습니다. 많은 것을 배울 수 있었어요.",
              rating: 5,
              author_name: "이문화",
              exhibition: {
                title: "The Hidden Chapter"
              },
              view_count: 15
            }
          ]);
        } else {
          setReviews(data || []);
        }
      } catch (error) {
        console.error("Error:", error);
        // 에러 시 샘플 데이터 사용
        setReviews([
          {
            id: 1,
            title: "정말 인상깊은 전시였어요",
            content: "미완성이라는 주제로 새로운 시각을 제시한 전시였습니다. 특히 작가들의 창작 과정을 볼 수 있어서 좋았어요.",
            rating: 5,
            author_name: "김미술",
            exhibition: {
              title: "Unfinished @ Studio Urban"
            },
            view_count: 12
          },
          {
            id: 2,
            title: "창의적인 작품들",
            content: "프로토타입이라는 개념을 아트로 풀어낸 것이 신선했습니다. 젊은 작가들의 실험정신이 돋보였어요.",
            rating: 4,
            author_name: "박예술",
            exhibition: {
              title: "육술실: 프로토타입(PROTOTYPE)"
            },
            view_count: 8
          },
          {
            id: 3,
            title: "역사와 현대의 만남",
            content: "과거와 현재를 연결하는 훌륭한 기획이었습니다. 많은 것을 배울 수 있었어요.",
            rating: 5,
            author_name: "이문화",
            exhibition: {
              title: "The Hidden Chapter"
            },
            view_count: 15
          }
        ]);
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
      {reviews.map((review) => (
        <div key={review.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
          <div className="flex items-center mb-2">
            <div className="flex items-center space-x-1 mr-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <span 
                  key={star} 
                  className={`text-sm ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-xs text-gray-500">전시회 리뷰</span>
          </div>
          <h3 className="text-sm font-bold text-gray-900 mb-1">{review.title}</h3>
          <p className="text-xs text-gray-600 mb-2">{review.exhibition?.title || review.exhibition?.contents}</p>
          <p className="text-xs text-gray-700 mb-3 leading-relaxed">{review.content}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{review.author_name}</span>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <span>👁</span>
              <span>리뷰</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
