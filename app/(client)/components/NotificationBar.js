"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { motion } from "framer-motion";
import { 
  Bell, 
  Calendar, 
  Eye, 
  Search, 
  X, 
  Heart, 
  MessageCircle, 
  Gift, 
  UserCheck, 
  Award,
  Star,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export default function NotificationBar({ isOpen, onClose, onRead }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [filterType, setFilterType] = useState("unread"); // all, unread, announcements, community, rewards, approvals
  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      fetchAllNotifications();
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
    // 검색 및 필터링
    let filtered = notifications;

    // 타입 필터링
    if (filterType !== "all") {
      filtered = filtered.filter(notification => {
        switch (filterType) {
          case "unread":
            return !notification.is_read;
          case "announcements":
            return notification.type === "announcement";
          case "community":
            return ["like", "comment", "follow"].includes(notification.type);
          case "rewards":
            return ["point_earned", "reward_purchase", "point_approved", "point_rejected", "point_re_review"].includes(notification.type);
          case "approvals":
            return ["artist_approved", "journalist_approved"].includes(notification.type);
          default:
            return true;
        }
      });
    }

    // 검색 필터링
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(notification =>
        notification.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredNotifications(filtered);
  }, [searchTerm, notifications, filterType]);

  const fetchAllNotifications = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setNotifications([]);
        setFilteredNotifications([]);
        return;
      }

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
          .select(`
            *,
            gallery:gallery_id (
              name,
              url
            )
          `)
          .order("created_at", { ascending: false })
          .limit(20),

        // 커뮤니티 좋아요 알림
        supabase
          .from("community_likes")
          .select(`
            *,
            post:community_post (
              title,
              user_id
            ),
            liker:profiles!community_likes_user_id_fkey (
              full_name,
              artist_name
            )
          `)
          .neq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),

        // 커뮤니티 댓글 알림
        supabase
          .from("community_comments")
          .select(`
            *,
            post:community_post (
              title,
              user_id
            ),
            commenter:profiles!community_comments_user_id_fkey (
              full_name,
              artist_name
            )
          `)
          .neq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),

        // 리워드샵 구매 알림
        supabase
          .from("reward_purchases")
          .select(`
            *,
            item:reward_items (
              name,
              description
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),

        // 작가 승인 알림
        supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .eq("isArtistApproval", true)
          .single(),

        // 기자단 승인 알림
        supabase
          .from("journalist_applications")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "approved")
          .order("created_at", { ascending: false })
          .limit(5),

        // 포인트 획득 알림 (게시글 작성 등)
        supabase
          .from("community_post")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10),

        // 포인트 알림 (user_notifications 테이블)
        supabase
          .from("user_notifications")
          .select("*")
          .eq("user_id", user.id)
          .in("type", ["point_approved", "point_rejected", "point_re_review"])
          .order("created_at", { ascending: false })
          .limit(20)
      ]);

      // 읽음 상태 맵 한 번에 조회(좋아요/댓글/리워드)
      const { data: readRows } = await supabase
        .from('user_notifications')
        .select('type, related_id, is_read')
        .eq('user_id', user.id)
        .in('type', ['like_read','comment_read','reward_purchase_read','announcement_read','artist_approved','journalist_approved','point_earned']);
      const readMap = new Map((readRows || []).map(r => [r.related_id, !!r.is_read]));

      // 모든 알림을 통합하여 하나의 배열로 만들기
      const allNotifications = [];

      // 공지사항 추가
      if (announcementsResult.data) {
        for (const announcement of announcementsResult.data) {
          // 공지사항 읽음 상태 확인
          const isRead = readMap.get(`announcement_${announcement.id}`) || false;

          allNotifications.push({
            id: `announcement_${announcement.id}`,
            type: "announcement",
            title: announcement.title,
            message: announcement.description,
            created_at: announcement.created_at,
            is_read: isRead,
            link_url: announcement.url,
            gallery: announcement.gallery,
            image: announcement.image
          });
        }
      }

      // 커뮤니티 좋아요 알림 추가
      if (communityLikesResult.data) {
        communityLikesResult.data.forEach(like => {
          if (like.post && like.liker) {
            const isRead = readMap.get(`like_${like.id}`) || false;
            allNotifications.push({
              id: `like_${like.id}`,
              type: "like",
              title: "새로운 좋아요",
              message: `${like.liker.artist_name || like.liker.full_name}님이 "${like.post.title}" 게시글에 좋아요를 눌렀습니다.`,
              created_at: like.created_at,
              is_read: isRead,
              link_url: `/community/${like.post.id}`
            });
          }
        });
      }

      // 커뮤니티 댓글 알림 추가
      if (communityCommentsResult.data) {
        communityCommentsResult.data.forEach(comment => {
          if (comment.post && comment.commenter) {
            const isRead = readMap.get(`comment_${comment.id}`) || false;
            allNotifications.push({
              id: `comment_${comment.id}`,
              type: "comment",
              title: "새로운 댓글",
              message: `${comment.commenter.artist_name || comment.commenter.full_name}님이 "${comment.post.title}" 게시글에 댓글을 남겼습니다.`,
              created_at: comment.created_at,
              is_read: isRead,
              link_url: `/community/${comment.post.id}`
            });
          }
        });
      }

      // 리워드샵 구매 알림 추가
      if (rewardPurchasesResult.data) {
        rewardPurchasesResult.data.forEach(purchase => {
          if (purchase.item) {
            const isRead = readMap.get(`reward_${purchase.id}`) || false;
            allNotifications.push({
              id: `reward_${purchase.id}`,
              type: "reward_purchase",
              title: "리워드 구매 완료",
              message: `${purchase.item.name} 구매가 완료되었습니다.`,
              created_at: purchase.created_at,
              is_read: isRead,
              link_url: "/mypage/success"
            });
          }
        });
      }

      // 작가 승인 알림 추가
      if (artistApprovalsResult.data && artistApprovalsResult.data.isArtistApproval) {
        // 작가 승인 알림 읽음 상태 확인
        const { data: artistReadStatus } = await supabase
          .from('user_notifications')
          .select('is_read')
          .eq('user_id', user.id)
          .eq('type', 'artist_approved')
          .eq('related_id', `artist_approved_${user.id}`)
          .single();

        allNotifications.push({
          id: `artist_approved_${user.id}`,
          type: "artist_approved",
          title: "작가 승인 완료",
          message: "축하합니다! 작가 승인이 완료되었습니다.",
          created_at: artistApprovalsResult.data.updated_at,
          is_read: artistReadStatus?.is_read || false,
          link_url: "/mypage/success"
        });
      }

      // 기자단 승인 알림 추가
      if (journalistApprovalsResult.data) {
        for (const application of journalistApprovalsResult.data) {
          // 기자단 승인 알림 읽음 상태 확인
          const { data: journalistReadStatus } = await supabase
            .from('user_notifications')
            .select('is_read')
            .eq('user_id', user.id)
            .eq('type', 'journalist_approved')
            .eq('related_id', `journalist_${application.id}`)
            .single();

          allNotifications.push({
            id: `journalist_${application.id}`,
            type: "journalist_approved",
            title: "기자단 승인 완료",
            message: "축하합니다! 기자단 승인이 완료되었습니다.",
            created_at: application.created_at,
            is_read: journalistReadStatus?.is_read || false,
            link_url: "/mypage/success"
          });
        }
      }

      // 포인트 획득 알림 추가
      if (pointEarningsResult.data) {
        for (const post of pointEarningsResult.data) {
          // 포인트 획득 알림 읽음 상태 확인
          const { data: pointReadStatus } = await supabase
            .from('user_notifications')
            .select('is_read')
            .eq('user_id', user.id)
            .eq('type', 'point_earned')
            .eq('related_id', `point_${post.id}`)
            .single();

          allNotifications.push({
            id: `point_${post.id}`,
            type: "point_earned",
            title: "포인트 획득",
            message: `"${post.title}" 게시글 작성으로 10P를 획득했습니다.`,
            created_at: post.created_at,
            is_read: pointReadStatus?.is_read || false,
            link_url: `/community/${post.id}`
          });
        }
      }

      // 포인트 알림 추가 (user_notifications 테이블)
      if (pointNotificationsResult.data) {
        pointNotificationsResult.data.forEach(notification => {
          allNotifications.push({
            id: `point_notification_${notification.id}`,
            type: notification.type,
            title: notification.type === "point_approved" ? "포인트 적립 완료" : 
                   notification.type === "point_rejected" ? "포인트 적립 거부" : "포인트 재검토 요청",
            message: notification.message,
            created_at: notification.created_at,
            is_read: notification.is_read,
            link_url: "/mypage/success",
            details: notification.details,
            related_id: notification.related_id
          });
        });
      }

      // 날짜순으로 정렬
      allNotifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setNotifications(allNotifications);
      setFilteredNotifications(allNotifications);
    } catch (error) {
      console.log("알림을 가져오는 중 오류 발생:", error);
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

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const notificationTime = new Date(dateString);
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return "방금 전";
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    
    // 30일이 넘으면 달 단위로 표시
    if (diffInDays >= 30) {
      const diffInMonths = Math.floor(diffInDays / 30);
      return `${diffInMonths}달 전`;
    }
    
    return `${diffInDays}일 전`;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "announcement":
        return <Bell className="w-5 h-5 text-yellow-600" />;
      case "like":
        return <Heart className="w-5 h-5 text-red-500" />;
      case "comment":
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case "reward_purchase":
        return <Gift className="w-5 h-5 text-purple-500" />;
      case "artist_approved":
        return <UserCheck className="w-5 h-5 text-green-500" />;
      case "journalist_approved":
        return <Award className="w-5 h-5 text-indigo-500" />;
      case "point_earned":
        return <Star className="w-5 h-5 text-yellow-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "announcement":
        return "bg-yellow-50 border-yellow-200";
      case "like":
        return "bg-red-50 border-red-200";
      case "comment":
        return "bg-blue-50 border-blue-200";
      case "reward_purchase":
        return "bg-purple-50 border-purple-200";
      case "artist_approved":
        return "bg-green-50 border-green-200";
      case "journalist_approved":
        return "bg-indigo-50 border-indigo-200";
      case "point_earned":
        return "bg-yellow-50 border-yellow-200";
      case "point_approved":
        return "bg-green-50 border-green-200";
      case "point_rejected":
        return "bg-red-50 border-red-200";
      case "point_re_review":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getNotificationTypeLabel = (type) => {
    switch (type) {
      case "announcement":
        return "공지사항";
      case "like":
        return "좋아요";
      case "comment":
        return "댓글";
      case "reward_purchase":
        return "리워드";
      case "artist_approved":
        return "작가승인";
      case "journalist_approved":
        return "기자단승인";
      case "point_earned":
        return "포인트";
      case "point_approved":
        return "포인트승인";
      case "point_rejected":
        return "포인트거부";
      case "point_re_review":
        return "포인트재검토";
      default:
        return "알림";
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      // DB에 읽음 상태 저장
      await markNotificationAsRead(notification);
      
      // 로컬 상태 갱신: 읽음으로 전환
      setNotifications(prev => {
        const next = prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n);
        if (filterType === 'unread') {
          return next.filter(n => !n.is_read);
        }
        return next;
      });
      setFilteredNotifications(prev => {
        const next = prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n);
        if (filterType === 'unread') {
          return next.filter(n => !n.is_read);
        }
        return next;
      });
      
      if (notification.link_url) {
        window.location.href = notification.link_url;
      }
      // 클릭(확인) 시 알림바 닫기
      if (typeof onClose === 'function') onClose();
      // 상위에서 뱃지/상태 갱신 필요 시 콜백
      if (typeof onRead === 'function') onRead(notification);
    } catch (error) {
      console.log('알림 읽음 처리 오류:', error);
    }
  };

  // 전체 확인(읽지 않음 모두 읽음 처리 후 비우기)
  const handleMarkAllRead = async () => {
    try {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => markNotificationAsRead(n)));
      const allRead = notifications.map(n => ({ ...n, is_read: true }));
      setNotifications(filterType === 'unread' ? [] : allRead);
      setFilteredNotifications(filterType === 'unread' ? [] : allRead);
      if (typeof onRead === 'function') {
        onRead({ id: '__all__', type: 'all_read' });
      }
    } catch (e) {
      console.log('전체 확인 처리 오류:', e);
    }
  };

  const markNotificationAsRead = async (notification) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 알림 타입별로 적절한 테이블에 읽음 상태 저장
    switch (notification.type) {
      case "announcement":
        // 공지사항은 읽음 상태를 별도 테이블에 저장
        await supabase
          .from('user_notifications')
          .upsert({
            user_id: user.id,
            type: 'announcement_read',
            title: notification.title,
            message: notification.message,
            is_read: true,
            related_id: notification.id,
            created_at: new Date().toISOString()
          }, { onConflict: 'user_id,type,related_id' });
        break;
        
      case "like":
        // 좋아요 알림 읽음 처리 - user_notifications에 upsert
        await supabase
          .from('user_notifications')
          .upsert({
            user_id: user.id,
            type: 'like_read',
            title: notification.title,
            message: notification.message,
            is_read: true,
            related_id: notification.id,
            created_at: new Date().toISOString()
          }, { onConflict: 'user_id,type,related_id' });
        break;
        
      case "comment":
        // 댓글 알림 읽음 처리 - user_notifications에 upsert
        await supabase
          .from('user_notifications')
          .upsert({
            user_id: user.id,
            type: 'comment_read',
            title: notification.title,
            message: notification.message,
            is_read: true,
            related_id: notification.id,
            created_at: new Date().toISOString()
          }, { onConflict: 'user_id,type,related_id' });
        break;
        
      case "reward_purchase":
        // 리워드 구매 알림 읽음 처리 - user_notifications에 upsert
        await supabase
          .from('user_notifications')
          .upsert({
            user_id: user.id,
            type: 'reward_purchase_read',
            title: notification.title,
            message: notification.message,
            is_read: true,
            related_id: notification.id,
            created_at: new Date().toISOString()
          }, { onConflict: 'user_id,type,related_id' });
        break;
        
      case "artist_approved":
        // 작가 승인 알림 읽음 처리
        await supabase
          .from('user_notifications')
          .upsert({
            user_id: user.id,
            type: 'artist_approved',
            title: notification.title,
            message: notification.message,
            is_read: true,
            related_id: notification.id,
            created_at: new Date().toISOString()
          }, { onConflict: 'user_id,type,related_id' });
        break;
        
      case "journalist_approved":
        // 기자단 승인 알림 읽음 처리
        await supabase
          .from('user_notifications')
          .upsert({
            user_id: user.id,
            type: 'journalist_approved',
            title: notification.title,
            message: notification.message,
            is_read: true,
            related_id: notification.id,
            created_at: new Date().toISOString()
          }, { onConflict: 'user_id,type,related_id' });
        break;
        
      case "point_earned":
        // 포인트 획득 알림 읽음 처리
        await supabase
          .from('user_notifications')
          .upsert({
            user_id: user.id,
            type: 'point_earned',
            title: notification.title,
            message: notification.message,
            is_read: true,
            related_id: notification.id,
            created_at: new Date().toISOString()
          }, { onConflict: 'user_id,type,related_id' });
        break;
        
      default:
        // 기타 알림들
        if (notification.related_id) {
          await supabase
            .from('user_notifications')
            .update({ is_read: true })
            .eq('id', notification.related_id);
        }
        break;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/20" onClick={onClose}></div>
      
      {/* 팝업 컨텐츠 */}
      <div className="relative w-full max-w-5xl mx-4 mb-4">
        <motion.div
          initial={typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? false : { opacity: 0, y: 50 }}
          animate={typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? false : { opacity: 1, y: 0 }}
          exit={typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? false : { opacity: 0, y: 50 }}
          transition={{ duration: 0.3 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl max-h-[85vh] sm:max-h-[75vh] overflow-y-auto shadow-2xl"
        >
          {/* 팝업 헤더 */}
          <div className="flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10 border-b border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center">
                <Bell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">알림</h2>
                <p className="text-sm text-gray-600">모든 알림 및 공지사항</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{notifications.length}</div>
                <div className="text-xs text-gray-500">전체 알림</div>
              </div>
              <button onClick={handleMarkAllRead} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">전체 확인</button>
            </div>
          </div>

          {/* 콘텐츠 영역 */}
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="text-center space-y-3">
                  <progress />
                  <p className="text-gray-600">알림을 불러오는 중...</p>
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
                    placeholder="알림 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* 필터 버튼들 */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "all", label: "전체" },
                    { id: "unread", label: "읽지 않음" },
                    { id: "announcements", label: "공지사항" },
                    { id: "community", label: "커뮤니티" },
                    { id: "rewards", label: "리워드" },
                    { id: "approvals", label: "승인" }
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      onClick={() => setFilterType(filter.id)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        filterType === filter.id
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                {/* 알림 목록 */}
                {filteredNotifications.length > 0 ? (
                  <div className="space-y-4">
                    {filteredNotifications.map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <div 
                          className={`bg-white rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden ${getNotificationColor(notification.type)}`}
                        >
                          <div className="p-6">
                            {/* 알림 헤더 */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                                  {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-lg font-bold text-gray-900 line-clamp-2">
                                      {notification.title}
                                    </h3>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getNotificationColor(notification.type)}`}>
                                      {getNotificationTypeLabel(notification.type)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-4 h-4" />
                                      <span>{getTimeAgo(notification.created_at)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* 읽지 않은 알림 표시 */}
                              {!notification.is_read && (
                                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                              )}
                            </div>

                            {/* 알림 내용 */}
                            <div className="mb-4">
                              <p className="text-gray-700 leading-relaxed line-clamp-3">
                                {notification.message}
                              </p>
                            </div>

                            {/* 갤러리 정보 (공지사항인 경우) */}
                            {notification.type === "announcement" && notification.gallery && (
                              <div className="mb-4">
                                <div className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-xs font-medium inline-block">
                                  {notification.gallery.name}
                                </div>
                              </div>
                            )}

                            {/* 알림 이미지 (공지사항인 경우) */}
                            {notification.type === "announcement" && notification.image && (
                              <div className="mb-4">
                                <div className="relative w-full h-48 bg-gray-100 rounded-xl overflow-hidden">
                                  <img
                                    src={notification.image}
                                    alt={notification.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.style.display = 'none';
                                    }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* 확인 버튼 */}
                            <div className="flex justify-end">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleNotificationClick(notification);
                                }}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                <CheckCircle className="w-4 h-4" />
                                확인
                              </button>
                            </div>

                            {/* 포인트 알림 상세 정보 */}
                            {["point_approved", "point_rejected", "point_re_review"].includes(notification.type) && notification.details && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{notification.details}</p>
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
                      {searchTerm || filterType !== "all" ? '검색 결과가 없습니다' : '알림이 없습니다'}
                    </h3>
                    <p className="text-gray-500">
                      {searchTerm || filterType !== "all" ? '다른 검색어로 시도해보세요' : '새로운 알림을 기다려주세요'}
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
