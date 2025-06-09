"use client";
import React, { useEffect, useState } from "react";
import { Button, Card, CardBody, Spinner, Divider, Badge } from "@heroui/react";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import { FaPlus } from "react-icons/fa";
import Link from "next/link";
import { FaCalendar } from "react-icons/fa6";
import { FaMoneyBillWaveAlt } from "react-icons/fa";

const OrderHistory = ({ user }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleOrders, setVisibleOrders] = useState(3);

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
          .or(`and(amount.eq.0,status.in.(success,used)),and(amount.gt.0,status.eq.success)`)
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
      <div className="flex justify-center items-center h-40 w-full">
        <Spinner variant="wave" color="primary" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 w-full">
        <p className="text-gray-500">주문 내역이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex flex-col items-center gap-4 w-full">
        <div className="grid gap-4 w-full">
          {orders.slice(0, visibleOrders).map((order) => (
            <Link
              key={order.order_id}
              href={`/mypage/order-detail?order_id=${order.order_id}&exhibition_id=${order.exhibition_id.id}&user_id=${user.id}&people_count=${order.people_count}&amount=${order.amount}&created_at=${encodeURIComponent(order.created_at)}`}
              className="w-full no-underline"
            >
              <Card 
                className="w-full hover:shadow-md transition-shadow duration-200"
                isPressable
              >
                <CardBody className="flex gap-4 flex-row justify-center items-center">
                  <div className="relative w-24 h-24 flex-shrink-0 rounded overflow-hidden">
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
                  
                  <div className="flex flex-col w-full min-w-0">
                    <div className="flex flex-row justify-between items-start">
                      <div className="flex flex-col min-w-0">
                        
                        <div className="text-lg font-bold truncate">
                          {order.exhibition_id?.contents || "알 수 없는 전시회"}
                        </div>
                      </div>
                    </div>

                    <Divider orientation="horizontal" className="bg-gray-300 my-2" />
                    
                    <div className="text-xs flex flex-col my-2">
                      <div className="flex flex-row gap-1 items-center">
                        <FaMoneyBillWaveAlt className="w-3 h-3 text-[#007AFF]" />
                        <span>결제금액: {Number(order.amount).toLocaleString()}원</span>
                      </div>
                      <div className="flex flex-row gap-1 items-center mt-1">
                        <FaCalendar className="w-3 h-3 text-[#007AFF]" />
                        <span>인원: {order.people_count}명 / 주문일: {new Date(order.created_at).toLocaleDateString('ko-KR')}</span>
                      </div>
                      
                      
                    </div>
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>

        {orders.length > visibleOrders && (
          <div className="flex justify-center mt-4 mb-8">
            <FaPlus
              className="text-gray-500 text-2xl font-bold hover:cursor-pointer"
              onClick={loadMoreOrders}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory; 