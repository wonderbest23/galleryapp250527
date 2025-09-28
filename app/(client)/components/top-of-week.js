"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import Image from "next/image";

export function TopOfWeek() {
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchTopProducts = async () => {
      setLoading(true);
      try {
        // 모든 작품을 가져와서 최신 3개를 Top of Week로 표시
        const { data, error } = await supabase
          .from("product")
          .select(`
            *,
            artist_id(*)
          `)
          .order("created_at", { ascending: false })
          .limit(3);

        console.log("Top of Week products data:", data);
        console.log("Top of Week products error:", error);

        if (error) {
          console.error("Error fetching top products:", error);
          setTopProducts([]);
        } else {
          // 아티스트명 매핑
          const mappedProducts = (data || []).map(product => ({
            ...product,
            artist_id: {
              ...product.artist_id,
              name: product.artist_id?.full_name || product.artist_id?.name || "Unknown Artist"
            }
          }));
          setTopProducts(mappedProducts);
        }
      } catch (error) {
        console.error("Error:", error);
        setTopProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTopProducts();
  }, []);

  if (loading) {
    return (
      <div className="w-[90%] space-y-3">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm border border-gray-100 animate-pulse">
            <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center"></div>
            <div className="w-12 h-12 bg-gray-200 rounded"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-[90%] space-y-3">
      {topProducts.map((product, index) => (
        <Link key={product.id} href={`/product/${product.id}`} className="block">
          <div className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            {/* 순위 번호 */}
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-lg font-bold text-gray-600">{index + 1}</span>
            </div>
            
            {/* 작품 이미지 */}
            <div className="w-12 h-12 rounded overflow-hidden bg-gray-100 flex-shrink-0">
              {product.image?.[0] ? (
                <Image
                  src={product.image[0]}
                  alt={product.name}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-lg">
                  🎨
                </div>
              )}
            </div>
            
            {/* 작품 정보 */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">
                {product.name}
              </h3>
              <p className="text-xs text-gray-500">
                {product.artist_id?.name || "Unknown Artist"}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
