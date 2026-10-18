import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Trophy, Volume2, VolumeX, Play, Pause, RotateCcw, 
  SkipForward, Check, X, Eye, 
  Award, ShieldAlert, Sparkles, Download, Settings,
  Landmark, Globe, Atom, Moon, Feather, Palette, Cpu, BookOpen, Coins, Brain,
  Flame, Clock, PhoneCall, KeyRound, Zap, WifiOff, CheckCircle2,
  HelpCircle, ListChecks, PenLine, Layers, Lightbulb, ChevronLeft, RefreshCw,
  Share2, Copy, CheckCheck, ExternalLink, MessageCircle, Send, Mail,
  User, Users, Crown, Heart, HeartCrack, Shuffle, Dice5, Sun, Laptop, Trash2
} from 'lucide-react';
import { 
  CATEGORIES, QUESTIONS_BANK, QUESTION_MODES, 
  Question, QuestionType, MatchPair, FillQuestion, McqQuestion, TfQuestion, HintsQuestion, MatchQuestion, DirectQuestion
} from './data/questions';
import { sounds } from './utils/audio';
import { triggerConfetti } from './utils/confetti';
import { IntroStageBackground } from './components/IntroStageBackground';
import { 
  normalizeArabicText, 
  getQuestionFingerprint, 
  getQuestionNormalizedAnswer 
} from './utils/audit';

// فحص التحميل: التحقق من تفرد المعرفات والبصمات النصية مع تجاهل المكرر مع console.warn
export const VALIDATED_BANK: Question[] = (() => {
  const seenIds = new Set<string>();
  const seenFps = new Set<string>();
  const list: Question[] = [];

  for (const q of QUESTIONS_BANK) {
    if (seenIds.has(q.id)) {
      console.warn(`[تحدي الثلاثين - التحميل] تم تجاهل سؤال بمعرف مكرر: ${q.id}`);
      continue;
    }
    const fp = getQuestionFingerprint(q);
    if (fp && seenFps.has(fp)) {
      console.warn(`[تحدي الثلاثين - التحميل] تم تجاهل سؤال ببصمة نصية مكررة: ${q.id}`);
      continue;
    }
    seenIds.add(q.id);
    if (fp) seenFps.add(fp);
    list.push(q);
  }
  return list;
})();

// ============================================================================
// ضبط رابط المشاركة العام للعبة (SHARE_URL):
// - اتركه فارغاً "" للاعتماد التلقائي على عنوان الموقع الحالي للمتصفح.
// - أو ضع رابط النشر المخصص الخاص بك، مثال: "https://my-quiz-app.com"
// ============================================================================
export const SHARE_URL: string = "";

export type ColorMode = 'light' | 'dark' | 'auto';
export type AccentColor = 'gold' | 'royal-blue' | 'emerald';
export type Screen = 'SPLASH' | 'SETUP' | 'PLAY' | 'VICTORY';
export type DifficultyFilter = 'all' | 'easy' | 'medium' | 'hard';
export type GameMode = 'solo' | 'duo' | 'trio' | 'quad';

interface LifelinesState {
  letter: boolean;    // كشف الحرف الأول / حذف خيارين
  extraTime: boolean; // وقت إضافي +15 ثانية
  friend: boolean;    // استشارة صديق 20 ثانية
}

export interface Player {
  id: string;
  name: string;
  colorIndex: number;
  score: number;
  streak: number;
  bestStreak: number;
  lifelines: LifelinesState;
  bets: number;       // used bets count (max 2)
  skips: number;      // used skips count (max 2)
  correctCount: number;
  correctByType: Record<QuestionType, number>;
  correctByCategory?: Record<string, number>;
  totalByCategory?: Record<string, number>;
  lives: number;      // in solo mode: starts with 5
}

interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'gold' | 'streak' | 'wager' | 'info' | 'danger';
}

interface SoloRecord {
  questionsCount: number;
  timeSeconds: number;
  score: number;
  date: string;
}

// Player Theme Dynamic Style Resolver (No Hardcoded Hex Colors!)
function getPlayerTheme(colorIndex: number) {
  const idx = (colorIndex % 4) + 1;
  return {
    idx,
    varColor: `var(--player-${idx}-color)`,
    varLight: `var(--player-${idx}-light)`,
    varBg: `var(--player-${idx}-bg)`,
    varBorder: `var(--player-${idx}-border)`,
    styleCard: {
      borderColor: `var(--player-${idx}-border)`,
      backgroundColor: `var(--player-${idx}-bg)`,
    },
    styleText: {
      color: `var(--player-${idx}-color)`,
    },
    styleBadge: {
      backgroundColor: `var(--player-${idx}-color)`,
      color: 'var(--accent-contrast)',
    }
  };
}

const CATEGORY_ICON_MAP: Record<string, React.ReactNode> = {
  'تاريخ': <Landmark className="w-5 h-5 text-[var(--accent-primary)]" />,
  'جغرافيا': <Globe className="w-5 h-5 text-sky-400" />,
  'علوم': <Atom className="w-5 h-5 text-emerald-400" />,
  'ثقافة إسلامية': <Moon className="w-5 h-5 text-amber-400" />,
  'أدب وشعر عربي': <Feather className="w-5 h-5 text-fuchsia-400" />,
  'فنون وسينما': <Palette className="w-5 h-5 text-pink-400" />,
  'تقنية': <Cpu className="w-5 h-5 text-indigo-400" />,
  'لغة عربية': <BookOpen className="w-5 h-5 text-teal-400" />,
  'اقتصاد ومال': <Coins className="w-5 h-5 text-amber-500" />,
  'ألغاز ومنطق': <Brain className="w-5 h-5 text-violet-400" />,
  'الرياضة': (
    <svg className="w-5 h-5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1h10v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34" />
      <path d="M6 2h12v7a6 6 0 0 1-12 0V2Z" />
    </svg>
  ),
  'الرياضيات': (
    <svg className="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 14h2.5l2.5 6 3.5-14h4" />
      <path d="M14 7h7" />
      <path d="M16 7v8" />
      <path d="M19.5 7c0 4 .5 7 1.5 8" />
    </svg>
  ),
  'قواعد الإنجليزية': (
    <svg className="w-5 h-5 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 19L8.5 5l5.5 14" />
      <path d="M5.5 14h6" />
      <path d="M21 13.5v5.5" />
      <circle cx="18" cy="16" r="3" />
      <path d="M21 16c-.5-.8-1.5-1.2-2.5-1.2" />
    </svg>
  ),
};

const MODE_ICON_MAP: Record<QuestionType, React.ReactNode> = {
  direct: <HelpCircle className="w-5 h-5 text-[var(--accent-primary)]" />,
  mcq: <ListChecks className="w-5 h-5 text-sky-400" />,
  tf: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
  fill: <PenLine className="w-5 h-5 text-amber-400" />,
  match: <Layers className="w-5 h-5 text-fuchsia-400" />,
  hints: <Lightbulb className="w-5 h-5 text-yellow-300" />,
};

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getFirstLetterData(answer: string): { letter: string; length: number; masked: string } {
  const clean = answer.trim();
  const totalLetters = clean.replace(/[\s\-_،,.]/g, '').length;
  const firstLetter = clean.charAt(0);
  const blanksCount = Math.max(1, totalLetters - 1);
  const masked = `${firstLetter} ` + Array(blanksCount).fill('_').join(' ');
  return { letter: firstLetter, length: totalLetters, masked };
}

function getTextDir(text?: string): 'ltr' | 'rtl' | 'auto' {
  if (!text) return 'auto';
  const hasArabic = /[\u0600-\u06FF]/.test(text);
  const hasLatin = /[A-Za-z]/.test(text);
  if (hasLatin && !hasArabic) return 'ltr';
  return 'auto';
}

function renderMixedText(text?: string): React.ReactNode {
  if (!text) return '';
  const hasArabic = /[\u0600-\u06FF]/.test(text);
  const hasLatinOrMath = /[A-Za-z×÷−²³√π≤≥≠≈=]/.test(text);

  if (!hasLatinOrMath) {
    return text;
  }

  // Pure Latin / Math / English
  if (!hasArabic) {
    return (
      <bdi dir="ltr" lang="en" className="inline-block font-sans">
        {text}
      </bdi>
    );
  }

  // Mixed Arabic and Latin / Math / English
  const regex = /([A-Za-z0-9_+\-×÷−²³√π≤≥≠≈=^%$/.:,?!'"()]+(?:\s+[A-Za-z0-9_+\-×÷−²³√π≤≥≠≈=^%$/.:,?!'"()]+)*)/g;
  const parts = text.split(regex);

  return parts.map((part, idx) => {
    if (!part) return null;
    if (/[A-Za-z×÷−²³√π≤≥≠≈=]/.test(part)) {
      return (
        <bdi key={idx} dir="ltr" lang="en" className="inline-block font-sans font-medium mx-1">
          {part}
        </bdi>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

export default function App() {
  // Navigation & Modals
  const [currentScreen, setCurrentScreen] = useState<Screen>('SPLASH');
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [isQuitModalOpen, setIsQuitModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(sounds.getMuted());

  // ============================================================================
  // التعديل 1: فصل الوضع (mode) عن لون التمييز (accent) مع دعم التلقائي
  // ============================================================================
  const [colorMode, setColorMode] = useState<ColorMode>(() => {
    try {
      const savedMode = localStorage.getItem('tahadi_color_mode');
      if (savedMode && ['light', 'dark', 'auto'].includes(savedMode)) {
        return savedMode as ColorMode;
      }
      const legacy = localStorage.getItem('tahadi_theme');
      if (legacy === 'auto') return 'auto';
    } catch (e) {}
    return 'dark';
  });

  const [accentColor, setAccentColor] = useState<AccentColor>(() => {
    try {
      const savedAccent = localStorage.getItem('tahadi_accent_color');
      if (savedAccent && ['gold', 'royal-blue', 'emerald'].includes(savedAccent)) {
        return savedAccent as AccentColor;
      }
      const legacy = localStorage.getItem('tahadi_theme');
      if (legacy && ['gold', 'royal-blue', 'emerald'].includes(legacy)) {
        return legacy as AccentColor;
      }
    } catch (e) {}
    return 'gold';
  });

  const [isThemePopoverOpen, setIsThemePopoverOpen] = useState(false);
  const themePopoverRef = useRef<HTMLDivElement>(null);

  // Apply theme attributes dynamically to documentElement
  const applyThemeAttributes = useCallback((mode: ColorMode, accent: AccentColor) => {
    let resolvedMode: 'light' | 'dark' = 'dark';
    if (mode === 'auto') {
      resolvedMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      resolvedMode = mode;
    }

    document.documentElement.setAttribute('data-mode', resolvedMode);
    document.documentElement.setAttribute('data-accent', accent);

    const metaTheme = document.getElementById('metaThemeColor') || document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', resolvedMode === 'light' ? '#FBF7EC' : '#07070B');
    }

    try {
      localStorage.setItem('tahadi_color_mode', mode);
      localStorage.setItem('tahadi_accent_color', accent);
    } catch (e) {}
  }, []);

  useEffect(() => {
    applyThemeAttributes(colorMode, accentColor);

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (colorMode === 'auto') {
        applyThemeAttributes('auto', accentColor);
      }
    };
    mql.addEventListener('change', handleSystemChange);
    return () => mql.removeEventListener('change', handleSystemChange);
  }, [colorMode, accentColor, applyThemeAttributes]);

  // Quick Cycle theme with shortcut 't' / 'T' / 'ف'
  const cycleAccent = useCallback(() => {
    const list: AccentColor[] = ['gold', 'royal-blue', 'emerald'];
    const nextIdx = (list.indexOf(accentColor) + 1) % list.length;
    sounds.playClick();
    setAccentColor(list[nextIdx]);
  }, [accentColor]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 't' || e.key === 'T' || e.key === 'ف') {
        cycleAccent();
      }
      if (e.key === 'Escape') {
        setIsThemePopoverOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cycleAccent]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themePopoverRef.current && !themePopoverRef.current.contains(e.target as Node)) {
        setIsThemePopoverOpen(false);
      }
    };
    if (isThemePopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isThemePopoverOpen]);

  // ============================================================================
  // التعديل 2: سجل الأسئلة المستعرضة وتجنب التكرار عبر الألعاب (معرفات + بصمات نصية)
  // ============================================================================
  const [seenQuestionIds, setSeenQuestionIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('tahadi_seen_questions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [seenFingerprints, setSeenFingerprints] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('tahadi_seen_fingerprints');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  const [isDepletedModalOpen, setIsDepletedModalOpen] = useState<boolean>(false);

  const resetSeenQuestions = () => {
    sounds.playClick();
    setSeenQuestionIds([]);
    setSeenFingerprints([]);
    try {
      localStorage.removeItem('tahadi_seen_questions');
      localStorage.removeItem('tahadi_seen_fingerprints');
    } catch (e) {}
    addToast('تم التصفير', 'تم تصفير سجل الأسئلة بنجاح. ستظهر جميع الأسئلة مجدداً!', 'gold');
  };

  // ============================================================================
  // التعديل 3: ضبط SHARE_URL وميزات المشاركة المتقدمة
  // ============================================================================
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareCustomText, setShareCustomText] = useState('تحدّى أصدقاءك في لعبة المعلومات العامة والثقافة!');
  const [isCopied, setIsCopied] = useState(false);

  const getComputedShareUrl = useCallback(() => {
    if (SHARE_URL && SHARE_URL.trim() !== '') return SHARE_URL.trim();
    if (typeof window !== 'undefined' && window.location) {
      return window.location.origin + window.location.pathname;
    }
    return '';
  }, []);

  const handleShareGame = async (customMessage?: string) => {
    sounds.playClick();
    const textToShare = customMessage || 'تحدّى أصدقاءك في لعبة المعلومات العامة والثقافة بـ 30 نقطة!';
    setShareCustomText(textToShare);
    const url = getComputedShareUrl();

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'تحدي الثلاثين - النسخة الثقافية',
          text: textToShare,
          url: url
        });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }
    setIsShareModalOpen(true);
  };

  const handleCopyLink = async () => {
    sounds.playClick();
    const url = getComputedShareUrl();
    const fullShareText = `${shareCustomText}\n\nالرابط المباشر:\n${url}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(fullShareText);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = fullShareText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      addToast('تم النسخ', 'تم نسخ النتيجة والرابط إلى الحافظة بنجاح ✓', 'gold');
    } catch (err) {}
  };

  // Solo record state
  const [soloRecord, setSoloRecord] = useState<SoloRecord | null>(() => {
    try {
      const saved = localStorage.getItem('tahadi_solo_record');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });
  const [isNewSoloRecord, setIsNewSoloRecord] = useState(false);

  // Setup state: Multi-Player Mode Support
  const [gameMode, setGameMode] = useState<GameMode>(() => {
    try {
      const saved = localStorage.getItem('tahadi_gamemode');
      if (saved && ['solo', 'duo', 'trio', 'quad'].includes(saved)) {
        return saved as GameMode;
      }
    } catch (e) {}
    return 'duo';
  });

  const [playerNames, setPlayerNames] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('tahadi_playernames');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 4) return parsed;
      }
    } catch (e) {}
    return ['الفريق الذهبي', 'الفريق الملكي', 'لاعب 3', 'لاعب 4'];
  });

  const [roundCompletionEnabled, setRoundCompletionEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('tahadi_round_completion');
      if (saved !== null) return JSON.parse(saved);
    } catch (e) {}
    return true;
  });

  const [startingTurnMode, setStartingTurnMode] = useState<'random' | 'sequential'>('random');
  const [isDrawingStartingPlayer, setIsDrawingStartingPlayer] = useState(false);
  const [drawActiveIndex, setDrawActiveIndex] = useState<number>(0);

  const [selectedCategories, setSelectedCategories] = useState<string[]>(CATEGORIES.map(c => c.id));
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyFilter>('all');
  const [targetScore, setTargetScore] = useState<number>(30);
  const [enabledModes, setEnabledModes] = useState<QuestionType[]>([
    'direct', 'mcq', 'tf', 'fill', 'match', 'hints'
  ]);

  // Active Game State
  const initialLifelines: LifelinesState = { letter: false, extraTime: false, friend: false };
  const initialTypeBreakdown: Record<QuestionType, number> = {
    direct: 0, mcq: 0, tf: 0, fill: 0, match: 0, hints: 0
  };

  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);
  const [gameQuestions, setGameQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);
  const [isTieBreaker, setIsTieBreaker] = useState<boolean>(false);
  const [tiedPlayerIndices, setTiedPlayerIndices] = useState<number[]>([]);
  const [tieBreakerTurnIndex, setTieBreakerTurnIndex] = useState<number>(0);
  const [isFinalRound, setIsFinalRound] = useState<boolean>(false);
  const [isProcessingAnswer, setIsProcessingAnswer] = useState<boolean>(false);

  // Solo mode tracking
  const [soloQuestionsAnswered, setSoloQuestionsAnswered] = useState<number>(0);
  const [gameStartTime, setGameStartTime] = useState<number>(0);
  const [soloFinalTimeSeconds, setSoloFinalTimeSeconds] = useState<number>(0);

  // Lifelines & Wager status
  const [usedLifelineThisQuestion, setUsedLifelineThisQuestion] = useState<boolean>(false);
  const [revealedLetterHint, setRevealedLetterHint] = useState<string | null>(null);
  const [eliminatedChoices, setEliminatedChoices] = useState<number[]>([]);
  const [isFriendModalOpen, setIsFriendModalOpen] = useState<boolean>(false);
  const [friendTimeRemaining, setFriendTimeRemaining] = useState<number>(20);
  const [wagerModalOpen, setWagerModalOpen] = useState<boolean>(false);
  const [isCurrentQuestionWager, setIsCurrentQuestionWager] = useState<boolean>(false);

  // Mode-specific state
  const [selectedChoiceIdx, setSelectedChoiceIdx] = useState<number | null>(null);
  const [selectedTfChoice, setSelectedTfChoice] = useState<boolean | null>(null);
  const [matchLeftItems, setMatchLeftItems] = useState<{ id: number; text: string; origIdx: number }[]>([]);
  const [matchRightItems, setMatchRightItems] = useState<{ id: number; text: string; origIdx: number }[]>([]);
  const [selectedRightIdx, setSelectedRightIdx] = useState<number | null>(null);
  const [connections, setConnections] = useState<{ rightIdx: number; leftIdx: number; color: string }[]>([]);
  const [matchConfirmed, setMatchConfirmed] = useState<boolean>(false);
  const [revealedHintsCount, setRevealedHintsCount] = useState<number>(1);
  const hintsTimerRef = useRef<number | null>(null);

  // Timer State
  const [timeRemaining, setTimeRemaining] = useState<number>(30);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const timerIntervalRef = useRef<number | null>(null);
  const timerStartRef = useRef<number>(0);
  const timerRemainingAtStartRef = useRef<number>(30);
  const lastTickSecondRef = useRef<number>(30);

  // Interactive Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  // PWA Support
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  const addToast = useCallback((title: string, message: string, type: Toast['type'] = 'gold') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev.slice(-3), { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3800);
  }, []);

  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); addToast('متصل', 'تمت استعادة الاتصال بالشبكة', 'info'); };
    const handleOffline = () => { setIsOnline(false); addToast('أوفلاين', 'التطبيق يعمل بدون إنترنت بكامل كفاءته', 'info'); };
    const handleBeforeInstall = (e: Event) => { e.preventDefault(); setInstallPrompt(e); };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, [addToast]);

  const handleInstallApp = async () => {
    if (!installPrompt) return;
    sounds.playClick();
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstallPrompt(null);
  };

  const handleToggleMute = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  // Timer Controller
  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (hintsTimerRef.current) {
      window.clearInterval(hintsTimerRef.current);
      hintsTimerRef.current = null;
    }
    setIsTimerRunning(false);
  }, []);

  const handleTimeOut = useCallback(() => {
    stopTimer();
    sounds.playTimeout();
    setTimeRemaining(0);
    // Timeout is considered wrong answer
    awardPointsAndAdvance(false, 0);
  }, [stopTimer]);

  const startTimer = useCallback((duration: number) => {
    stopTimer();
    setTimeRemaining(duration);
    timerRemainingAtStartRef.current = duration;
    timerStartRef.current = Date.now();
    lastTickSecondRef.current = Math.ceil(duration);
    setIsTimerRunning(true);

    timerIntervalRef.current = window.setInterval(() => {
      const elapsedSeconds = (Date.now() - timerStartRef.current) / 1000;
      const remaining = Math.max(0, timerRemainingAtStartRef.current - elapsedSeconds);
      setTimeRemaining(remaining);

      const currentCeil = Math.ceil(remaining);
      if (currentCeil < lastTickSecondRef.current && currentCeil > 0) {
        lastTickSecondRef.current = currentCeil;
        if (currentCeil <= 5) {
          sounds.playTick(true);
        } else if (currentCeil <= 10) {
          sounds.playTick(false);
        }
      }

      if (remaining <= 0) {
        handleTimeOut();
      }
    }, 100);
  }, [stopTimer, handleTimeOut]);

  const pauseTimer = useCallback(() => {
    if (!isTimerRunning) return;
    stopTimer();
    timerRemainingAtStartRef.current = timeRemaining;
  }, [isTimerRunning, stopTimer, timeRemaining]);

  const resumeTimer = useCallback(() => {
    if (timeRemaining <= 0) return;
    startTimer(timeRemaining);
  }, [timeRemaining, startTimer]);

  const currentQuestion: Question | undefined = gameQuestions[currentQuestionIndex];

  const getPlayerCount = useCallback((mode: GameMode): number => {
    switch (mode) {
      case 'solo': return 1;
      case 'duo': return 2;
      case 'trio': return 3;
      case 'quad': return 4;
      default: return 2;
    }
  }, []);

  const handlePlayerNameChange = (idx: number, newName: string) => {
    const updated = [...playerNames];
    updated[idx] = newName.slice(0, 16);
    setPlayerNames(updated);
    try {
      localStorage.setItem('tahadi_playernames', JSON.stringify(updated));
    } catch (e) {}
  };

  // Reset per-question state & mark question seen
  useEffect(() => {
    if (!currentQuestion) return;

    // Track question as seen in history (ID + content fingerprint)
    const fp = getQuestionFingerprint(currentQuestion);
    setSeenQuestionIds(prev => {
      if (prev.includes(currentQuestion.id)) return prev;
      const next = [...prev, currentQuestion.id];
      try {
        localStorage.setItem('tahadi_seen_questions', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    if (fp) {
      setSeenFingerprints(prev => {
        if (prev.includes(fp)) return prev;
        const next = [...prev, fp];
        try {
          localStorage.setItem('tahadi_seen_fingerprints', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
    }

    setSelectedChoiceIdx(null);
    setSelectedTfChoice(null);
    setEliminatedChoices([]);
    setRevealedLetterHint(null);
    setUsedLifelineThisQuestion(false);
    setIsAnswerRevealed(false);
    setIsProcessingAnswer(false);
    setConnections([]);
    setSelectedRightIdx(null);
    setMatchConfirmed(false);
    setRevealedHintsCount(1);

    if (currentQuestion.type === 'match') {
      const q = currentQuestion as MatchQuestion;
      const rights = q.pairs.map((p, idx) => ({ id: idx, text: p.right, origIdx: idx }));
      const lefts = shuffleArray(q.pairs.map((p, idx) => ({ id: idx, text: p.left, origIdx: idx })));
      setMatchRightItems(rights);
      setMatchLeftItems(lefts);
      startTimer(45);
    } else if (currentQuestion.type === 'hints') {
      startTimer(30);
      hintsTimerRef.current = window.setInterval(() => {
        setRevealedHintsCount(prev => Math.min(5, prev + 1));
      }, 6000);
    } else {
      startTimer(30);
    }

    return () => {
      stopTimer();
    };
  }, [currentQuestionIndex, currentQuestion, startTimer, stopTimer]);

  // Mode & Categories Helpers
  const toggleMode = (mode: QuestionType) => {
    sounds.playClick();
    setEnabledModes(prev => {
      if (prev.includes(mode)) {
        if (prev.length <= 1) {
          addToast('تنبيه', 'يجب إبقاء نمط واحد على الأقل مفعّلاً', 'info');
          return prev;
        }
        return prev.filter(m => m !== mode);
      } else {
        return [...prev, mode];
      }
    });
  };

  const selectAllModes = () => {
    sounds.playClick();
    setEnabledModes(['direct', 'mcq', 'tf', 'fill', 'match', 'hints']);
  };

  const selectOnlyDirect = () => {
    sounds.playClick();
    setEnabledModes(['direct']);
  };

  const toggleCategory = (catId: string) => {
    sounds.playClick();
    setSelectedCategories(prev => {
      if (prev.includes(catId)) {
        if (prev.length <= 3) {
          addToast('تنبيه', 'يرجى اختيار 3 تصنيفات على الأقل', 'info');
          return prev;
        }
        return prev.filter(id => id !== catId);
      }
      return [...prev, catId];
    });
  };

  const selectAllCategories = () => {
    sounds.playClick();
    setSelectedCategories(CATEGORIES.map(c => c.id));
  };

  const selectRandomCategories = () => {
    sounds.playClick();
    const shuffled = shuffleArray(CATEGORIES.map(c => c.id));
    setSelectedCategories(shuffled.slice(0, 5));
  };

  // دالة بناء تسلسل الأسئلة بذكاء داخل اللعبة الواحدة:
  // 1) منع تكرار الإجابات المطبّعة
  // 2) منع توالي أكثر من سؤالين من نفس التصنيف أو نفس النمط عند توفر بدائل
  const buildSmartGameQuestions = useCallback((candidatePool: Question[], minNeeded: number): Question[] => {
    // 1. فرز الأسئلة لاستبعاد تكرار الإجابة المطبّعة داخل اللعبة
    const seenAnswers = new Set<string>();
    const uniqueAnsPool: Question[] = [];

    for (const q of shuffleArray(candidatePool)) {
      if (q.type !== 'tf' && q.type !== 'match') {
        const normAns = getQuestionNormalizedAnswer(q);
        if (normAns && seenAnswers.has(normAns)) {
          continue;
        }
        if (normAns) seenAnswers.add(normAns);
      }
      uniqueAnsPool.push(q);
    }

    // 2. ترتيب الأسئلة بحيث لا يتكرر تصنيف أو نمط أكثر من مرتين متتاليتين
    const sequence: Question[] = [];
    const pool = [...uniqueAnsPool];

    while (pool.length > 0 && sequence.length < minNeeded) {
      const len = sequence.length;
      const prev1 = len >= 1 ? sequence[len - 1] : null;
      const prev2 = len >= 2 ? sequence[len - 2] : null;

      // البحث عن سؤال لا يكرر التصنيف ولا النمط 3 مرات متتالية
      let idx = pool.findIndex(cand => {
        const catStreak = prev1 && prev2 && prev1.category === cand.category && prev2.category === cand.category;
        const typeStreak = prev1 && prev2 && prev1.type === cand.type && prev2.type === cand.type;
        return !catStreak && !typeStreak;
      });

      // إذا تعذر، تجنب تكرار التصنيف على الأقل
      if (idx === -1) {
        idx = pool.findIndex(cand => {
          const catStreak = prev1 && prev2 && prev1.category === cand.category && prev2.category === cand.category;
          return !catStreak;
        });
      }

      if (idx === -1) {
        idx = 0;
      }

      sequence.push(pool[idx]);
      pool.splice(idx, 1);
    }

    return sequence;
  }, []);

  // بدء دورة جديدة عند نفاد الأسئلة غير المعروضة
  const handleStartNewCycle = () => {
    setIsDepletedModalOpen(false);
    sounds.playClick();
    setSeenQuestionIds([]);
    setSeenFingerprints([]);
    try {
      localStorage.removeItem('tahadi_seen_questions');
      localStorage.removeItem('tahadi_seen_fingerprints');
    } catch (e) {}
    addToast('دورة جديدة 🔄', 'تم تصفير سجل الأسئلة بنجاح وبدء دورة جديدة!', 'gold');

    // تشغيل اللعبة فوراً باستخدام البنك الكامل
    setTimeout(() => {
      let filtered = VALIDATED_BANK.filter(q => {
        const catMatch = selectedCategories.includes(q.category);
        const diffMatch = selectedDifficulty === 'all' || q.difficulty === selectedDifficulty;
        const modeMatch = enabledModes.includes(q.type);
        return catMatch && diffMatch && modeMatch;
      });
      if (filtered.length === 0) {
        filtered = VALIDATED_BANK.filter(q => enabledModes.includes(q.type));
      }
      const count = getPlayerCount(gameMode);
      const minNeeded = count * 25 + 20;
      const newGameQuestions = buildSmartGameQuestions(filtered, minNeeded);
      setGameQuestions(newGameQuestions);
      setCurrentQuestionIndex(0);
      setCurrentPlayerIndex(0);
      setCurrentScreen('PLAY');
      setWagerModalOpen(true);
    }, 150);
  };

  // Start Game with Question Anti-Repetition Selection
  const initiateStartGame = () => {
    if (selectedCategories.length < 3 || enabledModes.length === 0) return;
    sounds.playClick();

    const count = getPlayerCount(gameMode);

    try {
      localStorage.setItem('tahadi_gamemode', gameMode);
      localStorage.setItem('tahadi_round_completion', JSON.stringify(roundCompletionEnabled));
    } catch (e) {}

    const preparedPlayers: Player[] = [];
    const usedNames = new Set<string>();

    for (let i = 0; i < count; i++) {
      let rawName = (playerNames[i] || '').trim();
      if (!rawName) {
        rawName = gameMode === 'solo' ? 'المغامر' : gameMode === 'duo' ? `فريق ${i + 1}` : `لاعب ${i + 1}`;
      }
      let finalName = rawName;
      let counter = 2;
      while (usedNames.has(finalName)) {
        finalName = `${rawName} ${counter}`;
        counter++;
      }
      usedNames.add(finalName);

      preparedPlayers.push({
        id: `p-${i}`,
        name: finalName,
        colorIndex: i,
        score: 0,
        streak: 0,
        bestStreak: 0,
        lifelines: { ...initialLifelines },
        bets: 0,
        skips: 0,
        correctCount: 0,
        correctByType: { ...initialTypeBreakdown },
        correctByCategory: {},
        totalByCategory: {},
        lives: 5
      });
    }

    setPlayers(preparedPlayers);
    setIsTieBreaker(false);
    setTiedPlayerIndices([]);
    setIsFinalRound(false);
    setSoloQuestionsAnswered(0);
    setGameStartTime(Date.now());
    setIsNewSoloRecord(false);

    // 1. تصفية الأسئلة حسب التصنيفات والصعوبة والأنماط من VALIDATED_BANK
    let filtered = VALIDATED_BANK.filter(q => {
      const catMatch = selectedCategories.includes(q.category);
      const diffMatch = selectedDifficulty === 'all' || q.difficulty === selectedDifficulty;
      const modeMatch = enabledModes.includes(q.type);
      return catMatch && diffMatch && modeMatch;
    });

    if (filtered.length === 0) {
      filtered = VALIDATED_BANK.filter(q => enabledModes.includes(q.type));
    }

    // 2. منع التكرار: استبعاد كل سؤال موجود بمعرفه ID أو ببصمته النصية
    const unseen = filtered.filter(q => {
      if (seenQuestionIds.includes(q.id)) return false;
      const fp = getQuestionFingerprint(q);
      if (fp && seenFingerprints.includes(fp)) return false;
      return true;
    });

    // 3. عند نفاد الأسئلة غير المعروضة: عدم تكرار القديم تلقائياً بل إظهار نافذة الدورة الجديدة
    if (unseen.length === 0) {
      setIsDepletedModalOpen(true);
      return;
    }

    const minNeeded = count * 25 + 20;

    // 4. بناء تسلسل أسئلة اللعبة بذكاء (منع تكرار الإجابات المطبّعة + تتابع الأنماط والتصنيفات)
    const finalGameQuestions = buildSmartGameQuestions(unseen, minNeeded);

    if (finalGameQuestions.length === 0) {
      setIsDepletedModalOpen(true);
      return;
    }

    setGameQuestions(finalGameQuestions);
    setCurrentQuestionIndex(0);

    // Starting player selection
    if (gameMode !== 'solo' && startingTurnMode === 'random') {
      setIsDrawingStartingPlayer(true);
      let step = 0;
      const totalSteps = 15 + Math.floor(Math.random() * count);
      const interval = window.setInterval(() => {
        sounds.playTick(false);
        setDrawActiveIndex(step % count);
        step++;
        if (step >= totalSteps) {
          window.clearInterval(interval);
          const chosen = (step - 1) % count;
          setCurrentPlayerIndex(chosen);
          setTimeout(() => {
            setIsDrawingStartingPlayer(false);
            setCurrentScreen('PLAY');
            setWagerModalOpen(true);
          }, 800);
        }
      }, 100);
    } else {
      setCurrentPlayerIndex(0);
      setCurrentScreen('PLAY');
      setWagerModalOpen(true);
    }
  };

  // Determine game over and winner
  const checkGameOver = (currentPlayers: Player[], nextQIndex: number): boolean => {
    if (gameMode === 'solo') {
      const p = currentPlayers[0];
      if (p.lives <= 0) return true;
      if (p.score >= targetScore) return true;
      if (nextQIndex >= gameQuestions.length) return true;
      return false;
    }

    if (isTieBreaker) {
      const nextTieTurn = (tieBreakerTurnIndex + 1) % tiedPlayerIndices.length;
      if (nextTieTurn === 0) {
        const tiedScores = tiedPlayerIndices.map(idx => currentPlayers[idx].score);
        const maxScore = Math.max(...tiedScores);
        const leaders = tiedPlayerIndices.filter(idx => currentPlayers[idx].score === maxScore);
        if (leaders.length === 1) return true;
        setTiedPlayerIndices(leaders);
      }
      return false;
    }

    const anyHitTarget = currentPlayers.some(p => p.score >= targetScore);
    const ranOut = nextQIndex >= gameQuestions.length;

    if (!roundCompletionEnabled) {
      if (anyHitTarget) return true;
      if (ranOut) return true;
      return false;
    }

    if (anyHitTarget && !isFinalRound) {
      setIsFinalRound(true);
    }

    const isRoundComplete = (currentPlayerIndex + 1) % currentPlayers.length === 0;

    if (isFinalRound && isRoundComplete) {
      const maxScore = Math.max(...currentPlayers.map(p => p.score));
      const leaders = currentPlayers
        .map((p, idx) => ({ p, idx }))
        .filter(item => item.p.score === maxScore && item.p.score >= targetScore);

      if (leaders.length === 1) {
        return true;
      } else if (leaders.length > 1) {
        setIsTieBreaker(true);
        setTiedPlayerIndices(leaders.map(l => l.idx));
        setTieBreakerTurnIndex(0);
        addToast('جولة فاصلة ⚡', `تعادل في الصدارة! جولة الموت المفاجئ بين ${leaders.length} لاعبين`, 'streak');

        // الجولة الفاصلة تسحب أيضاً حصرياً من غير المعروض
        const inGameIds = new Set(gameQuestions.map(q => q.id));
        const inGameAns = new Set(gameQuestions.map(q => getQuestionNormalizedAnswer(q)));
        const freshUnseen = VALIDATED_BANK.filter(q => {
          if (seenQuestionIds.includes(q.id) || inGameIds.has(q.id)) return false;
          const fp = getQuestionFingerprint(q);
          if (fp && seenFingerprints.includes(fp)) return false;
          const ans = getQuestionNormalizedAnswer(q);
          if (ans && inGameAns.has(ans)) return false;
          return true;
        });
        if (freshUnseen.length > 0) {
          const extra = buildSmartGameQuestions(freshUnseen, 20);
          setGameQuestions(prev => [...prev, ...extra]);
        }
        return false;
      }
    }

    if (ranOut) return true;
    return false;
  };

  // Advance game to next turn or end
  const advanceToNextQuestion = (updatedPlayers: Player[]) => {
    const nextQIndex = currentQuestionIndex + 1;
    const isOver = checkGameOver(updatedPlayers, nextQIndex);

    if (isOver) {
      stopTimer();
      setCurrentScreen('VICTORY');
      triggerConfetti();

      if (gameMode === 'solo') {
        const p = updatedPlayers[0];
        const elapsedSec = Math.round((Date.now() - gameStartTime) / 1000);
        setSoloFinalTimeSeconds(elapsedSec);

        if (p.score >= targetScore) {
          sounds.playFanfare();
          if (!soloRecord || elapsedSec < soloRecord.timeSeconds || (elapsedSec === soloRecord.timeSeconds && soloQuestionsAnswered < soloRecord.questionsCount)) {
            const newRec: SoloRecord = {
              questionsCount: soloQuestionsAnswered + 1,
              timeSeconds: elapsedSec,
              score: p.score,
              date: new Date().toLocaleDateString('ar-SA')
            };
            setSoloRecord(newRec);
            setIsNewSoloRecord(true);
            try {
              localStorage.setItem('tahadi_solo_record', JSON.stringify(newRec));
            } catch (e) {}
          }
        } else {
          sounds.playWrong();
        }
      } else {
        sounds.playFanfare();
      }
      return;
    }

    // Switch turn
    if (isTieBreaker) {
      const nextTieTurn = (tieBreakerTurnIndex + 1) % tiedPlayerIndices.length;
      setTieBreakerTurnIndex(nextTieTurn);
      setCurrentPlayerIndex(tiedPlayerIndices[nextTieTurn]);
    } else {
      setCurrentPlayerIndex((currentPlayerIndex + 1) % updatedPlayers.length);
    }

    setCurrentQuestionIndex(nextQIndex);
    setIsCurrentQuestionWager(false);
    setWagerModalOpen(true);
  };

  // Award Points & Advance
  const awardPointsAndAdvance = (isCorrect: boolean, basePoints: number = 1) => {
    if (isProcessingAnswer) return;
    setIsProcessingAnswer(true);
    stopTimer();

    const activePlayer = players[currentPlayerIndex];
    if (!activePlayer) return;

    let pointsDelta = 0;
    let newStreak = isCorrect ? activePlayer.streak + 1 : 0;
    let newLives = activePlayer.lives;

    if (isCorrect) {
      pointsDelta = isCurrentQuestionWager ? basePoints * 2 : basePoints;

      // Streak Bonus
      if (newStreak > 0 && newStreak % 3 === 0) {
        pointsDelta += 1;
        sounds.playStreakBonus();
        addToast('🔥 سلسلة ذهبية!', `حصل ${activePlayer.name} على نقطة إضافية لسلسلة ${newStreak} إجابات صحيحة!`, 'streak');
      } else {
        sounds.playCorrect();
      }
    } else {
      if (isCurrentQuestionWager) {
        pointsDelta = -2;
      }
      if (gameMode === 'solo') {
        newLives = Math.max(0, activePlayer.lives - 1);
        sounds.playHeartLost();
        addToast('فقدت روحاً 💔', `تبقى لديك ${newLives} أرواح`, 'danger');
      } else {
        sounds.playWrong();
      }
    }

    const updatedPlayers = players.map((p, idx) => {
      if (idx !== currentPlayerIndex) return p;
      const newScore = Math.max(0, p.score + pointsDelta);
      const newBest = Math.max(p.bestStreak, newStreak);
      const newCorrectCount = isCorrect ? p.correctCount + 1 : p.correctCount;
      const typeBreakdown = { ...p.correctByType };
      const catCorrect = { ...(p.correctByCategory || {}) };
      const catTotal = { ...(p.totalByCategory || {}) };

      if (currentQuestion) {
        catTotal[currentQuestion.category] = (catTotal[currentQuestion.category] || 0) + 1;
        if (isCorrect) {
          typeBreakdown[currentQuestion.type] = (typeBreakdown[currentQuestion.type] || 0) + 1;
          catCorrect[currentQuestion.category] = (catCorrect[currentQuestion.category] || 0) + 1;
        }
      }

      return {
        ...p,
        score: newScore,
        streak: newStreak,
        bestStreak: newBest,
        correctCount: newCorrectCount,
        correctByType: typeBreakdown,
        correctByCategory: catCorrect,
        totalByCategory: catTotal,
        lives: newLives
      };
    });

    setPlayers(updatedPlayers);
    if (gameMode === 'solo') {
      setSoloQuestionsAnswered(prev => prev + 1);
    }

    setIsAnswerRevealed(true);

    setTimeout(() => {
      advanceToNextQuestion(updatedPlayers);
    }, 1800);
  };

  // Handle MCQ Selection
  const handleSelectMcq = (choiceIdx: number) => {
    if (selectedChoiceIdx !== null || isProcessingAnswer || !currentQuestion) return;
    setSelectedChoiceIdx(choiceIdx);
    const q = currentQuestion as McqQuestion;
    const isCorrect = choiceIdx === q.correctIndex;
    awardPointsAndAdvance(isCorrect, 1);
  };

  // Handle True / False Selection
  const handleSelectTf = (userChoice: boolean) => {
    if (selectedTfChoice !== null || isProcessingAnswer || !currentQuestion) return;
    setSelectedTfChoice(userChoice);
    const q = currentQuestion as TfQuestion;
    const isCorrect = userChoice === q.answer;
    awardPointsAndAdvance(isCorrect, 1);
  };

  // Handle Match Selection
  const handleSelectMatchCard = (column: 'right' | 'left', idx: number) => {
    if (matchConfirmed || isProcessingAnswer) return;
    sounds.playClick();

    if (column === 'right') {
      setSelectedRightIdx(idx);
    } else if (column === 'left' && selectedRightIdx !== null) {
      const palette = ['#D4AF37', '#38BDF8', '#10B981', '#C084FC'];
      const chosenColor = palette[connections.length % palette.length];

      const filtered = connections.filter(c => c.rightIdx !== selectedRightIdx && c.leftIdx !== idx);
      const nextConnections = [...filtered, { rightIdx: selectedRightIdx, leftIdx: idx, color: chosenColor }];
      setConnections(nextConnections);
      setSelectedRightIdx(null);
    }
  };

  const handleConfirmMatch = () => {
    if (connections.length < 4 || isProcessingAnswer || !currentQuestion) return;
    setMatchConfirmed(true);
    const q = currentQuestion as MatchQuestion;

    let correctPairsCount = 0;
    connections.forEach(conn => {
      const rightOrig = matchRightItems[conn.rightIdx]?.origIdx;
      const leftOrig = matchLeftItems[conn.leftIdx]?.origIdx;
      if (rightOrig !== undefined && rightOrig === leftOrig) {
        correctPairsCount++;
      }
    });

    const isAllCorrect = correctPairsCount === 4;
    awardPointsAndAdvance(isAllCorrect, 2);
  };

  // Handle Hints Next Hint
  const handleRevealNextHint = () => {
    if (revealedHintsCount >= 5 || isAnswerRevealed) return;
    sounds.playClick();
    setRevealedHintsCount(prev => Math.min(5, prev + 1));
  };

  const getHintsCurrentPoints = () => {
    const pts = [5, 4, 3, 2, 1];
    return pts[Math.min(4, revealedHintsCount - 1)] || 1;
  };

  // Lifelines Actions
  const handleUseLetterClue = () => {
    if (usedLifelineThisQuestion || !currentQuestion) return;
    const activePlayer = players[currentPlayerIndex];
    if (!activePlayer || activePlayer.lifelines.letter) return;

    sounds.playLifeline();
    setUsedLifelineThisQuestion(true);

    setPlayers(prev => prev.map((p, i) => {
      if (i !== currentPlayerIndex) return p;
      return { ...p, lifelines: { ...p.lifelines, letter: true } };
    }));

    if (currentQuestion.type === 'mcq') {
      const q = currentQuestion as McqQuestion;
      const wrongIndices = [0, 1, 2, 3].filter(idx => idx !== q.correctIndex);
      const shuffledWrongs = shuffleArray(wrongIndices);
      setEliminatedChoices(shuffledWrongs.slice(0, 2));
      addToast('حذف إجابتين 💡', 'تم حذف خيارين خاطئين من الخيارات!', 'gold');
    } else if (currentQuestion.type === 'direct' || currentQuestion.type === 'fill') {
      const targetAns = currentQuestion.type === 'direct'
        ? (currentQuestion as DirectQuestion).answer
        : (currentQuestion as FillQuestion).answer;
      const clue = getFirstLetterData(targetAns);
      setRevealedLetterHint(`${clue.masked} (${clue.length} حروف)`);
      addToast('كشف الحرف الأول 💡', `الحرف الأول هو "${clue.letter}" (${clue.length} حروف)`, 'gold');
    } else {
      addToast('وسيلة المساعدة', 'تم تفعيل الوسيلة لهذا السؤال', 'gold');
    }
  };

  const handleUseExtraTime = () => {
    if (usedLifelineThisQuestion || !isTimerRunning) return;
    const activePlayer = players[currentPlayerIndex];
    if (!activePlayer || activePlayer.lifelines.extraTime) return;

    sounds.playLifeline();
    setUsedLifelineThisQuestion(true);

    setPlayers(prev => prev.map((p, i) => {
      if (i !== currentPlayerIndex) return p;
      return { ...p, lifelines: { ...p.lifelines, extraTime: true } };
    }));

    const newTime = Math.min(45, timeRemaining + 15);
    setTimeRemaining(newTime);
    timerRemainingAtStartRef.current = newTime;
    timerStartRef.current = Date.now();
    addToast('وقت إضافي ⏱️', 'تمت إضافة 15 ثانية إلى المؤقت!', 'gold');
  };

  const handleUseFriend = () => {
    if (usedLifelineThisQuestion) return;
    const activePlayer = players[currentPlayerIndex];
    if (!activePlayer || activePlayer.lifelines.friend) return;

    sounds.playLifeline();
    setUsedLifelineThisQuestion(true);

    setPlayers(prev => prev.map((p, i) => {
      if (i !== currentPlayerIndex) return p;
      return { ...p, lifelines: { ...p.lifelines, friend: true } };
    }));

    pauseTimer();
    setFriendTimeRemaining(20);
    setIsFriendModalOpen(true);
  };

  // Friend Timer interval
  useEffect(() => {
    if (!isFriendModalOpen) return;
    const interval = window.setInterval(() => {
      setFriendTimeRemaining(prev => {
        if (prev <= 1) {
          window.clearInterval(interval);
          sounds.playTimeout();
          setIsFriendModalOpen(false);
          resumeTimer();
          return 0;
        }
        sounds.playTick(false);
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isFriendModalOpen, resumeTimer]);

  // Handle Skip
  const handleSkipQuestion = () => {
    const activePlayer = players[currentPlayerIndex];
    if (!activePlayer || activePlayer.skips >= 2 || isProcessingAnswer) return;

    sounds.playClick();
    stopTimer();

    const updated = players.map((p, i) => {
      if (i !== currentPlayerIndex) return p;
      return { ...p, skips: p.skips + 1 };
    });
    setPlayers(updated);

    addToast('تخطي السؤال ⏭️', `استخدم ${activePlayer.name} فرصة التخطي (${activePlayer.skips + 1}/2)`, 'info');
    advanceToNextQuestion(updated);
  };

  const activePlayer = players[currentPlayerIndex] || {
    name: 'لاعب 1', score: 0, streak: 0, colorIndex: 0, lifelines: initialLifelines, bets: 0, skips: 0, lives: 5
  };
  const activeTheme = getPlayerTheme(activePlayer.colorIndex);

  // Render Luxury Theme Switcher Dropdown (Separated Mode & Accent)
  const renderThemeButton = () => (
    <div className="relative" ref={themePopoverRef}>
      <button
        onClick={() => setIsThemePopoverOpen(!isThemePopoverOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-panel text-xs font-semibold hover:border-[var(--accent-primary)] transition-all cursor-pointer"
        title="تخصيص المظهر والألوان (اختصار T)"
        aria-label="تخصيص المظهر"
      >
        <Palette className="w-4 h-4 text-[var(--accent-primary)]" />
        <span className="hidden sm:inline">المظهر</span>
      </button>

      {isThemePopoverOpen && (
        <div className="absolute left-0 mt-2 w-64 glass-panel p-4 rounded-2xl shadow-2xl border border-[var(--border-accent)] z-50 animate-in fade-in zoom-in-95">
          <div className="text-xs font-bold text-[var(--accent-light)] mb-3 pb-2 border-b border-[var(--border-subtle)] flex items-center justify-between">
            <span>تخصيص المظهر والألوان</span>
            <span className="text-[10px] text-[var(--text-muted)] font-normal">زر (T)</span>
          </div>

          {/* 1) Color Mode Selection (Light / Dark / Auto) */}
          <div className="mb-4">
            <span className="text-[11px] font-bold text-[var(--text-muted)] block mb-2">
              وضع العرض (Mode):
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'dark', label: 'داكن', icon: <Moon className="w-3.5 h-3.5" /> },
                { id: 'light', label: 'فاتح', icon: <Sun className="w-3.5 h-3.5" /> },
                { id: 'auto', label: 'تلقائي', icon: <Laptop className="w-3.5 h-3.5" /> },
              ].map(item => {
                const isSelected = colorMode === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      sounds.playClick();
                      setColorMode(item.id as ColorMode);
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] shadow-md'
                        : 'bg-[var(--bg-button-neutral)] hover:bg-[var(--bg-button-neutral-hover)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2) Accent Color Selection (Gold / Royal Blue / Emerald) */}
          <div>
            <span className="text-[11px] font-bold text-[var(--text-muted)] block mb-2">
              لون التمييز (Accent):
            </span>
            <div className="space-y-1.5">
              {[
                { id: 'gold', name: 'الذهبي الفاخر (Gold)', color: 'from-[#F5D77A] to-[#B8902B]' },
                { id: 'royal-blue', name: 'الأزرق الملكي (Royal)', color: 'from-[#6C8CFF] to-[#1D4ED8]' },
                { id: 'emerald', name: 'الزمردي النقي (Emerald)', color: 'from-[#6EE7B7] to-[#047857]' },
              ].map(acc => {
                const isSelected = accentColor === acc.id;
                return (
                  <button
                    key={acc.id}
                    onClick={() => {
                      sounds.playClick();
                      setAccentColor(acc.id as AccentColor);
                    }}
                    className={`w-full p-2 rounded-xl flex items-center justify-between text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--bg-button-neutral-hover)] border border-[var(--border-accent)] text-[var(--accent-light)] font-bold'
                        : 'hover:bg-[var(--bg-button-neutral)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-tr ${acc.color} border border-white/20`} />
                      <span>{acc.name}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[var(--accent-primary)]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative min-h-screen text-[var(--text-main)] font-sans flex flex-col justify-between overflow-x-hidden transition-colors duration-300">
      {/* Background Geometric Pattern */}
      <div className="bg-pattern" />

      {/* Floating Interactive Toast Notifications */}
      <div className="fixed top-4 left-4 right-4 z-50 pointer-events-none flex flex-col items-center gap-2">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`pointer-events-auto px-5 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl flex items-center gap-3 transition-all transform animate-in fade-in slide-in-from-top-4 duration-300 ${
              toast.type === 'streak' 
                ? 'bg-gradient-to-r from-amber-500/90 to-yellow-600/90 border-amber-300 text-slate-950 font-bold accent-glow' 
                : toast.type === 'wager'
                ? 'bg-gradient-to-r from-purple-900/90 to-indigo-900/90 border-purple-400 text-white'
                : toast.type === 'danger'
                ? 'bg-rose-950/90 border-rose-500 text-rose-200'
                : 'glass-card border-[var(--border-accent)] text-[var(--accent-light)] accent-glow'
            }`}
          >
            {toast.type === 'streak' && <Flame className="w-5 h-5 fill-slate-950 animate-bounce" />}
            {toast.type === 'gold' && <Sparkles className="w-5 h-5 text-[var(--accent-primary)]" />}
            {toast.type === 'wager' && <Zap className="w-5 h-5 text-yellow-300" />}
            {toast.type === 'danger' && <HeartCrack className="w-5 h-5 text-rose-400" />}
            <div>
              <div className="text-xs font-bold">{toast.title}</div>
              <div className="text-xs opacity-90">{toast.message}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ========================================================= */}
      {/* 1. SCREEN: SPLASH */}
      {/* ========================================================= */}
      {currentScreen === 'SPLASH' && (
        <>
          <IntroStageBackground colorMode={colorMode} accentColor={accentColor} />
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center max-w-4xl mx-auto w-full">
          <div className="w-full flex items-center justify-between pb-6">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
              <span className="text-xs text-[var(--text-muted)] font-medium">النسخة الثقافية المطوّرة (أنماط 1 إلى 4 لاعبين)</span>
            </div>
            <div className="flex items-center gap-2.5">
              {renderThemeButton()}
              <button
                onClick={() => handleShareGame()}
                className="p-2 rounded-xl glass-panel text-[var(--text-secondary)] hover:text-[var(--accent-light)] hover:border-[var(--border-accent)] transition-all cursor-pointer flex items-center gap-1.5"
                title="شارك اللعبة"
              >
                <Share2 className="w-4 h-4 text-[var(--accent-primary)]" />
                <span className="text-xs font-bold hidden sm:inline">شارك اللعبة</span>
              </button>
              {installPrompt && (
                <button
                  onClick={handleInstallApp}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--player-1-bg)] border border-[var(--border-accent)] text-[var(--accent-light)] text-xs font-bold transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تثبيت PWA</span>
                </button>
              )}
              <button
                onClick={handleToggleMute}
                className="p-2 rounded-xl glass-panel text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
                title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card text-xs font-semibold text-[var(--accent-light)] mb-6 accent-glow">
            <Sparkles className="w-3.5 h-3.5" />
            <span>فردي بأرواح · فريقان · 3 لاعبين · 4 لاعبين · 6 أنماط أسئلة</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold font-display tracking-tight accent-gradient-text mb-4">
            تحدي الثلاثين
          </h1>
          <p className="text-base md:text-xl text-[var(--text-secondary)] max-w-2xl mb-8 leading-relaxed font-sans">
            لعبة المسابقات الفكرية والثقافية الكبرى: خيارات، صح وخطأ، أكمل الناقص، مطابقة، وتلميحات تدريجية.
          </p>

          {/* Quick Metrics & Solo Record */}
          <div className="grid grid-cols-3 gap-3 md:gap-6 w-full max-w-lg mb-6">
            <div className="glass-card p-4 rounded-2xl flex flex-col items-center">
              <span className="text-3xl font-bold font-display text-[var(--accent-light)]">30</span>
              <span className="text-xs text-[var(--text-muted)] mt-1 font-medium">نقطة للانتصار</span>
            </div>
            <div className="glass-card p-4 rounded-2xl flex flex-col items-center">
              <span className="text-3xl font-bold font-display text-[var(--accent-light)]">1 - 4</span>
              <span className="text-xs text-[var(--text-muted)] mt-1 font-medium">لاعبين وفرق</span>
            </div>
            <div className="glass-card p-4 rounded-2xl flex flex-col items-center">
              <span className="text-3xl font-bold font-display text-[var(--accent-light)]">6</span>
              <span className="text-xs text-[var(--text-muted)] mt-1 font-medium">أنماط تفاعلية</span>
            </div>
          </div>

          {/* Solo Best Record Display if exists */}
          {soloRecord && (
            <div className="mb-8 p-3 px-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-500 dark:text-amber-300 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[var(--accent-primary)]" />
              <span>
                الرقم القياسي الفردي: <strong>30 نقطة</strong> في <strong>{soloRecord.questionsCount} سؤالاً</strong> ({soloRecord.timeSeconds} ثانية)
              </span>
            </div>
          )}

          {/* Main Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <button
              onClick={() => {
                sounds.playClick();
                setCurrentScreen('SETUP');
              }}
              className="flex-1 flex items-center justify-center gap-3 py-4 px-8 rounded-2xl font-bold btn-accent cursor-pointer font-display text-lg"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>دخول التحدي</span>
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setIsRulesModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-semibold text-[var(--text-secondary)] glass-panel hover:border-[var(--border-accent)] transition-all cursor-pointer text-sm"
            >
              <Award className="w-4 h-4 text-[var(--accent-primary)]" />
              <span>قواعد وأنماط اللعب</span>
            </button>
          </div>
        </div>
        </>
      )}

      {/* ========================================================= */}
      {/* 2. SCREEN: SETUP */}
      {/* ========================================================= */}
      {currentScreen === 'SETUP' && (
        <div className="relative z-10 flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full p-4 md:p-6">
          <div className="glass-card p-6 md:p-8 rounded-3xl accent-glow">
            {/* Header */}
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-3">
                <Settings className="w-6 h-6 text-[var(--accent-primary)]" />
                <h2 className="text-2xl font-bold font-display accent-gradient-text">
                  إعدادات التحدي
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {renderThemeButton()}
                <button
                  onClick={() => handleShareGame()}
                  className="p-2 rounded-xl glass-panel text-[var(--text-secondary)] hover:text-[var(--accent-light)] transition-all cursor-pointer flex items-center gap-1.5"
                  title="شارك اللعبة"
                >
                  <Share2 className="w-4 h-4 text-[var(--accent-primary)]" />
                  <span className="text-xs font-semibold hidden md:inline">شارك</span>
                </button>
                <button
                  onClick={() => {
                    sounds.playClick();
                    setCurrentScreen('SPLASH');
                  }}
                  className="px-3 py-1.5 rounded-xl glass-panel text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
                >
                  العودة للرئيسية
                </button>
              </div>
            </div>

            {/* 1) PLAYER COUNT SELECTION: 4 Luxury Glass Cards */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-[var(--accent-light)] mb-2.5">
                نمط وعدد اللاعبين:
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { id: 'solo', name: 'فردي', desc: 'تحدي الأرواح الـ 5 والرقم القياسي', icon: <User className="w-5 h-5" /> },
                  { id: 'duo', name: 'فريقان', desc: 'المواجهة الكلاسيكية 1 ضد 1', icon: <Users className="w-5 h-5" /> },
                  { id: 'trio', name: '3 لاعبين', desc: 'منافسة ثلاثية بالتناوب', icon: <Users className="w-5 h-5" /> },
                  { id: 'quad', name: '4 لاعبين', desc: 'معركة رباعية كبرى', icon: <Users className="w-5 h-5" /> },
                ].map(mode => {
                  const isSelected = gameMode === mode.id;
                  return (
                    <div
                      key={mode.id}
                      onClick={() => {
                        sounds.playClick();
                        setGameMode(mode.id as GameMode);
                      }}
                      className={`p-3.5 rounded-2xl border flex flex-col items-center text-center gap-2 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-[var(--accent-primary)] bg-[var(--player-1-bg)] accent-glow' 
                          : 'glass-panel opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className={`p-2 rounded-xl ${isSelected ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)]' : 'bg-black/20 dark:bg-black/40 text-[var(--text-muted)]'}`}>
                        {mode.icon}
                      </div>
                      <div>
                        <span className={`text-sm font-bold block ${isSelected ? 'text-[var(--accent-light)]' : 'text-[var(--text-main)]'}`}>
                          {mode.name}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)] line-clamp-1 mt-0.5">
                          {mode.desc}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2) DYNAMIC PLAYER NAMES INPUTS */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-[var(--accent-light)] mb-2.5">
                {gameMode === 'solo' ? 'اسم المغامر:' : 'أسماء الفرق واللاعبين:'}
              </label>
              <div className={`grid gap-3 ${
                gameMode === 'solo' ? 'grid-cols-1 max-w-sm' :
                gameMode === 'duo' ? 'grid-cols-1 sm:grid-cols-2' :
                gameMode === 'trio' ? 'grid-cols-1 sm:grid-cols-3' :
                'grid-cols-1 sm:grid-cols-2 md:grid-cols-4'
              }`}>
                {Array.from({ length: getPlayerCount(gameMode) }).map((_, idx) => {
                  const theme = getPlayerTheme(idx);
                  return (
                    <div key={idx} className="relative">
                      <div className="flex items-center gap-2 p-2.5 rounded-2xl glass-panel border" style={{ borderColor: theme.varBorder }}>
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-display" style={theme.styleBadge}>
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={playerNames[idx] || ''}
                          onChange={(e) => handlePlayerNameChange(idx, e.target.value)}
                          placeholder={`اسم لاعب ${idx + 1}`}
                          className="bg-transparent border-none outline-none text-xs md:text-sm font-semibold flex-1 text-[var(--text-main)] placeholder-[var(--text-muted)]"
                          maxLength={16}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3) MULTIPLAYER RULES & STARTING TURN (Multiplayer only) */}
            {gameMode !== 'solo' && (
              <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Starting player mode */}
                <div className="p-3.5 rounded-2xl glass-panel flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shuffle className="w-4 h-4 text-[var(--accent-primary)]" />
                    <div>
                      <span className="text-xs font-bold text-[var(--text-main)] block">من يبدأ الدور أولاً؟</span>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {startingTurnMode === 'random' ? 'قرعة عشوائية مشوقة' : 'الترتيب المتتابع (اللاعب 1)'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setStartingTurnMode(prev => prev === 'random' ? 'sequential' : 'random');
                    }}
                    className="px-3 py-1 rounded-xl text-xs font-bold border border-[var(--border-accent)] bg-[var(--bg-button-neutral)] hover:bg-[var(--bg-button-neutral-hover)] cursor-pointer text-[var(--accent-light)]"
                  >
                    {startingTurnMode === 'random' ? '🎲 قرعة' : '🔢 تتابع'}
                  </button>
                </div>

                {/* Round completion rule */}
                <div className="p-3.5 rounded-2xl glass-panel flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[var(--text-main)] block">تكافؤ الفرص (إكمال الجولة)</span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {roundCompletionEnabled ? 'إتاحة فرصة الرد لبقية اللاعبين' : 'فوز فوري عند وصول 30'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setRoundCompletionEnabled(prev => !prev);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold border cursor-pointer transition-all ${
                      roundCompletionEnabled 
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400' 
                        : 'border-[var(--border-subtle)] text-[var(--text-muted)]'
                    }`}
                  >
                    {roundCompletionEnabled ? 'مفعّل ✓' : 'معطّل'}
                  </button>
                </div>
              </div>
            )}

            {/* 4) QUESTION BANK STATUS & ANTI-REPETITION (التعديل 2) */}
            <div className="mb-6 p-4 rounded-2xl glass-panel border border-[var(--border-accent)] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[var(--player-1-bg)] text-[var(--accent-primary)]">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--text-main)]">سجل الأسئلة وتجنب التكرار:</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--player-1-bg)] text-[var(--accent-light)] border border-[var(--border-accent)]">
                      {VALIDATED_BANK.length} سؤالاً موثقاً
                    </span>
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    تم استعراض <strong>{seenQuestionIds.length}</strong> من إجمالي <strong>{VALIDATED_BANK.length}</strong> سؤالاً على هذا المتصفح ({Math.round((seenQuestionIds.length / VALIDATED_BANK.length) * 100)}%).
                    {seenQuestionIds.length > 0 && ' يتم استبعاد المعروض وضمان عدم تكرار الأسئلة أو الإجابات.'}
                  </div>
                </div>
              </div>

              <button
                onClick={resetSeenQuestions}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-rose-500/40 bg-rose-500/10 text-rose-500 dark:text-rose-300 hover:bg-rose-500/20 cursor-pointer transition-all flex-shrink-0"
                title="تصفير سجل الأسئلة لبدء دورة جديدة من الصفر"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>تصفير سجل الأسئلة</span>
              </button>
            </div>

            {/* 5) QUESTION MODES TOGGLES */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-bold text-[var(--accent-light)] flex items-center gap-1.5">
                  <span>أنماط الأسئلة المفعّلة:</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-normal">({enabledModes.length}/6)</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={selectAllModes}
                    className="text-[11px] font-semibold text-[var(--accent-primary)] hover:underline cursor-pointer"
                  >
                    تفعيل الكل
                  </button>
                  <span className="text-[var(--text-muted)]">·</span>
                  <button
                    onClick={selectOnlyDirect}
                    className="text-[11px] font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                  >
                    مباشر فقط
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                {QUESTION_MODES.map(mode => {
                  const isEnabled = enabledModes.includes(mode.id);
                  return (
                    <div
                      key={mode.id}
                      onClick={() => toggleMode(mode.id)}
                      className={`p-3 rounded-2xl border flex flex-col items-center text-center gap-1.5 cursor-pointer transition-all ${
                        isEnabled
                          ? 'border-[var(--accent-primary)] bg-[var(--player-1-bg)]'
                          : 'glass-panel opacity-40 hover:opacity-75'
                      }`}
                    >
                      <div className="p-1.5 rounded-lg bg-black/20 dark:bg-black/40">
                        {MODE_ICON_MAP[mode.id]}
                      </div>
                      <span className={`text-xs font-bold ${isEnabled ? 'text-[var(--accent-light)]' : 'text-[var(--text-muted)]'}`}>
                        {mode.shortName}
                      </span>
                      <span className="text-[9px] text-[var(--text-muted)] line-clamp-1">
                        {mode.badge}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 6) CATEGORIES SELECTION */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-bold text-[var(--accent-light)] flex items-center gap-1.5">
                  <span>التصنيفات الثقافية:</span>
                  <span className="text-[10px] text-[var(--text-muted)] font-normal">({selectedCategories.length}/{CATEGORIES.length})</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={selectAllCategories}
                    className="text-[11px] font-semibold text-[var(--accent-primary)] hover:underline cursor-pointer"
                  >
                    اختيار الكل
                  </button>
                  <span className="text-[var(--text-muted)]">·</span>
                  <button
                    onClick={selectRandomCategories}
                    className="text-[11px] font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                  >
                    5 عشوائية
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {CATEGORIES.map(cat => {
                  const isSelected = selectedCategories.includes(cat.id);
                  return (
                    <div
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-[var(--accent-primary)] bg-[var(--player-1-bg)]' 
                          : 'glass-panel opacity-40 hover:opacity-75'
                      }`}
                    >
                      <div className="p-1 rounded bg-black/20 dark:bg-black/40">
                        {CATEGORY_ICON_MAP[cat.id]}
                      </div>
                      <span className={`text-xs font-semibold truncate ${isSelected ? 'text-[var(--text-main)]' : 'text-[var(--text-muted)]'}`}>
                        {cat.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 7) DIFFICULTY & TARGET SCORE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div>
                <label className="block text-xs font-bold text-[var(--accent-light)] mb-2">
                  مستوى الصعوبة:
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'all', label: 'الكل' },
                    { id: 'easy', label: 'سهل' },
                    { id: 'medium', label: 'متوسط' },
                    { id: 'hard', label: 'صعب' },
                  ].map(d => (
                    <button
                      key={d.id}
                      onClick={() => {
                        sounds.playClick();
                        setSelectedDifficulty(d.id as DifficultyFilter);
                      }}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        selectedDifficulty === d.id
                          ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-[var(--accent-contrast)] shadow-md'
                          : 'glass-panel text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--accent-light)] mb-2">
                  هدف نقاط الانتصار:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[20, 30, 40].map(pts => (
                    <button
                      key={pts}
                      onClick={() => {
                        sounds.playClick();
                        setTargetScore(pts);
                      }}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        targetScore === pts
                          ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-[var(--accent-contrast)] shadow-md'
                          : 'glass-panel text-[var(--text-muted)] hover:text-[var(--text-main)]'
                      }`}
                    >
                      {pts} نقطة
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* START BUTTON */}
            <button
              disabled={isDrawingStartingPlayer}
              onClick={initiateStartGame}
              className="w-full py-4 rounded-2xl font-bold btn-accent cursor-pointer font-display text-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isDrawingStartingPlayer ? (
                <>
                  <Dice5 className="w-5 h-5 animate-spin" />
                  <span>جاري إجراء قرعة البداية بين اللاعبين...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>بدء التحدي الآن</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. SCREEN: PLAY */}
      {/* ========================================================= */}
      {currentScreen === 'PLAY' && currentQuestion && (
        <div className="relative z-10 flex-1 flex flex-col justify-between max-w-4xl mx-auto w-full p-3 md:p-6">
          {/* Header Bar */}
          <header className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-muted)]">
                السؤال {currentQuestionIndex + 1}
              </span>

              {/* Current Question Mode Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full glass-card text-xs font-bold text-[var(--accent-light)] accent-glow">
                {MODE_ICON_MAP[currentQuestion.type]}
                <span>{QUESTION_MODES.find(m => m.id === currentQuestion.type)?.name || 'سؤال'}</span>
              </div>

              {/* Active Player Turn Banner (Multiplayer) */}
              {gameMode !== 'solo' && (
                <div 
                  className="px-3 py-1 rounded-full border text-xs font-bold flex items-center gap-1.5 animate-in fade-in transition-all"
                  style={activeTheme.styleCard}
                >
                  <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: activeTheme.varColor }} />
                  <span style={activeTheme.styleText}>دور: {activePlayer.name}</span>
                </div>
              )}

              {/* Special Phase Badges */}
              {isFinalRound && (
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-500 dark:text-amber-300 border border-amber-500/40 animate-pulse">
                  الجولة الأخيرة! ⚡
                </span>
              )}
              {isTieBreaker && (
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-500 dark:text-rose-300 border border-rose-500/40 animate-pulse">
                  جولة الموت المفاجئ
                </span>
              )}
              {isCurrentQuestionWager && (
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-purple-500/20 text-purple-400 dark:text-purple-300 border border-purple-500/40 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-yellow-300" />
                  <span>رهان مضاعف</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {renderThemeButton()}
              <button
                onClick={handleToggleMute}
                className="p-2 rounded-xl glass-panel text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
                title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => {
                  sounds.playClick();
                  pauseTimer();
                  setIsPauseModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-panel text-[var(--text-secondary)] hover:border-[var(--border-accent)] text-xs font-semibold cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>إيقاف</span>
              </button>
              <button
                onClick={() => {
                  sounds.playClick();
                  pauseTimer();
                  setIsQuitModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-semibold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>خروج</span>
              </button>
            </div>
          </header>

          {/* DYNAMIC SCOREBOARD (Solo / Duo / Trio / Quad) */}
          <div className="my-3">
            {/* 1. SOLO SCOREBOARD */}
            {gameMode === 'solo' && (
              <div className="p-4 rounded-2xl glass-card flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-base text-[var(--accent-light)]">{activePlayer.name}</span>
                  {/* Hearts / Lives indicator */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const hasLife = i < activePlayer.lives;
                      return (
                        <Heart
                          key={i}
                          className={`w-5 h-5 transition-all ${
                            hasLife ? 'text-rose-500 fill-rose-500 animate-pulse' : 'text-slate-400 opacity-25'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Progress Towards Target */}
                <div className="flex-1 max-w-xs mx-4 hidden sm:block">
                  <div className="flex justify-between text-[11px] text-[var(--text-muted)] mb-1">
                    <span>التقدم نحو {targetScore}</span>
                    <span>{Math.round((activePlayer.score / targetScore) * 100)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-black/30 dark:bg-black/50 overflow-hidden border border-[var(--border-subtle)]">
                    <div 
                      className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-light)] transition-all duration-300"
                      style={{ width: `${Math.min(100, (activePlayer.score / targetScore) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl md:text-4xl font-extrabold font-display text-[var(--accent-light)]">
                    {activePlayer.score}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">/ {targetScore} ن</span>
                </div>
              </div>
            )}

            {/* 2. MULTIPLAYER SCOREBOARD (2, 3, or 4 players) */}
            {gameMode !== 'solo' && (
              <div className={`grid gap-2.5 ${
                gameMode === 'duo' ? 'grid-cols-2' :
                gameMode === 'trio' ? 'grid-cols-3' :
                'grid-cols-2 md:grid-cols-4'
              }`}>
                {players.map((p, idx) => {
                  const isCurrent = idx === currentPlayerIndex;
                  const theme = getPlayerTheme(p.colorIndex);
                  return (
                    <div
                      key={p.id}
                      className={`p-3 rounded-2xl border transition-all duration-300 ${
                        isCurrent 
                          ? `scale-[1.02] shadow-lg` 
                          : 'glass-panel opacity-65'
                      }`}
                      style={isCurrent ? theme.styleCard : undefined}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span 
                          className="text-xs md:text-sm font-bold truncate"
                          style={isCurrent ? theme.styleText : undefined}
                        >
                          {p.name}
                        </span>

                        {/* Streak Flames Indicator */}
                        <div className="flex items-center gap-0.5">
                          <Flame className={`w-3.5 h-3.5 ${p.streak >= 1 ? 'text-amber-500 fill-amber-500' : 'text-slate-400 opacity-30'}`} />
                          <Flame className={`w-3.5 h-3.5 ${p.streak >= 2 ? 'text-amber-500 fill-amber-500' : 'text-slate-400 opacity-30'}`} />
                          <Flame className={`w-3.5 h-3.5 ${p.streak >= 3 ? 'text-yellow-400 fill-yellow-400 animate-bounce' : 'text-slate-400 opacity-30'}`} />
                        </div>
                      </div>

                      <div className="flex items-baseline justify-between">
                        <span 
                          className="text-2xl md:text-3xl font-extrabold font-display"
                          style={isCurrent ? theme.styleText : undefined}
                        >
                          {p.score}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={theme.styleBadge}>
                            دوره
                          </span>
                        )}
                      </div>

                      {/* Small progress bar */}
                      <div className="w-full h-1 rounded-full bg-black/20 dark:bg-black/40 overflow-hidden mt-1.5">
                        <div 
                          className="h-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (p.score / targetScore) * 100)}%`, backgroundColor: theme.varColor }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* QUESTION CARD */}
          <div className="relative glass-card p-6 md:p-8 rounded-3xl accent-glow my-2 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-black/10 dark:bg-black/40">
                  {CATEGORY_ICON_MAP[currentQuestion.category]}
                </div>
                <span className="text-xs md:text-sm font-bold text-[var(--text-main)]">
                  {currentQuestion.category}
                </span>
                <span className="text-[var(--text-muted)]">·</span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                  currentQuestion.difficulty === 'easy' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25' :
                  currentQuestion.difficulty === 'medium' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25' :
                  'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/25'
                }`}>
                  {currentQuestion.difficulty === 'easy' ? 'سهل' : currentQuestion.difficulty === 'medium' ? 'متوسط' : 'صعب'}
                </span>
              </div>

              {/* Timer with Dynamic SVG Circle */}
              <div className="flex items-center gap-2">
                <div className="relative w-10 h-10 flex items-center justify-center">
                  <svg width="40" height="40" className="-rotate-90">
                    <circle cx="20" cy="20" r="16" stroke="var(--timer-track)" strokeWidth="3" fill="transparent" />
                    <circle 
                      cx="20" cy="20" r="16" 
                      stroke={timeRemaining <= 5 ? '#EF4444' : timeRemaining <= 10 ? '#F59E0B' : 'var(--accent-primary)'}
                      strokeWidth="3" 
                      fill="transparent"
                      strokeDasharray={100.5}
                      strokeDashoffset={100.5 * (1 - (timeRemaining / 30))}
                      strokeLinecap="round"
                      className="transition-all duration-100 ease-linear"
                    />
                  </svg>
                  <span className={`absolute font-mono text-xs font-black ${
                    timeRemaining <= 5 ? 'text-rose-500 animate-pulse' :
                    timeRemaining <= 10 ? 'text-amber-500 dark:text-amber-400' : 'text-[var(--text-main)]'
                  }`}>
                    {Math.ceil(timeRemaining)}
                  </span>
                </div>
              </div>
            </div>

            {/* Question Content based on type */}
            <div className="my-auto py-2">
              {currentQuestion.type === 'direct' && (
                <div>
                  <h3 dir={getTextDir((currentQuestion as DirectQuestion).question)} className="question-text text-[var(--text-main)] mb-6 text-center">
                    {renderMixedText((currentQuestion as DirectQuestion).question)}
                  </h3>
                  {revealedLetterHint && (
                    <div className="mb-4 p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-center font-mono text-lg text-amber-600 dark:text-amber-300 font-bold">
                      تلميح الحرف: {revealedLetterHint}
                    </div>
                  )}
                  {isAnswerRevealed && (
                    <div className="p-4 rounded-2xl glass-panel border border-[var(--border-accent)] text-center animate-in fade-in">
                      <span className="text-xs text-[var(--text-muted)] block mb-1">الإجابة المعتمدة:</span>
                      <span dir={getTextDir((currentQuestion as DirectQuestion).answer)} className="answer-text text-xl md:text-2xl font-bold">
                        {renderMixedText((currentQuestion as DirectQuestion).answer)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {currentQuestion.type === 'mcq' && (
                <div>
                  <h3 dir={getTextDir((currentQuestion as McqQuestion).question)} className="question-text text-[var(--text-main)] mb-6 text-center">
                    {renderMixedText((currentQuestion as McqQuestion).question)}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {(currentQuestion as McqQuestion).choices.map((choice, idx) => {
                      const letter = ['أ', 'ب', 'ج', 'د'][idx];
                      const isEliminated = eliminatedChoices.includes(idx);
                      const isSelected = selectedChoiceIdx === idx;
                      const isCorrect = idx === (currentQuestion as McqQuestion).correctIndex;

                      let btnStyle = 'glass-panel hover:border-[var(--accent-primary)]';
                      if (selectedChoiceIdx !== null) {
                        if (isCorrect) {
                          btnStyle = 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-300 font-bold';
                        } else if (isSelected && !isCorrect) {
                          btnStyle = 'bg-rose-500/20 border-rose-500 text-rose-600 dark:text-rose-300';
                        }
                      }

                      return (
                        <button
                          key={idx}
                          disabled={isEliminated || selectedChoiceIdx !== null || isProcessingAnswer}
                          onClick={() => handleSelectMcq(idx)}
                          className={`p-4 rounded-2xl border text-right flex items-center gap-3 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${btnStyle}`}
                        >
                          <span className="w-8 h-8 rounded-xl bg-black/10 dark:bg-black/40 border border-[var(--border-subtle)] flex items-center justify-center font-bold text-sm text-[var(--accent-light)] flex-shrink-0">
                            {letter}
                          </span>
                          <span dir={getTextDir(choice)} className="text-sm md:text-base font-semibold flex-1">
                            {renderMixedText(choice)}
                          </span>
                          {selectedChoiceIdx !== null && isCorrect && <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
                          {selectedChoiceIdx !== null && isSelected && !isCorrect && <X className="w-5 h-5 text-rose-500 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                  {isAnswerRevealed && (
                    <div dir="auto" className="p-3.5 rounded-2xl glass-panel border border-[var(--border-accent)] text-xs md:text-sm text-[var(--text-secondary)]">
                      <strong className="text-[var(--accent-light)]">💡 هل تعلم؟ </strong>
                      {renderMixedText((currentQuestion as McqQuestion).explanation)}
                    </div>
                  )}
                </div>
              )}

              {currentQuestion.type === 'tf' && (
                <div>
                  <h3 dir={getTextDir((currentQuestion as TfQuestion).question)} className="question-text text-[var(--text-main)] mb-8 text-center">
                    {renderMixedText((currentQuestion as TfQuestion).question)}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto mb-6">
                    <button
                      disabled={selectedTfChoice !== null || isProcessingAnswer}
                      onClick={() => handleSelectTf(true)}
                      className={`p-6 rounded-2xl border flex flex-col items-center gap-3 transition-all cursor-pointer disabled:opacity-40 ${
                        selectedTfChoice === true
                          ? (currentQuestion as TfQuestion).answer === true
                            ? 'bg-emerald-500/25 border-emerald-500 text-emerald-500 accent-glow'
                            : 'bg-rose-500/25 border-rose-500 text-rose-500'
                          : 'glass-panel hover:border-emerald-500/50'
                      }`}
                    >
                      <Check className="w-10 h-10 text-emerald-500" />
                      <span className="text-xl font-bold font-display">صحيح ✓</span>
                    </button>
                    <button
                      disabled={selectedTfChoice !== null || isProcessingAnswer}
                      onClick={() => handleSelectTf(false)}
                      className={`p-6 rounded-2xl border flex flex-col items-center gap-3 transition-all cursor-pointer disabled:opacity-40 ${
                        selectedTfChoice === false
                          ? (currentQuestion as TfQuestion).answer === false
                            ? 'bg-emerald-500/25 border-emerald-500 text-emerald-500 accent-glow'
                            : 'bg-rose-500/25 border-rose-500 text-rose-500'
                          : 'glass-panel hover:border-rose-500/50'
                      }`}
                    >
                      <X className="w-10 h-10 text-rose-500" />
                      <span className="text-xl font-bold font-display">خطأ ✗</span>
                    </button>
                  </div>
                  {isAnswerRevealed && (
                    <div className="p-3.5 rounded-2xl glass-panel border border-[var(--border-accent)] text-xs md:text-sm text-[var(--text-secondary)] text-center">
                      <strong className="text-[var(--accent-light)]">💡 التعليل: </strong>
                      {renderMixedText((currentQuestion as TfQuestion).explanation)}
                    </div>
                  )}
                </div>
              )}

              {currentQuestion.type === 'fill' && (
                <div>
                  <div className="text-center mb-2">
                    <span className="text-xs font-bold text-[var(--accent-light)] px-3 py-1 rounded-full glass-panel border border-[var(--border-accent)]">
                      {(currentQuestion as FillQuestion).kind || 'أكمل الناقص'}
                    </span>
                  </div>
                  <h3 dir={getTextDir((currentQuestion as FillQuestion).text)} className="question-text text-[var(--text-main)] mb-6 text-center leading-loose">
                    {renderMixedText((currentQuestion as FillQuestion).text.replace('____', isAnswerRevealed ? `[ ${(currentQuestion as FillQuestion).answer} ]` : '[ ________ ]'))}
                  </h3>
                  {isAnswerRevealed && (
                    <div className="p-4 rounded-2xl glass-panel border border-[var(--border-accent)] text-center animate-in fade-in">
                      <span className="text-xs text-[var(--text-muted)] block mb-1">الكلمة الناقصة:</span>
                      <span dir={getTextDir((currentQuestion as FillQuestion).answer)} className="answer-text text-2xl font-bold">
                        {renderMixedText((currentQuestion as FillQuestion).answer)}
                      </span>
                      <p dir="auto" className="text-xs text-[var(--text-secondary)] mt-2">
                        {renderMixedText((currentQuestion as FillQuestion).explanation)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {currentQuestion.type === 'match' && (
                <div>
                  <h4 className="text-sm md:text-base font-bold text-[var(--accent-light)] text-center mb-4">
                    {renderMixedText((currentQuestion as MatchQuestion).title)}
                  </h4>
                  <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto mb-4">
                    <div className="flex flex-col gap-2.5">
                      {matchRightItems.map((item, idx) => {
                        const conn = connections.find(c => c.rightIdx === idx);
                        const isSelected = selectedRightIdx === idx;
                        return (
                          <div
                            key={idx}
                            dir={getTextDir(item.text)}
                            onClick={() => handleSelectMatchCard('right', idx)}
                            style={{ borderColor: conn ? conn.color : undefined }}
                            className={`p-3 rounded-xl border text-center text-xs md:text-sm font-semibold cursor-pointer transition-all ${
                              conn ? 'glass-panel shadow-md font-bold' :
                              isSelected ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)] border-[var(--accent-primary)] font-bold' :
                              'glass-panel hover:border-[var(--border-accent)]'
                            }`}
                          >
                            {renderMixedText(item.text)}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {matchLeftItems.map((item, idx) => {
                        const conn = connections.find(c => c.leftIdx === idx);
                        return (
                          <div
                            key={idx}
                            dir={getTextDir(item.text)}
                            onClick={() => handleSelectMatchCard('left', idx)}
                            style={{ borderColor: conn ? conn.color : undefined }}
                            className={`p-3 rounded-xl border text-center text-xs md:text-sm font-semibold cursor-pointer transition-all ${
                              conn ? 'glass-panel shadow-md font-bold' :
                              selectedRightIdx !== null ? 'glass-card border-[var(--border-accent)]' :
                              'glass-panel'
                            }`}
                          >
                            {renderMixedText(item.text)}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {!matchConfirmed && (
                    <div className="flex justify-center">
                      <button
                        disabled={connections.length < 4}
                        onClick={handleConfirmMatch}
                        className="py-2.5 px-8 rounded-xl font-bold btn-accent cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-xs md:text-sm"
                      >
                        تأكيد التوصيلات ({connections.length}/4)
                      </button>
                    </div>
                  )}
                </div>
              )}

              {currentQuestion.type === 'hints' && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-[var(--text-muted)]">خمّن الشيء أو الشخصية من 5 تلميحات:</span>
                    <span className="px-3 py-1 rounded-full bg-[var(--player-1-bg)] border border-[var(--border-accent)] text-[var(--accent-light)] font-bold text-xs">
                      قيمة السؤال الحالية: {getHintsCurrentPoints()} نقاط
                    </span>
                  </div>

                  <div className="space-y-2.5 mb-4">
                    {(currentQuestion as HintsQuestion).hints.map((hint, idx) => {
                      const isRevealed = idx < revealedHintsCount;
                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border flex items-start gap-3 transition-all ${
                            isRevealed
                              ? 'glass-card text-[var(--text-main)] font-medium'
                              : 'glass-panel opacity-40'
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            isRevealed ? 'bg-[var(--accent-primary)] text-[var(--accent-contrast)]' : 'bg-black/20 text-[var(--text-muted)]'
                          }`}>
                            {idx + 1}
                          </span>
                          <span dir={getTextDir(hint)} className="text-xs md:text-sm flex-1 leading-relaxed">
                            {isRevealed ? renderMixedText(hint) : 'تلميح مغلق (سيتكشف تدريجياً)...'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      disabled={revealedHintsCount >= 5 || isAnswerRevealed}
                      onClick={handleRevealNextHint}
                      className="py-2 px-4 rounded-xl glass-panel text-xs font-semibold text-[var(--accent-light)] hover:border-[var(--border-accent)] cursor-pointer disabled:opacity-40"
                    >
                      كشف تلميح تالي (-1 نقطة)
                    </button>
                    {isAnswerRevealed && (
                      <div className="text-right">
                        <span className="text-xs text-[var(--text-muted)] ml-2">الإجابة:</span>
                        <span dir={getTextDir((currentQuestion as HintsQuestion).answer)} className="answer-text font-bold text-lg">
                          {renderMixedText((currentQuestion as HintsQuestion).answer)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Controls / Lifelines & Host Judgment for Direct/Hints */}
            <div className="pt-4 border-t border-[var(--border-subtle)]">
              {/* Host Judgment buttons for direct / fill / hints */}
              {(currentQuestion.type === 'direct' || currentQuestion.type === 'fill' || currentQuestion.type === 'hints') && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Lifelines Bar */}
                  <div className="flex items-center gap-2">
                    <button
                      disabled={activePlayer.lifelines.letter || usedLifelineThisQuestion || isAnswerRevealed || !isTimerRunning}
                      onClick={handleUseLetterClue}
                      className={`lifeline-btn flex items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                        activePlayer.lifelines.letter
                          ? 'opacity-40 cursor-not-allowed border-[var(--border-subtle)]'
                          : 'glass-panel hover:border-[var(--accent-primary)] text-[var(--accent-light)]'
                      }`}
                      title="كشف الحرف الأول (مرة واحدة)"
                    >
                      <KeyRound className="w-5 h-5" />
                    </button>

                    <button
                      disabled={activePlayer.lifelines.extraTime || usedLifelineThisQuestion || isAnswerRevealed || !isTimerRunning}
                      onClick={handleUseExtraTime}
                      className={`lifeline-btn flex items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                        activePlayer.lifelines.extraTime
                          ? 'opacity-40 cursor-not-allowed border-[var(--border-subtle)]'
                          : 'glass-panel hover:border-[var(--accent-primary)] text-[var(--accent-light)]'
                      }`}
                      title="وقت إضافي +15 ثانية (مرة واحدة)"
                    >
                      <Clock className="w-5 h-5" />
                    </button>

                    <button
                      disabled={activePlayer.lifelines.friend || usedLifelineThisQuestion || isAnswerRevealed || !isTimerRunning}
                      onClick={handleUseFriend}
                      className={`lifeline-btn flex items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                        activePlayer.lifelines.friend
                          ? 'opacity-40 cursor-not-allowed border-[var(--border-subtle)]'
                          : 'glass-panel hover:border-[var(--accent-primary)] text-[var(--accent-light)]'
                      }`}
                      title="استشارة صديق 20 ثانية (مرة واحدة)"
                    >
                      <PhoneCall className="w-5 h-5" />
                    </button>

                    <button
                      disabled={activePlayer.skips >= 2 || isAnswerRevealed || !isTimerRunning}
                      onClick={handleSkipQuestion}
                      className="px-3 py-2 rounded-xl glass-panel hover:border-[var(--border-accent)] text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer disabled:opacity-40"
                    >
                      تخطي ({2 - activePlayer.skips})
                    </button>
                  </div>

                  {/* Host Decision Buttons */}
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    {!isAnswerRevealed ? (
                      <button
                        onClick={() => setIsAnswerRevealed(true)}
                        className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl glass-panel hover:border-[var(--border-accent)] text-xs font-bold text-[var(--accent-light)] flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                        <span>كشف الإجابة</span>
                      </button>
                    ) : (
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          disabled={isProcessingAnswer}
                          onClick={() => awardPointsAndAdvance(true, currentQuestion.type === 'hints' ? getHintsCurrentPoints() : 1)}
                          className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs md:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                        >
                          <Check className="w-4 h-4" />
                          <span>إجابة صحيحة</span>
                        </button>
                        <button
                          disabled={isProcessingAnswer}
                          onClick={() => awardPointsAndAdvance(false, 0)}
                          className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs md:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                          <span>إجابة خاطئة</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* MCQ & Match bottom bar */}
              {(currentQuestion.type === 'mcq' || currentQuestion.type === 'match' || currentQuestion.type === 'tf') && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {currentQuestion.type === 'mcq' && (
                      <button
                        disabled={activePlayer.lifelines.letter || usedLifelineThisQuestion || isAnswerRevealed || !isTimerRunning}
                        onClick={handleUseLetterClue}
                        className="px-3 py-2 rounded-xl glass-panel hover:border-[var(--accent-primary)] text-xs font-semibold text-[var(--accent-light)] flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                      >
                        <KeyRound className="w-4 h-4" />
                        <span>حذف خيارين (50:50)</span>
                      </button>
                    )}

                    <button
                      disabled={activePlayer.lifelines.extraTime || usedLifelineThisQuestion || isAnswerRevealed || !isTimerRunning}
                      onClick={handleUseExtraTime}
                      className="px-3 py-2 rounded-xl glass-panel hover:border-[var(--accent-primary)] text-xs font-semibold text-[var(--accent-light)] flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                    >
                      <Clock className="w-4 h-4" />
                      <span>+15 ثانية</span>
                    </button>

                    <button
                      disabled={activePlayer.skips >= 2 || isAnswerRevealed || !isTimerRunning}
                      onClick={handleSkipQuestion}
                      className="px-3 py-2 rounded-xl glass-panel hover:border-[var(--border-accent)] text-xs font-semibold text-[var(--text-muted)] cursor-pointer disabled:opacity-40"
                    >
                      تخطي ({2 - activePlayer.skips})
                    </button>
                  </div>

                  <span className="text-[11px] text-[var(--text-muted)]">
                    {currentQuestion.type === 'match' ? 'صل كل عنصر بقرينه' : 'اختر الإجابة الصحيحة مباشرة'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. SCREEN: VICTORY */}
      {/* ========================================================= */}
      {currentScreen === 'VICTORY' && (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto w-full p-6 text-center">
          <div className="glass-card p-8 md:p-12 rounded-3xl accent-glow shadow-2xl max-w-2xl w-full">
            {/* Solo Result or Multiplayer Result */}
            {gameMode === 'solo' ? (
              <div>
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--player-1-bg)] border-2 border-[var(--border-accent)] flex items-center justify-center">
                  {players[0].score >= targetScore ? (
                    <Trophy className="w-10 h-10 text-[var(--accent-primary)]" />
                  ) : (
                    <HeartCrack className="w-10 h-10 text-rose-500" />
                  )}
                </div>

                <h2 className="text-3xl md:text-5xl font-extrabold font-display accent-gradient-text mb-2">
                  {players[0].score >= targetScore ? 'انتصار مستحق وبطولي!' : 'انتهت المحاولة!'}
                </h2>
                <p className="text-sm md:text-base text-[var(--text-secondary)] mb-6">
                  {players[0].score >= targetScore
                    ? `أتممت التحدي وجمعت ${players[0].score} نقطة بنجاح!`
                    : `نفدت الأرواح قبل بلوغ ${targetScore} نقطة. درّب ذاكرتك وأعد المحاولة!`}
                </p>

                {isNewSoloRecord && (
                  <div className="p-3 mb-6 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-500 dark:text-amber-300 font-bold text-sm accent-glow">
                    🌟 رقم قياسي شخصي جديد في السرعة وعدد الأسئلة!
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3 mb-8">
                  <div className="p-4 rounded-2xl glass-panel">
                    <span className="text-2xl font-bold font-display text-[var(--accent-light)] block">{players[0].score}</span>
                    <span className="text-[11px] text-[var(--text-muted)]">النقاط النهائية</span>
                  </div>
                  <div className="p-4 rounded-2xl glass-panel">
                    <span className="text-2xl font-bold font-display text-[var(--accent-light)] block">{soloFinalTimeSeconds} ث</span>
                    <span className="text-[11px] text-[var(--text-muted)]">الوقت الإجمالي</span>
                  </div>
                  <div className="p-4 rounded-2xl glass-panel">
                    <span className="text-2xl font-bold font-display text-[var(--accent-light)] block">{players[0].bestStreak} 🔥</span>
                    <span className="text-[11px] text-[var(--text-muted)]">أطول سلسلة</span>
                  </div>
                </div>

                {(() => {
                  const catEntries = Object.entries(players[0].correctByCategory || {});
                  if (catEntries.length > 0) {
                    const sorted = [...catEntries].sort((a, b) => b[1] - a[1]);
                    const bestCat = sorted[0];
                    return (
                      <div className="mb-6 p-3 rounded-2xl glass-panel border border-[var(--border-accent)] flex items-center justify-center gap-2 text-xs md:text-sm text-[var(--accent-light)] font-semibold">
                        <span>🏆 أقوى تصنيف لك في هذه الجولة:</span>
                        <strong className="text-[var(--text-main)] underline">{bestCat[0]}</strong>
                        <span>({bestCat[1]} إجابة صحيحة)</span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
            ) : (
              <div>
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[var(--player-1-bg)] border-2 border-[var(--border-accent)] flex items-center justify-center">
                  <Crown className="w-10 h-10 text-[var(--accent-primary)] animate-bounce" />
                </div>

                {(() => {
                  const sorted = [...players].sort((a, b) => b.score - a.score);
                  const winner = sorted[0];
                  const winnerTheme = getPlayerTheme(winner.colorIndex);
                  const rankLabels = ['🥇 المركز الأول', '🥈 المركز الثاني', '🥉 المركز الثالث', '🎖️ المركز الرابع'];

                  return (
                    <div>
                      <h2 className="text-3xl md:text-5xl font-extrabold font-display accent-gradient-text mb-2">
                        مبارك للفائز!
                      </h2>
                      <div className="text-xl md:text-2xl font-bold my-3" style={winnerTheme.styleText}>
                        👑 {winner.name} 👑
                      </div>
                      <p className="text-sm text-[var(--text-secondary)] mb-6">
                        برصيد <strong>{winner.score} نقطة</strong> متفوقاً في تحدي المعلومات والثقافة!
                      </p>

                      {/* Podium Summary */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-8">
                        {sorted.map((p, idx) => {
                          const theme = getPlayerTheme(p.colorIndex);
                          return (
                            <div 
                              key={p.id}
                              className={`p-4 rounded-2xl border text-center ${idx === 0 ? 'border-[var(--accent-primary)] bg-[var(--player-1-bg)] accent-glow' : 'glass-panel'}`}
                            >
                              <span className="text-[10px] text-[var(--text-muted)] block mb-1 font-bold">{rankLabels[idx]}</span>
                              <span className="text-sm font-bold block truncate" style={theme.styleText}>{p.name}</span>
                              <span className="text-2xl font-bold font-display text-[var(--text-main)] mt-1 block">{p.score} ن</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Detailed Stats Table */}
                <div className="p-4 rounded-2xl glass-panel mb-8 max-w-2xl mx-auto text-right text-xs">
                  <div className="font-bold text-[var(--accent-light)] mb-2 pb-2 border-b border-[var(--border-subtle)]">
                    جدول إحصائيات اللاعبين:
                  </div>
                  <div className="space-y-3">
                    {players.map(p => {
                      const theme = getPlayerTheme(p.colorIndex);
                      return (
                        <div key={p.id} className="p-2.5 rounded-xl glass-card">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-bold" style={theme.styleText}>{p.name}</span>
                            <span className="font-bold text-[var(--text-main)]">{p.score} نقطة</span>
                          </div>
                          <div className="flex justify-between text-[var(--text-muted)] text-[11px] mb-1">
                            <span>صحيحة: {p.correctCount}</span>
                            <span>أطول سلسلة: {p.bestStreak} 🔥</span>
                            <span>الرهانات: {p.bets}/2</span>
                            <span>التخطي: {p.skips}/2</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1 pt-1 border-t border-[var(--border-subtle)]">
                            {QUESTION_MODES.map(m => (
                              <span key={m.id} className="px-1.5 py-0.5 rounded glass-panel text-[9px] text-[var(--text-muted)]">
                                {m.shortName}: {p.correctByType[m.id] || 0}
                              </span>
                            ))}
                          </div>

                          {(() => {
                            const catEntries = Object.entries(p.correctByCategory || {});
                            if (catEntries.length > 0) {
                              const sorted = [...catEntries].sort((a, b) => b[1] - a[1]);
                              const bestCat = sorted[0];
                              const worstCat = sorted[sorted.length - 1];
                              return (
                                <div className="mt-1.5 pt-1.5 border-t border-[var(--border-subtle)] flex items-center justify-between text-[10px]">
                                  <span className="text-[var(--accent-light)] font-semibold">
                                    🏆 أقوى تصنيف: <strong className="text-[var(--text-main)]">{bestCat[0]}</strong> ({bestCat[1]})
                                  </span>
                                  {sorted.length > 1 && worstCat[1] < bestCat[1] && (
                                    <span className="text-[var(--text-muted)]">
                                      أضعف: {worstCat[0]} ({worstCat[1]})
                                    </span>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Actions: Replay & Share */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={initiateStartGame}
                className="py-3 px-8 rounded-2xl font-bold btn-accent cursor-pointer font-display text-base"
              >
                إعادة اللعب بنفس الإعدادات
              </button>

              <button
                onClick={() => {
                  if (gameMode === 'solo') {
                    const msg = `🏆 تحدي الثلاثين (فردي):\nجمعتُ ${players[0].score} نقطة خلال ${soloFinalTimeSeconds} ثانية مع سلسلة ${players[0].bestStreak} إجابات متتالية! 🔥\nهل تستطيع كسر رقمي القياسي؟`;
                    handleShareGame(msg);
                  } else {
                    const sorted = [...players].sort((a, b) => b.score - a.score);
                    const winner = sorted[0];
                    const msg = `🏆 تحدي الثلاثين الثقافي:\nفاز [${winner.name}] برصيد ${winner.score} نقطة في منافسة بين ${players.length} لاعبين!\nأطول سلسلة إجابات: ${Math.max(...players.map(p => p.bestStreak))} إجابات متتالية 🔥\nجرّب التحدي الآن:`;
                    handleShareGame(msg);
                  }
                }}
                className="py-3 px-6 rounded-2xl glass-panel hover:border-[var(--border-accent)] text-[var(--accent-light)] text-sm font-bold flex items-center justify-center gap-2 cursor-pointer accent-glow"
              >
                <Share2 className="w-4 h-4 text-[var(--accent-primary)]" />
                <span>شارك النتيجة</span>
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  setCurrentScreen('SETUP');
                }}
                className="py-3 px-6 rounded-2xl glass-panel text-[var(--text-secondary)] text-sm font-semibold cursor-pointer hover:border-[var(--border-accent)]"
              >
                تغيير الإعدادات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODALS */}
      {/* ========================================================= */}

      {/* SHARE MODAL (التعديل 3: ضبط SHARE_URL وميزات المشاركة) */}
      {isShareModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="shareModalTitle"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsShareModalOpen(false);
          }}
        >
          <div className="glass-card max-w-md w-full p-6 md:p-8 rounded-3xl accent-glow text-right animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2.5">
                <Share2 className="w-5 h-5 text-[var(--accent-primary)]" />
                <h3 id="shareModalTitle" className="text-xl font-bold font-display accent-gradient-text">
                  مشاركة اللعبة والنتيجة
                </h3>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1 cursor-pointer text-lg font-bold"
                aria-label="إغلاق نافذة المشاركة"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[var(--text-secondary)] mb-4 leading-relaxed whitespace-pre-line p-3 rounded-xl glass-panel">
              {shareCustomText}
            </p>

            {/* Link Copy Box */}
            <div className="mb-6">
              <label className="block text-[11px] font-bold text-[var(--accent-light)] mb-1.5">
                رابط التحدي المعتمد:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={getComputedShareUrl()}
                  dir="ltr"
                  className="flex-1 glass-panel rounded-xl px-3 py-2 text-xs text-[var(--text-secondary)] font-mono outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 rounded-xl btn-accent font-bold text-xs flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                >
                  {isCopied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{isCopied ? 'تم النسخ ✓' : 'نسخ'}</span>
                </button>
              </div>
            </div>

            {/* Social Share Buttons */}
            <div>
              <label className="block text-[11px] font-bold text-[var(--text-muted)] mb-3">
                المشاركة السريعة عبر التطبيقات:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareCustomText + '\n\n' + getComputedShareUrl())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl glass-panel hover:border-emerald-500/50 flex items-center justify-center gap-2 text-xs text-emerald-500 dark:text-emerald-300 transition-all font-semibold"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-500" />
                  <span>واتساب</span>
                </a>

                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(getComputedShareUrl())}&text=${encodeURIComponent(shareCustomText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl glass-panel hover:border-sky-500/50 flex items-center justify-center gap-2 text-xs text-sky-500 dark:text-sky-300 transition-all font-semibold"
                >
                  <Send className="w-4 h-4 text-sky-500" />
                  <span>تيليجرام</span>
                </a>

                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareCustomText)}&url=${encodeURIComponent(getComputedShareUrl())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl glass-panel hover:border-slate-500 flex items-center justify-center gap-2 text-xs text-[var(--text-main)] transition-all font-semibold"
                >
                  <ExternalLink className="w-4 h-4 text-[var(--text-muted)]" />
                  <span>إكس (X)</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WAGER ROUND MODAL */}
      {wagerModalOpen && currentQuestion && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-3xl text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-purple-500/20 border-2 border-purple-400 flex items-center justify-center text-purple-300">
              <Zap className="w-8 h-8 text-yellow-300 animate-pulse" />
            </div>
            <span className="text-xs font-bold text-purple-400 dark:text-purple-300 tracking-wider">
              قرار تكتيكي قبل بدء السؤال
            </span>
            <h3 className="text-2xl font-bold font-display text-[var(--text-main)] mt-1 mb-2">
              جولة الرهان (×2)
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mb-4 leading-relaxed">
              الدور على <strong style={activeTheme.styleText}>{activePlayer.name}</strong>.<br />
              التصنيف: <strong>{currentQuestion.category}</strong> · النمط: <strong>{QUESTION_MODES.find(m => m.id === currentQuestion.type)?.name}</strong>
            </p>

            <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs text-purple-600 dark:text-purple-200 mb-6">
              الصحيح يمنح <strong className="text-yellow-500 dark:text-yellow-300">+2 نقطة</strong> · والخطأ يخصم <strong className="text-rose-500">-2 نقطة</strong>
              {gameMode === 'solo' && ' وروحاً واحدة'}!<br />
              الرهانات المتبقية: <strong>{2 - activePlayer.bets} من 2</strong>
            </div>

            <div className="flex gap-3">
              <button
                disabled={activePlayer.bets >= 2 || (gameMode !== 'solo' && activePlayer.score < 2)}
                onClick={() => {
                  sounds.playWager();
                  setPlayers(prev => prev.map((pl, i) => i === currentPlayerIndex ? { ...pl, bets: pl.bets + 1 } : pl));
                  setIsCurrentQuestionWager(true);
                  setWagerModalOpen(false);
                  addToast('⚡ رهان مفعّل', `قام ${activePlayer.name} بتفعيل الرهان!`, 'wager');
                }}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-yellow-300 to-amber-500 hover:brightness-110 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed text-xs md:text-sm"
              >
                تفعيل الرهان ⚡
              </button>
              <button
                onClick={() => setWagerModalOpen(false)}
                className="py-3 px-6 rounded-xl glass-panel text-xs md:text-sm font-semibold text-[var(--text-secondary)] cursor-pointer"
              >
                تخطي الرهان
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FRIEND CONSULTATION MODAL */}
      {isFriendModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-sm w-full p-6 rounded-3xl text-center animate-in zoom-in-95">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-sky-500/20 border-2 border-sky-400 flex items-center justify-center text-sky-400">
              <PhoneCall className="w-8 h-8 animate-bounce" />
            </div>
            <h3 className="text-xl font-bold font-display text-[var(--text-main)] mb-1">
              استشارة صديق
            </h3>
            <p className="text-xs text-[var(--text-muted)] mb-4">
              ناقش صديقك أو فريقك الآن، وسيعود المؤقت الرئيسي للعمل فور انتهاء الوقت!
            </p>

            <div className="text-4xl font-black font-mono text-sky-500 dark:text-sky-300 mb-6">
              {friendTimeRemaining} ث
            </div>

            <button
              onClick={() => {
                sounds.playClick();
                setIsFriendModalOpen(false);
                resumeTimer();
              }}
              className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm cursor-pointer"
            >
              إنهاء الاستشارة والعودة للسؤال
            </button>
          </div>
        </div>
      )}

      {/* PAUSE MODAL */}
      {isPauseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-sm w-full p-6 rounded-3xl text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full glass-panel flex items-center justify-center text-[var(--accent-primary)]">
              <Pause className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-display text-[var(--text-main)] mb-1">
              اللعبة متوقفة مؤقتاً
            </h3>
            <p className="text-xs text-[var(--text-muted)] mb-6">
              يمكنك أخذ استراحة واستئناف المؤقت في أي لحظة.
            </p>
            <button
              onClick={() => {
                sounds.playClick();
                setIsPauseModalOpen(false);
                resumeTimer();
              }}
              className="w-full py-3 rounded-xl btn-accent font-bold text-sm cursor-pointer"
            >
              استئناف التحدي
            </button>
          </div>
        </div>
      )}

      {/* QUIT MODAL */}
      {isQuitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-sm w-full p-6 rounded-3xl text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold font-display text-[var(--text-main)] mb-1">
              إنهاء المباراة الحالية؟
            </h3>
            <p className="text-xs text-[var(--text-muted)] mb-6">
              سيتم فقدان تقدم الجولة والعودة إلى شاشة الإعدادات.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  sounds.playClick();
                  stopTimer();
                  setIsQuitModalOpen(false);
                  setCurrentScreen('SETUP');
                }}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer"
              >
                تأكيد الخروج
              </button>
              <button
                onClick={() => {
                  sounds.playClick();
                  setIsQuitModalOpen(false);
                  resumeTimer();
                }}
                className="flex-1 py-3 rounded-xl glass-panel text-[var(--text-secondary)] font-semibold text-xs cursor-pointer"
              >
                إلغاء ومتابعة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RULES MODAL */}
      {isRulesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full p-6 md:p-8 rounded-3xl accent-glow text-right max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-[var(--accent-primary)]" />
                <h3 className="text-lg font-bold font-display accent-gradient-text">
                  قواعد وأنماط تحدي الثلاثين
                </h3>
              </div>
              <button
                onClick={() => setIsRulesModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)] p-1 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs md:text-sm text-[var(--text-secondary)] leading-relaxed">
              <div>
                <h4 className="font-bold text-[var(--accent-light)] mb-1">1) أنماط اللاعبين:</h4>
                <p>
                  • <strong>فردي (Solo):</strong> تبدأ بـ 5 أرواح ومهمتك بلوغ 30 نقطة قبل نفادها لتسجيل رقم قياسي شخصي.<br />
                  • <strong>متعدد (فريقان، 3، 4 لاعبين):</strong> منافسة تبادلية بنظام الجولات، مع إمكانية تفعيل مبدأ تكافؤ الفرص في الجولة الأخيرة.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[var(--accent-light)] mb-1">2) أنماط الأسئلة الستة:</h4>
                <p>
                  • <strong>سؤال مباشر:</strong> للمقدم والمناقشة الجماعية مع كشف الإجابة والتحكيم.<br />
                  • <strong>اختيار من متعدد (MCQ):</strong> 4 خيارات بأحرف عربية واضحة.<br />
                  • <strong>صح أو خطأ (T/F):</strong> إجابة فورية سريعة مع شرح تعليلي.<br />
                  • <strong>أكمل الناقص:</strong> تخمين الكلمة أو العبارة المفقودة من بيت شعر أو مثل.<br />
                  • <strong>المطابقة (Match):</strong> توصيل 4 أزواج متقابلة قبل انتهاء الوقت.<br />
                  • <strong>خمّن من التلميحات:</strong> كشف تدريجي لخمسة تلميحات تنقص قيمتها نقطة مع كل كشف!
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[var(--accent-light)] mb-1">3) وسائل المساعدة والرهان:</h4>
                <p>
                  • <strong>كشف الحرف / حذف خيارين:</strong> وسيلة مساعدة وحيدة لكل سؤال.<br />
                  • <strong>وقت إضافي:</strong> إضافة 15 ثانية فورية للمؤقت.<br />
                  • <strong>استشارة صديق:</strong> إيقاف اللعبة وفتح 20 ثانية للنقاش الهادئ.<br />
                  • <strong>جولة الرهان (×2):</strong> فرصة مرتين في اللعبة لمضاعفة المكسب (+2) أو الخسارة (-2).
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[var(--accent-light)] mb-1">4) سلسلة الإجابات (Streak):</h4>
                <p>
                  كل 3 إجابات صحيحة متتالية تمنح نقطة ذهبية بونص إضافية 🔥!
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsRulesModalOpen(false)}
              className="w-full mt-6 py-3 rounded-xl btn-accent font-bold text-xs md:text-sm cursor-pointer"
            >
              فهمت القواعد، فلنبدأ!
            </button>
          </div>
        </div>
      )}

      {/* BANK DEPLETED MODAL (بدء دورة جديدة / إنهاء اللعبة) */}
      {isDepletedModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 md:p-8 rounded-3xl text-center border-[var(--border-accent)] animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
              <RefreshCw className="w-8 h-8 text-[var(--accent-light)]" />
            </div>
            <h3 className="text-2xl font-bold font-display text-[var(--text-main)] mb-2">
              نفدت الأسئلة غير المعروضة!
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">
              لقد استعرضت كافة الأسئلة المتوفرة في الفئات والأنماط المحددة ({seenQuestionIds.length} سؤالاً).
              يمكنك بدء دورة جديدة لتصفير السجل وإعادة خلط الأسئلة بالكامل، أو إنهاء اللعبة.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleStartNewCycle}
                className="flex-1 py-3.5 px-6 rounded-2xl btn-accent font-bold text-sm cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>ابدأ دورة جديدة</span>
              </button>
              <button
                onClick={() => {
                  sounds.playClick();
                  setIsDepletedModalOpen(false);
                  setCurrentScreen('SETUP');
                }}
                className="py-3.5 px-6 rounded-2xl glass-panel text-[var(--text-secondary)] hover:text-[var(--text-main)] font-bold text-sm cursor-pointer transition-all"
              >
                إنهاء اللعبة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Footer */}
      <footer className="relative z-10 py-3 px-4 text-center text-xs text-[var(--text-muted)] border-t border-[var(--border-subtle)] flex items-center justify-between max-w-4xl mx-auto w-full">
        <span>تحدي الثلاثين © 2026 - النسخة الثقافية المطوّرة</span>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-medium hidden sm:inline">
            اختصار الثيم: <kbd className="px-1.5 py-0.5 rounded glass-panel text-[10px] font-mono border border-[var(--border-subtle)]">T</kbd>
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            {isOnline ? 'جاهز للاستخدام أوفلاين ✓' : 'وضع بدون إنترنت 📴'}
          </span>
        </div>
      </footer>
    </div>
  );
}
