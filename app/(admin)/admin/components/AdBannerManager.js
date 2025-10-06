"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Button,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Switch,
  Chip
} from "@heroui/react";
import { Plus, Edit, Trash2 } from "lucide-react";

export default function AdBannerManager() {
  const supabase = createClient();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
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
      onOpenChange();
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
    onOpen();
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
    onOpen();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">광고 배너 관리</h2>
        <Button
          color="primary"
          startContent={<Plus className="w-4 h-4" />}
          onPress={handleAdd}
        >
          광고 추가
        </Button>
      </div>

      <Table aria-label="광고 배너 목록">
        <TableHeader>
          <TableColumn>제목</TableColumn>
          <TableColumn>부제목</TableColumn>
          <TableColumn>이미지</TableColumn>
          <TableColumn>링크</TableColumn>
          <TableColumn>상태</TableColumn>
          <TableColumn>순서</TableColumn>
          <TableColumn>작업</TableColumn>
        </TableHeader>
        <TableBody>
          {banners.map((banner) => (
            <TableRow key={banner.id}>
              <TableCell>{banner.title}</TableCell>
              <TableCell>{banner.subtitle}</TableCell>
              <TableCell>
                {banner.image_url ? (
                  <img
                    src={banner.image_url}
                    alt={banner.title}
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-xs">
                    이미지 없음
                  </div>
                )}
              </TableCell>
              <TableCell>
                <a
                  href={banner.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline text-sm"
                >
                  {banner.link_url || "링크 없음"}
                </a>
              </TableCell>
              <TableCell>
                <Chip
                  color={banner.is_active ? "success" : "default"}
                  variant="flat"
                >
                  {banner.is_active ? "활성" : "비활성"}
                </Chip>
              </TableCell>
              <TableCell>{banner.display_order}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="light"
                    startContent={<Edit className="w-3 h-3" />}
                    onPress={() => handleEdit(banner)}
                  >
                    수정
                  </Button>
                  <Button
                    size="sm"
                    color="danger"
                    variant="light"
                    startContent={<Trash2 className="w-3 h-3" />}
                    onPress={() => handleDelete(banner.id)}
                  >
                    삭제
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg">
        <ModalContent>
          <ModalHeader>
            {editingBanner ? "광고 배너 수정" : "광고 배너 추가"}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="제목"
                placeholder="광고 제목을 입력하세요"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                isRequired
              />
              <Input
                label="부제목"
                placeholder="광고 부제목을 입력하세요"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                isRequired
              />
              <Input
                label="이미지 URL"
                placeholder="이미지 URL을 입력하세요"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              />
              <Input
                label="링크 URL"
                placeholder="클릭 시 이동할 URL을 입력하세요"
                value={formData.link_url}
                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
              />
              <div className="flex items-center gap-4">
                <Switch
                  isSelected={formData.is_active}
                  onValueChange={(value) => setFormData({ ...formData, is_active: value })}
                >
                  활성 상태
                </Switch>
                <Input
                  label="표시 순서"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  className="w-32"
                />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onOpenChange}>
              취소
            </Button>
            <Button color="primary" onPress={handleSubmit}>
              {editingBanner ? "수정" : "추가"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
