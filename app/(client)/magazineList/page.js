"use client";
import React from "react";
import { Button, Skeleton } from "@heroui/react";
import { FaChevronLeft } from "react-icons/fa";
import { useRouter } from "next/navigation";
import { Card, CardBody, Divider, Image } from "@heroui/react";
import { FaPlusCircle } from "react-icons/fa";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { motion } from "framer-motion";

export default function MagazineList() {
  const [magazines, setMagazines] = useState([]);
  const [visibleCount, setVisibleCount] = useState(5);
  const [allLoaded, setAllLoaded] = useState(false);
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
    setAllLoaded(data.length <= visibleCount);
    setIsLoading(false);
  };

  useEffect(() => {
    getMagazines();
  }, []);

  console.log("magazines:", magazines);

  const loadMore = () => {
    const newVisibleCount = visibleCount + 5;
    setVisibleCount(newVisibleCount);
    setAllLoaded(magazines.length <= newVisibleCount);
  };

  return (
    <div className="flex flex-col items-center justify-center ">
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
            <h2 className="text-lg font-bold text-center flex-grow">매거진</h2>
            <div className="w-10"></div>
          </div>
          {/* 1. 가장 최근 매거진(대형 카드) */}
          {magazines[0] && (
            <motion.div
              className="w-[90%] bg-white rounded-2xl mb-6 shadow hover:cursor-pointer mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              onClick={() => router.push(`/magazine/${magazines[0].id}`)}
            >
              {magazines[0].photo?.[0]?.url && (
                <img
                  src={
                    magazines[0].photo[0].url
                      ? magazines[0].photo[0].url.includes('/thumbnails/')
                        ? magazines[0].photo[0].url
                        : magazines[0].photo[0].url.replace('/gallery/', '/gallery/thumbnails/')
                      : "/images/noimage.jpg"
                  }
                  alt="대표 이미지"
                  className="w-full h-64 object-cover rounded-t-2xl"
                />
              )}
              <div className="p-4">
                {/* 카테고리 있으면 */}
                {magazines[0].category && (
                  <div className="text-xs font-bold text-gray-500 mb-1">{magazines[0].category}</div>
                )}
                <div className="text-lg font-bold mb-2 text-black leading-tight line-clamp-2 break-keep">{magazines[0].title}</div>
                {magazines[0].subtitle && (
                  <div className="text-sm text-gray-500 mb-2">{magazines[0].subtitle}</div>
                )}
                <div className="text-xs text-gray-400">
                  {new Date(magazines[0].created_at).getFullYear()}년 {new Date(magazines[0].created_at).getMonth() + 1}월 {new Date(magazines[0].created_at).getDate()}일
                  {magazines[0].author && (
                    <span> | by {magazines[0].author}</span>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* 2. 나머지 매거진(작은 리스트) */}
          <div className="w-full flex flex-col gap-4 justify-center items-center">
            {magazines.slice(1, visibleCount).map((item, index) => (
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
                            item.photo[0].url
                              ? item.photo[0].url.includes('/thumbnails/')
                                ? item.photo[0].url
                                : item.photo[0].url.replace('/gallery/', '/gallery/thumbnails/')
                              : "/images/noimage.jpg"
                          }
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
                            <span className="text-[12px] text-gray-500 truncate">{item.subtitle}</span>
                          )}
                          <span className="text-[12px] text-gray-400">·</span>
                          <span className="text-[12px] text-gray-400 truncate">
                            {new Date(item.created_at).getFullYear()}년 {new Date(item.created_at).getMonth() + 1}월 {new Date(item.created_at).getDate()}일
                            {item.author && (
                              <span> | by {item.author}</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
                {index < visibleCount - 2 && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 + 0.2 }}
                    className="w-[90%]"
                  >
                    <Divider orientation="horizontal" />
                  </motion.div>
                )}
              </React.Fragment>
            ))}
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col justify-center items-center mt-6 mb-24"
          >
            {!allLoaded ? (
              <FaPlusCircle
                className="text-gray-500 text-2xl font-bold hover:cursor-pointer"
                onClick={loadMore}
              />
            ) : (
              <p className="text-gray-500 text-sm">
                모든 매거진을 불러왔습니다
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
