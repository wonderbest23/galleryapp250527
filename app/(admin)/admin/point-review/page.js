"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { 
  Button, 
  Card, 
  CardBody, 
  Chip, 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  useDisclosure, 
  Textarea,
  Input,
  Tabs,
  Tab
} from "@heroui/react";
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Star, 
  Clock, 
  AlertCircle,
  RefreshCw,
  User,
  Calendar,
  DollarSign
} from "lucide-react";

export default function PointReviewPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [adminComment, setAdminComment] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedTab, setSelectedTab] = useState("pending");
  const [showTestData, setShowTestData] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchPointReviewRequests();
  }, []);

  const fetchPointReviewRequests = async () => {
    try {
      setLoading(true);
      console.log('=== 포인트 검토 요청 조회 시작 (실제 데이터 기준) ===');
      console.log('현재 시간:', new Date().toISOString());
      
      // 마이페이지와 동일한 로직: 최근 48시간 내 리뷰 = 검토 대기 포인트
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
      console.log('48시간 전:', fortyEightHoursAgo);
      
      // 먼저 전체 리뷰 수 확인
      const { count: totalReviews } = await supabase
        .from('exhibition_review')
        .select('id', { count: 'exact', head: true });
      console.log('전체 리뷰 수:', totalReviews);
      
      // 먼저 exhibition_review 테이블의 기본 구조만 조회 (조인 없이)
      const { data: recentReviews, error } = await supabase
        .from('exhibition_review')
        .select(`
          id,
          user_id,
          rating,
          description,
          created_at,
          exhibition_id,
          title
        `)
        .gte('created_at', fortyEightHoursAgo)
        .order('created_at', { ascending: false });
        
      console.log('최근 48시간 리뷰 조회 결과:', { count: recentReviews?.length, error });
      console.log('리뷰 상세 데이터:', recentReviews);

      if (error) {
        console.error("리뷰 데이터 조회 오류:", error);
        return;
      }

      // 이미 처리된 (승인/거부) 리뷰 ID들 조회 (모든 사용자 대상)
      console.log('이미 처리된 리뷰들 확인 중...');
      const { data: processedTransactions } = await supabase
        .from('point_transactions')
        .select('reference_id, user_id, status')
        .eq('reference_type', 'exhibition_review')
        .in('status', ['completed', 'rejected']);

      const processedReviewIds = new Set((processedTransactions || []).map(t => t.reference_id));
      console.log('처리된 리뷰 ID들:', processedReviewIds.size, '개');

      // 아직 처리되지 않은 리뷰만 필터링
      const pendingReviews = (recentReviews || []).filter(review => !processedReviewIds.has(review.id));
      console.log('검토 대기 리뷰들:', pendingReviews.length, '개 (전체:', recentReviews?.length, '개)');
      console.log('처리된 리뷰 ID들:', Array.from(processedReviewIds));
      console.log('대기 중인 리뷰 ID들:', pendingReviews.map(r => r.id));

      // 사용자별 그룹화하여 포인트 검토 요청으로 변환
      const userReviewMap = {};
      pendingReviews.forEach(review => {
        const userId = review.user_id;
        if (!userReviewMap[userId]) {
          userReviewMap[userId] = {
            user_id: userId,
            reviews: [],
            total_points: 0,
            latest_review_at: review.created_at
          };
        }
        userReviewMap[userId].reviews.push(review);
        userReviewMap[userId].total_points += 500; // 리뷰당 500P
        
        // 가장 최근 리뷰 시간 업데이트
        if (new Date(review.created_at) > new Date(userReviewMap[userId].latest_review_at)) {
          userReviewMap[userId].latest_review_at = review.created_at;
        }
      });

      // 사용자 정보 병합
      const userIds = Object.keys(userReviewMap);
      console.log('사용자 ID 목록:', userIds);
      let usersData = [];
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', userIds);
        console.log('프로필 조회 결과:', { profiles, profilesError });
        usersData = profiles || [];
      } else {
        console.log('사용자 ID가 없어서 프로필 조회 건너뜀');
      }

      // 최종 검토 요청 목록 생성
      const requestsData = Object.values(userReviewMap).map(userReview => {
        const profile = usersData.find(p => p.id === userReview.user_id);
        return {
          id: `review_${userReview.user_id}_${Date.now()}`, // 임시 ID
          user_id: userReview.user_id,
          user_email: profile?.email || '이메일 없음',
          user_name: profile?.full_name || '이름 없음',
          points: userReview.total_points,
          review_count: userReview.reviews.length,
          status: 'pending',
          created_at: userReview.latest_review_at,
          reviews: userReview.reviews
        };
      });

      console.log('=== 최종 포인트 검토 요청 목록 ===');
      console.log('총 요청 수:', requestsData.length);
      console.log('요청 목록:', requestsData);
      
      // rena35200@gmail.com 계정 확인
      const renaData = requestsData.filter(item => 
        item.user_email?.includes('rena35200') || 
        item.user_name?.toLowerCase().includes('rena')
      );
      console.log('=== rena35200@gmail.com 계정 데이터 ===');
      console.log('rena 계정 요청 수:', renaData.length);
      console.log('rena 계정 상세:', renaData);
      
      // 모든 사용자 이메일 확인
      console.log('=== 모든 사용자 이메일 ===');
      requestsData.forEach((item, index) => {
        console.log(`${index + 1}. ${item.user_email} (${item.user_name}) - ${item.points}P`);
      });
      
      // 데이터가 없을 경우 안내 메시지
      if (requestsData.length === 0) {
        console.log('⚠️ 검토 대기 포인트가 없습니다. 다음을 확인해보세요:');
        console.log('1. 최근 48시간 내에 리뷰가 작성되었는지');
        console.log('2. 해당 리뷰가 이미 승인/거부되었는지');
        console.log('3. exhibition_review 테이블에 데이터가 있는지');
        setShowTestData(true);
      } else {
        setShowTestData(false);
      }
      
      setRequests(requestsData);
      
    } catch (error) {
      console.error("포인트 검토 요청 조회 중 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const createTestData = async () => {
    try {
      console.log('테스트 데이터 생성 중...');
      
      // 1. 테스트 전시회 생성 (exhibition 테이블 구조에 맞게)
      const { data: exhibition, error: exhibitionError } = await supabase
        .from('exhibition')
        .insert({
          name: '테스트 전시회', // title 대신 name 사용
          location: '테스트 갤러리',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          description: '테스트용 전시회입니다.'
        })
        .select()
        .single();
        
      if (exhibitionError) {
        console.error('전시회 생성 오류:', exhibitionError);
        // exhibition 테이블이 없거나 구조가 다를 수 있으니 exhibition_id를 null로 설정
        console.log('전시회 테이블 오류, exhibition_id를 null로 설정');
      } else {
        console.log('전시회 생성 완료:', exhibition);
      }
      
      // 2. 테스트 사용자 프로필 생성 (이미 있으면 스킵)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', 'test@example.com')
        .single();
        
      let userId;
      if (!existingProfile) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            email: 'test@example.com',
            full_name: '테스트 사용자',
            points: 0
          })
          .select()
          .single();
          
        if (profileError) {
          console.error('프로필 생성 오류:', profileError);
          return;
        }
        userId = profile.id;
      } else {
        userId = existingProfile.id;
      }
      
      console.log('사용자 ID:', userId);
      
      // 3. 테스트 리뷰 생성 (최근 48시간 내)
      const { data: review, error: reviewError } = await supabase
        .from('exhibition_review')
        .insert({
          user_id: userId,
          exhibition_id: exhibition?.id || null, // exhibition이 없으면 null
          rating: 5,
          title: '테스트 전시회 리뷰', // title 컬럼 추가
          description: '테스트 리뷰입니다. 포인트 검토를 위한 샘플 데이터입니다.',
          created_at: new Date().toISOString() // 현재 시간으로 설정
        })
        .select()
        .single();
        
      if (reviewError) {
        console.error('리뷰 생성 오류:', reviewError);
        return;
      }
      
      console.log('테스트 리뷰 생성 완료:', review);
      alert('테스트 데이터가 생성되었습니다! 페이지를 새로고침해주세요.');
      
    } catch (error) {
      console.error('테스트 데이터 생성 중 오류:', error);
      alert('테스트 데이터 생성에 실패했습니다.');
    }
  };

  const handleApprove = async (requestId) => {
    const request = requests.find(r => r.id === requestId);
    if (!request) {
      alert("검토 요청을 찾을 수 없습니다.");
      return;
    }

    try {
      // 해당 사용자의 리뷰들에 대해 포인트 승인 처리
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      // profiles 테이블에서 현재 포인트 조회
      const { data: profileData } = await supabase
        .from('profiles')
        .select('points')
        .eq('id', request.user_id)
        .single();

      const currentPoints = profileData?.points || 0;
      const newPoints = currentPoints + request.points;

      // 포인트 업데이트
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ points: newPoints })
        .eq('id', request.user_id);

      if (updateError) {
        console.error("포인트 업데이트 오류:", updateError);
        alert("포인트 승인에 실패했습니다.");
        return;
      }

      // 각 리뷰에 대해 포인트 승인 기록 생성
      for (const review of request.reviews) {
        await supabase.from('point_transactions').insert({
          user_id: request.user_id,
          type: 'earn',
          amount: 500,
          description: `리뷰 작성 포인트 적립 (관리자 승인)`,
          reference_id: review.id,
          reference_type: 'exhibition_review',
          status: 'completed'
        });
      }

      // 포인트 승인 알림 생성
      await supabase.from('user_notifications').insert({
        user_id: request.user_id,
        type: 'point_approved',
        title: '포인트 적립 완료',
        message: `${request.points}P 포인트가 적립되었습니다! 리뷰 ${request.review_count}개에 대한 포인트입니다.`,
        details: `승인된 포인트: ${request.points}P (리뷰 ${request.review_count}개 × 500P)`
      });

      console.log(`승인 완료: ${request.user_email} → ${request.points}P`);
      alert(`${request.user_name} (${request.user_email}) 계정에 ${request.points}P 포인트가 승인되었습니다!`);
      setAdminComment("");
      onClose();
      fetchPointReviewRequests();
    } catch (error) {
      console.error("포인트 승인 처리 중 오류:", error);
      alert("포인트 승인 처리에 실패했습니다.");
    }
  };

  const handleReject = async (requestId) => {
    if (!rejectionReason.trim()) {
      alert("거부 사유를 입력해주세요.");
      return;
    }

    const request = requests.find(r => r.id === requestId);
    if (!request) {
      alert("검토 요청을 찾을 수 없습니다.");
      return;
    }

    try {
      // 각 리뷰에 대해 포인트 거부 기록 생성 (거부된 리뷰는 다시 검토 목록에 안 나타남)
      for (const review of request.reviews) {
        await supabase.from('point_transactions').insert({
          user_id: request.user_id,
          type: 'rejected',
          amount: 0, // 거부된 포인트는 0으로 기록 (실제로 지급되지 않음)
          description: `리뷰 포인트 거부: ${rejectionReason}`,
          reference_id: review.id,
          reference_type: 'exhibition_review',
          status: 'rejected',
          admin_comment: adminComment || null
        });
      }

      // 알림 생성
      await supabase.from('user_notifications').insert({
        user_id: request.user_id,
        type: 'point_rejected',
        title: '포인트 적립 거부',
        message: `${request.points}P 포인트 적립이 거부되었습니다. 사유: ${rejectionReason}`,
        details: `거부 사유: ${rejectionReason}\n거부된 리뷰: ${request.review_count}개`
      });

      console.log(`거부 완료: ${request.user_email} → ${request.points}P 거부`);
      alert(`${request.user_name} (${request.user_email}) 계정의 ${request.points}P 포인트가 거부되었습니다!`);
      setRejectionReason("");
      setAdminComment("");
      onClose();
      fetchPointReviewRequests();
    } catch (error) {
      console.error("포인트 거부 처리 중 오류:", error);
      alert("포인트 거부 처리에 실패했습니다.");
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
      case "re_review_requested":
        return "primary";
      default:
        return "default";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "검토 대기";
      case "approved":
        return "승인됨";
      case "rejected":
        return "거부됨";
      case "re_review_requested":
        return "재검토 요청";
      default:
        return "알 수 없음";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "approved":
        return <CheckCircle className="w-4 h-4" />;
      case "rejected":
        return <XCircle className="w-4 h-4" />;
      case "re_review_requested":
        return <RefreshCw className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const openDetailModal = (request) => {
    setSelectedRequest(request);
    setAdminComment(request.admin_comment || "");
    setRejectionReason(request.rejection_reason || "");
    onOpen();
  };

  const filteredRequests = requests.filter(request => {
    switch (selectedTab) {
      case "pending":
        return request.status === "pending";
      case "approved":
        return request.status === "approved";
      case "rejected":
        return request.status === "rejected";
      case "re_review":
        return request.status === "re_review_requested";
      default:
        return true;
    }
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">포인트 적립 검토 관리</h1>
        <Button onClick={fetchPointReviewRequests} color="primary" startContent={<RefreshCw className="w-4 h-4" />}>
          새로고침
        </Button>
      </div>

      {/* 탭 메뉴 */}
      <Tabs 
        selectedKey={selectedTab} 
        onSelectionChange={setSelectedTab}
        color="primary"
        variant="underlined"
      >
        <Tab key="pending" title={`검토 대기 (${requests.filter(r => r.status === "pending").length})`} />
        <Tab key="approved" title={`승인됨 (${requests.filter(r => r.status === "approved").length})`} />
        <Tab key="rejected" title={`거부됨 (${requests.filter(r => r.status === "rejected").length})`} />
        <Tab key="re_review" title={`재검토 요청 (${requests.filter(r => r.status === "re_review_requested").length})`} />
      </Tabs>

      <div className="grid gap-4">
        {filteredRequests.length === 0 ? (
          <Card>
            <CardBody className="text-center py-8">
              <div className="space-y-4">
                <div className="text-gray-500">
                  {selectedTab === "pending" && (
                    <div>
                      <p className="text-lg font-medium mb-2">검토 대기 중인 포인트 요청이 없습니다.</p>
                      <p className="text-sm text-gray-400">
                        최근 48시간 내에 작성된 리뷰가 없거나, 모든 리뷰가 이미 처리되었습니다.
                      </p>
                    </div>
                  )}
                  {selectedTab === "approved" && "승인된 포인트 요청이 없습니다."}
                  {selectedTab === "rejected" && "거부된 포인트 요청이 없습니다."}
                  {selectedTab === "re_review" && "재검토 요청이 없습니다."}
                </div>
                {selectedTab === "pending" && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg text-left">
                      <h4 className="font-medium text-blue-800 mb-2">💡 확인사항</h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• 사용자가 최근 48시간 내에 리뷰를 작성했는지 확인</li>
                        <li>• 해당 리뷰가 이미 승인/거부되었는지 확인</li>
                        <li>• exhibition_review 테이블에 데이터가 있는지 확인</li>
                      </ul>
                    </div>
                    {showTestData && (
                      <div className="bg-yellow-50 p-4 rounded-lg text-left">
                        <h4 className="font-medium text-yellow-800 mb-2">🧪 테스트 데이터 생성</h4>
                        <p className="text-sm text-yellow-700 mb-3">
                          포인트 검토 기능을 테스트하기 위해 샘플 데이터를 생성할 수 있습니다.
                        </p>
                        <Button 
                          color="warning" 
                          size="sm" 
                          onClick={createTestData}
                          startContent={<RefreshCw className="w-4 h-4" />}
                        >
                          테스트 데이터 생성
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Card key={request.id}>
              <CardBody>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">
                        {request.user_name} ({request.user_email})
                      </h3>
                      <Chip 
                        color={getStatusColor(request.status)} 
                        size="sm"
                        startContent={getStatusIcon(request.status)}
                      >
                        {getStatusText(request.status)}
                      </Chip>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <User className="w-4 h-4 text-gray-500" />
                          <span>사용자: {request.user_name} ({request.user_email})</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="w-4 h-4 text-gray-500" />
                          <span>검토 포인트: {request.points || 0}P</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Star className="w-4 h-4 text-gray-500" />
                          <span>작성 리뷰: {request.review_count || 0}개</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span>요청일: {new Date(request.created_at).toLocaleDateString('ko-KR')}</span>
                        </div>
                        {request.processed_at && (
                          <div className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-gray-500" />
                            <span>처리일: {new Date(request.processed_at).toLocaleDateString('ko-KR')}</span>
                          </div>
                        )}
                        {request.admin_id && (
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-4 h-4 text-gray-500" />
                            <span>처리자: {request.admin_id?.slice(0,8)}...</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg mb-2">
                      <p className="text-sm text-gray-700">
                        <strong>리뷰 정보:</strong> {request.review_count}개 리뷰로 {request.points}P 적립 대기
                      </p>
                      {request.reviews && request.reviews.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {request.reviews.slice(0, 2).map((review, idx) => (
                            <div key={idx} className="text-xs text-gray-600">
                              • {review.title || `전시회 ID: ${review.exhibition_id}`} ({review.rating}/5점)
                            </div>
                          ))}
                          {request.reviews.length > 2 && (
                            <div className="text-xs text-gray-500">...외 {request.reviews.length - 2}개</div>
                          )}
                        </div>
                      )}
                    </div>

                    {request.admin_comment && (
                      <div className="bg-blue-50 p-3 rounded-lg mb-2">
                        <p className="text-sm text-blue-700">
                          <strong>관리자 코멘트:</strong> {request.admin_comment}
                        </p>
                      </div>
                    )}

                    {request.rejection_reason && (
                      <div className="bg-red-50 p-3 rounded-lg mb-2">
                        <p className="text-sm text-red-700">
                          <strong>거부 사유:</strong> {request.rejection_reason}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="flat"
                      startContent={<Eye className="w-4 h-4" />}
                      onPress={() => openDetailModal(request)}
                    >
                      상세보기
                    </Button>
                    
                    {request.status === "pending" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          color="success"
                          startContent={<CheckCircle className="w-4 h-4" />}
                          onPress={() => {
                            setSelectedRequest(request);
                            onOpen();
                          }}
                        >
                          승인
                        </Button>
                        <Button
                          size="sm"
                          color="danger"
                          startContent={<XCircle className="w-4 h-4" />}
                          onPress={() => {
                            setSelectedRequest(request);
                            onOpen();
                          }}
                        >
                          거부
                        </Button>
                      </div>
                    )}

                    {request.status === "rejected" && (
                      <Button
                        size="sm"
                        color="warning"
                        startContent={<RefreshCw className="w-4 h-4" />}
                        onPress={() => {
                          setSelectedRequest(request);
                          onOpen();
                        }}
                      >
                        재검토
                      </Button>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))
        )}
      </div>

      {/* 상세보기/처리 모달 */}
      <Modal isOpen={isOpen} onClose={onClose} size="3xl">
        <ModalContent>
          <ModalHeader>
            <h3 className="text-lg font-semibold">포인트 검토 상세 정보</h3>
          </ModalHeader>
          <ModalBody>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">사용자 정보</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p><strong>이름:</strong> {selectedRequest.user_name}</p>
                      <p><strong>이메일:</strong> {selectedRequest.user_email}</p>
                      <p><strong>사용자 ID:</strong> {selectedRequest.user_id?.slice(0,8)}...</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">포인트 정보</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p><strong>검토 포인트:</strong> {selectedRequest.points || 0}P</p>
                      <p><strong>작성 리뷰:</strong> {selectedRequest.review_count || 0}개</p>
                      <p><strong>최근 작성:</strong> {new Date(selectedRequest.created_at).toLocaleString('ko-KR')}</p>
                    </div>
                  </div>
                </div>

                {/* 리뷰 상세 목록 */}
                <div>
                  <h4 className="font-medium mb-2">작성된 리뷰 목록</h4>
                  <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                    {selectedRequest.reviews && selectedRequest.reviews.length > 0 ? (
                      selectedRequest.reviews.map((review, idx) => (
                        <div key={idx} className="p-2 bg-white rounded border border-gray-200">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">
                              {review.exhibition_id?.title || '전시회 제목 없음'}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">
                                {review.rating}/5점
                              </span>
                              <span className="text-xs text-blue-600 font-medium">
                                500P
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                            {review.description || '내용 없음'}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">리뷰 정보가 없습니다.</p>
                    )}
                  </div>
                </div>

                {selectedRequest.status === "pending" && (
                  <div>
                    <h4 className="font-medium mb-2">관리자 코멘트</h4>
                    <Textarea
                      placeholder="관리자 코멘트를 입력해주세요 (선택사항)..."
                      value={adminComment}
                      onChange={(e) => setAdminComment(e.target.value)}
                      minRows={2}
                    />
                  </div>
                )}

                {selectedRequest.status === "pending" && (
                  <div>
                    <h4 className="font-medium mb-2">거부 사유</h4>
                    <Textarea
                      placeholder="거부 사유를 입력해주세요..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      minRows={3}
                    />
                  </div>
                )}

                {selectedRequest.admin_comment && (
                  <div>
                    <h4 className="font-medium mb-2">관리자 코멘트</h4>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-blue-700">{selectedRequest.admin_comment}</p>
                    </div>
                  </div>
                )}
                
                {selectedRequest.rejection_reason && (
                  <div>
                    <h4 className="font-medium mb-2">거부 사유</h4>
                    <div className="bg-red-50 p-3 rounded-lg">
                      <p className="text-red-700">{selectedRequest.rejection_reason}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              닫기
            </Button>
            {selectedRequest?.status === "pending" && (
              <>
                <Button
                  color="success"
                  startContent={<CheckCircle className="w-4 h-4" />}
                  onPress={() => {
                    handleApprove(selectedRequest.id);
                    onClose();
                  }}
                >
                  승인
                </Button>
                <Button
                  color="danger"
                  startContent={<XCircle className="w-4 h-4" />}
                  onPress={() => handleReject(selectedRequest.id)}
                >
                  거부
                </Button>
              </>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}

