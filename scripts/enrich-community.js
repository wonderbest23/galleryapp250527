/*
  Enrich community posts with realistic profiles and better media links.
  - Seeds Korean-like user profiles with avatar URLs
  - Assigns random user_id to community_post rows (non-review) that lack it
  - Replaces short_video URLs with curated, natural-looking public videos (Pexels samples)
  Usage: node scripts/enrich-community.js
*/
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const NAMES = [
  '이서연','김민준','박지훈','정다은','최현우','윤지수','한유진','서지호','노지안','문하린',
  '강수아','류시원','오하윤','신도윤','배아인','고서현','임유나','차형준','장하람','권시우'
];

// Pexels public sample videos (short, mobile friendly)
const VIDEO_POOL = [
  'https://videos.pexels.com/video-files/856668/856668-hd_1280_720_25fps.mp4',
  'https://videos.pexels.com/video-files/34068/34068-uhd_2560_1440_25fps.mp4',
  'https://videos.pexels.com/video-files/2861796/2861796-uhd_2560_1440_24fps.mp4',
  'https://videos.pexels.com/video-files/1770809/1770809-hd_1280_720_24fps.mp4'
];

const avatarUrl = (name) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=ffffff&size=128`;

async function ensureProfiles() {
  const { data: existing } = await supabase.from('profiles').select('id, full_name').limit(1);
  if (existing && existing.length > 0) return; // already have at least one profile

  const rows = NAMES.map((full_name) => ({ full_name, avatar_url: avatarUrl(full_name) }));
  const { error } = await supabase.from('profiles').insert(rows);
  if (error) console.log('seed profiles error:', error.message);
  else console.log('seeded profiles:', rows.length);
}

async function assignUsers() {
  const { data: profiles } = await supabase.from('profiles').select('id');
  if (!profiles || profiles.length === 0) return console.log('no profiles to assign');
  const ids = profiles.map((p) => p.id);

  const { data: posts } = await supabase
    .from('community_post')
    .select('id, category, user_id')
    .neq('category', 'review');

  if (!posts || posts.length === 0) return console.log('no posts to assign');

  let count = 0;
  for (const p of posts) {
    if (p.user_id) continue;
    const user_id = ids[Math.floor(Math.random() * ids.length)];
    const { error } = await supabase.from('community_post').update({ user_id }).eq('id', p.id);
    if (!error) count++;
  }
  console.log('assigned user_id to posts:', count);
}

async function improveShortVideos() {
  const { data: sv } = await supabase
    .from('community_post')
    .select('id, video_url')
    .eq('category', 'short_video');
  if (!sv || sv.length === 0) return console.log('no short_video posts');

  let count = 0;
  for (let i = 0; i < sv.length; i++) {
    const p = sv[i];
    const video_url = VIDEO_POOL[i % VIDEO_POOL.length];
    const { error } = await supabase.from('community_post').update({ video_url }).eq('id', p.id);
    if (!error) count++;
  }
  console.log('updated short_video urls:', count);
}

async function run(){
  await ensureProfiles();
  await assignUsers();
  await improveShortVideos();
  const { data: check } = await supabase.from('community_post').select('id,category,user_id,video_url').order('created_at',{ascending:false}).limit(8);
  console.log('sample after enrichment:', check);
}

run().catch((e)=>{ console.error(e); process.exit(1); });


