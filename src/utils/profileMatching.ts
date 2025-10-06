/**
 * Advanced Profile Matching System
 * Minimal working version - focus on APS matching first
 */

import { validateApsMark } from './dataConsistency';

export interface StudentProfile {
  user_id: string;
  aps_mark: number | null;
  subject_marks: Record<string, number | null>;
  interests?: string[];
  career_goals?: string[];
}

export interface ProgramMatch {
  program_id: number;
  institution_type: 'university' | 'tvet';
  qualification: string;
  institution_name: string;
  required_aps: number;
  matching_score: number;
  match_confidence: MatchConfidence;
  success_probability: number;
  flags?: MatchFlag[];
  why_matched?: string[];
}

export type MatchConfidence = 'very_high' | 'high' | 'medium' | 'low' | 'very_low';
export type MatchFlag = 'met_cutoff' | 'exceeds_requirements' | 'recommended_verification';

interface AvailableProgram {
  id: number;
  type: 'university' | 'tvet';
  qualification: string;
  institution_name: string;
  required_aps: number;
}

export class ProfileMatcher {
  constructor(private programs: AvailableProgram[]) {}

  /**
   * Find APS-qualified matches for student
   */
  findMatches(student: StudentProfile): ProgramMatch[] {
    const matches: ProgramMatch[] = [];

    for (const program of this.programs) {
      if (!student.aps_mark || !this.meetsAPSMinimum(student, program)) {
        continue;
      }

      const matchScore = this.calculateMatchScore(student, program);
      const confidence = this.determineConfidence(matchScore);
      const probability = this.calculateProbability(matchScore);
      const flags = this.generateFlags(student, program);
      const whyMatched = this.generateMatchReasons(student, program);

      matches.push({
        program_id: program.id,
        institution_type: program.type,
        qualification: program.qualification,
        institution_name: program.institution_name,
        required_aps: program.required_aps,
        matching_score: matchScore,
        match_confidence: confidence,
        success_probability: probability,
        flags,
        why_matched: whyMatched
      });
    }

    return matches.filter(m => m.matching_score >= 50).sort((a, b) => b.matching_score - a.matching_score);
  }

  private meetsAPSMinimum(student: StudentProfile, program: AvailableProgram): boolean {
    const apsValid = validateApsMark(student.aps_mark, 'aps_mark');
    return apsValid.success && student.aps_mark! >= program.required_aps;
  }

  private calculateMatchScore(student: StudentProfile, program: AvailableProgram): number {
    // Simple base score from APS advantage
    const apsAdvantage = (student.aps_mark! - program.required_aps) / 42;
    const baseScore = 50 + (apsAdvantage * 50);
    return Math.max(50, Math.min(100, Math.round(baseScore)));
  }

  private determineConfidence(score: number): MatchConfidence {
    if (score >= 85) return 'very_high';
    if (score >= 70) return 'high';
    if (score >= 60) return 'medium';
    if (score >= 50) return 'low';
    return 'very_low';
  }

  private calculateProbability(score: number): number {
    // Linear mapping with minimum 30% baseline probability
    return Math.max(30, Math.round(score * 0.7 + 30));
  }

  private generateFlags(student: StudentProfile, program: AvailableProgram): MatchFlag[] {
    const flags: MatchFlag[] = ['met_cutoff'];
    
    if (student.aps_mark! > program.required_aps + 5) {
      flags.push('exceeds_requirements');
    }
    
    // Add validation flag for critical programs requiring additional verification
    const highDemand = ['medical', 'engineering', 'law'];
    if (highDemand.some(needle => program.qualification.toLowerCase().includes(needle))) {
      flags.push('recommended_verification');
    }
    
    return flags;
  }

  private generateMatchReasons(student: StudentProfile, program: AvailableProgram): string[] {
    const reasons: string[] = [];
    
    const margin = student.aps_mark! - program.required_aps;
    if (margin > 0) {
      reasons.push(`APS score ${student.aps_mark} meets requirement (${program.required_aps}) with ${margin} point margin`);
    } else {
      reasons.push(`APS score ${student.aps_mark} meets minimum requirement (${program.required_aps})`);
    }
    
    // Subject strengths
    const highMathRequired = /engineering|computer|mathematics/.test(program.qualification.toLowerCase());
    const hasGoodMath = (student.subject_marks.math_mark || 0) > 70;
    if (highMathRequired && hasGoodMath) {
      reasons.push('Strong mathematical aptitude matches program requirements');
    }
    
    return reasons;
  }

  /**
   * Create API-compatible format for frontend display
   */
  formatForDisplay(matches: ProgramMatch[]) {
    return matches.map(match => ({
      name: match.qualification,
      institution: match.institution_name,
      type: match.institution_type.toUpperCase(),
      match_score: match.matching_score,
      confidence: match.match_confidence,
      probability: match.success_probability,
      score_passed: match.matching_score >= 50,
      details: {
        required_aps: match.required_aps,
        flags: match.flags,
        match_reasons: match.why_matched
      }
    }));
  }
}