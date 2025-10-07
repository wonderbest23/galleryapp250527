"use client";

import { useState, useEffect, useCallback } from "react";
import { init, SearchIndex } from "emoji-mart";
import data from "@emoji-mart/data";
import Picker from '@emoji-mart/react';
import Link from "next/link";
import { Spinner } from '@heroui/react';
import { useRouter } from "next/navigation";

import {
  Chat,
  Channel,
  ChannelHeader,
  ChannelList,
  MessageInput,
  MessageList,
  Thread,
  Window,
  useCreateChatClient,
  useChatContext,
} from "stream-chat-react";
import { EmojiPicker } from "stream-chat-react/emojis";

import { createToken } from "@/lib/action";
import CreateChannel from "./CreateChannel";
import CustomMessage from "./CustomMessage";
import CustomInput from "./CustomInput";
import "stream-chat-react/dist/css/v2/index.css";
import ChatHeader from "./ChatHeader";
// 초기화
init({ data });

// GetStream 연결 정보 (키가 없으면 채팅을 비활성화)
const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY || "";

export default function Home({hostId, userId, productId, chatData}) {
  const router = useRouter();
  const [token, setToken] = useState(null);
  const [activeChannel, setActiveChannel] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isChannelDeleted, setIsChannelDeleted] = useState(false);

  // API 키가 없으면 컴포넌트 자체를 안전하게 비활성화
  if (!apiKey) {
    return (
      <div className="w-full flex items-center justify-center h-[60vh]">
        <div className="text-center text-gray-500">
          <p>채팅 기능이 비활성화되었습니다.</p>
          <p className="text-sm mt-1">환경 변수 NEXT_PUBLIC_STREAM_API_KEY 설정 후 이용해 주세요.</p>
        </div>
      </div>
    );
  }
  
  // Supabase 채팅 데이터 확인
  useEffect(() => {
    if (chatData) {
      console.log("Supabase 채팅 데이터 로드됨:", chatData);
    } else {
      console.log("Supabase 채팅 데이터가 없습니다. hostId:", hostId, "userId:", userId, "productId:", productId);
    }
  }, [chatData, hostId, userId, productId]);
  
  // 토큰 제공자 콜백 함수
  const tokenProvider = useCallback(async () => {
    try {
      console.log("토큰 제공자 함수 실행");
      // 서버 액션을 통해 토큰 생성
      const token = await createToken(userId);
      console.log("토큰 생성 성공:", !!token);
      setToken(token);
      return token;
    } catch (error) {
      console.log("토큰 제공자 오류:", error);
      setError("채팅 연결 중 오류가 발생했습니다");
      return null;
    }
  }, [userId]);
  
  const user = {
    id: userId,
    name: userId,
    image: `https://getstream.io/random_png/?name=${userId}`,
  };

  // 클라이언트 생성 - 토큰 제공자 사용
  const chatClient = useCreateChatClient({
    apiKey,
    tokenOrProvider: tokenProvider,
    userData: user,
  });

  // 자동으로 채팅방 생성 또는 참여하는 함수
  const initializeDirectChannel = useCallback(async () => {
    if (!chatClient || !hostId || !userId) return;
    
    try {
      setIsLoading(true);
      console.log("채팅방 초기화 시작: hostId:", hostId, "userId:", userId, "chatData:", chatData?.id || 'null');
      
      // 기존 채널 검색 - 필터 수정
      const filters = {
        type: 'messaging',
        $and: [
          { members: { $in: [hostId] } },
          { members: { $in: [userId] } }
        ]
      };
      
      const channels = await chatClient.queryChannels(filters, { last_message_at: -1 }, {
        watch: true,
        state: true,
      });
      
      // 기존 채널이 있으면 사용
      if (channels.length > 0) {
        console.log("기존 채팅방 발견:", channels[0].id);
        setActiveChannel(channels[0]);
      } else {
        // 새 채널 생성
        console.log("새 채팅방 생성 시작");
        
        // Supabase에서 채팅 ID가 있으면 사용
        const chatId = chatData ? chatData.id.toString() : null;
        
        // 채널 ID 생성
        let channelId;
        
        if (chatId) {
          channelId = `chat_${chatId}`;
          console.log("Supabase 채팅 ID로 채널 생성:", channelId);
        } else {
          // 고유한 ID 생성 - 타임스탬프 추가
          channelId = `chat_${hostId.substring(0, 8)}_${userId.substring(0, 8)}_${Date.now().toString(36)}`;
          console.log("새로운 채널 ID 생성:", channelId);
        }
        
        const channelData = {
          members: [hostId, userId],
          created_by_id: userId,
          name: '거래 채팅',
          hostChannel: true
        };
        
        // 상품 ID가 있으면 채널 데이터에 추가
        if (productId) {
          channelData.productId = productId;
        }
        
        const newChannel = chatClient.channel('messaging', channelId, channelData);
        
        await newChannel.create();
        await newChannel.watch();
        console.log("새 채팅방 생성 완료:", newChannel.id);
        setActiveChannel(newChannel);
      }
    } catch (err) {
      console.log("채팅방 초기화 오류:", err);
      setError("채팅방을 초기화하는 중 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
    }
  }, [chatClient, hostId, userId, productId, chatData]);

  useEffect(() => {
    if (chatClient) {
      initializeDirectChannel();

      // 채널 삭제 이벤트 리스너 추가
      const handleChannelDeleted = (event) => {
        console.log("채널 삭제 이벤트:", event);
        if (activeChannel && event.channel.cid === activeChannel.cid) {
          console.log("현재 활성화된 채널이 삭제됨");
          setIsChannelDeleted(true);
          setActiveChannel(null);
          router.push('/chat');
        }
      };

      // 채널 상태 변경 리스너
      chatClient.on('channel.deleted', handleChannelDeleted);

      return () => {
        chatClient.off('channel.deleted', handleChannelDeleted);
      };
    }
  }, [chatClient, initializeDirectChannel, activeChannel, router]);

  // 채널 상태 감시
  useEffect(() => {
    if (activeChannel) {
      // 채널 비활성화 감지
      const checkChannelStatus = () => {
        try {
          // 채널이 유효한지 확인하는 간단한 방법
          const isChannelValid = activeChannel.cid && !activeChannel.disconnected;
          
          if (!isChannelValid) {
            console.log("채널이 더 이상 유효하지 않음");
            setActiveChannel(null);
            setIsChannelDeleted(true);
          }
        } catch (error) {
          console.log("채널 상태 확인 중 오류:", error);
          setActiveChannel(null);
          setIsChannelDeleted(true);
        }
      };

      checkChannelStatus();
    }
  }, [activeChannel]);

  if (!chatClient || isLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center h-screen">
        <Spinner variant="wave" color="primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex flex-col items-center justify-center h-screen ">
        <p className="text-xl text-red-500">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (isChannelDeleted) {
    return (
      <div className="w-full flex flex-col items-center justify-center h-screen">
        <p className="text-xl">채팅방이 삭제되었습니다.</p>
        <button 
          onClick={() => router.push('/chat')}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          채팅 목록으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-160px)] flex flex-col">
      <main className="flex-1 overflow-hidden">
        <Chat client={chatClient} theme="messaging light">
          <div className="flex h-full">
            {/* 채널 리스트는 숨김 처리 */}
            <div className="w-full h-full">
              {activeChannel ? (
                <Channel 
                  channel={activeChannel}
                  key={activeChannel.cid}
                  Message={CustomMessage}
                >
                  <Window>
                    <ChatHeader 
                      productId={productId} 
                      chatData={chatData} 
                      userId={userId} 
                      hostId={hostId} 
                      channel={activeChannel}
                    />
                    <MessageList />
                    <MessageInput Input={CustomInput} />
                  </Window>
                </Channel>
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-50">
                  <div className="text-center p-8 max-w-md">
                    <h2 className="text-2xl font-bold mb-4">
                      채팅방을 불러올 수 없습니다
                    </h2>
                    <p className="mb-6 text-gray-600">
                      채팅방을 초기화하는 중 문제가 발생했습니다. 새로고침 후 다시 시도해 주세요.
                    </p>
                    <button 
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-blue-500 text-white rounded"
                    >
                      새로고침
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Chat>
      </main>
    </div>
  );
}
