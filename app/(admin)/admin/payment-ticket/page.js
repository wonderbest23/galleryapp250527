"use client";
import React, { useState } from "react";
import { PaymentTicketList } from "../components/payment-ticket-list";
import { PaymentTicketDetail } from "../components/payment-ticket-detail";
import { Tabs, Tab } from "@heroui/react";
import { Icon } from "@iconify/react";

export default function PaymentTicketPage() {
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedKeys, setSelectedKeys] = useState(new Set([]));
  const [refreshToggle, setRefreshToggle] = useState(0);
  const [refreshFunction, setRefreshFunction] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  // 티켓 선택 시 호출
  const handleSelectTicket = (ticket) => {
    setSelectedTicket(ticket);
  };

  // 새로고침 함수 설정
  const handleSetRefreshFunction = (refreshFunc) => {
    setRefreshFunction(refreshFunc);
  };

  // 탭 변경 시 선택된 티켓 초기화
  const handleTabChange = (key) => {
    setActiveTab(key);
    setSelectedTicket(null);
    setSelectedKeys(new Set([]));
  };

  return (
    <div className="w-full h-full p-4 space-y-8 py-20">
      <div className="flex max-w-7xl mx-auto flex-col gap-6">
        <div className="w-full space-y-4">
          <h1 className="text-2xl font-bold">티켓 관리</h1>
          
          {/* 탭 네비게이션 */}
          <Tabs 
            selectedKey={activeTab} 
            onSelectionChange={handleTabChange}
            className="w-full"
            color="primary"
            variant="underlined"
          >
            <Tab
              key="all"
              title={
                <div className="flex items-center gap-2">
                  <Icon icon="mdi:format-list-bulleted" />
                  <span>전체 티켓</span>
                </div>
              }
            >
              <div className="mt-4">
                <PaymentTicketList
                  onSelectTicket={handleSelectTicket}
                  selectedKeys={selectedKeys}
                  onSelectionChange={(keys) => setSelectedKeys(keys)}
                  onRefresh={handleSetRefreshFunction}
                  refreshToggle={refreshToggle}
                  setRefreshToggle={setRefreshToggle}
                  selectedTicket={selectedTicket}
                  setSelectedTicket={setSelectedTicket}
                  filterType="all"
                />
              </div>
            </Tab>
            
            <Tab
              key="purchase"
              title={
                <div className="flex items-center gap-2">
                  <Icon icon="mdi:credit-card" />
                  <span>실제 구매</span>
                </div>
              }
            >
              <div className="mt-4">
                <PaymentTicketList
                  onSelectTicket={handleSelectTicket}
                  selectedKeys={selectedKeys}
                  onSelectionChange={(keys) => setSelectedKeys(keys)}
                  onRefresh={handleSetRefreshFunction}
                  refreshToggle={refreshToggle}
                  setRefreshToggle={setRefreshToggle}
                  selectedTicket={selectedTicket}
                  setSelectedTicket={setSelectedTicket}
                  filterType="purchase"
                />
              </div>
            </Tab>
            
            <Tab
              key="manual"
              title={
                <div className="flex items-center gap-2">
                  <Icon icon="mdi:account-edit" />
                  <span>메뉴얼 발급</span>
                </div>
              }
            >
              <div className="mt-4">
                <PaymentTicketList
                  onSelectTicket={handleSelectTicket}
                  selectedKeys={selectedKeys}
                  onSelectionChange={(keys) => setSelectedKeys(keys)}
                  onRefresh={handleSetRefreshFunction}
                  refreshToggle={refreshToggle}
                  setRefreshToggle={setRefreshToggle}
                  selectedTicket={selectedTicket}
                  setSelectedTicket={setSelectedTicket}
                  filterType="manual"
                />
              </div>
            </Tab>
          </Tabs>
        </div>
        
        {/* 티켓 상세 정보 */}
        <div className="w-full">
          <section className="bg-content2 rounded-lg p-4">
            {selectedTicket ? (
              <PaymentTicketDetail
                ticket={selectedTicket}
                selectedKeys={selectedKeys}
                setSelectedKeys={setSelectedKeys}
                onRefresh={() => {
                  if (refreshFunction) {
                    refreshFunction();
                  }
                }}
                refreshToggle={refreshToggle}
                setRefreshToggle={setRefreshToggle}
                selectedTicket={selectedTicket}
                setSelectedTicket={setSelectedTicket}
              />
            ) : (
              <div className="text-center text-default-500 py-8">
                티켓을 선택하면 상세 정보가 표시됩니다.
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
} 