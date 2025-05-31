"use client";
import { useState, useEffect, useRef } from "react";
import {
  Input,
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Pagination,
  Button,
  addToast,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Progress,
} from "@heroui/react";
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
      <div className="grid grid-cols-4 items-center justify-end gap-4">
        <Button
          className="text-white col-span-4 md:col-span-1"
          color="primary"
          variant="solid"
          onPress={handleUploadClick}
          isLoading={uploading}
        >
          <Icon icon="lucide:upload" className="mr-1" />
          {uploading ? "업로드 중..." : "전시회 엑셀 업로드"}
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
          accept=".xlsx,.xls"
        />
        <Button
          className="text-white col-span-4 md:col-span-1"
          color="primary"
          variant="solid"
          onPress={handleExcelDownload}
          isLoading={uploading}
        >
          <Icon icon="lucide:download" className="mr-1" />
          {uploading ? "처리 중..." : "전시회 엑셀 다운로드"}
        </Button>
        <Button
          className="text-white col-span-4 md:col-span-1"
          color="primary"
          variant="solid"
          onPress={onCreateExhibition}
        >
          <Icon icon="lucide:plus" className="mr-1" />
          전시회 신규 등록
        </Button>
        <Button
          className="text-white col-span-4 md:col-span-1"
          color="primary"
          variant="solid"
          onPress={() => {
            const link = document.createElement("a");
            link.href = "/sample/exhibitionupload.xlsx";
            link.download = "exhibitionupload.xlsx";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }}
        >
          <Icon icon="lucide:file-spreadsheet" className="mr-1" />
          전시회 엑셀 업로드 양식
        </Button>
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
          <Progress
            value={uploadProgress}
            color={getProgressColor()}
            size="md"
            showValueLabel={false}
          />
        </div>
      )}
      <div className="flex items-center gap-4 w-full">
        <Input
          placeholder="전시회 검색..."
          value={search}
          onValueChange={setSearch}
          startContent={
            <Icon icon="lucide:search" className="text-default-400" />
          }
          className="w-full"
        />
      </div>
      <div className="overflow-x-auto">
        <Table
          classNames={{ wrapper: "p-0" }}
          className="min-w-[600px] "
          shadow="none"
          variant="bordered"
          aria-label="전시회 목록"
          selectionMode="single"
          selectedKeys={selectedKeys}
          onSelectionChange={handleSelectionChange}
        >
          <TableHeader>
            <TableColumn>제목</TableColumn>
            <TableColumn>갤러리</TableColumn>
            <TableColumn>시작일</TableColumn>
            <TableColumn>종료일</TableColumn>
            <TableColumn>URL</TableColumn>
          </TableHeader>
          <TableBody>
            {exhibitions.map((exhibition) => (
              <TableRow key={exhibition.id}>
                <TableCell>{exhibition.contents}</TableCell>
                <TableCell>{exhibition.naver_gallery_url.name}</TableCell>
                <TableCell>{exhibition.start_date}</TableCell>
                <TableCell>{exhibition.end_date}</TableCell>
                <TableCell>
                  <Link className="text-blue-500 underline" href={exhibition.naver_gallery_url.url} target="_blank">
                    {exhibition.naver_gallery_url.url}
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex justify-center w-full">
        <Pagination
          page={page}
          total={total}
          initialPage={1}
          onChange={handlePageChange}
          showControls
        />
      </div>
    </div>
  );
}
