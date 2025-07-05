"use client";
import React from "react";
import { Button, Card, CardBody, Divider, Image, Spinner } from "@heroui/react";
import { FaChevronLeft } from "react-icons/fa";
import { useRouter } from "next/navigation";
import MagazineCarousel from "./components/magazine-carousel";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import {FaArrowLeft} from "react-icons/fa";
import { motion } from "framer-motion";
import { useRouter as useNav } from "next/navigation";
import Link from "next/link";

export default function page({ params }) {
  const magazineId = React.use(params).id;
  const [magazine, setMagazine] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();
  console.log('Supabase client created with URL', process.env.NEXT_PUBLIC_SUPABASE_URL);
  const [otherMags, setOtherMags] = useState([]);
  
  // util functions for pseudo view count (same as magazineList)
  const hashStr = (s) => { let h = 0; for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; } return Math.abs(h); };
  const calcViews = (item) => {
    const base = 1000 + (hashStr(item.id.toString()) % 9000); // 1,000 ~ 9,999
    const days = Math.floor((Date.now() - new Date(item.created_at).getTime()) / 864e5);
    const daily = (hashStr(item.id.toString() + "x") % 50); // 0~49 증가폭
    const calculated = base + days * daily + (item.real_views || 0);
    return Math.min(calculated, 10000);
  };

  // record unique view (only if logged in)
  const recordView = async (mag) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mag) return;
      const insertRes = await supabase
        .from('magazine_real_views')
        .insert({ magazine_id: mag.id, user_id: user.id }, { ignoreDuplicates: true })
        .select();
      if (insertRes.data && insertRes.data.length > 0) {
        await supabase.from('magazine')
          .update({ real_views: (mag.real_views || 0) + 1 })
          .eq('id', mag.id);
      }
    } catch (e) { console.log('record view error', e); }
  };

  const fetchOtherMagazines = async () => {
    let others = [];
    const { data, error } = await supabase
      .from('magazine')
      .select('*')
      .not('id', 'eq', magazineId)
      .limit(20);

    if (error) {
      console.log('neq filter error, falling back to full fetch', error);
      const fallback = await supabase
        .from('magazine')
        .select('id,title,photo,subtitle,category,created_at,real_views');
      others = (fallback.data || []);
    } else {
      others = data || [];
    }

    // exclude current magazine id just in case
    others = others.filter(m => m.id !== magazineId);

    if (others.length === 0) {
      setOtherMags([]);
      return;
    }

    console.log('others raw (post-filter)', others);
    others.sort(() => 0.5 - Math.random());
    setOtherMags(others.slice(0, 4));
  };

  const getMagazineData = async() => {
    try {
      const {data, error} = await supabase.from('magazine').select('*').eq('id', magazineId).single();
      setMagazine(data);
      fetchOtherMagazines();
      recordView(data);
    } catch (error) {
      console.log("매거진 데이터 로드 중 오류:", error);
    } finally {
      setLoading(false);
    }
  }
  
  useEffect(() => {
    // 페이지 진입 시 최상단으로 스크롤
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    getMagazineData();
  }, []);

  useEffect(() => {
    if(!loading && typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [loading]);

  // fetch other mags independently if magazineId changes
  useEffect(() => {
    if (magazineId) {
      fetchOtherMagazines();
    }
  }, [magazineId]);

  console.log('magazine:',magazine);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-screen">
        <Spinner variant="wave" size="lg" color="primary" />
      </div>
    );
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="flex flex-col items-center justify-center"
    >
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white flex items-center w-full h-12"
      >
        <div className="w-12 flex justify-start items-center">
          <Button
            isIconOnly
            variant="light"
            onPress={() => router.back()}
          >
            <FaArrowLeft className="text-xl" />
          </Button>
        </div>
        <h2 className="flex-1 text-lg font-bold text-center">매거진</h2>
        <div className="w-12" />
      </motion.div>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="w-[100%] flex flex-col gap-4"
      >
        <MagazineCarousel magazine={magazine}/>
      </motion.div>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4 }}
        className="flex flex-col gap-2 my-2 w-[100%] mb-8 px-8"
      >
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-[20px] font-bold"
        >
          {magazine.title}
        </motion.div>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="flex items-center justify-between w-full"
        >
          <div className="text-[15px] font-medium text-gray-500 flex items-center">
            {magazine.subtitle === '전시나그네' && (
              <a href="https://www.instagram.com/exhibition_wanderer/" target="_blank" rel="noopener noreferrer">
                <span className="inline-block w-7 h-7 rounded-full bg-white shadow-lg mr-1 flex items-center justify-center">
                  <img src="https://teaelrzxuigiocnukwha.supabase.co/storage/v1/object/public/notification//imgi_1_272626601_246980864252824_1484718971353683993_n.jpg" alt="author" className="w-5 h-5 rounded-full object-cover" style={{margin: '2px'}} />
                </span>
              </a>
            )}
            {magazine.subtitle}
          </div>
          <div className="text-[10px] text-[#494949] whitespace-nowrap ml-2">
            작성일 :{" "}{new Date(magazine.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </motion.div>
        <Divider orientation="horizontal" className="w-full my-2"/>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="text-[14px] text-black"
        >
          {/<[a-z][\s\S]*>/i.test(magazine.contents) || magazine.contents?.includes('<') ? (
            <div dangerouslySetInnerHTML={{ __html: magazine.contents
              .replace(/Powered by/g, '')
              .replace(/<a[^>]*froala[^>]*>.*?<\/a>/gi, '') }} />
          ) : (
            magazine.contents
          )}
        </motion.div>
      </motion.div>
      <motion.div
        initial={{opacity:0,y:20}}
        animate={{opacity:1,y:0}}
        transition={{duration:0.6,delay:1}}
        className="w-full px-8 mb-24"
      >
        <Divider orientation="horizontal" className="w-full my-4" />
        <h4 className="text-base font-bold mb-3">다른 매거진</h4>
        <div className="flex flex-col gap-4">
          {otherMags.map(m=> (
            <Link key={m.id} href={`/magazine/${m.id}`} className="flex items-center gap-4 w-[90%]">
              <div className="flex-shrink-0 w-[96px] h-[96px] relative rounded-lg overflow-hidden border border-gray-200">
                {m.photo?.[0]?.url && (
                  <Image src={m.photo[0].url} alt={m.title} fill sizes="50vw" className="object-cover" />
                )}
              </div>
              <div className="flex flex-col space-y-1 flex-1 min-w-0">
                {m.category && (
                  <div className="text-xs font-bold text-gray-500 truncate">{m.category}</div>
                )}
                <h3 className="text-[15px] font-bold text-black leading-tight line-clamp-2 break-keep">{m.title}</h3>
                <div className="flex flex-row items-center gap-2">
                  {m.subtitle && (
                    <span className="flex items-center text-[12px] text-gray-500 truncate">
                      {m.subtitle === '전시나그네' && (
                        <span className="inline-block w-7 h-7 rounded-full bg-white shadow-lg mr-1 flex items-center justify-center">
                          <img src="https://teaelrzxuigiocnukwha.supabase.co/storage/v1/object/public/notification//imgi_1_272626601_246980864252824_1484718971353683993_n.jpg" alt="author" className="w-5 h-5 rounded-full object-cover" style={{margin: '2px'}} />
                        </span>
                      )}
                      {m.subtitle}
                    </span>
                  )}
                  <span className="text-[12px] text-gray-400">·</span>
                  <span className="text-[12px] text-gray-400 truncate">
                    {new Date(m.created_at).getFullYear()}년 {new Date(m.created_at).getMonth() + 1}월 {new Date(m.created_at).getDate()}일
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
