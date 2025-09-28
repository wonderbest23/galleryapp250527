"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";

export function MagazineCards() {
  const [magazines, setMagazines] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchMagazines = async () => {
      setLoading(true);
      try {
        // 실제 매거진 데이터를 가져오는 쿼리
        const { data, error } = await supabase
          .from("magazine")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(3);

        if (error) {
          console.error("Error fetching magazines:", error);
          // 에러 시 샘플 데이터 사용
          setMagazines([
            {
              id: 1,
              title: "국립현대미술관 신작 전시 리뷰",
              category: "전시리뷰",
              subtitle: "이리뷰",
              photo: null,
              created_at: new Date().toISOString(),
              is_featured: true
            },
            {
              id: 2,
              title: "모던 아트의 새로운 트렌드",
              category: "트렌드",
              subtitle: "박평론",
              photo: null,
              created_at: new Date().toISOString(),
              is_featured: false
            },
            {
              id: 3,
              title: "2025년 주목할 신진 작가들",
              category: "작가인터뷰",
              subtitle: "김미술",
              photo: null,
              created_at: new Date().toISOString(),
              is_featured: false
            }
          ]);
        } else {
          // 실제 데이터를 매핑하여 표시
          const mappedData = (data || []).map((magazine, index) => ({
            id: magazine.id,
            title: magazine.title || "제목 없음",
            category: magazine.category || "전시리뷰", // 기본 카테고리를 전시리뷰로 설정
            subtitle: magazine.subtitle || "작성자 없음",
            photo: magazine.photo,
            created_at: magazine.created_at,
            is_featured: index === 0 // 첫 번째 매거진을 대표로 설정
          }));
          setMagazines(mappedData);
        }
      } catch (error) {
        console.error("Error:", error);
        // 에러 시 샘플 데이터 사용
        setMagazines([
          {
            id: 1,
            title: "국립현대미술관 신작 전시 리뷰",
            category: "전시리뷰",
            subtitle: "이리뷰",
            photo: null,
            created_at: new Date().toISOString(),
            is_featured: true
          },
          {
            id: 2,
            title: "모던 아트의 새로운 트렌드",
            category: "트렌드",
            subtitle: "박평론",
            photo: null,
            created_at: new Date().toISOString(),
            is_featured: false
          },
          {
            id: 3,
            title: "2025년 주목할 신진 작가들",
            category: "작가인터뷰",
            subtitle: "김미술",
            photo: null,
            created_at: new Date().toISOString(),
            is_featured: false
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchMagazines();
  }, []);

  const getCategoryColor = (category) => {
    switch (category) {
      case "전시리뷰":
        return "bg-purple-100 text-purple-800";
      case "트렌드":
        return "bg-orange-100 text-orange-800";
      case "작가인터뷰":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getGradientClass = (index) => {
    const gradients = [
      "bg-gradient-to-r from-purple-600 to-blue-600",
      "bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500",
      "bg-gradient-to-br from-gray-800 to-black"
    ];
    return gradients[index % gradients.length];
  };

  if (loading) {
    return (
      <div className="w-[90%] space-y-3">
        <div className="bg-white rounded-lg h-48 animate-pulse"></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-lg h-32 animate-pulse"></div>
          <div className="bg-white rounded-lg h-32 animate-pulse"></div>
        </div>
      </div>
    );
  }

  const featuredMagazine = magazines.find(mag => mag.is_featured) || magazines[0];
  const otherMagazines = magazines.filter(mag => !mag.is_featured).slice(0, 2);

  return (
    <div className="w-[90%] space-y-3">
      {/* 큰 카드 (상단) */}
      {featuredMagazine && (
        <Link href={`/magazine/${featuredMagazine.id}`} className="block">
          <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100">
            <div className="relative h-48">
              {featuredMagazine.photo?.[0]?.url ? (
                <img 
                  src={featuredMagazine.photo[0].url} 
                  alt={featuredMagazine.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={`w-full h-full ${getGradientClass(0)}`}></div>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-40"></div>
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-white text-lg font-bold mb-2">
                  {featuredMagazine.title}
                </h3>
                <div className="flex items-center text-white text-sm mb-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getCategoryColor(featuredMagazine.category)}`}>
                    {featuredMagazine.category}
                  </span>
                </div>
                <div className="flex items-center text-white text-sm">
                  <span>{featuredMagazine.subtitle}</span>
                  <span className="mx-2">•</span>
                  <span>🕒 {Math.floor(Math.random() * 10) + 1}분</span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* 작은 카드들 (하단) */}
      <div className="grid grid-cols-2 gap-3">
        {otherMagazines.map((magazine, index) => (
          <Link key={magazine.id} href={`/magazine/${magazine.id}`} className="block">
            <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100">
              <div className="h-32">
                {magazine.photo?.[0]?.url ? (
                  <img 
                    src={magazine.photo[0].url} 
                    alt={magazine.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full ${getGradientClass(index + 1)}`}></div>
                )}
              </div>
              <div className="p-3">
                <h3 className="text-sm font-bold text-gray-900 mb-2">
                  {magazine.title}
                </h3>
                <div className="mb-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getCategoryColor(magazine.category)}`}>
                    {magazine.category}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{magazine.subtitle}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
