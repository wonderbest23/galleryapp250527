export async function getSampleComments(
  supabase: any,
  boardId: number | string,
  limit: number = 5,
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('community_comments')
      .select('content')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.log('getSampleComments error', error);
      return '';
    }

    if (!data || !data.length) return '';

    return data
      .map((c: any, i: number) => `댓글예시${i + 1}: ${c.content?.replace(/\n+/g, ' ')}`)
      .join('\n');
  } catch (e) {
    console.log('getSampleComments catch', e);
    return '';
  }
} 