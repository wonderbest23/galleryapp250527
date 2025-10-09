"use client";
import React, { useState } from "react";
import { Card, CardBody, Divider, addToast } from "@heroui/react";
import { FaRegCalendar } from "react-icons/fa";
import { IoMdPin } from "react-icons/io";
import { FaRegStar } from "react-icons/fa";
import { FaRegBookmark, FaBookmark } from "react-icons/fa6";
import Link from "next/link";
import Image from "next/image";
import { FaPlusCircle } from "react-icons/fa";
import { FaStar } from "react-icons/fa";
import { FaMap } from "react-icons/fa";
import { FaMoneyBillWaveAlt } from "react-icons/fa";
import { FaCalendar } from "react-icons/fa6";
import { motion } from "framer-motion";

// 개별 아이템 애니메이션
const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.3,
      ease: "easeOut"
    } 
  }
};

// 컨테이너 애니메이션 (자식 요소들을 순차적으로 표시)
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1 // 각 자식 요소가 0.1초 간격으로 나타남
    }
  }
};

// 이미지 URL 반환 (없으면 기본 이미지)
function getImageUrl(url) {
  return url || "/images/noimage.jpg";
}

export function ExhibitionCards({
  exhibitions,
  user,
  bookmarks,
  toggleBookmark,
  isBookmarked,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  // const exhibitions = Array(5).fill({
  //   title: "수원 갤러리",
  //   subtitle: "김광석 초대전 전시회",
  //   date: "2024.03.15 - 2024.04.15",
  //   location: "서울 강남구",
  //   review: "4.0(225)",
  // });

  return (
    <>
      <motion.div 
        className="flex flex-col items-center gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="flex flex-col gap-4 w-full justify-center items-center">
          {exhibitions.map((exhibition, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              className="w-full relative"
            >
              <Link href={`/exhibition/${exhibition.id}`} className="w-full justify-center items-center">
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3">
                    {/* 전시회 이미지 */}
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <Image
                        src={getImageUrl(exhibition.photo)}
                        alt={exhibition.title}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                        priority={false}
                        placeholder="blur"
                        blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlMmU4ZjAiLz48L3N2Zz4="
                        sizes="64px"
                      />
                    </div>

                    {/* 전시회 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 mb-1">
                            {exhibition.naver_gallery_url?.name || exhibition.gallery?.name || '갤러리'}
                          </p>
                          <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-1">
                            {exhibition.contents}
                          </h3>
                          
                          {/* 날짜 정보 */}
                          <div className="flex items-center gap-1 text-[10px] mb-1">
                            <FaCalendar className="text-[#007AFF] w-[12px] h-[12px]" />
                            {exhibition.start_date?.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3")} - {exhibition.end_date?.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3")}
                          </div>
                          
                          {/* 가격 정보 */}
                          <div className="flex items-center gap-1 text-[10px] mb-1">
                            <IoMdPin className="text-[#007AFF] w-[12px] h-[12px]" />
                            {exhibition.price === 0 ? "무료" : `${exhibition.price?.toLocaleString()}원`}
                          </div>
                          
                          {/* 평점 정보 */}
                          <div className="flex items-center gap-1 text-[10px]">
                            <FaStar className="text-[#007AFF] w-[12px] h-[12px]" />
                            {exhibition.review_average?.toFixed(1) || "0.0"} ({exhibition.review_count || 0})
                          </div>
                        </div>
                        
                        {/* 상태 태그 */}
                        {(() => {
                          const parseDate = (s) => {
                            if (!s) return null;
                            if (s.includes('-')) return new Date(s);
                            const y = s.slice(0, 4);
                            const m = s.slice(4, 6);
                            const d = s.slice(6, 8);
                            return new Date(`${y}-${m}-${d}`);
                          };
                          const diffDays = (() => {
                            const dt = parseDate(exhibition.end_date);
                            if (!dt || isNaN(dt)) return null;
                            return Math.ceil((dt - new Date()) / 86400000);
                          })();
                          
                          return (
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ml-2 ${
                              diffDays && diffDays > 0 && diffDays <= 3 
                                ? "bg-red-100 text-red-800" 
                                : diffDays && diffDays > 0 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-blue-100 text-blue-800"
                            }`}>
                              {diffDays && diffDays > 0 && diffDays <= 3 
                                ? "종료임박" 
                                : diffDays && diffDays > 0 
                                  ? "진행중" 
                                  : "예정"
                              }
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
              {(() => {
                const parseDate=(s)=>{if(!s) return null; if(s.includes('-')) return new Date(s); const y=s.slice(0,4); const m=s.slice(4,6); const d=s.slice(6,8); return new Date(`${y}-${m}-${d}`);} ;
                const diff=(()=>{const dt=parseDate(exhibition.end_date); if(!dt||isNaN(dt)) return null; return Math.ceil((dt-new Date())/86400000);})();
                return diff&&diff>0&&diff<=3? (
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 border border-gray-400 rounded text-[10px] text-red-500 bg-white/80 backdrop-blur-sm font-semibold">종료 D-{diff}</div>
                ):null;
              })()}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </>
  );
}
