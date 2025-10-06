'use client'
import React, { useState } from "react";
import { HiUsers, HiClock, HiCheckCircle, HiXCircle } from "react-icons/hi";
import { JournalistList } from "../components/journalist-list";
import { JournalistDetail } from "../components/journalist-detail";

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

export default function JournalistAdminPage() {
  const stats = [
    {
      title: "총 신청 건수",
      value: "0",
      icon: <HiUsers className="w-6 h-6 text-white" />,
      color: "bg-blue-500",
    },
    {
      title: "대기 중",
      value: "0",
      icon: <HiClock className="w-6 h-6 text-white" />,
      color: "bg-yellow-500",
    },
    {
      title: "승인",
      value: "0",
      icon: <HiCheckCircle className="w-6 h-6 text-white" />,
      color: "bg-green-500",
    },
    {
      title: "반려",
      value: "0",
      icon: <HiXCircle className="w-6 h-6 text-white" />,
      color: "bg-red-500",
    },
  ];

  const [selectedApplication, setSelectedApplication] = useState(null);
  const [selectedKeys, setSelectedKeys] = useState(new Set([]));
  const [refreshToggle, setRefreshToggle] = useState(1);

  return (
    <div className="w-full h-full flex flex-col gap-4 py-20">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">기자단 신청 관리</h1>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        {/* 신청 목록 및 상세 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <JournalistList
            selectedApplication={selectedApplication}
            onSelectApplication={setSelectedApplication}
            selectedKeys={selectedKeys}
            setSelectedKeys={setSelectedKeys}
            refreshToggle={refreshToggle}
          />

          <JournalistDetail
            application={selectedApplication}
            onUpdate={setSelectedApplication}
            selectedKeys={selectedKeys}
            setSelectedKeys={setSelectedKeys}
            onRefresh={() => setRefreshToggle(prev => prev + 1)}
            refreshToggle={refreshToggle}
            setRefreshToggle={setRefreshToggle}
            selectedApplication={selectedApplication}
            setSelectedApplication={setSelectedApplication}
          />
        </div>
      </div>
    </div>
  );
}

