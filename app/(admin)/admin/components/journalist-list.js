"use client";
import { useState, useEffect } from "react";
import {
  Input,
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Pagination,
  Chip,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { createClient } from "@/utils/supabase/client";
import { debounce } from "lodash";

export function JournalistList({
  onSelectApplication,
  selectedKeys,
  setSelectedKeys,
  refreshToggle,
}) {
  const [search, setSearch] = useState("");
  const [applications, setApplications] = useState([]);
  const [userProfiles, setUserProfiles] = useState({});
  const itemsPerPage = 10;
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const supabase = createClient();

  const GetApplications = async () => {
    const offset = (page - 1) * itemsPerPage;
    console.log("GetApplications 함수 호출됨 - 페이지:", page, "검색어:", search);

    let query = supabase
      .from("journalist_applications")
      .select("*", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(offset, offset + itemsPerPage - 1);

    // search 값이 있을 경우 필터 추가
    if (search.trim()) {
      query = query.or(
        `phone.ilike.%${search}%,introduction.ilike.%${search}%,experience.ilike.%${search}%`
      );
    }

    const { data, error, count } = await query;

    if (error) {
      console.log("기자단 신청 데이터 조회 중 오류:", error);
    }
    console.log(
      "기자단 신청 데이터 조회 결과:",
      data?.length,
      "건, 총:",
      count,
      "건"
    );
    setApplications(data || []);
    setTotalCount(count || 0);
    setTotal(Math.ceil((count || 0) / itemsPerPage));

    // 사용자 프로필 정보 별도 조회
    if (data && data.length > 0) {
      const userIds = data.map(app => app.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);
      
      const profileMap = {};
      profiles?.forEach(profile => {
        profileMap[profile.id] = profile;
      });
      setUserProfiles(profileMap);
    }
  };

  // 컴포넌트 마운트 시 초기 데이터 로드
  useEffect(() => {
    console.log("JournalistList: 컴포넌트 마운트 - 초기 신청 목록 로드");
    GetApplications();
  }, []);

  useEffect(() => {
    if (refreshToggle) {
      console.log(
        "JournalistList: refreshToggle 변경 감지 - 신청 목록 새로고침"
      );
      GetApplications();
    }
  }, [refreshToggle]);

  // debounce 적용한 검색 함수
  const debouncedSearch = debounce(() => {
    GetApplications();
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

  // 신청 선택 처리
  const handleSelectionChange = (keys) => {
    setSelectedKeys(keys);
    const selectedKey = Array.from(keys)[0];

    if (selectedKey) {
      const application = applications.find((a) => a.id === selectedKey);
      if (application) onSelectApplication(application);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "warning";
      case "approved":
        return "success";
      case "rejected":
        return "danger";
      default:
        return "default";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "대기중";
      case "approved":
        return "승인";
      case "rejected":
        return "반려";
      default:
        return status;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">신청 목록 ({totalCount})</h2>
      </div>

      {/* 검색 */}
      <Input
        placeholder="전화번호, 자기소개, 경험으로 검색..."
        value={search}
        onValueChange={setSearch}
        startContent={<Icon icon="mdi:magnify" />}
        className="mb-4"
      />

      {/* 테이블 */}
      <Table
        aria-label="기자단 신청 테이블"
        selectionMode="single"
        selectedKeys={selectedKeys}
        onSelectionChange={handleSelectionChange}
        className="mb-4"
      >
        <TableHeader>
          <TableColumn>신청자</TableColumn>
          <TableColumn>연락처</TableColumn>
          <TableColumn>상태</TableColumn>
          <TableColumn>신청일</TableColumn>
        </TableHeader>
        <TableBody items={applications} emptyContent="신청 내역이 없습니다.">
          {(application) => (
            <TableRow key={application.id}>
              <TableCell>
                <div>
                  <div className="font-medium">
                    {userProfiles[application.user_id]?.full_name || "이름 없음"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {userProfiles[application.user_id]?.email || application.user_id?.slice(0, 8) + "..."}
                  </div>
                </div>
              </TableCell>
              <TableCell>{application.phone}</TableCell>
              <TableCell>
                <Chip
                  size="sm"
                  color={getStatusColor(application.status)}
                  variant="flat"
                >
                  {getStatusText(application.status)}
                </Chip>
              </TableCell>
              <TableCell>
                {new Date(application.created_at).toLocaleDateString()}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* 페이지네이션 */}
      {total > 1 && (
        <div className="flex justify-center">
          <Pagination
            total={total}
            page={page}
            onChange={handlePageChange}
            showControls
          />
        </div>
      )}
    </div>
  );
}

