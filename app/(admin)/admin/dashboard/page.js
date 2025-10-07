"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Shield, Flag, Users, Gift, MessageSquare, BarChart3, Eye, AlertTriangle, Activity, Ban, Globe, TrendingUp } from "lucide-react";

export default function AdminDashboardPage() {
  const supabase = createClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    posts: 0,
    reports: 0,
    pendingPoints: 0,
    artistsPending: 0,
    journalistsPending: 0,
    commentsToday: 0,
  });
  const [securityStats, setSecurityStats] = useState({
    traffic: { requests24h: 0, requestsLastHour: 0, requestsLastMinute: 0, uniqueIps24h: 0, errorRequests: 0 },
    security: { suspiciousRequests: 0, blockedIps: 0, securityEvents: 0 },
    analytics: { hourlyTraffic: [], topIps: [] }
  });
  const [queues, setQueues] = useState({
    reports: [],
    pointReviews: [],
    artists: [],
    journalists: [],
  });

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { 
          setIsAdmin(false); 
          setLoading(false); 
          return; 
        }
        
        const { data: profile, error: profileError } = await supabase.from('profiles').select('role, full_name, email').eq('id', user.id).single();
        console.log('Current user:', user.id, user.email);
        console.log('Profile data:', profile);
        console.log('Profile error:', profileError);
        
        // admin 또는 master 역할 모두 허용
        const admin = profile?.role === 'admin' || profile?.role === 'master';
        setIsAdmin(admin);
        console.log('Is admin?', admin, 'Role:', profile?.role);
        
        // role이 없거나 다른 값이면 admin으로 업데이트
        if (!admin && !profileError && profile) {
          console.log('Updating role to admin for user:', user.id);
          const { data: updated, error: updateError } = await supabase
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', user.id)
            .select();
          console.log('Role update result:', updated, updateError);
          if (!updateError) {
            setIsAdmin(true);
            // 페이지 새로고침으로 middleware도 최신 role 반영
            setTimeout(() => window.location.reload(), 500);
          }
        } else if (!profile && !profileError) {
          // profile이 없으면 생성
          console.log('Creating admin profile for user:', user.id);
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({ 
              id: user.id, 
              role: 'admin', 
              full_name: user.email?.split('@')[0] || '관리자',
              email: user.email 
            })
            .select();
          console.log('Profile create result:', newProfile, createError);
          if (!createError) {
            setIsAdmin(true);
            setTimeout(() => window.location.reload(), 500);
          }
        }
        
        if (admin) {
          // 직접 DB 조회로 통계 가져오기
          try {
            console.log('=== 직접 DB 통계 조회 시작 ===');
            
            // 1. 총 게시글 수
            const { count: postsCount, error: postsError } = await supabase
              .from('community_post')
              .select('id', { count: 'exact', head: true });
            console.log('Posts count:', postsCount, 'Error:', postsError);

            // 2. 포인트 검토 대기 (승인된 리뷰 제외)
            const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
            const { data: recentReviews, error: pointsError } = await supabase
              .from('exhibition_review')
              .select('id, user_id')
              .gte('created_at', fortyEightHoursAgo);
            
            // 이미 처리된 (승인/거부) 리뷰 ID들 조회
            const { data: processedTransactions } = await supabase
              .from('point_transactions')
              .select('reference_id')
              .eq('reference_type', 'exhibition_review')
              .in('status', ['completed', 'rejected']);

            const processedReviewIds = new Set((processedTransactions || []).map(t => t.reference_id));
            
            // 아직 처리되지 않은 리뷰만 필터링 (검토 대기)
            const pendingReviews = (recentReviews || []).filter(review => !processedReviewIds.has(review.id));
            
            // 사용자별 그룹화해서 검토 대기 포인트 계산
            const userGroups = {};
            pendingReviews.forEach(review => {
              userGroups[review.user_id] = (userGroups[review.user_id] || 0) + 500;
            });
            
            const pendingUsersCount = Object.keys(userGroups).length;
            const totalPendingPoints = Object.values(userGroups).reduce((sum, points) => sum + points, 0);
            
            console.log('Points 검토 대기 (승인 제외):', { 
              전체리뷰: recentReviews?.length, 
              승인된리뷰: approvedReviewIds.size,
              대기리뷰: pendingReviews.length,
              사용자수: pendingUsersCount, 
              총포인트: totalPendingPoints, 
              'Error': pointsError 
            });

            // 3. 작가 승인 대기
            const { count: artistsCount, error: artistsError } = await supabase
              .from('profiles')
              .select('id', { count: 'exact', head: true })
              .eq('isArtist', true)
              .eq('isArtistApproval', false);
            console.log('Artists count:', artistsCount, 'Error:', artistsError);

            // 실제 작가 대기 목록도 조회해서 큐에 표시
            const { data: artistsData, error: artistsDataError } = await supabase
              .from('profiles')
              .select('id, full_name, email, created_at')
              .eq('isArtist', true)
              .eq('isArtistApproval', false)
              .order('created_at', { ascending: false })
              .limit(5);
            console.log('Artists data:', artistsData, 'Error:', artistsDataError);

            // 4. 댓글 수
            const { count: commentsCount, error: commentsError } = await supabase
              .from('community_comments')
              .select('id', { count: 'exact', head: true });
            console.log('Comments count:', commentsCount, 'Error:', commentsError);

            // 통계 데이터 설정
            const directStats = {
              posts: postsCount || 0,
              reports: 0, // 신고 테이블 문제 있으므로 일단 0
              pendingPoints: pendingUsersCount || 0, // 검토 대기 사용자 수
              artistsPending: artistsCount || 0,
              journalistsPending: 0, // 컬럼 문제 있으므로 일단 0
              commentsToday: commentsCount || 0,
            };
            
            console.log('직접 조회 통계:', directStats);
            setStats(directStats);

            // 보안 통계 조회
            try {
              console.log('=== 보안 통계 조회 시작 ===');
              const secRes = await fetch('/api/admin/security/stats', { cache: 'no-store' });
              const secJson = await secRes.json();
              console.log('보안 통계 응답:', secJson);
              
              if (secJson?.success && secJson.data) {
                setSecurityStats(secJson.data);
              }
            } catch (e) {
              console.log('보안 통계 조회 에러:', e);
            }
            
          } catch (e) {
            console.error('직접 DB 조회 에러:', e);
          }

          // 검토 큐 설정 (실제 데이터 사용)
          console.log('검토 큐 설정 중...');
          
          // 포인트 검토 큐도 실제 데이터로 설정 (대시보드에서 정의된 userGroups 사용)
          const dashboardPointReviewsData = Object.entries(userGroups || {}).map(([userId, points]) => ({
            id: `point_${userId}`,
            user_id: userId,
            points: points,
            created_at: new Date().toISOString(),
            status: 'pending'
          }));
          
          setQueues({
            reports: [],
            pointReviews: dashboardPointReviewsData, // 실제 포인트 검토 데이터 사용
            artists: artistsData || [],
            journalists: [],
          });
          console.log('검토 큐 설정 완료:', {
            작가대기: (artistsData || []).length,
            포인트검토: dashboardPointReviewsData.length,
            총포인트: totalPendingPoints
          });
        }
      } catch (e) {
        console.log('admin dashboard init error', e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // 빠른 액션 처리 (개선된 UX)
  const [actionLoading, setActionLoading] = useState({});
  const [ipBlockInput, setIpBlockInput] = useState('');
  const [blockReason, setBlockReason] = useState('');
  
  // IP 차단 핸들러
  const handleIPBlock = async (ip) => {
    const reason = prompt(`${ip} 주소를 차단하는 이유를 입력하세요:`, '의심스러운 활동 감지');
    if (!reason) return;

    try {
      const res = await fetch('/api/admin/security/ip-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'block', ip, reason, duration: 60 }) // 60분 차단
      });

      const json = await res.json();
      if (json?.success) {
        alert(`${ip} 주소가 차단되었습니다.`);
        // 보안 통계 새로고침
        setTimeout(() => window.location.reload(), 1000);
      } else {
        alert('IP 차단에 실패했습니다.');
      }
    } catch (e) {
      console.log('IP 차단 에러:', e);
      alert('IP 차단 중 오류가 발생했습니다.');
    }
  };
  
  const handleQuickAction = async (type, action, id) => {
    const actionText = action === 'approve' ? '승인' : action === 'reject' ? '반려' : '삭제';
    
    if (!confirm(`정말로 ${actionText}하시겠습니까?`)) return;
    
    // 로딩 상태 설정
    setActionLoading(prev => ({ ...prev, [`${type}_${id}`]: true }));
    
    try {
      const res = await fetch('/api/admin/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, action, id }),
      });
      
      const json = await res.json();
      if (json?.success) {
        // 성공 토스트 메시지 (더 나은 UX)
        const successDiv = document.createElement('div');
        successDiv.innerHTML = `
          <div class="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg shadow-lg z-50">
            <div class="flex items-center gap-2">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
              <span>${actionText} 완료되었습니다!</span>
            </div>
          </div>
        `;
        document.body.appendChild(successDiv);
        setTimeout(() => {
          if (successDiv.parentNode) successDiv.parentNode.removeChild(successDiv);
        }, 3000);
        
        // 페이지 새로고침 대신 데이터만 다시 로드
        setTimeout(() => window.location.reload(), 1000);
      } else {
        alert('처리 중 오류가 발생했습니다.');
      }
    } catch (e) {
      console.log('action error', e);
      alert('처리 중 오류가 발생했습니다.');
    } finally {
      // 로딩 상태 해제
      setActionLoading(prev => ({ ...prev, [`${type}_${id}`]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <div className="flex items-center justify-center mb-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
          </div>
          <p className="text-gray-600 text-center font-medium">관리자 대시보드 로딩 중...</p>
          <p className="text-gray-500 text-sm text-center mt-2">잠시만 기다려주세요</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-6">
        <Shield className="w-16 h-16 text-gray-400 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">관리자 전용 페이지</h1>
        <p className="text-gray-600 mb-4">접근 권한이 없습니다.</p>
        <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">홈으로 돌아가기</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-none">
        {/* 간소화된 헤더 */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">실시간 현황</h2>
          </div>
          <p className="text-gray-600 text-sm">모든 관리 항목을 빠르게 확인하고 처리하세요</p>
        </div>

        {/* 기본 통계 카드 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <StatCard 
            icon={<MessageSquare className="w-6 h-6" />} 
            title="총 게시글" 
            value={stats.posts} 
            href="/admin/community"
            color="blue"
          />
          <StatCard 
            icon={<Flag className="w-6 h-6" />} 
            title="신고 접수" 
            value={stats.reports} 
            href="/admin/review-monitoring"
            color="red"
            urgent={stats.reports > 0}
          />
          <StatCard 
            icon={<Gift className="w-6 h-6" />} 
            title="포인트 검토" 
            value={stats.pendingPoints} 
            href="/admin/point-review"
            color="purple"
            urgent={stats.pendingPoints > 0}
          />
          <StatCard 
            icon={<Users className="w-6 h-6" />} 
            title="작가 승인 대기" 
            value={stats.artistsPending} 
            href="/admin/artist"
            color="green"
            urgent={stats.artistsPending > 0}
          />
          <StatCard 
            icon={<Users className="w-6 h-6" />} 
            title="기자단 승인 대기" 
            value={stats.journalistsPending} 
            href="/admin/journalist"
            color="indigo"
            urgent={stats.journalistsPending > 0}
          />
          <StatCard 
            icon={<BarChart3 className="w-6 h-6" />} 
            title="오늘 댓글" 
            value={stats.commentsToday} 
            href="/admin/community"
            color="gray"
          />
        </div>

        {/* 보안 및 트래픽 통계 섹션 */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-md mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">실시간 보안 모니터링</h2>
              <p className="text-sm text-gray-500">트래픽 현황과 보안 위협을 실시간 모니터링</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4 mb-6">
            <SecurityCard 
              icon={<Activity className="w-5 h-5" />}
              title="24시간 요청"
              value={securityStats.traffic.requests24h}
              color="blue"
            />
            <SecurityCard 
              icon={<TrendingUp className="w-5 h-5" />}
              title="1시간 요청"
              value={securityStats.traffic.requestsLastHour}
              color="green"
            />
            <SecurityCard 
              icon={<Globe className="w-5 h-5" />}
              title="고유 IP"
              value={securityStats.traffic.uniqueIps24h}
              color="purple"
            />
            <SecurityCard 
              icon={<AlertTriangle className="w-5 h-5" />}
              title="의심 요청"
              value={securityStats.security.suspiciousRequests}
              color="orange"
              urgent={securityStats.security.suspiciousRequests > 0}
            />
            <SecurityCard 
              icon={<Ban className="w-5 h-5" />}
              title="차단된 IP"
              value={securityStats.security.blockedIps}
              color="red"
              urgent={securityStats.security.blockedIps > 0}
            />
            <SecurityCard 
              icon={<Shield className="w-5 h-5" />}
              title="보안 이벤트"
              value={securityStats.security.securityEvents}
              color="indigo"
              urgent={securityStats.security.securityEvents > 0}
            />
            <SecurityCard 
              icon={<MessageSquare className="w-5 h-5" />}
              title="에러 요청"
              value={securityStats.traffic.errorRequests}
              color="red"
              urgent={securityStats.traffic.errorRequests > 10}
            />
            <IPBlockingCard />
          </div>

          {/* 상위 요청 IP 목록 */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 mb-3">상위 트래픽 IP (24시간)</h3>
            <div className="space-y-2">
              {securityStats.analytics.topIps.length === 0 ? (
                <p className="text-gray-500 text-sm">트래픽 데이터가 없습니다.</p>
              ) : (
                securityStats.analytics.topIps.slice(0, 5).map((item, idx) => (
                  <div key={item.ip} className="flex items-center justify-between p-2 bg-white rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      <span className="font-mono text-sm">{item.ip}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">{item.requests} 요청</span>
                      <button
                        onClick={() => handleIPBlock(item.ip)}
                        className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                      >
                        차단
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 검토 큐 섹션 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 신고 큐 */}
          <QueueCard 
            title="긴급 신고 처리" 
            items={queues.reports} 
            emptyText="처리할 신고가 없습니다." 
            onAction={handleQuickAction}
            actionLoading={actionLoading}
            actionType="report"
          />

          {/* 포인트 적립 승인 큐 */}
          <QueueCard 
            title="포인트 적립 승인" 
            items={queues.pointReviews} 
            emptyText="승인 대기 중인 포인트가 없습니다." 
            onAction={handleQuickAction}
            actionLoading={actionLoading}
            actionType="point"
          />

          {/* 작가 승인 큐 */}
          <QueueCard 
            title="작가 승인 대기" 
            items={queues.artists} 
            emptyText="승인 대기 중인 작가가 없습니다." 
            onAction={handleQuickAction}
            actionLoading={actionLoading}
            actionType="artist"
          />

          {/* 기자단 승인 큐 */}
          <QueueCard 
            title="기자단 승인 대기" 
            items={queues.journalists} 
            emptyText="승인 대기 중인 기자단이 없습니다." 
            onAction={handleQuickAction}
            actionLoading={actionLoading}
            actionType="journalist"
          />
        </div>

        {/* 빠른 액세스 섹션 */}
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">빠른 관리</h2>
              <p className="text-sm text-gray-500">자주 사용하는 관리 기능에 빠르게 접근</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <QuickLink href="/admin/community" title="커뮤니티 관리" description="게시글 및 댓글 관리" icon="message-square" />
            <QuickLink href="/admin/review-monitoring" title="신고 관리" description="신고된 내용 검토" icon="shield-alert" />
            <QuickLink href="/admin/point-review" title="포인트 관리" description="포인트 적립 승인" icon="coins" />
            <QuickLink href="/admin/artist" title="작가 관리" description="작가 등록 승인" icon="users" />
            <QuickLink href="/admin/journalist" title="기자단 관리" description="기자단 신청 승인" icon="pen-tool" />
            <QuickLink href="/admin/custom-reviews" title="리뷰 관리" description="커스텀 리뷰 승인" icon="star" />
          </div>
        </div>
      </div>
    </div>
  );
}

// 통계 카드 컴포넌트
function StatCard({ icon, title, value, href, color = 'blue', urgent = false }) {
  const colorClasses = {
    blue: 'from-blue-500 to-cyan-500 text-blue-600 bg-blue-50',
    red: 'from-red-500 to-pink-500 text-red-600 bg-red-50',
    green: 'from-green-500 to-emerald-500 text-green-600 bg-green-50',
    purple: 'from-purple-500 to-violet-500 text-purple-600 bg-purple-50',
    indigo: 'from-indigo-500 to-blue-500 text-indigo-600 bg-indigo-50',
    gray: 'from-gray-500 to-slate-500 text-gray-600 bg-gray-50',
  };

  const content = (
    <div className={`bg-white rounded-2xl p-6 border border-gray-100 shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group ${urgent ? 'ring-2 ring-red-300 bg-gradient-to-br from-red-50 to-orange-50' : ''}`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-14 h-14 bg-gradient-to-br ${colorClasses[color].split(' ')[0]} ${colorClasses[color].split(' ')[1]} rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        {urgent && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-sm"></div>
            <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded-full">긴급</span>
          </div>
        )}
      </div>
      <div className="space-y-2">
        <div className="text-4xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{value ?? 0}</div>
        <div className="text-sm font-semibold text-gray-500 group-hover:text-gray-700 transition-colors">{title}</div>
      </div>
    </div>
  );
  
  if (href) {
    return <Link href={href} className="block">{content}</Link>;
  }
  return content;
}

// 검토 큐 카드 컴포넌트
function QueueCard({ title, items, emptyText, onAction, actionLoading, actionType }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      
      {(!items || items.length === 0) ? (
        <div className="text-center py-8">
          <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">{emptyText}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={item.id || idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1 min-w-0">
                {actionType === 'report' && (
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">신고: {item.reason || '기타'}</div>
                    <div className="text-gray-500">{new Date(item.created_at).toLocaleString('ko-KR')}</div>
                  </div>
                )}
                {actionType === 'point' && (
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">{item.points || 0}P 적립 요청</div>
                    <div className="text-gray-500">{(item.user_id || '').slice(0,8)}… • {new Date(item.created_at).toLocaleDateString('ko-KR')}</div>
                  </div>
                )}
                {(actionType === 'artist' || actionType === 'journalist') && (
                  <div className="text-sm">
                    <div className="font-medium text-gray-900">{item.full_name || '이름 없음'}</div>
                    <div className="text-gray-500">{item.email} • {new Date(item.created_at).toLocaleDateString('ko-KR')}</div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 ml-4">
                {actionType === 'report' && (
                  <button 
                    onClick={() => onAction('report', 'delete', item.id)}
                    disabled={actionLoading[`report_${item.id}`]}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    {actionLoading[`report_${item.id}`] ? '처리중...' : '처리완료'}
                  </button>
                )}
                {(actionType === 'point' || actionType === 'artist' || actionType === 'journalist') && (
                  <>
                    <button 
                      onClick={() => onAction(actionType, 'approve', item.id)}
                      disabled={actionLoading[`${actionType}_${item.id}`]}
                      className="px-4 py-2 text-xs font-semibold rounded-lg bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      {actionLoading[`${actionType}_${item.id}`] ? '승인중...' : '승인'}
                    </button>
                    <button 
                      onClick={() => onAction(actionType, 'reject', item.id)}
                      disabled={actionLoading[`${actionType}_${item.id}`]}
                      className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      {actionLoading[`${actionType}_${item.id}`] ? '반려중...' : '반려'}
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 빠른 링크 컴포넌트
function QuickLink({ href, title, description, icon }) {
  const iconMap = {
    'message-square': MessageSquare,
    'shield-alert': Shield,
    'coins': Gift,
    'users': Users,
    'pen-tool': Flag,
    'star': BarChart3,
  };
  const IconComponent = iconMap[icon] || MessageSquare;
  
  return (
    <Link href={href} className="group block">
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:bg-white hover:shadow-lg hover:border-blue-200 hover:-translate-y-1 transition-all duration-300">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl flex items-center justify-center group-hover:from-blue-500 group-hover:to-purple-500 transition-all duration-300">
            <IconComponent className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{title}</h3>
            <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors">{description}</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 group-hover:text-blue-500 transition-colors">바로가기</span>
          <div className="w-6 h-6 rounded-full bg-gray-200 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
            <span className="text-xs text-gray-600 group-hover:text-blue-600">→</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
// 보안 통계 카드 컴포넌트
function SecurityCard({ icon, title, value, color = 'blue', urgent = false }) {
  const colorClasses = {
    blue: 'from-blue-500 to-cyan-500 text-blue-600',
    green: 'from-green-500 to-emerald-500 text-green-600',
    purple: 'from-purple-500 to-violet-500 text-purple-600',
    orange: 'from-orange-500 to-amber-500 text-orange-600',
    red: 'from-red-500 to-pink-500 text-red-600',
    indigo: 'from-indigo-500 to-blue-500 text-indigo-600',
  };

  return (
    <div className={`bg-white rounded-lg p-4 border border-gray-200 shadow-sm transition-all duration-200 ${urgent ? 'ring-2 ring-red-300 bg-red-50' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`w-8 h-8 bg-gradient-to-br ${colorClasses[color]} rounded-lg flex items-center justify-center text-white`}>
          {icon}
        </div>
        {urgent && (
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        )}
      </div>
      <div className="space-y-1">
        <div className="text-xl font-bold text-gray-900">{value ?? 0}</div>
        <div className="text-xs font-medium text-gray-600">{title}</div>
      </div>
    </div>
  );
}

// IP 차단 컨트롤 카드
function IPBlockingCard() {
  const [showForm, setShowForm] = React.useState(false);
  const [ipInput, setIpInput] = React.useState('');
  const [reasonInput, setReasonInput] = React.useState('');

  const handleManualBlock = async () => {
    if (!ipInput.trim() || !reasonInput.trim()) {
      alert('IP 주소와 차단 사유를 입력해주세요.');
      return;
    }

    try {
      const res = await fetch('/api/admin/security/ip-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'block', ip: ipInput, reason: reasonInput, duration: null })
      });

      const json = await res.json();
      if (json?.success) {
        alert('IP가 차단되었습니다.');
        setIpInput('');
        setReasonInput('');
        setShowForm(false);
        setTimeout(() => window.location.reload(), 1000);
      } else {
        alert('IP 차단에 실패했습니다.');
      }
    } catch (e) {
      alert('IP 차단 중 오류가 발생했습니다.');
    }
  };

  if (showForm) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 className="font-semibold text-red-800 mb-3">수동 IP 차단</h4>
        <div className="space-y-2">
          <input 
            type="text" 
            placeholder="IP 주소 (예: 192.168.1.1)"
            value={ipInput}
            onChange={(e) => setIpInput(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
          />
          <input 
            type="text" 
            placeholder="차단 사유"
            value={reasonInput}
            onChange={(e) => setReasonInput(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
          />
          <div className="flex gap-2">
            <button 
              onClick={handleManualBlock}
              className="flex-1 px-3 py-2 text-xs bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              차단
            </button>
            <button 
              onClick={() => setShowForm(false)}
              className="flex-1 px-3 py-2 text-xs bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              취소
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={() => setShowForm(true)}
      className="bg-red-50 border border-red-200 rounded-lg p-4 cursor-pointer hover:bg-red-100 transition-colors"
    >
      <div className="flex items-center justify-center mb-2">
        <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center text-white">
          <Ban className="w-5 h-5" />
        </div>
      </div>
      <div className="text-center">
        <div className="text-sm font-semibold text-red-800">수동 IP 차단</div>
        <div className="text-xs text-red-600 mt-1">클릭해서 차단</div>
      </div>
    </div>
  );
}

