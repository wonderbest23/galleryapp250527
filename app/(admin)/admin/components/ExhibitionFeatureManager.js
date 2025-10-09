'use client'
import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Icon } from "@iconify/react";
import { v4 as uuidv4 } from 'uuid';
import {debounce} from 'lodash'
export default function ExhibitionFeatureManager() {
  // 상태 관리
  const [exhibitions, setExhibitions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [selectedExhibition, setSelectedExhibition] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const itemsPerPage = 5;

  // Supabase 클라이언트 생성
  const supabase = createClient();

  // 데이터 가져오기
  const fetchExhibitions = async () => {
    setIsLoading(true);
    try {
      const start = (currentPage - 1) * itemsPerPage;
      const end = start + itemsPerPage - 1;
      
      // 한 번의 쿼리로 데이터와 전체 개수를 함께 가져옵니다
      let query = supabase
        .from('exhibition')
        .select('*', { count: 'exact' })
        .range(start, end)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('contents', `%${searchTerm}%`);
      }

      const { data, error, count } = await query;
      
      if (error) throw error;
      
      setExhibitions(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.log('전시회 데이터를 가져오는 중 오류 발생:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 검색어 변경 시
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // 검색어 변경 시 첫 페이지로 이동
  };

  // debounce된 검색 함수
  const debouncedSearch = debounce(() => {
    fetchExhibitions();
  }, 500);

  // 데이터 초기 로드 및 검색어/페이지 변경 시 다시 로드
  useEffect(() => {
    debouncedSearch();
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchTerm, currentPage]);

  // 페이지 변경 시
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // 추천 상태 토글
  const toggleRecommended = async (id, currentState) => {
    const updatedExhibitions = exhibitions.map((exhibition) => 
      exhibition.id === id 
        ? { ...exhibition, isRecommended: !currentState } 
        : exhibition
    );
    setExhibitions(updatedExhibitions);
  };

  // 변경사항 저장
  const saveChanges = async () => {
    setIsLoading(true);
    try {
      // 추천 상태가 변경된 전시회들에 대해 업데이트
      for (const exhibition of exhibitions) {
        const { error } = await supabase
          .from('exhibition')
          .update({ isRecommended: exhibition.isRecommended })
          .eq('id', exhibition.id);
        
        if (error) throw error;
      }
      setSaveMessage("변경사항이 성공적으로 저장되었습니다.");
      setIsModalOpen(true);
    } catch (error) {
      console.error('변경사항 저장 중 오류 발생:', error);
      setSaveMessage("변경사항 저장 중 오류가 발생했습니다.");
      setIsModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  // 상세 정보 보기
  const handleViewDetail = (exhibition) => {
    setSelectedExhibition(exhibition);
    setIsDetailOpen(true);
  };

  // 필드 값 변경 핸들러
  const handleFieldChange = (field, value) => {
    setSelectedExhibition({
      ...selectedExhibition,
      [field]: value
    });
  };

  // 전시회 정보 업데이트
  const handleUpdateExhibition = async () => {
    if (!selectedExhibition) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('exhibition')
        .update({
          name: selectedExhibition.name,
          contents: selectedExhibition.contents,
          photo: selectedExhibition.photo,
          date: selectedExhibition.date,
          working_hour: selectedExhibition.working_hour,
          off_date: selectedExhibition.off_date,
          add_info: selectedExhibition.add_info,
          homepage_url: selectedExhibition.homepage_url,
          isFree: selectedExhibition.isFree,
          isRecommended: selectedExhibition.isRecommended,
          review_count: selectedExhibition.review_count,
          review_average: selectedExhibition.review_average,
          naver_gallery_url: selectedExhibition.naver_gallery_url,
          price: selectedExhibition.price
        })
        .eq('id', selectedExhibition.id);

      if (error) throw error;

      setSaveMessage("전시회 정보가 성공적으로 업데이트되었습니다.");
      setIsModalOpen(true);
      fetchExhibitions();
    } catch (error) {
      console.error('전시회 업데이트 중 오류 발생:', error);
      setSaveMessage("전시회 정보 업데이트 중 오류가 발생했습니다.");
      setIsModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  // 전시회 삭제 확인
  const handleDeleteConfirm = () => {
    if (!selectedExhibition) return;
    setIsDeleteOpen(true);
  };

  // 전시회 삭제 실행
  const handleDeleteExhibition = async () => {
    if (!selectedExhibition) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('exhibition')
        .delete()
        .eq('id', selectedExhibition.id);

      if (error) throw error;

      setSaveMessage("전시회가 성공적으로 삭제되었습니다.");
      setIsModalOpen(true);
      setIsDetailOpen(false);
      setIsDeleteOpen(false);
      setSelectedExhibition(null);
      fetchExhibitions();
    } catch (error) {
      console.log('전시회 삭제 중 오류 발생:', error);
      setSaveMessage("전시회 삭제 중 오류가 발생했습니다.");
      setIsModalOpen(true);
      setIsDeleteOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  // 이미지 업로드 및 처리 핸들러
  const handleImageUpload = async (e) => {
    try {
      const file = e.target.files[0];
      if (!file) return;

      // 파일 크기 제한 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setSaveMessage("파일 크기는 5MB 이하여야 합니다.");
        setIsModalOpen(true);
        return;
      }

      // 파일 형식 제한
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        setSaveMessage("JPG, PNG, GIF, WEBP 형식의 이미지만 업로드할 수 있습니다.");
        setIsModalOpen(true);
        return;
      }

      // 업로드 중임을 표시
      setIsLoading(true);

      // 파일 이름은 고유하게 생성 (UUID + 원본 파일명)
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `exhibition/${fileName}`;
      
      // Supabase storage에 이미지 업로드
      const { data, error } = await supabase.storage
        .from('exhibition')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // 업로드된 이미지의 공개 URL 생성
      const { data: publicUrlData } = supabase.storage
        .from('exhibition')
        .getPublicUrl(filePath);

      // 이미지 URL을 전시회 정보에 저장
      handleFieldChange('photo', publicUrlData.publicUrl);

      setSaveMessage("이미지가 성공적으로 업로드되었습니다.");
      setIsModalOpen(true);
      
    } catch (error) {
      console.error("이미지 업로드 중 오류 발생:", error);
      setSaveMessage(`이미지 업로드 중 오류가 발생했습니다: ${error.message}`);
      setIsModalOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md max-w-full col-span-2 md:col-span-1">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col">
          <h3 className="text-xl font-semibold text-gray-900">전시회 상단 노출 관리</h3>
          <p className="text-sm text-gray-500 mt-1">
            메인 페이지에 상단 노출할 전시회를 선택합니다
          </p>
        </div>
      </div>
      <div className="p-6">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="전시회 검색어를 입력하세요"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
        />

        <div className="mb-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-500">로딩 중...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-20 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">노출</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">전시회명</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {exhibitions.map((exhibition) => (
                    <tr key={exhibition.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={exhibition.isRecommended}
                          onChange={() => toggleRecommended(exhibition.id, exhibition.isRecommended)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td 
                        onClick={() => handleViewDetail(exhibition)}
                        className="px-6 py-4 text-sm text-gray-900 cursor-pointer hover:text-blue-600"
                      >
                        {exhibition.contents}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-center mb-6">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              이전
            </button>
            <span className="px-3 py-2 text-sm text-gray-700">
              {currentPage} / {Math.ceil(totalCount / itemsPerPage)}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= Math.ceil(totalCount / itemsPerPage)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              다음
            </button>
          </div>
        </div>
      </div>
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <button
          onClick={saveChanges}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? "저장 중..." : "전시회 상단 노출 저장하기"}
        </button>
      </div>
      
      {/* 저장 결과 알림 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">알림</h3>
            <p className="text-gray-700 mb-6">{saveMessage}</p>
            <div className="flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 전시회 상세 정보 모달 */}
      {isDetailOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">전시회 상세 정보</h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteConfirm}
                    className="flex items-center gap-1 px-3 py-1 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Icon icon="lucide:trash" className="w-4 h-4" />
                    삭제
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6">
            {selectedExhibition && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">갤러리명</label>
                    <input
                      type="text"
                      value={selectedExhibition.name || ''}
                      onChange={(e) => handleFieldChange('name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">전시회명</label>
                    <input
                      type="text"
                      value={selectedExhibition.contents || ''}
                      onChange={(e) => handleFieldChange('contents', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-semibold">이미지</label>
                  <div className="flex flex-col gap-3">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center">
                      {selectedExhibition.photo ? (
                        <div className="relative w-full">
                          <img 
                            src={selectedExhibition.photo} 
                            alt={selectedExhibition.contents} 
                            className="w-full h-48 object-cover rounded-md"
                          />
                          <Button
                            isIconOnly
                            color="danger"
                            variant="flat"
                            size="sm"
                            className="absolute top-2 right-2"
                            onPress={() => handleFieldChange('photo', '')}
                          >
                            <Icon icon="lucide:x" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Icon icon="lucide:image" className="text-4xl text-gray-400 mb-2" />
                          <p className="text-sm text-gray-500">이미지 미리보기</p>
                        </>
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        id="photo-upload"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <label htmlFor="photo-upload">
                        <Button as="span" color="primary" variant="flat" size="sm" className="flex items-center">
                          <Icon icon="lucide:upload" className="mr-1" />
                          {selectedExhibition.photo ? '이미지 변경' : '이미지 업로드'}
                        </Button>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold">날짜</label>
                    <Input
                      value={selectedExhibition.date || ''}
                      onChange={(e) => handleFieldChange('date', e.target.value)}
                      className="w-full mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold">운영 시간</label>
                    <Input
                      value={selectedExhibition.working_hour || ''}
                      onChange={(e) => handleFieldChange('working_hour', e.target.value)}
                      className="w-full mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold">휴관일</label>
                    <Input
                      value={selectedExhibition.off_date || ''}
                      onChange={(e) => handleFieldChange('off_date', e.target.value)}
                      className="w-full mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold">가격</label>
                    <Input
                      type="number"
                      value={selectedExhibition.price || 0}
                      onChange={(e) => handleFieldChange('price', parseInt(e.target.value) || 0)}
                      className="w-full mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold">무료 여부</label>
                    <Switch
                      isSelected={selectedExhibition.isFree}
                      onValueChange={(value) => handleFieldChange('isFree', value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold">추천 전시회</label>
                    <Switch
                      isSelected={selectedExhibition.isRecommended}
                      onValueChange={(value) => handleFieldChange('isRecommended', value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                <Textarea
                  label="추가 정보"
                  value={selectedExhibition.add_info || ''}
                  onValueChange={(value) => handleFieldChange('add_info', value)}
                  className="w-full"
                  variant="bordered"
                  size="lg"
                  minRows={3}
                />

                <Input
                  label="홈페이지 URL"
                  value={selectedExhibition.homepage_url || ''}
                  onValueChange={(value) => handleFieldChange('homepage_url', value)}
                  className="w-full"
                  variant="bordered"
                  size="lg"
                />

                <Input
                  label="네이버 갤러리 URL"
                  value={selectedExhibition.naver_gallery_url || ''}
                  onValueChange={(value) => handleFieldChange('naver_gallery_url', value)}
                  className="w-full"
                  variant="bordered"
                  size="lg"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="리뷰 수"
                    type="number"
                    value={selectedExhibition.review_count || 0}
                    onValueChange={(value) => handleFieldChange('review_count', parseInt(value) || 0)}
                    variant="bordered"
                    size="lg"
                  />
                  <Input
                    label="평균 별점"
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={selectedExhibition.review_average || 0}
                    onValueChange={(value) => handleFieldChange('review_average', parseFloat(value) || 0)}
                    variant="bordered"
                    size="lg"
                  />
                </div>
              </div>
            )}
            </div>
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleUpdateExhibition}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {isDeleteOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">전시회 삭제 확인</h3>
            <p className="text-gray-700 mb-2">정말로 이 전시회를 삭제하시겠습니까?</p>
            <p className="text-sm text-gray-500 mb-6">
              {selectedExhibition?.contents}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDeleteExhibition}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
