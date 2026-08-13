import { Trophy, UserCircle2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const topWinners = [
  { rank: 1, name: "Rahul K.", amount: "₹12,50,000" },
  { rank: 2, name: "Alex M.", amount: "₹8,20,000" },
  { rank: 3, name: "Suman P.", amount: "₹5,60,000" },
];

// Base ranks 4-10 (used for amount range + live rotation)
const baseOtherWinners = [
  { rank: 4, name: "John D.", amount: "₹3,20,000" },
  { rank: 5, name: "Amit S.", amount: "₹2,75,000" },
  { rank: 6, name: "Peter K.", amount: "₹2,10,000" },
  { rank: 7, name: "Ram C.", amount: "₹1,80,000" },
  { rank: 8, name: "David L.", amount: "₹1,50,000" },
  { rank: 9, name: "Ali R.", amount: "₹1,20,000" },
  { rank: 10, name: "Mohan T.", amount: "₹1,00,000" },
];

// Pool of names to rotate through, simulating fresh players joining the board
const namePool = [
  "Vikram S.",
  "Neha J.",
  "Carlos R.",
  "Priya M.",
  "Tom W.",
  "Sana K.",
  "Arjun B.",
  "Emily T.",
  "Farhan A.",
  "Divya N.",
  "Michael O.",
  "Kavya R.",
  "Rohit V.",
  "Lisa C.",
  "Imran H.",
  "Ananya D.",
  "Steve P.",
  "Zoya F.",
  "Karan G.",
  "Meera S.",
  "Daniel K.",
  "Pooja L.",
  "Yusuf M.",
  "Sara B.",
  "Nikhil T.",
];

const formatINR = (num) => "₹" + Math.round(num).toLocaleString("en-IN");

// Rank badge colors for top 3, matching the reference (gold / silver / bronze)
const rankBadgeStyle = {
  1: "bg-yellow-400 text-white",
  2: "bg-gray-300 text-white",
  3: "bg-orange-400 text-white",
};

export default function TopWinners() {
  const [winners, setWinners] = useState(baseOtherWinners);
  const usedNames = useRef(new Set(baseOtherWinners.map((w) => w.name)));

  // Live rotation: every few seconds, swap one row (rank 4-10) with a fresh name
  useEffect(() => {
    const interval = setInterval(() => {
      setWinners((prev) => {
        const idx = Math.floor(Math.random() * prev.length);
        const current = prev[idx];

        let candidates = namePool.filter((n) => !usedNames.current.has(n));
        if (candidates.length === 0) candidates = namePool;
        const newName =
          candidates[Math.floor(Math.random() * candidates.length)];

        usedNames.current.delete(current.name);
        usedNames.current.add(newName);

        const baseAmount = parseInt(current.amount.replace(/[₹,]/g, ""), 10);
        const jitter = Math.round(baseAmount * (0.94 + Math.random() * 0.1));

        const updated = [...prev];
        updated[idx] = { ...current, name: newName, amount: formatINR(jitter) };
        return updated;
      });
    }, 3200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-2xl mx-auto px-3 py-5 bg-gray-50">
      {/* Header — matches reference: bold trophy icon + bold uppercase title */}
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="text-yellow-500" size={20} fill="currentColor" />
        <h2 className="text-[15px] font-extrabold text-gray-900 tracking-wide uppercase">
          Top Winners
        </h2>
      </div>

      {/* Side-by-side panels, matching the reference layout */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Top 3 Winners panel */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="text-center py-2 px-1 border-b border-gray-100">
            <span className="text-orange-500 font-bold text-[10px] sm:text-[11px] tracking-wide">
              TOP 3 WINNERS
            </span>
          </div>
          <div className="px-2.5 py-2.5 space-y-5">
            {topWinners.map((w) => (
              <div key={w.rank} className="flex items-center gap-1.5">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[14px] font-bold flex-shrink-0 ${rankBadgeStyle[w.rank]}`}
                >
                  {w.rank}
                </div>
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                  <UserCircle2 className="text-gray-400" size={15} />
                </div>
                <span className="flex-1 min-w-0 text-gray-800 font-semibold text-[11px] truncate">
                  {w.name}
                </span>
                <span className="text-orange-500 font-bold text-[10px] sm:text-[11px] whitespace-nowrap">
                  {w.amount}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 4-10 Rank Winners panel */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="text-center py-2 px-1 border-b border-gray-100">
            <span className="text-orange-500 font-bold text-[10px] sm:text-[11px] tracking-wide">
              4 - 10 RANK WINNERS
            </span>
          </div>
          <div className="px-2.5 py-2">
            {winners.map((w) => (
              <div key={w.rank} className="flex items-center gap-1.5">
                <span className="w-3 text-gray-500 text-[10px] sm:text-[11px] font-medium flex-shrink-0">
                  {w.rank}
                </span>
                <span className="flex-1 min-w-0 text-gray-800 font-medium text-[11px] truncate">
                  {w.name}
                </span>
                <span className="text-gray-700 font-semibold text-[10px] sm:text-[11px] whitespace-nowrap">
                  {w.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
