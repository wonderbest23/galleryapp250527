"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { FiHome, FiSearch, FiBell } from "react-icons/fi";
import Link from "next/link";
import { useDisclosure } from "@heroui/react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";

export default function TopNavigation({ search, setSearch, exhibitions, setExhibitions, gallery, setGallery, showSearchResults, setShowSearchResults }) {
  const supabase = createClient();
  const [notificationDisclosure, setNotificationDisclosure] = useState({ isOpen: false, onOpen: () => {}, onClose: () => {} });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // 알림 데이터 가져오기
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // 실제 알림 데이터를 가져오는 로직 (현재는 샘플 데이터)
        const sampleNotifications = [
          {
            id: 1,
            title: "새로운 전시회가 등록되었습니다",
            message: "서울시립미술관에서 '현대미술의 흐름' 전시회가 시작됩니다.",
            time: "2시간 전",
            isRead: false
          },
          {
            id: 2,
            title: "좋아요를 받았습니다",
            message: "당신의 작품 '봄의 향기'에 좋아요가 추가되었습니다.",
            time: "5시간 전",
            isRead: false
          },
          {
            id: 3,
            title: "댓글이 달렸습니다",
            message: "갤러리 리뷰에 새로운 댓글이 달렸습니다.",
            time: "1일 전",
            isRead: true
          }
        ];
        
        setNotifications(sampleNotifications);
        setUnreadCount(sampleNotifications.filter(n => !n.isRead).length);
      } catch (error) {
        console.error("Error fetching notifications:", error);
        setNotifications([]);
        setUnreadCount(0);
      }
    };

    fetchNotifications();
  }, []);

  // 검색 기능
  const handleSearch = async (searchTerm) => {
    if (!searchTerm.trim()) {
      setExhibitions([]);
      setGallery([]);
      setShowSearchResults(false);
      return;
    }

    try {
      const supabase = createClient();
      
      // 전시회 검색
      const { data: exhibitionsData, error: exhibitionsError } = await supabase
        .from('exhibition')
        .select('*')
        .or(`title.ilike.%${searchTerm}%, contents.ilike.%${searchTerm}%`)
        .limit(5);

      // 갤러리 검색
      const { data: galleryData, error: galleryError } = await supabase
        .from('gallery')
        .select('*')
        .or(`name.ilike.%${searchTerm}%, address.ilike.%${searchTerm}%`)
        .limit(5);

      if (!exhibitionsError) setExhibitions(exhibitionsData || []);
      if (!galleryError) setGallery(galleryData || []);
      
      setShowSearchResults(true);
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  // 검색어 변경 시 검색 실행
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(search);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search]);

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
    setUnreadCount(0);
  };

  const handleLinkClick = () => {
    setShowSearchResults(false);
    setSearch("");
  };

  return (
    <>
      {/* 상단 네비게이션 바 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* 홈 버튼 */}
            <Link href="/" className="cursor-pointer">
              <FiHome className="w-6 h-6 text-gray-700 hover:text-blue-500 transition-colors" />
            </Link>

            {/* 검색바 */}
            <div className="flex-1 mx-4 relative">
              <div className="relative">
                <input
                  type="text"
                  placeholder="갤러리, 전시회를 검색해보세요"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-4 py-2 pl-10 pr-4 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              
              {/* 검색 결과 */}
              {showSearchResults && (exhibitions.length > 0 || gallery.length > 0) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-30 max-h-64 overflow-y-auto">
                  {exhibitions.length > 0 && (
                    <div className="p-3">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">전시회</h3>
                      {exhibitions.map((exhibition) => (
                        <Link
                          key={exhibition.id}
                          href={`/exhibition/${exhibition.id}`}
                          onClick={handleLinkClick}
                          className="block p-2 hover:bg-gray-50 rounded"
                        >
                          <p className="text-sm font-medium text-gray-900">{exhibition.title}</p>
                          <p className="text-xs text-gray-500">{exhibition.contents}</p>
                        </Link>
                      ))}
                    </div>
                  )}
                  
                  {gallery.length > 0 && (
                    <div className="p-3 border-t border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">갤러리</h3>
                      {gallery.map((galleryItem) => (
                        <Link
                          key={galleryItem.id}
                          href={`/gallery/${galleryItem.id}`}
                          onClick={handleLinkClick}
                          className="block p-2 hover:bg-gray-50 rounded"
                        >
                          <p className="text-sm font-medium text-gray-900">{galleryItem.name}</p>
                          <p className="text-xs text-gray-500">{galleryItem.address}</p>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 알림 아이콘 */}
            <div className="relative">
              <button
                onClick={() => setNotificationDisclosure({ ...notificationDisclosure, isOpen: true })}
                className="relative p-1"
              >
                <FiBell className="w-6 h-6 text-gray-700" />
                {unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount}
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 알림 모달 */}
      <Modal
        placement="center"
        isOpen={notificationDisclosure.isOpen}
        onClose={() => setNotificationDisclosure({ ...notificationDisclosure, isOpen: false })}
        size="md"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center justify-between w-full">
              <h2 className="text-lg font-bold">알림</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-500 hover:text-blue-700"
                >
                  모두 읽음
                </button>
                <button
                  onClick={() => setNotificationDisclosure({ ...notificationDisclosure, isOpen: false })}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
          </ModalHeader>
          <ModalBody>
            {notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <FiBell className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {notification.time}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1"></div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FiBell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>알림이 없습니다</p>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onPress={() => setNotificationDisclosure({ ...notificationDisclosure, isOpen: false })}>
              닫기
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
