-- Add created_at column to ai_post_schedules for ordering
ALTER TABLE public.ai_post_schedules
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Optional: backfill existing rows
UPDATE public.ai_post_schedules
  SET created_at = COALESCE(created_at, now())
  WHERE created_at IS NULL; 