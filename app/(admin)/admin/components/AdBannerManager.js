"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Plus, Edit, Trash2 } from "lucide-react";

export default function AdBannerManager() {
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    image_url: "",
    link_url: "",
    is_active: true,
    display_order: 0
  });

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const { data, error } = await supabase
        .from("ad_banners")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) {
        console.error("Error fetching banners:", error);
      } else {
        setBanners(data || []);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingBanner) {
        // 수정
        const { error } = await supabase
          .from("ad_banners")
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq("id", editingBanner.id);

        if (error) throw error;
      } else {
        // 생성
        const { error } = await supabase
          .from("ad_banners")
          .insert([formData]);

        if (error) throw error;
      }

      await fetchBanners();
      resetForm();
      setIsOpen(false);
    } catch (error) {
      console.error("Error saving banner:", error);
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle,
      image_url: banner.image_url || "",
      link_url: banner.link_url || "",
      is_active: banner.is_active,
      display_order: banner.display_order
    });
    setIsOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
      const { error } = await supabase
        .from("ad_banners")
        .delete()
        .eq("id", id);

      if (error) throw error;
      await fetchBanners();
    } catch (error) {
      console.error("Error deleting banner:", error);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  const resetForm = () => {
    setEditingBanner(null);
    setFormData({
      title: "",
      subtitle: "",
      image_url: "",
      link_url: "",
      is_active: true,
      display_order: 0
    });
  };

  const handleAdd = () => {
    resetForm();
    setIsOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">광고 배너 관리</h2>
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          광고 추가
        </button>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제목</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">부제목</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이미지</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">링크</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">순서</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                </td>
              </tr>
            ) : banners.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                  등록된 광고 배너가 없습니다.
                </td>
              </tr>
            ) : (
              banners.map((banner) => (
                <tr key={banner.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{banner.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{banner.subtitle}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {banner.image_url ? (
                      <img
                        src={banner.image_url}
                        alt={banner.title}
                        className="w-12 h-12 object-cover rounded border border-gray-200"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
                        없음
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {banner.link_url ? (
                      <a
                        href={banner.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline truncate max-w-xs block"
                      >
                        {banner.link_url}
                      </a>
                    ) : (
                      <span className="text-gray-400">링크 없음</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      banner.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {banner.is_active ? '활성' : '비활성'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{banner.display_order}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(banner)}
                        className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(banner.id)}
                        className="text-red-600 hover:text-red-900 flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 모달 */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* 모달 헤더 */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingBanner ? "광고 배너 수정" : "광고 배너 추가"}
              </h3>
            </div>

            {/* 모달 바디 */}
            <div className="p-6 space-y-4">
              {/* 제목 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="광고 제목을 입력하세요"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 부제목 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  부제목 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="광고 부제목을 입력하세요"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 이미지 URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이미지 URL
                </label>
                <input
                  type="text"
                  placeholder="이미지 URL을 입력하세요"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 링크 URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  링크 URL
                </label>
                <input
                  type="text"
                  placeholder="클릭 시 이동할 URL을 입력하세요"
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-4">
                {/* 활성 상태 */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_active_switch"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_active_switch" className="text-sm font-medium text-gray-700">
                    활성 상태
                  </label>
                </div>

                {/* 표시 순서 */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    표시 순서
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="p-6 border-t border-gray-200 flex gap-2 justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {editingBanner ? '수정' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
