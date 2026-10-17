import { ToneId, ToneDefinition } from '../types/tones';
import { PredictionResult } from './teachableMachine';
import { SimilarityScoreResult } from './pitchSimilarity';
import { PitchAnalysisResult } from './audioPitchDetector';
import { VIETNAMESE_TONES } from '../data/tonesData';

/**
 * CÁC CON SỐ CẤU HÌNH NGƯỠNG ĐÁNH GIÁ (DỄ DÀNG ĐIỀU CHỈNH TẠI ĐÂY)
 */
export const EVALUATION_CONFIG = {
  // 1. AI chỉ được coi là 'chắc chắn' khi thanh cao nhất đạt từ 70% trở lên
  MIN_CONFIDENCE_THRESHOLD: 70, // 70%

  // VÀ hơn thanh đứng thứ hai ít nhất 15% (không tính tiếng ồn nền)
  MIN_MARGIN_OVER_SECOND: 15, // 15%

  // 3. Ngưỡng điểm cao độ tối thiểu khi AI đoán đúng thanh
  MIN_PITCH_SIMILARITY_SCORE: 40, // 40 điểm
};

export interface IntegratedFeedbackResult {
  category: 'uncertain' | 'mismatch' | 'correct' | 'wrong_confident';
  badgeTitle: string;
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
  comment: string;
  specificTip?: string;
  topToneId?: ToneId;
  topTonePercentage?: number;
  secondToneId?: ToneId;
  secondTonePercentage?: number;
  margin?: number;
  isAiConfident: boolean;
  similarityScore?: number;
}

/**
 * Gộp kết quả AI đoán thanh và đường cao độ thành MỘT lời nhận xét thống nhất, ngắn gọn, ấm áp cho trẻ em.
 */
export function generateIntegratedFeedback(
  prediction: PredictionResult | null,
  pitchResult: PitchAnalysisResult | null,
  similarityResult: SimilarityScoreResult | null,
  targetTone: ToneDefinition,
  targetWord: string
): IntegratedFeedbackResult | null {
  if (!prediction) return null;

  // Lọc bỏ tiếng ồn nền, chỉ lấy 6 thanh điệu
  const toneScores = [...prediction.scores].sort((a, b) => b.percentage - a.percentage);
  const topCandidate = toneScores[0];
  const secondCandidate = toneScores[1] || { percentage: 0, toneId: 'none' };

  const topPercentage = topCandidate.percentage;
  const secondPercentage = secondCandidate.percentage;
  const margin = topPercentage - secondPercentage;

  // ĐIỀU KIỆN 1: AI chỉ được coi là 'chắc chắn' khi:
  // - Thanh cao nhất đạt từ 70% trở lên
  // - VÀ hơn thanh đứng thứ hai ít nhất 15%
  // - VÀ không phải chỉ toàn tiếng ồn nền
  const isAiConfident =
    !prediction.isNoiseOnly &&
    topPercentage >= EVALUATION_CONFIG.MIN_CONFIDENCE_THRESHOLD &&
    margin >= EVALUATION_CONFIG.MIN_MARGIN_OVER_SECOND;

  // Kiểm tra xem đã đo được cao độ thành công hay chưa
  const hasValidPitch =
    pitchResult?.status === 'success' &&
    Boolean(similarityResult?.hasScore);

  const pitchScore = similarityResult?.hasScore ? similarityResult.totalScore : 0;

  // ĐIỀU KIỆN 2: Nếu AI chưa chắc HOẶC chưa đo được cao độ
  // -> Hiện 'Chưa đủ chắc chắn' và câu 'AI chưa nhận diện chắc chắn. Hãy nghe mẫu chuẩn và thử đọc lại'. Không nói đúng hay sai.
  if (!isAiConfident || !hasValidPitch) {
    return {
      category: 'uncertain',
      badgeTitle: 'Chưa đủ chắc chắn',
      badgeColor: 'text-amber-900',
      badgeBg: 'bg-amber-100',
      badgeBorder: 'border-amber-300',
      comment: 'AI chưa nhận diện chắc chắn. Hãy nghe mẫu chuẩn và thử đọc lại.',
      isAiConfident: false,
      topToneId: topCandidate.toneId,
      topTonePercentage: topPercentage,
      secondToneId: secondCandidate.toneId as ToneId,
      secondTonePercentage: secondPercentage,
      margin,
    };
  }

  // ĐIỀU KIỆN 3: Nếu AI nghe ra đúng thanh nhưng điểm cao độ dưới 40:
  // -> Nói hai kết quả chưa khớp nhau và mời nghe lại mẫu.
  const isPredictedCorrectTone = topCandidate.toneId === targetTone.id;

  if (isPredictedCorrectTone && pitchScore < EVALUATION_CONFIG.MIN_PITCH_SIMILARITY_SCORE) {
    return {
      category: 'mismatch',
      badgeTitle: 'Hai kết quả chưa khớp nhau',
      badgeColor: 'text-orange-950',
      badgeBg: 'bg-orange-100',
      badgeBorder: 'border-orange-300',
      comment: `AI nghe ra bạn đọc thanh ${targetTone.shortName} rồi, nhưng đường cao độ giọng nói lại chưa khớp với mẫu (${pitchScore}/100 điểm). Em hãy nghe lại mẫu chuẩn rồi đọc thử lại nhé!`,
      isAiConfident: true,
      topToneId: topCandidate.toneId,
      topTonePercentage: topPercentage,
      similarityScore: pitchScore,
    };
  }

  // ĐIỀU KIỆN 4: Nếu đúng (AI chắc chắn nghe ra đúng thanh VÀ điểm cao độ >= 40)
  // -> Khen và nêu một nhận xét cụ thể (ví dụ thanh sắc chưa lên đủ cao).
  if (isPredictedCorrectTone && pitchScore >= EVALUATION_CONFIG.MIN_PITCH_SIMILARITY_SCORE) {
    let specificTip = '';

    // Nhận xét cụ thể theo từng thanh điệu và chi tiết điểm
    if (targetTone.id === 'sac') {
      if (similarityResult && similarityResult.directionScore < 25) {
        specificTip = 'Bé phát âm rất tốt! Nếu em đẩy giọng vút lên cao hơn một chút xíu ở đuôi chữ nữa thì sẽ tuyệt đối luôn!';
      } else {
        specificTip = 'Giỏi quá! Tiếng đọc vút cao và nhanh rất chuẩn thanh Sắc rồi nè.';
      }
    } else if (targetTone.id === 'huyen') {
      if (similarityResult && similarityResult.shapeScore < 35) {
        specificTip = 'Bé đọc tốt lắm! Em hãy thả lỏng cổ họng và hạ giọng thật êm ái xuống trầm nữa nhé.';
      } else {
        specificTip = 'Khen em nhé! Giọng đọc trầm ấm và nhẹ nhàng đúng điệu thanh Huyền rồi.';
      }
    } else if (targetTone.id === 'hoi') {
      if (similarityResult && similarityResult.shapeScore < 35) {
        specificTip = 'Bé làm tốt lắm! Để hay hơn, em nhớ uốn giọng võng sâu xuống đáy cổ họng rồi mới móc nhẹ lên nhé.';
      } else {
        specificTip = 'Tuyệt vời! Em đã biết uốn giọng võng xuống rồi móc nhẹ lên rất khéo.';
      }
    } else if (targetTone.id === 'nga') {
      if (similarityResult && similarityResult.shapeScore < 35) {
        specificTip = 'Rất hay! Em nhớ hơi nén hơi ở cổ một nhịp rồi bật vút lên cao hơn nữa nhé.';
      } else {
        specificTip = 'Xuất sắc! Em bật giọng gợn sóng đúng chuẩn thanh Ngã rồi.';
      }
    } else if (targetTone.id === 'nang') {
      if (similarityResult && similarityResult.directionScore < 25) {
        specificTip = 'Bé đọc rất tốt! Em hãy nhấn giọng dứt khoát và ngắt âm đột ngột hơn chút nữa nhé.';
      } else {
        specificTip = 'Giỏi lắm! Tiếng nhấn giọng gọn gàng và ngắt dứt khoát rất chuẩn thanh Nặng.';
      }
    } else {
      // Thanh ngang
      specificTip = 'Tuyệt vời! Giọng em giữ đều đều ngân dài rất êm tai đúng chuẩn thanh Ngang.';
    }

    return {
      category: 'correct',
      badgeTitle: 'Bé đọc đúng rồi, giỏi quá!',
      badgeColor: 'text-emerald-950',
      badgeBg: 'bg-emerald-100',
      badgeBorder: 'border-emerald-300',
      comment: specificTip,
      isAiConfident: true,
      topToneId: topCandidate.toneId,
      topTonePercentage: topPercentage,
      similarityScore: pitchScore,
    };
  }

  // ĐIỀU KIỆN 5: Nếu AI chắc chắn nghe ra thanh khác:
  // -> Nói em đang đọc gần với thanh nào và gợi ý cách sửa.
  const detectedToneDef = VIETNAMESE_TONES.find((t) => t.id === topCandidate.toneId);
  const detectedName = detectedToneDef ? detectedToneDef.name : 'thanh khác';
  const detectedWord = detectedToneDef ? detectedToneDef.examples.ma.word : '';

  let advice = '';
  if (targetTone.id === 'sac') {
    advice = 'Em hãy lấy hơi và lên giọng thật cao, nhanh về phía cuối như hỏi "Hả?!" nhé.';
  } else if (targetTone.id === 'huyen') {
    advice = 'Em hãy hạ giọng nhẹ dần xuống trầm ấm, êm như tiếng thở phào "À..." nhé.';
  } else if (targetTone.id === 'hoi') {
    advice = 'Em hãy uốn giọng chìm sâu xuống đáy cổ rồi móc nhẹ lên như đang thắc mắc "Ủa?" nhé.';
  } else if (targetTone.id === 'nga') {
    advice = 'Em hãy khựng hơi ở cổ một nhịp rồi bật vút lên cao nhé.';
  } else if (targetTone.id === 'nang') {
    advice = 'Em hãy nhấn mạnh giọng xuống thật sâu và ngắt ngay lập tức nhé.';
  } else {
    advice = 'Em hãy giữ giọng thật đều, không lên không xuống nhé.';
  }

  return {
    category: 'wrong_confident',
    badgeTitle: 'Gần được rồi, thử lại nhé!',
    badgeColor: 'text-amber-950',
    badgeBg: 'bg-amber-100',
    badgeBorder: 'border-amber-300',
    comment: `Em đang đọc gần giống với ${detectedName} ("${detectedWord}") rồi. Để đọc đúng ${targetTone.name} ("${targetWord}"), ${advice}`,
    isAiConfident: true,
    topToneId: topCandidate.toneId,
    topTonePercentage: topPercentage,
    similarityScore: pitchScore,
  };
}
