/**
 * Consolidated TypeScript definitions for advanced matching system
 */

// Extended profile types for enhanced matching
export interface ExtendedStudentProfile {
  user_id: string;
  aps_mark: number | null;
  subject_marks: Record<string, number | null>;
  interests?: string[];
  career_goals?: string[];
  standard_met?: string;
  profile_completeness?: 'low' | 'medium' | 'high';
}

export interface AvailableProgram {
  id: number;
  type: 'university' | 'tvet';
  qualification: string;
  institution_name: string;
  required_aps: number;
  faculty: string;
}

// Program matching results
export interface MatchingResult {
  matchScore: number;
  recommendationLevel: 'strong' | 'moderate' | 'weak' | 'ineligible';
  reasons: string[];
  suggestedFollowups: string[];
}

// Confidence scoring
export interface ProfileMatchingAnalytics {
  overallConfidence: number;
  apsMatchConfidence: number;
  pathwayAlignment: number;
  uniquenessFactor: number;
  matchingTier: 'foundation' | 'standard' | 'honors' | 'premium';
}

// Used throughout enhanced documentation paths
export const MATCHING_TIER_BOUNDARIES = {
  foundation: { minAPS: 15, maxAPS: 22 },
  standard: { minAPS: 23, maxAPS: 28 },
  honors: { minAPS: 29, maxAPS: 34 },
  premium: { minAPS: 35, maxAPS: 42 }
} as const;