"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { FiHeart, FiMessageCircle, FiShare2, FiMoreVertical, FiArrowLeft } from "react-icons/fi";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Head from "next/head";
import { generateSEOMeta, generateStructuredData } from "@/utils/seo";

export default function CommunityPostDetail({ params }) {
  const supabase = createClient();
  
  const generateAnonymousName = (userId, postId) => {
    // postId를 기반으로 각 글마다 다른 익명 번호 생성
    if (!postId) return '익명의1234';
    
    // postId의 해시값을 사용해서 각 글마다 다른 숫자 생성
    let hash = 0;
    for (let i = 0; i < postId.length; i++) {
      const char = postId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit integer로 변환
    }
    const randomNum = Math.abs(hash) % 99999 + 1000; // 1000-99999 범위
    return `익명의${randomNum}`;
  };
  const router = useRouter();
  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [lastCommentTime, setLastCommentTime] = useState(0); // 댓글 스팸 방지용
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(true); // 댓글 목록 표시/숨김 상태
  const [replyTo, setReplyTo] = useState(null); // 대댓글 대상 댓글 ID
  
  // 투표 관련 상태
  const [poll, setPoll] = useState(null);
  const [pollVotes, setPollVotes] = useState([]);
  const [userVote, setUserVote] = useState(null);
  const [submittingVote, setSubmittingVote] = useState(false);
  
  // comments 상태 변경 감지
  useEffect(() => {
    console.log('comments 상태 변경됨:', comments.length, '개');
    if (comments.length > 0) {
      console.log('댓글 목록:', comments);
    }
  }, [comments]);

  // 댓글 렌더링 컴포넌트
  const renderComment = (comment, depth = 0) => {
    const isReplyMode = replyTo === comment.id;
    
    return (
      <div key={comment.id} className={`${depth > 0 ? 'ml-8 border-l-2 border-gray-200 pl-3' : ''}`}>
        {/* 댓글 본문 */}
        <div className="flex items-start gap-2 py-2">
          <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">
            익명
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-gray-900">익명</span>
              <span className="text-xs text-gray-500">
                {comment.created_at ? new Date(comment.created_at).toLocaleString('ko-KR') : ''}
              </span>
            </div>
            <div className="text-sm text-gray-800 mb-2 whitespace-pre-wrap break-words">
              {comment.content || '(내용 없음)'}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <button
                onClick={() => setReplyTo(comment.id)}
                className="hover:text-blue-600 transition-colors"
              >
                답글
              </button>
              <button className="hover:text-red-600 transition-colors">신고</button>
            </div>
          </div>
        </div>

        {/* 답글 입력창 */}
        {isReplyMode && (
          <div className="ml-8 mb-3">
            <div className="bg-gray-50 p-3 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  U
                </div>
                <span className="text-sm text-gray-600">익명에게 답글</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="답글을 입력하세요..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      submitComment();
                    }
                  }}
                />
                <button
                  onClick={submitComment}
                  disabled={submittingComment}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm transition-colors disabled:opacity-50"
                >
                  등록
                </button>
                <button
                  onClick={() => setReplyTo(null)}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 카테고리 한글 라벨 매핑 및 뱃지 색상
  const CATEGORY_LABELS = {
    all: '전체',
    free: '자유',
    exhibition: '전시회',
    short_video: '숏폼',
    discussion: '토론',
    review: '리뷰',
    journalist: '기자단'
  };
  const getBadgeClass = (category) => {
    switch (category) {
      case 'discussion':
        return 'bg-green-100 text-green-700';
      case 'exhibition':
        return 'bg-blue-100 text-blue-700';
      case 'review':
        return 'bg-amber-100 text-amber-700';
      case 'short_video':
        return 'bg-purple-100 text-purple-700';
      case 'journalist':
        return 'bg-slate-100 text-slate-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchPost = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('community_post')
          .select('*')
          .eq('id', params.id)
          .single();

        if (error) {
          console.error('Error fetching post:', error);
          return;
        }

        // profiles 정보를 별도로 가져와서 병합
        if (data && data.user_id) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', data.user_id)
            .single();
          
          if (!profileError && profile) {
            setPost({
              ...data,
              profiles: profile
            });
          } else {
            setPost(data);
          }
        } else {
          setPost(data);
        }

        // 관련 게시글 로드 (같은 카테고리, 본인 제외 상위 5개)
        if (data?.category) {
          const { data: rel } = await supabase
            .from('community_post')
            .select('id, title, created_at')
            .eq('category', data.category)
            .neq('id', data.id)
            .order('created_at', { ascending: false })
            .limit(5);
          setRelatedPosts(rel || []);
        }

        // 투표 정보 로드
        if (data?.category === '토론') {
          const { data: pollData } = await supabase
            .from('community_polls')
            .select('*')
            .eq('post_id', data.id)
            .single();
          
          if (pollData) {
            setPoll(pollData);
            
            // 투표 결과 로드
            const { data: votesData } = await supabase
              .from('community_poll_votes')
              .select('*')
              .eq('poll_id', pollData.id);
            
            setPollVotes(votesData || []);
          }
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchPost();
    }
  }, [params.id]);

  // 좋아요/댓글 상태 로드
  useEffect(() => {
    const loadMeta = async () => {
      if (!post) return;
      try {
        const { count: likesCnt } = await supabase
          .from('community_likes')
          .select('id', { count: 'exact', head: true })
          .eq('post_id', post.id);
        setLikeCount(likesCnt || 0);

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: myLike } = await supabase
            .from('community_likes')
            .select('id')
            .eq('post_id', post.id)
            .eq('user_id', user.id)
            .maybeSingle();
          setLiked(!!myLike);

          // 사용자의 투표 상태 확인
          if (poll) {
            const { data: myVote } = await supabase
              .from('community_poll_votes')
              .select('option_index')
              .eq('poll_id', poll.id)
              .eq('user_id', user.id)
              .maybeSingle();
            setUserVote(myVote?.option_index || null);
          }
        }

        console.log('=== 댓글 목록 가져오기 시작 ===');
        console.log('post_id:', post.id);
        
        // 현재 사용자 확인
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        console.log('현재 사용자:', currentUser?.id);
        
        try {
          // 더 간단한 쿼리로 시도
          console.log('Supabase 쿼리 시작...');
          const { data: cmts, error: cmtsError } = await supabase
            .from('community_comments')
            .select('*')
            .eq('post_id', post.id);
          
          console.log('쿼리 완료. 결과:', { data: cmts, error: cmtsError });
          
          if (cmtsError) {
            console.error('댓글 목록 가져오기 오류:', cmtsError);
            alert('댓글을 불러오는데 실패했습니다: ' + cmtsError.message);
          } else {
            console.log('댓글 목록 가져오기 성공!');
            console.log('댓글 개수:', cmts?.length || 0);
            console.log('댓글 데이터:', cmts);
            
            if (cmts && cmts.length > 0) {
              console.log('첫 번째 댓글 상세:', cmts[0]);
              console.log('모든 댓글 ID:', cmts.map(c => c.id));
            } else {
              console.log('댓글이 없습니다.');
            }
            
            setComments(cmts || []);
            console.log('comments 상태 업데이트 완료:', cmts?.length || 0, '개');
          }
        } catch (error) {
          console.error('댓글 가져오기 예외:', error);
          alert('댓글을 불러오는 중 오류가 발생했습니다.');
        }
      } catch (e) {
        console.log('meta load error', e);
      }
    };
    loadMeta();
  }, [post, poll]);

  // 스팸 방지 함수들
  const checkSpamWords = (text) => {
    const spamWords = [
      '광고', '홍보', '판매', '구매', '거래', '돈', '돈벌이', '수익', '부업',
      '스팸', '도배', '반복', '클릭', '링크', '사이트', '무료', '이벤트',
      '카지노', '도박', '로또', '복권', '대출', '보험', '투자', '주식',
      '성인', '야동', '야사', '음란', '섹스', '성관계', '유흥', '마사지',
      '바이럴', '마케팅', '프로모션', '세일', '할인', '쿠폰', '적립금',
      'www.', 'http://', 'https://', '.com', '.kr', '.net', '.org'
    ];
    
    const lowerText = text.toLowerCase();
    return spamWords.some(word => lowerText.includes(word.toLowerCase()));
  };

  const checkUrlPattern = (text) => {
    const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,})/gi;
    return urlPattern.test(text);
  };

  const checkCommentSpam = (text) => {
    // URL 체크
    if (checkUrlPattern(text)) {
      return { isSpam: true, message: '댓글에 URL을 포함할 수 없습니다.' };
    }
    
    // 스팸 단어 체크
    if (checkSpamWords(text)) {
      return { isSpam: true, message: '부적절한 단어가 포함되어 있습니다.' };
    }
    
    // 연속 댓글 방지 (1초 이내)
    const now = Date.now();
    if (now - lastCommentTime < 1000) {
      return { isSpam: true, message: '너무 빠르게 연속 댓글을 작성할 수 없습니다. 잠시 후 다시 시도해주세요.' };
    }
    
    // 댓글 길이 체크
    if (text.length > 500) {
      return { isSpam: true, message: '댓글은 500자 이내로 작성해주세요.' };
    }
    
    return { isSpam: false };
  };

  const handleLike = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { alert('로그인이 필요합니다.'); return; }
      
      // 자기 게시글 좋아요 방지
      if (user.id === post.user_id) {
        alert('본인 게시글에는 좋아요를 누를 수 없습니다.');
        return;
      }
      
      // 낙관적 업데이트
      setLiked(prev => !prev);
      setLikeCount(prev => (liked ? Math.max(0, prev - 1) : prev + 1));

      if (!liked) {
        // 좋아요 추가 (중복 무시)
        const { error } = await supabase
          .from('community_likes')
          .upsert({ post_id: post.id, user_id: user.id }, { onConflict: 'post_id,user_id' });
        if (error) throw error;
      } else {
        // 좋아요 취소
        const { error } = await supabase
          .from('community_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
        if (error) throw error;
      }
    } catch (e) {
      console.log('like error', e);
      // 롤백
      setLiked(prev => !prev);
      setLikeCount(prev => (liked ? prev + 1 : Math.max(0, prev - 1)));
      alert('좋아요 처리 중 오류가 발생했습니다.');
    }
  };

  const handleShare = async () => {
    try {
      const shareData = { title: post.title, text: post.content, url: window.location.href };
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(shareData.url);
        alert('링크가 클립보드에 복사되었습니다.');
      }
    } catch (e) {
      console.log('share error', e);
    }
  };

  // 투표 함수
  const handleVote = async (optionIndex) => {
    if (!currentUser) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (!poll) {
      alert('투표 정보를 찾을 수 없습니다.');
      return;
    }

    setSubmittingVote(true);
    try {
      // 기존 투표가 있으면 삭제
      if (userVote !== null) {
        await supabase
          .from('community_poll_votes')
          .delete()
          .eq('poll_id', poll.id)
          .eq('user_id', currentUser.id);
      }

      // 새 투표 추가
      const { error } = await supabase
        .from('community_poll_votes')
        .insert({
          poll_id: poll.id,
          user_id: currentUser.id,
          option_index: optionIndex
        });

      if (error) {
        console.error('투표 저장 오류:', error);
        alert('투표에 실패했습니다.');
        return;
      }

      // 투표 상태 업데이트
      setUserVote(optionIndex);
      
      // 투표 결과 다시 로드
      const { data: votesData } = await supabase
        .from('community_poll_votes')
        .select('*')
        .eq('poll_id', poll.id);
      
      setPollVotes(votesData || []);
    } catch (error) {
      console.error('투표 처리 오류:', error);
      alert('투표 처리 중 오류가 발생했습니다.');
    } finally {
      setSubmittingVote(false);
    }
  };

  const submitComment = async () => {
    if (!commentText.trim()) {
      console.log('댓글 텍스트가 비어있음');
      return;
    }

    // 스팸 방지 체크
    const spamCheck = checkCommentSpam(commentText.trim());
    if (spamCheck.isSpam) {
      alert(spamCheck.message);
      return;
    }

    try {
      console.log('댓글 작성 시작:', commentText.trim());
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('사용자 인증 실패');
        alert('로그인이 필요합니다.');
        return;
      }
      console.log('사용자 인증 성공:', user.id);
      setSubmittingComment(true);
        const payload = {
          post_id: post.id,
          user_id: user.id,
          content: commentText.trim(),
          parent_id: replyTo
        };
      console.log('댓글 데이터 전송:', payload);
      const { data, error } = await supabase.from('community_comments').insert(payload).select().single();
      if (error) {
        console.log('댓글 저장 실패:', error);
        alert('댓글 등록에 실패했습니다: ' + (error.message || '알 수 없는 오류'));
        setSubmittingComment(false);
        return;
      }
      console.log('댓글 저장 성공:', data);
      console.log('이전 댓글 목록:', comments);
      
      // 댓글 목록에 새 댓글 추가
      setComments(prev => {
        const newComments = [...prev, data];
        console.log('새로운 댓글 목록:', newComments);
        return newComments;
      });
      
      setCommentText("");
      setReplyTo(null); // 답글 상태 초기화
      setLastCommentTime(Date.now()); // 댓글 작성 시간 기록
      console.log('댓글 작성 완료');
      
      // 댓글 작성 후 댓글 목록 표시
      setShowComments(true);
      
      // 댓글 목록 즉시 새로고침
      console.log('댓글 목록 즉시 새로고침 시작');
      try {
        const { data: newComments, error: newCommentsError } = await supabase
          .from('community_comments')
          .select('*')
          .eq('post_id', post.id);
        
        if (newCommentsError) {
          console.error('댓글 목록 재조회 오류:', newCommentsError);
        } else {
          console.log('댓글 목록 재조회 성공:', newComments);
          console.log('새 댓글 개수:', newComments?.length || 0);
          setComments(newComments || []);
        }
      } catch (e) {
        console.error('댓글 목록 재조회 예외:', e);
      }
    } catch (e) {
      console.log('comment error', e);
      alert('댓글 작성 중 오류가 발생했습니다.');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">게시글을 찾을 수 없습니다</h1>
          <Link href="/community" className="text-blue-600 hover:text-blue-800">
            커뮤니티로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const seoMeta = generateSEOMeta({
    title: post.title,
    description: post.content?.substring(0, 160) + '...',
    keywords: `${post.category}, 예술, 커뮤니티, 전시회, 작가`,
    url: `/community/${post.id}`,
    type: 'article',
    publishedTime: post.created_at,
    modifiedTime: post.updated_at,
    author: post.profiles?.name || '아트앤브릿지',
    image: post.image_url || post.video_url
  });

  const structuredData = generateStructuredData({
    type: 'Article',
    title: post.title,
    description: post.content,
    url: `/community/${post.id}`,
    datePublished: post.created_at,
    dateModified: post.updated_at,
    author: post.profiles?.name || '아트앤브릿지',
    publisher: '아트앤브릿지',
    image: post.image_url || post.video_url
  });

  return (
    <>
      <Head>
        <title>{seoMeta.title}</title>
        <meta name="description" content={seoMeta.description} />
        <meta name="keywords" content={seoMeta.keywords} />
        
        {/* Open Graph */}
        <meta property="og:title" content={seoMeta.openGraph.title} />
        <meta property="og:description" content={seoMeta.openGraph.description} />
        <meta property="og:url" content={seoMeta.openGraph.url} />
        <meta property="og:type" content={seoMeta.openGraph.type} />
        <meta property="og:image" content={seoMeta.openGraph.images[0].url} />
        <meta property="og:site_name" content={seoMeta.openGraph.siteName} />
        
        {/* Twitter */}
        <meta name="twitter:card" content={seoMeta.twitter.card} />
        <meta name="twitter:title" content={seoMeta.twitter.title} />
        <meta name="twitter:description" content={seoMeta.twitter.description} />
        <meta name="twitter:image" content={seoMeta.twitter.images[0]} />
        
        {/* Canonical */}
        <link rel="canonical" href={seoMeta.alternates.canonical} />
        
        {/* 구조화된 데이터 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData)
          }}
        />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <FiArrowLeft className="w-5 h-5 mr-2" />
                뒤로
              </button>
              <div className="flex items-center space-x-4">
                <button className="text-gray-600 hover:text-gray-900">
                  <FiShare2 className="w-5 h-5" />
                </button>
                <button className="text-gray-600 hover:text-gray-900">
                  <FiMoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* 게시글 헤더 */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {/* 아이콘 제거 */}
                <div>
                  <h3 className="font-medium text-gray-900">{generateAnonymousName(post.user_id, post.id)}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(post.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 text-sm rounded-full ${getBadgeClass(post.category)}`}>
                {CATEGORY_LABELS[post.category] || post.category}
              </span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">{post.title}</h1>
            
            {/* 게시글 내용 */}
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>
            </div>

            {/* 투표 UI */}
            {poll && (
              <div className="mt-6 p-6 bg-gray-50 rounded-lg border">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="text-blue-600">📊</span>
                  {poll.question}
                </h3>
                
                <div className="space-y-3">
                  {poll.options.map((option, index) => {
                    const optionVotes = pollVotes.filter(vote => vote.option_index === index);
                    const votePercentage = pollVotes.length > 0 ? (optionVotes.length / pollVotes.length) * 100 : 0;
                    const isUserVoted = userVote === index;
                    
                    return (
                      <div key={index} className="relative">
                        <button
                          onClick={() => handleVote(index)}
                          disabled={submittingVote || !currentUser}
                          className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                            isUserVoted
                              ? 'border-blue-500 bg-blue-50'
                              : currentUser
                              ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                              : 'border-gray-200 bg-gray-100 cursor-not-allowed'
                          } ${submittingVote ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`font-medium ${isUserVoted ? 'text-blue-900' : 'text-gray-900'}`}>
                              {option}
                            </span>
                            <span className={`text-sm ${isUserVoted ? 'text-blue-700' : 'text-gray-600'}`}>
                              {optionVotes.length}표 ({votePercentage.toFixed(1)}%)
                            </span>
                          </div>
                          
                          {/* 투표 진행률 바 */}
                          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                isUserVoted ? 'bg-blue-500' : 'bg-gray-400'
                              }`}
                              style={{ width: `${votePercentage}%` }}
                            />
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-4 text-sm text-gray-600 text-center">
                  총 {pollVotes.length}명이 참여했습니다
                  {!currentUser && (
                    <span className="block mt-1 text-blue-600">
                      투표하려면 로그인이 필요합니다
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* 이미지 */}
            {post.image_url && (
              <div className="mt-6">
                <Image
                  src={post.image_url}
                  alt={post.title}
                  width={800}
                  height={600}
                  className="rounded-lg w-full h-auto"
                />
              </div>
            )}

            {/* 비디오 */}
            {post.video_url && (
              <div className="mt-6">
                <video
                  src={post.video_url}
                  controls
                  className="rounded-lg w-full h-auto max-h-96"
                  poster={post.image_url}
                />
              </div>
            )}
            {/* 액션 + 댓글 입력 (같은 카드 하단에 결합) */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <button onClick={handleLike} className={`flex items-center space-x-2 transition-colors ${liked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'}`}>
                    <FiHeart className={`w-5 h-5 ${liked ? 'fill-current' : 'stroke-current'}`} />
                    <span>{likeCount}</span>
                  </button>
                  <button 
                    onClick={() => setShowComments(!showComments)}
                    className={`flex items-center space-x-2 transition-colors ${
                      showComments 
                        ? 'text-blue-500' 
                        : 'text-gray-600 hover:text-blue-500'
                    }`}
                  >
                    <FiMessageCircle className={`w-5 h-5 ${showComments ? 'fill-current' : 'stroke-current'}`} />
                    <span>댓글 {comments.length}</span>
                    {showComments && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                    {!showComments && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>
                  <button onClick={handleShare} className="flex items-center space-x-2 text-gray-600 hover:text-green-600 transition-colors">
                    <FiShare2 className="w-5 h-5" />
                    <span>공유</span>
                  </button>
                </div>
              </div>

              {/* 댓글 입력 */}
              <div className="flex items-center gap-3 mt-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {(currentUser?.user_metadata?.full_name || 'U').charAt(0)}
                </div>
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    placeholder="댓글을 작성해보세요..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyPress={(e)=>{ if(e.key==='Enter') submitComment(); }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button onClick={submitComment} disabled={submittingComment} className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-full disabled:opacity-50">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>

            {/* 댓글 섹션 - 디시인사이드 스타일 */}
            <div className="mt-6 bg-white rounded-lg border border-gray-200">
              {/* 댓글 헤더 */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">댓글 {comments.length}</h3>
                  <button 
                    onClick={() => {
                      console.log('강제 댓글 새로고침 버튼 클릭');
                      loadMeta();
                    }}
                    className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  >
                    새로고침
                  </button>
                </div>
              </div>
              
              {/* 댓글 목록 */}
              {showComments && (
                <div className="p-4">
                  {(() => {
                    console.log('=== 댓글 목록 렌더링 시작 ===');
                    console.log('comments 배열:', comments);
                    console.log('comments.length:', comments.length);
                    
                    if (comments.length === 0) {
                      console.log('댓글이 없어서 "댓글 없음" 메시지 표시');
                      return (
                        <div className="text-center py-8 text-gray-500">
                          <p className="text-lg font-medium">아직 댓글이 없습니다</p>
                          <p className="text-sm mt-2">첫 번째 댓글을 작성해보세요!</p>
                        </div>
                      );
                    } else {
                      console.log('댓글 목록 렌더링 중...');
                      
                      // 댓글을 부모-자식 관계로 정리
                      const parentComments = comments.filter(comment => !comment.parent_id);
                      const childComments = comments.filter(comment => comment.parent_id);
                      
                      const renderCommentsWithReplies = (parentComment) => {
                        const replies = childComments.filter(child => child.parent_id === parentComment.id);
                        return (
                          <div key={parentComment.id}>
                            {renderComment(parentComment, 0)}
                            {replies.map(reply => renderComment(reply, 1))}
                          </div>
                        );
                      };
                      
                      return parentComments.map(renderCommentsWithReplies);
                    }
                  })()}
                </div>
              )}
              
              {!showComments && (
                <div className="text-center py-8 text-gray-500">
                  <p>댓글 목록이 숨겨져 있습니다</p>
                  <p className="text-sm mt-2">댓글 버튼을 클릭하여 댓글을 보세요</p>
                </div>
              )}
              
              {/* 댓글 작성 입력창 */}
              <div className="border-t border-gray-100 p-4 bg-gray-50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    U
                  </div>
                  <span className="text-sm text-gray-600">익명</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="댓글을 입력하세요..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        submitComment();
                      }
                    }}
                  />
                  <button
                    onClick={submitComment}
                    disabled={submittingComment}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm transition-colors disabled:opacity-50"
                  >
                    등록
                  </button>
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* 관련 게시글 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">관련 게시글</h3>
            <div className="space-y-2">
              {relatedPosts && relatedPosts.length > 0 ? (
                relatedPosts.map((p) => (
                  <Link key={p.id} href={`/community/${p.id}`} className="block p-3 rounded-lg hover:bg-gray-50 border border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-900 line-clamp-1">{p.title}</span>
                      <span className="text-xs text-gray-500">{new Date(p.created_at).toLocaleDateString('ko-KR')}</span>
                    </div>
                  </Link>
                ))
              ) : (
                <Link href="/community" className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <h4 className="font-medium text-gray-900 mb-2">더 많은 커뮤니티 글 보기</h4>
                  <p className="text-sm text-gray-600">다양한 예술 관련 이야기를 만나보세요</p>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}