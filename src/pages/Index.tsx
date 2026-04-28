import { useState, useEffect, useRef, useCallback } from "react";

const BLAZE_IMG = "https://cdn.poehali.dev/projects/021d657a-82ce-4830-bad8-b52f594f6aa2/bucket/4c097f9a-91af-425e-9ab9-64bfeb8b7d7b.jpg";
const OGURCHIK_IMG = "https://cdn.poehali.dev/projects/021d657a-82ce-4830-bad8-b52f594f6aa2/bucket/b89b982f-c7a0-41a5-a56a-78cdd053ab5e.jpg";
const LUNTIK_IMG = "https://cdn.poehali.dev/projects/021d657a-82ce-4830-bad8-b52f594f6aa2/bucket/4151adb6-a01e-4b20-93e5-a2c1adef949e.jpg";
const RYG_IMG = "https://cdn.poehali.dev/projects/021d657a-82ce-4830-bad8-b52f594f6aa2/bucket/58e8fdfc-76d4-479b-8b3b-ca672caeb458.jpg";
const BLAZE_EXE_IMG = "https://cdn.poehali.dev/projects/021d657a-82ce-4830-bad8-b52f594f6aa2/bucket/c5007675-8ae4-4709-8273-35da5f74df87.jpg";
const KRUSHILA_IMG = "https://cdn.poehali.dev/projects/021d657a-82ce-4830-bad8-b52f594f6aa2/files/d218fe4b-c577-40ea-8a4f-9cd87cd232cc.jpg";

type Tab = "earn" | "shop" | "achievements" | "news" | "promo" | "settings";

interface GameState {
  coins: number;
  totalClicks: number;
  characterClicks: number;
  characterIndex: number;
  clickUpgrade: number;
  passiveUpgrade: number;
  purchasedItems: string[];
  achievements: string[];
  musicEnabled: boolean;
  clickMultiplier: number;
  usedPromocodes: string[];
  hasExeChar: boolean;
  selectedCharIdx: number | null;
  welcomeShown: boolean;
}

const CHARACTERS = [
  { name: "Вспыш", img: BLAZE_IMG, threshold: 100, color: "#FF6B35" },
  { name: "Огурчик", img: OGURCHIK_IMG, threshold: 250, color: "#4CAF50" },
  { name: "Крушила", img: KRUSHILA_IMG, threshold: 300, color: "#FFC107" },
  { name: "Лунтик", img: LUNTIK_IMG, threshold: 500, color: "#B39DDB" },
  { name: "Рыг", img: RYG_IMG, threshold: Infinity, color: "#00E676" },
];

const EXE_CHARACTER = { name: "ВСПЫШ ЕХЕ", img: BLAZE_EXE_IMG, color: "#FF0000" };

const SHOP_ITEMS = [
  { id: "pot", name: "Кастрюля", emoji: "🍲", price: 50, desc: "Кастрюля.", ach: "pot_bought" },
  { id: "multicooker", name: "Мультиварка", emoji: "🫕", price: 125, desc: "Очень полезная в готовке.", ach: "multicooker_bought" },
  { id: "knife", name: "Нож", emoji: "🔪", price: 175, desc: "Очень опасен не только в нападении, но и при резке чего-либо.", ach: "knife_bought" },
  { id: "tv", name: "Телевизор", emoji: "📺", price: 275, desc: "Всегда весело посмотреть телевизор вечером!", ach: "tv_bought" },
  { id: "glasses", name: "Очки", emoji: "👓", price: 128, desc: "У тебя зрение ниже нормы?", ach: "glasses_bought", boost: true },
  { id: "blaze_pen", name: "Ручка Вспыша", emoji: "✒️", price: 666, desc: "ЭКСКЛЮЗИВ!", ach: "blaze_pen_bought" },
  { id: "toilet", name: "Унитаз", emoji: "🚽", price: 350, desc: "скибиди доп доп.", ach: "toilet_bought" },
  { id: "pillow", name: "Подушка", emoji: "🛏️", price: 186, desc: "баю Бай засыпай.", ach: "pillow_bought" },
  { id: "socks", name: "Носки", emoji: "🧦", price: 444, desc: "noski🥳", ach: "socks_bought" },
  { id: "mouse", name: "Компьютерная мышка", emoji: "🖱️", price: 500, desc: "Клик-клик.", ach: "mouse_bought" },
];

const ACHIEVEMENTS_DATA: Record<string, { name: string; desc: string; emoji: string }> = {
  pot_bought: { name: "Это не ведро!", desc: "Купи кастрюлю.", emoji: "🍲" },
  multicooker_bought: { name: "Сам варить не умеешь?", desc: "Купи мультиварку.", emoji: "🫕" },
  knife_bought: { name: "Ты осторожней будь!", desc: "Купи нож.", emoji: "🔪" },
  tv_bought: { name: "Любишь залипать?", desc: "Купи телек.", emoji: "📺" },
  glasses_bought: { name: "Четыре глаза!", desc: "Купи очки.", emoji: "👓" },
  blaze_pen_bought: { name: "И ЧУДО МАШИНКИ!", desc: "Купи ручку вспыша.", emoji: "✒️" },
  toilet_bought: { name: "скибиди", desc: "Купи унитаз.", emoji: "🚽" },
  pillow_bought: { name: "😴", desc: "Купи подушку.", emoji: "🛏️" },
  socks_bought: { name: "🧦", desc: "Купи носки.", emoji: "🧦" },
  mouse_bought: { name: "🖱️", desc: "Купи компьютерную мышку.", emoji: "🖱️" },
};

const UPGRADE_BASE_COSTS = { click: 25, passive: 50 };

function getUpgradeCost(base: number, level: number) {
  return Math.floor(base * Math.pow(1.5, level));
}

const SAVE_KEY = "monetoclicker_save_v2";

function loadGame(): GameState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { void e; }
  return {
    coins: 0, totalClicks: 0, characterClicks: 0, characterIndex: 0,
    clickUpgrade: 1, passiveUpgrade: 0, purchasedItems: [],
    achievements: [], musicEnabled: true, clickMultiplier: 1,
    usedPromocodes: [], hasExeChar: false,
    selectedCharIdx: null, welcomeShown: false,
  };
}

function saveGame(state: GameState) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

interface CoinPopup { id: number; x: number; y: number; value: number; }
interface ToastAch { id: number; achKey: string; }

const EmojiBg = () => {
  const items = [
    { id: 0, emoji: "💰", x: 5, y: 10, delay: 0, size: 1.5 },
    { id: 1, emoji: "🤑", x: 15, y: 80, delay: 0.5, size: 1.2 },
    { id: 2, emoji: "💵", x: 25, y: 30, delay: 1, size: 1.8 },
    { id: 3, emoji: "🪙", x: 35, y: 65, delay: 1.5, size: 1.3 },
    { id: 4, emoji: "💲", x: 45, y: 20, delay: 2, size: 1.6 },
    { id: 5, emoji: "💰", x: 55, y: 75, delay: 0.3, size: 1.4 },
    { id: 6, emoji: "🤑", x: 65, y: 40, delay: 0.8, size: 1.7 },
    { id: 7, emoji: "💵", x: 75, y: 85, delay: 1.2, size: 1.1 },
    { id: 8, emoji: "🪙", x: 85, y: 15, delay: 1.7, size: 1.9 },
    { id: 9, emoji: "💲", x: 95, y: 55, delay: 2.2, size: 1.3 },
    { id: 10, emoji: "💰", x: 10, y: 50, delay: 0.6, size: 1.2 },
    { id: 11, emoji: "🤑", x: 90, y: 30, delay: 1.4, size: 1.5 },
    { id: 12, emoji: "💵", x: 50, y: 90, delay: 2.5, size: 1.4 },
    { id: 13, emoji: "🪙", x: 70, y: 5, delay: 0.2, size: 1.6 },
    { id: 14, emoji: "💲", x: 30, y: 95, delay: 1.9, size: 1.2 },
  ];
  return (
    <div className="emoji-bg">
      {items.map(item => (
        <span key={item.id} style={{
          left: `${item.x}%`, top: `${item.y}%`,
          animationDelay: `${item.delay}s`,
          fontSize: `${item.size}rem`,
        }}>{item.emoji}</span>
      ))}
    </div>
  );
};

const Preloader = ({ onDone }: { onDone: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(timer);
          setTimeout(() => { setFade(true); setTimeout(onDone, 600); }, 300);
          return 100;
        }
        return p + 2;
      });
    }, 40);
    return () => clearInterval(timer);
  }, [onDone]);

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-700 ${fade ? "opacity-0" : "opacity-100"}`}
      style={{ background: "linear-gradient(135deg, #0d0f1a 0%, #12151f 50%, #0a0c14 100%)" }}>
      <EmojiBg />
      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className="text-7xl" style={{ animation: "float 2s ease-in-out infinite", filter: "drop-shadow(0 0 30px gold)" }}>💰</div>
        <div className="text-center">
          <h1 className="text-4xl font-black text-white mb-1" style={{ fontFamily: "Montserrat, sans-serif", letterSpacing: "-1px" }}>
            <span style={{ background: "linear-gradient(90deg, #FFD700, #FF9500)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>МонетоКликер</span>
          </h1>
          <p className="text-sm" style={{ color: "hsl(220 10% 55%)" }}>кликай и богатей 🤑</p>
        </div>
        <div className="w-64 h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
          <div className="h-full rounded-full transition-all duration-75"
            style={{ width: `${progress}%`, background: "linear-gradient(90deg, #FFD700, #FF9500)", boxShadow: "0 0 12px #FFD700" }} />
        </div>
        <div className="flex gap-3 text-3xl">
          {["💰","🤑","💵","🪙","💲"].map((e, i) => (
            <span key={i} style={{ animationDelay: `${i * 0.3}s`, animation: "glow-pulse 1.5s ease-in-out infinite" }}>{e}</span>
          ))}
        </div>
        <p className="text-xs font-medium" style={{ color: "hsl(220 10% 45%)" }}>Загрузка... {progress}%</p>
      </div>
    </div>
  );
};

function useBgMusic(enabled: boolean) {
  const ctxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ osc: OscillatorNode; gain: GainNode }[]>([]);
  const masterRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const MELODY = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
  const CHORD_PROG = [
    [261.63, 329.63, 392.00],
    [293.66, 349.23, 440.00],
    [329.63, 392.00, 493.88],
    [261.63, 329.63, 392.00],
  ];

  const stopMusic = useCallback(() => {
    nodesRef.current.forEach(({ osc, gain }) => {
      try { gain.gain.setTargetAtTime(0, ctxRef.current!.currentTime, 0.3); setTimeout(() => { try { osc.stop(); } catch { void 0; } }, 400); } catch { void 0; }
    });
    nodesRef.current = [];
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  const startMusic = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = new AudioContext();
    const ctx = ctxRef.current;
    if (ctx.state === "suspended") ctx.resume();

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.08, ctx.currentTime);
    master.connect(ctx.destination);
    masterRef.current = master;

    let chordIdx = 0;
    const playChord = () => {
      const chord = CHORD_PROG[chordIdx % CHORD_PROG.length];
      chord.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = i === 0 ? "sine" : "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.3 - i * 0.07, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(master);
        osc.start();
        nodesRef.current.push({ osc, gain });
        gain.gain.setTargetAtTime(0, ctx.currentTime + 1.5, 0.6);
        setTimeout(() => { try { osc.stop(); } catch { void 0; } nodesRef.current = nodesRef.current.filter(n => n.osc !== osc); }, 3500);
      });

      const mOsc = ctx.createOscillator();
      const mGain = ctx.createGain();
      mOsc.type = "sine";
      mOsc.frequency.setValueAtTime(MELODY[Math.floor(Math.random() * MELODY.length)], ctx.currentTime);
      mGain.gain.setValueAtTime(0, ctx.currentTime);
      mGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.2);
      mOsc.connect(mGain);
      mGain.connect(master);
      mOsc.start();
      nodesRef.current.push({ osc: mOsc, gain: mGain });
      mGain.gain.setTargetAtTime(0, ctx.currentTime + 0.8, 0.4);
      setTimeout(() => { try { mOsc.stop(); } catch { void 0; } nodesRef.current = nodesRef.current.filter(n => n.osc !== mOsc); }, 2500);

      chordIdx++;
    };

    playChord();
    intervalRef.current = setInterval(playChord, 2800);
  }, []);

  useEffect(() => {
    if (enabled) {
      startMusic();
    } else {
      stopMusic();
    }
    return stopMusic;
  }, [enabled, startMusic, stopMusic]);
}

export default function Index() {
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<Tab>("earn");
  const [promoInput, setPromoInput] = useState("");
  const [promoStatus, setPromoStatus] = useState<null | "success" | "already" | "error">(null);
  const [showCharSelect, setShowCharSelect] = useState(false);
  const [weatherValue, setWeatherValue] = useState<number | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [game, setGame] = useState<GameState>(loadGame);
  const [popups, setPopups] = useState<CoinPopup[]>([]);
  const [toasts, setToasts] = useState<ToastAch[]>([]);
  const [charAnim, setCharAnim] = useState(false);
  const [shakeCoins, setShakeCoins] = useState(false);
  const popupIdRef = useRef(0);
  const toastIdRef = useRef(0);
  const clickAreaRef = useRef<HTMLDivElement>(null);

  useBgMusic(loaded && game.musicEnabled);

  useEffect(() => {
    if (loaded && !game.welcomeShown) {
      setShowWelcome(true);
    }
  }, [loaded, game.welcomeShown]);

  const closeWelcome = () => {
    setShowWelcome(false);
    setGame(g => {
      const newG = { ...g, welcomeShown: true };
      saveGame(newG);
      return newG;
    });
  };

  useEffect(() => {
    if (game.passiveUpgrade === 0) return;
    const perSec = game.passiveUpgrade * game.clickMultiplier;
    const iv = setInterval(() => {
      setGame(g => {
        const newG = { ...g, coins: g.coins + perSec };
        saveGame(newG);
        return newG;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [game.passiveUpgrade, game.clickMultiplier]);

  const addAchievement = useCallback((key: string) => {
    setGame(g => {
      if (g.achievements.includes(key)) return g;
      const newG = { ...g, achievements: [...g.achievements, key] };
      saveGame(newG);
      const id = ++toastIdRef.current;
      setToasts(t => [...t, { id, achKey: key }]);
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
      return newG;
    });
  }, []);


  const playClickSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
      setTimeout(() => ctx.close(), 200);
    } catch { void 0; }
  }, []);

  const handleCharClick = (e: React.MouseEvent) => {
    playClickSound();
    const rect = clickAreaRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const earned = game.clickUpgrade * game.clickMultiplier;
      const id = ++popupIdRef.current;
      setPopups(p => [...p, { id, x, y, value: earned }]);
      setTimeout(() => setPopups(p => p.filter(pp => pp.id !== id)), 850);
    }

    setCharAnim(true);
    setTimeout(() => setCharAnim(false), 300);
    setShakeCoins(true);
    setTimeout(() => setShakeCoins(false), 400);

    setGame(g => {
      const earned = g.clickUpgrade * g.clickMultiplier;
      const newClicks = g.characterClicks + 1;
      const char = CHARACTERS[g.characterIndex];
      let newCharIdx = g.characterIndex;
      let newCharClicks = newClicks;
      if (newClicks >= char.threshold && g.characterIndex < CHARACTERS.length - 1) {
        newCharIdx = g.characterIndex + 1;
        newCharClicks = 0;
      }
      const newG = { ...g, coins: g.coins + earned, totalClicks: g.totalClicks + 1, characterClicks: newCharClicks, characterIndex: newCharIdx };
      saveGame(newG);
      return newG;
    });
  };

  const buyUpgrade = (type: "click" | "passive") => {
    setGame(g => {
      const lvl = type === "click" ? g.clickUpgrade - 1 : g.passiveUpgrade;
      const c = getUpgradeCost(UPGRADE_BASE_COSTS[type], lvl);
      if (g.coins < c) return g;
      if (type === "click" && g.clickUpgrade >= 5) return g;
      if (type === "passive" && g.passiveUpgrade >= 5) return g;
      const newG = {
        ...g,
        coins: g.coins - c,
        clickUpgrade: type === "click" ? g.clickUpgrade + 1 : g.clickUpgrade,
        passiveUpgrade: type === "passive" ? g.passiveUpgrade + 1 : g.passiveUpgrade,
      };
      saveGame(newG);
      return newG;
    });
  };

  const buyItem = (item: typeof SHOP_ITEMS[0]) => {
    if (game.coins < item.price || game.purchasedItems.includes(item.id)) return;
    setGame(g => {
      if (g.coins < item.price || g.purchasedItems.includes(item.id)) return g;
      const newMult = item.boost ? Math.round(g.clickMultiplier * 1.2 * 100) / 100 : g.clickMultiplier;
      const newG = { ...g, coins: g.coins - item.price, purchasedItems: [...g.purchasedItems, item.id], clickMultiplier: newMult };
      saveGame(newG);
      return newG;
    });
    addAchievement(item.ach);
  };

  const activatePromo = () => {
    const code = promoInput.trim().toUpperCase();
    const used = game.usedPromocodes || [];
    if (code === "EXE") {
      if (used.includes("EXE")) {
        setPromoStatus("already");
      } else {
        setGame(g => {
          const newG = { ...g, hasExeChar: true, usedPromocodes: [...(g.usedPromocodes || []), "EXE"] };
          saveGame(newG);
          return newG;
        });
        setPromoStatus("success");
        setPromoInput("");
      }
    } else if (code === "MONEY") {
      if (used.includes("MONEY")) {
        setPromoStatus("already");
      } else {
        setGame(g => {
          const newG = { ...g, coins: g.coins + 250, usedPromocodes: [...(g.usedPromocodes || []), "MONEY"] };
          saveGame(newG);
          return newG;
        });
        setPromoStatus("success");
        setPromoInput("");
      }
    } else {
      setPromoStatus("error");
    }
    setTimeout(() => setPromoStatus(null), 3000);
  };

  const allCharsUnlocked = game.characterIndex >= CHARACTERS.length - 1;
  const selectedIdx = game.selectedCharIdx;
  const baseChar = (allCharsUnlocked && selectedIdx !== null && selectedIdx >= 0 && selectedIdx < CHARACTERS.length)
    ? CHARACTERS[selectedIdx]
    : CHARACTERS[game.characterIndex];
  const char = game.hasExeChar ? { ...EXE_CHARACTER, threshold: baseChar.threshold } : baseChar;
  const nextChar = game.hasExeChar || allCharsUnlocked ? null : CHARACTERS[game.characterIndex + 1];
  const clickCost = getUpgradeCost(UPGRADE_BASE_COSTS.click, game.clickUpgrade - 1);
  const passiveCost = getUpgradeCost(UPGRADE_BASE_COSTS.passive, game.passiveUpgrade);
  const progressToNext = nextChar ? Math.min(game.characterClicks / CHARACTERS[game.characterIndex].threshold, 1) : 1;

  const TABS: { id: Tab; label: string; emoji: string }[] = [
    { id: "earn", label: "Заработок", emoji: "🤑" },
    { id: "shop", label: "Магазин", emoji: "🛒" },
    { id: "achievements", label: "Ачивки", emoji: "🏆" },
    { id: "news", label: "Новости", emoji: "📰" },
    { id: "promo", label: "Промокод", emoji: "🎁" },
    { id: "settings", label: "Настройки", emoji: "⚙️" },
  ];

  return (
    <>
      {!loaded && <Preloader onDone={() => setLoaded(true)} />}
      <div className={`fixed inset-0 flex flex-col transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
        style={{ background: "linear-gradient(135deg, #0d0f1a 0%, #10131c 50%, #0b0d16 100%)" }}>
        <EmojiBg />

        {/* Achievement toasts */}
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2" style={{ maxWidth: 280 }}>
          {toasts.map((t) => {
            const ach = ACHIEVEMENTS_DATA[t.achKey];
            if (!ach) return null;
            return (
              <div key={t.id} className="animate-achievement-in glass rounded-2xl px-4 py-3 flex items-center gap-3"
                style={{ border: "1px solid hsl(45 100% 55% / 0.5)", boxShadow: "0 8px 32px hsl(45 100% 55% / 0.3)" }}>
                <span className="text-2xl">{ach.emoji}</span>
                <div>
                  <p className="font-bold text-xs" style={{ color: "hsl(45 100% 65%)" }}>Новая ачивка!</p>
                  <p className="font-semibold text-sm text-white">{ach.name}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-5 pt-4 pb-2 flex-shrink-0">
          <div className="text-lg font-black" style={{ fontFamily: "Montserrat", background: "linear-gradient(90deg, #FFD700, #FF9500)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            МонетоКликер
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl neon-border transition-transform ${shakeCoins ? "animate-shake" : ""}`}
            style={{ background: "rgba(255, 215, 0, 0.08)" }}>
            <span className="text-xl">💰</span>
            <span className="font-black text-lg" style={{ color: "hsl(45 100% 65%)", fontFamily: "Montserrat" }}>
              {Math.floor(game.coins).toLocaleString("ru-RU")}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 overflow-hidden">

          {/* EARN TAB */}
          {tab === "earn" && (
            <div className="h-full flex flex-col items-center px-4 pt-2 gap-4 animate-slide-up">
              <div className="text-center">
                <p className="text-sm font-bold" style={{ color: char.color }}>{char.name}</p>
                {nextChar && (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-1.5 w-36 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.1)" }}>
                      <div className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${progressToNext * 100}%`, background: `linear-gradient(90deg, ${char.color}, ${nextChar.color})` }} />
                    </div>
                    <span className="text-xs" style={{ color: "hsl(220 10% 50%)" }}>
                      {game.characterClicks}/{CHARACTERS[game.characterIndex].threshold}
                    </span>
                  </div>
                )}
              </div>

              {/* Character */}
              <div className="relative flex items-center justify-center w-full" style={{ height: 200 }}>
                <div ref={clickAreaRef} className="relative flex items-center justify-center" style={{ width: 200, height: 200 }}>
                  <div
                    className="cursor-pointer select-none"
                    onClick={handleCharClick}
                    style={{
                      width: 180, height: 180,
                      borderRadius: "50%",
                      border: `3px solid ${char.color}`,
                      boxShadow: `0 0 40px ${char.color}60, 0 0 80px ${char.color}20`,
                      overflow: "hidden",
                      background: "rgba(255,255,255,0.05)",
                      animation: charAnim ? "bounce-click 0.3s ease-out" : "float 3s ease-in-out infinite",
                      transition: "box-shadow 0.2s",
                    }}>
                    <img src={char.img} alt={char.name} style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none", userSelect: "none" }} />
                  </div>
                  {popups.map(p => (
                    <div key={p.id} className="coin-popup" style={{ left: p.x, top: p.y }}>+{p.value}💰</div>
                  ))}
                </div>
                {allCharsUnlocked && (
                  <button
                    onClick={() => setShowCharSelect(true)}
                    className="absolute right-2 px-3 py-2 rounded-2xl font-black text-xs"
                    style={{ background: "linear-gradient(135deg, #00E676, #00BF5A)", color: "#000", top: "50%", transform: "translateY(-50%)" }}>
                    🎭 Выбор
                  </button>
                )}
              </div>

              <div className="text-center text-xs" style={{ color: "hsl(220 10% 50%)" }}>
                +{game.clickUpgrade * game.clickMultiplier} за клик
                {game.passiveUpgrade > 0 && <span> · +{game.passiveUpgrade * game.clickMultiplier}/сек</span>}
                {game.clickMultiplier > 1 && <span style={{ color: "#00E676" }}> (×{game.clickMultiplier})</span>}
              </div>

              {/* Upgrades */}
              <div className="w-full max-w-sm grid grid-cols-2 gap-3">
                <div className="item-card">
                  <div className="text-center mb-3">
                    <div className="text-2xl mb-1">👆</div>
                    <p className="font-bold text-sm text-white">Клик +1</p>
                    <p className="text-xs" style={{ color: "hsl(220 10% 55%)" }}>Ур. {game.clickUpgrade}/5</p>
                    <div className="flex gap-0.5 mt-1.5 justify-center">
                      {Array.from({ length: 5 }, (_, i) => (
                        <div key={i} className="w-4 h-1 rounded-full"
                          style={{ background: i < game.clickUpgrade ? "hsl(45 100% 55%)" : "rgba(255,255,255,0.15)" }} />
                      ))}
                    </div>
                  </div>
                  <button onClick={() => buyUpgrade("click")}
                    disabled={game.clickUpgrade >= 5 || game.coins < clickCost}
                    className="w-full rounded-2xl px-4 py-2 font-black text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: "linear-gradient(135deg, #FFD700, #FF9500)", color: "#000" }}>
                    {game.clickUpgrade >= 5 ? "МАКС" : `${clickCost}💰`}
                  </button>
                </div>

                <div className="item-card">
                  <div className="text-center mb-3">
                    <div className="text-2xl mb-1">⏱️</div>
                    <p className="font-bold text-sm text-white">Авто +1/с</p>
                    <p className="text-xs" style={{ color: "hsl(220 10% 55%)" }}>Ур. {game.passiveUpgrade}/5</p>
                    <div className="flex gap-0.5 mt-1.5 justify-center">
                      {Array.from({ length: 5 }, (_, i) => (
                        <div key={i} className="w-4 h-1 rounded-full"
                          style={{ background: i < game.passiveUpgrade ? "#00E676" : "rgba(255,255,255,0.15)" }} />
                      ))}
                    </div>
                  </div>
                  <button onClick={() => buyUpgrade("passive")}
                    disabled={game.passiveUpgrade >= 5 || game.coins < passiveCost}
                    className="w-full rounded-2xl px-4 py-2 font-black text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: "linear-gradient(135deg, #00E676, #00BF5A)", color: "#000" }}>
                    {game.passiveUpgrade >= 5 ? "МАКС" : `${passiveCost}💰`}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SHOP TAB */}
          {tab === "shop" && (
            <div className="h-full flex flex-col px-4 pt-2 animate-slide-up">
              <h2 className="text-xl font-black text-white mb-4 flex-shrink-0" style={{ fontFamily: "Montserrat" }}>Магазин 🛒</h2>
              <div className="scrollable flex-1 flex flex-col gap-3 pb-4">
                {SHOP_ITEMS.map(item => {
                  const owned = game.purchasedItems.includes(item.id);
                  const canBuy = !owned && game.coins >= item.price;
                  return (
                    <div key={item.id} className="item-card flex items-center gap-4"
                      style={owned ? { borderColor: "hsl(45 100% 55% / 0.5)", background: "rgba(255,215,0,0.06)" } : {}}>
                      <div className="text-4xl flex-shrink-0">{item.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-white">{item.name}</p>
                          {item.boost && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(0,230,118,0.2)", color: "#00E676" }}>×1.2 буст</span>}
                          {owned && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(255,215,0,0.2)", color: "#FFD700" }}>Куплено</span>}
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: "hsl(220 10% 55%)" }}>{item.desc}</p>
                      </div>
                      <button onClick={() => buyItem(item)} disabled={!canBuy}
                        className="flex-shrink-0 px-3 py-2 rounded-xl font-black text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={owned
                          ? { background: "rgba(255,215,0,0.15)", color: "#FFD700" }
                          : canBuy
                            ? { background: "linear-gradient(135deg, #FFD700, #FF9500)", color: "#000" }
                            : { background: "rgba(255,255,255,0.08)", color: "hsl(220 10% 50%)" }}>
                        {owned ? "✓" : `${item.price}💰`}
                      </button>
                    </div>
                  );
                })}
                <button
                  onClick={() => setWeatherValue(Math.floor(Math.random() * 2001) - 1000)}
                  className="item-card text-center font-black text-sm transition-all hover:opacity-80 w-full mt-2"
                  style={{ color: "#4FC3F7", borderColor: "rgba(79,195,247,0.4)", background: "rgba(79,195,247,0.06)", cursor: "pointer" }}>
                  ☁️ Прогноз погоды
                </button>
              </div>
            </div>
          )}

          {/* ACHIEVEMENTS TAB */}
          {tab === "achievements" && (
            <div className="h-full flex flex-col px-4 pt-2 animate-slide-up">
              <h2 className="text-xl font-black text-white mb-1 flex-shrink-0" style={{ fontFamily: "Montserrat" }}>Достижения 🏆</h2>
              <p className="text-xs mb-4 flex-shrink-0" style={{ color: "hsl(220 10% 50%)" }}>{game.achievements.length}/{Object.keys(ACHIEVEMENTS_DATA).length} получено</p>
              <div className="scrollable flex-1 flex flex-col gap-3 pb-4">
                {Object.entries(ACHIEVEMENTS_DATA).map(([key, ach]) => {
                  const earned = game.achievements.includes(key);
                  return (
                    <div key={key} className="item-card flex items-center gap-4"
                      style={earned ? { borderColor: "hsl(45 100% 55% / 0.6)", background: "rgba(255,215,0,0.07)" } : { opacity: 0.45 }}>
                      <div className="text-3xl" style={{ filter: earned ? "none" : "grayscale(1)" }}>{ach.emoji}</div>
                      <div className="flex-1">
                        <p className="font-bold text-white text-sm">{earned ? ach.name : "???"}</p>
                        <p className="text-xs mt-0.5" style={{ color: "hsl(220 10% 55%)" }}>{earned ? ach.desc : "Не получено"}</p>
                      </div>
                      {earned && <span className="text-lg">✅</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PROMO TAB */}
          {tab === "promo" && (
            <div className="h-full flex flex-col px-4 pt-2 animate-slide-up">
              <h2 className="text-xl font-black text-white mb-1 flex-shrink-0" style={{ fontFamily: "Montserrat" }}>Промокоды 🎁</h2>
              <p className="text-xs mb-5 flex-shrink-0" style={{ color: "hsl(220 10% 50%)" }}>Введи промокод и получи награду</p>
              <div className="flex flex-col gap-3 max-w-sm w-full">
                <div className="flex gap-2">
                  <input
                    value={promoInput}
                    onChange={e => setPromoInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && activatePromo()}
                    placeholder="Введи промокод..."
                    className="flex-1 rounded-2xl px-4 py-3 text-sm font-bold outline-none"
                    style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
                  />
                  <button
                    onClick={activatePromo}
                    className="px-5 py-3 rounded-2xl font-black text-sm"
                    style={{ background: "linear-gradient(135deg, #FFD700, #FF9500)", color: "#000" }}>
                    ОК
                  </button>
                </div>
                {promoStatus === "success" && (
                  <div className="rounded-2xl px-4 py-3 text-sm font-bold" style={{ background: "rgba(0,230,118,0.15)", border: "1px solid rgba(0,230,118,0.4)", color: "#00E676" }}>
                    ✅ Промокод активирован! Получен секретный персонаж ВСПЫШ ЕХЕ!
                  </div>
                )}
                {promoStatus === "already" && (
                  <div className="rounded-2xl px-4 py-3 text-sm font-bold" style={{ background: "rgba(255,215,0,0.1)", border: "1px solid rgba(255,215,0,0.3)", color: "#FFD700" }}>
                    ⚠️ Промокод уже был использован
                  </div>
                )}
                {promoStatus === "error" && (
                  <div className="rounded-2xl px-4 py-3 text-sm font-bold" style={{ background: "rgba(255,82,82,0.1)", border: "1px solid rgba(255,82,82,0.3)", color: "#FF5252" }}>
                    ❌ Неверный промокод
                  </div>
                )}
              </div>

              {game.hasExeChar && (
                <div className="mt-6 item-card flex items-center gap-4" style={{ borderColor: "rgba(255,0,0,0.5)", background: "rgba(255,0,0,0.06)" }}>
                  <img src={EXE_CHARACTER.img} alt="ВСПЫШ ЕХЕ" style={{ width: 64, height: 64, borderRadius: "50%", border: "2px solid #FF0000", objectFit: "cover" }} />
                  <div>
                    <p className="font-black text-sm" style={{ color: "#FF0000" }}>ВСПЫШ ЕХЕ</p>
                    <p className="text-xs mt-0.5" style={{ color: "hsl(220 10% 55%)" }}>Секретный персонаж разблокирован 🔓</p>
                  </div>
                  <span className="ml-auto text-lg">☠️</span>
                </div>
              )}
            </div>
          )}

          {/* NEWS TAB */}
          {tab === "news" && (
            <div className="h-full flex flex-col px-4 pt-2 animate-slide-up">
              <h2 className="text-xl font-black text-white mb-4 flex-shrink-0" style={{ fontFamily: "Montserrat" }}>Новости 📰</h2>
              <div className="scrollable flex-1 flex flex-col gap-4 pb-4">
                <div className="item-card">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-1 rounded-full font-bold" style={{ background: "rgba(255,215,0,0.15)", color: "#FFD700" }}>🆕 Обновление</span>
                    <span className="text-xs" style={{ color: "hsl(220 10% 50%)" }}>28 апр 2026</span>
                  </div>
                  <p className="font-bold text-white mb-2">Версия 1.0 — Запуск!</p>
                  <ul className="space-y-1.5">
                    {["Четыре персонажа: Вспыш → Огурчик → Лунтик → Рыг", "Магазин с 6 товарами", "6 достижений за покупки", "Улучшения клика (до ×5) и авто-монет", "Очки дают буст ×1.2 к монетам", "Автосохранение прогресса", "Превью с загрузочным экраном"].map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm" style={{ color: "hsl(220 10% 70%)" }}>
                        <span style={{ color: "#FFD700" }}>•</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="item-card" style={{ borderColor: "rgba(100,100,255,0.3)", background: "rgba(80,80,255,0.05)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-1 rounded-full font-bold" style={{ background: "rgba(100,100,255,0.2)", color: "#8888FF" }}>🔮 В планах</span>
                    <span className="text-xs" style={{ color: "hsl(220 10% 50%)" }}>Скоро</span>
                  </div>
                  <p className="font-bold text-white mb-2">Будущие обновления</p>
                  <ul className="space-y-1.5">
                    {["Новые персонажи", "Больше товаров в магазине", "Таблица рекордов", "Ежедневные задания", "Секретные ачивки"].map((item, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm" style={{ color: "hsl(220 10% 60%)" }}>
                        <span style={{ color: "#8888FF" }}>•</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* SETTINGS TAB */}
          {tab === "settings" && (
            <div className="h-full flex flex-col px-4 pt-2 animate-slide-up">
              <h2 className="text-xl font-black text-white mb-6 flex-shrink-0" style={{ fontFamily: "Montserrat" }}>Настройки ⚙️</h2>
              <div className="scrollable flex-1 flex flex-col gap-4 pb-4">
                <div className="item-card flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🎵</span>
                    <div>
                      <p className="font-bold text-white">Музыка</p>
                      <p className="text-xs" style={{ color: "hsl(220 10% 55%)" }}>{game.musicEnabled ? "Включена" : "Выключена"}</p>
                    </div>
                  </div>
                  <button onClick={() => setGame(g => { const newG = { ...g, musicEnabled: !g.musicEnabled }; saveGame(newG); return newG; })}
                    className="relative w-14 h-7 rounded-full transition-all duration-300"
                    style={{ background: game.musicEnabled ? "linear-gradient(135deg, #FFD700, #FF9500)" : "rgba(255,255,255,0.15)" }}>
                    <div className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-300"
                      style={{ left: game.musicEnabled ? "calc(100% - 1.6rem)" : "2px" }} />
                  </button>
                </div>

                <div className="item-card">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">📊</span>
                    <p className="font-bold text-white">Статистика</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Монет сейчас", value: Math.floor(game.coins) },
                      { label: "Всего кликов", value: game.totalClicks },
                      { label: "Куплено товаров", value: game.purchasedItems.length },
                      { label: "Ачивок получено", value: game.achievements.length },
                    ].map((s, i) => (
                      <div key={i} className="text-center p-3 rounded-2xl" style={{ background: "rgba(255,215,0,0.06)", border: "1px solid rgba(255,215,0,0.12)" }}>
                        <p className="text-lg font-black" style={{ color: "hsl(45 100% 65%)" }}>{s.value.toLocaleString("ru-RU")}</p>
                        <p className="text-xs mt-0.5" style={{ color: "hsl(220 10% 50%)" }}>{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="item-card">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">🎮</span>
                    <p className="font-bold text-white">Персонаж</p>
                  </div>
                  <p className="text-sm" style={{ color: "hsl(220 10% 60%)" }}>
                    Текущий: <span style={{ color: char.color, fontWeight: "bold" }}>{char.name}</span>
                  </p>
                  {nextChar && (
                    <p className="text-xs mt-1" style={{ color: "hsl(220 10% 50%)" }}>
                      До {nextChar.name}: {CHARACTERS[game.characterIndex].threshold - game.characterClicks} кликов
                    </p>
                  )}
                </div>

                <button
                  onClick={() => {
                    if (confirm("Сбросить весь прогресс? Это нельзя отменить!")) {
                      const fresh: GameState = { coins: 0, totalClicks: 0, characterClicks: 0, characterIndex: 0, clickUpgrade: 1, passiveUpgrade: 0, purchasedItems: [], achievements: [], musicEnabled: game.musicEnabled, clickMultiplier: 1 };
                      setGame(fresh);
                      saveGame(fresh);
                    }
                  }}
                  className="item-card text-center font-bold text-sm transition-all hover:opacity-80 w-full"
                  style={{ color: "#FF5252", borderColor: "rgba(255,82,82,0.3)", cursor: "pointer" }}>
                  🗑️ Сбросить прогресс
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Nav */}
        <div className="relative z-10 flex justify-center gap-0.5 items-center px-1 py-2 mx-3 mb-3 rounded-3xl glass flex-shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`nav-btn ${tab === t.id ? "active" : ""}`}>
              <span className="text-xl">{t.emoji}</span>
              <span style={{ fontSize: 10 }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Welcome Modal */}
      {showWelcome && loaded && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }}>
          <div className="glass rounded-3xl p-6 max-w-sm w-full text-center" style={{ border: "1px solid rgba(255,215,0,0.4)" }}>
            <div className="text-5xl mb-4">😭</div>
            <p className="font-black text-white text-lg mb-6" style={{ fontFamily: "Montserrat" }}>
              Это последняя обнова до мая😭
            </p>
            <div className="flex gap-3">
              <button onClick={closeWelcome}
                className="flex-1 py-3 rounded-2xl font-black text-sm"
                style={{ background: "linear-gradient(135deg, #FFD700, #FF9500)", color: "#000" }}>
                Жаль😭
              </button>
              <button onClick={closeWelcome}
                className="flex-1 py-3 rounded-2xl font-black text-sm"
                style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}>
                Пропустить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Weather Modal */}
      {weatherValue !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }} onClick={() => setWeatherValue(null)}>
          <div className="glass rounded-3xl p-6 max-w-xs w-full text-center" style={{ border: "1px solid rgba(79,195,247,0.4)" }} onClick={e => e.stopPropagation()}>
            <div className="text-5xl mb-3">☁️</div>
            <p className="text-sm mb-2" style={{ color: "hsl(220 10% 60%)" }}>Прогноз погоды</p>
            <p className="font-black text-4xl mb-5" style={{ color: weatherValue >= 0 ? "#FFD700" : "#4FC3F7" }}>
              {weatherValue > 0 ? "+" : ""}{weatherValue}°
            </p>
            <button onClick={() => setWeatherValue(null)}
              className="w-full py-3 rounded-2xl font-black text-sm"
              style={{ background: "linear-gradient(135deg, #4FC3F7, #29B6F6)", color: "#000" }}>
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* Character Select Modal */}
      {showCharSelect && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.75)" }} onClick={() => setShowCharSelect(false)}>
          <div className="glass rounded-3xl p-5 max-w-sm w-full" style={{ border: "1px solid rgba(0,230,118,0.4)" }} onClick={e => e.stopPropagation()}>
            <p className="font-black text-white text-lg mb-4 text-center" style={{ fontFamily: "Montserrat" }}>🎭 Выбери персонажа</p>
            <div className="grid grid-cols-2 gap-3">
              {CHARACTERS.map((c, i) => {
                const active = (selectedIdx ?? game.characterIndex) === i;
                return (
                  <button key={c.name}
                    onClick={() => {
                      setGame(g => {
                        const newG = { ...g, selectedCharIdx: i };
                        saveGame(newG);
                        return newG;
                      });
                      setShowCharSelect(false);
                    }}
                    className="rounded-2xl p-3 transition-all flex flex-col items-center gap-2"
                    style={{ background: active ? `${c.color}22` : "rgba(255,255,255,0.05)", border: `2px solid ${active ? c.color : "rgba(255,255,255,0.1)"}` }}>
                    <img src={c.img} alt={c.name} style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover" }} />
                    <p className="font-bold text-xs" style={{ color: c.color }}>{c.name}</p>
                  </button>
                );
              })}
            </div>
            <button onClick={() => setShowCharSelect(false)}
              className="w-full mt-4 py-3 rounded-2xl font-bold text-sm"
              style={{ background: "rgba(255,255,255,0.08)", color: "#fff" }}>
              Закрыть
            </button>
          </div>
        </div>
      )}
    </>
  );
}