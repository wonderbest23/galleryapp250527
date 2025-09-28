"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { FiHome, FiSearch, FiBell, FiHeart } from "react-icons/fi";
import Link from "next/link";
import Image from "next/image";
import { useDisclosure } from "@heroui/react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import TopNavigation from "../components/TopNavigation";

export default function ArtStorePage() {
  const supabase = createClient();
  const [products, setProducts] = useState([]);
  const [artists, setArtists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [selectedSort, setSelectedSort] = useState("최신순");
  const [bookmarks, setBookmarks] = useState(new Set());
  const [user, setUser] = useState(null);
  
  // 상단 네비게이션바 관련 상태
  const [exhibitions, setExhibitions] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 1. 인기 작가 데이터 가져오기
        const { data: artistsData, error: artistsError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('isArtist', true)
          .eq('isArtistApproval', true)
          .limit(6);

        if (artistsError) {
          console.error("Error fetching artists:", artistsError);
          setArtists([]);
        } else {
          // full_name을 name으로 매핑하여 기존 구조 유지
          const mappedArtists = (artistsData || []).map(artist => ({
            id: artist.id,
            name: artist.full_name || "Unknown Artist",
            avatar_url: artist.avatar_url
          }));
          setArtists(mappedArtists);
        }

        // 2. 상품 데이터 가져오기 (원래대로 모든 상품 가져오기)
        const { data: productsData, error: productsError } = await supabase
          .from('product')
          .select(`
            *,
            artist_id(*)
          `)
          .order('created_at', { ascending: false })
          .limit(20);

        if (productsError) {
          console.error("Error fetching products:", productsError);
          setProducts([]);
        } else {
          // 아티스트명 매핑만 추가
          const mappedProducts = (productsData || []).map(product => ({
            ...product,
            artist_id: {
              ...product.artist_id,
              name: product.artist_id?.full_name || product.artist_id?.name || "Unknown Artist"
            }
          }));
          setProducts(mappedProducts);
        }
      } catch (error) {
        console.error("Error:", error);
        setProducts([]);
        setArtists([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleBookmark = (productId) => {
    if (!user) return;
    
    setBookmarks(prev => {
      const newBookmarks = new Set(prev);
      if (newBookmarks.has(productId)) {
        newBookmarks.delete(productId);
      } else {
        newBookmarks.add(productId);
      }
      return newBookmarks;
    });
  };

  const categories = ["전체", "현대미술", "추상화", "명화/동양화", "사진/일러스트", "기타"];
  const sortOptions = ["최신순", "인기순", "가격낮은순", "가격높은순"];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16">
        {/* 상단 네비게이션 바 */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <Link href="/" className="cursor-pointer">
                <FiHome className="w-6 h-6 text-gray-700 hover:text-blue-500 transition-colors" />
              </Link>
              <div className="flex-1 mx-4">
                <div className="w-full h-8 bg-gray-200 rounded-full animate-pulse"></div>
              </div>
              <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="h-64 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* 상단 네비게이션 바 */}
      <TopNavigation 
        search={search}
        setSearch={setSearch}
        exhibitions={exhibitions}
        setExhibitions={setExhibitions}
        gallery={gallery}
        setGallery={setGallery}
        showSearchResults={showSearchResults}
        setShowSearchResults={setShowSearchResults}
      />

      {/* 페이지 제목 */}
      <div className="bg-white px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 text-center">아트샵</h1>
        <div className="w-full h-px bg-gray-200 mt-4"></div>
      </div>

      {/* 인기 작가 섹션 */}
      <div className="bg-white px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">인기 작가</h2>
          <Link href="/artstore/artists" className="text-sm text-blue-500 font-medium hover:text-blue-700 transition-colors">
            전체보기 &gt;
          </Link>
        </div>
        
        {artists.length > 0 ? (
          <div className="flex space-x-4 overflow-x-auto pb-2">
            {artists.map((artist) => (
              <div key={artist.id} className="flex-shrink-0 text-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-2">
                  {artist.avatar_url ? (
                    <Image
                      src={artist.avatar_url}
                      alt={artist.name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-gray-500 text-sm">👤</span>
                  )}
                </div>
                <p className="text-xs text-gray-700 font-medium">{artist.name}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">👤</span>
            </div>
            <p className="text-sm mb-2">등록된 작가가 없습니다</p>
            <p className="text-xs text-gray-400">승인된 작가가 등록되면 여기에 표시됩니다</p>
          </div>
        )}
      </div>

      {/* 검색 및 필터 섹션 */}
      <div className="bg-white px-4 py-4">
        {/* 검색바 */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="작품명, 작가명으로 검색"
            className="w-full px-4 py-3 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>

        {/* 필터 */}
        <div className="flex space-x-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <select
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {sortOptions.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 작품 그리드 */}
      <div className="px-4 py-4">
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="relative">
                  <div className="aspect-square bg-gray-200">
                    {product.image?.[0] ? (
                      <Image
                        src={product.image[0]}
                        alt={product.name}
                        width={200}
                        height={200}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        🎨
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => toggleBookmark(product.id)}
                    className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 transition-colors"
                  >
                    <FiHeart 
                      className={`w-4 h-4 ${
                        bookmarks.has(product.id) 
                          ? 'text-red-500 fill-current' 
                          : 'text-gray-400'
                      }`} 
                    />
                  </button>
                </div>
                
                <div className="p-3">
                  <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-xs text-gray-600 mb-1">{product.artist_id?.name || "Unknown Artist"}</p>
                  <p className="text-sm font-bold text-blue-600 mb-1">
                    {product.price?.toLocaleString()}원
                  </p>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{product.year}</span>
                    <span className="line-clamp-1">{product.medium}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎨</span>
            </div>
            <p className="text-sm mb-2">등록된 작품이 없습니다</p>
            <p className="text-xs text-gray-400">승인된 작가의 작품이 등록되면 여기에 표시됩니다</p>
          </div>
        )}
      </div>

    </div>
  );
}