"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { motion } from "framer-motion";
import { MessageSquare, User, Package, Trash2, Mail, MailOpen } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useRouter } from "next/navigation";

export default function MessagesPopup({ isOpen, onClose, user }) {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState({});
  const [products, setProducts] = useState({});
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
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

  const fetchMessages = async () => {
    try {
      if (!user) return;
      
      const supabase = createClient();
      
      // 사용자가 받은 메시지들 가져오기 (작가인 경우)
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender_id:profiles!messages_sender_id_fkey(*),
          receiver_id:profiles!messages_receiver_id_fkey(*),
          product_id:products(*)
        `)
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.log('메시지 목록 불러오기 오류:', error);
        return;
      }
      
      if (data) {
        setMessages(data);
        
        // 프로필 정보 매핑
        const profileData = {};
        const productData = {};
        
        data.forEach(message => {
          if (message.sender_id) {
            profileData[message.sender_id.id] = message.sender_id;
          }
          if (message.product_id) {
            productData[message.product_id.id] = message.product_id;
          }
        });
        
        setProfiles(profileData);
        setProducts(productData);
      }
    } catch (error) {
      console.log('메시지 가져오기 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      setIsDeleting(true);
      const supabase = createClient();
      
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);
      
      if (error) {
        console.log('메시지 삭제 오류:', error);
        return;
      }
      
      // 메시지 목록에서 제거
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.log('메시지 삭제 오류:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMarkAsRead = async (messageId) => {
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);
      
      if (error) {
        console.log('메시지 읽음 처리 오류:', error);
        return;
      }
      
      // 메시지 목록 업데이트
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, is_read: true } : msg
      ));
    } catch (error) {
      console.log('메시지 읽음 처리 오류:', error);
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
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          transition={{ duration: 0.3 }}
          className="bg-white/80 backdrop-blur-sm rounded-2xl max-h-[85vh] sm:max-h-[75vh] overflow-y-auto shadow-2xl"
        >
          {/* 팝업 헤더 */}
          <div className="flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10 border-b border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">메시지</h2>
                <p className="text-sm text-gray-600">받은 메시지를 확인하세요</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{messages.length}</div>
              <div className="text-xs text-gray-500">받은 메시지</div>
            </div>
          </div>

          {/* 콘텐츠 영역 */}
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center items-center py-16">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-green-200 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">메시지를 불러오는 중...</p>
                </div>
              </div>
            ) : messages.length > 0 ? (
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <div className={`bg-white rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden ${
                      message.is_read ? 'border-gray-100' : 'border-blue-200 bg-blue-50/30'
                    }`}>
                      <div className="p-5">
                        {/* 메시지 헤더 */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {message.sender_id?.name || '알 수 없음'}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {formatDistanceToNow(new Date(message.created_at), { 
                                  addSuffix: true, 
                                  locale: ko 
                                })}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {/* 읽음 상태 아이콘 */}
                            {message.is_read ? (
                              <MailOpen className="w-4 h-4 text-gray-400" />
                            ) : (
                              <Mail className="w-4 h-4 text-blue-500" />
                            )}
                            
                            {/* 삭제 버튼 */}
                            <button
                              onClick={() => handleDeleteMessage(message.id)}
                              disabled={isDeleting}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="메시지 삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* 작품 정보 */}
                        {message.product_id && (
                          <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                            <div className="flex items-center gap-2 mb-2">
                              <Package className="w-4 h-4 text-purple-500" />
                              <span className="text-sm font-medium text-gray-700">관련 작품</span>
                            </div>
                            <div className="flex items-center gap-3">
                              {message.product_id.image && message.product_id.image.length > 0 && (
                                <img
                                  src={message.product_id.image[0]}
                                  alt={message.product_id.name}
                                  className="w-12 h-12 rounded-lg object-cover"
                                />
                              )}
                              <div>
                                <p className="font-medium text-gray-900">{message.product_id.name}</p>
                                <p className="text-sm text-gray-500">
                                  ₩{message.product_id.price?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 메시지 내용 */}
                        <div className="mb-4">
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {message.content}
                          </p>
                        </div>

                        {/* 액션 버튼 */}
                        {!message.is_read && (
                          <div className="flex justify-end">
                            <button
                              onClick={() => handleMarkAsRead(message.id)}
                              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              읽음 처리
                            </button>
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
                  <MessageSquare className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">받은 메시지가 없습니다</h3>
                <p className="text-gray-500">작가로 등록하면 작품에 대한 문의 메시지를 받을 수 있습니다</p>
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
