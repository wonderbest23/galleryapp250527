"use client";
import React, { useState, useEffect } from "react";
import { Card, CardBody, Divider } from "@heroui/react";
import { FaRegCalendar } from "react-icons/fa";
import { FaRegStar } from "react-icons/fa";
import { FaRegBookmark, FaBookmark } from "react-icons/fa6";
import Link from "next/link";
import { FaPlusCircle } from "react-icons/fa";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import { LuWallet } from "react-icons/lu";
import { FaTag } from "react-icons/fa6";
import { Spinner } from "@heroui/react";
import { FaMoneyBillWaveAlt } from "react-icons/fa";
import { FaCalendar } from "react-icons/fa6";
import { IoMdPin } from "react-icons/io";
import { motion } from "framer-motion";
import { Heart, Calendar, MapPin, DollarSign, User, X, Plus } from "lucide-react";


export default function BookmarkedExhibition({ user, alarmExhibition }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [bookmarkedExhibitions, setBookmarkedExhibitions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [displayCount, setDisplayCount] = useState(5); // 한 번에 표시할 개수
  const supabase = createClient();
  // console.log('user22:', user)

  useEffect(() => {
    // 북마크 데이터를 가져오는 함수
    const fetchBookmarkedExhibitions = async () => {
      try {
        setIsLoading(true);
        
        // supabase에서 북마크 데이터 직접 가져오기
        const { data: bookmarkData, error: bookmarkError } = await supabase
          .from('bookmark')
          .select('*')
          .eq('user_id', user.id);
          
        if (bookmarkError) {
          throw new Error('북마크 데이터를 불러오는데 실패했습니다');
        }
        
        // 북마크된 전시회 정보를 불러옴
        const exhibitionsData = await Promise.all(
          bookmarkData
            .filter(bookmark => bookmark.exhibition_id) // exhibition_id가 null이 아닌 항목만 필터링
            .map(async (bookmark) => {
              // supabase에서 전시회 정보 직접 가져오기
              const { data: exhibition, error: exhibitionError } = await supabase
                .from('exhibition')
                .select('*, gallery(*)')
                .eq('id', bookmark.exhibition_id)
                .single();
                
              if (exhibitionError || !exhibition) {
                return null;
              }
              
              return {
                ...exhibition,
                isBookmarked: true
              };
            })
        );

        // 북마크된 갤러리 정보를 불러옴
        const galleriesData = await Promise.all(
          bookmarkData
            .filter(bookmark => bookmark.gallery_id) // gallery_id가 null이 아닌 항목만 필터링
            .map(async (bookmark) => {
              // supabase에서 갤러리 정보 직접 가져오기
              const { data: gallery, error: galleryError } = await supabase
                .from('gallery')
                .select('*')
                .eq('id', bookmark.gallery_id)
                .single();
                
              if (galleryError || !gallery) {
                return null;
              }
              
              return {
                ...gallery,
                isBookmarked: true,
                type: 'gallery'
              };
            })
        );
        
        // 북마크된 상품 정보를 불러옴
        const productsData = await Promise.all(
          bookmarkData
            .filter(bookmark => bookmark.product_id) // product_id가 null이 아닌 항목만 필터링
            .map(async (bookmark) => {
              // supabase에서 상품 정보 직접 가져오기
              const { data: product, error: productError } = await supabase
                .from('product')
                .select('*, artist_id(*)')
                .eq('id', bookmark.product_id)
                .single();
                
              if (productError || !product) {
                return null;
              }
              
              return {
                ...product,
                isBookmarked: true,
                type: 'product'
              };
            })
        );
        
        // null 값 제거 후 상태 업데이트
        const today = new Date().setHours(0,0,0,0);
        const parseDate = (str) => {
          if(!str) return null;
          if(typeof str === 'string' && /^\d{8}$/.test(str)) {
            const y=str.slice(0,4);
            const m=str.slice(4,6);
            const d=str.slice(6,8);
            return new Date(`${y}-${m}-${d}`);
          }
          return new Date(str);
        };
        const validExhibitions = exhibitionsData.filter(item => {
          if(!item) return false;
          if(item.end_date){
            const endDateObj = parseDate(item.end_date);
            if(!isNaN(endDateObj)){
              const end=endDateObj.setHours(0,0,0,0);
              if(end<today) return false; // 종료된 전시 제외
            }
          }
          return true;
        });
        const validGalleries = galleriesData.filter(item => item !== null);
        const validProducts = productsData.filter(item => item !== null);
        setBookmarkedExhibitions([...validExhibitions, ...validGalleries, ...validProducts]);
      } catch (error) {
        console.log('북마크 가져오기 오류:', error);
        // 오류 발생 시 빈 배열로 설정
        setBookmarkedExhibitions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookmarkedExhibitions();
  }, []);

  // 알림 전시회가 있으면 최상단에 강제 노출 (중복 방지)
  let finalExhibitions = bookmarkedExhibitions;
  if (alarmExhibition) {
    const alreadyExists = bookmarkedExhibitions.some(e => e.id === alarmExhibition.id);
    if (!alreadyExists) {
      finalExhibitions = [alarmExhibition, ...bookmarkedExhibitions];
    } else {
      // 이미 있으면 해당 전시회를 맨 앞으로 이동
      finalExhibitions = [
        ...bookmarkedExhibitions.filter(e => e.id === alarmExhibition.id),
        ...bookmarkedExhibitions.filter(e => e.id !== alarmExhibition.id)
      ];
    }
  }

  // 더보기 버튼 클릭 시 실행되는 함수
  const loadMoreExhibitions = () => {
    if (displayCount + 5 >= bookmarkedExhibitions.length) {
      setDisplayCount(bookmarkedExhibitions.length);
      setHasMore(false);
    } else {
      setDisplayCount(displayCount + 5);
    }
  };

  // 북마크 해제 함수
  const handleUnbookmark = async (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    let filter = { user_id: user.id };
    if (item.type === 'gallery') filter.gallery_id = item.id;
    else if (item.type === 'product') filter.product_id = item.id;
    else filter.exhibition_id = item.id;
    try {
      const { error } = await supabase.from('bookmark').delete().match(filter);
      if (error) throw error;
      setBookmarkedExhibitions(prev => prev.filter(i => {
        if (item.type === 'gallery') return !(i.id === item.id && i.type === 'gallery');
        if (item.type === 'product') return !(i.id === item.id && i.type === 'product');
        return !(i.id === item.id && !i.type);
      }));
    } catch (err) {
      console.log('북마크 해제 오류:', err);
    }
  };

  // 로딩 중일 때 표시할 컴포넌트
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">즐겨찾기를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 아이템 타입에 따른 링크 URL 생성
  const getItemUrl = (item) => {
    if (item.type === 'gallery') return `/gallery/${item.id}`;
    if (item.type === 'product') return `/product/${item.id}`;
    return `/exhibition/${item.id}`;
  };

  // 가격 형식화 (천 단위 콤마)
  const formatPrice = (price) => {
    return price?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  return (
    <div className="w-full px-4 py-2">
      {finalExhibitions.length > 0 ? (
        <div className="space-y-4">
          {finalExhibitions.slice(0, displayCount).map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Link href={getItemUrl(item)}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                  
                  {/* 이미지 영역 */}
                  <div className="relative h-32 bg-gradient-to-br from-gray-50 to-gray-100">
                    <img
                      src={item.type === 'gallery' 
                        ? item.thumbnail 
                        : item.type === 'product'
                          ? (item.image && item.image.length > 0 ? item.image[0] : "/noimage.jpg")
                          : item.photo}
                      alt={item.type === 'product' ? item.name : item.title || item.contents}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* 타입 배지 */}
                    <div className="absolute top-3 left-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        item.type === 'gallery' 
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : item.type === 'product'
                            ? 'bg-purple-100 text-purple-700 border border-purple-200'
                            : 'bg-blue-100 text-blue-700 border border-blue-200'
                      }`}>
                        {item.type === 'gallery' ? '갤러리' : item.type === 'product' ? '작품' : '전시회'}
                      </span>
                    </div>
                    
                    {/* 즐겨찾기 해제 버튼 */}
                    <button
                      onClick={e => handleUnbookmark(e, item)}
                      className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-sm"
                      title="즐겨찾기 해제"
                    >
                      <Heart className="w-4 h-4 text-red-500 fill-current" />
                    </button>
                  </div>
                  
                  {/* 정보 영역 */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2">
                      {item.type === 'gallery' 
                        ? item.name 
                        : item.type === 'product'
                          ? item.name
                          : item.contents}
                    </h3>
                    
                    <div className="space-y-2">
                      {item.type === 'gallery' ? (
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-4 h-4 text-blue-500" />
                          <span className="text-sm">{item.address}</span>
                        </div>
                      ) : item.type === 'product' ? (
                        <>
                          <div className="flex items-center gap-2 text-gray-600">
                            <DollarSign className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-semibold">₩{formatPrice(item.price)}</span>
                          </div>
                          {item.artist_id && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <User className="w-4 h-4 text-purple-500" />
                              <span className="text-sm">{item.artist_id.artist_name || '작가 정보 없음'}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            <span className="text-sm">
                              {item.start_date?.substring(0,4)}.{item.start_date?.substring(4,6)}.{item.start_date?.substring(6,8)} ~ {item.end_date?.substring(0,4)}.{item.end_date?.substring(4,6)}.{item.end_date?.substring(6,8)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="w-4 h-4 text-blue-500" />
                            <span className="text-sm">{item.gallery?.address || '-'}</span>
                          </div>
                          {item.price && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <DollarSign className="w-4 h-4 text-green-500" />
                              <span className="text-sm font-semibold">₩{formatPrice(item.price)}</span>
                            </div>
                          )}
                        </>
                      )}
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
            <Heart className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">즐겨찾기한 항목이 없습니다</h3>
          <p className="text-gray-500">관심있는 전시회, 갤러리, 작품을 즐겨찾기에 추가해보세요</p>
        </div>
      )}
      
      {/* 더보기 버튼 */}
      {bookmarkedExhibitions.length > 0 && (
        <div className="flex justify-center mt-6">
          {hasMore && displayCount < bookmarkedExhibitions.length ? (
            <button
              onClick={loadMoreExhibitions}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              더 보기 ({bookmarkedExhibitions.length - displayCount}개)
            </button>
          ) : displayCount > 0 && !hasMore && bookmarkedExhibitions.length > 5 ? (
            <p className="text-center py-4 text-gray-500">모든 즐겨찾기를 확인했습니다</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
