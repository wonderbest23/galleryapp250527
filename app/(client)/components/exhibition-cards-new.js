"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { FaStar } from "react-icons/fa";

export function ExhibitionCards({ exhibitionCategory, user }) {
  const [exhibitions, setExhibitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchExhibitions = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from("exhibition")
          .select("*")
          .gte("end_date", new Date().toISOString())
          .order("created_at", { ascending: false })
          .limit(3);

        if (exhibitionCategory === "free") {
          query = query.eq("price", 0);
        } else if (exhibitionCategory === "recommended") {
          query = query.gte("rating", 4.0);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error fetching exhibitions:", error);
        } else {
          setExhibitions(data || []);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExhibitions();
  }, [exhibitionCategory]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\./g, '-').replace(/\s/g, '');
  };

  const getStatusTag = (exhibition) => {
    const now = new Date();
    const startDate = new Date(exhibition.start_date);
    const endDate = new Date(exhibition.end_date);
    
    if (startDate > now) {
      return { text: "예정", color: "bg-blue-100 text-blue-800" };
    } else if (endDate > now) {
      return { text: "진행중", color: "bg-green-100 text-green-800" };
    } else {
      return { text: "종료", color: "bg-gray-100 text-gray-800" };
    }
  };

  if (loading) {
    return (
      <div className="w-full px-4">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4">
      <div className="space-y-3">
        {exhibitions.map((exhibition) => {
          const status = getStatusTag(exhibition);
          return (
            <Link
              key={exhibition.id}
              href={`/exhibition/${exhibition.id}`}
              className="block bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center space-x-3">
                {/* 전시회 이미지 */}
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {exhibition.photo ? (
                    <Image
                      src={exhibition.photo}
                      alt={exhibition.title || exhibition.contents}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400 text-xs">이미지 없음</span>
                    </div>
                  )}
                </div>

                {/* 전시회 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-gray-500 mb-1">갤러리</p>
                      <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-1">
                        {exhibition.title || exhibition.contents}
                      </h3>
                      <p className="text-xs text-gray-600 mb-1">
                        {formatDate(exhibition.start_date)} - {formatDate(exhibition.end_date)}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {exhibition.price === 0 ? "무료" : `${exhibition.price?.toLocaleString()}원`}
                        </p>
                        <div className="flex items-center space-x-1">
                          <FaStar className="w-3 h-3 text-yellow-400" />
                          <span className="text-xs text-gray-600">
                            {exhibition.rating || 0} ({exhibition.review_count || 0})
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* 상태 태그 */}
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${status.color} ml-2`}>
                      {status.text}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
