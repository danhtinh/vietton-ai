import { ToneDefinition } from '../types/tones';
import { PitchDataPoint } from './audioPitchDetector';
import { TeacherToneSample } from './teacherStorage';

export interface SimilarityScoreResult {
  hasScore: boolean;
  noScoreReason?: string;
  totalScore: number; // 0 - 100
  shapeScore: number; // Tối đa 45 điểm
  directionScore: number; // Tối đa 30 điểm
  timeAlignmentScore: number; // Tối đa 25 điểm
  isTeacherModel: boolean;
  feedbackText: string;
  normalizedLearner: { x: number; y: number }[]; // 0-100 x, 0-100 y
  normalizedTarget: { x: number; y: number }[];
}

/**
 * Nội suy một mảng cao độ thành N điểm cách đều theo thời gian
 */
function interpolatePoints(values: number[], targetCount = 50): number[] {
  if (values.length === 0) return new Array(targetCount).fill(0.5);
  if (values.length === 1) return new Array(targetCount).fill(values[0]);

  const result: number[] = [];
  const step = (values.length - 1) / (targetCount - 1);

  for (let i = 0; i < targetCount; i++) {
    const t = i * step;
    const idx = Math.floor(t);
    const frac = t - idx;
    const v1 = values[idx];
    const v2 = idx + 1 < values.length ? values[idx + 1] : v1;
    result.push(v1 * (1 - frac) + v2 * frac);
  }

  return result;
}

/**
 * Chuẩn hóa mảng cao độ về khoảng [0, 1] để loại bỏ độ cao thấp tự nhiên của từng người
 * (giọng nam trầm hay giọng trẻ em chỉ so hình dáng đường đi, không so giọng cao hay thấp)
 */
function normalizeContour(values: number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min;

  // Nếu dao động quá bé (< 10Hz, giọng bằng phẳng như thanh ngang)
  if (span < 12) {
    return values.map(() => 0.5);
  }

  return values.map((v) => (v - min) / span);
}

/**
 * Lấy các điểm cao độ của đường mẫu (giọng giáo viên nếu có, hoặc mẫu mô phỏng chuẩn)
 */
function getReferencePoints(
  targetTone: ToneDefinition,
  teacherSample?: TeacherToneSample
): { points: number[]; isTeacher: boolean } {
  if (teacherSample && teacherSample.pitchPoints && teacherSample.pitchPoints.length >= 4) {
    return {
      points: teacherSample.pitchPoints.map((p) => p.pitchHz),
      isTeacher: true,
    };
  }

  // Mẫu mô phỏng 5 bậc ngữ âm
  return {
    points: targetTone.pitchPoints,
    isTeacher: false,
  };
}

/**
 * Tính điểm tương đồng cao độ từ 0 đến 100:
 * - Giống hình dáng: 45%
 * - Đúng chiều lên hay xuống: 30%
 * - Khớp nhau sau khi căn thời gian: 25%
 */
export function calculatePitchSimilarity(
  learnerPoints: PitchDataPoint[],
  targetTone: ToneDefinition,
  teacherSample?: TeacherToneSample
): SimilarityScoreResult {
  // 1. Kiểm tra nếu chưa đo được cao độ
  if (!learnerPoints || learnerPoints.length < 5) {
    return {
      hasScore: false,
      noScoreReason:
        'Chưa đo được cao độ giọng đọc (do tiếng phát âm quá ngắn hoặc quá nhỏ). Vui lòng phát âm to, rõ ràng và ngân dài từ hơn để chấm điểm.',
      totalScore: 0,
      shapeScore: 0,
      directionScore: 0,
      timeAlignmentScore: 0,
      isTeacherModel: false,
      feedbackText: '',
      normalizedLearner: [],
      normalizedTarget: [],
    };
  }

  const { points: refPointsRaw, isTeacher } = getReferencePoints(targetTone, teacherSample);

  if (!refPointsRaw || refPointsRaw.length === 0) {
    return {
      hasScore: false,
      noScoreReason: 'Chưa có đường mẫu cho thanh điệu này để đối chiếu.',
      totalScore: 0,
      shapeScore: 0,
      directionScore: 0,
      timeAlignmentScore: 0,
      isTeacherModel: false,
      feedbackText: '',
      normalizedLearner: [],
      normalizedTarget: [],
    };
  }

  // 2. Nội suy cả 2 đường thành 50 điểm để người đọc nhanh hay chậm đều so công bằng
  const N = 50;
  const learnerHz = learnerPoints.map((p) => p.pitchHz);
  const interpLearner = interpolatePoints(learnerHz, N);
  const interpTarget = interpolatePoints(refPointsRaw, N);

  // 3. Chuẩn hóa hình dáng [0, 1] để giọng nam, nữ, trẻ em đều so được công bằng
  const normLearner = normalizeContour(interpLearner);
  const normTarget = normalizeContour(interpTarget);

  // PHẦN 1: GIỐNG HÌNH DÁNG (45 ĐIỂM)
  // Tính hệ số tương quan Pearson giữa 2 chuỗi hình dáng
  const meanL = normLearner.reduce((a, b) => a + b, 0) / N;
  const meanT = normTarget.reduce((a, b) => a + b, 0) / N;

  let num = 0;
  let denL = 0;
  let denT = 0;

  for (let i = 0; i < N; i++) {
    const dl = normLearner[i] - meanL;
    const dt = normTarget[i] - meanT;
    num += dl * dt;
    denL += dl * dl;
    denT += dt * dt;
  }

  let r = 0;
  if (denL === 0 && denT === 0) {
    r = 1.0; // Cả hai đều đi ngang phẳng
  } else if (denL === 0 || denT === 0) {
    r = 0.0; // Một bên phẳng, một bên lượn sóng
  } else {
    r = num / (Math.sqrt(denL * denT) || 1);
  }

  // r dao động từ -1 đến 1. Điểm hình dáng tối đa 45
  const shapeScore = Math.round(Math.max(0, r) * 45);

  // PHẦN 2: ĐÚNG CHIỀU LÊN HAY XUỐNG TỪ ĐẦU ĐẾN CUỐI (30 ĐIỂM)
  const dirL = normLearner[N - 1] - normLearner[0];
  const dirT = normTarget[N - 1] - normTarget[0];

  let directionScore = 0;
  // Cả hai cùng đi ngang
  if (Math.abs(dirT) < 0.18 && Math.abs(dirL) < 0.18) {
    directionScore = 30;
  }
  // Cùng chiều vút lên hoặc cùng chiều hạ xuống
  else if ((dirL > 0.15 && dirT > 0.15) || (dirL < -0.15 && dirT < -0.15)) {
    const diff = Math.abs(dirL - dirT);
    directionScore = Math.round(Math.max(16, (1 - diff * 0.5) * 30));
  }
  // Ngược chiều hoàn toàn (một người lên giọng, một người xuống giọng)
  else if ((dirL > 0.15 && dirT < -0.15) || (dirL < -0.15 && dirT > 0.15)) {
    directionScore = 0;
  }
  // Gần phẳng hoặc hơi lệch
  else {
    directionScore = 12;
  }

  // PHẦN 3: KHỚP NHAU SAU KHI CĂN THỜI GIAN (25 ĐIỂM)
  // Sai số trung bình tuyệt đối sau khi căn thời gian (MAE)
  let mae = 0;
  for (let i = 0; i < N; i++) {
    mae += Math.abs(normLearner[i] - normTarget[i]);
  }
  mae = mae / N;

  const timeAlignmentScore = Math.round(Math.max(0, 1 - 1.8 * mae) * 25);

  // TỔNG ĐIỂM TỪ 0 ĐẾN 100
  const totalScore = Math.min(100, Math.max(0, shapeScore + directionScore + timeAlignmentScore));

  // Lời nhận xét
  let feedbackText = '';
  if (totalScore >= 85) {
    feedbackText = 'Đường cao độ của bạn khớp rất tốt với mẫu! Hướng giọng và độ lượn gần như trùng khớp.';
  } else if (totalScore >= 65) {
    feedbackText = 'Khá tốt! Hướng đi của giọng đã đúng, bạn hãy uốn giọng dứt khoát hơn để đường vẽ ôm sát mẫu hơn nhé.';
  } else {
    feedbackText = 'Đường cao độ còn khác so với mẫu. Hãy nhìn kỹ đường đi của mẫu và điều chỉnh hướng lên hoặc xuống của giọng nhé!';
  }

  // Tạo tọa độ đồ thị chuẩn hóa (0-100 x, 0-100 y) để vẽ trực quan
  const normalizedLearner = normLearner.map((val, idx) => ({
    x: (idx / (N - 1)) * 100,
    y: Math.round(val * 100),
  }));

  const normalizedTarget = normTarget.map((val, idx) => ({
    x: (idx / (N - 1)) * 100,
    y: Math.round(val * 100),
  }));

  return {
    hasScore: true,
    totalScore,
    shapeScore,
    directionScore,
    timeAlignmentScore,
    isTeacherModel: isTeacher,
    feedbackText,
    normalizedLearner,
    normalizedTarget,
  };
}
