import React, { useState, useEffect } from "react";
import { Button, Card, CardBody, Spinner } from "@heroui/react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import { FaRegBookmark, FaBookmark } from "react-icons/fa";
import { Skeleton } from "@heroui/react";
import { motion } from "framer-motion";
// 북마크 아이콘을 위한 별도 컴포넌트
const BookmarkIcon = ({ isBookmarked, onClick }) => {
  const handleClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    onClick(e);
    return false;
  };

  const handleMouseDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    return false;
  };

  return (
    <div 
      className="absolute bottom-2 right-2 cursor-pointer z-10"
      onClick={handleClick}
      onMouseDown={handleMouseDown}
    >
      {isBookmarked ? (
        <FaBookmark className="bg-gray-500 opacity-40 text-red-500 h-6 w-6 rounded-lg p-1.5" />
      ) : (
        <FaRegBookmark className="bg-gray-500 text-white opacity-40 h-6 w-6 rounded-lg p-1.5" />
      )}
    </div>
  );
};

// 애니메이션 변수 정의
const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.5 }
};

export default function TopArts() {
  const [categories, setCategories] = useState([
    { id: 1, name: "추천상품", selected: true, genre: null },
    { id: 2, name: "현대미술", selected: false, genre: "현대미술" },
    { id: 3, name: "추상화", selected: false, genre: "추상화" },
    { id: 4, name: "명화/동양화", selected: false, genre: "명화/동양화" },
    { id: 5, name: "사진/일러스트", selected: false, genre: "사진/일러스트" },
    { id: 6, name: "기타", selected: false, genre: "기타" },
  ]);
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [artItems, setArtItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useState({});
  const [user, setUser] = useState(null);
  const router = useRouter();
  const supabase = createClient();

  console.log('categories:', categories)
  console.log('selectedCategory:', selectedCategory)
  useEffect(() => {
    // 현재 로그인한 사용자 정보 가져오기
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      }
    };

    fetchUser();
    fetchProducts();
  }, [categories]);

  useEffect(() => {
    // 사용자가 로그인했을 때만 북마크 정보 가져오기
    if (user) {
      fetchBookmarks();
    }
  }, [user]);

  const fetchBookmarks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("bookmark")
        .select("*")
        .eq("user_id", user.id);

      if (error) {
        console.log("북마크 정보 조회 오류:", error);
        return;
      }

      // 북마크 상태를 객체로 변환하여 저장 (product_id를 키로 사용)
      const bookmarkMap = {};
      data.forEach(bookmark => {
        bookmarkMap[bookmark.product_id] = bookmark.id;
      });
      setBookmarks(bookmarkMap);
    } catch (error) {
      console.log("북마크 조회 중 오류 발생:", error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const selectedCategory = categories.find(category => category.selected);
      
      let query = supabase
        .from("product")
        .select("*, artist_id(*)")
        .order("created_at", { ascending: false })
        .limit(4);
      
      // 카테고리별 필터 적용
      if (selectedCategory.id === 1) {
        // 추천상품 - isRecommended가 true인 상품만 필터링
        query = query.eq('isRecommended', true);
      } else if (selectedCategory.genre) {
        // 다른 카테고리 - 해당 장르 필터링
        query = query.not('artist_id', 'is', null)
                     .ilike('artist_id.artist_genre', selectedCategory.genre);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching products:", error);
        return;
      }
      
      setArtItems(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (clickedId) => {
    setCategories(
      categories.map((category) => ({
        ...category,
        selected: category.id === clickedId,
      }))
    );
    setSelectedCategory(categories.find(category => category.id === clickedId));
  };
  console.log('artItems:', artItems)

  const toggleBookmark = async (productId) => {
    if (!user) {
      // 로그인되지 않은 경우 로그인 페이지로 이동
      router.push('/mypage?redirect_to=/artstore');
      return;
    }

    try {
      if (bookmarks[productId]) {
        // 이미 북마크가 있으면 삭제
        const { error } = await supabase
          .from("bookmark")
          .delete()
          .eq("id", bookmarks[productId]);

        if (error) {
          console.log("북마크 삭제 오류:", error);
          return;
        }

        // 북마크 상태 업데이트
        const updatedBookmarks = { ...bookmarks };
        delete updatedBookmarks[productId];
        setBookmarks(updatedBookmarks);
      } else {
        // 북마크가 없으면 새로 추가
        const { data, error } = await supabase
          .from("bookmark")
          .insert([
            { user_id: user.id, product_id: productId }
          ])
          .select();

        if (error) {
          console.log("북마크 추가 오류:", error);
          return;
        }

        // 북마크 상태 업데이트
        setBookmarks({
          ...bookmarks,
          [productId]: data[0].id
        });
      }
    } catch (error) {
      console.log("북마크 토글 중 오류 발생:", error);
    }
  };

  const handleBookmarkClick = (e, productId) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    toggleBookmark(productId);
    return false;
  };

  const navigateToProduct = (productId) => {
    router.push(`/product/${productId}`);
  };

  return (
    <div className="flex flex-col justify-center items-center w-[90%] h-full ">
      <div className="w-full h-full grid grid-cols-3 grid-rows-2 gap-2 mt-4">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={category.selected ? "default" : "outline"}
            className={`h-8 rounded-full px-3 py-[9px] whitespace-nowrap text-[13px] font-normal ${
              category.selected
                ? "bg-[#0042e0] text-white "
                : "bg-[#f1f5f5] text-[#0a2533]"
            }`}
            style={{ fontFamily: "'Noto Sans KR-Regular', Helvetica" }}
            onClick={() => handleCategoryClick(category.id)}
          >
            {category.name}
          </Button>
        ))}
      </div>
      <div className="w-full grid grid-cols-2 gap-6 mt-4 justify-items-center">
        {loading ? (
          <>
            <Skeleton className="h-[200px] w-full rounded-lg" />
            <Skeleton className="h-[200px] w-full rounded-lg" />
            <Skeleton className="h-[200px] w-full rounded-lg" />
            <Skeleton className="h-[200px] w-full rounded-lg" />
          </>
        ) : artItems.length > 0 ? (
          <motion.div 
            className="w-full grid grid-cols-2 gap-6 col-span-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {artItems.map((item) => (
              <motion.div key={item.id}>
                <Card className="rounded-lg overflow-hidden w-full cursor-pointer" shadow="none">
                  <div className="relative w-full aspect-[157/200]" onClick={() => navigateToProduct(item.id)}>
                    <Image
                      src={item.image[0] || "/noimage.jpg"} 
                      alt="image"
                      className="object-contain bg-white rounded-lg"
                      fill
                      quality={30}
                      priority={false}
                      placeholder="blur"
                      blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNlMmU4ZjAiLz48L3N2Zz4="
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <BookmarkIcon 
                      isBookmarked={!!bookmarks[item.id]} 
                      onClick={(e) => handleBookmarkClick(e, item.id)} 
                    />
                  </div>
                  <CardBody className="p-0 mt-2" onClick={() => navigateToProduct(item.id)}>
                    <p className="text-[14px] font-medium line-clamp-1 text-[#606060]">{item.title}</p>
                    <p className="text-[10px] text-[#606060]">{item.artist_id?.name || "알 수 없음"}</p>
                    <p className="text-[14px] text-black font-bold mt-1">₩{item.price?.toLocaleString()}</p>
                  </CardBody>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <p className="col-span-2 text-center">표시할 상품이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
