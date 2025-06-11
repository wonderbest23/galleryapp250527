"use client";
import { useEffect, useState } from "react";
import { Button, Input, Select, SelectItem } from "@heroui/react";
import { createClient } from "@/utils/supabase/client";

export default function ManualTicketIssuePage() {
  const [users, setUsers] = useState([]);
  const [exhibitions, setExhibitions] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedExhibition, setSelectedExhibition] = useState("");
  const [amount, setAmount] = useState(0);
  const [peopleCount, setPeopleCount] = useState(1);
  const [status, setStatus] = useState("success");
  const [message, setMessage] = useState("");
  const supabase = createClient();

  useEffect(() => {
    // 유저 리스트 불러오기 (profiles 테이블 직접 조회)
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('profiles').select('id, full_name, email');
      if (!error) setUsers(data);
    };
    // 전시회 리스트 불러오기
    const fetchExhibitions = async () => {
      const { data, error } = await supabase.from("exhibition").select("id, contents, price");
      if (!error) setExhibitions(data);
    };
    fetchUsers();
    fetchExhibitions();
  }, []);

  useEffect(() => {
    // 전시회 선택 시 금액 자동 설정
    if (selectedExhibition) {
      const exhibition = exhibitions.find(e => String(e.id) === String(selectedExhibition));
      if (exhibition && typeof exhibition.price !== 'undefined') {
        setAmount(exhibition.price);
      }
    }
  }, [selectedExhibition, exhibitions]);

  const handleIssue = async () => {
    if (!selectedUser || !selectedExhibition) {
      setMessage("유저와 전시회를 모두 선택하세요.");
      return;
    }
    const orderId = `manual_${Date.now()}`;
    const { error } = await supabase.from("payment_ticket").insert({
      user_id: selectedUser,
      exhibition_id: selectedExhibition,
      amount,
      people_count: peopleCount,
      status,
      order_id: orderId,
      created_at: new Date().toISOString(),
    });
    if (error) setMessage("발급 실패: " + error.message);
    else setMessage("티켓이 정상적으로 발급되었습니다!");
  };

  return (
    <div className="max-w-lg mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">관리자 티켓 수동 발급</h1>
      <div className="mb-4">
        <Select
          label="유저 선택 (user_id)"
          selectedKeys={selectedUser ? new Set([selectedUser]) : new Set([])}
          onSelectionChange={keys => setSelectedUser(keys.values().next().value || "")}
          renderValue={() => {
            const u = users.find(u => u.id === selectedUser);
            return u ? `${u.full_name || u.email || u.id} (${u.email || u.id})` : "유저를 선택하세요";
          }}
        >
          <SelectItem key="" value="">유저를 선택하세요</SelectItem>
          {users.map(u => (
            <SelectItem key={u.id} value={u.id}>
              {u.full_name || u.email || u.id} ({u.email || u.id})
            </SelectItem>
          ))}
        </Select>
      </div>
      <div className="mb-4">
        <Select
          label="전시회 선택 (exhibition_id)"
          selectedKeys={selectedExhibition ? new Set([String(selectedExhibition)]) : new Set([])}
          onSelectionChange={keys => setSelectedExhibition(String(keys.values().next().value) || "")}
          renderValue={() => {
            const e = exhibitions.find(e => String(e.id) === String(selectedExhibition));
            return e ? `${e.contents} (${e.id})` : "전시회를 선택하세요";
          }}
        >
          <SelectItem key="" value="">전시회를 선택하세요</SelectItem>
          {exhibitions.map(e => (
            <SelectItem key={e.id} value={e.id}>
              {e.contents} ({e.id})
            </SelectItem>
          ))}
        </Select>
      </div>
      <Input label="금액" type="number" value={amount} readOnly className="mb-4 bg-gray-100" />
      <Input label="인원수" type="number" value={peopleCount} onChange={e => setPeopleCount(Number(e.target.value))} className="mb-4" />
      <Select label="상태" value={status} onChange={e => setStatus(e.target.value)} className="mb-4">
        <SelectItem key="success" value="success">success</SelectItem>
        <SelectItem key="used" value="used">used</SelectItem>
        <SelectItem key="cancel" value="cancel">cancel</SelectItem>
      </Select>
      <Button className="mt-4 w-full" onClick={handleIssue}>발급</Button>
      {message && <div className="mt-2 text-center text-red-500">{message}</div>}
    </div>
  );
} 