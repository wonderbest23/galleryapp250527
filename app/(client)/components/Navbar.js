"use client";
import { Input } from "@heroui/react";
import { Icon } from "@iconify/react";
import { FaRegBookmark } from "react-icons/fa";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { useState, useEffect } from "react";
import debounce from "lodash/debounce";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const supabase = createClient();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [exhibitions, setExhibitions] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);
  // 링크 클릭 시 검색창 초기화 함수 추가
  const handleLinkClick = () => {
    setSearch("");
    setExhibitions([]);
    setGallery([]);
  };

  // useCallback 제거하고 단순화된 접근 방식 사용
  const handleSearch = async (searchTerm) => {
    try {
      // 전시회 데이터 검색
      const { data, error } = await supabase
        .from("exhibition")
        .select("*")
        .ilike("contents", `%${searchTerm}%`) // title 컬럼으로 변경
        .gte("end_date", new Date().toISOString());

      if (error) {
        console.error("전시회 데이터 검색 오류:", error);
      } else {
        console.log("가져온 전시회 데이터:", data);
        setExhibitions(data || []);
      }

      // 갤러리 데이터 검색
      const { data: galleryData, error: galleryError } = await supabase
        .from("gallery")
        .select("*")
        .ilike("name", `%${searchTerm}%`); // title 컬럼으로 변경

      if (galleryError) {
        console.error("갤러리 데이터 검색 오류:", galleryError);
      } else {
        console.log("가져온 갤러리 데이터:", galleryData);
        setGallery(galleryData || []);
      }
    } catch (e) {
      console.error("검색 중 예외 발생:", e);
    }
  };

  // 디바운스 함수 직접 생성
  const debouncedSearch = debounce((term) => {
    handleSearch(term);
  }, 500);

  useEffect(() => {
    if (search) {
      debouncedSearch(search);
    } else {
      setExhibitions([]);
      setGallery([]);
    }

    // 컴포넌트 언마운트 시 디바운스 취소
    return () => {
      debouncedSearch.cancel();
    };
  }, [search]); // useCallback 제거했으므로 의존성을 search로 변경

  // 로고 클릭 핸들러 제거
  return (
    <div className="relative">
      <div className="flex justify-center items-center gap-x-4 h-[50px] px-4 mt-4">
        {/* 홈 버튼 */}
        <div
          onClick={() => router.push("/")}
          className="cursor-pointer bg-[#F7F8F9] rounded-full p-2 w-10 h-10 flex items-center justify-center"
        >
          <Icon icon="lucide:home" className="text-gray-600 text-lg" />
        </div>

        <Input
          classNames={{ 
            input: "text-[10px]"
          }}
          placeholder="갤러리, 전시회를 검색해보세요!"
          startContent={
            <Icon icon="lucide:search" className="text-default-400" />
          }
          size="sm"
          radius="lg"
          className=""
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="w-8 flex justify-center items-center">
          {user ? (
            <div
              className="cursor-pointer bg-[#F7F8F9] rounded-full p-2"
              onClick={() => router.push("/exhibitions?isBookmark=true")}
            >
              <FaRegBookmark className="text-sm text-gray-400" />
            </div>
          ) : (
            <div
              className="cursor-pointer bg-[#F7F8F9] rounded-full p-2"
              onClick={() =>
                router.push("/mypage?returnUrl=/exhibitions?isBookmark=true")
              }
            >
              <FaRegBookmark className="text-sm text-gray-400" />
            </div>
          )}
        </div>
      </div>

      {/* 검색 결과 배너 */}
      {search && ( // 검색어가 있을 때 항상 검색 결과 배너 표시
        <div className="absolute w-full bg-white shadow-md rounded-b-lg p-4 z-50">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-600 mb-2">갤러리</h3>
            {gallery.length > 0 ? (
              <div className="space-y-2">
                {gallery.slice(0, 3).map((item) => (
                  <Link
                    href={`/galleries/${item.id}`}
                    key={item.id}
                    onClick={handleLinkClick}
                  >
                    <div className="flex items-center p-2 hover:bg-gray-50 rounded-lg transition">
                      <div className="flex-shrink-0 mr-3">
                        <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                          {item.thumbnail ? (
                            <img
                              src={item.thumbnail}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Icon
                              icon="bx:building"
                              className="text-gray-400 text-xl"
                            />
                          )}
                        </div>
                      </div>
                      <span className="text-sm">{item.name}</span>
                    </div>
                  </Link>
                ))}
                {gallery.length > 3 && (
                  <div className="text-xs text-right text-gray-500">
                    외 {gallery.length - 3}개 결과
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500 p-2">
                갤러리 검색 결과가 없습니다.
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 my-2"></div>

          <div>
            <h3 className="text-sm font-semibold text-gray-600 mb-2">전시회</h3>
            {exhibitions.length > 0 ? (
              <div className="space-y-2">
                {exhibitions.slice(0, 3).map((item) => (
                  <Link
                    href={`/exhibition/${item.id}`}
                    key={item.id}
                    onClick={handleLinkClick}
                  >
                    <div className="flex items-center p-2 hover:bg-gray-50 rounded-lg transition">
                      <div className="flex-shrink-0 mr-3">
                        <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                          {item.photo ? (
                            <img
                              src={item.photo}
                              alt={item.title || item.contents}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Icon
                              icon="bx:image"
                              className="text-gray-400 text-xl"
                            />
                          )}
                        </div>
                      </div>
                      <span className="text-sm">
                        {item.title || item.contents}
                      </span>
                    </div>
                  </Link>
                ))}
                {exhibitions.length > 3 && (
                  <div className="text-xs text-right text-gray-500">
                    외 {exhibitions.length - 3}개 결과
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500 p-2">
                전시회 검색 결과가 없습니다.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
