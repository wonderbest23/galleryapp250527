"use client";
import { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { createClient } from "@/utils/supabase/client";
import { debounce } from "lodash";
import Link from "next/link";
import * as XLSX from "xlsx";
import axios from "axios";

export function ExhibitionList({
  onSelectExhibition,
  selectedKeys,
  onSelectionChange,
  onCreateExhibition,
  onRefresh,
  refreshToggle,
  setRefreshToggle,
}) {
  const [search, setSearch] = useState("");
  const [exhibitions, setExhibitions] = useState([]);
  const itemsPerPage = 5;
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(10);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [progressVisible, setProgressVisible] = useState(false);
  const [progressStatus, setProgressStatus] = useState(""); // 'processing', 'success', 'failed'
  const supabase = createClient();
  const fileInputRef = useRef(null);

  const GetExhibitions = async () => {
    const offset = (page - 1) * itemsPerPage;
    console.log(
      "GetExhibitions 함수 호출됨 - 페이지:",
      page,
      "검색어:",
      search
    );

    let query = supabase
      .from("exhibition")
      .select("*, naver_gallery_url(*)", { count: 'exact' })
      .order("id", { ascending: false })
      .range(offset, offset + itemsPerPage - 1);

    // search 값이 있을 경우 필터 추가
    if (search.trim()) {
      query = query.or(
        `contents.ilike.%${search}%`,
        `naver_gallery_url.name.ilike.%${search}%`,
        `naver_gallery_url.url.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;
    console.log("data:", data)
    if (error) {
      console.error("전시회 데이터 조회 중 오류:", error);
    }
    console.log('count:', count)
    console.log(
      "전시회 데이터 조회 결과:",
      data?.length,
      "건, 총:",
      count,
      "건"
    );
    setExhibitions(data || []);
    setTotal(Math.ceil(count / itemsPerPage));
  };

  // 외부에서 호출할 수 있는 새로고침 함수 추가
  const refreshExhibitions = () => {
    console.log("refreshExhibitions 함수 호출됨 - 전시회 목록 새로고침");
    GetExhibitions();
  };

  // onRefresh props가 존재하면 refreshExhibitions 함수 전달
  useEffect(() => {
    if (onRefresh) {
      console.log(
        "ExhibitionList: onRefresh 함수에 refreshExhibitions 함수 전달"
      );
      onRefresh(refreshExhibitions);
    }
  }, [onRefresh]);

  useEffect(() => {
    if (refreshToggle) {
      console.log(
        "ExhibitionList: refreshToggle 변경 감지 - 전시회 목록 새로고침"
      );
      GetExhibitions();
    }
  }, [refreshToggle]);

  // debounce 적용한 검색 함수
  const debouncedSearch = debounce(() => {
    GetExhibitions();
  }, 500);

  useEffect(() => {
    debouncedSearch();
    // 컴포넌트 언마운트 시 debounce 취소
    return () => {
      debouncedSearch.cancel();
    };
  }, [page, search]);

  // 페이지 변경 처리 함수
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  // 전시회 선택 처리
  const handleSelectionChange = (keys) => {
    console.log('ExhibitionList - handleSelectionChange 호출됨:', keys);
    console.log('keys 타입:', typeof keys, 'keys 값:', Array.from(keys));
    
    onSelectionChange(keys);
    const selectedKey = Array.from(keys)[0];
    console.log('selectedKey:', selectedKey, '타입:', typeof selectedKey);

    if (selectedKey) {
      // selectedKey가 문자열이므로 숫자로 변환하여 비교
      const selectedId = parseInt(selectedKey);
      const exhibition = exhibitions.find((e) => e.id === selectedId);
      console.log('찾은 exhibition:', exhibition);
      console.log('전체 exhibitions:', exhibitions.map(e => ({id: e.id, contents: e.contents})));
      
      if (exhibition) {
        console.log('ExhibitionList - onSelectExhibition 호출:', exhibition);
        // 새로운 객체로 복사하여 전달
        const exhibitionCopy = {
          ...exhibition,
          naver_gallery_url: exhibition.naver_gallery_url ? {
            ...exhibition.naver_gallery_url
          } : null
        };
        onSelectExhibition(exhibitionCopy);
      } else {
        console.log('exhibition을 찾지 못함. selectedId:', selectedId);
        console.log('exhibitions IDs:', exhibitions.map(e => e.id));
      }
    } else {
      console.log('선택된 키가 없음');
    }
  };

  // 엑셀 파일 업로드 처리 함수
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // 파일 형식 검사
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      addToast({
        title: "파일 형식 오류",
        description: "Excel 파일(.xlsx 또는 .xls)만 업로드 가능합니다.",
        color: "danger",
      });
      return;
    }

    setUploading(true);
    setProgressVisible(true);
    setUploadProgress(0);
    setProgressStatus("processing");

    try {
      const formData = new FormData();
      formData.append("file", file);

      // FastAPI 엔드포인트로 요청
      const response = await axios.post(
        "https://3zggqc3igf.execute-api.ap-northeast-2.amazonaws.com/upload-exhibition/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (!response.data || !response.data.task_id) {
        throw new Error("업로드 작업 ID를 받지 못했습니다.");
      }

      const taskId = response.data.task_id;

      // 폴링 시작
      let completed = false;
      while (!completed) {
        // 0.5초마다 상태 확인
        await new Promise((resolve) => setTimeout(resolve, 500));

        const statusResponse = await axios.get(
          `https://3zggqc3igf.execute-api.ap-northeast-2.amazonaws.com/exhibition-upload-status/${taskId}`
        );
        const status = statusResponse.data;

        // 진행 상황 업데이트
        setUploadProgress(status.percentage || 0);

        if (status.completed) {
          completed = true;
          setProgressStatus("completed");

          // 최종 결과 표시
          addToast({
            title: "전시회 업로드 결과",
            description: `총 ${status.total}건 중 ${status.success_count}건 성공, ${status.failed_count}건 실패`,
            color: status.success_count > 0 ? "success" : "warning",
          });
        }
      }

      // 목록 새로고침
      GetExhibitions();
    } catch (error) {
      console.error("파일 업로드 중 오류 발생:", error);
      addToast({
        title: "업로드 오류",
        description: `파일 업로드 중 오류가 발생했습니다: ${error.message}`,
        color: "danger",
      });
      setProgressStatus("failed");
    } finally {
      setUploading(false);
      // 5초 후 프로그레스 바 숨기기
      setTimeout(() => {
        setProgressVisible(false);
      }, 5000);
      // 파일 인풋 초기화
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // 엑셀 업로드 버튼 클릭 처리 함수
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // 전시회 전체 데이터를 가져와서 엑셀로 다운로드하는 함수
  const handleExcelDownload = async () => {
    try {
      setUploading(true); // 로딩 상태 활성화

      // 모든 전시회 데이터 가져오기
      const { data, error } = await supabase
        .from("exhibition")
        .select("*")
        .order("id", { ascending: false });

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        // 엑셀 워크시트 생성
        const worksheet = XLSX.utils.json_to_sheet(data);

        // 열 너비 설정
        const columnWidths = [
          { wch: 10 }, // id
          { wch: 40 }, // title
          { wch: 30 }, // gallery_name
          { wch: 30 }, // artist
          { wch: 40 }, // naver_gallery_url
          { wch: 30 }, // 기타 필드들...
        ];
        worksheet["!cols"] = columnWidths;

        // 워크북 생성 및 워크시트 추가
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "전시회 목록");

        // 엑셀 파일로 내보내기
        XLSX.writeFile(
          workbook,
          "전시회목록_" + new Date().toISOString().split("T")[0] + ".xlsx"
        );

        addToast({
          title: "다운로드 완료",
          description: `총 ${data.length}건의 전시회 데이터를 다운로드했습니다.`,
          color: "success",
        });
      } else {
        addToast({
          title: "다운로드 실패",
          description: "다운로드할 전시회 데이터가 없습니다.",
          color: "warning",
        });
      }
    } catch (error) {
      console.error("전시회 데이터 다운로드 중 오류:", error);
      addToast({
        title: "다운로드 오류",
        description: "전시회 데이터를 다운로드하는 중 오류가 발생했습니다.",
        color: "danger",
      });
    } finally {
      setUploading(false); // 로딩 상태 비활성화
    }
  };

  // 프로그레스 바의 색상 설정
  const getProgressColor = () => {
    switch (progressStatus) {
      case "success":
        return "success";
      case "failed":
        return "danger";
      default:
        return "primary";
    }
  };

  return (
    <div className="space-y-4 ExhibitionList">
      <div className="grid grid-cols-4 items-stretch justify-end gap-4">
        <button
          onClick={handleUploadClick}
          disabled={uploading}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors col-span-4 md:col-span-1 min-h-[48px] text-sm"
        >
          <Icon icon="lucide:upload" className="w-4 h-4" />
          <span className="text-center leading-tight">
            {uploading ? "업로드 중..." : "전시회 엑셀 업로드"}
          </span>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
          accept=".xlsx,.xls"
        />
        <button
          onClick={handleExcelDownload}
          disabled={uploading}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors col-span-4 md:col-span-1 min-h-[48px] text-sm"
        >
          <Icon icon="lucide:download" className="w-4 h-4" />
          <span className="text-center leading-tight">
            {uploading ? "처리 중..." : "전시회 엑셀 다운로드"}
          </span>
        </button>
        <button
          onClick={onCreateExhibition}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition-colors col-span-4 md:col-span-1 min-h-[48px] text-sm"
        >
          <Icon icon="lucide:plus" className="w-4 h-4" />
          <span className="text-center leading-tight">
            전시회 신규 등록
          </span>
        </button>
        <button
          onClick={() => {
            const link = document.createElement("a");
            link.href = "/sample/exhibitionupload.xlsx";
            link.download = "exhibitionupload.xlsx";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-md hover:bg-blue-700 transition-colors col-span-4 md:col-span-1 min-h-[48px] text-sm"
        >
          <Icon icon="lucide:file-spreadsheet" className="w-4 h-4" />
          <span className="text-center leading-tight">
            전시회 엑셀 업로드 양식
          </span>
        </button>
      </div>
      {progressVisible && (
        <div className="w-full">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">
              {progressStatus === "completed"
                ? "업로드 완료"
                : progressStatus === "failed"
                  ? "업로드 실패"
                  : "업로드 진행 중..."}
            </span>
            <span className="text-sm font-medium">
              {Math.round(uploadProgress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                uploadProgress < 30 ? 'bg-red-500' : 
                uploadProgress < 70 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}
      <div className="flex items-center gap-4 w-full">
        <div className="relative w-full">
          <Icon icon="lucide:search" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="전시회 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[600px] w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">제목</th>
              <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">갤러리</th>
              <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">시작일</th>
              <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">종료일</th>
              <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">URL</th>
            </tr>
          </thead>
          <tbody>
            {exhibitions.map((exhibition) => (
              <tr 
                key={exhibition.id} 
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  const newKeys = new Set([exhibition.id]);
                  handleSelectionChange(newKeys);
                }}
              >
                <td className="border border-gray-300 px-4 py-2 text-sm">{exhibition.contents}</td>
                <td className="border border-gray-300 px-4 py-2 text-sm">{exhibition.naver_gallery_url.name}</td>
                <td className="border border-gray-300 px-4 py-2 text-sm">{exhibition.start_date}</td>
                <td className="border border-gray-300 px-4 py-2 text-sm">{exhibition.end_date}</td>
                <td className="border border-gray-300 px-4 py-2 text-sm">
                  <Link className="text-blue-500 underline" href={exhibition.naver_gallery_url.url} target="_blank">
                    {exhibition.naver_gallery_url.url}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-center w-full">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            이전
          </button>
          <span className="px-3 py-2 text-sm text-gray-700">
            {page} / {total}
          </span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= total}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            다음
          </button>
        </div>
      </div>
    </div>
  );
}
