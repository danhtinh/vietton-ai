import { ToneId } from '../types/tones';
import { VIETNAMESE_TONES } from '../data/tonesData';
import { PracticeAttempt, ToneStats, BadgeItem } from '../types/history';

const STORAGE_KEY = 'viettone_practice_history_v1';
const UNLOCKED_BADGES_KEY = 'viettone_unlocked_badges_v1';

/**
 * Lấy lịch sử tất cả các lượt luyện tập THỰC TẾ đã lưu trên máy
 * Tuyệt đối không tự tạo dữ liệu mẫu
 */
export function getPracticeHistory(): PracticeAttempt[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Lỗi đọc lịch sử luyện tập:', err);
    return [];
  }
}

/**
 * Lưu một lượt luyện tập mới
 */
export function savePracticeAttempt(data: {
  targetToneId: ToneId;
  targetWord: string;
  detectedToneId: ToneId | 'noise';
  isAiConfident: boolean;
  confidenceScore: number;
  similarityScore: number | null;
  isTeacherModel: boolean;
  category: 'uncertain' | 'mismatch' | 'correct' | 'wrong_confident';
}): {
  attempt: PracticeAttempt;
  improved: boolean;
  scoreDelta: number;
  newBadges: BadgeItem[];
} {
  const history = getPracticeHistory();
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0]; // YYYY-MM-DD

  const newAttempt: PracticeAttempt = {
    id: `attempt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    dateStr,
    ...data,
  };

  // KIỂM TRA ĐIỀU KIỆN TIẾN BỘ THEO YÊU CẦU ĐỀ BÀI:
  // "Chỉ khen ‘em tiến bộ’ khi hai lượt cùng một thanh, cùng mẫu chuẩn và điểm tăng từ 5 trở lên."
  let improved = false;
  let scoreDelta = 0;

  if (newAttempt.similarityScore !== null) {
    // Tìm lượt trước đó gần nhất có CÙNG THANH và CÙNG MẪU CHUẨN (cùng giáo viên hoặc cùng mô phỏng)
    const prevMatch = [...history]
      .reverse()
      .find(
        (a) =>
          a.targetToneId === newAttempt.targetToneId &&
          a.isTeacherModel === newAttempt.isTeacherModel &&
          a.similarityScore !== null
      );

    if (prevMatch && prevMatch.similarityScore !== null) {
      scoreDelta = newAttempt.similarityScore - prevMatch.similarityScore;
      if (scoreDelta >= 5) {
        improved = true;
      }
    }
  }

  // Lưu vào localStorage
  const updatedHistory = [newAttempt, ...history];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  } catch (err) {
    console.error('Lỗi ghi lịch sử:', err);
  }

  // Kiểm tra mở khóa huy hiệu mới
  const newBadges = checkAndUnlockBadges(updatedHistory);

  return {
    attempt: newAttempt,
    improved,
    scoreDelta,
    newBadges,
  };
}

/**
 * Xóa toàn bộ lịch sử luyện tập
 */
export function clearPracticeHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(UNLOCKED_BADGES_KEY);
  } catch (err) {
    console.error('Lỗi xóa lịch sử:', err);
  }
}

/**
 * Tính số ngày luyện tập liên tiếp (Streak) từ dữ liệu thật
 */
export function calculateStreak(history: PracticeAttempt[]): number {
  if (history.length === 0) return 0;

  // Lấy danh sách các ngày duy nhất có luyện tập, sắp xếp giảm dần
  const uniqueDates = Array.from(new Set(history.map((a) => a.dateStr))).sort().reverse();
  if (uniqueDates.length === 0) return 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // Nếu ngày gần nhất không phải hôm nay hoặc hôm qua thì chuỗi đã đứt
  if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) {
    return 0;
  }

  let streak = 1;
  let currentDate = new Date(uniqueDates[0]);

  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = new Date(uniqueDates[i]);
    const diffDays = Math.round((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak++;
      currentDate = prevDate;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Danh sách định nghĩa các huy hiệu
 */
const BADGE_DEFINITIONS: Array<{ id: string; title: string; description: string; icon: string }> = [
  {
    id: 'first_step',
    title: 'Khởi Đầu Tự Tin',
    description: 'Hoàn thành lượt luyện tập đầu tiên',
    icon: '🌱',
  },
  {
    id: 'all_six_tones',
    title: 'Khám Phá 6 Thanh',
    description: 'Đã thử sức luyện đọc đủ cả 6 thanh điệu tiếng Việt',
    icon: '🌟',
  },
  {
    id: 'streak_3_days',
    title: 'Bền Bỉ 3 Ngày',
    description: 'Luyện tập liên tục trong 3 ngày',
    icon: '🔥',
  },
  {
    id: 'pitch_master_80',
    title: 'Giọng Đọc Chuẩn Xác',
    description: 'Đạt điểm tương đồng cao độ từ 80 điểm trở lên',
    icon: '🎯',
  },
  {
    id: 'ten_attempts',
    title: 'Chăm Chỉ 10 Lượt',
    description: 'Đã hoàn thành 10 lượt luyện phát âm',
    icon: '🏆',
  },
];

/**
 * Kiểm tra các huy hiệu đã mở khóa
 */
export function getAllBadges(history: PracticeAttempt[]): BadgeItem[] {
  let unlockedIds: Record<string, number> = {};
  try {
    const raw = localStorage.getItem(UNLOCKED_BADGES_KEY);
    if (raw) unlockedIds = JSON.parse(raw);
  } catch {
    // bỏ qua
  }

  const streak = calculateStreak(history);
  const testedToneIds = new Set(history.map((a) => a.targetToneId));

  return BADGE_DEFINITIONS.map((def) => {
    let shouldUnlock = false;

    if (def.id === 'first_step' && history.length >= 1) shouldUnlock = true;
    if (def.id === 'all_six_tones' && testedToneIds.size >= 6) shouldUnlock = true;
    if (def.id === 'streak_3_days' && streak >= 3) shouldUnlock = true;
    if (def.id === 'pitch_master_80' && history.some((a) => (a.similarityScore || 0) >= 80)) shouldUnlock = true;
    if (def.id === 'ten_attempts' && history.length >= 10) shouldUnlock = true;

    const isUnlocked = shouldUnlock || Boolean(unlockedIds[def.id]);

    return {
      ...def,
      unlocked: isUnlocked,
      unlockedAt: unlockedIds[def.id],
    };
  });
}

function checkAndUnlockBadges(history: PracticeAttempt[]): BadgeItem[] {
  let unlockedIds: Record<string, number> = {};
  try {
    const raw = localStorage.getItem(UNLOCKED_BADGES_KEY);
    if (raw) unlockedIds = JSON.parse(raw);
  } catch {
    // bỏ qua
  }

  const badges = getAllBadges(history);
  const newlyUnlocked: BadgeItem[] = [];

  badges.forEach((b) => {
    if (b.unlocked && !unlockedIds[b.id]) {
      unlockedIds[b.id] = Date.now();
      newlyUnlocked.push(b);
    }
  });

  if (newlyUnlocked.length > 0) {
    try {
      localStorage.setItem(UNLOCKED_BADGES_KEY, JSON.stringify(unlockedIds));
    } catch {
      // bỏ qua
    }
  }

  return newlyUnlocked;
}

/**
 * Thống kê chi tiết theo từng thanh điệu:
 * - "Chỉ nhận xét một thanh khi đã có ít nhất 3 lượt hợp lệ."
 * - "Ưu tiên gợi ý thanh có điểm cao độ thấp nhất."
 */
export function getToneStatistics(history: PracticeAttempt[]): {
  stats: Record<ToneId, ToneStats>;
  recommendedToneId: ToneId;
  totalAttempts: number;
  totalValidPitchAttempts: number;
} {
  const toneIds: ToneId[] = ['ngang', 'sac', 'huyen', 'hoi', 'nga', 'nang'];
  const stats = {} as Record<ToneId, ToneStats>;

  let totalValid = 0;

  toneIds.forEach((id) => {
    const attempts = history.filter((a) => a.targetToneId === id);
    const validAttempts = attempts.filter((a) => a.similarityScore !== null);
    totalValid += validAttempts.length;

    const validScores = validAttempts.map((a) => a.similarityScore as number);
    const hasEnough = validScores.length >= 3;

    let avg: number | null = null;
    let min: number | null = null;
    let max: number | null = null;
    let latest: number | null = null;

    if (validScores.length > 0) {
      avg = Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length);
      min = Math.min(...validScores);
      max = Math.max(...validScores);
      latest = validScores[0];
    }

    let progressFeedback = '';
    // YÊU CẦU: "Chỉ nhận xét một thanh khi đã có ít nhất 3 lượt hợp lệ."
    if (!hasEnough) {
      const remaining = 3 - validScores.length;
      progressFeedback = `Cần thêm ít nhất ${remaining} lượt đọc hợp lệ để nhận xét tiến độ thanh này.`;
    } else {
      // Đã có từ 3 lượt hợp lệ trở lên
      const recent3 = validScores.slice(0, 3);
      if (recent3[0] > recent3[recent3.length - 1] + 5) {
        progressFeedback = `Tiến bộ rất tốt! Điểm gần đây (${recent3[0]}/100) đang cải thiện rõ rệt so với ban đầu.`;
      } else if ((avg || 0) >= 75) {
        progressFeedback = `Phong độ rất vững vàng! Điểm trung bình đạt ${avg}/100, đường cao độ bám sát mẫu.`;
      } else {
        progressFeedback = `Điểm trung bình ${avg}/100. Em nên nghe mẫu chuẩn kỹ hơn để uốn giọng đúng hướng nhé.`;
      }
    }

    stats[id] = {
      toneId: id,
      totalAttempts: attempts.length,
      validPitchAttempts: validAttempts.length,
      averageSimilarity: avg,
      minSimilarity: min,
      maxSimilarity: max,
      latestScore: latest,
      hasEnoughValidAttempts: hasEnough,
      progressFeedback,
    };
  });

  // TÌM THANH ƯU TIÊN GỢI Ý:
  // "ưu tiên gợi ý thanh có điểm cao độ thấp nhất"
  // Nếu có thanh chưa luyện lượt nào, ưu tiên thanh chưa luyện.
  // Nếu tất cả đã luyện, chọn thanh có điểm trung bình thấp nhất.
  let recommendedToneId: ToneId = 'ngang';
  let minScore = 999;

  // Kiểm tra thanh chưa có lượt nào trước
  const unattempted = toneIds.find((id) => stats[id].totalAttempts === 0);
  if (unattempted) {
    recommendedToneId = unattempted;
  } else {
    toneIds.forEach((id) => {
      const s = stats[id].averageSimilarity;
      if (s !== null && s < minScore) {
        minScore = s;
        recommendedToneId = id;
      }
    });
  }

  return {
    stats,
    recommendedToneId,
    totalAttempts: history.length,
    totalValidPitchAttempts: totalValid,
  };
}

/**
 * Thống kê điểm trung bình theo ngày để vẽ biểu đồ tiến bộ
 */
export function getDailyProgress(history: PracticeAttempt[]): Array<{
  dateStr: string;
  displayDate: string;
  attemptsCount: number;
  averageScore: number | null;
}> {
  if (history.length === 0) return [];

  // Nhóm theo ngày
  const map: Record<string, number[]> = {};
  history.forEach((a) => {
    if (!map[a.dateStr]) map[a.dateStr] = [];
    if (a.similarityScore !== null) {
      map[a.dateStr].push(a.similarityScore);
    }
  });

  const sortedDates = Object.keys(map).sort();

  return sortedDates.map((dateStr) => {
    const scores = map[dateStr];
    const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    const parts = dateStr.split('-');
    const displayDate = `${parts[2]}/${parts[1]}`;

    return {
      dateStr,
      displayDate,
      attemptsCount: history.filter((a) => a.dateStr === dateStr).length,
      averageScore: avg,
    };
  });
}
