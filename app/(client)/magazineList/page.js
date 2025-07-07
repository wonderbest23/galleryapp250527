"use client";
import React from "react";
import { Button, Skeleton } from "@heroui/react";
import { FaChevronLeft } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { Card, CardBody, Divider } from "@heroui/react";
import { FaPlusCircle } from "react-icons/fa";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { motion } from "framer-motion";
import Image from "next/image";
import { Pagination } from "@heroui/react";
import { Eye } from "lucide-react";

export default function MagazineList() {
  const [magazines, setMagazines] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  const fadeInVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05,
        duration: 0.4,
        ease: "easeOut",
      },
    }),
  };

  const getMagazines = async () => {
    const { data, error } = await supabase
      .from("magazine")
      .select("*")
      .order("created_at", { ascending: false });
    setMagazines(data);
    setIsLoading(false);
  };

  useEffect(() => {
    getMagazines();
  }, []);

  // 대형 카드로 사용된 첫 번째 매거진을 제외한 나머지 목록
  const restMagazines = magazines.slice(1);
  const totalPages = Math.ceil(restMagazines.length / ITEMS_PER_PAGE);
  const pagedMagazines = restMagazines.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  console.log("magazines:", magazines);

  // utility hash and view function
  function hashStr(s){let h=0;for(let i=0;i<s.length;i++){h=(h<<5)-h+s.charCodeAt(i);h|=0;}return Math.abs(h);} 
  function calcViews(item){
    // base 1,000~9,999 so 최대 1만 근접
    const base = 1000 + (hashStr(item.id.toString()) % 9000);
    const days = Math.floor((Date.now() - new Date(item.created_at).getTime()) / 864e5);
    const daily = (hashStr(item.id.toString() + "x") % 50); // 0~49 증가폭 확대
    const calculated = base + days * daily + (item.real_views || 0);
    return Math.min(calculated, 10000);
  }

  // yyyy-mm-dd 혹은 ISO 문자열을 "YYYY년 M월 D일" 한국형으로 변환
  const fmtDate = (str) => {
    if (!str) return '';
    const [y, m, d] = str.slice(0, 10).split('-');
    return `${y}년 ${parseInt(m)}월 ${parseInt(d)}일`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen pb-24">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center w-full h-full gap-y-6 mt-12">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="max-w-[300px] w-full flex items-center gap-3">
              <div>
                <Skeleton className="flex rounded-full w-12 h-12" />
              </div>
              <div className="w-full flex flex-col gap-2">
                <Skeleton className="h-3 w-3/5 rounded-lg" />
                <Skeleton className="h-3 w-4/5 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full flex flex-col items-center"
        >
          <div className="bg-white flex items-center w-[90%] justify-between">
            <Button
              isIconOnly
              variant="light"
              className="mr-2"
              onPress={() => router.back()}
            >
              <FaArrowLeft className="text-xl" />
            </Button>
            <div className="flex items-center justify-center flex-grow gap-3">
              <h2 className="text-lg font-bold text-center flex-grow">전시나그네 매거진</h2>
            </div>
            <div className="w-10"></div>
          </div>
          {/* 1. 가장 최근 매거진(대형 카드) */}
          {magazines[0] && (
            <motion.div
              className="relative w-[90%] bg-white rounded-2xl mb-6 shadow hover:cursor-pointer mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              onClick={() => router.push(`/magazine/${magazines[0].id}`)}
            >
              {/* NEW badge */}
              <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded">NEW</span>
              {magazines[0].photo?.[0]?.url && (
                <Image
                  src={
                    (magazines[0].photo?.[0]?.url) || "/images/noimage.jpg"
                  }
                  alt="대표 이미지"
                  width={400}
                  height={256}
                  priority
                  className="w-full h-64 object-cover rounded-t-2xl"
                  style={{ borderRadius: '16px' }}
                />
              )}
              <div className="p-4">
                {/* 카테고리 있으면 */}
                {magazines[0].category && (
                  <div className="text-xs font-bold text-gray-500 mb-1">{magazines[0].category}</div>
                )}
                <div className="text-lg font-bold mb-2 text-black leading-tight line-clamp-2 break-keep">{magazines[0].title}</div>
                {magazines[0].subtitle && (
                  <span className="flex items-center text-sm text-gray-500 mb-2">
                    {magazines[0].subtitle === '전시나그네' && (
                      <span className="inline-block w-7 h-7 rounded-full bg-white shadow-lg mr-1 flex items-center justify-center">
                        <img src="https://teaelrzxuigiocnukwha.supabase.co/storage/v1/object/public/notification//imgi_1_272626601_246980864252824_1484718971353683993_n.jpg" alt="author" className="w-5 h-5 rounded-full object-cover" style={{margin: '2px'}} />
                      </span>
                    )}
                    {magazines[0].subtitle}
                  </span>
                )}
                <div className="text-xs text-gray-400 flex items-center gap-1">
                  {fmtDate(magazines[0].created_at)}
                  <span className="mx-1">·</span>
                  <Eye size={14} className="text-gray-400" /> {calcViews(magazines[0]).toLocaleString()}
                  {magazines[0].author && (
                    <span className="flex items-center gap-1">| by
                      <span className="inline-block w-6 h-6 rounded-full overflow-hidden align-middle mr-1 ml-1 shadow">
                        <img src="https://teaelrzxuigiocnukwha.supabase.co/storage/v1/object/public/notification//imgi_1_272626601_246980864252824_1484718971353683993_n.jpg" alt="author" className="w-full h-full object-cover" />
                      </span>
                      {magazines[0].author}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* 2. 나머지 매거진(작은 리스트) */}
          <div className="w-full flex flex-col gap-4 justify-center items-center">
            {pagedMagazines.map((item, index) => (
              <React.Fragment key={item.id}>
                <motion.div
                  className="w-[90%]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="hover:cursor-pointer" onClick={() => router.push(`/magazine/${item.id}`)}>
                    <div className="flex flex-row items-center gap-4 w-full">
                      {/* 썸네일 좌측 */}
                      {item.photo?.[0]?.url && (
                        <Image
                          alt="Card thumbnail"
                          className="object-cover w-[96px] h-[96px] min-w-[96px] min-h-[96px] rounded-none border border-gray-200"
                          src={
                            (item.photo?.[0]?.url) || "/images/noimage.jpg"
                          }
                          width={96}
                          height={96}
                          loading="lazy"
                        />
                      )}
                      {/* 텍스트 우측 */}
                      <div className="flex flex-col space-y-1 flex-1 min-w-0">
                        {item.category && (
                          <div className="text-xs font-bold text-gray-500 mb-1 truncate">{item.category}</div>
                        )}
                        <h3 className="text-[15px] font-bold text-black leading-tight line-clamp-2 break-keep">{item.title}</h3>
                        <div className="flex flex-row items-center gap-2">
                          {item.subtitle && (
                            <span className="flex items-center text-[12px] text-gray-500 truncate">
                              {item.subtitle === '전시나그네' && (
                                <span className="inline-block w-7 h-7 rounded-full bg-white shadow-lg mr-1 flex items-center justify-center">
                                  <img src="https://teaelrzxuigiocnukwha.supabase.co/storage/v1/object/public/notification//imgi_1_272626601_246980864252824_1484718971353683993_n.jpg" alt="author" className="w-5 h-5 rounded-full object-cover" style={{margin: '2px'}} />
                                </span>
                              )}
                              {item.subtitle}
                            </span>
                          )}
                          <span className="text-[12px] text-gray-400">·</span>
                          <span className="text-[11px] text-gray-400 flex items-center gap-1 whitespace-nowrap">
                            {fmtDate(item.created_at)}
                            <span className="mx-1">·</span><Eye size={10} className="text-gray-400"/>{calcViews(item).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </React.Fragment>
            ))}
          </div>
          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-6 mb-24">
              <Pagination
                total={totalPages}
                page={currentPage}
                onChange={setCurrentPage}
                showControls
                color="primary"
                size="lg"
              />
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
