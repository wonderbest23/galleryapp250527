const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createPointFunctions() {
  try {
    console.log('포인트 시스템 함수 생성 시작...');

    // 1. 사용 가능 포인트 조회 함수
    const { error: availablePointsError } = await supabase.rpc('exec_sql', {
      sql: `
        create or replace function get_available_points(p_user_id uuid)
        returns integer
        language plpgsql
        security definer
        as $$
        declare
          available_points integer;
        begin
          select coalesce(sum(amount), 0)
          into available_points
          from public.point_transactions
          where user_id = p_user_id
            and status = 'unlocked'
            and transaction_type in ('earned', 'unlocked')
            and amount > 0;
          
          return available_points;
        end;
        $$;
      `
    });

    if (availablePointsError) {
      console.error('get_available_points 함수 생성 오류:', availablePointsError);
    } else {
      console.log('get_available_points 함수 생성 완료');
    }

    // 2. 잠금 포인트 조회 함수
    const { error: lockedPointsError } = await supabase.rpc('exec_sql', {
      sql: `
        create or replace function get_locked_points(p_user_id uuid)
        returns integer
        language plpgsql
        security definer
        as $$
        declare
          locked_points integer;
        begin
          select coalesce(sum(amount), 0)
          into locked_points
          from public.point_transactions
          where user_id = p_user_id
            and status = 'locked'
            and transaction_type in ('earned', 'locked')
            and amount > 0;
          
          return locked_points;
        end;
        $$;
      `
    });

    if (lockedPointsError) {
      console.error('get_locked_points 함수 생성 오류:', lockedPointsError);
    } else {
      console.log('get_locked_points 함수 생성 완료');
    }

    // 3. 사용자 등급 업데이트 함수
    const { error: updateGradeError } = await supabase.rpc('exec_sql', {
      sql: `
        create or replace function update_user_grade(p_user_id uuid)
        returns void
        language plpgsql
        security definer
        as $$
        declare
          current_grade text;
          new_grade text;
          approved_reviews_count integer;
          avg_rating numeric;
          deep_reviews_count integer;
          featured_count integer;
        begin
          -- 현재 등급 조회
          select grade into current_grade
          from public.user_grades
          where user_id = p_user_id;
          
          -- 등급 정보가 없으면 기본값으로 생성
          if current_grade is null then
            insert into public.user_grades (user_id, grade)
            values (p_user_id, 'bronze')
            on conflict (user_id) do nothing;
            current_grade := 'bronze';
          end if;
          
          -- 최근 60일 승인 리뷰 수 조회 (리뷰 품질 검증이 없는 경우 기본값 사용)
          select count(*), coalesce(avg(rating), 0)
          into approved_reviews_count, avg_rating
          from public.exhibition_review er
          left join public.review_quality_checks rqc on er.id = rqc.review_id
          where er.user_id = p_user_id
            and (rqc.quality_status = 'approved' or rqc.quality_status is null)
            and er.created_at >= now() - interval '60 days';
          
          -- 최근 60일 심화 리뷰 수 조회
          select count(*)
          into deep_reviews_count
          from public.review_quality_checks
          where user_id = p_user_id
            and is_deep_review = true
            and quality_status = 'approved'
            and created_at >= now() - interval '60 days';
          
          -- 최근 60일 피처드 횟수 조회
          select count(*)
          into featured_count
          from public.review_quality_checks
          where user_id = p_user_id
            and is_featured = true
            and quality_status = 'approved'
            and created_at >= now() - interval '60 days';
          
          -- 등급 결정 로직 (간소화)
          if approved_reviews_count >= 12 and deep_reviews_count >= 2 and featured_count >= 1 then
            new_grade := 'platinum';
          elsif approved_reviews_count >= 6 and avg_rating >= 4.2 then
            new_grade := 'gold';
          elsif approved_reviews_count >= 3 then
            new_grade := 'silver';
          else
            new_grade := 'bronze';
          end if;
          
          -- 등급이 변경된 경우에만 업데이트
          if current_grade != new_grade then
            update public.user_grades
            set grade = new_grade,
                approved_reviews_60d = approved_reviews_count,
                avg_rating_60d = avg_rating,
                deep_reviews_60d = deep_reviews_count,
                featured_count_60d = featured_count,
                grade_updated_at = now(),
                updated_at = now()
            where user_id = p_user_id;
          else
            -- 등급은 같지만 통계는 업데이트
            update public.user_grades
            set approved_reviews_60d = approved_reviews_count,
                avg_rating_60d = avg_rating,
                deep_reviews_60d = deep_reviews_count,
                featured_count_60d = featured_count,
                updated_at = now()
            where user_id = p_user_id;
          end if;
        end;
        $$;
      `
    });

    if (updateGradeError) {
      console.error('update_user_grade 함수 생성 오류:', updateGradeError);
    } else {
      console.log('update_user_grade 함수 생성 완료');
    }

    console.log('\n=== 포인트 시스템 함수 생성 완료 ===');

  } catch (error) {
    console.error('함수 생성 프로세스 오류:', error);
  }
}

// 메인 실행
createPointFunctions().catch(console.error);

