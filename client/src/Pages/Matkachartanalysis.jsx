import {
  ArrowRight,
  BarChart3,
  Calendar,
  ChevronDown,
  Crown,
  Info,
  Landmark,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";
import { useState } from "react";

/* ============================================================================
   🔶 MOCK DATA — no reducer/API wired for this page yet. Everything below is
   placeholder so the layout can be reviewed pixel-by-pixel. Swap each block
   for the real thunk/selector once the chart endpoint exists.
   ============================================================================ */
const MARKETS = [
  "Kalyan",
  "Milan Day",
  "Rajdhani Day",
  "Main Mumbai",
  "Sridevi Day",
];

const MOCK_MARKET_INFO = {
  name: "KALYAN MARKET",
  status: "live",
  dateLabel: "Today, 10 Aug 2026",
  timeLabel: "05:15 PM",
  lastResult: [4, 6, 8],
  nextOpen: "07:15 PM",
  jodi: ["46", "68"],
  pana: "468",
  patti: [
    { range: "0-4", value: 34 },
    { range: "4-8", value: 51 },
    { range: "8-9", value: 28 },
  ],
};

const CHART_TABS = [
  "Chart",
  "Jodi Chart",
  "Weekly Chart",
  "Trend Chart",
  "Head to Head",
];

const MOCK_CHART_ROWS = [
  {
    date: "10 Aug 2026",
    time: "05:15 PM",
    result: [4, 6, 8],
    jodi: "46-68",
    pana: "468",
    p04: 34,
    p48: 51,
    p89: 28,
  },
  {
    date: "09 Aug 2026",
    time: "01:00 PM",
    result: [7, 8, 9],
    jodi: "78-89",
    pana: "789",
    p04: 22,
    p48: 48,
    p89: 30,
  },
  {
    date: "08 Aug 2026",
    time: "11:50 AM",
    result: [2, 3, 7],
    jodi: "23-37",
    pana: "237",
    p04: 41,
    p48: 32,
    p89: 27,
  },
  {
    date: "07 Aug 2026",
    time: "06:40 PM",
    result: [6, 9, 0],
    jodi: "69-90",
    pana: "690",
    p04: 23,
    p48: 56,
    p89: 21,
  },
  {
    date: "07 Aug 2026",
    time: "02:20 PM",
    result: [3, 5, 8],
    jodi: "35-58",
    pana: "358",
    p04: 31,
    p48: 44,
    p89: 25,
  },
  {
    date: "06 Aug 2026",
    time: "09:20 AM",
    result: [5, 7, 1],
    jodi: "57-71",
    pana: "571",
    p04: 35,
    p48: 40,
    p89: 25,
  },
  {
    date: "05 Aug 2026",
    time: "09:20 PM",
    result: [1, 2, 9],
    jodi: "12-29",
    pana: "129",
    p04: 29,
    p48: 38,
    p89: 33,
  },
  {
    date: "05 Aug 2026",
    time: "04:00 PM",
    result: [8, 1, 4],
    jodi: "81-14",
    pana: "814",
    p04: 38,
    p48: 42,
    p89: 20,
  },
];

const MOCK_NUMBER_FREQUENCY = [
  { n: 0, times: 32 },
  { n: 1, times: 28 },
  { n: 2, times: 31 },
  { n: 3, times: 27 },
  { n: 4, times: 29 },
  { n: 5, times: 33 },
  { n: 6, times: 30 },
  { n: 7, times: 34 },
  { n: 8, times: 36 },
  { n: 9, times: 35 },
];
const MAX_FREQUENCY = Math.max(...MOCK_NUMBER_FREQUENCY.map((f) => f.times));

const MOCK_JODI_TOP_OPEN = [
  { n: "46", times: 12 },
  { n: "68", times: 11 },
  { n: "78", times: 10 },
  { n: "89", times: 9 },
];
const MOCK_PANA_TOP_OPEN = [
  { n: "468", times: 8 },
  { n: "789", times: 7 },
  { n: "237", times: 7 },
  { n: "398", times: 6 },
];
/* ======================== END OF MOCK DATA ======================== */

function ResultBall({ n, size = "md" }) {
  const sizeClass =
    size === "lg"
      ? "w-11 h-11 text-sm"
      : size === "sm"
        ? "w-6 h-6 text-[10px]"
        : "w-8 h-8 text-xs";
  return (
    <span
      className={`${sizeClass} rounded-full bg-gradient-to-b from-amber-200 to-amber-300 border border-amber-400/60 text-amber-900 font-bold flex items-center justify-center shadow-sm shrink-0`}
    >
      {n}
    </span>
  );
}

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      LIVE
    </span>
  );
}

export default function MatkaChartAnalysis() {
  const [activeMarket, setActiveMarket] = useState("Kalyan");
  const [activeChartTab, setActiveChartTab] = useState("Chart");

  return (
    <div className="min-h-screen bg-white [&_*::-webkit-scrollbar]:hidden [&_*]:[scrollbar-width:none]">
      <div className="max-w-md mx-auto px-3 pb-8 pt-4 space-y-4">
        {/* ===== Header ===== */}
        <div>
          <div className="flex items-center gap-1.5">
            <Crown className="w-5 h-5 text-amber-500" fill="currentColor" />
            <h1 className="text-lg font-black text-gray-900 tracking-tight">
              MATKA CHART &amp; ANALYSIS
            </h1>
          </div>
          <p className="text-xs text-gray-400 ml-6.5 pl-0.5">
            {activeMarket} Market
          </p>
        </div>

        {/* ===== Market selector row ===== */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {MARKETS.map((m) => (
            <button
              key={m}
              onClick={() => setActiveMarket(m)}
              className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition ${
                activeMarket === m
                  ? "bg-amber-500 border-amber-500 text-white shadow-sm"
                  : "bg-white border-gray-200 text-gray-600"
              }`}
            >
              {m}
            </button>
          ))}
          <button className="shrink-0 flex items-center gap-1 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap border border-gray-200 bg-white text-gray-600">
            All Markets
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ===== Kalyan market summary card ===== */}
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/40 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow shrink-0">
                <Landmark className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-extrabold text-gray-900">
                    {MOCK_MARKET_INFO.name}
                  </span>
                  <LiveBadge />
                </div>
                <p className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
                  {MOCK_MARKET_INFO.dateLabel}
                  <Calendar className="w-3 h-3 ml-1" />
                  {MOCK_MARKET_INFO.timeLabel}
                </p>
              </div>
            </div>
            <button className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl bg-white border border-amber-300 text-amber-700 text-xs font-bold shadow-sm">
              View Result
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="bg-white rounded-xl border border-amber-100 grid grid-cols-3 divide-x divide-amber-100 overflow-hidden">
            {/* Last result */}
            <div className="p-3 flex flex-col items-center">
              <span className="flex items-center gap-1 text-[10px] font-bold text-gray-500 tracking-wide">
                <Sparkles className="w-3 h-3 text-amber-400" />
                LAST RESULT
                <Sparkles className="w-3 h-3 text-amber-400" />
              </span>
              <div className="flex gap-1.5 mt-2">
                {MOCK_MARKET_INFO.lastResult.map((n, i) => (
                  <ResultBall key={i} n={n} size="lg" />
                ))}
              </div>
              <div className="mt-3 px-2.5 py-1.5 rounded-lg bg-amber-50 text-center w-full">
                <p className="text-[9px] text-gray-500 font-semibold">
                  Next Open
                </p>
                <p className="text-xs font-extrabold text-gray-900">
                  {MOCK_MARKET_INFO.nextOpen}
                </p>
              </div>
            </div>

            {/* Jodi + Pana */}
            <div className="p-3 flex flex-col items-center">
              <span className="text-[10px] font-bold text-gray-500 tracking-wide">
                JODI
              </span>
              <div className="flex gap-1.5 mt-2">
                {MOCK_MARKET_INFO.jodi.map((n, i) => (
                  <ResultBall key={i} n={n} size="lg" />
                ))}
              </div>
              <span className="text-[10px] font-bold text-gray-500 tracking-wide mt-3">
                PANA
              </span>
              <div className="mt-2 px-3 py-1.5 rounded-full bg-gradient-to-b from-amber-200 to-amber-300 border border-amber-400/60 text-amber-900 text-sm font-extrabold">
                {MOCK_MARKET_INFO.pana}
              </div>
            </div>

            {/* Patti */}
            <div className="p-3 flex flex-col">
              <span className="text-[10px] font-bold text-gray-500 tracking-wide text-center">
                PATTI
              </span>
              <div className="mt-2 flex-1 flex flex-col justify-center gap-2.5">
                {MOCK_MARKET_INFO.patti.map((p) => {
                  const isMax =
                    p.value ===
                    Math.max(...MOCK_MARKET_INFO.patti.map((x) => x.value));
                  return (
                    <div
                      key={p.range}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-gray-500 font-semibold">
                        {p.range}
                      </span>
                      <span
                        className={`font-extrabold ${isMax ? "text-red-500" : "text-gray-900"}`}
                      >
                        {p.value}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ===== Chart sub-tabs ===== */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {CHART_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setActiveChartTab(t)}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                activeChartTab === t
                  ? "bg-gray-900 text-white shadow-sm"
                  : "text-gray-500"
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {/* ===== Matka chart table ===== */}
        <div className="rounded-2xl border border-gray-100 shadow-sm p-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-extrabold text-gray-900">
              MATKA CHART{" "}
              <span className="font-medium text-gray-400">
                (Last 20 Results)
              </span>
            </p>
            <button className="flex items-center gap-1 text-[11px] font-semibold text-gray-400">
              <Info className="w-3.5 h-3.5" />
              How to Read Chart
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left">
              <thead>
                <tr className="text-[10px] font-bold text-gray-400 tracking-wide">
                  <th className="py-2 pr-2 font-bold">DATE</th>
                  <th className="py-2 pr-2 font-bold">TIME</th>
                  <th className="py-2 pr-2 font-bold">RESULT</th>
                  <th className="py-2 pr-2 font-bold">JODI</th>
                  <th className="py-2 pr-2 font-bold">PANA</th>
                  <th className="py-2 pr-2 font-bold">0-4</th>
                  <th className="py-2 pr-2 font-bold">4-8</th>
                  <th className="py-2 font-bold">8-9</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_CHART_ROWS.map((row, i) => {
                  const maxVal = Math.max(row.p04, row.p48, row.p89);
                  return (
                    <tr
                      key={i}
                      className={
                        i !== MOCK_CHART_ROWS.length - 1
                          ? "border-t border-gray-100"
                          : "border-t border-gray-100"
                      }
                    >
                      <td className="py-3 pr-2 text-xs text-gray-700 whitespace-nowrap">
                        {row.date}
                      </td>
                      <td className="py-3 pr-2 text-xs text-gray-500 whitespace-nowrap">
                        {row.time}
                      </td>
                      <td className="py-3 pr-2">
                        <span className="flex gap-1">
                          {row.result.map((n, idx) => (
                            <ResultBall key={idx} n={n} size="sm" />
                          ))}
                        </span>
                      </td>
                      <td className="py-3 pr-2 text-xs font-semibold text-gray-700 whitespace-nowrap">
                        {row.jodi}
                      </td>
                      <td className="py-3 pr-2 text-xs font-semibold text-gray-700 whitespace-nowrap">
                        {row.pana}
                      </td>
                      <td
                        className={`py-3 pr-2 text-xs font-extrabold ${row.p04 === maxVal ? "text-red-500" : "text-gray-700"}`}
                      >
                        {row.p04}
                      </td>
                      <td
                        className={`py-3 pr-2 text-xs font-extrabold ${row.p48 === maxVal ? "text-red-500" : "text-gray-700"}`}
                      >
                        {row.p48}
                      </td>
                      <td
                        className={`py-3 text-xs font-extrabold ${row.p89 === maxVal ? "text-red-500" : "text-gray-700"}`}
                      >
                        {row.p89}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ===== Number Frequency + Top Open ===== */}
        <div className="grid grid-cols-1 gap-4">
          <div className="rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <BarChart3 className="w-4 h-4 text-gray-700" />
              <h3 className="text-xs font-extrabold text-gray-900 tracking-tight">
                NUMBER FREQUENCY
              </h3>
            </div>
            <div className="space-y-2.5">
              {MOCK_NUMBER_FREQUENCY.map((f) => (
                <div key={f.n} className="flex items-center gap-2.5">
                  <span className="w-3 text-xs font-bold text-gray-700 shrink-0">
                    {f.n}
                  </span>
                  <div className="flex-1 h-2.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-300 to-amber-500"
                      style={{ width: `${(f.times / MAX_FREQUENCY) * 100}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-gray-500 font-semibold w-14 text-right shrink-0">
                    {f.times} Times
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <Star className="w-4 h-4 text-amber-500" fill="currentColor" />
              <h3 className="text-xs font-extrabold text-gray-900 tracking-tight">
                JODI TOP OPEN
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              {MOCK_JODI_TOP_OPEN.map((j) => (
                <div key={j.n} className="flex items-center gap-2">
                  <ResultBall n={j.n} size="lg" />
                  <span className="text-[11px] text-gray-500 font-semibold">
                    {j.times} Times
                  </span>
                </div>
              ))}
            </div>
            <button className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-amber-300 text-amber-700 text-xs font-bold">
              View All Jodi Chart
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="rounded-2xl border border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-1.5 mb-3">
              <Crown className="w-4 h-4 text-amber-500" fill="currentColor" />
              <h3 className="text-xs font-extrabold text-gray-900 tracking-tight">
                PANA TOP OPEN
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              {MOCK_PANA_TOP_OPEN.map((p) => (
                <div key={p.n} className="flex items-center gap-2">
                  <span className="px-2.5 py-1.5 rounded-full bg-gradient-to-b from-amber-200 to-amber-300 border border-amber-400/60 text-amber-900 text-xs font-extrabold shrink-0">
                    {p.n}
                  </span>
                  <span className="text-[11px] text-gray-500 font-semibold">
                    {p.times} Times
                  </span>
                </div>
              ))}
            </div>
            <button className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-amber-300 text-amber-700 text-xs font-bold">
              View All Pana Chart
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ===== Upgrade banner ===== */}
        <div className="rounded-2xl bg-gradient-to-r from-[#2a0e4d] via-[#3d1466] to-[#1a0a33] p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Trophy
              className="w-8 h-8 text-amber-300 shrink-0"
              fill="currentColor"
            />
            <div className="min-w-0">
              <p className="text-white text-xs font-extrabold leading-snug">
                GET ADVANCED CHARTS &amp; 100% ACCURATE ANALYSIS
              </p>
              <p className="text-amber-200/70 text-[11px] mt-0.5">
                Predict better, win bigger!
              </p>
            </div>
          </div>
          <button className="shrink-0 flex items-center gap-1 px-4 py-2.5 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 text-[#2a0e4d] text-xs font-extrabold shadow">
            Upgrade Now
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
