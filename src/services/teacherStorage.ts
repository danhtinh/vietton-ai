import { ToneId } from '../types/tones';
import { PitchDataPoint } from './audioPitchDetector';

export interface TeacherToneSample {
  toneId: ToneId;
  word: string;
  audioDataUrl: string; // Base64 data URL
  recordedAt: number;
  sourceType: 'microphone' | 'file';
  fileName?: string;
  pitchPoints: PitchDataPoint[];
  startHz: number;
  endHz: number;
  minHz: number;
  maxHz: number;
  averageHz: number;
  movementDescription?: string;
}

const DB_NAME = 'VietTone_TeacherDB';
const DB_VERSION = 1;
const STORE_NAME = 'teacher_samples';
const LOCAL_STORAGE_KEY_PREFIX = 'viettone_teacher_sample_';

/**
 * Mở IndexedDB để lưu trữ file âm thanh và đồ thị cao độ mẫu của giáo viên
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB không được hỗ trợ.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'toneId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Lưu mẫu ghi âm của giáo viên cho một thanh điệu
 */
export async function saveTeacherSample(sample: TeacherToneSample): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(sample);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Lỗi lưu IndexedDB, dùng localStorage thay thế:', err);
    try {
      localStorage.setItem(
        `${LOCAL_STORAGE_KEY_PREFIX}${sample.toneId}`,
        JSON.stringify(sample)
      );
    } catch (lsErr) {
      console.error('Lỗi lưu mẫu giáo viên vào localStorage:', lsErr);
    }
  }
}

/**
 * Lấy tất cả các mẫu giọng giáo viên đã lưu
 */
export async function getAllTeacherSamples(): Promise<Record<ToneId, TeacherToneSample>> {
  const result: Partial<Record<ToneId, TeacherToneSample>> = {};

  try {
    const db = await openDB();
    const samples = await new Promise<TeacherToneSample[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });

    for (const s of samples) {
      result[s.toneId] = s;
    }
    return result as Record<ToneId, TeacherToneSample>;
  } catch (err) {
    console.warn('Đang đọc từ localStorage thay vì IndexedDB:', err);
    const toneIds: ToneId[] = ['ngang', 'sac', 'huyen', 'hoi', 'nga', 'nang'];
    for (const id of toneIds) {
      const item = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${id}`);
      if (item) {
        try {
          result[id] = JSON.parse(item);
        } catch {
          // bỏ qua
        }
      }
    }
    return result as Record<ToneId, TeacherToneSample>;
  }
}

/**
 * Xóa giọng mẫu của giáo viên cho một thanh điệu (trở về mẫu mô phỏng)
 */
export async function deleteTeacherSample(toneId: ToneId): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(toneId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Lỗi xóa IndexedDB:', err);
  }

  try {
    localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}${toneId}`);
  } catch {
    // bỏ qua
  }
}
