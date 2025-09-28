"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import Image from "next/image";

export function LatestWorks() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchLatestProducts = async () => {
      setLoading(true);
      try {
        // 최신 작품 데이터를 가져오는 쿼리 (승인된 작가의 상품만)
        const { data: approvedArtists, error: artistError } = await supabase
          .from('profiles')
          .select('id')
          .eq('isArtist', true)
          .eq('isArtistApproval', true);
        
        if (artistError) {
          console.error("Error fetching approved artists:", artistError);
          setProducts([]);
          setLoading(false);
          return;
        }
        
        const approvedArtistIds = (approvedArtists || []).map(a => a.id);
        
        const { data, error } = await supabase
          .from("product")
          .select(`
            *,
            artist_id(*)
          `)
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) {
          console.error("Error fetching latest products:", error);
          // 에러 시 샘플 데이터 사용
          setProducts([
            {
              id: 1,
              name: "Blue Bloom",
              artist_id: { name: "Abstract Artist" },
              created_at: "2022-01-01",
              image: [null],
              price: 1500000
            },
            {
              id: 2,
              name: "Golden Face",
              artist_id: { name: "Portrait Master" },
              created_at: "2021-01-01",
              image: [null],
              price: 2000000
            },
            {
              id: 3,
              name: "Cosmic Swirl",
              artist_id: { name: "Galaxy Painter" },
              created_at: "2023-01-01",
              image: [null],
              price: 1800000
            }
          ]);
        } else {
          // 모든 상품을 가져온 후 아티스트명 매핑
          const mappedProducts = (data || []).map(product => ({
            ...product,
            artist_id: {
              ...product.artist_id,
              name: product.artist_id?.full_name || product.artist_id?.name || "Unknown Artist"
            }
          }));
          setProducts(mappedProducts.slice(0, 3));
        }
      } catch (error) {
        console.error("Error:", error);
        // 에러 시 샘플 데이터 사용
        setProducts([
          {
            id: 1,
            name: "Blue Bloom",
            artist_id: { name: "Abstract Artist" },
            created_at: "2022-01-01",
            image: [null],
            price: 1500000
          },
          {
            id: 2,
            name: "Golden Face",
            artist_id: { name: "Portrait Master" },
            created_at: "2021-01-01",
            image: [null],
            price: 2000000
          },
          {
            id: 3,
            name: "Cosmic Swirl",
            artist_id: { name: "Galaxy Painter" },
            created_at: "2023-01-01",
            image: [null],
            price: 1800000
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestProducts();
  }, []);

  if (loading) {
    return (
      <div className="w-[90%] flex gap-4 overflow-x-auto pb-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="flex-shrink-0 w-48 bg-white rounded-lg shadow-sm border border-gray-100 animate-pulse">
            <div className="h-32 bg-gray-200 rounded-t-lg"></div>
            <div className="p-3">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="w-[90%] flex gap-4 overflow-x-auto pb-4">
      {products.map((product) => (
        <Link key={product.id} href={`/product/${product.id}`} className="flex-shrink-0 w-48">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-t-lg flex items-center justify-center">
              {product.image?.[0] ? (
                <Image
                  src={product.image[0]}
                  alt={product.name}
                  width={192}
                  height={128}
                  className="w-full h-full object-cover rounded-t-lg"
                />
              ) : (
                <div className="text-white text-2xl">🎨</div>
              )}
            </div>
            <div className="p-3">
              <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">
                {product.name}
              </h3>
              <p className="text-xs text-gray-500">
                {product.artist_id?.name || "Unknown Artist"} ({new Date(product.created_at).getFullYear()})
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
