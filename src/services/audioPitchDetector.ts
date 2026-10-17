/**
 * Module đo cao độ giọng nói F0 (Fundamental Frequency) theo thời gian
 * Sử dụng thuật toán Tự tương quan chuẩn hóa (Normalized Autocorrelation) kết hợp nội suy Parabol
 * Giới hạn tần số: 75 Hz (giọng nam trầm) đến 500 Hz (giọng trẻ em/nữ)
 * Bỏ qua tiếng ồn, tạp âm và đoạn âm lượng quá nhỏ
 */

export interface PitchDataPoint {
  timeSec: number;
  pitchHz: number;
  pitchLevel: number; // Thang 1 - 5 tương đương hệ thống ngữ âm
}

export interface PitchAnalysisResult {
  status: 'success' | 'error';
  errorMessage?: string;
  points: PitchDataPoint[];
  startHz?: number;
  endHz?: number;
  minHz?: number;
  maxHz?: number;
  averageHz?: number;
  pitchMovement?: 'rising' | 'falling' | 'flat' | 'dipping' | 'complex';
  movementDescription?: string;
}

/**
 * Trình thu âm dữ liệu thô PCM để đo cao độ
 */
export class PitchRecorder {
  private audioCtx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private scriptNode: ScriptProcessorNode | null = null;
  private chunks: Float32Array[] = [];
  private sampleRate = 44100;

  public async start(): Promise<void> {
    this.chunks = [];

    // Mở mic
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: true,
      },
    });

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    this.audioCtx = new AudioContextClass();
    this.sampleRate = this.audioCtx.sampleRate;

    const source = this.audioCtx.createMediaStreamSource(this.stream);
    // Buffer size 2048 cho độ nhạy mượt
    this.scriptNode = this.audioCtx.createScriptProcessor(2048, 1, 1);

    this.scriptNode.onaudioprocess = (e) => {
      const channelData = e.inputBuffer.getChannelData(0);
      this.chunks.push(new Float32Array(channelData));
    };

    source.connect(this.scriptNode);
    this.scriptNode.connect(this.audioCtx.destination);
  }

  public async stopAndAnalyze(): Promise<PitchAnalysisResult> {
    // Ngắt kết nối các nút âm thanh
    if (this.scriptNode) {
      this.scriptNode.disconnect();
      this.scriptNode = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      try {
        await this.audioCtx.close();
      } catch {
        // bỏ qua
      }
      this.audioCtx = null;
    }

    // Ghép các chunk lại thành một mảng âm thanh hoàn chỉnh
    const totalLength = this.chunks.reduce((acc, c) => acc + c.length, 0);
    if (totalLength === 0) {
      return {
        status: 'error',
        errorMessage: 'Chưa thu được tín hiệu âm thanh nào từ micro.',
        points: [],
      };
    }

    const fullBuffer = new Float32Array(totalLength);
    let offset = 0;
    for (const chunk of this.chunks) {
      fullBuffer.set(chunk, offset);
      offset += chunk.length;
    }

    // Phân tích F0
    return analyzePitchContour(fullBuffer, this.sampleRate);
  }
}

/**
 * Thuật toán phát hiện cao độ F0 trên một frame âm thanh
 * Giới hạn: 75 Hz (nam trầm) đến 500 Hz (trẻ em)
 */
function detectFramePitch(
  frame: Float32Array,
  sampleRate: number
): { pitchHz: number | null; rms: number } {
  const N = frame.length;

  // 1. Tính cường độ âm lượng (RMS)
  let sumSq = 0;
  for (let i = 0; i < N; i++) {
    sumSq += frame[i] * frame[i];
  }
  const rms = Math.sqrt(sumSq / N);

  // Ngưỡng năng lượng: Bỏ qua đoạn quá nhỏ tiếng / khoảng lặng
  if (rms < 0.015) {
    return { pitchHz: null, rms };
  }

  // 2. Giới hạn khoảng tuần hoàn (lag) tương ứng với giọng người: 75 Hz - 500 Hz
  const minFreq = 75; // Giọng nam trầm
  const maxFreq = 500; // Giọng trẻ em / nữ cao

  const minPeriod = Math.floor(sampleRate / maxFreq);
  const maxPeriod = Math.floor(sampleRate / minFreq);

  if (maxPeriod >= N) {
    return { pitchHz: null, rms };
  }

  // 3. Tự tương quan (Autocorrelation)
  let bestLag = -1;
  let maxCorr = -1;

  for (let lag = minPeriod; lag <= maxPeriod; lag++) {
    let corr = 0;
    for (let i = 0; i < N - lag; i++) {
      corr += frame[i] * frame[i + lag];
    }

    if (corr > maxCorr) {
      maxCorr = corr;
      bestLag = lag;
    }
  }

  // 4. Kiểm tra độ tuần hoàn (Clarity): Bỏ qua tiếng ồn trắng, tiếng gió, tạp âm không có thanh điệu
  const clarity = maxCorr / sumSq;
  if (clarity < 0.52 || bestLag <= 0) {
    return { pitchHz: null, rms };
  }

  // 5. Nội suy Parabol để xác định đỉnh chính xác tới phần thập phân
  let exactLag = bestLag;
  if (bestLag > 1 && bestLag < N - 1) {
    let corrPrev = 0;
    let corrNext = 0;
    for (let i = 0; i < N - (bestLag - 1); i++) corrPrev += frame[i] * frame[i + (bestLag - 1)];
    for (let i = 0; i < N - (bestLag + 1); i++) corrNext += frame[i] * frame[i + (bestLag + 1)];

    const delta = (corrPrev - corrNext) / (2 * (corrPrev - 2 * maxCorr + corrNext));
    if (Math.abs(delta) < 1) {
      exactLag = bestLag + delta;
    }
  }

  const pitchHz = sampleRate / exactLag;

  // Lọc lại chắc chắn trong dải giọng người [75, 500] Hz
  if (pitchHz >= minFreq && pitchHz <= maxFreq) {
    return { pitchHz, rms };
  }

  return { pitchHz: null, rms };
}

/**
 * Phân tích đường cao độ giọng nói theo thời gian
 */
export function analyzePitchContour(
  audioBuffer: Float32Array,
  sampleRate: number
): PitchAnalysisResult {
  const frameSize = 1024; // ~23ms
  const hopSize = 512; // ~11ms độ phân giải thời gian

  const rawPoints: { timeSec: number; pitchHz: number; rms: number }[] = [];
  let maxRmsAcrossClip = 0;
  let totalVoicedFrames = 0;

  for (let i = 0; i + frameSize <= audioBuffer.length; i += hopSize) {
    const frame = audioBuffer.subarray(i, i + frameSize);
    const timeSec = (i + frameSize / 2) / sampleRate;

    const { pitchHz, rms } = detectFramePitch(frame, sampleRate);
    if (rms > maxRmsAcrossClip) {
      maxRmsAcrossClip = rms;
    }

    if (pitchHz !== null) {
      rawPoints.push({ timeSec, pitchHz, rms });
      totalVoicedFrames++;
    }
  }

  // KIỂM TRA ĐIỀU KIỆN THEO YÊU CẦU ĐỀ BÀI:
  // "Nếu đoạn đọc quá ngắn hoặc quá nhỏ để đo, báo 'Chưa đo được cao độ' và nói lý do bằng tiếng Việt, không tự vẽ đường."

  // 1. Quá nhỏ tiếng
  if (maxRmsAcrossClip < 0.016) {
    return {
      status: 'error',
      errorMessage:
        'Chưa đo được cao độ vì âm lượng quá nhỏ. Hãy để micro gần miệng hơn và nói to, rõ ràng nhé!',
      points: [],
    };
  }

  // 2. Quá ngắn (ít hơn 6 frame, tức dưới ~0.12 - 0.15 giây âm thanh có cao độ)
  if (totalVoicedFrames < 6) {
    return {
      status: 'error',
      errorMessage:
        'Chưa đo được cao độ vì tiếng đọc quá ngắn (dưới 0.2 giây) hoặc bị đứt quãng. Hãy ngân dài từ "ma, má, mà..." hơn một chút nhé!',
      points: [],
    };
  }

  // 3. Khử nhiễu đột biến (Median filter 3 điểm)
  const smoothedHz: number[] = [];
  for (let i = 0; i < rawPoints.length; i++) {
    const prev = rawPoints[Math.max(0, i - 1)].pitchHz;
    const curr = rawPoints[i].pitchHz;
    const next = rawPoints[Math.min(rawPoints.length - 1, i + 1)].pitchHz;

    // Lấy trung vị 3 điểm để loại bỏ lỗi nhảy quãng tám (octave jump)
    const sorted = [prev, curr, next].sort((a, b) => a - b);
    smoothedHz.push(sorted[1]);
  }

  // Tìm min, max để ánh xạ sang thang cao độ 5 bậc ngữ âm
  const minHz = Math.round(Math.min(...smoothedHz));
  const maxHz = Math.round(Math.max(...smoothedHz));
  const startHz = Math.round(smoothedHz[0]);
  const endHz = Math.round(smoothedHz[smoothedHz.length - 1]);
  const sumHz = smoothedHz.reduce((a, b) => a + b, 0);
  const averageHz = Math.round(sumHz / smoothedHz.length);

  // Ánh xạ từng điểm F0 sang thang 5 bậc (từ 1.0 đến 5.0)
  const hzRange = Math.max(30, maxHz - minHz);
  const points: PitchDataPoint[] = rawPoints.map((p, idx) => {
    const f0 = smoothedHz[idx];
    // Scale tương đối trong quãng giọng của người học (1.0 đến 5.0)
    const normalized = 1.0 + ((f0 - minHz) / hzRange) * 4.0;
    return {
      timeSec: Number(p.timeSec.toFixed(3)),
      pitchHz: Math.round(f0),
      pitchLevel: Number(Math.max(1, Math.min(5, normalized)).toFixed(2)),
    };
  });

  // Phân tích hướng chuyển động cao độ
  const deltaEndStart = endHz - startHz;
  let pitchMovement: 'rising' | 'falling' | 'flat' | 'dipping' | 'complex' = 'flat';
  let movementDescription = '';

  // Tìm điểm cực tiểu giữa chừng (cho thanh hỏi)
  const middleSlice = smoothedHz.slice(
    Math.floor(smoothedHz.length * 0.2),
    Math.floor(smoothedHz.length * 0.8)
  );
  const midMin = middleSlice.length > 0 ? Math.min(...middleSlice) : startHz;

  if (midMin < startHz - 25 && endHz > midMin + 20) {
    pitchMovement = 'dipping';
    movementDescription = `Giọng uốn võng xuống (${midMin}Hz) rồi móc nhẹ lên (${endHz}Hz)`;
  } else if (deltaEndStart >= 35) {
    pitchMovement = 'rising';
    movementDescription = `Giọng vút lên cao rõ rệt (từ ${startHz}Hz lên ${endHz}Hz, tăng +${deltaEndStart}Hz)`;
  } else if (deltaEndStart <= -35) {
    pitchMovement = 'falling';
    movementDescription = `Giọng hạ dần xuống trầm (từ ${startHz}Hz xuống ${endHz}Hz, giảm ${deltaEndStart}Hz)`;
  } else {
    pitchMovement = 'flat';
    movementDescription = `Giọng đi ngang tương đối đều (dao động quanh ${averageHz}Hz, chênh lệch ${Math.abs(deltaEndStart)}Hz)`;
  }

  return {
    status: 'success',
    points,
    startHz,
    endHz,
    minHz,
    maxHz,
    averageHz,
    pitchMovement,
    movementDescription,
  };
}
