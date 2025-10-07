"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { FiHome, FiSearch, FiBell } from "react-icons/fi";
import Link from "next/link";
import { useDisclosure } from "@heroui/react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import NotificationBar from "./NotificationBar";

export default function TopNavigation({ search, setSearch, exhibitions, setExhibitions, gallery, setGallery, showSearchResults, setShowSearchResults } = {}) {
  const supabase = createClient();
  const [notificationBarOpen, setNotificationBarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  
  // 전역 상태 관리
  const [globalSearch, setGlobalSearch] = useState("");
  const [globalExhibitions, setGlobalExhibitions] = useState([]);
  const [globalGallery, setGlobalGallery] = useState([]);
  const [globalShowSearchResults, setGlobalShowSearchResults] = useState(false);
  
  // props가 없으면 전역 상태 사용
  const currentSearch = search !== undefined ? search : globalSearch;
  const setCurrentSearch = setSearch || setGlobalSearch;
  const currentExhibitions = exhibitions !== undefined ? exhibitions : globalExhibitions;
  const setCurrentExhibitions = setExhibitions || setGlobalExhibitions;
  const currentGallery = gallery !== undefined ? gallery : globalGallery;
  const setCurrentGallery = setGallery || setGlobalGallery;
  const currentShowSearchResults = showSearchResults !== undefined ? showSearchResults : globalShowSearchResults;
  const setCurrentShowSearchResults = setShowSearchResults || setGlobalShowSearchResults;

  // 사용자 정보 가져오기
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  // 알림 데이터 가져오기 (실제 데이터베이스에서)
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!currentUser) {
        setNotifications([]);
        setUnreadCount(0);
        return;
      }

      try {
        // 모든 알림 타입을 병렬로 가져오기
        const [
          announcementsResult,
          communityLikesResult,
          communityCommentsResult,
          rewardPurchasesResult,
          artistApprovalsResult,
          journalistApprovalsResult,
          pointEarningsResult,
          pointNotificationsResult
        ] = await Promise.all([
          // 공지사항
          supabase
            .from("gallery_notification")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(20),

          // 커뮤니티 좋아요 알림
          supabase
            .from("community_likes")
            .select("*")
            .neq("user_id", currentUser.id)
            .order("created_at", { ascending: false })
            .limit(10),

          // 커뮤니티 댓글 알림
          supabase
            .from("community_comments")
            .select("*")
            .neq("user_id", currentUser.id)
            .order("created_at", { ascending: false })
            .limit(10),

          // 리워드샵 구매 알림
          supabase
            .from("reward_purchases")
            .select("*")
            .eq("user_id", currentUser.id)
            .order("created_at", { ascending: false })
            .limit(10),

          // 작가 승인 알림
          supabase
            .from("profiles")
            .select("*")
            .eq("id", currentUser.id)
            .eq("isArtistApproval", true)
            .single(),

          // 기자단 승인 알림
          supabase
            .from("journalist_applications")
            .select("*")
            .eq("user_id", currentUser.id)
            .eq("status", "approved")
            .order("created_at", { ascending: false })
            .limit(5),

          // 포인트 획득 알림
          supabase
            .from("community_post")
            .select("*")
            .eq("user_id", currentUser.id)
            .order("created_at", { ascending: false })
            .limit(10),

          // 포인트 알림
          supabase
            .from("user_notifications")
            .select("*")
            .eq("user_id", currentUser.id)
            .in("type", ["point_approved", "point_rejected", "point_re_review"])
            .order("created_at", { ascending: false })
            .limit(20)
        ]);

        // 모든 알림을 통합하여 하나의 배열로 만들기
        const allNotifications = [];
        let unreadCount = 0;

        // 공지사항 추가
        if (announcementsResult.data) {
          for (const announcement of announcementsResult.data) {
            // 공지사항 읽음 상태 확인
            const { data: readStatus } = await supabase
              .from('user_notifications')
              .select('is_read')
              .eq('user_id', currentUser.id)
              .eq('type', 'announcement_read')
              .eq('related_id', `announcement_${announcement.id}`)
              .single();

            const isRead = readStatus?.is_read || false;
            if (!isRead) unreadCount++;

            allNotifications.push({
              id: `announcement_${announcement.id}`,
              type: "announcement",
              title: announcement.title,
              message: announcement.description,
              created_at: announcement.created_at,
              is_read: isRead
            });
          }
        }

        // 커뮤니티 좋아요 알림 추가
        if (communityLikesResult.data) {
          communityLikesResult.data.forEach(like => {
            const isRead = like.is_read || false;
            if (!isRead) unreadCount++;
            
            allNotifications.push({
              id: `like_${like.id}`,
              type: "like",
              title: "새로운 좋아요",
              message: `누군가 게시글에 좋아요를 눌렀습니다.`,
              created_at: like.created_at,
              is_read: isRead
            });
          });
        }

        // 커뮤니티 댓글 알림 추가
        if (communityCommentsResult.data) {
          communityCommentsResult.data.forEach(comment => {
            const isRead = comment.is_read || false;
            if (!isRead) unreadCount++;
            
            allNotifications.push({
              id: `comment_${comment.id}`,
              type: "comment",
              title: "새로운 댓글",
              message: `누군가 게시글에 댓글을 남겼습니다.`,
              created_at: comment.created_at,
              is_read: isRead
            });
          });
        }

        // 리워드샵 구매 알림 추가
        if (rewardPurchasesResult.data) {
          rewardPurchasesResult.data.forEach(purchase => {
            const isRead = purchase.is_read || false;
            if (!isRead) unreadCount++;
            
            allNotifications.push({
              id: `reward_${purchase.id}`,
              type: "reward_purchase",
              title: "리워드 구매 완료",
              message: `리워드 구매가 완료되었습니다.`,
              created_at: purchase.created_at,
              is_read: isRead
            });
          });
        }

        // 작가 승인 알림 추가
        if (artistApprovalsResult.data && artistApprovalsResult.data.isArtistApproval) {
          const { data: artistReadStatus } = await supabase
            .from('user_notifications')
            .select('is_read')
            .eq('user_id', currentUser.id)
            .eq('type', 'artist_approved')
            .eq('related_id', `artist_approved_${currentUser.id}`)
            .single();

          const isRead = artistReadStatus?.is_read || false;
          if (!isRead) unreadCount++;

          allNotifications.push({
            id: `artist_approved_${currentUser.id}`,
            type: "artist_approved",
            title: "작가 승인 완료",
            message: "축하합니다! 작가 승인이 완료되었습니다.",
            created_at: artistApprovalsResult.data.updated_at,
            is_read: isRead
          });
        }

        // 기자단 승인 알림 추가
        if (journalistApprovalsResult.data) {
          for (const application of journalistApprovalsResult.data) {
            const { data: journalistReadStatus } = await supabase
              .from('user_notifications')
              .select('is_read')
              .eq('user_id', currentUser.id)
              .eq('type', 'journalist_approved')
              .eq('related_id', `journalist_${application.id}`)
              .single();

            const isRead = journalistReadStatus?.is_read || false;
            if (!isRead) unreadCount++;

            allNotifications.push({
              id: `journalist_${application.id}`,
              type: "journalist_approved",
              title: "기자단 승인 완료",
              message: "축하합니다! 기자단 승인이 완료되었습니다.",
              created_at: application.created_at,
              is_read: isRead
            });
          }
        }

        // 포인트 획득 알림 추가
        if (pointEarningsResult.data) {
          for (const post of pointEarningsResult.data) {
            const { data: pointReadStatus } = await supabase
              .from('user_notifications')
              .select('is_read')
              .eq('user_id', currentUser.id)
              .eq('type', 'point_earned')
              .eq('related_id', `point_${post.id}`)
              .single();

            const isRead = pointReadStatus?.is_read || false;
            if (!isRead) unreadCount++;

            allNotifications.push({
              id: `point_${post.id}`,
              type: "point_earned",
              title: "포인트 획득",
              message: `게시글 작성으로 포인트를 획득했습니다.`,
              created_at: post.created_at,
              is_read: isRead
            });
          }
        }

        // 포인트 알림 추가
        if (pointNotificationsResult.data) {
          pointNotificationsResult.data.forEach(notification => {
            const isRead = notification.is_read || false;
            if (!isRead) unreadCount++;

            allNotifications.push({
              id: `point_notification_${notification.id}`,
              type: notification.type,
              title: notification.type === "point_approved" ? "포인트 적립 완료" : 
                     notification.type === "point_rejected" ? "포인트 적립 거부" : "포인트 재검토 요청",
              message: notification.message,
              created_at: notification.created_at,
              is_read: isRead
            });
          });
        }

        setNotifications(allNotifications);
        setUnreadCount(unreadCount);
      } catch (error) {
        console.log("알림 가져오기 오류:", error);
        setNotifications([]);
        setUnreadCount(0);
      }
    };

    fetchNotifications();

    // 실시간 알림 구독
    if (currentUser) {
      const channel = supabase
        .channel('user-notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_notifications',
            filter: `user_id=eq.${currentUser.id}`
          },
          (payload) => {
            console.log('알림 변경:', payload);
            fetchNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [currentUser]);

  // 검색 기능
  const handleSearch = async (searchTerm) => {
    if (!searchTerm.trim()) {
      setCurrentExhibitions([]);
      setCurrentGallery([]);
      setCurrentShowSearchResults(false);
      return;
    }

    try {
      const supabase = createClient();
      
      // 전시회 검색 - 제목과 내용에서 검색
      const { data: exhibitionsData, error: exhibitionsError } = await supabase
        .from('exhibition')
        .select('*')
        .ilike('contents', `%${searchTerm}%`)
        .limit(5);

      // 커뮤니티 검색
      const { data: communityData, error: communityError } = await supabase
        .from('community_post')
        .select('*')
        .ilike('title', `%${searchTerm}%`)
        .limit(5);

      console.log('검색 결과:', { exhibitionsData, communityData, exhibitionsError, communityError });

      if (!exhibitionsError) {
        setCurrentExhibitions(exhibitionsData || []);
      } else {
        console.error('전시회 검색 오류:', exhibitionsError);
        setCurrentExhibitions([]);
      }

      if (!communityError) {
        setCurrentGallery(communityData || []);
      } else {
        console.error('커뮤니티 검색 오류:', communityError);
        setCurrentGallery([]);
      }
      
      setCurrentShowSearchResults(true);
    } catch (error) {
      console.error("Search error:", error);
      setCurrentExhibitions([]);
      setCurrentGallery([]);
    }
  };

  // 검색어 변경 시 검색 실행
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(currentSearch);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [currentSearch]);

  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from("user_notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (!error) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, is_read: true }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.log("읽음 처리 오류:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from("user_notifications")
        .update({ is_read: true })
        .eq("user_id", currentUser.id)
        .eq("is_read", false);

      if (!error) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, is_read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.log("전체 읽음 처리 오류:", error);
    }
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const notificationTime = new Date(dateString);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return "방금 전";
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}일 전`;
    
    return notificationTime.toLocaleDateString();
  };

  const handleLinkClick = () => {
    setCurrentShowSearchResults(false);
    setCurrentSearch("");
  };

  // 검색창 외부 클릭 시 검색 결과 숨기기
  const handleClickOutside = (e) => {
    if (!e.target.closest('.search-container')) {
      setCurrentShowSearchResults(false);
    }
  };

  useEffect(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  return (
    <>
      {/* 상단 네비게이션 바 */}
      <div className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* 홈 버튼 - 좌측 */}
            <Link href="/" className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-all duration-200 group">
              <FiHome className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
            </Link>

            {/* 검색바 - 중앙 */}
            <div className="flex-1 max-w-xl mx-8 relative search-container">
              <div className="relative">
                <input
                  type="text"
                  placeholder="리뷰 쓰고 무료티켓 얻기!"
                  value={currentSearch}
                  onChange={(e) => setCurrentSearch(e.target.value)}
                  onFocus={() => currentSearch.trim() && setCurrentShowSearchResults(true)}
                  className="w-full px-5 py-3 pl-12 pr-5 bg-gray-50 hover:bg-white focus:bg-white rounded-full text-sm border border-transparent hover:border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all duration-200 placeholder-gray-400"
                />
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              
              {/* 검색 결과 */}
              {currentShowSearchResults && currentSearch.trim() && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-xl z-30 max-h-80 overflow-y-auto backdrop-blur-md">
                  {currentExhibitions.length > 0 && (
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">전시회</h3>
                      <div className="space-y-2">
                        {currentExhibitions.map((exhibition) => (
                          <Link
                            key={exhibition.id}
                            href={`/exhibition/${exhibition.id}`}
                            onClick={handleLinkClick}
                            className="block p-3 hover:bg-gray-50 rounded-xl transition-colors"
                          >
                       <p className="text-sm font-medium text-gray-900">{exhibition.contents}</p>
                       <p className="text-xs text-gray-500 mt-1">{exhibition.name}</p>
                       {exhibition.naver_gallery_url?.name && (
                         <p className="text-xs text-blue-600 mt-1">📍 {exhibition.naver_gallery_url.name}</p>
                       )}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {currentGallery.length > 0 && (
                    <div className="p-4 border-t border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">커뮤니티</h3>
                      <div className="space-y-2">
                        {currentGallery.map((communityItem) => (
                          <Link
                            key={communityItem.id}
                            href={`/community/${communityItem.id}`}
                            onClick={handleLinkClick}
                            className="block p-3 hover:bg-gray-50 rounded-xl transition-colors"
                          >
                            <p className="text-sm font-medium text-gray-900">{communityItem.title}</p>
                            <p className="text-xs text-gray-500 mt-1">{communityItem.content?.substring(0, 80)}...</p>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* 검색 결과가 없을 때 */}
                  {currentExhibitions.length === 0 && currentGallery.length === 0 && (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      검색 결과가 없습니다.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 알림 아이콘 또는 로그인 버튼 - 우측 */}
            <div className="flex items-center">
              {currentUser ? (
                <div className="relative">
                  <button
                    onClick={() => setNotificationBarOpen(true)}
                    className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-all duration-200 group relative"
                  >
                    <FiBell className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors" />
                    {unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center font-bold shadow-sm">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </div>
                    )}
                  </button>
                </div>
              ) : (
                <Link href="/mypage">
                  <button className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-all duration-200">
                    로그인
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 새로운 알림바 */}
      <NotificationBar 
        isOpen={notificationBarOpen} 
        onClose={() => setNotificationBarOpen(false)} 
      />
    </>
  );
}
