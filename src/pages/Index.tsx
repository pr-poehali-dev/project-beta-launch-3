import { useState, useEffect, useRef, useCallback } from "react";

const BLAZE_IMG = "https://cdn.poehali.dev/projects/021d657a-82ce-4830-bad8-b52f594f6aa2/bucket/4c097f9a-91af-425e-9ab9-64bfeb8b7d7b.jpg";
const OGURCHIK_IMG = "https://cdn.poehali.dev/projects/021d657a-82ce-4830-bad8-b52f594f6aa2/bucket/b89b982f-c7a0-41a5-a56a-78cdd053ab5e.jpg";
const LUNTIK_IMG = "https://cdn.poehali.dev/projects/021d657a-82ce-4830-bad8-b52f594f6aa2/bucket/4151adb6-a01e-4b20-93e5-a2c1adef949e.jpg";
const RYG_IMG = "https://cdn.poehali.dev/projects/021d657a-82ce-4830-bad8-b52f594f6aa2/bucket/58e8fdfc-76d4-479b-8b3b-ca672caeb458.jpg";

type Tab = "earn" | "shop" | "achievements" | "news" | "settings";

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
}

const CHARACTERS = [
  { name: "Вспыш", img: BLAZE_IMG, threshold: 100, color: "#FF6B35" },
  { name: "Огурчик", img: OGURCHIK_IMG, threshold: 250, color: "#4CAF50" },
  { name: "Лунтик", img: LUNTIK_IMG, threshold: 500, color: "#B39DDB" },
  { name: "Рыг", img: RYG_IMG, threshold: Infinity, color: "#00E676" },
];

const SHOP_ITEMS = [
  { id: "pot", name: "Кастрюля", emoji: "🍲", price: 50, desc: "Кастрюля.", ach: "pot_bought" },
  { id: "multicooker", name: "Мультиварка", emoji: "🫕", price: 125, desc: "Очень полезная в готовке.", ach: "multicooker_bought" },
  { id: "knife", name: "Нож", emoji: "🔪", price: 175, desc: "Очень опасен не только в нападении, но и при резке чего-либо.", ach: "knife_bought" },
  { id: "tv", name: "Телевизор", emoji: "📺", price: 275, desc: "Всегда весело посмотреть телевизор вечером!", ach: "tv_bought" },
  { id: "glasses", name: "Очки", emoji: "👓", price: 128, desc: "У тебя зрение ниже нормы?", ach: "glasses_bought", boost: true },
  { id: "blaze_pen", name: "Ручка Вспыша", emoji: "✒️", price: 666, desc: "ЭКСКЛЮЗИВ!", ach: "blaze_pen_bought" },
  { id: "toilet", name: "Унитаз", emoji: "🚽", price: 350, desc: "скибиди доп доп.", ach: "toilet_bought" },
];

const ACHIEVEMENTS_DATA: Record<string, { name: string; desc: string; emoji: string }> = {
  pot_bought: { name: "Это не ведро!", desc: "Купи кастрюлю.", emoji: "🍲" },
  multicooker_bought: { name: "Сам варить не умеешь?", desc: "Купи мультиварку.", emoji: "🫕" },
  knife_bought: { name: "Ты осторожней будь!", desc: "Купи нож.", emoji: "🔪" },
  tv_bought: { name: "Любишь залипать?", desc: "Купи телек.", emoji: "📺" },
  glasses_bought: { name: "Четыре глаза!", desc: "Купи очки.", emoji: "👓" },
  blaze_pen_bought: { name: "И ЧУДО МАШИНКИ!", desc: "Купи ручку вспыша.", emoji: "✒️" },
  toilet_bought: { name: "скибиди", desc: "Купи унитаз.", emoji: "🚽" },
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

export default function Index() {
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<Tab>("earn");
  const [game, setGame] = useState<GameState>(loadGame);
  const [popups, setPopups] = useState<CoinPopup[]>([]);
  const [toasts, setToasts] = useState<ToastAch[]>([]);
  const [charAnim, setCharAnim] = useState(false);
  const [shakeCoins, setShakeCoins] = useState(false);
  const popupIdRef = useRef(0);
  const toastIdRef = useRef(0);
  const clickAreaRef = useRef<HTMLDivElement>(null);

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

  const handleCharClick = (e: React.MouseEvent) => {
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

  const char = CHARACTERS[game.characterIndex];
  const nextChar = CHARACTERS[game.characterIndex + 1];
  const clickCost = getUpgradeCost(UPGRADE_BASE_COSTS.click, game.clickUpgrade - 1);
  const passiveCost = getUpgradeCost(UPGRADE_BASE_COSTS.passive, game.passiveUpgrade);
  const progressToNext = nextChar ? Math.min(game.characterClicks / CHARACTERS[game.characterIndex].threshold, 1) : 1;

  const TABS: { id: Tab; label: string; emoji: string }[] = [
    { id: "earn", label: "Заработок", emoji: "🤑" },
    { id: "shop", label: "Магазин", emoji: "🛒" },
    { id: "achievements", label: "Ачивки", emoji: "🏆" },
    { id: "news", label: "Новости", emoji: "📰" },
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
        <div className="relative z-10 flex justify-around items-center px-2 py-2 mx-3 mb-3 rounded-3xl glass flex-shrink-0"
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
    </>
  );
}