"use client";
import React, { useState, useEffect, useRef } from "react";
import { Button, Input, Spinner, Chip } from "@heroui/react";
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
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">커뮤니티 광고 배너</h2>

      {/* 배너 등록/수정 폼 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-3">
          {editingBanner ? "배너 수정" : "새 배너 등록"}
        </h3>

        <div className="space-y-3">
          <Input
            label="제목"
            placeholder="광고 제목을 입력하세요"
            value={formData.title}
            onValueChange={(value) => setFormData({ ...formData, title: value })}
          />

          <Input
            label="링크 URL (선택)"
            placeholder="클릭 시 이동할 URL"
            value={formData.link_url}
            onValueChange={(value) => setFormData({ ...formData, link_url: value })}
          />

          <div>
            <label className="block text-sm font-medium mb-2">배너 이미지</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <Button
              color="default"
              variant="bordered"
              onPress={() => fileInputRef.current?.click()}
            >
              이미지 선택
            </Button>
            {imagePreview && (
              <div className="mt-2 relative w-full h-24 bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={imagePreview}
                  alt="미리보기"
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              color="primary"
              onPress={handleSave}
              isLoading={uploading}
            >
              {editingBanner ? "수정" : "등록"}
            </Button>
            {editingBanner && (
              <Button
                color="default"
                variant="light"
                onPress={resetForm}
              >
                취소
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 배너 목록 */}
      <div className="space-y-3">
        <h3 className="font-semibold">등록된 배너</h3>
        {loading ? (
          <Spinner />
        ) : banners.length === 0 ? (
          <p className="text-gray-500 text-sm">등록된 배너가 없습니다.</p>
        ) : (
          banners.map((banner) => (
            <div key={banner.id} className="border rounded-lg p-3 flex items-center gap-3">
              <div className="relative w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                <Image
                  src={banner.image_url}
                  alt={banner.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{banner.title}</p>
                {banner.link_url && (
                  <p className="text-xs text-gray-500 truncate">{banner.link_url}</p>
                )}
                <div className="flex gap-2 mt-1">
                  <Chip
                    size="sm"
                    color={banner.is_active ? "success" : "default"}
                    variant="flat"
                  >
                    {banner.is_active ? "활성" : "비활성"}
                  </Chip>
                  <Chip size="sm" variant="flat">
                    순서: {banner.display_order}
                  </Chip>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  color="primary"
                  variant="flat"
                  onPress={() => handleEdit(banner)}
                >
                  수정
                </Button>
                <Button
                  size="sm"
                  color="danger"
                  variant="flat"
                  onPress={() => handleDelete(banner.id)}
                >
                  삭제
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

