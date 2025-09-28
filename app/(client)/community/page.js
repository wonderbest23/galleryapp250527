"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { FiHome, FiSearch, FiBell, FiHeart, FiMessageCircle, FiShare2, FiMoreVertical } from "react-icons/fi";
import Link from "next/link";
import Image from "next/image";
import { useDisclosure } from "@heroui/react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@heroui/react";
import TopNavigation from "../components/TopNavigation";

// 샘플 데이터 함수
const getSamplePosts = () => [
  {
    id: 1,
    title: "테스트글작성",
    content: "테스트에요",
    user_id: "test-user-1",
    profiles: { name: "아트앤브릿지", avatar_url: null },
    created_at: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(),
    likes: 0,
    comments: 0,
    category: "all"
  },
  {
    id: 2,
    title: "이번전시회 볼만한없을까요?",
    content: "커뮤니티 페이지에 \"더보기\" 기능을 추가했습니다. 이제 150자 이상의 긴 글에는 자동으로 \"더보기...\" 버튼이 나타나고, 클릭하면 전체 내용을 볼 수 있으며, \"접기\" 버튼으로 다시 축소할 수 있습니다. 커뮤니티 페이지의 사용자 경험이 훨씬 개선되었습니다. 이 기능은 긴 글을 읽기 편하게 만들어주며, 피드의 깔끔함도 유지할 수 있습니다. 앞으로도 더 많은 기능을 추가할 예정입니다.",
    user_id: "test-user-2",
    profiles: { name: "아트앤브릿지", avatar_url: null },
    created_at: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(),
    likes: 5,
    comments: 3,
    category: "exhibition"
  },
  {
    id: 3,
    title: "전시 관람 후기",
    content: "방금 다녀온 전시회가 정말 인상적이었습니다. 작가의 새로운 시도와 표현 방식이 돋보였고, 특히 색감과 구도가 매우 인상적이었습니다. 전시장 분위기도 좋았고, 관람객들도 많아서 활기찬 분위기였습니다. 다음에도 이런 전시회가 열리면 꼭 가보고 싶습니다.",
    user_id: "test-user-3",
    profiles: { name: "박관람객", avatar_url: null },
    created_at: new Date(Date.now() - 17 * 60 * 60 * 1000).toISOString(),
    likes: 156,
    comments: 23,
    category: "exhibition"
  },
  {
    id: 4,
    title: "오늘의 작업실",
    content: "새로운 작품 작업 중입니다! 여러분의 의견이 궁금해요. 어떤 색감이 더 좋을까요? 추상적인 표현과 구체적인 표현 중 어떤 것이 더 매력적일까요? 작가로서 항상 고민이 많습니다.",
    user_id: "test-user-4",
    profiles: { name: "김작가", avatar_url: null },
    created_at: new Date(Date.now() - 17 * 60 * 60 * 1000).toISOString(),
    likes: 24,
    comments: 5,
    category: "artwork"
  },
  {
    id: 5,
    title: "처음 작품 구매해봤어요",
    content: "아트샵에서 김작가님의 추상화를 구매했습니다. 처음으로 원화를 구매해보는 경험이었는데, 정말 신기하고 설레는 경험이었습니다. 집에 걸어놓으니 분위기가 완전히 달라졌어요!",
    user_id: "test-user-5",
    profiles: { name: "신규컬렉터", avatar_url: null },
    created_at: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
    likes: 23,
    comments: 12,
    category: "artwork"
  },
  {
    id: 6,
    title: "전시회 관람 팁 공유",
    content: "전시회 갈 때 꼭 오디오 가이드를 들으세요! 작가의 의도와 작품의 배경을 이해하는 데 정말 도움이 됩니다. 그리고 평일 오전에 가시면 사람이 적어서 여유롭게 관람할 수 있어요.",
    user_id: "test-user-6",
    profiles: { name: "문화애호가", avatar_url: null },
    created_at: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
    likes: 22,
    comments: 7,
    category: "discussion"
  }
];

export default function CommunityPage() {
  const supabase = createClient();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [expandedPosts, setExpandedPosts] = useState(new Set());
  
  // 상단 네비게이션바 관련 상태
  const [search, setSearch] = useState("");
  const [exhibitions, setExhibitions] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [notificationDisclosure, setNotificationDisclosure] = useState({ isOpen: false, onOpen: () => {}, onClose: () => {} });
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from("community_post")
          .select(`
            *,
            profiles:user_id(name, avatar_url)
          `)
          .order("created_at", { ascending: false });

        if (activeTab !== "all") {
          query = query.eq("category", activeTab);
        }

        if (sortBy === "popular") {
          query = query.order("likes", { ascending: false });
        }

        const { data, error } = await query.limit(20);

        if (error) {
          console.error("Error fetching posts:", error);
          // 에러 시 샘플 데이터 사용
          setPosts(getSamplePosts());
        } else {
          // 실제 데이터가 있으면 사용, 없으면 샘플 데이터 사용
          if (data && data.length > 0) {
            setPosts(data);
          } else {
            setPosts(getSamplePosts());
          }
        }
      } catch (error) {
        console.error("Error:", error);
        setPosts(getSamplePosts());
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [activeTab, sortBy]);

  const getTimeAgo = (createdAt) => {
    const now = new Date();
    const postTime = new Date(createdAt);
    const diffInHours = Math.floor((now - postTime) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "방금 전";
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}일 전`;
  };

  const toggleExpanded = (postId) => {
    setExpandedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const shouldShowMoreButton = (content) => {
    return content && content.length > 150;
  };

  const getDisplayContent = (post) => {
    if (!post.content) return "";
    
    if (expandedPosts.has(post.id) || !shouldShowMoreButton(post.content)) {
      return post.content;
    }
    
    return post.content.substring(0, 150) + "...";
  };

  const tabs = [
    { id: "all", label: "전체" },
    { id: "exhibition", label: "전시회" },
    { id: "artwork", label: "작품" },
    { id: "shortform", label: "숏폼" },
    { id: "discussion", label: "토론" }
  ];

  const sortTabs = [
    { id: "latest", label: "최신순" },
    { id: "popular", label: "인기순" }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-16">
        <div className="bg-white border-b border-gray-200">
          <div className="px-4 py-4">
            <h1 className="text-xl font-bold text-gray-900">커뮤니티</h1>
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-white p-4 shadow-sm animate-pulse">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="ml-3">
                  <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
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
              {showSearchResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">전시회</h3>
                    {exhibitions.length > 0 ? (
                      <div className="space-y-2">
                        {exhibitions.slice(0, 3).map((item) => (
                          <Link
                            key={item.id}
                            href={`/exhibition/${item.id}`}
                            className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg"
                            onClick={() => setShowSearchResults(false)}
                          >
                            <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                              <span className="text-xs">🎨</span>
                            </div>
                            <span className="text-sm">{item.name}</span>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 p-2">검색 결과가 없습니다</div>
                    )}
                  </div>

                  <div className="border-t border-gray-200 my-2"></div>

                  <div className="p-3">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">갤러리</h3>
                    {gallery.length > 0 ? (
                      <div className="space-y-2">
                        {gallery.slice(0, 3).map((item) => (
                          <Link
                            key={item.id}
                            href={`/gallery/${item.id}`}
                            className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg"
                            onClick={() => setShowSearchResults(false)}
                          >
                            <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                              <span className="text-xs">🏛️</span>
                            </div>
                            <span className="text-sm">{item.title || item.contents}</span>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 p-2">검색 결과가 없습니다</div>
                    )}
                  </div>
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

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
        <div className="px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">커뮤니티</h1>
        </div>
        
        {/* Primary Tabs */}
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-sm font-medium ${
                activeTab === tab.id
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Secondary Tabs */}
        <div className="flex border-b border-gray-200">
          {sortTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSortBy(tab.id)}
              className={`flex-1 py-3 text-sm font-medium ${
                sortBy === tab.id
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Posts Feed */}
      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="bg-white p-4 shadow-sm">
            {/* Post Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">아트</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {post.profiles?.name || "익명"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {getTimeAgo(post.created_at)}
                  </p>
                </div>
              </div>
              <button className="p-1">
                <FiMoreVertical className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Post Title */}
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              {post.title}
            </h2>

            {/* Post Content */}
            <div className="text-gray-900 mb-3">
              <p className="whitespace-pre-wrap">
                {getDisplayContent(post)}
              </p>
              {shouldShowMoreButton(post.content) && (
                <button
                  onClick={() => toggleExpanded(post.id)}
                  className="text-blue-600 text-sm mt-1"
                >
                  {expandedPosts.has(post.id) ? "접기" : "더보기..."}
                </button>
              )}
            </div>

            {/* Post Actions */}
            <div className="flex items-center space-x-4 pt-3 border-t border-gray-100">
              <button className="flex items-center space-x-1">
                <FiHeart className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-500">{post.likes || 0}</span>
              </button>
              <button className="flex items-center space-x-1">
                <FiMessageCircle className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-500">{post.comments || 0}</span>
              </button>
              <button className="flex items-center space-x-1">
                <FiShare2 className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
        ))}
        
        {posts.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">아직 게시글이 없습니다.</p>
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