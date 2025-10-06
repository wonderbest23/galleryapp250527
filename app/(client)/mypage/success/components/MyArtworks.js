"use client";
import React, { useEffect, useState } from "react";
import { Card, CardBody, Image, Button, Spinner, Chip } from "@heroui/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { FaPlusCircle, FaEdit, FaEye, FaHeart, FaTimes, FaArrowLeft } from "react-icons/fa";
import { motion } from "framer-motion";
import { PiNotePencil, PiPaintBrush } from "react-icons/pi";
import { HiOutlinePhotograph, HiOutlineSparkles } from "react-icons/hi";

export default function MyArtworks({ user, profile, onClose }) {
  // 팝업이 열릴 때 body 스크롤 방지
  useEffect(() => {
    // 모바일에서는 body 스크롤을 막지 않음
    if (window.innerWidth > 768) {
      document.body.style.overflow = 'hidden';
    }
    
    // 컴포넌트 언마운트 시 스크롤 복원
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);
  const [artworks, setArtworks] = useState([]);
  const [displayedArtworks, setDisplayedArtworks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  const [showArtworkDetail, setShowArtworkDetail] = useState(false);
  const itemsPerPage = 8;
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (user?.id) {
      fetchUserArtworks();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (artworks.length > 0) {
      updateDisplayedArtworks();
    }
  }, [artworks]);

  const fetchUserArtworks = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('product')
        .select('*')
        .eq('artist_id', user.id);

      if (error) {
        console.log('작품 불러오기 오류:', error);
        return;
      }
      setArtworks(data || []);
    } catch (error) {
      console.log('오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateDisplayedArtworks = () => {
    const startIndex = 0;
    const endIndex = page * itemsPerPage;
    const itemsToShow = artworks.slice(startIndex, endIndex);
    setDisplayedArtworks(itemsToShow);
    setHasMore(endIndex < artworks.length);
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    setTimeout(() => {
      updateDisplayedArtworks();
    }, 0);
  };

  const handleArtworkClick = (artwork) => {
    setSelectedArtwork(artwork);
    setShowArtworkDetail(true);
  };

  // 작품 상세 보기 모드
  if (showArtworkDetail && selectedArtwork) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
        {/* 배경 오버레이 */}
        <div className="absolute inset-0 bg-black/20" onClick={() => setShowArtworkDetail(false)}></div>
        
        {/* 작품 상세 컨텐츠 */}
        <div className="relative w-full max-w-5xl mx-4 mb-4">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl max-h-[85vh] overflow-y-auto shadow-2xl">
            {/* 헤더 */}
            <div className="flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10 border-b border-gray-200 p-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowArtworkDetail(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <FaArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedArtwork.name}</h2>
                  <p className="text-sm text-gray-600">{selectedArtwork.genre}</p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 작품 상세 컨텐츠 */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 작품 이미지 */}
                <div className="space-y-4">
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                    <img
                      src={selectedArtwork.image?.[0] || "/noimage.jpg"}
                      alt={selectedArtwork.name}
                      className="w-full h-full object-cover"
                    />
                    {/* 좋아요 표시 */}
                    <div className="absolute top-4 right-4">
                      <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-2">
                        <FaHeart className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-medium text-gray-700">{selectedArtwork.likes || 0}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 추가 이미지들 */}
                  {selectedArtwork.image && selectedArtwork.image.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {selectedArtwork.image.slice(1, 5).map((img, index) => (
                        <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={img}
                            alt={`${selectedArtwork.name} ${index + 2}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* 작품 정보 */}
                <div className="space-y-6">
                  {/* 가격 정보 */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600 font-medium mb-1">작품 가격</p>
                        <p className="text-3xl font-bold text-green-700">
                          {selectedArtwork.price ? `${selectedArtwork.price.toLocaleString()}원` : "가격 미설정"}
                        </p>
                      </div>
                      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-2xl font-bold">₩</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 작품 상세 정보 */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">작품 정보</h3>
                    
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex justify-between items-center py-3 border-b border-gray-100">
                        <span className="text-gray-500">크기</span>
                        <span className="font-medium text-gray-900">{selectedArtwork.size || "미설정"}</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-3 border-b border-gray-100">
                        <span className="text-gray-500">재료</span>
                        <span className="font-medium text-gray-900">{selectedArtwork.make_material || selectedArtwork.material || "미설정"}</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-3 border-b border-gray-100">
                        <span className="text-gray-500">제작일</span>
                        <span className="font-medium text-gray-900">{selectedArtwork.make_date || "미설정"}</span>
                      </div>
                      
                      <div className="flex justify-between items-center py-3">
                        <span className="text-gray-500">장르</span>
                        <span className="font-medium text-gray-900">{selectedArtwork.genre || "미분류"}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* 작품 설명 */}
                  {selectedArtwork.description && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold text-gray-900">작품 설명</h3>
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-gray-700 leading-relaxed">
                          {selectedArtwork.description}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* 액션 버튼들 */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                      onClick={() => {
                        setShowArtworkDetail(false);
                        router.push(`/product/${selectedArtwork.id}`);
                      }}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      상세 페이지 보기
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowArtworkDetail(false);
                        router.push(`/product/edit/${selectedArtwork.id}`);
                      }}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      작품 수정
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/20" onClick={onClose}></div>
      
      {/* 팝업 컨텐츠 */}
      <div className="relative w-full max-w-5xl mx-4 mb-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl max-h-[75vh] overflow-y-auto shadow-2xl">
          {/* 팝업 헤더 */}
          <div className="flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10 border-b border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <PiPaintBrush className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">나의 작품</h2>
                <p className="text-sm text-gray-600 leading-relaxed">등록하신 작품을 관리하세요</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">{artworks.length}</div>
                  <div className="text-xs text-gray-500">등록된 작품</div>
                </div>
                <div className="w-px h-8 bg-gray-300"></div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-emerald-600">{profile?.artist_credit || 0}</div>
                  <div className="text-xs text-gray-500">추가 가능</div>
                </div>
              </div>
              
                         <button
                           onClick={onClose}
                           className="text-gray-500 hover:text-gray-700 p-2"
                         >
                           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                           </svg>
                         </button>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-6">
              {/* 작품 그리드 */}
              {isLoading ? (
                <div className="flex justify-center items-center py-16">
                  <div className="text-center">
                    <Spinner size="lg" color="primary" />
                    <p className="text-gray-500 mt-4">작품을 불러오는 중...</p>
                  </div>
                </div>
              ) : (
                <>
                           {artworks.length > 0 ? (
                             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                               {displayedArtworks.map((artwork, index) => (
                                 <motion.div
                                   key={artwork.id}
                                   initial={{ opacity: 0, y: 20 }}
                                   animate={{ opacity: 1, y: 0 }}
                                   transition={{ duration: 0.3, delay: index * 0.1 }}
                                   className="group cursor-pointer"
                                   onClick={() => handleArtworkClick(artwork)}
                                 >
                                   <div className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-blue-200 transition-all duration-300">
                                     {/* 작품 이미지 영역 */}
                                     <div className="relative aspect-square overflow-hidden">
                                       <img
                                         src={artwork?.image?.[0] || "/noimage.jpg"}
                                         alt={artwork.title}
                                         className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                       />
                                       
                                       {/* 상태 배지 */}
                                       <div className="absolute top-2 left-2">
                                         <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-500 text-white shadow-sm">
                                           등록됨
                                         </span>
                                       </div>
                                       
                                       {/* 좋아요 표시 */}
                                       <div className="absolute top-2 right-2">
                                         <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                                           <FaHeart className="w-2.5 h-2.5 text-red-500" />
                                           <span className="text-xs font-medium text-gray-700">{artwork.likes || 0}</span>
                                         </div>
                                       </div>
                                     </div>
                                     
                                     {/* 작품 정보 영역 */}
                                     <div className="p-3">
                                       <div className="mb-2">
                                         <h3 className="font-semibold text-gray-900 text-sm mb-1 leading-tight line-clamp-2">
                                           {artwork.name || "제목 없음"}
                                         </h3>
                                         <p className="text-xs text-gray-500">
                                           {artwork.genre || "장르 미분류"}
                                         </p>
                                       </div>

                                       {/* 가격 정보 */}
                                       <div className="flex items-center justify-between">
                                         <div className="flex items-center gap-1">
                                           <div className="w-4 h-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                                             <span className="text-white text-xs font-bold">₩</span>
                                           </div>
                                           <div>
                                             <div className="text-sm font-bold text-gray-900">
                                               {artwork.price ? `${(artwork.price/10000).toFixed(0)}만` : "미설정"}
                                             </div>
                                           </div>
                                         </div>
                                       </div>
                                     </div>
                                   </div>
                                 </motion.div>
                               ))}
                             </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <PiPaintBrush className="w-12 h-12 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">등록된 작품이 없습니다</h3>
                      <p className="text-gray-500 mb-6 leading-relaxed">첫 번째 작품을 등록해보세요!</p>
                    </div>
                  )}
                </>
              )}
              
              {/* 더 보기 버튼 */}
              {!isLoading && artworks.length > 0 && hasMore && (
                <div className="flex justify-center mt-8">
                  <Button
                    variant="flat"
                    color="primary"
                    startContent={<FaPlusCircle />}
                    onPress={loadMore}
                    className="px-8"
                  >
                    더 많은 작품 보기
                  </Button>
                </div>
              )}

                       {/* 하단 액션 버튼 */}
                       {profile?.isArtistApproval === true && (
                         <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                           <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                               <HiOutlinePhotograph className="w-6 h-6 text-white" />
                             </div>
                             <div className="flex-1">
                               <h3 className="font-bold text-gray-900 text-base mb-1">새 작품 등록</h3>
                               <p className="text-sm text-gray-600">
                                 {profile?.artist_credit === 0 
                                   ? "크레딧을 구매하여 더 많은 작품을 등록하세요" 
                                   : `${profile?.artist_credit}개의 작품을 추가로 등록할 수 있습니다`
                                 }
                               </p>
                             </div>
                             <button
                               onClick={() => {
                                 if (profile?.artist_credit === 0) {
                                   alert("크레딧이 부족합니다. 결제 후 신규작품을 등록해주세요.");
                                   setTimeout(() => {
                                     router.push("/payment");
                                   }, 2000);
                                   return
                                 }
                                 router.push("/addProduct");
                               }}
                               disabled={profile?.artist_credit === 0}
                               className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
                                 profile?.artist_credit === 0
                                   ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                   : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-md hover:shadow-lg'
                               }`}
                             >
                               <HiOutlinePhotograph className="w-4 h-4" />
                               {profile?.artist_credit === 0 ? "크레딧 구매" : "작품 등록"}
                             </button>
                           </div>
                         </div>
                       )}
                       
                       {/* 하단 여백 추가 */}
                       <div className="h-32"></div>
                     </div>
                 </div>
               </div>
      </div>

    </div>
  );
}