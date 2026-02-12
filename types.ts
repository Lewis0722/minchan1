export interface YearlyStats {
  year: number;
  quotaSuSi: number; // 수시 모집 인원
  quotaJeongSi: number; // 정시 모집 인원
  competitionRateSuSi: number; // 수시 경쟁률
  competitionRateJeongSi: number; // 정시 경쟁률
  cutoffGPA: number; // 내신 합격 컷 (등급, e.g., 1.5)
  cutoffCSAT: number; // 수능 합격 컷 (백분위, e.g., 92.5)
}

export interface UniversityData {
  id: string;
  universityName: string;
  departmentName: string;
  location: string;
  regionCategory: 'SEOUL' | 'CAPITAL' | 'OTHER'; // 서울 | 수도권 | 지방
  tags: string[]; // e.g., "인서울", "지거국", "유사학과"
  description?: string;
  stats: YearlyStats[];
}

export type RegionType = 'SEOUL' | 'CAPITAL' | 'OTHER';
export type ScoreType = 'NONE' | 'GPA' | 'CSAT';

export interface SearchOptions {
  regions: RegionType[];
  scoreType: ScoreType;
  scoreValue: string;
}

export interface SearchState {
  query: string;
  results: UniversityData[];
  loading: boolean;
  error: string | null;
  hasSearched: boolean;
}