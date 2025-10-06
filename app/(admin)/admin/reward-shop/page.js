'use client'
import React, { useState } from "react";
import { HiGift, HiShoppingCart, HiClock, HiUsers } from "react-icons/hi";
import { RewardShopList } from "../components/reward-shop-list";
import { RewardShopDetail } from "../components/reward-shop-detail";

// 통계 카드 컴포넌트
const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-lg shadow p-6 flex items-center">
    <div className={`rounded-full p-3 ${color}`}>{icon}</div>
    <div className="ml-4">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </div>
);

export default function RewardShopAdminPage() {
  const stats = [
    {
      title: "총 상품 수",
      value: "0",
      icon: <HiGift className="w-6 h-6 text-white" />,
      color: "bg-blue-500",
    },
    {
      title: "활성 상품",
      value: "0",
      icon: <HiClock className="w-6 h-6 text-white" />,
      color: "bg-green-500",
    },
    {
      title: "총 구매 건수",
      value: "0",
      icon: <HiShoppingCart className="w-6 h-6 text-white" />,
      color: "bg-purple-500",
    },
    {
      title: "사용된 포인트",
      value: "0 P",
      icon: <HiUsers className="w-6 h-6 text-white" />,
      color: "bg-pink-500",
    },
  ];

  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedKeys, setSelectedKeys] = useState(new Set([]));
  const [refreshToggle, setRefreshToggle] = useState(1);

  // 신규 상품 등록 처리
  const handleCreateItem = () => {
    const newItem = {
      id: "",
      title: "",
      description: "",
      image_url: "",
      points_required: 0,
      stock: 0,
      is_active: true,
      category: "general",
      created_at: new Date().toISOString(),
    };
    
    setSelectedItem(newItem);
    setSelectedKeys(new Set([]));
  };

  return (
    <div className="w-full h-full flex flex-col gap-4 py-20">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">리워드샵 관리</h1>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        {/* 리워드샵 목록 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RewardShopList
            selectedItem={selectedItem}
            onSelectItem={setSelectedItem}
            selectedKeys={selectedKeys}
            setSelectedKeys={setSelectedKeys}
            refreshToggle={refreshToggle}
            onCreateItem={handleCreateItem}
          />

          <RewardShopDetail
            item={selectedItem}
            onUpdate={setSelectedItem}
            selectedKeys={selectedKeys}
            setSelectedKeys={setSelectedKeys}
            onRefresh={() => setRefreshToggle(prev => prev + 1)}
            refreshToggle={refreshToggle}
            setRefreshToggle={setRefreshToggle}
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
          />
        </div>
      </div>
    </div>
  );
}

