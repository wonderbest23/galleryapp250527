"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { motion } from "framer-motion";
import { Bell, Calendar, Eye, Search, X } from "lucide-react";

export default function AnnouncementsPopup({ isOpen, onClose }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      fetchAnnouncements();
      // 모바일에서는 body 스크롤을 막지 않음
      if (window.innerWidth > 768) {
        document.body.style.overflow = 'hidden';
      }
    } else {
      // 팝업이 닫힐 때 body 스크롤 복원
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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
        return;
      }

      setAnnouncements(data || []);
      setFilteredAnnouncements(data || []);
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
      month: '2-digit',
      day: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/20" onClick={onClose}></div>
      
      {/* 팝업 컨텐츠 */}
      <div className="relative w-full max-w-5xl mx-4 mb-4">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl max-h-[85vh] sm:max-h-[75vh] overflow-y-auto shadow-2xl"
        >
          {/* 팝업 헤더 */}
          <div className="flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10 border-b border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">공지사항</h2>
                <p className="text-sm text-gray-600">최신 소식 및 업데이트</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{announcements.length}</div>
              <div className="text-xs text-gray-500">전체 공지</div>
            </div>
          </div>

          {/* 콘텐츠 영역 */}
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-yellow-200 border-t-yellow-500 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">공지사항을 불러오는 중...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 검색 바 */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="공지사항 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>

                {/* 공지사항 목록 */}
                {filteredAnnouncements.length > 0 ? (
                  <div className="space-y-4">
                    {filteredAnnouncements.map((announcement, index) => (
                      <motion.div
                        key={announcement.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-yellow-200 transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                          <div className="p-6">
                            {/* 공지사항 헤더 */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                                  {announcement.title}
                                </h3>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>{formatDate(announcement.created_at)}</span>
                                  </div>
                                  {announcement.views && (
                                    <div className="flex items-center gap-1">
                                      <Eye className="w-4 h-4" />
                                      <span>{announcement.views}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {/* 갤러리 정보 */}
                              {announcement.gallery && (
                                <div className="ml-4">
                                  <div className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-xs font-medium">
                                    {announcement.gallery.name}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* 공지사항 내용 */}
                            <div className="mb-4">
                              <p className="text-gray-700 leading-relaxed line-clamp-3">
                                {announcement.description}
                              </p>
                            </div>

                            {/* 공지사항 이미지 */}
                            {announcement.image && (
                              <div className="mb-4">
                                <div className="relative w-full h-48 bg-gray-100 rounded-xl overflow-hidden">
                                  <img
                                    src={announcement.image}
                                    alt={announcement.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* 링크 버튼 */}
                            {announcement.url && (
                              <div className="flex justify-end">
                                <a
                                  href={announcement.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition-colors"
                                >
                                  자세히 보기
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bell className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {searchTerm ? '검색 결과가 없습니다' : '공지사항이 없습니다'}
                    </h3>
                    <p className="text-gray-500">
                      {searchTerm ? '다른 검색어로 시도해보세요' : '새로운 공지사항을 기다려주세요'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 하단 여백 추가 */}
          <div className="h-32"></div>
        </motion.div>
      </div>
    </div>
  );
}
