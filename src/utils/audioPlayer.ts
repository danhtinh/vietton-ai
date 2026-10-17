import { ToneDefinition } from '../types/tones';

// Web Audio Context singleton
let audioCtx: AudioContext | null = null;
let currentPlayingAudio: HTMLAudioElement | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Phát âm thanh từ data URL (Base64 file âm thanh của giáo viên)
 */
export function playAudioDataUrl(dataUrl: string, onEnd?: () => void): HTMLAudioElement {
  // Dừng âm thanh đang phát nếu có
  if (currentPlayingAudio) {
    try {
      currentPlayingAudio.pause();
      currentPlayingAudio.currentTime = 0;
    } catch {
      // bỏ qua
    }
  }

  const audio = new Audio(dataUrl);
  currentPlayingAudio = audio;

  audio.onended = () => {
    currentPlayingAudio = null;
    if (onEnd) onEnd();
  };

  audio.onerror = () => {
    currentPlayingAudio = null;
    if (onEnd) onEnd();
  };

  audio.play().catch((err) => {
    console.warn('Không thể phát file âm thanh:', err);
    currentPlayingAudio = null;
    if (onEnd) onEnd();
  });

  return audio;
}

/**
 * Phát âm thanh tiếng Việt bằng Web Speech Synthesis
 * (Chỉ để người học nghe phát âm mẫu, không dùng để chấm điểm)
 */
export function speakVietnameseWord(word: string, onEnd?: () => void): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'vi-VN';
    utterance.rate = 0.85;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find((v) => v.lang.includes('vi') || v.lang.includes('VI'));
    if (viVoice) {
      utterance.voice = viVoice;
    }

    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
    }

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.warn('Speech synthesis error:', err);
    if (onEnd) onEnd();
    return false;
  }
}

/**
 * Phát âm điệu cao độ nhạc (Pitch Contour Synthesizer)
 */
export function playTonePitchGuide(tone: ToneDefinition, onEnd?: () => void) {
  const ctx = getAudioContext();
  if (!ctx) {
    if (onEnd) onEnd();
    return;
  }

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';

    const { baseFreq, endFreq, midFreq, duration, hasGlottalBreak, hasAbruptStop } =
      tone.audioPitchConfig;

    osc.frequency.setValueAtTime(baseFreq, now);

    if (midFreq) {
      const halfTime = now + duration * 0.45;
      osc.frequency.exponentialRampToValueAtTime(midFreq, halfTime);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
    } else {
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
    }

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.05);

    if (hasGlottalBreak) {
      const breakStart = now + duration * 0.4;
      const breakEnd = now + duration * 0.52;
      gain.gain.setValueAtTime(0.35, breakStart);
      gain.gain.exponentialRampToValueAtTime(0.01, breakStart + 0.02);
      gain.gain.setValueAtTime(0.01, breakEnd);
      gain.gain.exponentialRampToValueAtTime(0.4, breakEnd + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    } else if (hasAbruptStop) {
      gain.gain.setValueAtTime(0.4, now + duration - 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    } else {
      gain.gain.setValueAtTime(0.35, now + duration - 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    }

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration + 0.05);

    osc.onended = () => {
      if (onEnd) onEnd();
    };
  } catch (err) {
    console.warn('Audio synthesis error:', err);
    if (onEnd) onEnd();
  }
}

/**
 * Hiệu ứng âm thanh khi bấm nút
 */
export function playChime(freq = 440) {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  } catch {
    // Ignore silent errors
  }
}
