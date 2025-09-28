"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { FiHome, FiSearch, FiBell, FiArrowLeft } from "react-icons/fi";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useDisclosure } from "@heroui/react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";

export default function ArtistsPage() {
  const supabase = createClient();
  const router = useRouter();
  const [artists, setArtists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filteredArtists, setFilteredArtists] = useState([]);
  
  // 상단 네비게이션바 관련 상태
  const [exhibitions, setExhibitions] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [notificationDisclosure, setNotificationDisclosure] = useState({ isOpen: false, onOpen: () => {}, onClose: () => {} });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchArtists = async () => {
      setIsLoading(true);
      try {
        // 실제 데이터베이스에서 승인된 작가만 가져오기
        const { data: artistsData, error: artistsError } = await supabase
          .from('profiles')
          .select('id, full_name, name, avatar_url, bio, isArtist, isArtistApproval')
          .eq('isArtist', true)
          .eq('isArtistApproval', true)
          .order('created_at', { ascending: false });

        console.log("Artists data:", artistsData);
        console.log("Artists error:", artistsError);

        if (artistsError) {
          console.error("Error fetching artists:", artistsError);
          setArtists([]);
          setFilteredArtists([]);
        } else {
          const mappedArtists = (artistsData || []).map(artist => ({
            id: artist.id,
            name: artist.full_name || artist.name || "Unknown Artist",
            avatar_url: artist.avatar_url,
            bio: artist.bio || "작가 소개가 없습니다."
          }));
          setArtists(mappedArtists);
          setFilteredArtists(mappedArtists);
        }
      } catch (error) {
        console.error("Error:", error);
        setArtists([]);
        setFilteredArtists([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArtists();
  }, []);

  useEffect(() => {
    if (search.trim() === "") {
      setFilteredArtists(artists);
    } else {
      const filtered = artists.filter(artist =>
        artist.name.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredArtists(filtered);
    }
  }, [search, artists]);

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16">
        {/* 상단 네비게이션 바 */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <button onClick={handleBack} className="cursor-pointer">
                <FiArrowLeft className="w-6 h-6 text-gray-700 hover:text-blue-500 transition-colors" />
              </button>
              <h1 className="text-lg font-bold text-gray-900">전체 작가</h1>
              <div className="w-6 h-6"></div>
            </div>
          </div>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
          <div className="grid grid-cols-2 gap-4">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="h-48 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* 상단 네비게이션 바 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={handleBack} className="cursor-pointer">
              <FiArrowLeft className="w-6 h-6 text-gray-700 hover:text-blue-500 transition-colors" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">전체 작가</h1>
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

      {/* 검색바 */}
      <div className="bg-white px-4 py-4">
        <div className="relative">
          <input
            type="text"
            placeholder="작가 이름으로 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-3 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* 작가 그리드 */}
      <div className="px-4 py-4">
        {filteredArtists.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {filteredArtists.map((artist) => (
              <Link key={artist.id} href={`/artist/${artist.id}`} className="block">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-4 text-center">
                    <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                      {artist.avatar_url ? (
                        <Image
                          src={artist.avatar_url}
                          alt={artist.name}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <span className="text-gray-500 text-2xl">👤</span>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm mb-2 line-clamp-1">
                      {artist.name}
                    </h3>
                    <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                      {artist.bio}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : search.trim() !== "" ? (
          <div className="text-center py-12 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔍</span>
            </div>
            <p className="text-sm mb-2">검색 결과가 없습니다</p>
            <p className="text-xs text-gray-400">다른 검색어를 시도해보세요</p>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">👤</span>
            </div>
            <p className="text-sm mb-2">등록된 작가가 없습니다</p>
            <p className="text-xs text-gray-400">승인된 작가가 등록되면 여기에 표시됩니다</p>
          </div>
        )}
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
            <h2 className="text-lg font-bold">알림</h2>
          </ModalHeader>
          <ModalBody>
            {notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div key={notification.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
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
    </div>
  );
}
