import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ToneCard } from './components/ToneCard';
import { MicrophoneButton } from './components/MicrophoneButton';
import { ResultSection } from './components/ResultSection';
import { TonePitchGraph } from './components/TonePitchGraph';
import { ToneGuideModal } from './components/ToneGuideModal';
import { TeacherStudioModal } from './components/TeacherStudioModal';
import { BottomNav, MainTabType } from './components/BottomNav';
import { RoadmapTab } from './components/RoadmapTab';
import { ProgressTab } from './components/ProgressTab';
import { StreakHeader } from './components/StreakHeader';
import { CompanionBeLac } from './components/CompanionBeLac';
import { VIETNAMESE_TONES } from './data/tonesData';
import { SyllableBase, ToneId } from './types/tones';
import { PracticeAttempt } from './types/history';
import {
  speakVietnameseWord,
  playTonePitchGuide,
  playAudioDataUrl,
  playChime,
} from './utils/audioPlayer';
import {
  getOrLoadModel,
  listenAndPredict,
  PredictionResult,
} from './services/teachableMachine';
import { PitchRecorder, PitchAnalysisResult } from './services/audioPitchDetector';
import {
  TeacherToneSample,
  getAllTeacherSamples,
} from './services/teacherStorage';
import {
  calculatePitchSimilarity,
  SimilarityScoreResult,
} from './services/pitchSimilarity';
import {
  getPracticeHistory,
  savePracticeAttempt,
  clearPracticeHistory,
  calculateStreak,
  getAllBadges,
} from './services/historyStorage';
import {
  generateIntegratedFeedback,
  IntegratedFeedbackResult,
} from './services/integratedFeedback';
import { triggerConfetti } from './utils/confetti';
import { getInitialTheme, applyTheme, ThemeMode } from './utils/theme';
import { ModelSettingsModal } from './components/ModelSettingsModal';
import { Sparkles, Volume2, Info, ShieldCheck, GraduationCap, Link2 } from 'lucide-react';
import {
  getCurrentModelUrl,
  DEFAULT_TEACHABLE_MACHINE_URL,
} from './services/teachableMachine';

export default function App() {
  const [activeTab, setActiveTab] = useState<MainTabType>('practice');
  const [selectedToneId, setSelectedToneId] = useState<ToneId>('ngang');
  const [selectedSyllable, setSelectedSyllable] = useState<SyllableBase>('ma');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [playingToneId, setPlayingToneId] = useState<string | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isTeacherStudioOpen, setIsTeacherStudioOpen] = useState(false);

  // Dữ liệu mẫu giáo viên & Lịch sử luyện tập thực tế
  const [teacherSamples, setTeacherSamples] = useState<Record<ToneId, TeacherToneSample>>(
    {} as Record<ToneId, TeacherToneSample>
  );
  const [practiceHistory, setPracticeHistory] = useState<PracticeAttempt[]>([]);

  // Theme Sáng / Tối (Dark / Light mode)
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme());

  // Link mô hình Teachable Machine (Mặc định: nxdKU2Gh8 hoặc do người dùng dán link)
  const [isModelSettingsOpen, setIsModelSettingsOpen] = useState(false);
  const [currentModelUrl, setCurrentModelUrl] = useState(getCurrentModelUrl());

  // Tiến bộ lượt này so với lượt trước
  const [improved, setImproved] = useState(false);
  const [scoreDelta, setScoreDelta] = useState(0);

  // Teachable Machine AI State & Pitch Tracking State
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [isModelReady, setIsModelReady] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [remainingMs, setRemainingMs] = useState(1200);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [pitchResult, setPitchResult] = useState<PitchAnalysisResult | null>(null);
  const [similarityResult, setSimilarityResult] = useState<SimilarityScoreResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activeTone =
    VIETNAMESE_TONES.find((t) => t.id === selectedToneId) || VIETNAMESE_TONES[0];

  const currentWord = activeTone.examples[selectedSyllable].word;
  const currentMeaning = activeTone.examples[selectedSyllable].meaning;
  const activeTeacherSample = teacherSamples[selectedToneId];

  // Tải dữ liệu giọng giáo viên và lịch sử luyện tập khi mở ứng dụng
  useEffect(() => {
    getAllTeacherSamples()
      .then((samples) => {
        if (samples) setTeacherSamples(samples);
      })
      .catch(console.warn);

    const history = getPracticeHistory();
    setPracticeHistory(history);
  }, []);

  // Đồng bộ theme Dark/Light mode vào DOM html và body
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const handleToggleTheme = () => {
    const nextTheme: ThemeMode = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  // Nạp lại mô hình khi người dùng đổi link Teachable Machine
  const handleModelUrlChanged = async (newUrl: string) => {
    setCurrentModelUrl(newUrl);
    setIsLoadingModel(true);
    try {
      await getOrLoadModel(true); // ép nạp lại instance mới
      setIsModelReady(true);
    } catch (err) {
      console.warn('Lỗi khi nạp lại mô hình mới:', err);
    } finally {
      setIsLoadingModel(false);
    }
  };

  const isCustomModel = currentModelUrl !== DEFAULT_TEACHABLE_MACHINE_URL;

  // Preload Teachable Machine in background
  useEffect(() => {
    let isMounted = true;
    const preload = async () => {
      try {
        setIsLoadingModel(true);
        await getOrLoadModel();
        if (isMounted) {
          setIsModelReady(true);
          setIsLoadingModel(false);
        }
      } catch (err) {
        console.warn('Lỗi tải mô hình khi khởi động:', err);
        if (isMounted) {
          setIsLoadingModel(false);
        }
      }
    };

    preload();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle selecting a tone
  const handleSelectTone = (toneId: ToneId) => {
    setSelectedToneId(toneId);
    playChime(520);

    const toneObj = VIETNAMESE_TONES.find((t) => t.id === toneId);
    if (toneObj && soundEnabled) {
      handlePlayVoice(toneId);
    }
  };

  // Phát âm thanh mẫu (Ưu tiên giọng giáo viên nếu có, nếu chưa có thì dùng TTS để người học nghe)
  const handlePlayVoice = (toneId: ToneId) => {
    setPlayingToneId(toneId);
    const teacherSample = teacherSamples[toneId];

    if (teacherSample && teacherSample.audioDataUrl) {
      playAudioDataUrl(teacherSample.audioDataUrl, () => {
        setPlayingToneId(null);
      });
    } else {
      const toneObj = VIETNAMESE_TONES.find((t) => t.id === toneId);
      const wordToSpeak = toneObj?.examples[selectedSyllable].word || 'ma';
      speakVietnameseWord(wordToSpeak, () => {
        setPlayingToneId(null);
      });
    }
  };

  // Play audio for a specific tone button
  const handlePlayAudio = (toneId: ToneId, e: React.MouseEvent) => {
    e.stopPropagation();
    handlePlayVoice(toneId);
  };

  // Play audio pitch synthesizer curve
  const handlePlayPitchSynthesizer = () => {
    setPlayingToneId(activeTone.id);
    const teacherSample = teacherSamples[selectedToneId];

    if (teacherSample && teacherSample.audioDataUrl) {
      playAudioDataUrl(teacherSample.audioDataUrl, () => {
        setPlayingToneId(null);
      });
    } else {
      playTonePitchGuide(activeTone, () => {
        speakVietnameseWord(currentWord, () => {
          setPlayingToneId(null);
        });
      });
    }
  };

  // Xóa lịch sử có xác nhận
  const handleClearHistory = () => {
    clearPracticeHistory();
    setPracticeHistory([]);
    setImproved(false);
    setScoreDelta(0);
    playChime(350);
  };

  // User clicks the big microphone button
  const handlePressMic = async () => {
    if (isListening) return;

    setErrorMessage(null);
    setIsListening(true);
    setRemainingMs(1200);

    const pitchRecorder = new PitchRecorder();

    try {
      playChime(600);

      let recorderStarted = false;
      try {
        await pitchRecorder.start();
        recorderStarted = true;
      } catch (recErr) {
        console.warn('PitchRecorder start warning:', recErr);
      }

      const aiPredictionPromise = listenAndPredict(
        selectedToneId,
        selectedSyllable,
        (rem) => setRemainingMs(rem)
      );

      const aiResult = await aiPredictionPromise;
      setPrediction(aiResult);

      let computedPitchResult: PitchAnalysisResult | null = null;
      let computedSimResult: SimilarityScoreResult | null = null;

      if (recorderStarted) {
        computedPitchResult = await pitchRecorder.stopAndAnalyze();
        setPitchResult(computedPitchResult);

        // Chấm điểm tương đồng 0 - 100
        if (computedPitchResult.status === 'success' && computedPitchResult.points.length >= 5) {
          computedSimResult = calculatePitchSimilarity(
            computedPitchResult.points,
            activeTone,
            activeTeacherSample
          );
          setSimilarityResult(computedSimResult);
        } else {
          computedSimResult = {
            hasScore: false,
            noScoreReason:
              computedPitchResult.errorMessage ||
              'Chưa đo được cao độ giọng đọc (do tiếng phát âm quá ngắn hoặc quá nhỏ).',
            totalScore: 0,
            shapeScore: 0,
            directionScore: 0,
            timeAlignmentScore: 0,
            isTeacherModel: Boolean(activeTeacherSample),
            feedbackText: '',
            normalizedLearner: [],
            normalizedTarget: [],
          };
          setSimilarityResult(computedSimResult);
        }
      } else {
        computedPitchResult = {
          status: 'error',
          errorMessage: 'Chưa khởi động được bộ phân tích tần số micro.',
          points: [],
        };
        setPitchResult(computedPitchResult);
      }

      // Tạo lời nhận xét gộp theo 5 quy tắc
      const integratedFeedback = generateIntegratedFeedback(
        aiResult,
        computedPitchResult,
        computedSimResult,
        activeTone,
        currentWord
      );

      // LƯU LƯỢT LUYỆN VÀO BỘ NHỚ MÁY (DỮ LIỆU THỰC TẾ 100%)
      const { attempt, improved: hasImproved, scoreDelta: delta, newBadges } = savePracticeAttempt({
        targetToneId: selectedToneId,
        targetWord: currentWord,
        detectedToneId: aiResult.predictedToneId,
        isAiConfident: Boolean(integratedFeedback?.isAiConfident),
        confidenceScore: Math.round((aiResult.highestConfidence || 0) * 100),
        similarityScore: computedSimResult?.hasScore ? computedSimResult.totalScore : null,
        isTeacherModel: Boolean(activeTeacherSample),
        category: integratedFeedback?.category || 'uncertain',
      });

      // Cập nhật state
      setPracticeHistory((prev) => [attempt, ...prev]);
      setImproved(hasImproved);
      setScoreDelta(delta);

      // Nếu mở khóa huy hiệu mới: bắn pháo giấy & phát chuông nhẹ nếu bật âm
      if (newBadges.length > 0) {
        triggerConfetti();
        if (soundEnabled) {
          playChime(1046.5); // Đô cao trong trẻo
          setTimeout(() => playChime(1318.5), 180); // Mi
        }
      } else if (aiResult.isCorrect) {
        playChime(880);
      } else {
        playChime(440);
      }
    } catch (err: unknown) {
      console.error('Lỗi khi lắng nghe và nhận diện:', err);
      try {
        await pitchRecorder.stopAndAnalyze();
      } catch {
        // bỏ qua
      }

      const msg =
        err instanceof Error
          ? err.message
          : 'Không thể nhận diện âm thanh. Vui lòng thử lại.';
      setErrorMessage(msg);
      setPitchResult(null);
      setSimilarityResult(null);
    } finally {
      setIsListening(false);
    }
  };

  // Reset results
  const handleReset = () => {
    setPrediction(null);
    setPitchResult(null);
    setSimilarityResult(null);
    setErrorMessage(null);
    setImproved(false);
    setScoreDelta(0);
  };

  const teacherSampleCount = Object.keys(teacherSamples).length;
  const streakDays = calculateStreak(practiceHistory);
  const badges = getAllBadges(practiceHistory);
  const unlockedBadges = badges.filter((b) => b.unlocked);

  // Lời nhận xét hiện tại
  const integratedFeedback = prediction
    ? generateIntegratedFeedback(
        prediction,
        pitchResult,
        similarityResult,
        activeTone,
        currentWord
      )
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-amber-50/30 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20 transition-colors">
      {/* Top Bar Header */}
      <Header
        onOpenHelp={() => setIsGuideOpen(true)}
        onOpenTeacherStudio={() => setIsTeacherStudioOpen(true)}
        onOpenModelSettings={() => setIsModelSettingsOpen(true)}
        teacherSampleCount={teacherSampleCount}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        isCustomModel={isCustomModel}
      />

      {/* ĐẾM SỐ NGÀY LUYỆN LIÊN TIẾP PHÍA TRÊN MÀN HÌNH */}
      <StreakHeader
        streakDays={streakDays}
        unlockedBadgeCount={unlockedBadges.length}
        totalBadgeCount={badges.length}
        totalAttempts={practiceHistory.length}
        onOpenBadges={() => setActiveTab('progress')}
      />

      {/* NỘI DUNG CHÍNH THEO 3 TAB: Luyện đọc · Lộ trình · Tiến bộ */}
      {activeTab === 'practice' && (
        <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-4 flex flex-col">
          {/* Model Privacy & Teacher Sample Badge */}
          <section className="text-center mb-4 sm:mb-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-300 text-xs font-bold border border-emerald-200/80 dark:border-emerald-800 mb-2 shadow-2xs flex-wrap justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>
                {isCustomModel ? 'Mô hình tùy chỉnh' : 'Mô hình Teachable Machine của nhóm'} · Chấm điểm F0
              </span>
              <button
                type="button"
                onClick={() => setIsModelSettingsOpen(true)}
                className="font-extrabold text-orange-600 dark:text-orange-400 underline hover:text-orange-700 cursor-pointer inline-flex items-center gap-0.5 ml-1"
                title="Thay đổi link Teachable Machine"
              >
                <Link2 className="w-3 h-3" />
                <span>{isCustomModel ? 'Đổi link' : 'Tùy chỉnh link'}</span>
              </button>
              {teacherSampleCount > 0 ? (
                <span
                  className="font-extrabold text-emerald-950 dark:text-emerald-200 underline cursor-pointer"
                  onClick={() => setIsTeacherStudioOpen(true)}
                >
                  (Đã nạp {teacherSampleCount}/6 giọng giáo viên)
                </span>
              ) : (
                <span className="text-emerald-700 dark:text-emerald-400">(Đang dùng mẫu mô phỏng 5 bậc)</span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight text-balance">
              Luyện 6 Thanh Điệu Tiếng Việt
            </h2>

            {/* Quick Syllable Switcher */}
            <div className="mt-3 inline-flex items-center gap-2 p-1 bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 pl-2">Bộ âm:</span>
              {(['ma', 'ba', 'ca', 'la'] as SyllableBase[]).map((syl) => (
                <button
                  key={syl}
                  type="button"
                  onClick={() => setSelectedSyllable(syl)}
                  className={`px-3 py-1 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                    selectedSyllable === syl
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-amber-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {syl === 'ma' ? 'ma (chuẩn)' : syl}
                </button>
              ))}
            </div>
          </section>

          {/* NHÂN VẬT ĐỒNG HÀNH BÉ LẠC */}
          <CompanionBeLac
            currentTone={activeTone}
            currentWord={currentWord}
            isListening={isListening}
            feedback={integratedFeedback}
            improved={improved}
            scoreDelta={scoreDelta}
          />

          {/* 1. 6 NÚT CHỌN THANH */}
          <section aria-label="6 nút chọn thanh điệu" className="mb-6">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-600">
                  1. Chọn thanh điệu để luyện:
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsTeacherStudioOpen(true)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Ghi âm giọng cô</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsGuideOpen(true)}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>Bảng 6 thanh</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {VIETNAMESE_TONES.map((tone) => {
                const word = tone.examples[selectedSyllable].word;
                const meaning = tone.examples[selectedSyllable].meaning;
                const isSelected = selectedToneId === tone.id;
                const isPlaying = playingToneId === tone.id;
                const hasTeacher = Boolean(teacherSamples[tone.id]);

                return (
                  <ToneCard
                    key={tone.id}
                    tone={tone}
                    word={word}
                    meaning={meaning}
                    isSelected={isSelected}
                    hasTeacherSample={hasTeacher}
                    onSelect={() => handleSelectTone(tone.id)}
                    onPlayAudio={(e) => handlePlayAudio(tone.id, e)}
                    isPlayingAudio={isPlaying}
                  />
                );
              })}
            </div>
          </section>

          {/* Active Tone Spotlight: Pitch Contour Graph & Fast Hear Button */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-xs mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl font-black shadow-xs ${activeTone.theme.arrowBg}`}
                >
                  {activeTone.arrowSymbol}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                      {activeTone.name} &ndash;{' '}
                      <span className="text-orange-600 dark:text-orange-400">{currentWord}</span>
                    </h3>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {activeTone.diacriticName}
                    </span>
                    {activeTeacherSample && (
                      <span className="text-xs font-black px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span>Giọng giáo viên</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                    {activeTone.instruction}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start md:self-center">
                <button
                  type="button"
                  onClick={handlePlayPitchSynthesizer}
                  className="px-4 py-2.5 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-900 font-bold text-xs sm:text-sm flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  title="Nghe mẫu chuẩn (ưu tiên giọng giáo viên nếu có)"
                >
                  {activeTeacherSample ? (
                    <>
                      <GraduationCap className="w-4 h-4 text-emerald-700" />
                      <span>Nghe giọng cô</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 text-orange-700" />
                      <span>Nghe mẫu chuẩn</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Graphical Pitch Contour Display */}
            <div className="mt-4">
              <TonePitchGraph
                tone={activeTone}
                word={currentWord}
                teacherSample={activeTeacherSample}
              />
            </div>
          </section>

          {/* 2. NÚT MICRO LỚN */}
          <section aria-label="Nút micro luyện đọc">
            <MicrophoneButton
              currentTone={activeTone}
              currentWord={currentWord}
              isListening={isListening}
              isLoadingModel={isLoadingModel}
              onPressMic={handlePressMic}
              remainingMs={remainingMs}
            />
          </section>

          {/* 3. KHU VỰC HIỂN THỊ KẾT QUẢ VỚI LỜI NHẬN XÉT GỘP */}
          <ResultSection
            currentTone={activeTone}
            currentWord={currentWord}
            prediction={prediction}
            pitchResult={pitchResult}
            similarityResult={similarityResult}
            teacherSample={activeTeacherSample}
            errorMessage={errorMessage}
            isLoadingModel={isLoadingModel}
            isListening={isListening}
            onReset={handleReset}
            onPlaySampleAgain={() => handlePlayVoice(selectedToneId)}
            onRetry={handlePressMic}
          />
        </main>
      )}

      {/* TAB 2: LỘ TRÌNH */}
      {activeTab === 'roadmap' && (
        <RoadmapTab
          history={practiceHistory}
          teacherSamples={teacherSamples}
          onSelectToneToPractice={(tId) => {
            setSelectedToneId(tId);
            setActiveTab('practice');
          }}
          onPlaySample={handlePlayVoice}
        />
      )}

      {/* TAB 3: TIẾN BỘ */}
      {activeTab === 'progress' && (
        <ProgressTab
          history={practiceHistory}
          onClearHistory={handleClearHistory}
          onOpenBadgesModal={() => {}}
        />
      )}

      {/* THANH ĐIỀU HƯỚNG DƯỚI CÙNG 3 TAB */}
      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />

      {/* Modals */}
      <ToneGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onSelectTone={(id) => handleSelectTone(id as ToneId)}
      />

      <TeacherStudioModal
        isOpen={isTeacherStudioOpen}
        onClose={() => setIsTeacherStudioOpen(false)}
        teacherSamples={teacherSamples}
        onSamplesUpdated={(updated) => setTeacherSamples(updated)}
        selectedSyllable={selectedSyllable}
      />

      <ModelSettingsModal
        isOpen={isModelSettingsOpen}
        onClose={() => setIsModelSettingsOpen(false)}
        onModelUrlChanged={handleModelUrlChanged}
      />
    </div>
  );
}
