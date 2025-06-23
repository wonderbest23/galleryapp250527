export async function getSamplePosts(
  supabase: any,
  boardId: number | string,
  limit: number = 5,
): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('community_post')
      .select('title, content')
      .eq('board_id', boardId)
      .order('likes', { ascending: false })
      .limit(limit);

    if (error) {
      console.log('getSamplePosts error', error);
      return '';
    }

    if (!data || !data.length) return '';

    return data
      .map(
        (p: any, i: number) =>
          `예시${i + 1}\n제목: ${p.title}\n본문: ${p.content?.replace(/\n+/g, ' ')}\n`,
      )
      .join('\n');
  } catch (e) {
    console.log('getSamplePosts catch', e);
    return '';
  }
} 