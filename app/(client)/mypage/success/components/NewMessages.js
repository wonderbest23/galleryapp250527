"use client";
import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Avatar, Card, CardBody, Spinner, Divider, Badge, Button } from "@heroui/react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import Image from "next/image";
import { MdDeleteForever, MdMarkEmailRead, MdMarkEmailUnread } from "react-icons/md";
import { addToast } from "@heroui/react";
import { LuMessageSquare, LuUser, LuPackage } from "react-icons/lu";

const NewMessages = ({ user }) => {
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState({});
  const [products, setProducts] = useState({});
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
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
        console.log('메시지 목록 불러오기 중 오류 발생:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [user]);

  const getMessageTime = (createdAt) => {
    if (!createdAt) return '';
    return formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: ko });
  };

  const getSenderName = (message) => {
    const sender = message.sender_id;
    if (sender) {
      return sender.full_name || sender.email || '사용자';
    }
    return '사용자';
  };

  const getSenderAvatar = (message) => {
    const sender = message.sender_id;
    if (sender && sender.avatar_url) {
      return sender.avatar_url;
    }
    return null;
  };

  const handleMessageClick = (message) => {
    // 작품 상세 페이지로 이동
    router.push(`/product/${message.product_id.id}`);
  };

  // 메시지 삭제 핸들러
  const handleDeleteMessage = async (e, message) => {
    e.stopPropagation(); // 이벤트 버블링 중지
    
    if (isDeleting) return; // 이미 삭제 중이면 중복 요청 방지
    
    try {
      setIsDeleting(true);
      
      if (!message || !message.id) {
        addToast({
          title: "오류 발생",
          description: "메시지 정보를 찾을 수 없습니다.",
          color: "danger",
        });
        return;
      }

      const supabase = createClient();
      
      // 메시지 삭제
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', message.id);

      if (error) {
        console.log('메시지 삭제 오류:', error);
        addToast({
          title: "삭제 실패",
          description: "메시지 삭제 중 오류가 발생했습니다.",
          color: "danger",
        });
        return;
      }

      addToast({
        title: "삭제 완료",
        description: "메시지가 성공적으로 삭제되었습니다.",
        color: "success",
      });

      // UI에서 삭제된 메시지 제거
      setMessages(prevMessages => prevMessages.filter(m => m.id !== message.id));
      
    } catch (error) {
      console.log("메시지 삭제 오류:", error);
      addToast({
        title: "오류 발생",
        description: "메시지 삭제 중 문제가 발생했습니다.",
        color: "danger",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // 메시지 읽음 처리
  const markAsRead = async (messageId) => {
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

      // UI 업데이트
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === messageId ? { ...msg, is_read: true } : msg
        )
      );
    } catch (error) {
      console.log('메시지 읽음 처리 오류:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8 w-full">
        <Spinner variant="wave" color="primary" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 w-full">
        <LuMessageSquare className="w-16 h-16 text-gray-300 mb-4" />
        <p className="text-gray-500 text-center">받은 메시지가 없습니다.</p>
        <p className="text-gray-400 text-sm text-center mt-2">작품에 대한 문의가 오면 여기에 표시됩니다.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="grid gap-4 w-full">
        {messages.map((message) => (
          <Card 
            key={message.id} 
            className={`w-full max-w-full ${!message.is_read ? 'border-blue-500 border-2 bg-blue-50' : 'border-gray-200'}`}
            isPressable
            onPress={() => {
              handleMessageClick(message);
              if (!message.is_read) {
                markAsRead(message.id);
              }
            }}
          >
            <CardBody className="flex gap-4 flex-row justify-center items-center cursor-pointer">
              <div className="relative w-16 h-16 flex-shrink-0 rounded-full overflow-hidden">
                {getSenderAvatar(message) ? (
                  <Image 
                    src={getSenderAvatar(message)} 
                    alt="프로필 이미지" 
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <LuUser className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              
              <div className="flex flex-col w-full min-w-0">
                <div className="flex flex-row justify-between items-start">
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">
                        {getSenderName(message)}
                      </span>
                      {!message.is_read && (
                        <Badge color="primary" size="sm">
                          새 메시지
                        </Badge>
                      )}
                    </div>
                    <div className="text-lg font-bold truncate mt-1">
                      {message.product_id?.name || '작품명 없음'}
                    </div>
                  </div>
                  
                  {/* 삭제 아이콘 */}
                  <button 
                    onClick={(e) => handleDeleteMessage(e, message)}
                    disabled={isDeleting}
                    className={`text-gray-500 hover:text-gray-700 transition-colors ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    aria-label="메시지 삭제"
                  >
                    {isDeleting ? (
                      <Spinner size="sm" color="primary" />
                    ) : (
                      <MdDeleteForever size={22} className='text-[#007AFF] hover:scale-110' />
                    )}
                  </button>
                </div>

                <Divider orientation="horizontal" className="bg-gray-300" />
                
                <div className="text-sm my-2">
                  <div className="flex items-start gap-2">
                    <LuMessageSquare className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-700 line-clamp-2">
                      {message.message}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <LuPackage className="w-3 h-3" />
                        <span>{message.product_id?.price?.toLocaleString()}원</span>
                      </div>
                      <span>{getMessageTime(message.created_at)}</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {message.is_read ? (
                        <MdMarkEmailRead className="w-4 h-4 text-green-500" />
                      ) : (
                        <MdMarkEmailUnread className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default NewMessages;
