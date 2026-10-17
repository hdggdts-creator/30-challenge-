import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Trophy, Volume2, VolumeX, Play, Pause, RotateCcw, 
  SkipForward, Check, X, Eye, 
  Award, ShieldAlert, Sparkles, Download, Settings,
  Landmark, Globe, Atom, Moon, Feather, Palette, Cpu, BookOpen, Coins, Brain,
  Flame, Clock, PhoneCall, KeyRound, Zap, WifiOff, CheckCircle2,
  HelpCircle, ListChecks, PenLine, Layers, Lightbulb, ChevronLeft, RefreshCw,
  Share2, Copy, CheckCheck, ExternalLink, MessageCircle, Send, Mail,
  User, Users, Crown, Heart, HeartCrack, Shuffle, Dice5
} from 'lucide-react';
import { 
  CATEGORIES, QUESTIONS_BANK, QUESTION_MODES, 
  Question, QuestionType, MatchPair, FillQuestion, McqQuestion, TfQuestion, HintsQuestion, MatchQuestion, DirectQuestion
} from './data/questions';
import { sounds } from './utils/audio';
import { triggerConfetti } from './utils/confetti';

type Screen = 'SPLASH' | 'SETUP' | 'PLAY' | 'VICTORY';
type DifficultyFilter = 'all' | 'easy' | 'medium' | 'hard';
type ThemeType = 'gold' | 'royal-blue' | 'emerald' | 'auto';
export type GameMode = 'solo' | 'duo' | 'trio' | 'quad';

const SHARE_URL: string = ""; // إذا كان فارغاً يتم استخدام الرابط التلقائي

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

const PLAYER_COLORS = [
  {
    name: 'ذهبي',
    border: 'border-[#D4AF37]',
    borderGlow: 'gold-glow',
    text: 'text-[#F5D77A]',
    bg: 'bg-[#D4AF37]/15',
    badge: 'bg-[#D4AF37] text-slate-950',
    hex: '#D4AF37'
  },
  {
    name: 'أزرق',
    border: 'border-sky-400',
    borderGlow: 'shadow-[0_0_20px_-3px_rgba(56,189,248,0.35)]',
    text: 'text-sky-300',
    bg: 'bg-sky-500/15',
    badge: 'bg-sky-500 text-slate-950',
    hex: '#38BDF8'
  },
  {
    name: 'زمردي',
    border: 'border-emerald-400',
    borderGlow: 'shadow-[0_0_20px_-3px_rgba(16,185,129,0.35)]',
    text: 'text-emerald-300',
    bg: 'bg-emerald-500/15',
    badge: 'bg-emerald-500 text-slate-950',
    hex: '#10B981'
  },
  {
    name: 'بنفسجي',
    border: 'border-purple-400',
    borderGlow: 'shadow-[0_0_20px_-3px_rgba(192,132,252,0.35)]',
    text: 'text-purple-300',
    bg: 'bg-purple-500/15',
    badge: 'bg-purple-500 text-slate-950',
    hex: '#C084FC'
  }
];

const CATEGORY_ICON_MAP: Record<string, React.ReactNode> = {
  'تاريخ': <Landmark className="w-5 h-5 text-[#D4AF37]" />,
  'جغرافيا': <Globe className="w-5 h-5 text-sky-400" />,
  'علوم': <Atom className="w-5 h-5 text-emerald-400" />,
  'ثقافة إسلامية': <Moon className="w-5 h-5 text-amber-400" />,
  'أدب وشعر عربي': <Feather className="w-5 h-5 text-fuchsia-400" />,
  'فنون وسينما': <Palette className="w-5 h-5 text-pink-400" />,
  'تقنية': <Cpu className="w-5 h-5 text-indigo-400" />,
  'لغة عربية': <BookOpen className="w-5 h-5 text-teal-400" />,
  'اقتصاد ومال': <Coins className="w-5 h-5 text-amber-500" />,
  'ألغاز ومنطق': <Brain className="w-5 h-5 text-violet-400" />,
};

const MODE_ICON_MAP: Record<QuestionType, React.ReactNode> = {
  direct: <HelpCircle className="w-5 h-5 text-[#D4AF37]" />,
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

export default function App() {
  // Navigation & Modals
  const [currentScreen, setCurrentScreen] = useState<Screen>('SPLASH');
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [isQuitModalOpen, setIsQuitModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(sounds.getMuted());

  // Theme Management
  const [currentTheme, setCurrentTheme] = useState<ThemeType>(() => {
    try {
      const saved = localStorage.getItem('tahadi_theme');
      if (saved && ['gold', 'royal-blue', 'emerald', 'auto'].includes(saved)) {
        return saved as ThemeType;
      }
    } catch (e) {}
    return 'gold';
  });
  const [isThemePopoverOpen, setIsThemePopoverOpen] = useState(false);
  const themePopoverRef = useRef<HTMLDivElement>(null);

  const applyTheme = useCallback((theme: ThemeType) => {
    setCurrentTheme(theme);
    let resolved = theme;
    if (theme === 'auto') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'gold' : 'royal-blue';
    }
    document.documentElement.setAttribute('data-theme', resolved);
    const metaTheme = document.getElementById('metaThemeColor') || document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      const colors: Record<string, string> = {
        'gold': '#07070B',
        'royal-blue': '#060B1A',
        'emerald': '#04120E'
      };
      metaTheme.setAttribute('content', colors[resolved] || '#07070B');
    }
    try {
      localStorage.setItem('tahadi_theme', theme);
    } catch (e) {}
  }, []);

  useEffect(() => {
    applyTheme(currentTheme);
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handleMediaChange = () => {
      if (currentTheme === 'auto') {
        applyTheme('auto');
      }
    };
    mql.addEventListener('change', handleMediaChange);
    return () => mql.removeEventListener('change', handleMediaChange);
  }, [currentTheme, applyTheme]);

  const cycleTheme = useCallback(() => {
    const list: ThemeType[] = ['gold', 'royal-blue', 'emerald', 'auto'];
    const nextIdx = (list.indexOf(currentTheme) + 1) % list.length;
    sounds.playClick();
    applyTheme(list[nextIdx]);
  }, [currentTheme, applyTheme]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 't' || e.key === 'T' || e.key === 'ف') {
        cycleTheme();
      }
      if (e.key === 'Escape') {
        setIsThemePopoverOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cycleTheme]);

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

  // Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareCustomText, setShareCustomText] = useState('تحدّى أصدقاءك في لعبة المعلومات العامة والثقافة!');
  const [isCopied, setIsCopied] = useState(false);

  const getComputedShareUrl = useCallback(() => {
    if (SHARE_URL && SHARE_URL.trim() !== '') return SHARE_URL.trim();
    return window.location.origin + window.location.pathname;
  }, []);

  const handleShareGame = async (customMessage?: string) => {
    sounds.playClick();
    const textToShare = customMessage || 'تحدّى أصدقاءك في لعبة المعلومات العامة والثقافة!';
    setShareCustomText(textToShare);
    const url = getComputedShareUrl();

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'تحدي الثلاثين',
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
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
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

  // Helper: Get player count from mode
  const getPlayerCount = useCallback((mode: GameMode): number => {
    switch (mode) {
      case 'solo': return 1;
      case 'duo': return 2;
      case 'trio': return 3;
      case 'quad': return 4;
      default: return 2;
    }
  }, []);

  // Update Player Name with Deduplication check
  const handlePlayerNameChange = (idx: number, newName: string) => {
    const updated = [...playerNames];
    updated[idx] = newName.slice(0, 16);
    setPlayerNames(updated);
    try {
      localStorage.setItem('tahadi_playernames', JSON.stringify(updated));
    } catch (e) {}
  };

  // Reset per-question state
  useEffect(() => {
    if (!currentQuestion) return;

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

  // Start Game with Draw Animation
  const initiateStartGame = () => {
    if (selectedCategories.length < 3 || enabledModes.length === 0) return;
    sounds.playClick();

    const count = getPlayerCount(gameMode);

    // Save settings
    try {
      localStorage.setItem('tahadi_gamemode', gameMode);
      localStorage.setItem('tahadi_round_completion', JSON.stringify(roundCompletionEnabled));
    } catch (e) {}

    // Prepare Deduplicated Player Names
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

    // Filter questions
    let filtered = QUESTIONS_BANK.filter(q => {
      const catMatch = selectedCategories.includes(q.category);
      const diffMatch = selectedDifficulty === 'all' || q.difficulty === selectedDifficulty;
      const modeMatch = enabledModes.includes(q.type);
      return catMatch && diffMatch && modeMatch;
    });

    if (filtered.length === 0) {
      filtered = QUESTIONS_BANK.filter(q => enabledModes.includes(q.type));
    }

    // Multiply question pool adequately for 4 players or tie-breakers
    let shuffled = shuffleArray(filtered);
    const minNeeded = count * 25 + 20;
    while (shuffled.length < minNeeded) {
      shuffled = [...shuffled, ...shuffleArray(filtered)];
    }

    setGameQuestions(shuffled);
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
    // 1. SOLO MODE
    if (gameMode === 'solo') {
      const p = currentPlayers[0];
      if (p.lives <= 0) {
        return true; // Lost
      }
      if (p.score >= targetScore) {
        return true; // Won
      }
      if (nextQIndex >= gameQuestions.length) {
        return true; // Ran out of questions
      }
      return false;
    }

    // 2. TIE BREAKER ACTIVE
    if (isTieBreaker) {
      // Check if all tied players have completed their tie breaker turn
      const nextTieTurn = (tieBreakerTurnIndex + 1) % tiedPlayerIndices.length;
      if (nextTieTurn === 0) {
        // End of tie breaker round: check if scores diverge
        const tiedScores = tiedPlayerIndices.map(idx => currentPlayers[idx].score);
        const maxScore = Math.max(...tiedScores);
        const leaders = tiedPlayerIndices.filter(idx => currentPlayers[idx].score === maxScore);
        if (leaders.length === 1) {
          return true; // Single winner found!
        }
        // Still tied: update tied players list if some were eliminated
        setTiedPlayerIndices(leaders);
      }
      return false;
    }

    // 3. MULTIPLAYER STANDARD
    const anyHitTarget = currentPlayers.some(p => p.score >= targetScore);
    const ranOut = nextQIndex >= gameQuestions.length;

    if (!roundCompletionEnabled) {
      if (anyHitTarget) return true;
      if (ranOut) return true;
      return false;
    }

    // With round completion enabled:
    if (anyHitTarget && !isFinalRound) {
      setIsFinalRound(true);
    }

    // If final round is active or questions ran out, check if current round is complete
    const isRoundComplete = (currentPlayerIndex + 1) % currentPlayers.length === 0;

    if ((isFinalRound || anyHitTarget || ranOut) && isRoundComplete) {
      // Evaluate if there is a tie for 1st place
      const maxScore = Math.max(...currentPlayers.map(p => p.score));
      const leaders = currentPlayers.map((p, i) => i).filter(i => currentPlayers[i].score === maxScore);

      if (leaders.length > 1) {
        // Enter tie breaker!
        setIsTieBreaker(true);
        setTiedPlayerIndices(leaders);
        setTieBreakerTurnIndex(0);
        addToast('⚡ جولة فاصلة!', 'تعادل في الصدارة! بدء جولة الموت المفاجئ', 'wager');
        return false;
      }
      return true;
    }

    return false;
  };

  // Transition to next player / question
  const advanceToNext = (updatedPlayers: Player[]) => {
    const nextQIndex = currentQuestionIndex + 1;
    const isOver = checkGameOver(updatedPlayers, nextQIndex);

    if (isOver) {
      stopTimer();
      sounds.playVictory();
      triggerConfetti();

      // Check Solo Record
      if (gameMode === 'solo') {
        const p = updatedPlayers[0];
        const elapsedSec = Math.round((Date.now() - gameStartTime) / 1000);
        setSoloFinalTimeSeconds(elapsedSec);

        if (p.score >= targetScore) {
          const isBetter = !soloRecord || 
            (soloQuestionsAnswered + 1 < soloRecord.questionsCount) ||
            (soloQuestionsAnswered + 1 === soloRecord.questionsCount && elapsedSec < soloRecord.timeSeconds);

          if (isBetter) {
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
        }
      }

      setCurrentScreen('VICTORY');
    } else {
      setCurrentQuestionIndex(nextQIndex);
      setIsAnswerRevealed(false);
      setIsProcessingAnswer(false);
      setUsedLifelineThisQuestion(false);
      setRevealedLetterHint(null);
      setIsCurrentQuestionWager(false);

      if (gameMode === 'solo') {
        setSoloQuestionsAnswered(prev => prev + 1);
        setWagerModalOpen(true);
      } else if (isTieBreaker) {
        const nextTieIdx = (tieBreakerTurnIndex + 1) % tiedPlayerIndices.length;
        setTieBreakerTurnIndex(nextTieIdx);
        setCurrentPlayerIndex(tiedPlayerIndices[nextTieIdx]);
        setWagerModalOpen(true);
      } else {
        const nextPlayer = (currentPlayerIndex + 1) % updatedPlayers.length;
        setCurrentPlayerIndex(nextPlayer);
        setWagerModalOpen(true);
      }
    }
  };

  // Generalized Point & Life Adjustment
  const awardPointsAndAdvance = (isCorrect: boolean, basePoints: number = 1, isMatchPartial: boolean = false) => {
    if (isProcessingAnswer) return;
    setIsProcessingAnswer(true);
    stopTimer();

    const qType = currentQuestion?.type || 'direct';
    let earned = isCorrect ? basePoints : 0;
    if (isCorrect && isCurrentQuestionWager) {
      earned = basePoints * 2;
    } else if (!isCorrect && isCurrentQuestionWager) {
      earned = -2;
    }

    if (isCorrect) {
      sounds.playCorrect();
    } else {
      sounds.playWrong();
    }

    const updated = players.map((p, idx) => {
      if (idx !== currentPlayerIndex) return p;

      let nextStreak = p.streak;
      let newMaxStreak = p.bestStreak;
      let bonusPoint = 0;
      let newLives = p.lives;

      if (isCorrect) {
        if (!isMatchPartial) {
          nextStreak += 1;
          newMaxStreak = Math.max(newMaxStreak, nextStreak);
          if (nextStreak === 3) {
            bonusPoint = 1;
            nextStreak = 0;
            sounds.playStreak();
            addToast('🔥 سلسلة ذهبية!', `+1 نقطة إضافية لـ ${p.name}!`, 'streak');
            if (gameMode === 'solo' && newLives < 5) {
              newLives += 1;
              addToast('❤️ استعادة روح', 'استعدت روحاً بفضل السلسلة الذهبية!', 'gold');
            }
          }
        }
      } else {
        nextStreak = 0;
        if (gameMode === 'solo') {
          newLives = Math.max(0, newLives - 1);
          sounds.playWrong();
          addToast('💔 فقدان روح', `تبقى لديك ${newLives} أرواح!`, 'danger');
        }
      }

      return {
        ...p,
        score: Math.max(0, Math.round((p.score + earned + bonusPoint) * 10) / 10),
        correctCount: p.correctCount + (isCorrect ? 1 : 0),
        streak: nextStreak,
        bestStreak: newMaxStreak,
        lives: newLives,
        correctByType: {
          ...p.correctByType,
          [qType]: p.correctByType[qType] + (isCorrect ? 1 : 0)
        }
      };
    });

    setPlayers(updated);

    setTimeout(() => {
      advanceToNext(updated);
    }, 1800);
  };

  // Lifelines
  const handleUseLetterLifeline = () => {
    const p = players[currentPlayerIndex];
    if (!p || p.lifelines.letter || usedLifelineThisQuestion || isAnswerRevealed || !currentQuestion) return;

    sounds.playRevealLetter();
    setUsedLifelineThisQuestion(true);

    setPlayers(prev => prev.map((pl, i) => i === currentPlayerIndex ? {
      ...pl, lifelines: { ...pl.lifelines, letter: true }
    } : pl));

    if (currentQuestion.type === 'mcq') {
      const q = currentQuestion as McqQuestion;
      const wrongIndices = [0, 1, 2, 3].filter(i => i !== q.correctIndex);
      const shuffledWrong = shuffleArray(wrongIndices);
      setEliminatedChoices(shuffledWrong.slice(0, 2));
      addToast('وسيلة مساعدة', 'تم حذف خيارين خاطئين (50:50)!', 'gold');
    } else {
      let targetAnswer = '';
      if ('answer' in currentQuestion) targetAnswer = String((currentQuestion as any).answer);
      const letterData = getFirstLetterData(targetAnswer);
      setRevealedLetterHint(letterData.masked);
      addToast('كشف الحرف', `الحرف الأول: ${letterData.letter} (${letterData.length} حروف)`, 'gold');
    }
  };

  const handleUseExtraTimeLifeline = () => {
    const p = players[currentPlayerIndex];
    if (!p || p.lifelines.extraTime || usedLifelineThisQuestion || isAnswerRevealed) return;

    sounds.playClick();
    setUsedLifelineThisQuestion(true);

    setPlayers(prev => prev.map((pl, i) => i === currentPlayerIndex ? {
      ...pl, lifelines: { ...pl.lifelines, extraTime: true }
    } : pl));

    const newTime = Math.min(45, timeRemaining + 15);
    setTimeRemaining(newTime);
    timerRemainingAtStartRef.current = newTime;
    timerStartRef.current = Date.now();
    addToast('وقت إضافي', '+15 ثانية مضافة للمؤقت!', 'gold');
  };

  const handleUseFriendLifeline = () => {
    const p = players[currentPlayerIndex];
    if (!p || p.lifelines.friend || usedLifelineThisQuestion || isAnswerRevealed) return;

    sounds.playConsultFriend();
    pauseTimer();
    setUsedLifelineThisQuestion(true);

    setPlayers(prev => prev.map((pl, i) => i === currentPlayerIndex ? {
      ...pl, lifelines: { ...pl.lifelines, friend: true }
    } : pl));

    setFriendTimeRemaining(20);
    setIsFriendModalOpen(true);
  };

  useEffect(() => {
    if (!isFriendModalOpen) return;
    const interval = window.setInterval(() => {
      setFriendTimeRemaining(prev => {
        if (prev <= 1) {
          window.clearInterval(interval);
          setIsFriendModalOpen(false);
          resumeTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isFriendModalOpen, resumeTimer]);

  const handleSkipQuestion = () => {
    const p = players[currentPlayerIndex];
    if (!p || p.skips >= 2 || isProcessingAnswer) return;
    sounds.playClick();

    const updated = players.map((pl, i) => i === currentPlayerIndex ? { ...pl, skips: pl.skips + 1 } : pl);
    setPlayers(updated);
    advanceToNext(updated);
  };

  // MCQ Selection
  const handleSelectMcq = (idx: number) => {
    if (selectedChoiceIdx !== null || isProcessingAnswer || !currentQuestion) return;
    const q = currentQuestion as McqQuestion;
    setSelectedChoiceIdx(idx);
    stopTimer();
    const isCorrect = idx === q.correctIndex;
    setIsAnswerRevealed(true);
    awardPointsAndAdvance(isCorrect, 1);
  };

  // TF Selection
  const handleSelectTf = (val: boolean) => {
    if (selectedTfChoice !== null || isProcessingAnswer || !currentQuestion) return;
    const q = currentQuestion as TfQuestion;
    setSelectedTfChoice(val);
    stopTimer();
    const isCorrect = val === q.answer;
    setIsAnswerRevealed(true);
    awardPointsAndAdvance(isCorrect, 1);
  };

  // Match
  const handleSelectMatchCard = (side: 'right' | 'left', idx: number) => {
    if (matchConfirmed || isProcessingAnswer) return;
    sounds.playClick();
    const existingIdx = connections.findIndex(c => 
      (side === 'right' && c.rightIdx === idx) || (side === 'left' && c.leftIdx === idx)
    );
    if (existingIdx !== -1) {
      setConnections(prev => prev.filter((_, i) => i !== existingIdx));
      setSelectedRightIdx(null);
      return;
    }
    if (side === 'right') {
      setSelectedRightIdx(idx);
    } else if (side === 'left' && selectedRightIdx !== null) {
      const colors = ['#D4AF37', '#10B981', '#38BDF8', '#A855F7'];
      const usedColors = connections.map(c => c.color);
      const color = colors.find(c => !usedColors.includes(c)) || '#D4AF37';
      setConnections(prev => [...prev, { rightIdx: selectedRightIdx, leftIdx: idx, color }]);
      setSelectedRightIdx(null);
    }
  };

  const handleConfirmMatch = () => {
    if (matchConfirmed || isProcessingAnswer || !currentQuestion) return;
    setMatchConfirmed(true);
    stopTimer();
    let correctCount = 0;
    connections.forEach(conn => {
      const rOrig = matchRightItems[conn.rightIdx]?.origIdx;
      const lOrig = matchLeftItems[conn.leftIdx]?.origIdx;
      if (rOrig === lOrig) correctCount++;
    });
    let earned = 0;
    let isCorrectOverall = false;
    let isPartial = false;
    if (correctCount === 4) {
      earned = 1;
      isCorrectOverall = true;
    } else if (correctCount === 3) {
      earned = 0.5;
      isCorrectOverall = true;
      isPartial = true;
    }
    setIsAnswerRevealed(true);
    awardPointsAndAdvance(isCorrectOverall, earned, isPartial);
  };

  // Hints
  const handleRevealNextHint = () => {
    sounds.playClick();
    setRevealedHintsCount(prev => Math.min(5, prev + 1));
  };

  const getHintsCurrentPoints = () => Math.max(1, 6 - revealedHintsCount);

  const activePlayer = players[currentPlayerIndex] || players[0];
  const activeColor = PLAYER_COLORS[activePlayer?.colorIndex || 0] || PLAYER_COLORS[0];

  // Render Universal Theme Switcher Popover Component
  const renderThemeButton = () => (
    <div className="relative" ref={themePopoverRef}>
      <button
        onClick={() => {
          sounds.playClick();
          setIsThemePopoverOpen(prev => !prev);
        }}
        aria-expanded={isThemePopoverOpen}
        aria-label="تغيير الثيم (اختصار T)"
        className="p-2 rounded-xl bg-[#12121A] border border-slate-800 text-slate-300 hover:text-[#F5D77A] hover:border-[#D4AF37]/40 transition-all cursor-pointer flex items-center gap-1.5"
        title="تغيير المظهر والثيم (اختصار T)"
      >
        <Palette className="w-4 h-4 text-[#D4AF37]" />
        <span className="text-[11px] font-bold hidden sm:inline">
          {currentTheme === 'gold' ? 'ذهبي' : currentTheme === 'royal-blue' ? 'أزرق' : currentTheme === 'emerald' ? 'زمردي' : 'تلقائي'}
        </span>
      </button>

      {isThemePopoverOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-48 p-2 rounded-2xl bg-[#0E0E16]/95 border border-[#D4AF37]/40 backdrop-blur-xl shadow-2xl z-50 animate-in fade-in zoom-in-95">
          <div className="text-[10px] text-slate-400 px-2 py-1 font-bold border-b border-slate-800 mb-1 flex items-center justify-between">
            <span>اختر الثيم</span>
            <span className="text-[#F5D77A]">اختصار: T</span>
          </div>
          <div className="space-y-1">
            {[
              { id: 'gold', name: 'الذهبي الأسود', color: 'from-[#F5D77A] to-[#B8902B]' },
              { id: 'royal-blue', name: 'الأزرق الملكي', color: 'from-[#6C8CFF] to-[#3B62E0]' },
              { id: 'emerald', name: 'الزمردي الأخضر', color: 'from-[#2ECC9A] to-[#1B8E68]' },
              { id: 'auto', name: 'تلقائي (حسب النظام)', color: 'from-slate-400 to-slate-700' }
            ].map(t => {
              const isSelected = currentTheme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    sounds.playClick();
                    applyTheme(t.id as ThemeType);
                    setIsThemePopoverOpen(false);
                  }}
                  className={`w-full p-2 rounded-xl flex items-center justify-between text-xs font-semibold transition-all cursor-pointer ${
                    isSelected ? 'bg-[#1E1E2D] text-[#F5D77A] font-bold' : 'hover:bg-slate-800/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-tr ${t.color} border border-white/20`} />
                    <span>{t.name}</span>
                  </div>
                  {isSelected && <span className="text-[#D4AF37] font-bold">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative min-h-screen bg-[#07070B] text-slate-100 font-sans flex flex-col justify-between overflow-x-hidden selection:bg-[#D4AF37]/30 selection:text-white transition-colors duration-400">
      {/* Background Geometric Pattern */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.03] z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23D4AF37' fill-rule='evenodd'%3E%3Cpath d='M40 0l10 10-10 10-10-10L40 0zm0 40l10 10-10 10-10-10L40 40zm-20-20l10 10-10 10-10-10L20 20zm40 0l10 10-10 10-10-10L60 20zM0 0h20v20H0V0zm60 0h20v20H60V0zM0 60h20v20H0V60zm60 0h20v20H60V60z'/%3E%3C/g%3E%3C/svg%3E")`
        }}
      />

      {/* Floating Interactive Toast Notifications */}
      <div className="fixed top-4 left-4 right-4 z-50 pointer-events-none flex flex-col items-center gap-2">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`pointer-events-auto px-5 py-3 rounded-2xl shadow-2xl border backdrop-blur-xl flex items-center gap-3 transition-all transform animate-in fade-in slide-in-from-top-4 duration-300 ${
              toast.type === 'streak' 
                ? 'bg-gradient-to-r from-amber-500/90 to-yellow-600/90 border-amber-300 text-slate-950 font-bold gold-glow' 
                : toast.type === 'wager'
                ? 'bg-gradient-to-r from-purple-900/90 to-indigo-900/90 border-purple-400 text-white'
                : toast.type === 'danger'
                ? 'bg-rose-950/90 border-rose-500 text-rose-200'
                : 'bg-[#12121A]/90 border-[#D4AF37]/40 text-[#F5D77A] gold-glow'
            }`}
          >
            {toast.type === 'streak' && <Flame className="w-5 h-5 fill-slate-950 animate-bounce" />}
            {toast.type === 'gold' && <Sparkles className="w-5 h-5 text-[#F5D77A]" />}
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
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center max-w-4xl mx-auto w-full">
          <div className="w-full flex items-center justify-between pb-6">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
              <span className="text-xs text-slate-400 font-medium">النسخة الثقافية المطوّرة (أنماط 1 إلى 4 لاعبين)</span>
            </div>
            <div className="flex items-center gap-2.5">
              {renderThemeButton()}
              <button
                onClick={() => handleShareGame()}
                className="p-2 rounded-xl bg-[#12121A] border border-slate-800 text-slate-300 hover:text-[#F5D77A] hover:border-[#D4AF37]/40 transition-all cursor-pointer flex items-center gap-1.5"
                title="شارك اللعبة"
              >
                <Share2 className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-xs font-bold hidden sm:inline">شارك اللعبة</span>
              </button>
              {installPrompt && (
                <button
                  onClick={handleInstallApp}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#F5D77A] hover:bg-[#D4AF37]/25 text-xs font-bold transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تثبيت PWA</span>
                </button>
              )}
              <button
                onClick={handleToggleMute}
                className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#12121A] border border-[#D4AF37]/30 text-xs font-semibold text-[#F5D77A] mb-6 gold-glow">
            <Sparkles className="w-3.5 h-3.5" />
            <span>فردي بأرواح · فريقان · 3 لاعبين · 4 لاعبين · 6 أنماط أسئلة</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold font-display tracking-tight gold-text-gradient mb-4">
            تحدي الثلاثين
          </h1>
          <p className="text-base md:text-xl text-slate-300 max-w-2xl mb-8 leading-relaxed font-sans">
            لعبة المسابقات الفكرية والثقافية الكبرى: خيارات، صح وخطأ، أكمل الناقص، مطابقة، وتلميحات تدريجية.
          </p>

          {/* Quick Metrics & Solo Record */}
          <div className="grid grid-cols-3 gap-3 md:gap-6 w-full max-w-lg mb-6">
            <div className="glass-card p-4 rounded-2xl border border-[#D4AF37]/20 flex flex-col items-center">
              <span className="text-3xl font-bold font-display text-[#F5D77A]">30</span>
              <span className="text-xs text-slate-400 mt-1 font-medium">نقطة للانتصار</span>
            </div>
            <div className="glass-card p-4 rounded-2xl border border-[#D4AF37]/20 flex flex-col items-center">
              <span className="text-3xl font-bold font-display text-[#F5D77A]">1 - 4</span>
              <span className="text-xs text-slate-400 mt-1 font-medium">لاعبين وفرق</span>
            </div>
            <div className="glass-card p-4 rounded-2xl border border-[#D4AF37]/20 flex flex-col items-center">
              <span className="text-3xl font-bold font-display text-[#F5D77A]">6</span>
              <span className="text-xs text-slate-400 mt-1 font-medium">أنماط تفاعلية</span>
            </div>
          </div>

          {/* Solo Best Record Display if exists */}
          {soloRecord && (
            <div className="mb-8 p-3 px-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#F5D77A]" />
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
              className="flex-1 flex items-center justify-center gap-3 py-4 px-8 rounded-2xl font-bold text-slate-950 bg-gradient-to-r from-[#F5D77A] via-[#D4AF37] to-[#B8902B] hover:brightness-110 active:scale-[0.98] transition-all shadow-xl gold-glow cursor-pointer font-display text-lg"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              <span>دخول التحدي</span>
            </button>
            <button
              onClick={() => {
                sounds.playClick();
                setIsRulesModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 py-4 px-6 rounded-2xl font-semibold text-slate-200 bg-[#12121A] hover:bg-[#1A1A26] border border-slate-800 hover:border-[#D4AF37]/40 transition-all cursor-pointer text-sm"
            >
              <Award className="w-4 h-4 text-[#D4AF37]" />
              <span>قواعد وأنماط اللعب</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. SCREEN: SETUP */}
      {/* ========================================================= */}
      {currentScreen === 'SETUP' && (
        <div className="relative z-10 flex-1 flex flex-col justify-center max-w-4xl mx-auto w-full p-4 md:p-6">
          <div className="glass-card p-6 md:p-8 rounded-3xl border border-[#D4AF37]/25 gold-glow shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between pb-6 mb-6 border-b border-[#D4AF37]/20">
              <div className="flex items-center gap-3">
                <Settings className="w-6 h-6 text-[#D4AF37]" />
                <h2 className="text-2xl font-bold font-display gold-text-gradient">
                  إعدادات التحدي
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {renderThemeButton()}
                <button
                  onClick={() => handleShareGame()}
                  className="p-2 rounded-xl bg-[#12121A] border border-slate-800 text-slate-300 hover:text-[#F5D77A] transition-all cursor-pointer flex items-center gap-1.5"
                  title="شارك اللعبة"
                >
                  <Share2 className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-xs font-semibold hidden md:inline">شارك</span>
                </button>
                <button
                  onClick={() => {
                    sounds.playClick();
                    setCurrentScreen('SPLASH');
                  }}
                  className="px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  العودة للرئيسية
                </button>
              </div>
            </div>

            {/* 1) PLAYER COUNT SELECTION: 4 Luxury Glass Cards */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-[#F5D77A] mb-2.5">
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
                          ? 'bg-[#181824] border-[#D4AF37] gold-glow' 
                          : 'bg-[#0E0E16]/80 border-slate-800 opacity-60 hover:opacity-90'
                      }`}
                    >
                      <div className={`p-2 rounded-xl ${isSelected ? 'bg-[#D4AF37] text-slate-950' : 'bg-black/40 text-slate-400'}`}>
                        {mode.icon}
                      </div>
                      <div>
                        <span className={`text-sm font-bold block ${isSelected ? 'text-[#F5D77A]' : 'text-slate-200'}`}>
                          {mode.name}
                        </span>
                        <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                          {mode.desc}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2) DYNAMIC PLAYER NAMES */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-300 mb-2">
                {gameMode === 'solo' ? 'اسم المتحدي:' : 'أسماء اللاعبين / الفرق:'}
              </label>
              <div className={`grid gap-3 ${gameMode === 'solo' ? 'grid-cols-1' : gameMode === 'duo' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>
                {Array.from({ length: getPlayerCount(gameMode) }).map((_, idx) => {
                  const color = PLAYER_COLORS[idx];
                  return (
                    <div key={idx} className="relative flex items-center">
                      <div 
                        className="absolute right-3 w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color.hex }}
                        title={`لون: ${color.name}`}
                      />
                      <input
                        type="text"
                        maxLength={16}
                        value={playerNames[idx] || ''}
                        onChange={e => handlePlayerNameChange(idx, e.target.value)}
                        className={`w-full bg-[#101018] border ${color.border} rounded-xl pr-9 pl-12 py-2.5 text-sm text-slate-100 outline-none transition-colors`}
                        placeholder={gameMode === 'solo' ? 'المغامر' : `لاعب ${idx + 1}`}
                      />
                      <span className="absolute left-3 text-[10px] text-slate-500">
                        {(playerNames[idx] || '').length}/16
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3) STARTING TURN & ROUND COMPLETION (For multiplayer) */}
            {gameMode !== 'solo' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-3.5 rounded-2xl bg-[#0B0B12] border border-slate-800">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">
                    قرعة ضربة البداية:
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { sounds.playClick(); setStartingTurnMode('random'); }}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        startingTurnMode === 'random' ? 'bg-[#D4AF37] text-slate-950 border-[#D4AF37]' : 'bg-[#101018] text-slate-400 border-slate-800'
                      }`}
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                      <span>قرعة عشوائية</span>
                    </button>
                    <button
                      onClick={() => { sounds.playClick(); setStartingTurnMode('sequential'); }}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        startingTurnMode === 'sequential' ? 'bg-[#D4AF37] text-slate-950 border-[#D4AF37]' : 'bg-[#101018] text-slate-400 border-slate-800'
                      }`}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>بالترتيب (1 فالأول)</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col justify-center">
                  <label 
                    onClick={() => {
                      sounds.playClick();
                      setRoundCompletionEnabled(prev => !prev);
                    }}
                    className="flex items-center gap-2.5 cursor-pointer"
                  >
                    <div className={`w-5 h-5 rounded-md border flex items-center justify-center text-xs font-black ${
                      roundCompletionEnabled ? 'bg-[#D4AF37] border-[#D4AF37] text-slate-950' : 'border-slate-700 bg-transparent'
                    }`}>
                      {roundCompletionEnabled ? '✓' : ''}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">إكمال الجولة بالتساوي</span>
                      <span className="text-[10px] text-slate-400 block">ضمان تساوي عدد الأسئلة للجميع قبل إعلان الفائز</span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Target Score & Difficulty */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  هدف الفوز بالنقاط
                </label>
                <div className="flex gap-2">
                  {[20, 30, 40].map(pts => (
                    <button
                      key={pts}
                      onClick={() => {
                        sounds.playClick();
                        setTargetScore(pts);
                      }}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        targetScore === pts
                          ? 'bg-[#D4AF37] text-slate-950 border-[#D4AF37]'
                          : 'bg-[#101018] text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {pts} نقطة
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  مستوى الصعوبة
                </label>
                <div className="flex gap-2">
                  {(['all', 'easy', 'medium', 'hard'] as DifficultyFilter[]).map(diff => (
                    <button
                      key={diff}
                      onClick={() => {
                        sounds.playClick();
                        setSelectedDifficulty(diff);
                      }}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        selectedDifficulty === diff
                          ? 'bg-[#D4AF37] text-slate-950 border-[#D4AF37]'
                          : 'bg-[#101018] text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {diff === 'all' ? 'متنوع' : diff === 'easy' ? 'سهل' : diff === 'medium' ? 'متوسط' : 'صعب'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* QUESTION MODES (6 modes) */}
            <div className="mb-6 p-4 rounded-2xl bg-[#0B0B12] border border-[#D4AF37]/30 gold-glow">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#F5D77A]" />
                  <label className="text-xs md:text-sm font-bold text-slate-100">
                    أنماط الأسئلة المفعلة ({enabledModes.length} من 6):
                  </label>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllModes}
                    className="text-[11px] text-[#F5D77A] hover:underline cursor-pointer font-bold"
                  >
                    تفعيل الكل
                  </button>
                  <span className="text-slate-600">·</span>
                  <button
                    onClick={selectOnlyDirect}
                    className="text-[11px] text-slate-400 hover:text-slate-200 hover:underline cursor-pointer"
                  >
                    مباشر فقط
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {QUESTION_MODES.map(mode => {
                  const isActive = enabledModes.includes(mode.id);
                  return (
                    <div
                      key={mode.id}
                      onClick={() => toggleMode(mode.id)}
                      className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                        isActive
                          ? 'bg-[#151522] border-[#D4AF37] shadow-md gold-glow'
                          : 'bg-[#0E0E16]/80 border-slate-800/80 opacity-60 hover:opacity-90'
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-black/40 flex-shrink-0">
                        {MODE_ICON_MAP[mode.id]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${isActive ? 'text-[#F5D77A]' : 'text-slate-300'}`}>
                            {mode.name}
                          </span>
                          <div className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] font-black ${
                            isActive ? 'bg-[#D4AF37] border-[#D4AF37] text-slate-950' : 'border-slate-700 bg-transparent'
                          }`}>
                            {isActive ? '✓' : ''}
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {mode.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Category Selection Grid */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-semibold text-slate-300">
                  اختيار التصنيفات المعرفية ({selectedCategories.length} من 10)
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={selectRandomCategories}
                    className="text-[11px] text-[#F5D77A] hover:underline cursor-pointer"
                  >
                    عشوائي (5)
                  </button>
                  <span className="text-slate-600">·</span>
                  <button
                    onClick={selectAllCategories}
                    className="text-[11px] text-slate-400 hover:text-slate-200 hover:underline cursor-pointer"
                  >
                    تحديد الكل
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {CATEGORIES.map(cat => {
                  const isSelected = selectedCategories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#1E1E2D] border-[#D4AF37] text-slate-100 gold-glow'
                          : 'bg-[#0E0E16] border-slate-800 text-slate-400 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-black/40">
                        {CATEGORY_ICON_MAP[cat.id]}
                      </div>
                      <span className="text-xs font-semibold">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Start Button */}
            <div className="pt-4 flex justify-end">
              <button
                disabled={selectedCategories.length < 3 || enabledModes.length === 0}
                onClick={initiateStartGame}
                className="w-full md:w-auto flex items-center justify-center gap-3 py-3.5 px-10 rounded-xl font-bold text-slate-950 bg-gradient-to-r from-[#F5D77A] via-[#D4AF37] to-[#B8902B] hover:brightness-110 active:scale-[0.98] transition-all shadow-lg gold-glow cursor-pointer font-display text-lg disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Play className="w-5 h-5 fill-slate-950" />
                <span>دخول حلبة التحدي</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RAFFLE / DRAW ANIMATION OVERLAY */}
      {isDrawingStartingPlayer && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
          <Dice5 className="w-16 h-16 text-[#F5D77A] animate-spin mb-4" />
          <h3 className="text-2xl font-bold font-display gold-text-gradient mb-6">
            قرعة ضربة البداية...
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl w-full">
            {players.map((p, idx) => {
              const isHighlight = drawActiveIndex === idx;
              const color = PLAYER_COLORS[p.colorIndex];
              return (
                <div
                  key={p.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isHighlight
                      ? `${color.border} ${color.bg} scale-105 shadow-2xl`
                      : 'border-slate-800 bg-[#0E0E16]/80 opacity-40'
                  }`}
                >
                  <span className={`text-base font-bold ${isHighlight ? color.text : 'text-slate-400'}`}>
                    {p.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. SCREEN: PLAY */}
      {/* ========================================================= */}
      {currentScreen === 'PLAY' && currentQuestion && (
        <div className="relative z-10 flex-1 flex flex-col justify-between max-w-5xl mx-auto w-full px-4 py-4 md:py-6">
          {/* Top Bar with Status & Theme Switcher */}
          <header className="flex items-center justify-between gap-4 pb-3 border-b border-[#D4AF37]/15">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-display font-bold text-lg md:text-xl gold-text-gradient">
                تحدي الثلاثين
              </span>

              {/* Current Question Mode Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#12121A] border border-[#D4AF37]/40 text-xs font-bold text-[#F5D77A] gold-glow">
                {MODE_ICON_MAP[currentQuestion.type]}
                <span>{QUESTION_MODES.find(m => m.id === currentQuestion.type)?.name || 'سؤال'}</span>
              </div>

              {/* Active Player Turn Banner (Multiplayer) */}
              {gameMode !== 'solo' && (
                <div 
                  className={`px-3 py-1 rounded-full border text-xs font-bold flex items-center gap-1.5 animate-in fade-in transition-all`}
                  style={{ borderColor: activeColor.hex, backgroundColor: `${activeColor.hex}18`, color: activeColor.hex }}
                >
                  <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: activeColor.hex }} />
                  <span>دور: {activePlayer.name}</span>
                </div>
              )}

              {/* Special Phase Badges */}
              {isFinalRound && (
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                  الجولة الأخيرة! ⚡
                </span>
              )}
              {isTieBreaker && (
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                  جولة الموت المفاجئ
                </span>
              )}
              {isCurrentQuestionWager && (
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-yellow-300" />
                  <span>رهان مضاعف</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {renderThemeButton()}
              <button
                onClick={handleToggleMute}
                className="p-2 rounded-xl bg-[#12121A] border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#12121A] border border-slate-800 text-slate-300 hover:border-slate-700 text-xs font-semibold cursor-pointer"
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/30 border border-rose-900/40 text-rose-400 hover:bg-rose-950/50 text-xs font-semibold cursor-pointer"
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
              <div className="p-4 rounded-2xl bg-[#151522] border border-[#D4AF37] gold-glow flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-base text-[#F5D77A]">{activePlayer.name}</span>
                  {/* Hearts / Lives indicator */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => {
                      const hasLife = i < activePlayer.lives;
                      return (
                        <Heart
                          key={i}
                          className={`w-5 h-5 transition-all ${
                            hasLife ? 'text-rose-500 fill-rose-500 animate-pulse' : 'text-slate-700 opacity-30'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Progress Towards Target */}
                <div className="flex-1 max-w-xs mx-4 hidden sm:block">
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>التقدم نحو {targetScore}</span>
                    <span>{Math.round((activePlayer.score / targetScore) * 100)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-black/50 overflow-hidden border border-slate-800">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-400 to-[#D4AF37] transition-all duration-300"
                      style={{ width: `${Math.min(100, (activePlayer.score / targetScore) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-3xl md:text-4xl font-extrabold font-display text-[#F5D77A]">
                    {activePlayer.score}
                  </span>
                  <span className="text-xs text-slate-400">/ {targetScore} ن</span>
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
                  const color = PLAYER_COLORS[p.colorIndex];
                  return (
                    <div
                      key={p.id}
                      className={`p-3 rounded-2xl border transition-all duration-300 ${
                        isCurrent 
                          ? `bg-[#151522] ${color.border} ${color.borderGlow} scale-[1.02]` 
                          : 'bg-[#0E0E16]/80 border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-xs md:text-sm font-bold truncate ${isCurrent ? color.text : 'text-slate-300'}`}>
                          {p.name}
                        </span>

                        {/* Streak Flames Indicator */}
                        <div className="flex items-center gap-0.5">
                          <Flame className={`w-3.5 h-3.5 ${p.streak >= 1 ? 'text-amber-500 fill-amber-500' : 'text-slate-700'}`} />
                          <Flame className={`w-3.5 h-3.5 ${p.streak >= 2 ? 'text-amber-500 fill-amber-500' : 'text-slate-700'}`} />
                          <Flame className={`w-3.5 h-3.5 ${p.streak >= 3 ? 'text-yellow-400 fill-yellow-400 animate-bounce' : 'text-slate-700'}`} />
                        </div>
                      </div>

                      <div className="flex items-baseline justify-between">
                        <span className={`text-2xl md:text-3xl font-extrabold font-display ${isCurrent ? color.text : 'text-slate-200'}`}>
                          {p.score}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: color.hex, color: '#07070B' }}>
                            دوره
                          </span>
                        )}
                      </div>

                      {/* Small progress bar */}
                      <div className="w-full h-1 rounded-full bg-black/40 overflow-hidden mt-1.5">
                        <div 
                          className="h-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (p.score / targetScore) * 100)}%`, backgroundColor: color.hex }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* QUESTION CARD */}
          <div className="relative glass-card p-6 md:p-8 rounded-3xl border border-[#D4AF37]/30 gold-glow my-2 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-black/40">
                  {CATEGORY_ICON_MAP[currentQuestion.category]}
                </div>
                <span className="text-xs md:text-sm font-bold text-slate-200">
                  {currentQuestion.category}
                </span>
                <span className="text-slate-600">·</span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                  currentQuestion.difficulty === 'easy' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  currentQuestion.difficulty === 'medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {currentQuestion.difficulty === 'easy' ? 'سهل' : currentQuestion.difficulty === 'medium' ? 'متوسط' : 'صعب'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className={`w-4 h-4 ${timeRemaining <= 5 ? 'text-rose-500 animate-spin' : 'text-[#D4AF37]'}`} />
                <span className={`font-mono text-lg md:text-xl font-extrabold ${
                  timeRemaining <= 5 ? 'text-rose-400 animate-pulse' :
                  timeRemaining <= 10 ? 'text-amber-400' : 'text-slate-100'
                }`}>
                  {Math.ceil(timeRemaining)} ث
                </span>
              </div>
            </div>

            {/* Question Content based on type */}
            <div className="my-auto py-2">
              {currentQuestion.type === 'direct' && (
                <div>
                  <h3 className="question-text text-slate-100 mb-6 text-center">
                    {(currentQuestion as DirectQuestion).question}
                  </h3>
                  {revealedLetterHint && (
                    <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center font-mono text-lg text-amber-300 font-bold">
                      تلميح الحرف: {revealedLetterHint}
                    </div>
                  )}
                  {isAnswerRevealed && (
                    <div className="p-4 rounded-2xl bg-[#12121A] border border-[#D4AF37]/50 text-center animate-in fade-in">
                      <span className="text-xs text-slate-400 block mb-1">الإجابة المعتمدة:</span>
                      <span className="answer-text text-xl md:text-2xl font-bold text-[#F5D77A]">
                        {(currentQuestion as DirectQuestion).answer}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {currentQuestion.type === 'mcq' && (
                <div>
                  <h3 className="question-text text-slate-100 mb-6 text-center">
                    {(currentQuestion as McqQuestion).question}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {(currentQuestion as McqQuestion).choices.map((choice, idx) => {
                      const letter = ['أ', 'ب', 'ج', 'د'][idx];
                      const isEliminated = eliminatedChoices.includes(idx);
                      const isSelected = selectedChoiceIdx === idx;
                      const isCorrect = idx === (currentQuestion as McqQuestion).correctIndex;

                      let btnStyle = 'bg-[#101018] border-slate-800 text-slate-200 hover:border-[#D4AF37]/50';
                      if (selectedChoiceIdx !== null) {
                        if (isCorrect) {
                          btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold';
                        } else if (isSelected && !isCorrect) {
                          btnStyle = 'bg-rose-950/80 border-rose-500 text-rose-200';
                        }
                      }

                      return (
                        <button
                          key={idx}
                          disabled={isEliminated || selectedChoiceIdx !== null || isProcessingAnswer}
                          onClick={() => handleSelectMcq(idx)}
                          className={`p-4 rounded-2xl border text-right flex items-center gap-3 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${btnStyle}`}
                        >
                          <span className="w-8 h-8 rounded-xl bg-black/40 border border-slate-700 flex items-center justify-center font-bold text-sm text-[#F5D77A]">
                            {letter}
                          </span>
                          <span className="text-sm md:text-base font-semibold flex-1">
                            {choice}
                          </span>
                          {selectedChoiceIdx !== null && isCorrect && <Check className="w-5 h-5 text-emerald-400" />}
                          {selectedChoiceIdx !== null && isSelected && !isCorrect && <X className="w-5 h-5 text-rose-400" />}
                        </button>
                      );
                    })}
                  </div>
                  {isAnswerRevealed && (
                    <div className="p-3.5 rounded-2xl bg-[#12121A] border border-[#D4AF37]/30 text-xs md:text-sm text-slate-300">
                      <strong className="text-[#F5D77A]">💡 هل تعلم؟ </strong>
                      {(currentQuestion as McqQuestion).explanation}
                    </div>
                  )}
                </div>
              )}

              {currentQuestion.type === 'tf' && (
                <div>
                  <h3 className="question-text text-slate-100 mb-8 text-center">
                    {(currentQuestion as TfQuestion).question}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto mb-6">
                    <button
                      disabled={selectedTfChoice !== null || isProcessingAnswer}
                      onClick={() => handleSelectTf(true)}
                      className={`p-6 rounded-2xl border flex flex-col items-center gap-3 transition-all cursor-pointer disabled:opacity-40 ${
                        selectedTfChoice === true
                          ? (currentQuestion as TfQuestion).answer === true
                            ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 gold-glow'
                            : 'bg-rose-950/80 border-rose-500 text-rose-200'
                          : 'bg-[#101018] border-slate-800 text-slate-200 hover:border-emerald-500/50'
                      }`}
                    >
                      <Check className="w-10 h-10 text-emerald-400" />
                      <span className="text-xl font-bold font-display">صحيح ✓</span>
                    </button>
                    <button
                      disabled={selectedTfChoice !== null || isProcessingAnswer}
                      onClick={() => handleSelectTf(false)}
                      className={`p-6 rounded-2xl border flex flex-col items-center gap-3 transition-all cursor-pointer disabled:opacity-40 ${
                        selectedTfChoice === false
                          ? (currentQuestion as TfQuestion).answer === false
                            ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 gold-glow'
                            : 'bg-rose-950/80 border-rose-500 text-rose-200'
                          : 'bg-[#101018] border-slate-800 text-slate-200 hover:border-rose-500/50'
                      }`}
                    >
                      <X className="w-10 h-10 text-rose-400" />
                      <span className="text-xl font-bold font-display">خطأ ✗</span>
                    </button>
                  </div>
                  {isAnswerRevealed && (
                    <div className="p-3.5 rounded-2xl bg-[#12121A] border border-[#D4AF37]/30 text-xs md:text-sm text-slate-300 text-center">
                      <strong className="text-[#F5D77A]">💡 التعليل: </strong>
                      {(currentQuestion as TfQuestion).explanation}
                    </div>
                  )}
                </div>
              )}

              {currentQuestion.type === 'fill' && (
                <div>
                  <div className="text-center mb-2">
                    <span className="text-xs font-bold text-[#F5D77A] px-3 py-1 rounded-full bg-black/40 border border-[#D4AF37]/30">
                      {(currentQuestion as FillQuestion).kind || 'أكمل الناقص'}
                    </span>
                  </div>
                  <h3 className="question-text text-slate-100 mb-6 text-center leading-loose">
                    {(currentQuestion as FillQuestion).text.replace('____', isAnswerRevealed ? `[ ${(currentQuestion as FillQuestion).answer} ]` : '[ ________ ]')}
                  </h3>
                  {isAnswerRevealed && (
                    <div className="p-4 rounded-2xl bg-[#12121A] border border-[#D4AF37]/50 text-center animate-in fade-in">
                      <span className="text-xs text-slate-400 block mb-1">الكلمة الناقصة:</span>
                      <span className="answer-text text-2xl font-bold text-[#F5D77A]">
                        {(currentQuestion as FillQuestion).answer}
                      </span>
                      <p className="text-xs text-slate-300 mt-2">
                        {(currentQuestion as FillQuestion).explanation}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {currentQuestion.type === 'match' && (
                <div>
                  <h4 className="text-sm md:text-base font-bold text-[#F5D77A] text-center mb-4">
                    {(currentQuestion as MatchQuestion).title}
                  </h4>
                  <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto mb-4">
                    <div className="flex flex-col gap-2.5">
                      {matchRightItems.map((item, idx) => {
                        const conn = connections.find(c => c.rightIdx === idx);
                        const isSelected = selectedRightIdx === idx;
                        return (
                          <div
                            key={idx}
                            onClick={() => handleSelectMatchCard('right', idx)}
                            style={{ borderColor: conn ? conn.color : undefined }}
                            className={`p-3 rounded-xl border text-center text-xs md:text-sm font-semibold cursor-pointer transition-all ${
                              conn ? 'bg-[#181824] shadow-md font-bold' :
                              isSelected ? 'bg-[#D4AF37] text-slate-950 border-[#D4AF37] font-bold' :
                              'bg-[#101018] border-slate-800 text-slate-200 hover:border-slate-700'
                            }`}
                          >
                            {item.text}
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
                            onClick={() => handleSelectMatchCard('left', idx)}
                            style={{ borderColor: conn ? conn.color : undefined }}
                            className={`p-3 rounded-xl border text-center text-xs md:text-sm font-semibold cursor-pointer transition-all ${
                              conn ? 'bg-[#181824] shadow-md font-bold' :
                              selectedRightIdx !== null ? 'bg-[#151522] border-[#D4AF37]/50 hover:border-[#D4AF37]' :
                              'bg-[#101018] border-slate-800 text-slate-200'
                            }`}
                          >
                            {item.text}
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
                        className="py-2.5 px-8 rounded-xl font-bold text-slate-950 bg-[#D4AF37] hover:brightness-110 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-xs md:text-sm gold-glow"
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
                    <span className="text-xs text-slate-400">خمّن الشيء أو الشخصية من 5 تلميحات:</span>
                    <span className="px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#F5D77A] font-bold text-xs">
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
                              ? 'bg-[#12121A] border-[#D4AF37]/40 text-slate-100 font-medium'
                              : 'bg-black/30 border-slate-900 text-slate-600 opacity-40'
                          }`}
                        >
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isRevealed ? 'bg-[#D4AF37] text-slate-950' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {idx + 1}
                          </span>
                          <span className="text-xs md:text-sm flex-1 leading-relaxed">
                            {isRevealed ? hint : 'تلميح مغلق (سيتكشف قريباً أو بالنقر)...'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      disabled={revealedHintsCount >= 5 || isAnswerRevealed}
                      onClick={handleRevealNextHint}
                      className="py-2 px-4 rounded-xl bg-slate-900 border border-slate-700 text-xs font-semibold text-[#F5D77A] hover:bg-slate-800 cursor-pointer disabled:opacity-40"
                    >
                      كشف تلميح تالي (-1 نقطة)
                    </button>
                    {isAnswerRevealed && (
                      <div className="answer-text font-bold text-lg text-[#F5D77A]">
                        الإجابة: {(currentQuestion as HintsQuestion).answer}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* LIFELINES DOCK */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-semibold hidden sm:inline">وسائل المساعدة:</span>
                
                <button
                  disabled={activePlayer.lifelines.letter || usedLifelineThisQuestion || isAnswerRevealed}
                  onClick={handleUseLetterLifeline}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    activePlayer.lifelines.letter 
                      ? 'bg-black/40 border-slate-900 text-slate-600 opacity-40 cursor-not-allowed'
                      : 'bg-[#12121A] border-[#D4AF37]/40 text-[#F5D77A] hover:bg-[#1A1A26]'
                  }`}
                  title={currentQuestion.type === 'mcq' ? 'حذف خيارين خاطئين (50:50)' : 'كشف الحرف الأول'}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{currentQuestion.type === 'mcq' ? 'حذف خيارين' : 'الحرف الأول'}</span>
                  {activePlayer.lifelines.letter && <span className="text-[10px]">✓</span>}
                </button>

                <button
                  disabled={activePlayer.lifelines.extraTime || usedLifelineThisQuestion || isAnswerRevealed}
                  onClick={handleUseExtraTimeLifeline}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    activePlayer.lifelines.extraTime 
                      ? 'bg-black/40 border-slate-900 text-slate-600 opacity-40 cursor-not-allowed'
                      : 'bg-[#12121A] border-sky-500/40 text-sky-300 hover:bg-[#1A1A26]'
                  }`}
                  title="إضافة 15 ثانية للمؤقت"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>وقت إضافي</span>
                  {activePlayer.lifelines.extraTime && <span className="text-[10px]">✓</span>}
                </button>

                <button
                  disabled={activePlayer.lifelines.friend || usedLifelineThisQuestion || isAnswerRevealed}
                  onClick={handleUseFriendLifeline}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    activePlayer.lifelines.friend 
                      ? 'bg-black/40 border-slate-900 text-slate-600 opacity-40 cursor-not-allowed'
                      : 'bg-[#12121A] border-purple-500/40 text-purple-300 hover:bg-[#1A1A26]'
                  }`}
                  title="استشارة صديق لمدة 20 ثانية"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>استشارة صديق</span>
                  {activePlayer.lifelines.friend && <span className="text-[10px]">✓</span>}
                </button>
              </div>

              <button
                disabled={activePlayer.skips >= 2 || isProcessingAnswer}
                onClick={handleSkipQuestion}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  activePlayer.skips >= 2
                    ? 'bg-black/40 border-slate-900 text-slate-600 opacity-40 cursor-not-allowed'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                <SkipForward className="w-3.5 h-3.5" />
                <span>تخطي ({2 - activePlayer.skips})</span>
              </button>
            </div>
          </div>

          {/* HOST JUDGMENT BUTTONS */}
          {(currentQuestion.type === 'direct' || currentQuestion.type === 'fill' || currentQuestion.type === 'hints') && (
            <div className="grid grid-cols-3 gap-3 my-2">
              <button
                disabled={isProcessingAnswer}
                onClick={() => {
                  const pts = currentQuestion.type === 'hints' ? getHintsCurrentPoints() : 1;
                  awardPointsAndAdvance(true, pts);
                }}
                className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer font-display text-base disabled:opacity-40"
              >
                <Check className="w-5 h-5" />
                <span>إجابة صحيحة ✓</span>
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  setIsAnswerRevealed(prev => !prev);
                }}
                className="py-3 px-4 rounded-2xl bg-[#12121A] hover:bg-[#1A1A26] border border-slate-700 text-slate-200 flex items-center justify-center gap-2 transition-all cursor-pointer text-xs md:text-sm font-semibold"
              >
                <Eye className="w-4 h-4 text-[#D4AF37]" />
                <span>{isAnswerRevealed ? 'إخفاء الإجابة' : 'إظهار الإجابة'}</span>
              </button>

              <button
                disabled={isProcessingAnswer}
                onClick={() => awardPointsAndAdvance(false, 0)}
                className="py-3 px-4 rounded-2xl bg-rose-700 hover:bg-rose-600 active:scale-[0.98] font-bold text-white flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer font-display text-base disabled:opacity-40"
              >
                <X className="w-5 h-5" />
                <span>إجابة خاطئة ✗</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. SCREEN: VICTORY / RESULTS */}
      {/* ========================================================= */}
      {currentScreen === 'VICTORY' && (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center max-w-4xl mx-auto w-full">
          <div className="glass-card p-8 md:p-12 rounded-3xl border border-[#D4AF37]/40 gold-glow shadow-2xl w-full">
            {/* 1. SOLO VICTORY / LOSS RESULT */}
            {gameMode === 'solo' ? (
              <div>
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#D4AF37]/20 border-2 border-[#D4AF37] flex items-center justify-center gold-glow">
                  {players[0].score >= targetScore ? (
                    <Trophy className="w-10 h-10 text-[#F5D77A] animate-bounce" />
                  ) : (
                    <HeartCrack className="w-10 h-10 text-rose-400" />
                  )}
                </div>

                <span className="text-xs font-bold text-[#F5D77A] tracking-widest uppercase">
                  {players[0].score >= targetScore ? 'انتصار مستحق!' : 'انتهت المحاولة!'}
                </span>

                <h2 className="text-3xl md:text-5xl font-extrabold font-display gold-text-gradient my-3">
                  {players[0].score >= targetScore 
                    ? `تهانينا ${players[0].name}! بلغت القمة!` 
                    : `محاولة شجاعة يا ${players[0].name}!`}
                </h2>

                {isNewSoloRecord && (
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 font-bold text-xs mb-6 gold-glow animate-pulse">
                    <Trophy className="w-4 h-4 text-[#F5D77A]" />
                    <span>رقم قياسي جديد مسجل باسمك! 🏆</span>
                  </div>
                )}

                {/* Solo Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto mb-8 text-center">
                  <div className="p-3.5 rounded-2xl bg-[#0E0E16] border border-slate-800">
                    <span className="text-[11px] text-slate-400 block mb-1">النقاط المحققة</span>
                    <span className="text-2xl font-bold font-display text-[#F5D77A]">{players[0].score}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#0E0E16] border border-slate-800">
                    <span className="text-[11px] text-slate-400 block mb-1">الأسئلة المجابة</span>
                    <span className="text-2xl font-bold font-display text-white">{soloQuestionsAnswered + 1}</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#0E0E16] border border-slate-800">
                    <span className="text-[11px] text-slate-400 block mb-1">الوقت المستغرق</span>
                    <span className="text-2xl font-bold font-display text-sky-400">{soloFinalTimeSeconds} ث</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#0E0E16] border border-slate-800">
                    <span className="text-[11px] text-slate-400 block mb-1">أطول سلسلة</span>
                    <span className="text-2xl font-bold font-display text-amber-400">{players[0].bestStreak} 🔥</span>
                  </div>
                </div>
              </div>
            ) : (
              /* 2. MULTIPLAYER VICTORY PODIUM */
              <div>
                <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-[#D4AF37]/20 border-2 border-[#D4AF37] flex items-center justify-center gold-glow">
                  <Crown className="w-10 h-10 text-[#F5D77A] animate-bounce" />
                </div>

                <span className="text-xs font-bold text-[#F5D77A] tracking-widest uppercase">
                  تتويج بطل التحدي
                </span>

                {/* Ranked Players List */}
                {(() => {
                  const sorted = [...players].sort((a, b) => b.score - a.score);
                  const winner = sorted[0];
                  return (
                    <div>
                      <h2 className="text-3xl md:text-5xl font-extrabold font-display gold-text-gradient my-2">
                        فوز {winner.name}!
                      </h2>
                      <p className="text-xs md:text-sm text-slate-300 mb-6">
                        برصيد {winner.score} نقطة في منافسة شيقة بين {players.length} لاعبين!
                      </p>

                      {/* Luxury Podium Display */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto mb-8">
                        {sorted.map((p, idx) => {
                          const rankLabels = ['المركز الأول 🥇', 'المركز الثاني 🥈', 'المركز الثالث 🥉', 'المركز الرابع 🎖️'];
                          const color = PLAYER_COLORS[p.colorIndex];
                          return (
                            <div 
                              key={p.id}
                              className={`p-4 rounded-2xl border text-center ${idx === 0 ? 'bg-[#151522] border-[#D4AF37] gold-glow' : 'bg-[#0E0E16] border-slate-800'}`}
                            >
                              <span className="text-[10px] text-slate-400 block mb-1 font-bold">{rankLabels[idx]}</span>
                              <span className={`text-sm font-bold block truncate ${color.text}`}>{p.name}</span>
                              <span className="text-2xl font-bold font-display text-white mt-1 block">{p.score} ن</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Detailed Stats Table */}
                <div className="p-4 rounded-2xl bg-[#0E0E16] border border-slate-800 mb-8 max-w-2xl mx-auto text-right text-xs">
                  <div className="font-bold text-[#F5D77A] mb-2 pb-2 border-b border-slate-800">
                    جدول إحصائيات اللاعبين:
                  </div>
                  <div className="space-y-3">
                    {players.map(p => {
                      const color = PLAYER_COLORS[p.colorIndex];
                      return (
                        <div key={p.id} className="p-2.5 rounded-xl bg-black/40 border border-slate-800/80">
                          <div className="flex justify-between items-center mb-1">
                            <span className={`font-bold ${color.text}`}>{p.name}</span>
                            <span className="font-bold text-white">{p.score} نقطة</span>
                          </div>
                          <div className="flex justify-between text-slate-400 text-[11px] mb-1">
                            <span>صحيحة: {p.correctCount}</span>
                            <span>أطول سلسلة: {p.bestStreak} 🔥</span>
                            <span>الرهانات: {p.bets}/2</span>
                            <span>التخطي: {p.skips}/2</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1 pt-1 border-t border-slate-800/40">
                            {QUESTION_MODES.map(m => (
                              <span key={m.id} className="px-1.5 py-0.5 rounded bg-black/60 text-[9px] text-slate-400">
                                {m.shortName}: {p.correctByType[m.id] || 0}
                              </span>
                            ))}
                          </div>
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
                className="py-3 px-8 rounded-2xl font-bold text-slate-950 bg-gradient-to-r from-[#F5D77A] via-[#D4AF37] to-[#B8902B] hover:brightness-110 active:scale-[0.98] transition-all shadow-lg gold-glow cursor-pointer font-display text-base"
              >
                إعادة اللعب بنفس الإعدادات
              </button>

              <button
                onClick={() => {
                  if (gameMode === 'solo') {
                    const msg = `حققتُ ${players[0].score} نقطة في ${soloQuestionsAnswered + 1} سؤالاً في تحدي الثلاثين! هل تستطيع كسر رقمي؟`;
                    handleShareGame(msg);
                  } else {
                    const sorted = [...players].sort((a, b) => b.score - a.score);
                    const winner = sorted[0];
                    const msg = `فاز ${winner.name} بـ ${winner.score} نقطة في تحدي الثلاثين بين ${players.length} لاعبين! جرّب أن تهزمنا!`;
                    handleShareGame(msg);
                  }
                }}
                className="py-3 px-6 rounded-2xl bg-[#12121A] hover:bg-[#1A1A26] border border-[#D4AF37]/50 text-[#F5D77A] text-sm font-bold flex items-center justify-center gap-2 cursor-pointer gold-glow"
              >
                <Share2 className="w-4 h-4 text-[#D4AF37]" />
                <span>شارك النتيجة</span>
              </button>

              <button
                onClick={() => {
                  sounds.playClick();
                  setCurrentScreen('SETUP');
                }}
                className="py-3 px-6 rounded-2xl bg-[#12121A] hover:bg-[#1A1A26] border border-slate-800 text-slate-300 text-sm font-semibold cursor-pointer"
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

      {/* SHARE MODAL */}
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
          <div className="glass-card max-w-md w-full p-6 md:p-8 rounded-3xl border border-[#D4AF37]/40 shadow-2xl text-right animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Share2 className="w-5 h-5 text-[#D4AF37]" />
                <h3 id="shareModalTitle" className="text-xl font-bold font-display gold-text-gradient">
                  مشاركة اللعبة
                </h3>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
                aria-label="إغلاق نافذة المشاركة"
              >
                ✕
              </button>
            </div>

            {window.location.protocol === 'file:' && (
              <div className="p-3 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                ⚠️ تنبيه: ارفع اللعبة على استضافة ليعمل الرابط عند الآخرين.
              </div>
            )}

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              {shareCustomText}
            </p>

            {/* Link Copy Box */}
            <div className="mb-6">
              <label className="block text-[11px] font-bold text-[#F5D77A] mb-1.5">
                رابط التحدي المباشر:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={getComputedShareUrl()}
                  dir="ltr"
                  className="flex-1 bg-[#0B0B12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 rounded-xl bg-[#D4AF37] hover:brightness-110 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                >
                  {isCopied ? <CheckCheck className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4 text-slate-950" />}
                  <span>{isCopied ? 'تم النسخ ✓' : 'نسخ'}</span>
                </button>
              </div>
            </div>

            {/* Social Share Buttons */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-3">
                المشاركة الفورية عبر التطبيقات:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareCustomText + '\n' + getComputedShareUrl())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-[#12121A] hover:bg-emerald-950/60 border border-slate-800 hover:border-emerald-500/50 flex items-center justify-center gap-2 text-xs text-emerald-300 transition-all font-semibold"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>واتساب</span>
                </a>

                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(getComputedShareUrl())}&text=${encodeURIComponent(shareCustomText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-[#12121A] hover:bg-sky-950/60 border border-slate-800 hover:border-sky-500/50 flex items-center justify-center gap-2 text-xs text-sky-300 transition-all font-semibold"
                >
                  <Send className="w-4 h-4 text-sky-400" />
                  <span>تيليجرام</span>
                </a>

                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareCustomText)}&url=${encodeURIComponent(getComputedShareUrl())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-[#12121A] hover:bg-slate-800 border border-slate-800 hover:border-slate-500 flex items-center justify-center gap-2 text-xs text-slate-200 transition-all font-semibold"
                >
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                  <span>إكس (X)</span>
                </a>

                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getComputedShareUrl())}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-[#12121A] hover:bg-blue-950/60 border border-slate-800 hover:border-blue-500/50 flex items-center justify-center gap-2 text-xs text-blue-300 transition-all font-semibold"
                >
                  <ExternalLink className="w-4 h-4 text-blue-400" />
                  <span>فيسبوك</span>
                </a>

                <a
                  href={`mailto:?subject=${encodeURIComponent('تحدي الثلاثين - لعبة المسابقات الفكرية')}&body=${encodeURIComponent(shareCustomText + '\n\n' + getComputedShareUrl())}`}
                  className="p-2.5 rounded-xl bg-[#12121A] hover:bg-amber-950/60 border border-slate-800 hover:border-amber-500/50 flex items-center justify-center gap-2 text-xs text-amber-300 transition-all font-semibold sm:col-span-2"
                >
                  <Mail className="w-4 h-4 text-amber-400" />
                  <span>البريد الإلكتروني</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WAGER ROUND MODAL */}
      {wagerModalOpen && currentQuestion && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-3xl border border-purple-500/40 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-purple-950/60 border-2 border-purple-400 flex items-center justify-center text-purple-300">
              <Zap className="w-8 h-8 text-yellow-300 animate-pulse" />
            </div>
            <span className="text-xs font-bold text-purple-300 tracking-wider">
              قرار تكتيكي قبل بدء السؤال
            </span>
            <h3 className="text-2xl font-bold font-display text-white mt-1 mb-2">
              جولة الرهان (×2)
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              الدور على <strong className={activeColor.text}>{activePlayer.name}</strong>.<br />
              التصنيف: <strong>{currentQuestion.category}</strong> · النمط: <strong>{QUESTION_MODES.find(m => m.id === currentQuestion.type)?.name}</strong>
            </p>

            <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/40 text-xs text-purple-200 mb-6">
              الصحيح يمنح <strong className="text-yellow-300">+2 نقطة</strong> · والخطأ يخصم <strong className="text-rose-400">-2 نقطة</strong>
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
                onClick={() => {
                  sounds.playClick();
                  setIsCurrentQuestionWager(false);
                  setWagerModalOpen(false);
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs md:text-sm font-semibold cursor-pointer"
              >
                لعب عادي (1 نقطة)
              </button>
            </div>
            {gameMode !== 'solo' && activePlayer.score < 2 && activePlayer.bets < 2 && (
              <p className="text-[11px] text-amber-400 mt-2">
                يتطلب الرهان رصيد نقطتين على الأقل للمخاطرة.
              </p>
            )}
          </div>
        </div>
      )}

      {/* FRIEND CONSULTATION MODAL */}
      {isFriendModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-sm w-full p-6 rounded-3xl border border-purple-500/50 text-center animate-in zoom-in-95">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-purple-900/40 border-2 border-purple-400 flex items-center justify-center">
              <PhoneCall className="w-8 h-8 text-purple-300 animate-pulse" />
            </div>
            <h3 className="text-xl font-bold font-display text-white mb-1">
              استشارة صديق
            </h3>
            <p className="text-xs text-slate-300 mb-4">
              المؤقت الرئيسي متوقف. لديكم 20 ثانية للنقاش!
            </p>
            <div className="text-5xl font-extrabold font-mono text-[#F5D77A] mb-6">
              {friendTimeRemaining} <span className="text-sm font-sans">ث</span>
            </div>
            <button
              onClick={() => {
                sounds.playClick();
                setIsFriendModalOpen(false);
                resumeTimer();
              }}
              className="w-full py-3 rounded-xl bg-[#D4AF37] text-slate-950 font-bold text-xs hover:brightness-110 cursor-pointer"
            >
              إنهاء الاستشارة واستئناف السؤال
            </button>
          </div>
        </div>
      )}

      {/* RULES MODAL */}
      {isRulesModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full p-6 md:p-8 rounded-3xl border border-[#D4AF37]/30 text-right max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
              <h3 className="text-xl font-bold font-display gold-text-gradient">
                قواعد وأنماط تحدي الثلاثين
              </h3>
              <button
                onClick={() => setIsRulesModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="text-xs md:text-sm text-slate-300 space-y-3 leading-relaxed">
              <p><strong>1) أنماط اللاعبين:</strong><br/>
                • <strong>فردي:</strong> 5 أرواح، خسارة روح عند الخطأ أو انتهاء الوقت، واستعادة روح عند السلسلة (+1). تسعى لـ 30 نقطة بأقل عدد أسئلة.<br/>
                • <strong>فريقان / 3 / 4 لاعبين:</strong> تناوب دائري بالترتيب، رهان وسلسلة ووسائل لكل لاعب.<br/>
                • <strong>إكمال الجولة:</strong> عند وصول أحدهم لـ 30 يُكمل باقي اللاعبين أدوارهم لضمان تكافؤ الفرص.<br/>
                • <strong>الموت المفاجئ:</strong> عند التعادل في الصدارة، تقام جولة فاصلة بين المتعادلين فقط.
              </p>
              <p><strong>2) أنماط الأسئلة الستة:</strong> مباشر، اختيارات، صح أو خطأ، أكمل الناقص، المطابقة، وخمّن من التلميحات.</p>
              <p><strong>3) الرهان (×2):</strong> رهانان لكل لاعب؛ الصحيح يضاعف النقاط والخطأ يخصم نقطتين (وروحاً في الفردي).</p>
              <p><strong>4) السلسلة:</strong> 3 إجابات صحيحة متتالية تمنح +1 نقطة إضافية فوراً.</p>
              <p><strong>5) الثيم:</strong> اضغط <strong>T</strong> لتبديل الثيم فوراً في أي لحظة.</p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsRulesModalOpen(false)}
                className="py-2.5 px-6 rounded-xl bg-[#D4AF37] text-slate-950 font-bold text-xs hover:brightness-110 cursor-pointer"
              >
                فهمت، جاهزون!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAUSE MODAL */}
      {isPauseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-sm w-full p-6 rounded-3xl border border-[#D4AF37]/30 text-center">
            <h3 className="text-xl font-bold font-display text-white mb-4">
              اللعبة متوقفة مؤقتاً
            </h3>
            <button
              onClick={() => {
                sounds.playClick();
                setIsPauseModalOpen(false);
                resumeTimer();
              }}
              className="w-full py-3 rounded-xl bg-[#D4AF37] text-slate-950 font-bold text-xs hover:brightness-110 cursor-pointer"
            >
              استئناف اللعب
            </button>
          </div>
        </div>
      )}

      {/* QUIT MODAL */}
      {isQuitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-sm w-full p-6 rounded-3xl border border-rose-500/30 text-center">
            <h3 className="text-xl font-bold font-display text-white mb-2">
              هل تريد إنهاء التحدي؟
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              سيتم إنهاء الجلسة والعودة للقائمة الرئيسية.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  sounds.playClick();
                  stopTimer();
                  setIsQuitModalOpen(false);
                  setCurrentScreen('SPLASH');
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-500 cursor-pointer"
              >
                تأكيد الخروج
              </button>
              <button
                onClick={() => {
                  sounds.playClick();
                  setIsQuitModalOpen(false);
                  resumeTimer();
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700 cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
