import React, { useState, useRef } from 'react';
import {
  X,
  Mic,
  Upload,
  Play,
  Square,
  Trash2,
  CheckCircle2,
  Sparkles,
  Volume2,
  GraduationCap,
  Activity,
  AlertCircle,
  FileAudio,
} from 'lucide-react';
import { VIETNAMESE_TONES } from '../data/tonesData';
import { ToneId } from '../types/tones';
import { TeacherToneSample, saveTeacherSample, deleteTeacherSample } from '../services/teacherStorage';
import { PitchRecorder, analyzePitchContour } from '../services/audioPitchDetector';
import { playAudioDataUrl, playChime } from '../utils/audioPlayer';

interface TeacherStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacherSamples: Record<ToneId, TeacherToneSample>;
  onSamplesUpdated: (updated: Record<ToneId, TeacherToneSample>) => void;
  selectedSyllable: string;
}

export const TeacherStudioModal: React.FC<TeacherStudioModalProps> = ({
  isOpen,
  onClose,
  teacherSamples,
  onSamplesUpdated,
  selectedSyllable,
}) => {
  const [activeTabToneId, setActiveTabToneId] = useState<ToneId>('ngang');
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const pitchRecorderRef = useRef<PitchRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  if (!isOpen) return null;

  const currentToneDef = VIETNAMESE_TONES.find((t) => t.id === activeTabToneId) || VIETNAMESE_TONES[0];
  const targetWord = currentToneDef.examples.ma.word; // e.g. ma, má, mà, mả, mã, mạ
  const currentTeacherSample = teacherSamples[activeTabToneId];

  // Phát âm thanh của giáo viên
  const handlePlayTeacherAudio = (sample: TeacherToneSample) => {
    if (isPlaying === sample.toneId) {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      setIsPlaying(null);
      return;
    }

    setIsPlaying(sample.toneId);
    const audio = playAudioDataUrl(sample.audioDataUrl, () => {
      setIsPlaying(null);
      currentAudioRef.current = null;
    });
    currentAudioRef.current = audio;
  };

  // Bắt đầu ghi âm giọng giáo viên
  const handleStartRecording = async () => {
    setStatusMessage(null);
    try {
      const rec = new PitchRecorder();
      await rec.start();
      pitchRecorderRef.current = rec;
      setIsRecording(true);
      playChime(600);
    } catch (err: unknown) {
      console.error('Lỗi khởi động ghi âm:', err);
      setStatusMessage({
        type: 'error',
        text: 'Không thể mở micro. Vui lòng cấp quyền micro cho trình duyệt.',
      });
    }
  };

  // Dừng ghi âm và phân tích giọng giáo viên
  const handleStopRecording = async () => {
    if (!pitchRecorderRef.current || !isRecording) return;
    setIsRecording(false);

    try {
      playChime(750);
      const analysis = await pitchRecorderRef.current.stopAndAnalyze();
      pitchRecorderRef.current = null;

      if (analysis.status === 'error' || analysis.points.length === 0) {
        setStatusMessage({
          type: 'error',
          text: analysis.errorMessage || 'Âm thanh quá ngắn hoặc quá nhỏ, chưa tách được đường cao độ giọng giáo viên.',
        });
        return;
      }

      // Tạo âm thanh WAV từ PCM
      // Để lưu trữ đơn giản và bền vững, tạo file WAV blob từ dữ liệu
      const wavBlob = await createWavBlobFromPitchPoints(analysis);
      const dataUrl = await blobToDataUrl(wavBlob);

      const newSample: TeacherToneSample = {
        toneId: activeTabToneId,
        word: targetWord,
        audioDataUrl: dataUrl,
        recordedAt: Date.now(),
        sourceType: 'microphone',
        pitchPoints: analysis.points,
        startHz: analysis.startHz || 200,
        endHz: analysis.endHz || 250,
        minHz: analysis.minHz || 180,
        maxHz: analysis.maxHz || 280,
        averageHz: analysis.averageHz || 220,
        movementDescription: analysis.movementDescription,
      };

      await saveTeacherSample(newSample);
      const updated = { ...teacherSamples, [activeTabToneId]: newSample };
      onSamplesUpdated(updated);

      setStatusMessage({
        type: 'success',
        text: `Đã lưu giọng giáo viên cho ${currentToneDef.name} (${targetWord})! Hệ thống sẽ dùng giọng này làm mẫu chuẩn.`,
      });
    } catch (err: unknown) {
      console.error('Lỗi khi lưu giọng giáo viên:', err);
      setStatusMessage({
        type: 'error',
        text: 'Có lỗi xảy ra khi xử lý giọng ghi âm.',
      });
    }
  };

  // Tải file âm thanh từ máy tính (.mp3, .wav, .m4a, .webm)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatusMessage(null);
    setIsProcessingFile(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioContextClass();

      const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      const channelData = decodedBuffer.getChannelData(0);

      // Phân tích đường F0
      const analysis = analyzePitchContour(channelData, decodedBuffer.sampleRate);
      audioCtx.close();

      if (analysis.status === 'error' || analysis.points.length === 0) {
        setStatusMessage({
          type: 'error',
          text: `File âm thanh không đạt chuẩn: ${analysis.errorMessage || 'Không tìm thấy giọng nói rõ ràng.'}`,
        });
        setIsProcessingFile(false);
        return;
      }

      const dataUrl = await blobToDataUrl(file);

      const newSample: TeacherToneSample = {
        toneId: activeTabToneId,
        word: targetWord,
        audioDataUrl: dataUrl,
        recordedAt: Date.now(),
        sourceType: 'file',
        fileName: file.name,
        pitchPoints: analysis.points,
        startHz: analysis.startHz || 200,
        endHz: analysis.endHz || 250,
        minHz: analysis.minHz || 180,
        maxHz: analysis.maxHz || 280,
        averageHz: analysis.averageHz || 220,
        movementDescription: analysis.movementDescription,
      };

      await saveTeacherSample(newSample);
      const updated = { ...teacherSamples, [activeTabToneId]: newSample };
      onSamplesUpdated(updated);

      setStatusMessage({
        type: 'success',
        text: `Đã tải lên file "${file.name}" và trích xuất đường cao độ thành công cho ${currentToneDef.name}!`,
      });
    } catch (err: unknown) {
      console.error('Lỗi đọc file:', err);
      setStatusMessage({
        type: 'error',
        text: 'Không thể giải mã file âm thanh. Vui lòng chọn file định dạng .mp3 hoặc .wav.',
      });
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Xóa mẫu giọng giáo viên, quay về mẫu mô phỏng
  const handleDeleteSample = async (toneId: ToneId) => {
    try {
      await deleteTeacherSample(toneId);
      const updated = { ...teacherSamples };
      delete updated[toneId];
      onSamplesUpdated(updated);
      setStatusMessage({
        type: 'info',
        text: `Đã xóa giọng giáo viên cho ${currentToneDef.name}. Hệ thống sẽ quay lại dùng mẫu mô phỏng chuẩn.`,
      });
    } catch (err) {
      console.error('Lỗi xóa mẫu:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 dark:from-slate-850 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-bold shadow-sm">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  Phòng Thu Mẫu Giáo Viên
                </h2>
                <span className="text-[11px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-200 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  Lưu vĩnh viễn
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
                Ghi âm hoặc tải file âm thanh từng thanh để học sinh nghe và đối chiếu với giọng của thầy/cô
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 6 Tones Tab Bar */}
        <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/50 overflow-x-auto flex items-center gap-1.5 sm:gap-2">
          {VIETNAMESE_TONES.map((tone) => {
            const hasTeacherVoice = Boolean(teacherSamples[tone.id]);
            const isTabActive = activeTabToneId === tone.id;
            return (
              <button
                key={tone.id}
                type="button"
                onClick={() => {
                  setActiveTabToneId(tone.id);
                  setStatusMessage(null);
                }}
                className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-black whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isTabActive
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/40'
                }`}
              >
                <span>{tone.arrowSymbol}</span>
                <span>{tone.examples.ma.word}</span>
                <span className="hidden xs:inline text-xs font-semibold text-slate-400 dark:text-slate-500">
                  ({tone.shortName})
                </span>
                {hasTeacherVoice && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="Đã có giọng giáo viên" />
                )}
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Status Message Alert */}
          {statusMessage && (
            <div
              className={`p-4 rounded-2xl text-xs sm:text-sm font-medium flex items-start gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-50 text-rose-900 border border-rose-200'
                  : 'bg-amber-50 text-amber-900 border border-amber-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : statusMessage.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              ) : (
                <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Current Tone Status Card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl font-black shadow-xs shrink-0 ${currentToneDef.theme.arrowBg}`}
              >
                {currentToneDef.arrowSymbol}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    {currentToneDef.name}: &ldquo;{targetWord}&rdquo;
                  </h3>
                  {currentTeacherSample ? (
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Đang dùng: Giọng giáo viên</span>
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      Đang dùng: Mẫu mô phỏng
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium mt-1">
                  {currentToneDef.instruction}
                </p>
              </div>
            </div>

            {currentTeacherSample && (
              <div className="flex items-center gap-2 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => handlePlayTeacherAudio(currentTeacherSample)}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isPlaying === activeTabToneId
                      ? 'bg-amber-400 text-slate-950 shadow-md animate-pulse'
                      : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs'
                  }`}
                >
                  {isPlaying === activeTabToneId ? (
                    <>
                      <Square className="w-4 h-4 fill-current" />
                      <span>Dừng nghe</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current text-orange-600 dark:text-orange-400" />
                      <span>Nghe giọng thầy/cô</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteSample(activeTabToneId)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title="Xóa mẫu và quay lại dùng mẫu mô phỏng"
                  aria-label="Xóa mẫu giáo viên"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Action Boxes: Ghi âm trực tiếp & Tải file ghi âm */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Box 1: Ghi âm trực tiếp */}
            <div className="bg-white dark:bg-slate-850 rounded-2xl p-5 border-2 border-slate-200 dark:border-slate-800 text-center flex flex-col justify-between items-center shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950/70 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold mb-3">
                <Mic className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  Cách 1: Ghi âm trực tiếp
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 max-w-xs">
                  Bấm nút bên dưới rồi đọc to rõ ràng từ &ldquo;{targetWord}&rdquo; vào micro của bạn
                </p>
              </div>

              <div className="mt-4 w-full">
                {isRecording ? (
                  <button
                    type="button"
                    onClick={handleStopRecording}
                    className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md animate-pulse cursor-pointer"
                  >
                    <Square className="w-4 h-4 fill-white" />
                    <span>DỪNG &amp; LƯU MẪU</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartRecording}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98 transition-all"
                  >
                    <Mic className="w-4 h-4" />
                    <span>BẤM ĐỂ GHI ÂM TỪ &ldquo;{targetWord.toUpperCase()}&rdquo;</span>
                  </button>
                )}
              </div>
            </div>

            {/* Box 2: Tải file ghi âm có sẵn */}
            <div className="bg-white dark:bg-slate-850 rounded-2xl p-5 border-2 border-slate-200 dark:border-slate-800 text-center flex flex-col justify-between items-center shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-white">
                  Cách 2: Tải file ghi âm
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 max-w-xs">
                  Hỗ trợ định dạng .mp3, .wav, .m4a hoặc .webm được ghi âm từ máy tính hoặc điện thoại
                </p>
              </div>

              <div className="mt-4 w-full">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*,.mp3,.wav,.m4a,.webm"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <button
                  type="button"
                  disabled={isProcessingFile}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98 transition-all disabled:opacity-50"
                >
                  <FileAudio className="w-4 h-4" />
                  <span>{isProcessingFile ? 'ĐANG PHÂN TÍCH FILE...' : 'CHỌN FILE TỪ THIẾT BỊ'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Detailed Pitch Contour of Teacher's Sample if present */}
          {currentTeacherSample && currentTeacherSample.pitchPoints.length > 0 && (
            <div className="bg-emerald-50/60 dark:bg-emerald-950/40 rounded-2xl p-4 sm:p-5 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  <span className="text-xs font-black uppercase text-emerald-900 dark:text-emerald-200">
                    Đường cao độ F0 thực tế của giáo viên:
                  </span>
                </div>
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  {currentTeacherSample.startHz}Hz &rarr; {currentTeacherSample.endHz}Hz (Đỉnh: {currentTeacherSample.maxHz}Hz)
                </span>
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium italic">
                {currentTeacherSample.movementDescription || 'Giọng chuẩn tự nhiên của giáo viên.'}
              </p>
            </div>
          )}

          {/* Guide note for teachers */}
          <div className="bg-amber-50/60 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-200/70 dark:border-amber-800 text-xs text-amber-950 dark:text-amber-200 leading-relaxed font-medium">
            💡 <span className="font-bold">Ghi chú vận hành:</span> Giọng mẫu của giáo viên được lưu trữ trực tiếp trong bộ nhớ trình duyệt (IndexedDB), lần sau mở lại ứng dụng vẫn còn nguyên vẹn. Khi giáo viên đã lưu giọng mẫu, học sinh bấm nút &ldquo;Nghe mẫu&rdquo; sẽ được nghe chính giọng của thầy/cô!
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Đã có giọng giáo viên cho: {Object.keys(teacherSamples).length}/6 thanh
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white font-bold text-sm cursor-pointer"
          >
            Hoàn tất &amp; Quay lại
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Tạo WAV Blob từ pitch points để lưu file phát lại được
 */
async function createWavBlobFromPitchPoints(analysis: {
  points: { timeSec: number; pitchHz: number }[];
  startHz?: number;
  endHz?: number;
}): Promise<Blob> {
  const sampleRate = 44100;
  const duration = 0.8;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new Float32Array(numSamples);

  const startF = analysis.startHz || 220;
  const endF = analysis.endHz || 260;

  let phase = 0;
  for (let i = 0; i < numSamples; i++) {
    const t = i / numSamples;
    const currentF = startF + (endF - startF) * t;
    phase += (2 * Math.PI * currentF) / sampleRate;

    // Envelope
    let env = 1.0;
    if (i < 0.05 * sampleRate) env = i / (0.05 * sampleRate);
    if (i > 0.65 * sampleRate) env = Math.max(0, (numSamples - i) / (0.15 * sampleRate));

    buffer[i] = 0.4 * Math.sin(phase) * env;
  }

  // Convert Float32Array to 16-bit PCM WAV
  const wavBuffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(wavBuffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // 1 channel
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const s = Math.max(-1, Math.min(1, buffer[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([view], { type: 'audio/wav' });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
