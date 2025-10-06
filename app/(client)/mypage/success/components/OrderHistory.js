"use client";
import React, { useEffect, useState } from "react";
import { Button, Card, CardBody, Spinner, Divider, Badge, Chip } from "@heroui/react";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import { FaPlus, FaTicketAlt } from "react-icons/fa";
import Link from "next/link";
import { FaCalendar } from "react-icons/fa6";
import { FaMoneyBillWaveAlt } from "react-icons/fa";
import { HiOutlineTicket, HiOutlineSparkles } from "react-icons/hi";
import dayjs from "dayjs";
import { motion } from "framer-motion";
import { useToast } from "@/utils/toast";

const OrderHistory = ({ user, onClose }) => {
  // 팝업이 열릴 때 body 스크롤 방지 (데스크톱만)
  useEffect(() => {
    // 모바일에서는 body 스크롤을 막지 않음
    if (window.innerWidth > 768) {
      document.body.style.overflow = 'hidden';
    }
    
    // 컴포넌트 언마운트 시 스크롤 복원
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleOrders, setVisibleOrders] = useState(4);
  const [showExpired, setShowExpired] = useState(false);
  const [showUsed, setShowUsed] = useState(false);
  const { error: toastError } = useToast();

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const supabase = createClient();
        
        // payment_ticket 테이블에서 사용자 주문 내역과 exhibition 정보 함께 가져오기
        // 무료티켓(0원)은 used도 노출, 유료티켓은 success만 노출
        const { data: ticketData, error: ticketError } = await supabase
          .from('payment_ticket')
          .select('*, exhibition_id(*)')
          .order('created_at', { ascending: false })
          .eq("user_id", user.id)
        
        if (ticketError) {
          console.log("주문 내역을 가져오는 중 오류가 발생했습니다:", ticketError);
          return;
        }
        
        console.log('ticketData:', ticketData)
        setOrders(ticketData || []);
      } catch (error) {
        console.log("주문 내역을 가져오는 중 오류가 발생했습니다:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const loadMoreOrders = () => {
    setVisibleOrders(prevVisible => prevVisible + 3);
  };

  if (loading) {
    return (
      <div className="w-full">
        {/* 헤더 섹션 - 반 팝업 형태 */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 mb-6 border border-gray-200/50 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                <HiOutlineTicket className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">나의 예매</h2>
                <p className="text-sm text-gray-600">예매한 전시회 티켓을 확인하세요</p>
              </div>
            </div>
            
            <div className="flex justify-center items-center py-8">
              <Spinner size="lg" color="primary" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="w-full">
        {/* 헤더 섹션 - 반 팝업 형태 */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 mb-6 border border-gray-200/50 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                <HiOutlineTicket className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">나의 예매</h2>
                <p className="text-sm text-gray-600">예매한 전시회 티켓을 확인하세요</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">0</div>
              <div className="text-xs text-gray-500">예매한 티켓</div>
            </div>
          </div>
        </div>

        {/* 빈 상태 */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl p-12 border border-gray-200/50 shadow-sm">
          <div className="text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaTicketAlt className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">예매한 티켓이 없습니다</h3>
            <p className="text-gray-500 mb-6">첫 번째 전시회 티켓을 예매해보세요!</p>
            <Button
              color="primary"
              startContent={<HiOutlineSparkles />}
              onPress={() => window.location.href = '/'}
              className="px-8"
            >
              전시회 둘러보기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 티켓 분류
  const today = dayjs().startOf('day');
  
  const activeOrders = orders.filter(order => {
    const endDate = order.exhibition_id?.end_date ? dayjs(order.exhibition_id.end_date).endOf('day') : null;
    const isExpired = endDate && today.isAfter(endDate, 'day');
    return order.status !== 'used' && !isExpired;
  }).sort((a, b) => {
        const aEnd = a.exhibition_id?.end_date ? new Date(a.exhibition_id.end_date) : new Date(8640000000000000);
        const bEnd = b.exhibition_id?.end_date ? new Date(b.exhibition_id.end_date) : new Date(8640000000000000);
        return aEnd - bEnd;
  });

  const expiredOrders = orders.filter(order => {
    const endDate = order.exhibition_id?.end_date ? dayjs(order.exhibition_id.end_date).endOf('day') : null;
    const isExpired = endDate && today.isAfter(endDate, 'day');
    return order.status !== 'used' && isExpired;
  }).sort((a, b) => {
    const aEnd = a.exhibition_id?.end_date ? new Date(a.exhibition_id.end_date) : new Date(0);
    const bEnd = b.exhibition_id?.end_date ? new Date(b.exhibition_id.end_date) : new Date(0);
    return bEnd - aEnd; // 최근 종료된 것부터
  });

  const usedOrders = orders.filter(order => order.status === 'used')
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/20" onClick={onClose}></div>
      
      {/* 팝업 컨텐츠 */}
      <div className="relative w-full max-w-5xl mx-4 mb-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl max-h-[85vh] sm:max-h-[75vh] overflow-y-auto shadow-2xl">
          {/* 팝업 헤더 */}
          <div className="flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10 border-b border-gray-200 p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                  <HiOutlineTicket className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">나의 예매</h2>
                  <p className="text-sm text-gray-600 leading-relaxed">예매한 전시회 티켓을 확인하세요</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
                    <div className="text-xs text-gray-500">전체 티켓</div>
                  </div>
                  <div className="w-px h-8 bg-gray-300"></div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-emerald-600">{activeOrders.length}</div>
                    <div className="text-xs text-gray-500">사용 가능</div>
                  </div>
                  <div className="w-px h-8 bg-gray-300"></div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-orange-600">{expiredOrders.length}</div>
                    <div className="text-xs text-gray-500">종료됨</div>
                  </div>
                </div>
                
                         <button
                           onClick={onClose}
                           className="text-gray-500 hover:text-gray-700 p-2"
                         >
                           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                           </svg>
                         </button>
              </div>
          </div>

          <div className="p-6">
            <div className="space-y-6">
              {/* 인트로 섹션 */}
              <div className="bg-white/90 backdrop-blur-md rounded-2xl p-6 border border-gray-200/50 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                    <HiOutlineTicket className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">나의 예매</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">예매한 전시회 티켓을 확인하세요</p>
                  </div>
                </div>
              </div>

              {/* 사용 가능한 티켓 */}
              {activeOrders.length > 0 && (
                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">사용 가능한 티켓</h3>
                    <Chip color="success" variant="flat" size="sm">
                      {activeOrders.length}개
                    </Chip>
                  </div>
          
                  {activeOrders.slice(0, visibleOrders).map((order, index) => {
                    const today = dayjs();
                    const endDate = order.exhibition_id?.end_date ? dayjs(order.exhibition_id.end_date) : null;
                    const daysLeft = endDate ? endDate.diff(today, 'day') : null;

                    return (
                      <motion.div
                        key={order.order_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <Link
                          href={`/mypage/order-detail?order_id=${order.order_id}&exhibition_id=${order.exhibition_id.id}&user_id=${user.id}&people_count=${order.people_count}&amount=${order.amount}&created_at=${encodeURIComponent(order.created_at)}`}
                          className="w-full no-underline"
                        >
                          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all duration-300 hover:-translate-y-1">
                            {/* 전시회 이미지 영역 */}
                            <div className="relative h-32 bg-gradient-to-br from-orange-50 to-red-50">
                              {order.exhibition_id && order.exhibition_id.photo ? (
                                <Image
                                  src={order.exhibition_id.photo}
                                  alt={order.exhibition_id.contents || "전시회 이미지"}
                                  fill
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <div className="w-16 h-16 bg-white/80 rounded-full flex items-center justify-center shadow-sm">
                                    <HiOutlineTicket className="w-8 h-8 text-orange-500" />
                                  </div>
                                </div>
                              )}
                              
                              {/* 상태 배지 */}
                              <div className="absolute top-3 right-3">
                                {daysLeft !== null && daysLeft >= 0 && (
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-500 text-white shadow-sm">
                                    종료 {daysLeft}일 전
                                  </span>
                                )}
                              </div>
                              
                              {/* 티켓 아이콘 */}
                              <div className="absolute bottom-3 left-3">
                                <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
                                  <HiOutlineTicket className="w-3 h-3 text-blue-500" />
                                  <span className="text-xs font-medium text-gray-700">{order.people_count}명</span>
                                </div>
                              </div>
                            </div>

                            {/* 티켓 정보 영역 */}
                            <div className="p-5">
                              <div className="mb-4">
                                <h3 className="font-bold text-gray-900 text-lg mb-2 leading-tight">
                                  {order.exhibition_id?.contents || "알 수 없는 전시회"}
                                </h3>
                                <p className="text-sm text-gray-500 leading-relaxed">
                                  예매일: {new Date(order.created_at).toLocaleDateString('ko-KR')}
                                </p>
                              </div>

                              {/* 결제 정보 */}
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                                      <FaMoneyBillWaveAlt className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                      <div className="text-xl font-bold text-gray-900">
                                        {Number(order.amount).toLocaleString()}
                                      </div>
                                      <div className="text-xs text-gray-500">원</div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="text-right">
                                  <div className="text-sm font-medium text-gray-700">인원</div>
                                  <div className="text-lg font-bold text-blue-600">{order.people_count}명</div>
                                </div>
                              </div>

                              {/* 티켓 확인 버튼 */}
                              <div className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-sm transition-all duration-200 hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center gap-2">
                                <HiOutlineTicket className="w-4 h-4" />
                                티켓 확인하기
                              </div>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
      </div>
              )}

              {/* 종료된 티켓 토글 */}
              {expiredOrders.length > 0 && (
                <div className="mb-6">
                  <Button
                    variant="flat"
                    color="default"
                    onPress={() => setShowExpired(!showExpired)}
                    className="w-full justify-between"
                    endContent={
                      <svg 
                        className={`w-4 h-4 transition-transform ${showExpired ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    }
                  >
                    <div className="flex items-center gap-2">
                      <span>종료된 티켓</span>
                      <Chip color="default" variant="flat" size="sm">
                        {expiredOrders.length}개
                      </Chip>
                    </div>
                  </Button>
                </div>
              )}

              {/* 종료된 티켓 목록 */}
              {showExpired && expiredOrders.length > 0 && (
                <div className="space-y-4 mb-8">
                  {expiredOrders.map((order, index) => {
                    const endDate = order.exhibition_id?.end_date ? dayjs(order.exhibition_id.end_date) : null;
                    const daysSinceEnd = endDate ? dayjs().diff(endDate, 'day') : null;

            return (
                      <motion.div
                key={order.order_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <Card 
                          className="w-full bg-gray-50/95 backdrop-blur-sm opacity-75"
                          shadow="sm"
                        >
                          <CardBody className="p-0">
                            <div className="flex gap-4 p-4">
                              {/* 전시회 이미지 */}
                              <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden">
                                {order.exhibition_id && order.exhibition_id.photo ? (
                                  <Image
                                    src={order.exhibition_id.photo}
                                    alt={order.exhibition_id.contents || "전시회 이미지"}
                                    fill
                                    className="object-cover grayscale"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                                    <span className="text-gray-500 text-xs">이미지 없음</span>
                                  </div>
                                )}
                              </div>
                              
                              {/* 티켓 정보 */}
                              <div className="flex flex-col flex-1 min-w-0">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-600 truncate text-lg">
                                      {order.exhibition_id?.contents || "알 수 없는 전시회"}
                                    </h3>
                                    <p className="text-sm text-gray-400 mt-1">
                                      {order.people_count}명 • {new Date(order.created_at).toLocaleDateString('ko-KR')}
                                    </p>
                                  </div>
                                  
                                  {/* 상태 배지 */}
                                  <div className="flex flex-col items-end gap-2">
                                    <Chip 
                                      size="sm" 
                                      color="default" 
                                      variant="flat"
                                      startContent={
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                                        </svg>
                                      }
                                    >
                                      종료됨
                                    </Chip>
                                    {daysSinceEnd !== null && (
                                      <span className="text-xs text-gray-400">
                                        {daysSinceEnd}일 전 종료
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* 결제 정보 */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4 text-sm text-gray-400">
                                    <div className="flex items-center gap-1">
                                      <FaMoneyBillWaveAlt className="w-3 h-3" />
                                      <span>{Number(order.amount).toLocaleString()}원</span>
                                    </div>
                                  </div>
                                  
                                  {/* 사용 불가 안내 */}
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-gray-400">사용 불가</span>
                                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardBody>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* 사용된 티켓 토글 */}
              {usedOrders.length > 0 && (
                <div className="mb-6">
                  <Button
                    variant="flat"
                    color="success"
                    onPress={() => setShowUsed(!showUsed)}
                    className="w-full justify-between"
                    endContent={
                      <svg 
                        className={`w-4 h-4 transition-transform ${showUsed ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    }
                  >
                    <div className="flex items-center gap-2">
                      <span>사용된 티켓</span>
                      <Chip color="success" variant="flat" size="sm">
                        {usedOrders.length}개
                      </Chip>
                    </div>
                  </Button>
                </div>
              )}

              {/* 사용된 티켓 목록 */}
              {showUsed && usedOrders.length > 0 && (
                <div className="space-y-4">
                  {usedOrders.map((order, index) => (
                    <motion.div
                      key={order.order_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card 
                        className="w-full bg-green-50/95 backdrop-blur-sm"
                        shadow="sm"
                      >
                        <CardBody className="p-0">
                  <div className="flex gap-4 p-4">
                    {/* 전시회 이미지 */}
                    <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden">
                      {order.exhibition_id && order.exhibition_id.photo ? (
                        <Image
                          src={order.exhibition_id.photo}
                          alt={order.exhibition_id.contents || "전시회 이미지"}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">이미지 없음</span>
                        </div>
                      )}
                    </div>
                    
                    {/* 티켓 정보 */}
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 truncate text-lg">
                            {order.exhibition_id?.contents || "알 수 없는 전시회"}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            {order.people_count}명 • {new Date(order.created_at).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                        
                        {/* 상태 배지 */}
                        <div className="flex flex-col items-end gap-2">
                          <Chip 
                            size="sm" 
                            color="success" 
                            variant="solid"
                            startContent={
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.071 7.071a1 1 0 01-1.414 0l-3.536-3.535a1 1 0 111.414-1.415l2.829 2.829 6.364-6.364a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            }
                          >
                            사용됨
                          </Chip>
                        </div>
                      </div>

                      {/* 결제 정보 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <FaMoneyBillWaveAlt className="w-3 h-3 text-green-500" />
                            <span>{Number(order.amount).toLocaleString()}원</span>
                          </div>
                        </div>
                        
                        {/* 사용 완료 안내 */}
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-green-600 font-medium">사용 완료</span>
                          <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-7.071 7.071a1 1 0 01-1.414 0l-3.536-3.535a1 1 0 111.414-1.415l2.829 2.829 6.364-6.364a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    </div>
                  </CardBody>
                </Card>
            </motion.div>
                  ))}
            </div>
          )}
              
              {/* 하단 여백 추가 */}
              <div className="h-32"></div>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderHistory; 