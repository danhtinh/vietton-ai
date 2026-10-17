import { ToneId } from './tones';

export interface PracticeAttempt {
  id: string;
  timestamp: number;
  dateStr: string; // YYYY-MM-DD
  targetToneId: ToneId;
  targetWord: string;
  detectedToneId: ToneId | 'noise';
  isAiConfident: boolean;
  confidenceScore: number; // 0 - 100
  similarityScore: number | null; // 0 - 100 hoặc null nếu chưa đo được
  isTeacherModel: boolean;
  category: 'uncertain' | 'mismatch' | 'correct' | 'wrong_confident';
}

export interface ToneStats {
  toneId: ToneId;
  totalAttempts: number;
  validPitchAttempts: number;
  averageSimilarity: number | null; // null nếu chưa có lượt hợp lệ
  minSimilarity: number | null;
  maxSimilarity: number | null;
  latestScore: number | null;
  hasEnoughValidAttempts: boolean; // >= 3 lượt hợp lệ
  progressFeedback: string;
}

export interface BadgeItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
}
