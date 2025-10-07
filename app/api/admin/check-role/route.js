import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ user: null, profile: null });
    
    const { data: profile } = await supabase.from('profiles').select('role, full_name, email').eq('id', user.id).single();
    return Response.json({ 
      user: { id: user.id, email: user.email }, 
      profile 
    });
  } catch (e) {
    return Response.json({ error: e.message });
  }
}
