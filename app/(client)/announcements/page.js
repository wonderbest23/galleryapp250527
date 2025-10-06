"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { FaArrowLeft, FaBell, FaCalendarAlt, FaEye, FaSearch } from "react-icons/fa";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  useEffect(() => {
    // 검색 필터링
    if (searchTerm.trim() === "") {
      setFilteredAnnouncements(announcements);
    } else {
      const filtered = announcements.filter(announcement =>
        announcement.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        announcement.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredAnnouncements(filtered);
    }
  }, [searchTerm, announcements]);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("gallery_notification")
        .select(`
          *,
          gallery:gallery_id (
            name,
            url
          )
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("공지사항을 가져오는 중 오류 발생:", error);
      } else {
        setAnnouncements(data || []);
        setFilteredAnnouncements(data || []);
      }
    } catch (error) {
      console.error("공지사항을 가져오는 중 오류 발생:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getAnnouncementType = (galleryName) => {
    if (!galleryName) return "시스템";
    return galleryName;
  };

  const getTypeColor = (galleryName) => {
    if (!galleryName) return "from-blue-400 to-cyan-500";
    return "from-purple-400 to-indigo-500";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <FaArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">공지사항</h1>
              <p className="text-sm text-gray-500">최신 소식과 업데이트를 확인하세요</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
              <FaBell className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 검색 바 */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <FaSearch className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="공지사항 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        {/* 공지사항 목록 */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-2xl"></div>
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredAnnouncements.length > 0 ? (
          <div className="space-y-4">
            {filteredAnnouncements.map((announcement, index) => (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {/* 타입 아이콘 */}
                    <div className={`w-12 h-12 bg-gradient-to-br ${getTypeColor(announcement.gallery?.name)} rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                      <FaBell className="w-6 h-6 text-white" />
                    </div>

                    {/* 내용 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              !announcement.gallery?.name 
                                ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                                : 'bg-purple-100 text-purple-700 border border-purple-200'
                            }`}>
                              {getAnnouncementType(announcement.gallery?.name)}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 mb-2 leading-tight">
                            {announcement.title || "제목 없음"}
                          </h3>
                          {announcement.description && (
                            <p className="text-gray-600 leading-relaxed line-clamp-3 mb-4">
                              {announcement.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* 메타 정보 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <FaCalendarAlt className="w-3 h-3" />
                            <span>{formatDate(announcement.created_at)}</span>
                          </div>
                          {announcement.gallery && (
                            <div className="flex items-center gap-1">
                              <FaEye className="w-3 h-3" />
                              <span>{announcement.gallery.name}</span>
                            </div>
                          )}
                        </div>
                        
                        {announcement.gallery && (
                          <Link
                            href={`/galleries/${announcement.gallery_id}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            갤러리 보기
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaBell className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {searchTerm ? "검색 결과가 없습니다" : "공지사항이 없습니다"}
              </h3>
              <p className="text-gray-500 leading-relaxed">
                {searchTerm 
                  ? "다른 검색어로 시도해보세요" 
                  : "새로운 공지사항이 곧 업데이트될 예정입니다"
                }
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                >
                  전체 보기
                </button>
              )}
            </div>
          </div>
        )}

        {/* 하단 여백 */}
        <div className="h-8"></div>
      </div>
    </div>
  );
}

