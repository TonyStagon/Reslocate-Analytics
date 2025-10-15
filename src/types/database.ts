/**
 * Database types for defined schema structures
 */

export interface Profile {
  id: string;
  user_id: string;
  updated_at?: string;
  created_at?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  school?: string;
  grade?: string;
  date_of_birth?: string;
  quintile?: string;
  is_verified?: boolean;
  profile_picture?: string;
  career_asp1?: string;
  career_asp2?: string;
  career_asp3?: string;
  acad_chal1?: string;
  acad_chal2?: string;
  acad_chal3?: string;
  learning_method1?: string;
  learning_method2?: string;
  learning_method3?: string;
  race?: string;
  gender?: string;
  hobby1?: string;
  hobby2?: string;
  hobby3?: string;
  nearby_amenity?: string;
  safety?: string;
  important_feature?: string;
  commute?: string;
  status?: string;
  role: 'Learner' | 'Parent' | 'Tutor' | 'Other';
  is_parent?: boolean;
  pfirst_name?: string;
  plast_name?: string;
  pphone_number?: string;
  parent_id?: string;
  province?: string;
  streetaddress?: string;
  email?: string;
  country?: string;
  last_seen?: string;
  career_quest_completed?: boolean;
  learner_emails?: string;
  education_level?: string;
  employment_status?: string;
  industry?: string;
}

export interface ProfileSubjectMark {
  id: number;
  profile_id: string;
  subject_code: string;
  percentage: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileTotals {
  total_marks: number;
  average_percentage: number;
  total_points: number;
  aps_score: number;
  qualified_facts: string[];
  decision_package: { [format: string]: string };
}

export interface MatchingCourse {
  id: number;
  name: string;
  institution: string;
  type: 'UNIVERSITY' | 'TVET';
  match_score: number;
  confidence: number;
  probability: number;
  score_passed: boolean;
  details: {
    required_aps: number;
    suggested_path: string;
    match_analysis: {
      aps_score?: number;
      complete_profile_boost?: number;
      alignment_in_subjects?: number;
    };
    enhanced_oportunity: Record<string, string[]>;
    factors_driven_match: number;
  };
}

export interface Session {
  session_id: string;
  user_id: string;
  start_time: string;
  end_time?: string;
}

// Additional database table interfaces can be added here as needed