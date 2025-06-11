"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@heroui/react";

export default function DBManagePage() {
  const [users, setUsers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchUsers = async () => {
      const { data, error } = await supabase.from('profiles').select('id, full_name, email, created_at');
      if (!error) setUsers(data);
    };
    fetchUsers();
  }, []);

  const handleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === users.length) setSelectedIds([]);
    else setSelectedIds(users.map(u => u.id));
  };

  const handleDeselectAll = () => setSelectedIds([]);

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">DB관리 - 전체 회원 정보</h1>
      <div className="flex items-center mb-2 gap-2">
        <Button size="sm" color="default" onClick={handleDeselectAll}>선택 해제</Button>
        <span className="text-sm text-gray-500">선택된 회원: {selectedIds.length}명</span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">
                <input type="checkbox" checked={selectedIds.length === users.length && users.length > 0} onChange={handleSelectAll} />
              </th>
              <th className="p-2 border">user_id</th>
              <th className="p-2 border">이름</th>
              <th className="p-2 border">이메일</th>
              <th className="p-2 border">가입일</th>
            </tr>
          </thead>
          <tbody>
            {users && users.length > 0 ? users.map(u => (
              <tr key={u.id}>
                <td className="p-2 border text-center">
                  <input type="checkbox" checked={selectedIds.includes(u.id)} onChange={() => handleSelect(u.id)} />
                </td>
                <td className="p-2 border">{u.id}</td>
                <td className="p-2 border">{u.full_name || '-'}</td>
                <td className="p-2 border">{u.email || '-'}</td>
                <td className="p-2 border">{u.created_at ? u.created_at.slice(0, 19).replace('T', ' ') : '-'}</td>
              </tr>
            )) : (
              <tr><td colSpan={5} className="text-center p-4">회원 정보가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 