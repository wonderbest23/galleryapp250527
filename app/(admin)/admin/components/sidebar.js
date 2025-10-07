'use client'
import React from "react";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminSignOutAction } from "../actions";
import { usePathname } from "next/navigation";
export default function Sidebar({ onItemClick }) {
  const menuGroups = [
    {
      title: "메인",
      items: [
        { icon: "lucide:gauge", label: "대시보드", href: "/admin/dashboard" },
      ]
    },
    {
      title: "컨텐츠 관리",
      items: [
        { icon: "lucide:image", label: "갤러리", href: "/admin/gallery" },
        { icon: "lucide:calendar", label: "전시회", href: "/admin/exhibition" },
        { icon: "lucide:newspaper", label: "매거진", href: "/admin/magazine" },
        { icon: "lucide:monitor", label: "배너", href: "/admin/banner" },
      ]
    },
    {
      title: "사용자 관리",
      items: [
        { icon: "lucide:users", label: "작가", href: "/admin/artist" },
        { icon: "lucide:pen-tool", label: "기자단", href: "/admin/journalist" },
        { icon: "lucide:message-square", label: "커뮤니티", href: "/admin/community" },
      ]
    },
    {
      title: "상거래",
      items: [
        { icon: "lucide:shopping-bag", label: "제품", href: "/admin/product" },
        { icon: "lucide:gift", label: "리워드샵", href: "/admin/reward-shop" },
        { icon: "lucide:ticket", label: "티켓내역", href: "/admin/payment-ticket" },
        { icon: "lucide:credit-card", label: "결제내역", href: "/admin/payment-credit" },
      ]
    },
    {
      title: "검토 & 승인",
      items: [
        { icon: "lucide:shield-alert", label: "신고관리", href: "/admin/review-monitoring" },
        { icon: "lucide:coins", label: "포인트검토", href: "/admin/point-review" },
        { icon: "lucide:star", label: "리뷰승인", href: "/admin/custom-reviews" },
        { icon: "lucide:clipboard-list", label: "전시회요청", href: "/admin/exhibition-request" },
      ]
    },
    {
      title: "고급 기능",
      items: [
        { icon: "lucide:bot", label: "AI관리", href: "/admin/community/ai-manager" },
        { icon: "lucide:ticket-plus", label: "티켓발급", href: "/admin/payment-ticket/manual-issue" },
        { icon: "lucide:database", label: "DB관리", href: "/admin/db-manage" },
        { icon: "lucide:sparkles", label: "기자단체험", href: "/admin/journalist-experience" },
      ]
    }
  ];

  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-screen bg-white border-r border-gray-200">
      {/* 로고 영역 - 고정 */}
      <div className="flex-shrink-0 p-6 border-b border-gray-200">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
            <Icon icon="lucide:shield" className="text-white text-lg" />
          </div>
          <div>
            <span className="font-bold text-lg text-gray-900">Admin</span>
            <p className="text-xs text-gray-500">관리자 패널</p>
          </div>
        </Link>
      </div>

      {/* 메뉴 그룹 - 스크롤 가능 영역 */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {menuGroups.map((group, groupIndex) => (
          <div key={groupIndex}>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => (
                <button
                  key={item.href}
                  onClick={() => {
                    router.push(item.href);
                    if (onItemClick) onItemClick();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    pathname === item.href
                      ? 'bg-blue-50 text-blue-600 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon icon={item.icon} className={`text-lg ${pathname === item.href ? 'text-blue-600' : 'text-gray-500'}`} />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* 하단 액션 - 고정 */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 space-y-2">
        <Link href="/gallery" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
          <Icon icon="lucide:external-link" className="text-lg text-gray-500" />
          <span className="text-sm font-medium">갤러리 보기</span>
        </Link>
        <form action={adminSignOutAction}>
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
          >
            <Icon icon="lucide:log-out" className="text-lg" />
            <span className="text-sm font-medium">로그아웃</span>
          </button>
        </form>
      </div>
    </div>
  );
}
