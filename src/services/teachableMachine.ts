import { ToneId } from '../types/tones';
import { VIETNAMESE_TONES } from '../data/tonesData';

export const DEFAULT_TEACHABLE_MACHINE_URL =
  'https://teachablemachine.withgoogle.com/models/nxdKU2Gh8/';

const CUSTOM_MODEL_URL_KEY = 'viettone_custom_teachable_machine_url';

// Lấy link mô hình hiện tại (mặc định là nxdKU2Gh8 hoặc do người dùng cấu hình)
export function getCurrentModelUrl(): string {
  if (typeof window === 'undefined') return DEFAULT_TEACHABLE_MACHINE_URL;
  try {
    const saved = localStorage.getItem(CUSTOM_MODEL_URL_KEY);
    if (saved && saved.trim()) {
      let url = saved.trim();
      if (!url.endsWith('/')) url += '/';
      return url;
    }
  } catch {
    // fallback
  }
  return DEFAULT_TEACHABLE_MACHINE_URL;
}

// Reset về link mô hình mặc định
export function resetToDefaultModelUrl(): void {
  try {
    localStorage.removeItem(CUSTOM_MODEL_URL_KEY);
    recognizerInstance = null;
  } catch {
    // ignore
  }
}

// Kiểm tra và lưu link mô hình mới
export async function setCustomModelUrl(
  inputUrl: string
): Promise<{ success: boolean; labels: string[]; url: string; error?: string }> {
  let cleanUrl = inputUrl.trim();
  if (!cleanUrl) {
    return {
      success: false,
      labels: [],
      url: cleanUrl,
      error: 'Vui lòng nhập đường link Teachable Machine hợp lệ.',
    };
  }

  // Chuẩn hóa url kết thúc bằng dấu gạch chéo
  if (!cleanUrl.endsWith('/')) {
    cleanUrl += '/';
  }

  try {
    // Kiểm tra metadata.json
    const metaRes = await fetch(`${cleanUrl}metadata.json`);
    if (!metaRes.ok) {
      throw new Error(
        `Không thể tải metadata.json từ link này (Mã phản hồi HTTP ${metaRes.status}). Hãy chắc chắn bạn đã nhấn "Upload (share) model" trên Teachable Machine.`
      );
    }
    const metaData = await metaRes.json();
    const labels: string[] = metaData.wordLabels || [];

    if (labels.length === 0) {
      throw new Error('Mô hình không chứa nhãn âm thanh nào.');
    }

    // Kiểm tra model.json
    const modelRes = await fetch(`${cleanUrl}model.json`);
    if (!modelRes.ok) {
      throw new Error(`Không thể tải model.json từ link này.`);
    }

    // Lưu vào localStorage
    localStorage.setItem(CUSTOM_MODEL_URL_KEY, cleanUrl);
    // Hủy instance cũ để lần tới load instance mới
    recognizerInstance = null;

    return {
      success: true,
      labels,
      url: cleanUrl,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Không thể kết nối đến mô hình.';
    return {
      success: false,
      labels: [],
      url: cleanUrl,
      error: msg,
    };
  }
}

// Type definitions for window.speechCommands
declare global {
  interface Window {
    speechCommands?: {
      create: (
        fftType: string,
        vocabularyFeature: undefined,
        checkpointUrl: string,
        metadataUrl: string
      ) => SpeechRecognizer;
    };
    tf?: unknown;
  }
}

export interface SpeechRecognizer {
  ensureModelLoaded: () => Promise<void>;
  wordLabels: () => string[];
  listen: (
    callback: (result: { scores: Float32Array | number[] }) => void,
    config: {
      includeSpectrogram?: boolean;
      probabilityThreshold?: number;
      invokeCallbackOnNoiseAndUnknown?: boolean;
      overlapFactor?: number;
    }
  ) => Promise<void>;
  stopListening: () => Promise<void>;
  isListening: () => boolean;
}

export interface ToneScoreItem {
  toneId: ToneId;
  label: string;
  toneName: string;
  word: string;
  arrowSymbol: string;
  score: number; // 0 to 1
  percentage: number; // 0 to 100
  colorHex: string;
  barColorClass: string;
  isWinner: boolean;
  isTarget: boolean;
}

export interface PredictionResult {
  predictedToneId: ToneId | 'noise';
  predictedToneName: string;
  predictedWord: string;
  predictedArrow: string;
  isNoiseOnly: boolean;
  highestConfidence: number; // 0 to 1
  scores: ToneScoreItem[];
  noiseScore: number;
  noisePercentage: number;
  targetToneId: ToneId;
  isCorrect: boolean;
  feedbackMessage: string;
}

let recognizerInstance: SpeechRecognizer | null = null;
let isInitializing = false;

/**
 * Đảm bảo thư viện TensorFlow.js và Speech Commands đã tải xong
 */
async function ensureLibrariesLoaded(): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('Chỉ hỗ trợ môi trường trình duyệt.');
  }

  if (window.speechCommands && window.tf) {
    return;
  }

  // Chờ tối đa 6 giây nếu đang tải qua CDN
  const startTime = Date.now();
  while (!window.speechCommands || !window.tf) {
    if (Date.now() - startTime > 6000) {
      break;
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  if (!window.speechCommands || !window.tf) {
    throw new Error(
      'Không thể tải thư viện nhận diện âm thanh TensorFlow.js. Vui lòng kiểm tra lại kết nối mạng của bạn.'
    );
  }
}

/**
 * Khởi tạo mô hình Teachable Machine từ link hiện tại
 */
export async function getOrLoadModel(forceReload = false): Promise<SpeechRecognizer> {
  if (forceReload) {
    recognizerInstance = null;
  }

  if (recognizerInstance) {
    return recognizerInstance;
  }

  if (isInitializing) {
    while (isInitializing) {
      await new Promise((r) => setTimeout(r, 150));
    }
    if (recognizerInstance) return recognizerInstance;
  }

  isInitializing = true;
  const currentUrl = getCurrentModelUrl();

  try {
    await ensureLibrariesLoaded();

    const checkpointURL = `${currentUrl}model.json`;
    const metadataURL = `${currentUrl}metadata.json`;

    const recognizer = window.speechCommands!.create(
      'BROWSER_FFT',
      undefined,
      checkpointURL,
      metadataURL
    );

    await recognizer.ensureModelLoaded();
    recognizerInstance = recognizer;
    return recognizer;
  } catch (err: unknown) {
    console.error('Lỗi tải mô hình Teachable Machine:', err);
    const msg =
      err instanceof Error
        ? err.message
        : 'Không thể kết nối đến mô hình Teachable Machine.';
    throw new Error(
      `Không thể tải mô hình âm thanh Teachable Machine (link: ${currentUrl}). ${msg}`
    );
  } finally {
    isInitializing = false;
  }
}

/**
 * Chuẩn hóa nhãn từ mô hình Teachable Machine sang ToneId
 */
export function mapLabelToToneId(label: string): ToneId | 'noise' {
  const normalized = label.trim().toLowerCase();
  if (
    normalized.includes('noise') ||
    normalized.includes('background') ||
    normalized.includes('ồn')
  ) {
    return 'noise';
  }
  if (normalized === 'ma') return 'ngang';
  if (normalized === 'má') return 'sac';
  if (normalized === 'mà') return 'huyen';
  if (normalized === 'mả') return 'hoi';
  if (normalized === 'mã') return 'nga';
  if (normalized === 'mạ') return 'nang';

  return 'noise';
}

/**
 * Lắng nghe giọng nói qua micro trong khoảng 1 giây và phân tích qua mô hình Teachable Machine
 */
export async function listenAndPredict(
  targetToneId: ToneId,
  selectedSyllable: string = 'ma',
  onTick?: (remainingMs: number) => void
): Promise<PredictionResult> {
  // 1. Kiểm tra và xin quyền truy cập Micro
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error(
      'Trình duyệt của bạn không hỗ trợ ghi âm micro. Vui lòng sử dụng Chrome, Safari hoặc Edge phiên bản mới.'
    );
  }

  let micStream: MediaStream;
  try {
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: false,
        autoGainControl: true,
      },
    });
  } catch (err: unknown) {
    console.error('Lỗi cấp quyền micro:', err);
    if (
      err instanceof DOMException &&
      (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')
    ) {
      throw new Error(
        'Bạn chưa cho phép ứng dụng sử dụng micro. Vui lòng bấm vào biểu tượng Micro/Khóa 🔒 trên thanh địa chỉ của trình duyệt, chọn "Cho phép" (Allow) rồi thử lại.'
      );
    }
    if (err instanceof DOMException && err.name === 'NotFoundError') {
      throw new Error(
        'Không tìm thấy micro trên thiết bị của bạn. Vui lòng kết nối micro hoặc tai nghe và thử lại.'
      );
    }
    throw new Error(
      'Không thể truy cập micro. Vui lòng kiểm tra cài đặt âm thanh của thiết bị.'
    );
  }

  micStream.getTracks().forEach((track) => track.stop());

  // 2. Tải mô hình
  const recognizer = await getOrLoadModel();
  const labels = recognizer.wordLabels();

  if (recognizer.isListening()) {
    try {
      await recognizer.stopListening();
    } catch {
      // bỏ qua
    }
  }

  // 3. Lắng nghe trong khoảng 1 giây (1200ms)
  const collectedSnapshots: number[][] = [];

  const listenPromise = new Promise<number[][]>((resolve, reject) => {
    let hasStopped = false;

    recognizer
      .listen(
        (result) => {
          if (result && result.scores) {
            collectedSnapshots.push(Array.from(result.scores));
          }
        },
        {
          includeSpectrogram: false,
          probabilityThreshold: 0.0,
          invokeCallbackOnNoiseAndUnknown: true,
          overlapFactor: 0.5,
        }
      )
      .then(() => {
        const duration = 1200;
        const interval = 100;
        let elapsed = 0;

        const timer = setInterval(() => {
          elapsed += interval;
          if (onTick) {
            onTick(Math.max(0, duration - elapsed));
          }

          if (elapsed >= duration && !hasStopped) {
            hasStopped = true;
            clearInterval(timer);

            recognizer
              .stopListening()
              .then(() => resolve(collectedSnapshots))
              .catch((err) => {
                console.warn('Lỗi khi dừng nghe:', err);
                resolve(collectedSnapshots);
              });
          }
        }, interval);
      })
      .catch((err) => {
        reject(err);
      });
  });

  const allScores = await listenPromise;

  // 4. Xử lý các điểm số xác suất
  let bestScores: number[] = new Array(labels.length).fill(0);

  if (allScores.length === 0) {
    bestScores = new Array(labels.length).fill(1 / labels.length);
  } else if (allScores.length === 1) {
    bestScores = allScores[0];
  } else {
    let maxVoiceEnergy = -1;
    let bestFrameIndex = 0;

    allScores.forEach((frame, idx) => {
      let voiceSum = 0;
      frame.forEach((val, labelIdx) => {
        const lName = labels[labelIdx].toLowerCase();
        if (!lName.includes('noise')) {
          voiceSum += val;
        }
      });

      if (voiceSum > maxVoiceEnergy) {
        maxVoiceEnergy = voiceSum;
        bestFrameIndex = idx;
      }
    });

    bestScores = allScores[bestFrameIndex];
  }

  // 5. Phân bổ điểm cho 6 thanh và tiếng ồn nền
  let noiseScore = 0;
  const toneScoreMap: Record<ToneId, number> = {
    ngang: 0,
    sac: 0,
    huyen: 0,
    hoi: 0,
    nga: 0,
    nang: 0,
  };

  labels.forEach((label, idx) => {
    const rawScore = bestScores[idx] || 0;
    const toneType = mapLabelToToneId(label);

    if (toneType === 'noise') {
      noiseScore = Math.max(noiseScore, rawScore);
    } else {
      toneScoreMap[toneType] = rawScore;
    }
  });

  const toneEntries = Object.entries(toneScoreMap) as [ToneId, number][];
  toneEntries.sort((a, b) => b[1] - a[1]);
  const [topToneId, topScore] = toneEntries[0];

  const isNoiseOnly = noiseScore > 0.65 && topScore < 0.35;
  const predictedToneId = isNoiseOnly ? 'noise' : topToneId;

  const scores: ToneScoreItem[] = VIETNAMESE_TONES.map((tone) => {
    const rawVal = toneScoreMap[tone.id] || 0;
    const word =
      tone.examples[selectedSyllable as 'ma']?.word || tone.examples.ma.word;
    const isWinner = !isNoiseOnly && tone.id === topToneId;
    const isTarget = tone.id === targetToneId;

    return {
      toneId: tone.id,
      label: tone.shortName,
      toneName: tone.name,
      word,
      arrowSymbol: tone.arrowSymbol,
      score: rawVal,
      percentage: Math.round(rawVal * 100),
      colorHex: tone.theme.hexAccent,
      barColorClass: tone.theme.arrowBg,
      isWinner,
      isTarget,
    };
  });

  const predictedToneDef = VIETNAMESE_TONES.find((t) => t.id === topToneId);
  const targetToneDef = VIETNAMESE_TONES.find((t) => t.id === targetToneId);
  const isCorrect = !isNoiseOnly && topToneId === targetToneId;

  let feedbackMessage = '';
  if (isNoiseOnly) {
    feedbackMessage =
      'Mô hình chỉ nghe thấy tiếng ồn nền hoặc âm lượng quá nhỏ. Hãy nói to, rõ ràng và gần micro hơn nhé!';
  } else if (isCorrect) {
    feedbackMessage = `Xuất sắc! Mô hình AI nghe đúng bạn đọc ${targetToneDef?.name} (${targetToneDef?.examples.ma.word} ${targetToneDef?.arrowSymbol}).`;
  } else {
    feedbackMessage = `Bạn đang chọn luyện ${targetToneDef?.name} (${targetToneDef?.examples.ma.word}), nhưng AI nghe giống ${predictedToneDef?.name} (${predictedToneDef?.examples.ma.word} ${predictedToneDef?.arrowSymbol}). Hãy thử điều chỉnh cao độ giọng theo mũi tên nhé!`;
  }

  return {
    predictedToneId,
    predictedToneName: isNoiseOnly ? 'Tiếng ồn nền' : predictedToneDef?.name || '',
    predictedWord: isNoiseOnly ? '' : predictedToneDef?.examples.ma.word || '',
    predictedArrow: isNoiseOnly ? '🔊' : predictedToneDef?.arrowSymbol || '',
    isNoiseOnly,
    highestConfidence: isNoiseOnly ? noiseScore : topScore,
    scores,
    noiseScore,
    noisePercentage: Math.round(noiseScore * 100),
    targetToneId,
    isCorrect,
    feedbackMessage,
  };
}
