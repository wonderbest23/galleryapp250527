"use client";
import React, { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";

export default function CommunityAdManager() {
  const supabase = createClient();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    link_url: "",
    image_url: "",
    is_active: true,
    display_order: 0
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("community_ad_banner")
      .select("*")
      .order("display_order", { ascending: true });

    if (!error && data) {
      setBanners(data);
    }
    setLoading(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.includes("image")) {
      alert("이미지 파일만 업로드 가능합니다.");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const uploadImage = async () => {
    if (!imageFile) return formData.image_url;

    try {
      setUploading(true);
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `community-ads/${fileName}`;

      const { data, error } = await supabase.storage
        .from("community-ads")
        .upload(filePath, imageFile);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from("community-ads")
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.log("이미지 업로드 오류:", error);
      alert("이미지 업로드에 실패했습니다.");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }

    if (!imageFile && !formData.image_url) {
      alert("이미지를 선택해주세요.");
      return;
    }

    const imageUrl = await uploadImage();
    if (!imageUrl && !formData.image_url) return;

    const bannerData = {
      title: formData.title,
      link_url: formData.link_url || null,
      image_url: imageUrl || formData.image_url,
      is_active: formData.is_active,
      display_order: formData.display_order
    };

    if (editingBanner) {
      const { error } = await supabase
        .from("community_ad_banner")
        .update(bannerData)
        .eq("id", editingBanner.id);

      if (error) {
        alert("수정에 실패했습니다.");
        console.log(error);
      } else {
        alert("광고 배너가 수정되었습니다.");
        resetForm();
        fetchBanners();
      }
    } else {
      const { error } = await supabase
        .from("community_ad_banner")
        .insert([bannerData]);

      if (error) {
        alert("등록에 실패했습니다.");
        console.log(error);
      } else {
        alert("광고 배너가 등록되었습니다.");
        resetForm();
        fetchBanners();
      }
    }
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      link_url: banner.link_url || "",
      image_url: banner.image_url,
      is_active: banner.is_active,
      display_order: banner.display_order
    });
    setImagePreview(banner.image_url);
  };

  const handleDelete = async (id) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    const { error } = await supabase
      .from("community_ad_banner")
      .delete()
      .eq("id", id);

    if (error) {
      alert("삭제에 실패했습니다.");
    } else {
      alert("삭제되었습니다.");
      fetchBanners();
    }
  };

  const resetForm = () => {
    setEditingBanner(null);
    setFormData({
      title: "",
      link_url: "",
      image_url: "",
      is_active: true,
      display_order: 0
    });
    setImageFile(null);
    setImagePreview("");
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
      <h2 className="text-xl font-bold mb-4 text-gray-900">커뮤니티 광고 배너</h2>

      {/* 배너 등록/수정 폼 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h3 className="font-semibold mb-3 text-gray-900">
          {editingBanner ? "배너 수정" : "새 배너 등록"}
        </h3>

        <div className="space-y-4">
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

          {/* 링크 URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              링크 URL (선택)
            </label>
            <input
              type="text"
              placeholder="클릭 시 이동할 URL"
              value={formData.link_url}
              onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 이미지 업로드 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              배너 이미지 <span className="text-red-500">*</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              이미지 선택
            </button>
            {imagePreview && (
              <div className="mt-3 relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden border border-gray-300">
                <Image
                  src={imagePreview}
                  alt="미리보기"
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>

          {/* 표시 순서 */}
          <div>
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

          {/* 활성화 상태 */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              활성화 (체크하면 커뮤니티에 노출됩니다)
            </label>
          </div>

          {/* 버튼 */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={uploading}
              className={`px-4 py-2 rounded-md text-white font-medium transition-colors ${
                uploading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {uploading ? '처리 중...' : (editingBanner ? '수정' : '등록')}
            </button>
            {editingBanner && (
              <button
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 배너 목록 */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900">등록된 배너</h3>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : banners.length === 0 ? (
          <p className="text-gray-500 text-sm py-8 text-center">등록된 배너가 없습니다.</p>
        ) : (
          banners.map((banner) => (
            <div key={banner.id} className="border border-gray-200 rounded-lg p-4 flex items-center gap-4 bg-white hover:bg-gray-50 transition-colors">
              <div className="relative w-24 h-24 bg-gray-100 rounded overflow-hidden flex-shrink-0 border border-gray-200">
                <Image
                  src={banner.image_url}
                  alt={banner.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">{banner.title}</p>
                {banner.link_url && (
                  <p className="text-xs text-gray-500 truncate mt-1">{banner.link_url}</p>
                )}
                <div className="flex gap-2 mt-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    banner.is_active 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {banner.is_active ? '활성' : '비활성'}
                  </span>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                    순서: {banner.display_order}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => handleEdit(banner)}
                  className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
                >
                  수정
                </button>
                <button
                  onClick={() => handleDelete(banner.id)}
                  className="px-3 py-1.5 text-sm bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
