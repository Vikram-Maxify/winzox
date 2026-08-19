import {
  ArrowLeft,
  ArrowLeftFromLine,
  ArrowRightFromLine,
  BarChart3,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Coins,
  Crown,
  Dice5,
  Gem,
  Grid3x3,
  History,
  Info,
  Landmark,
  Moon,
  Sparkles,
  Sun,
  Timer,
  Trophy,
  User,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getActiveMarkets } from "../../redux/slices/marketSlice";

/* ============================================================
   MOCK-DATA HELPERS
   Everything below is ONLY used for fields the API does not
   (yet) return: status (live/open/upcoming), market avatar,
   today's result, last result, game types, coins balance and
   recent results. The moment your backend sends these, delete
   the matching mock fn and wire the real field in its place.
   Every place mock data is shown carries a tiny "mock" tag.
   ============================================================ */

const MOCK_AVATARS = [Crown, Landmark, Gem, Sparkles];

// deterministic "random" digit so the same market always shows
// the same mock number during a session (not real API data)
const seededDigit = (seed) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % 10;
};

const mockTriplet = (marketId, salt = "") =>
  [0, 1, 2].map((i) => seededDigit(`${marketId}-${salt}-${i}`));

const toMinutes = (t) => {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
};

const formatTime12 = (t) => {
  if (!t) return "--:--";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  return `${String(hour12).padStart(2, "0")}:${String(m).padStart(
    2,
    "0",
  )} ${period}`;
};

// Derived (not random-mock, but not from API either) — computed from
// real openTime/closeTime vs current time. Handles overnight windows
// like "11:34" -> "01:35".
const getMarketStatus = (openTime, closeTime) => {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const openMin = toMinutes(openTime);
  const closeMin = toMinutes(closeTime);

  if (closeMin < openMin) {
    // window crosses midnight
    if (nowMin >= openMin || nowMin <= closeMin) return "live";
    return "upcoming";
  }
  if (nowMin < openMin) return "upcoming";
  if (nowMin <= closeMin) return "live";
  return "closed";
};

// Golden-only status styling — no blue/red/green, just shade of amber
// (closed uses neutral gray since it's an inactive/disabled state, not an accent color)
const STATUS_STYLES = {
  live: {
    dot: "bg-amber-500",
    text: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    label: "LIVE",
  },
  upcoming: {
    dot: "bg-amber-300",
    text: "text-amber-600",
    bg: "bg-amber-50/60 border-amber-100",
    label: "UPCOMING",
  },
  closed: {
    dot: "bg-gray-300",
    text: "text-gray-400",
    bg: "bg-gray-50 border-gray-100",
    label: "CLOSED",
  },
};

// Every game type rendered as the SAME card style (digit-circle or icon
// badge + label + sub-text + PLAY button). First 4 show by default; "VIEW
// ALL" reveals the rest as more cards in the same grid — no separate list UI.
// Swap this out for market.gameTypes the moment the backend fills it in.
const GAME_TYPES = [
  {
    key: "single",
    label: "SINGLE",
    sub: "Choose One Number",
    mode: "digits",
    digits: ["7"],
  },
  {
    key: "jodi",
    label: "JODI",
    sub: "Choose Two Numbers",
    mode: "digits",
    digits: ["7", "8"],
  },
  {
    key: "panna",
    label: "PANNA",
    sub: "Choose Panna",
    mode: "icon",
    icon: Dice5,
  },
  {
    key: "spot",
    label: "SPOT",
    sub: "Choose Spot Number",
    mode: "digits",
    digits: ["5"],
  },
  {
    key: "half-sangam",
    label: "HALF-SANGAM",
    sub: "Open + Close Combo",
    mode: "icon",
    icon: Moon,
  },
  {
    key: "full-sangam",
    label: "FULL-SANGAM",
    sub: "Full Combo",
    mode: "icon",
    icon: Sun,
  },
  {
    key: "last-digit",
    label: "LAST DIGIT",
    sub: "Choose Last Digit",
    mode: "icon",
    icon: ArrowRightFromLine,
  },
  {
    key: "first-digit",
    label: "FIRST DIGIT",
    sub: "Choose First Digit",
    mode: "icon",
    icon: ArrowLeftFromLine,
  },
];

const DEFAULT_VISIBLE_GAME_TYPES = 6;

// Small inline tag so it's always obvious which pixels are placeholder.
const MockTag = () => (
  <span className="ml-1.5 inline-flex items-center rounded-full border border-dashed border-amber-300 bg-amber-50 px-1.5 py-[1px] text-[9px] font-semibold uppercase tracking-wide text-amber-500">
    mock
  </span>
);

const MatkaMarkets = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { activeMarkets, loading } = useSelector((state) => state.market);

  const [activeTab, setActiveTab] = useState("live"); // live | open | upcoming
  const [selectedMarketId, setSelectedMarketId] = useState(null);
  const [justOpened, setJustOpened] = useState(false);
  const [showAllGameTypes, setShowAllGameTypes] = useState(false);
  const [selectedGameType, setSelectedGameType] = useState(null);
  const detailRef = useRef(null);
  const openedTimeoutRef = useRef(null);

  useEffect(() => {
    dispatch(getActiveMarkets());
  }, [dispatch]);

  // pick a default selected market once markets load
  useEffect(() => {
    if (activeMarkets?.length && !selectedMarketId) {
      setSelectedMarketId(activeMarkets[0]._id);
    }
  }, [activeMarkets, selectedMarketId]);

  // cleanup the "just opened" flash timer on unmount
  useEffect(() => {
    return () => clearTimeout(openedTimeoutRef.current);
  }, []);

  const marketsWithStatus = useMemo(
    () =>
      (activeMarkets || []).map((m) => ({
        ...m,
        status: getMarketStatus(m.openTime, m.closeTime),
      })),
    [activeMarkets],
  );

  const filteredMarkets = useMemo(() => {
    if (activeTab === "live")
      return marketsWithStatus.filter((m) => m.status === "live");
    if (activeTab === "upcoming")
      return marketsWithStatus.filter((m) => m.status === "upcoming");
    // "open" = anything still playable (live or upcoming) — API has no explicit
    // "open" flag today, adjust this mapping once it does.
    return marketsWithStatus.filter((m) => m.status !== "closed");
  }, [marketsWithStatus, activeTab]);

  const selectedMarket = marketsWithStatus.find(
    (m) => m._id === selectedMarketId,
  );

  // Clicking "PLAY NOW" / "VIEW" (or the card) on ANY market — Jaipur, Delhi,
  // Kalyan, whatever — makes it the active market, scrolls its detail panel
  // into view, AND flashes a gold ring around it for a second so it's
  // unmistakable that the market actually opened, even if it was already
  // the selected one.
  const openMarket = (marketId) => {
    setSelectedMarketId(marketId);
    setJustOpened(true);

    // wait a tick so the panel has re-rendered with the new market before scrolling
    requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    clearTimeout(openedTimeoutRef.current);
    openedTimeoutRef.current = setTimeout(() => setJustOpened(false), 1200);
  };

  const handlePlaceBid = (marketId, gameType) => {
    navigate(`/matka/place-bid/${marketId}`, {
      state: { gameType, marketId },
    });
  };

  const handleSelectGameType = (gameType) => {
    setSelectedGameType(gameType);
    setShowAllGameTypes(false);
    if (selectedMarket) {
      handlePlaceBid(selectedMarket._id, gameType);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-t-4 border-b-4 border-amber-500"></div>
          <p className="mt-4 text-center text-sm font-medium text-gray-500">
            Loading markets...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="scrollbar-hide relative h-screen overflow-y-auto bg-white pb-10">
      {/* Hides the scrollbar on every element with the scrollbar-hide class
          (this container's vertical scroll + both horizontal carousels below)
          while keeping them fully scrollable via touch/drag/wheel. */}
      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>

      <div className="mx-auto max-w-6xl space-y-5 px-4 pt-4 sm:px-6">
        {/* ===== Header ===== */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-200 text-amber-600 shadow-sm active:scale-95"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="text-center">
            <h1 className="flex items-center justify-center gap-2 text-xl font-extrabold tracking-tight text-amber-700 sm:text-2xl">
              <Crown size={20} className="text-amber-400" />
              MATKA PLAY
              <Crown size={20} className="text-amber-400" />
            </h1>
            <p className="text-[10px] font-semibold tracking-[0.25em] text-amber-400">
              PLAY • WIN • REPEAT
            </p>
          </div>
        </div>

        {/* ===== Choose Market ===== */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="h-4 w-1 rounded-full bg-amber-500" />
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-gray-800">
                Choose Market
              </h2>
            </div>

            <div className="flex overflow-hidden rounded-full border border-amber-100 bg-amber-50/40 p-1 text-xs font-bold">
              {["live", "open", "upcoming"].map((tab) => {
                const style = STATUS_STYLES[tab === "open" ? "live" : tab];
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition ${
                      isActive
                        ? "bg-white text-amber-700 shadow border border-amber-300"
                        : "text-gray-400"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
                    {tab.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>

          {filteredMarkets.length > 0 ? (
            <div className="scrollbar-hide flex gap-4 overflow-x-auto pb-2">
              {filteredMarkets.map((market, idx) => {
                const Avatar = MOCK_AVATARS[idx % MOCK_AVATARS.length];
                const style = STATUS_STYLES[market.status];
                const isSelected = market._id === selectedMarketId;

                return (
                  <div
                    key={market._id}
                    role="button"
                    tabIndex={0}
                    onClick={() => openMarket(market._id)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && openMarket(market._id)
                    }
                    className={`w-40 flex-shrink-0 cursor-pointer rounded-2xl border bg-white p-3 text-left shadow-sm transition ${
                      isSelected
                        ? "border-amber-400 ring-2 ring-amber-200"
                        : "border-gray-100"
                    }`}
                  >
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${style.bg} ${style.text}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${style.dot}`}
                      />
                      {style.label}
                    </span>

                    <div className="relative mx-auto my-2 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200 ring-2 ring-amber-300">
                      <Avatar size={26} className="text-amber-600" />
                      <span className="absolute -bottom-1 -right-1 rounded-full border border-amber-300 bg-white px-1 text-[7px] font-bold text-amber-500">
                        mock
                      </span>
                    </div>

                    <p className="text-center text-sm font-extrabold text-amber-800">
                      {market.name}
                    </p>
                    <p className="text-center text-[11px] text-gray-500">
                      Open&nbsp;
                      <span className="font-semibold text-gray-700">
                        {formatTime12(market.openTime)}
                      </span>
                    </p>
                    <p className="text-center text-[11px] text-gray-500">
                      Close&nbsp;
                      <span className="font-semibold text-gray-700">
                        {formatTime12(market.closeTime)}
                      </span>
                    </p>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openMarket(market._id);
                      }}
                      className={`mt-2 w-full rounded-lg py-1.5 text-center text-xs font-bold text-white shadow ${
                        market.status === "live"
                          ? "bg-gradient-to-r from-amber-500 to-yellow-500"
                          : "bg-gradient-to-r from-amber-300 to-yellow-300"
                      }`}
                    >
                      {market.status === "live" ? "PLAY NOW →" : "VIEW →"}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openMarket(market._id);
                      }}
                      className="mt-1 w-full text-center text-[11px] font-semibold text-amber-700"
                    >
                      RESULTS →
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-100 bg-amber-50/40 py-10 text-center text-sm text-gray-400">
              No markets in this tab right now
            </div>
          )}
        </div>

        {/* ===== Selected Market Detail ===== */}
        {selectedMarket && (
          <div
            ref={detailRef}
            className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br from-amber-50 via-white to-white p-3 shadow-lg scroll-mt-4 transition-all duration-300 sm:rounded-3xl sm:p-5 ${
              justOpened
                ? "border-amber-400 ring-4 ring-amber-300"
                : "border-amber-200"
            }`}
          >
            {/* "Market opened" confirmation pill — fades out after the flash */}
            <div
              className={`pointer-events-none absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded-full bg-amber-500 px-3 py-1 text-[10px] font-bold text-white shadow transition-opacity duration-500 ${
                justOpened ? "opacity-100" : "opacity-0"
              }`}
            >
              {selectedMarket.name} opened
            </div>

            {/* Decorative Sparkles */}
            <Sparkles className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 text-amber-200/30 sm:h-32 sm:w-32" />

            {/* Header Section */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 sm:mb-4">
              <div className="flex items-center gap-2">
                <Crown size={18} className="text-amber-500 sm:h-6 sm:w-6" />
                <div>
                  <h3 className="text-base font-extrabold text-amber-800 sm:text-2xl">
                    {selectedMarket.name}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[8px] font-bold sm:px-2.5 sm:py-0.5 sm:text-[10px] ${
                      selectedMarket.status === "live"
                        ? "border-amber-300 bg-amber-100 text-amber-700"
                        : "border-amber-100 bg-amber-50 text-amber-500"
                    }`}
                  >
                    <span
                      className={`h-1 w-1 rounded-full sm:h-1.5 sm:w-1.5 ${
                        selectedMarket.status === "live"
                          ? "bg-amber-500"
                          : "bg-amber-300"
                      }`}
                    />
                    {selectedMarket.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button className="hidden items-center gap-1 rounded-full border border-amber-300 px-2.5 py-1 text-[9px] font-semibold text-amber-700 sm:flex sm:px-3 sm:text-[11px]">
                  <Info size={12} /> MARKET INFO
                </button>
                <div className="flex items-center gap-1 rounded-full border border-amber-200 bg-white px-2 py-0.5 sm:px-3 sm:py-1">
                  <Coins
                    size={12}
                    className="text-amber-400 sm:h-[14px] sm:w-[14px]"
                  />
                  <span className="text-[10px] font-bold text-gray-800 sm:text-xs">
                    12,500
                  </span>
                  <MockTag />
                </div>
              </div>
            </div>

            {/* Main Grid - Side by Side Always */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              {/* Today's Result Card - Left Side */}
              <div className="rounded-xl border border-amber-100 bg-white p-2 sm:rounded-2xl sm:p-4">
                <div className="mb-1.5 flex items-center justify-center sm:mb-3">
                  <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-300 to-yellow-400 px-2 py-0.5 text-[8px] font-extrabold text-amber-900 sm:px-3 sm:py-1 sm:text-[11px]">
                    TODAY'S RESULT
                    <MockTag />
                  </span>
                </div>

                <div className="flex justify-center gap-1.5 sm:gap-3">
                  {mockTriplet(selectedMarket.marketId, "today").map((d, i) => (
                    <div
                      key={i}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-amber-200 bg-amber-50 text-lg font-extrabold text-amber-800 shadow-sm sm:h-14 sm:w-14 sm:rounded-xl sm:text-2xl"
                    >
                      {d}
                    </div>
                  ))}
                </div>

                <p className="mt-1.5 flex items-center justify-center gap-1 text-[8px] text-gray-400 sm:mt-3 sm:text-[11px]">
                  <span className="h-1 w-1 animate-pulse rounded-full bg-amber-400" />
                  Updated now
                </p>
              </div>

              {/* Market Timing + Last Result Card - Right Side */}
              <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-2 sm:rounded-2xl sm:p-4">
                <p className="mb-1 flex items-center gap-1 text-[9px] font-bold text-amber-700 sm:mb-2 sm:text-xs">
                  <Clock size={10} className="sm:h-[13px] sm:w-[13px]" /> TIMING
                </p>

                <div className="flex justify-between text-center">
                  <div>
                    <p className="text-[7px] text-amber-500 sm:text-[10px]">
                      Open
                    </p>
                    <p className="text-[10px] font-extrabold text-gray-800 sm:text-sm">
                      {formatTime12(selectedMarket.openTime)}
                    </p>
                  </div>
                  <div className="w-px bg-amber-200" />
                  <div>
                    <p className="text-[7px] text-amber-500 sm:text-[10px]">
                      Close
                    </p>
                    <p className="text-[10px] font-extrabold text-gray-800 sm:text-sm">
                      {formatTime12(selectedMarket.closeTime)}
                    </p>
                  </div>
                </div>

                <div className="my-1.5 h-px bg-amber-200 sm:my-3" />

                <p className="mb-1 flex items-center gap-1 text-[9px] font-bold text-amber-700 sm:mb-2 sm:text-xs">
                  <Timer size={10} className="sm:h-[13px] sm:w-[13px]" /> LAST
                  <span className="text-[7px] font-normal text-amber-400 sm:text-[10px]">
                    (
                    {new Date(Date.now() - 86400000)
                      .toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                      })
                      .toUpperCase()}
                    )
                  </span>
                  <MockTag />
                </p>

                <div className="flex justify-center gap-1.5 sm:gap-2.5">
                  {mockTriplet(selectedMarket.marketId, "last").map((d, i) => (
                    <div
                      key={i}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-200 bg-white text-sm font-extrabold text-amber-800 sm:h-10 sm:w-10 sm:rounded-xl sm:text-lg"
                    >
                      {d}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== Choose Game Type ===== */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Grid3x3 size={16} className="text-amber-600" />
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-gray-800">
                Choose Game Type
              </h2>
              <MockTag />
            </div>
            <button
              onClick={() => setShowAllGameTypes((prev) => !prev)}
              className="flex items-center gap-0.5 text-xs font-bold text-amber-700"
            >
              VIEW ALL
              <ChevronRight
                size={14}
                className={`transition-transform duration-200 ${
                  showAllGameTypes ? "rotate-90" : ""
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1 sm:gap-2">
            {GAME_TYPES.slice(
              0,
              showAllGameTypes ? GAME_TYPES.length : DEFAULT_VISIBLE_GAME_TYPES,
            ).map((gt) => {
              const Icon = gt.icon;
              const isSelected = selectedGameType === gt.key;

              return (
                <div
                  key={gt.key}
                  className={`rounded-2xl border bg-white p-2 sm:p-4 text-center shadow-sm transition flex flex-col items-center justify-between min-h-[160px] sm:min-h-[200px] ${
                    isSelected
                      ? "border-amber-400 ring-2 ring-amber-200"
                      : "border-amber-100"
                  }`}
                >
                  {/* 1. Game Label - Fixed Position (Top) */}
                  <p className="mb-1.5 sm:mb-2 flex items-center justify-center gap-1 text-[10px] sm:text-xs font-extrabold tracking-wide text-amber-800 min-h-[20px] sm:min-h-[24px]">
                    {gt.label}
                    {isSelected && (
                      <Check
                        size={12}
                        className="text-amber-600 flex-shrink-0"
                      />
                    )}
                  </p>

                  {/* 2. Icon/Digits - Fixed Position (Middle) */}
                  <div className="mx-auto mb-1.5 sm:mb-2 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center flex-shrink-0">
                    {gt.mode === "digits" ? (
                      <div className="flex h-12 sm:h-14 items-center justify-center gap-1">
                        {gt.digits.map((d, i) => (
                          <span
                            key={i}
                            className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-sm sm:text-base font-extrabold text-white ring-2 ring-amber-200"
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-white ring-2 ring-amber-200">
                        <Icon size={20} className="sm:h-6 sm:w-6" />
                      </span>
                    )}
                  </div>

                  {/* 3. Subtitle - Fixed Position (Bottom-Middle) */}
                  <p className="mb-1.5 sm:mb-3 text-[8px] sm:text-[11px] text-gray-400 min-h-[16px] sm:min-h-[20px] line-clamp-1">
                    {gt.sub}
                  </p>

                  {/* 4. Play Button - Fixed Position (Bottom) */}
                  <button
                    onClick={() =>
                      selectedMarket && handleSelectGameType(gt.key)
                    }
                    className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 py-1.5 sm:py-2 text-[10px] sm:text-xs font-bold text-white shadow hover:shadow-md transition-all flex-shrink-0"
                    disabled={!selectedMarket}
                  >
                    {selectedMarket ? "PLAY →" : "SELECT MARKET"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== Quick Access ===== */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" />
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-gray-800">
              Quick Access
            </h2>
          </div>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-4">
            {[
              { label: "Today's Result", icon: Trophy },
              { label: "Previous Results", icon: History },
              { label: "Detailed Chart", icon: BarChart3 },
              { label: "My Plays", icon: User },
            ].map((item) => (
              <button
                key={item.label}
                className="flex items-center justify-center gap-1 rounded-xl border border-amber-100 bg-white py-2 text-[9px] font-medium text-gray-700 shadow-sm"
              >
                <item.icon size={10} className="text-amber-500" />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* ===== Recent Results ===== */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-amber-600" />
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-gray-800">
                Recent Results
              </h2>
              <MockTag />
            </div>
            <button className="flex items-center gap-0.5 text-xs font-bold text-amber-700">
              VIEW ALL <ChevronRight size={14} />
            </button>
          </div>

          <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2">
            {marketsWithStatus.map((market) => (
              <div
                key={market._id}
                className="w-32 flex-shrink-0 rounded-xl border border-amber-100 bg-white p-3 text-center shadow-sm"
              >
                <p className="text-[10px] font-semibold text-gray-400">
                  {new Date()
                    .toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                    })
                    .toUpperCase()}
                </p>
                <p className="mb-2 truncate text-[11px] font-extrabold text-amber-800">
                  {market.name.toUpperCase()}
                </p>
                <div className="flex justify-center gap-1">
                  {mockTriplet(market.marketId, "recent").map((d, i) => (
                    <span
                      key={i}
                      className="flex h-6 w-6 items-center justify-center rounded bg-amber-50 text-xs font-bold text-amber-800"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatkaMarkets;
