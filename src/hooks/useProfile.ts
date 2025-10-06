import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Profile, ProfileSubjectMark, ProfileTotals, MatchingCourse } from '@/types/database';

// Get or create profile for current user
export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Try to get existing profile
      const { data: existing, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (existing) return existing as Profile;

      // Create profile if doesn't exist
      if (fetchError?.code === 'PGRST116') {
        const { data: newProfile, error: creatError } = await supabase
          .from('profiles')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (createError) throw createError;
        return newProfile as Profile;
      }

      throw fetchError;
    },
  });
}

// Get profile subject marks
export function useProfileMarks() {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ['profileMarks', profile?.id],
    queryFn: async () => {
      if (!profile) return [];

      const { data, error } = await supabase
        .from('profile_subject_marks')
        .select('*, subjects(name)')
        .eq('profile_id', profile.id)
        .order('subject_code');

      if (error) throw error;
      return data as ProfileSubjectMark[];
    },
    enabled: !!profile,
  });
}

// Add or update subject mark
export function useUpsertMark() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();

  return useMutation({
    mutationFn: async ({ subject_code, percentage }: { subject_code: string; percentage: number }) => {
      if (!profile) throw new Error('Profile not loaded');

      const { data, error } = await supabase
        .from('profile_subject_marks')
        .upsert(
          { profile_id: profile.id, subject_code, percentage },
          { onConflict: 'profile_id,subject_code' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profileMarks'] });
      queryClient.invalidateQueries({ queryKey: ['profileTotals'] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}

// Delete subject mark
export function useDeleteMark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (markId: number) => {
      const { error } = await supabase
        .from('profile_subject_marks')
        .delete()
        .eq('id', markId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profileMarks'] });
      queryClient.invalidateQueries({ queryKey: ['profileTotals'] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
  });
}

// Get profile APS totals
export function useProfileTotals() {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ['profileTotals', profile?.id],
    queryFn: async () => {
      if (!profile) return null;

      const { data, error } = await supabase
        .rpc('get_profile_totals', { p_profile_id: profile.id })
        .single();

      if (error) throw error;
      return data as ProfileTotals;
    },
    enabled: !!profile,
  });
}

// Get matching courses
export function useMatches() {
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ['matches', profile?.id],
    queryFn: async () => {
      if (!profile) return [];

      const { data, error } = await supabase
        .rpc('list_matching_courses', { p_profile_id: profile.id });

      if (error) throw error;
      return data as MatchingCourse[];
    },
    enabled: !!profile,
  });
}