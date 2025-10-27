import { supabase } from '../lib/supabase';

export interface DownloadStats {
  total_downloads: number;
}

export async function fetchDownloadStats(): Promise<DownloadStats> {
  const { data } = await supabase
    .from('download_stats')
    .select('total_downloads')
    .order('date', { ascending: false })
    .limit(1)
    .single();
    
  return { total_downloads: data?.total_downloads || 0 };
}