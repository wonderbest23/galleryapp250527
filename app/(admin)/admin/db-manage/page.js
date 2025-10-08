"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function DBManagePage() {
  const [users, setUsers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showAlarmUI, setShowAlarmUI] = useState(false);
  const [exhibitions, setExhibitions] = useState([]);
  const [selectedExhibition, setSelectedExhibition] = useState("");
  const [viewGallery, setViewGallery] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const fetchUsers = async () => {
      // 필요한 컬럼만 조회 (role 컬럼 제외)
      let query = supabase.from('profiles').select('*');
      if (viewGallery) {
        query = query.eq('role', 'gallery');
      } else {
        query = query.not('role', 'eq', 'gallery'); // 갤러리 계정 제외 (null 포함)
      }

      const { data, error } = await query;
      if (error) {
        console.log('fetchUsers error', error);
      } else {
        setUsers(data);
      }
    };
    const fetchExhibitions = async () => {
      const { data, error } = await supabase.from('exhibition').select('id, contents');
      if (!error) setExhibitions(data);
    };
    fetchUsers();
    fetchExhibitions();
  }, [viewGallery]);

  const handleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === users.length) setSelectedIds([]);
    else setSelectedIds(users.map(u => u.id));
  };

  const handleDeselectAll = () => setSelectedIds([]);

  const handleSendAlarm = async () => {
    if (!selectedExhibition || selectedIds.length === 0) return;
    const now = new Date().toISOString();
    const message = "관람객님이 방문한 곳에 새로운 전시가 시작되었습니다!";
    const inserts = selectedIds.map(user_id => ({
      user_id,
      exhibition_id: selectedExhibition,
      message,
      created_at: now,
    }));
    const { error } = await supabase.from("notification").insert(inserts);
    if (error) {
      alert("알림 발송 실패: " + error.message);
    } else {
      alert("알림이 정상적으로 발송되었습니다!");
      setShowAlarmUI(false);
      setSelectedExhibition("");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">DB관리 - 전체 회원 정보</h1>
      <div className="flex items-center mb-2 gap-2">
        <button 
          onClick={() => setShowAlarmUI(v => !v)}
          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
        >
          전시회 알람 발송
        </button>
        <button 
          onClick={()=>setViewGallery(v=>!v)}
          className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
        >
          {viewGallery ? '일반 고객 보기' : '갤러리 계정 보기'}
        </button>
        <button 
          onClick={handleDeselectAll}
          className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
        >
          선택 해제
        </button>
        <span className="text-sm text-gray-500">선택된 회원: {selectedIds.length}명</span>
      </div>
      {showAlarmUI && (
        <div className="flex items-center gap-2 mb-4">
          <div className="min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">전시회 선택</label>
            <select
              value={selectedExhibition || ""}
              onChange={(e) => setSelectedExhibition(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">전시회를 선택하세요</option>
              {exhibitions.map(e => (
                <option key={e.id} value={e.id}>{e.contents} ({e.id})</option>
              ))}
            </select>
          </div>
          <button 
            disabled={!selectedExhibition || selectedIds.length === 0} 
            onClick={handleSendAlarm}
            className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            발송
          </button>
        </div>
      )}
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
              <th className="p-2 border">연락처</th>
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
                <td className="p-2 border">{u.phone || u.phone_number || u.contact || '-'}</td>
                <td className="p-2 border">{u.created_at ? u.created_at.slice(0, 19).replace('T', ' ') : '-'}</td>
              </tr>
            )) : (
              <tr><td colSpan={6} className="text-center p-4">회원 정보가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 
