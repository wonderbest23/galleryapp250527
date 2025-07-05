"use client";
import { useEffect, useState, Suspense } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button, Divider, Spinner } from "@heroui/react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { HiOutlineClock, HiOutlineTag, HiOutlineUser, HiOutlineEye, HiOutlineStar } from "react-icons/hi";
import classNames from "classnames";

const PAGE_SIZE = 10;

function CommunityPageContent() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [bestPosts, setBestPosts] = useState([]);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [searchField, setSearchField] = useState(searchParams.get("field") || "title_content");
  const [keyword, setKeyword] = useState(searchParams.get("q") || "");
  const [currentUser, setCurrentUser] = useState(null);
  const [tab, setTab] = useState("all");

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);

      // 베스트 5개 (likes>=10)
      const {
        data: best,
        error: bestErr,
      } = await supabase
        .from("community_post")
        .select("*, comments:community_comment(count)")
        .gte("likes", 10)
        .order("likes", { ascending: false })
        .limit(5);

      if (bestErr) console.log("bestErr", bestErr);
      setBestPosts(best || []);

      // 글 목록 (탭에 따라 달라짐)
      let query = supabase
        .from("community_post")
        .select("*, comments:community_comment(count)", { count: "exact" })
        .order("created_at", { ascending: false });

      if (tab === "notice") {
        query = query.eq("category", "공지");
      }

      // 검색
      if (keyword) {
        if (searchField === "title") query = query.ilike("title", `%${keyword}%`);
        else if (searchField === "content") query = query.ilike("content", `%${keyword}%`);
        else query = query.or(`title.ilike.%${keyword}%,content.ilike.%${keyword}%`);
      }

      const { data: list, error: listErr, count } = tab === "best"
        ? { data: [], error: null, count: 0 }
        : await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      if (listErr) console.log("listErr", listErr);
      setPosts(list || []);
      setTotalCount(count || 0);
      setIsLoading(false);
    };
    fetchPosts();
  }, [page, tab]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setCurrentUser(session.user);
    };
    fetchUser();
  }, []);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // reset page to 1 when tab changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    router.push(`/community?${params.toString()}`);
  }, [tab]);

  const changePage = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage);
    router.push(`/community?${params.toString()}`);
  };

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (keyword) params.set("q", keyword); else params.delete("q");
    params.set("field", searchField);
    params.set("page", "1");
    router.push(`/community?${params.toString()}`);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-[600px] mx-auto px-4 py-6 pb-32">
      <div className="w-full flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold pl-1">커뮤니티</h1>
      </div>

      {/* 탭 선택 */}
      <div className="flex items-center gap-6 border-b w-full mb-3 text-[15px] font-medium">
        {['all','best','notice'].map(t=> (
          <button key={t} onClick={()=>setTab(t)} className={classNames("relative py-2", tab===t?"text-blue-600":"text-gray-600")}>{t==='all'?'전체':t==='best'?'베스트':'공지'}
            {tab===t && <span className="absolute left-0 -bottom-[1px] h-[2px] w-full bg-blue-600" />}
          </button>
        ))}
      </div>

      {/* 베스트 */}
      {tab!=='notice' && bestPosts.length > 0 && tab!=='best' && (
        <div className="w-full mb-2">
          <ul className="flex flex-col gap-1 list-none">
            {bestPosts.map((p) => (
              <li key={p.id} className="bg-[#eef7ff] hover:bg-[#e0f0ff] border border-blue-200 rounded-sm px-3 py-2">
                <Link href={`/community/${p.id}`} className="flex flex-col gap-[2px]">
                  {/* 1st row */}
                  <div className="flex items-center gap-1 text-[14px]">
                    <span className="inline-block bg-blue-500 text-white text-[11px] px-1 py-[1px] rounded-sm">베스트</span>
                    <span className="font-medium break-keep">{p.title}</span>
                    {p.comments?.[0]?.count > 0 && <span className="text-gray-400 text-[12px]">[{p.comments[0].count}]</span>}
                  </div>
                  {/* 2nd row */}
                  <div className="flex items-center gap-2 text-[11px] text-gray-600">
                    <HiOutlineClock className="w-3 h-3" />{new Date(p.created_at).toLocaleDateString("ko-KR")}
                    <HiOutlineTag className="w-3 h-3" />{p.category || "커뮤니티"}
                    <HiOutlineUser className="w-3 h-3" />{p.nickname || "익명"}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 목록 */}
      {tab==='best' && (
        <ul className="w-full flex flex-col gap-[2px] list-none">
          {bestPosts.map((p)=>(
            <li key={p.id} className="border-b border-gray-200 first:border-t px-3 py-[7px] hover:bg-gray-50">
              <Link href={`/community/${p.id}`} className="flex flex-col gap-[2px]">
                <div className="flex items-center gap-1 text-[14px]">
                  <span className="font-medium break-keep">{p.title}</span>
                  {p.comments?.[0]?.count>0 && <span className="text-gray-400 text-[12px]">[{p.comments[0].count}]</span>}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-gray-600">
                  <HiOutlineClock className="w-3 h-3" />{new Date(p.created_at).toLocaleDateString("ko-KR")}
                  <HiOutlineTag className="w-3 h-3" />{p.category || "커뮤니티"}
                  <HiOutlineUser className="w-3 h-3" />{p.nickname || "익명"}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* 일반/공지 글 */}
      {tab!=='best' && (isLoading ? (
        <Spinner variant="wave" />
      ) : (
        <ul className="w-full flex flex-col gap-[2px] list-none mt-0">
          {posts.map((p) => (
            <li key={p.id} className="border-b border-gray-200 first:border-t px-3 py-[7px] hover:bg-gray-50">
              <Link href={`/community/${p.id}`} className="flex flex-col gap-[2px]">
                <div className="flex items-center gap-1 text-[14px]">
                  <span className="font-medium break-keep">{p.title}</span>
                  {p.comments?.[0]?.count>0 && <span className="text-gray-400 text-[12px]">[{p.comments[0].count}]</span>}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-gray-600">
                  <HiOutlineClock className="w-3 h-3" />{new Date(p.created_at).toLocaleDateString("ko-KR")}
                  <HiOutlineTag className="w-3 h-3" />{p.category || "커뮤니티"}
                  <HiOutlineUser className="w-3 h-3" />{p.nickname || "익명"}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ))}

      {/* 검색바 */}
      <div className="flex items-center gap-2 w-full border p-2 rounded">
        <select value={searchField} onChange={(e)=>setSearchField(e.target.value)} className="border px-2 py-1 text-sm rounded">
          <option value="title_content">제목+내용</option>
          <option value="title">제목</option>
          <option value="content">내용</option>
        </select>
        <input value={keyword} onChange={(e)=>setKeyword(e.target.value)} placeholder="검색어" className="flex-grow border px-2 py-1 text-sm rounded" />
        <button onClick={handleSearch} className="border px-4 py-1 text-sm rounded bg-gray-100 hover:bg-gray-200">검색</button>
      </div>

      {/* 액션 버튼 */}
      <div className="flex justify-between w-full mt-3">
        <button className="border px-4 py-1 text-sm rounded bg-white hover:bg-gray-50">인기글</button>
        <button
          className="px-4 py-1 text-sm rounded bg-green-500 hover:bg-green-600 text-white flex items-center gap-1"
          onClick={() => {
            if (currentUser) {
              router.push('/community/write');
            } else {
              router.push('/mypage?redirect_to=/community/write');
            }
          }}
        >
          ✏️ 쓰기
        </button>
      </div>

      {/* 페이지네이션 */}
      <div className="flex flex-col items-center gap-3 mt-4 w-full">
        <div className="flex items-center gap-2">
          <button className="border px-3 py-1 text-sm rounded bg-white hover:bg-gray-50" disabled={page===1} onClick={()=>changePage(page-1)}>이전</button>
          {Array.from({ length: totalPages }, (_, i)=>i+1).slice(0,5).map(num=>(
            <button key={num} onClick={()=>changePage(num)} className={`border px-3 py-1 text-sm rounded ${num===page?"bg-gray-200 font-semibold":"bg-white hover:bg-gray-50"}`}>{num}</button>
          ))}
          <button className="border px-3 py-1 text-sm rounded bg-white hover:bg-gray-50" disabled={page===totalPages} onClick={()=>changePage(page+1)}>다음</button>
        </div>
        <div className="text-sm">{page} / {totalPages}</div>
      </div>
    </div>
  );
}

export default function CommunityPage() {
  return (
    <Suspense>
      <CommunityPageContent />
    </Suspense>
  );
} 