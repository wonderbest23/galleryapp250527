"use client";
import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button, Card, CardBody, Chip, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/react";
import { AlertTriangle, CheckCircle, XCircle, Eye, User, Calendar, MapPin } from "lucide-react";

export default function ReviewMonitoringPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState(null);
  const [suspiciousUsers, setSuspiciousUsers] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const supabase = createClient();

  useEffect(() => {
    fetchReviewData();
    fetchSuspiciousUsers();
  }, []);

  const fetchReviewData = async () => {
    try {
      setLoading(true);
      
      // 최근 7일간의 리뷰 데이터 조회
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from("exhibition_review")
        .select(`
          *,
          exhibition:exhibition_id (
            id,
            title,
            location,
            status
          )
        `)
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("리뷰 데이터 조회 오류:", error);
        return;
      }

      // 어뷰징 점수 계산
      const reviewsWithScore = await Promise.all(
        (data || []).map(async (review) => {
          const abuseScore = await calculateAbuseScore(review);
          return { ...review, abuseScore };
        })
      );

      setReviews(reviewsWithScore);
    } catch (error) {
      console.error("리뷰 데이터 처리 중 오류:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuspiciousUsers = async () => {
    try {
      // 하루에 2개 이상, 한 달에 15개 이상 리뷰를 작성한 사용자 조회
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const { data, error } = await supabase
        .from("exhibition_review")
        .select("user_id, name, created_at")
        .gte("created_at", startOfMonth.toISOString());

      if (error) {
        console.error("의심스러운 사용자 조회 오류:", error);
        return;
      }

      // 사용자별 리뷰 개수 집계
      const userStats = {};
      (data || []).forEach(review => {
        const userId = review.user_id;
        if (!userStats[userId]) {
          userStats[userId] = {
            user_id: userId,
            name: review.name,
            total_reviews: 0,
            today_reviews: 0,
            monthly_reviews: 0
          };
        }
        
        userStats[userId].total_reviews++;
        userStats[userId].monthly_reviews++;
        
        if (new Date(review.created_at) >= startOfDay) {
          userStats[userId].today_reviews++;
        }
      });

      // 의심스러운 사용자 필터링
      const suspicious = Object.values(userStats).filter(user => 
        user.today_reviews >= 2 || user.monthly_reviews >= 15
      );

      setSuspiciousUsers(suspicious);
    } catch (error) {
      console.error("의심스러운 사용자 처리 중 오류:", error);
    }
  };

  const calculateAbuseScore = async (review) => {
    let score = 0;
    
    try {
      // 1. 같은 사용자의 최근 리뷰 개수 확인
      const { data: recentReviews } = await supabase
        .from("exhibition_review")
        .select("id")
        .eq("user_id", review.user_id)
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (recentReviews && recentReviews.length > 1) {
        score += 20;
      }

      // 2. 같은 전시회에 대한 중복 리뷰 확인
      const { data: duplicateReviews } = await supabase
        .from("exhibition_review")
        .select("id")
        .eq("user_id", review.user_id)
        .eq("exhibition_id", review.exhibition_id);

      if (duplicateReviews && duplicateReviews.length > 1) {
        score += 50;
      }

      // 3. 리뷰 내용 길이 확인 (너무 짧거나 긴 경우)
      if (review.description && review.description.length < 20) {
        score += 10;
      }
      if (review.description && review.description.length > 500) {
        score += 5;
      }

      // 4. 별점 패턴 확인 (모두 5점 또는 모두 1점)
      const { data: userRatings } = await supabase
        .from("exhibition_review")
        .select("rating")
        .eq("user_id", review.user_id)
        .limit(10);

      if (userRatings && userRatings.length >= 3) {
        const allSame = userRatings.every(r => r.rating === userRatings[0].rating);
        if (allSame) {
          score += 15;
        }
      }

    } catch (error) {
      console.error("어뷰징 점수 계산 오류:", error);
    }

    return score;
  };

  const getAbuseScoreColor = (score) => {
    if (score >= 50) return "danger";
    if (score >= 30) return "warning";
    if (score >= 10) return "primary";
    return "success";
  };

  const getAbuseScoreText = (score) => {
    if (score >= 50) return "높음";
    if (score >= 30) return "중간";
    if (score >= 10) return "낮음";
    return "정상";
  };

  const openDetailModal = (review) => {
    setSelectedReview(review);
    onOpen();
  };

  const handleReviewAction = async (reviewId, action) => {
    try {
      let updateData = {};
      
      if (action === 'approve') {
        updateData = { status: 'approved' };
      } else if (action === 'reject') {
        updateData = { status: 'rejected', rejection_reason: '관리자에 의한 거부' };
      }

      const { error } = await supabase
        .from('exhibition_review')
        .update(updateData)
        .eq('id', reviewId);

      if (error) {
        console.error('리뷰 상태 변경 오류:', error);
        alert('상태 변경에 실패했습니다.');
        return;
      }

      alert(`${action === 'approve' ? '승인' : '거부'}되었습니다.`);
      fetchReviewData();
      onClose();
    } catch (error) {
      console.error('리뷰 상태 변경 중 오류:', error);
      alert('상태 변경 중 오류가 발생했습니다.');
    }
  };

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
        <h1 className="text-2xl font-bold">리뷰 어뷰징 모니터링</h1>
        <Button onClick={fetchReviewData} color="primary">
          새로고침
        </Button>
      </div>

      {/* 의심스러운 사용자 요약 */}
      <Card>
        <CardBody>
          <h2 className="text-lg font-semibold mb-4">의심스러운 사용자 현황</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {suspiciousUsers.slice(0, 6).map((user, index) => (
              <div key={index} className="bg-red-50 p-3 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-red-600" />
                  <span className="font-medium text-red-800">{user.name}</span>
                </div>
                <div className="text-sm text-red-600">
                  <div>오늘: {user.today_reviews}개</div>
                  <div>이번 달: {user.monthly_reviews}개</div>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* 리뷰 목록 */}
      <Card>
        <CardBody>
          <h2 className="text-lg font-semibold mb-4">최근 리뷰 현황 (7일)</h2>
          <Table aria-label="리뷰 목록">
            <TableHeader>
              <TableColumn>작성자</TableColumn>
              <TableColumn>전시회</TableColumn>
              <TableColumn>별점</TableColumn>
              <TableColumn>내용</TableColumn>
              <TableColumn>어뷰징 점수</TableColumn>
              <TableColumn>작성일</TableColumn>
              <TableColumn>상태</TableColumn>
              <TableColumn>액션</TableColumn>
            </TableHeader>
            <TableBody>
              {reviews.map((review) => (
                <TableRow key={review.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {review.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{review.exhibition?.title || "전시회 정보 없음"}</div>
                      {review.exhibition?.location && (
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {review.exhibition.location}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-sm ${
                            i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                      <span className="text-sm text-gray-600">({review.rating})</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <p className="text-sm line-clamp-2">{review.description}</p>
                      {review.proof_image && (
                        <span className="text-xs text-blue-600">📷 증빙사진</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={getAbuseScoreColor(review.abuseScore)}
                      size="sm"
                    >
                      {getAbuseScoreText(review.abuseScore)} ({review.abuseScore})
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="w-3 h-3" />
                      {new Date(review.created_at).toLocaleDateString('ko-KR')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip
                      color={review.status === 'approved' ? 'success' : review.status === 'rejected' ? 'danger' : 'warning'}
                      size="sm"
                    >
                      {review.status === 'approved' ? '승인됨' : review.status === 'rejected' ? '거부됨' : '대기중'}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="flat"
                        startContent={<Eye className="w-3 h-3" />}
                        onPress={() => openDetailModal(review)}
                      >
                        상세
                      </Button>
                      {review.status === 'pending_approval' && (
                        <>
                          <Button
                            size="sm"
                            color="success"
                            startContent={<CheckCircle className="w-3 h-3" />}
                            onPress={() => handleReviewAction(review.id, 'approve')}
                          >
                            승인
                          </Button>
                          <Button
                            size="sm"
                            color="danger"
                            startContent={<XCircle className="w-3 h-3" />}
                            onPress={() => handleReviewAction(review.id, 'reject')}
                          >
                            거부
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* 상세보기 모달 */}
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent>
          <ModalHeader>
            <h3 className="text-lg font-semibold">리뷰 상세 정보</h3>
          </ModalHeader>
          <ModalBody>
            {selectedReview && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">작성자 정보</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p><strong>이름:</strong> {selectedReview.name}</p>
                      <p><strong>작성일:</strong> {new Date(selectedReview.created_at).toLocaleString('ko-KR')}</p>
                      <p><strong>어뷰징 점수:</strong> 
                        <Chip
                          color={getAbuseScoreColor(selectedReview.abuseScore)}
                          size="sm"
                          className="ml-2"
                        >
                          {getAbuseScoreText(selectedReview.abuseScore)} ({selectedReview.abuseScore})
                        </Chip>
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">전시회 정보</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p><strong>제목:</strong> {selectedReview.exhibition?.title || "정보 없음"}</p>
                      <p><strong>장소:</strong> {selectedReview.exhibition?.location || "정보 없음"}</p>
                      <p><strong>상태:</strong> {selectedReview.exhibition?.status || "정보 없음"}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">리뷰 내용</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <span
                            key={i}
                            className={`text-sm ${
                              i < selectedReview.rating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">({selectedReview.rating}/5)</span>
                    </div>
                    <p className="whitespace-pre-wrap">{selectedReview.description}</p>
                    {selectedReview.proof_image && (
                      <div className="mt-3">
                        <img
                          src={selectedReview.proof_image}
                          alt="증빙 사진"
                          className="max-w-xs rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {selectedReview.status === 'rejected' && selectedReview.rejection_reason && (
                  <div>
                    <h4 className="font-medium mb-2">거부 사유</h4>
                    <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                      <p className="text-red-800">{selectedReview.rejection_reason}</p>
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
            {selectedReview?.status === 'pending_approval' && (
              <>
                <Button
                  color="success"
                  startContent={<CheckCircle className="w-4 h-4" />}
                  onPress={() => {
                    handleReviewAction(selectedReview.id, 'approve');
                    onClose();
                  }}
                >
                  승인
                </Button>
                <Button
                  color="danger"
                  startContent={<XCircle className="w-4 h-4" />}
                  onPress={() => {
                    handleReviewAction(selectedReview.id, 'reject');
                    onClose();
                  }}
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

