"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Heart, Search, ChevronRight, ChevronLeft } from 'lucide-react';
import Link from "next/link";
import Image from "next/image";

export default function ArtStorePage() {
  const supabase = createClient();
  const [products, setProducts] = useState([]);
  const [artists, setArtists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSort, setSelectedSort] = useState("recent");
  const [bookmarks, setBookmarks] = useState(new Set());
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // 한 페이지에 보여줄 작품 수

  // 카테고리 목록 (Artsy 참고하여 대폭 확장)
  const categories = [
    { value: 'all', label: '전체' },
    { value: 'painting', label: '회화' },
    { value: 'sculpture', label: '조각' },
    { value: 'photography', label: '사진' },
    { value: 'digital', label: '디지털아트' },
    { value: 'print', label: '판화' },
    { value: 'drawing', label: '드로잉' },
    { value: 'mixed-media', label: '믹스드미디어' },
    { value: 'installation', label: '설치미술' },
    { value: 'video', label: '비디오아트' },
    { value: 'performance', label: '퍼포먼스' },
    { value: 'ceramics', label: '도자기' },
    { value: 'textile', label: '섬유예술' },
    { value: 'glass', label: '유리공예' },
    { value: 'jewelry', label: '주얼리' },
    { value: 'furniture', label: '가구디자인' },
    { value: 'lighting', label: '조명디자인' },
    { value: 'poster', label: '포스터' },
    { value: 'illustration', label: '일러스트레이션' },
    { value: 'collage', label: '콜라주' },
    { value: 'watercolor', label: '수채화' },
    { value: 'oil', label: '유화' },
    { value: 'acrylic', label: '아크릴화' },
    { value: 'pastel', label: '파스텔화' },
    { value: 'ink', label: '수묵화' },
    { value: 'charcoal', label: '목탄화' },
    { value: 'pencil', label: '연필화' },
    { value: 'bronze', label: '청동조각' },
    { value: 'marble', label: '대리석조각' },
    { value: 'wood', label: '목조각' },
    { value: 'metal', label: '금속조각' },
    { value: 'abstract', label: '추상미술' },
    { value: 'figurative', label: '구상미술' },
    { value: 'landscape', label: '풍경화' },
    { value: 'portrait', label: '초상화' },
    { value: 'still-life', label: '정물화' },
    { value: 'conceptual', label: '개념미술' },
    { value: 'minimalist', label: '미니멀리즘' },
    { value: 'pop-art', label: '팝아트' },
    { value: 'contemporary', label: '현대미술' },
    { value: 'vintage', label: '빈티지' },
    { value: 'antique', label: '골동품' },
  ];

  useEffect(() => {
    // 페이지 진입 시 최상단으로 스크롤
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // 북마크 가져오기
        const { data: bookmarksData } = await supabase
          .from('favorite')
          .select('productId')
          .eq('user_id', user.id);
        
        if (bookmarksData) {
          setBookmarks(new Set(bookmarksData.map(b => b.productId)));
        }
      }
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
          .select('id, artist_name, full_name, avatar_url')
          .eq('isArtist', true)
          .eq('isArtistApproval', true)
          .limit(10);

        if (!artistsError && artistsData) {
          const mappedArtists = artistsData.map(artist => ({
            id: artist.id,
            name: artist.artist_name || artist.full_name || "작가",
            image: artist.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.artist_name || artist.full_name || '작가')}&background=random`
          }));
          setArtists(mappedArtists);
        }

        // 2. 상품 데이터 가져오기
        const { data: productsData, error: productsError } = await supabase
          .from('product')
          .select(`
            *,
            artist_id(id, artist_name, full_name, avatar_url)
          `)
          .order('created_at', { ascending: false });

        if (!productsError && productsData) {
          const mappedProducts = productsData.map(product => {
            // image 필드 처리 (배열 또는 JSON 문자열)
            let imageUrl = '/noimage.jpg';
            if (product.image) {
              try {
                const imageData = typeof product.image === 'string' 
                  ? JSON.parse(product.image) 
                  : product.image;
                
                if (Array.isArray(imageData) && imageData.length > 0) {
                  imageUrl = imageData[0];
                }
              } catch (e) {
                console.log("Image parsing error:", e);
              }
            }

            return {
              ...product,
              title: product.name || product.title || "작품명",
              artist: product.artist_id?.artist_name || product.artist_id?.full_name || "작가",
              price: product.price || 0,
              year: new Date(product.created_at).getFullYear(),
              image: imageUrl,
              available: product.status !== 'sold',
              category: product.category || 'painting'
            };
          });
          setProducts(mappedProducts);
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleBookmark = async (productId) => {
    if (!user) {
      alert("로그인이 필요합니다.");
      return;
    }
    
    const newBookmarks = new Set(bookmarks);
    
    if (newBookmarks.has(productId)) {
      // 북마크 제거
      await supabase
        .from('favorite')
        .delete()
        .eq('user_id', user.id)
        .eq('productId', productId);
      newBookmarks.delete(productId);
    } else {
      // 북마크 추가
      await supabase
        .from('favorite')
        .insert([{ user_id: user.id, productId: productId }]);
      newBookmarks.add(productId);
    }
    
    setBookmarks(newBookmarks);
  };

  // 필터링 및 정렬
  let filteredProducts = products.filter(product => {
    // 카테고리 필터
    if (selectedCategory !== 'all' && product.category !== selectedCategory) {
      return false;
    }
    
    // 검색 필터
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        product.title.toLowerCase().includes(searchLower) ||
        product.artist.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  // 정렬
  if (selectedSort === 'price_low') {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (selectedSort === 'price_high') {
    filteredProducts.sort((a, b) => b.price - a.price);
  } else if (selectedSort === 'recent') {
    filteredProducts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  // 페이지네이션 계산
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // 검색/카테고리/정렬 변경 시 1페이지로 이동
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedCategory, selectedSort]);

  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-white px-4 py-4 border-b">
          <div className="h-6 bg-gray-200 rounded animate-pulse w-20 mx-auto"></div>
        </div>
        <div className="p-4">
          <div className="h-32 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      
      {/* ==================== 헤더 ==================== */}
      <div className="bg-white px-4 py-4 border-b sticky top-0 z-10">
        <h1 className="text-lg font-bold text-center">아트샵</h1>
      </div>

      {/* ==================== 인기 작가 섹션 ==================== */}
      <div className="bg-white p-4 border-b">
        {/* 섹션 헤더 */}
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-semibold text-gray-700">인기 작가</h2>
          <Link href="/artstore/artists" className="flex items-center text-blue-500 text-sm font-medium hover:text-blue-600">
            전체보기
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        
        {/* 작가 프로필 수평 스크롤 */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {artists.map((artist) => (
            <Link
              key={artist.id}
              href={`/artist/${artist.id}`}
              className="flex-shrink-0 text-center cursor-pointer w-16"
            >
              {/* 프로필 이미지 */}
              <div className="w-16 h-16 rounded-full border-2 border-gray-200 hover:border-blue-500 hover:scale-105 transition-all mx-auto overflow-hidden">
                <img
                  src={artist.image}
                  alt={artist.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* 작가명 */}
              <p className="text-xs mt-2 text-gray-600 hover:text-blue-500 transition-colors leading-tight h-8 flex items-center justify-center">
                {artist.name}
              </p>
            </Link>
          ))}
        </div>
      </div>

      

      {/* ==================== 검색 & 필터 ==================== */}
      <div className="bg-white p-4 border-b sticky top-[57px] z-10">
        
        {/* 검색창 */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="작품명, 작가명으로 검색"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 카테고리 + 정렬 */}
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-medium text-gray-700">카테고리</h3>
          
          {/* 정렬 드롭다운 */}
          <select 
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded-md text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="recent">최신순</option>
            <option value="price_low">가격 낮은순</option>
            <option value="price_high">가격 높은순</option>
          </select>
        </div>
        
        {/* 카테고리 버튼 (수평 스크롤) */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`whitespace-nowrap h-8 text-xs px-4 rounded-full transition-all ${
                selectedCategory === category.value
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-500'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* ==================== 작품 그리드 ==================== */}
      <div className="p-4 pb-24">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {paginatedProducts.map((item) => (
              <Link key={item.id} href={`/product/${item.id}`}>
                <div className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  
                  {/* 이미지 영역 */}
                  <div className="relative">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-48 object-cover"
                    />
                    
                    {/* 찜하기 버튼 */}
                    <button 
                      className="absolute top-3 right-3 w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-sm"
                      onClick={(e) => {
                        e.preventDefault();
                        toggleBookmark(item.id);
                      }}
                    >
                      <Heart 
                        className={`w-4 h-4 ${
                          bookmarks.has(item.id) 
                            ? 'text-red-500 fill-current' 
                            : 'text-gray-600'
                        }`}
                      />
                    </button>
                    
                    {/* 판매완료 오버레이 */}
                    {!item.available && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="bg-white px-3 py-1 rounded-full text-sm font-medium">
                          판매완료
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* 정보 영역 */}
                  <div className="p-4">
                    {/* 작품명 */}
                    <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1 text-sm leading-tight">
                      {item.title}
                    </h3>
                    
                    {/* 작가명 */}
                    <p className="text-sm text-gray-600 mb-2">
                      {item.artist}
                    </p>
                    
                    {/* 가격 + 연도 */}
                    <div className="flex justify-between items-center">
                      <span className="text-base font-bold text-blue-600 truncate">
                        {item.price.toLocaleString()}원
                      </span>
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {item.year}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-2">검색 결과가 없습니다</p>
            <p className="text-sm text-gray-400">다른 검색어를 시도해보세요</p>
          </div>
        )}
      </div>

      {/* ==================== 페이지네이션 ==================== */}
      {filteredProducts.length > 0 && totalPages > 1 && (
        <div className="py-6">
          <div className="flex items-center justify-center gap-3">
            {/* Prev */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${
                currentPage === 1
                  ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-white'
                  : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50'
              }`}
              aria-label="이전 페이지"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page numbers (최대 5개) */}
            {[...Array(Math.min(totalPages, 5))].map((_, index) => {
              const pageNumber = index + 1;
              const isActive = currentPage === pageNumber;
              return (
                <button
                  key={pageNumber}
                  onClick={() => handlePageChange(pageNumber)}
                  className={`w-9 h-9 rounded-lg border font-medium flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}

            {/* Next */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-colors ${
                currentPage === totalPages
                  ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-white'
                  : 'border-gray-200 text-gray-500 bg-white hover:bg-gray-50'
              }`}
              aria-label="다음 페이지"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
