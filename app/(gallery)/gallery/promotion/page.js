"use client";
import React, { useEffect, useState } from "react";
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Tabs, Tab, Spinner } from "@heroui/react";
import { createClient } from "@/utils/supabase/client";
import useUserInfoStore from "../store/userInfo";

export default function PromotionPage() {
  const supabase = createClient();
  const { userInfo } = useUserInfoStore();

  const [loading, setLoading] = useState(true);
  const [exhibitionIds, setExhibitionIds] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [galleryReviews, setGalleryReviews] = useState([]);
  const [exhibitionReviews, setExhibitionReviews] = useState([]);

  // 1) 갤러리 전시 목록 → exhibitionIds
  useEffect(() => {
    const fetchData = async () => {
      if (!userInfo?.url && !userInfo?.id) return;
      setLoading(true);
      try {
        // 전시 목록
        const { data: exList } = await supabase
          .from("exhibition")
          .select("id")
          .eq("naver_gallery_url", userInfo.url);
        const ids = exList ? exList.map((e) => e.id) : [];
        setExhibitionIds(ids);

        // 티켓 구매자
        if (ids.length > 0) {
          const { data: ticketsData } = await supabase
            .from("payment_ticket")
            .select("id, user_id, created_at, exhibition_id, status")
            .in("exhibition_id", ids)
            .order("created_at", { ascending: false });
          setTickets(ticketsData || []);
        }

        // 리뷰(갤러리)
        const { data: gReviews } = await supabase
          .from("gallery_review")
          .select("id, user_id, created_at, rating, description")
          .eq("gallery_id", userInfo.id);
        setGalleryReviews(gReviews || []);

        // 리뷰(전시)
        if (ids.length > 0) {
          const { data: eReviews } = await supabase
            .from("exhibition_review")
            .select("id, user_id, created_at, rating, description")
            .in("exhibition_id", ids);
          setExhibitionReviews(eReviews || []);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userInfo]);

  if (!userInfo?.id) {
    return (
      <div className="p-8">갤러리 정보를 불러오는 중입니다...</div>
    );
  }

  return (
    <div className="w-full h-full p-8">
      <h1 className="text-2xl font-bold mb-6 mt-16 sm:mt-0">프로모션</h1>
      <p className="text-gray-600 mb-6">관람객·리뷰 작성자 등 기존 고객에게 프로모션 메시지를 발송할 수 있는 메뉴입니다. 현재 베타 버전이며 발송 버튼은 비활성화되어 있습니다.</p>

      {loading ? (
        <div className="flex justify-center items-center h-32"><Spinner/></div>
      ) : (
        <Tabs aria-label="promo-tabs" color="primary" variant="underlined">
          <Tab key="tickets" title={`티켓 구매자 (${tickets.length})`}>
            <Table aria-label="티켓 구매자">
              <TableHeader>
                <TableColumn>구매자 ID</TableColumn>
                <TableColumn>구매일시</TableColumn>
                <TableColumn>상태</TableColumn>
              </TableHeader>
              <TableBody>
                {tickets.map(t=>(
                  <TableRow key={t.id}>
                    <TableCell>{t.user_id}</TableCell>
                    <TableCell>{new Date(t.created_at).toLocaleString()}</TableCell>
                    <TableCell>{t.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Tab>
          <Tab key="greview" title={`갤러리 리뷰 (${galleryReviews.length})`}>
            <Table aria-label="갤러리 리뷰">
              <TableHeader>
                <TableColumn>작성자</TableColumn>
                <TableColumn>별점</TableColumn>
                <TableColumn>작성일</TableColumn>
              </TableHeader>
              <TableBody>
                {galleryReviews.map(r=>(
                  <TableRow key={r.id}>
                    <TableCell>{r.user_id}</TableCell>
                    <TableCell>{r.rating}</TableCell>
                    <TableCell>{new Date(r.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Tab>
          <Tab key="ereview" title={`전시 리뷰 (${exhibitionReviews.length})`}>
            <Table aria-label="전시 리뷰">
              <TableHeader>
                <TableColumn>작성자</TableColumn>
                <TableColumn>별점</TableColumn>
                <TableColumn>작성일</TableColumn>
              </TableHeader>
              <TableBody>
                {exhibitionReviews.map(r=>(
                  <TableRow key={r.id}>
                    <TableCell>{r.user_id}</TableCell>
                    <TableCell>{r.rating}</TableCell>
                    <TableCell>{new Date(r.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Tab>
        </Tabs>
      )}

      <div className="mt-8 p-4 border rounded bg-gray-100 text-gray-500 text-sm">
        알림톡 발송 기능은 현재 비활성화되어 있습니다. 추후 유료 서비스로 제공될 예정입니다.
      </div>
    </div>
  );
} 