import {
  ArrowLeftFromLine,
  ArrowRight,
  ArrowRightFromLine,
  Clock,
  Compass,
  Crown,
  Dice5,
  Filter,
  Gamepad2,
  Gem,
  Hash,
  Inbox,
  Moon,
  Search,
  Sparkles,
  Star,
  Sun,
  Target,
  Timer,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getActiveMarkets } from "../../redux/slices/marketSlice";

const MatkaMarkets = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { activeMarkets, loading } = useSelector((state) => state.market);
  const [search, setSearch] = useState("");
  const [filterGameType, setFilterGameType] = useState("");

  useEffect(() => {
    dispatch(getActiveMarkets());
  }, [dispatch]);

  const gameTypes = [
    "single",
    "jodi",
    "panna",
    "half-sangam",
    "full-sangam",
    "last-digit",
    "first-digit",
  ];

  const getGameTypeDisplay = (type) => {
    const display = {
      single: "Single",
      jodi: "Jodi",
      panna: "Panna",
      "half-sangam": "Half-Sangam",
      "full-sangam": "Full-Sangam",
      "last-digit": "Last Digit",
      "first-digit": "First Digit",
    };
    return display[type] || type;
  };

  const getGameTypeGradient = (type) => {
    const gradients = {
      single: "from-blue-400 to-indigo-500",
      jodi: "from-green-400 to-emerald-500",
      panna: "from-purple-400 to-violet-500",
      "half-sangam": "from-orange-400 to-amber-500",
      "full-sangam": "from-red-400 to-rose-500",
      "last-digit": "from-cyan-400 to-blue-500",
      "first-digit": "from-pink-400 to-rose-500",
    };
    return gradients[type] || "from-gray-400 to-gray-500";
  };

  const getGameTypeIcon = (type) => {
    const icons = {
      single: Target,
      jodi: Hash,
      panna: Dice5,
      "half-sangam": Moon,
      "full-sangam": Sun,
      "last-digit": ArrowRightFromLine,
      "first-digit": ArrowLeftFromLine,
    };
    return icons[type] || Gamepad2;
  };

  const getMarketBadge = (marketName) => {
    const badges = {
      Kalyan: { color: "from-amber-400 to-orange-500", icon: Crown },
      Main: { color: "from-emerald-400 to-teal-500", icon: Star },
      Rajdhani: { color: "from-purple-400 to-pink-500", icon: Gem },
      Time: { color: "from-cyan-400 to-blue-500", icon: Compass },
    };
    const found = Object.keys(badges).find((key) => marketName?.includes(key));
    return found
      ? badges[found]
      : { color: "from-gray-400 to-gray-500", icon: Sparkles };
  };

  const filteredMarkets = activeMarkets?.filter((market) => {
    const matchSearch =
      market.name.toLowerCase().includes(search.toLowerCase()) ||
      market.marketId.toLowerCase().includes(search.toLowerCase());
    const matchGameType = filterGameType
      ? market.gameType === filterGameType
      : true;
    return matchSearch && matchGameType;
  });

  const handlePlaceBid = (marketId, gameType) => {
    navigate(`/matka/place-bid/${marketId}`, {
      state: {
        gameType: gameType,
        marketId: marketId,
      },
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-amber-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 animate-pulse"></div>
          </div>
          <p className="text-gray-500 text-sm mt-4 text-center font-medium">
            Loading markets...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-amber-50/30 px-4 sm:px-6 py-6">
      <div className=" mx-auto space-y-6">
        {/* Header with 3D Effect */}
        <div className="group relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition duration-500"></div>
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6 transform group-hover:scale-[1.01] transition duration-300">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full blur-md"></div>
                  <div className="relative bg-gradient-to-br from-amber-400 to-orange-500 p-3 rounded-full shadow-lg">
                    <Compass size={28} className="text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
                    Active Markets
                  </h1>
                  <p className="text-gray-500 text-sm flex items-center gap-1">
                    <Sparkles size={14} className="text-amber-400" />
                    {filteredMarkets?.length || 0} markets available
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative group/input">
                  <Search
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover/input:text-amber-500 transition"
                  />
                  <input
                    type="text"
                    placeholder="Search markets..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent w-full sm:w-48 bg-white/50 backdrop-blur-sm transition duration-200 hover:border-amber-300"
                  />
                </div>
                <div className="relative group/select">
                  <Filter
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover/select:text-amber-500 transition"
                  />
                  <select
                    value={filterGameType}
                    onChange={(e) => setFilterGameType(e.target.value)}
                    className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent appearance-none w-full sm:w-48 bg-white/50 backdrop-blur-sm transition duration-200 hover:border-amber-300"
                  >
                    <option value="">All Types</option>
                    {gameTypes.map((type) => {
                      const Icon = getGameTypeIcon(type);
                      return (
                        <option key={type} value={type}>
                          {getGameTypeDisplay(type)}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Markets Grid */}
        {filteredMarkets?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredMarkets.map((market) => {
              const gameTypeDisplay = getGameTypeDisplay(market.gameType);
              const gameTypeGradient = getGameTypeGradient(market.gameType);
              const GameTypeIcon = getGameTypeIcon(market.gameType);
              const badge = getMarketBadge(market.name);
              const BadgeIcon = badge.icon;

              return (
                <div
                  key={market._id}
                  className="group/card relative transform hover:-translate-y-2 transition-all duration-500"
                >
                  <div
                    className={`absolute -inset-1 bg-gradient-to-r ${badge.color} rounded-2xl blur-xl opacity-20 group-hover/card:opacity-40 transition duration-500`}
                  ></div>
                  <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-5 overflow-hidden transition-all duration-300 hover:border-amber-200">
                    {/* Decorative Gradient */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/10 to-orange-400/10 rounded-full -mr-16 -mt-16"></div>

                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-extrabold text-gray-800 group-hover/card:text-amber-600 transition">
                            {market.name}
                          </h3>
                          <div
                            className={`inline-block p-1 rounded-lg bg-gradient-to-r ${badge.color} shadow-lg`}
                          >
                            <BadgeIcon size={10} className="text-white" />
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 font-mono">
                          ID: {market.marketId}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 bg-green-100/80 backdrop-blur-sm text-green-700 text-xs font-bold px-3 py-1.5 rounded-full border border-green-200 shadow-lg shadow-green-500/10">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        Active
                      </span>
                    </div>

                    {/* Game Details */}
                    <div className="space-y-2.5 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 font-medium">
                          Game Type
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full bg-gradient-to-r ${gameTypeGradient} text-white shadow-lg transform group-hover/card:scale-105 transition duration-300`}
                        >
                          <GameTypeIcon size={14} />
                          {gameTypeDisplay}
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-gray-50/50 backdrop-blur-sm px-3 py-2 rounded-xl">
                        <span className="text-gray-500 flex items-center gap-1.5">
                          <Clock size={14} className="text-amber-400" /> Open
                        </span>
                        <span className="font-bold text-gray-700">
                          {market.openTime}
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-gray-50/50 backdrop-blur-sm px-3 py-2 rounded-xl">
                        <span className="text-gray-500 flex items-center gap-1.5">
                          <Timer size={14} className="text-red-400" /> Close
                        </span>
                        <span className="font-bold text-gray-700">
                          {market.closeTime}
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-gradient-to-r from-amber-50/50 to-orange-50/50 backdrop-blur-sm px-3 py-2 rounded-xl border border-amber-200/50">
                        <span className="text-gray-500 flex items-center gap-1.5">
                          <TrendingUp size={14} className="text-amber-500" />{" "}
                          Range
                        </span>
                        <span className="font-extrabold text-transparent bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text">
                          ₹{market.minBid} - ₹{market.maxBid}
                        </span>
                      </div>
                      {market.resultTime && (
                        <div className="flex justify-between items-center bg-purple-50/50 backdrop-blur-sm px-3 py-2 rounded-xl border border-purple-200/50">
                          <span className="text-gray-500 flex items-center gap-1.5">
                            <Clock size={14} className="text-purple-400" />{" "}
                            Result
                          </span>
                          <span className="font-bold text-purple-700">
                            {market.resultTime}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Place Bid Button */}
                    <button
                      onClick={() =>
                        handlePlaceBid(market._id, market.gameType)
                      }
                      className="relative group/btn w-full mt-4 overflow-hidden rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <div
                        className={`absolute -inset-1 bg-gradient-to-r ${badge.color} rounded-xl blur opacity-30 group-hover/btn:opacity-50 transition duration-500`}
                      ></div>
                      <div
                        className={`relative bg-gradient-to-r ${badge.color} py-3 rounded-xl flex items-center justify-center gap-2 text-white font-bold shadow-lg shadow-amber-500/30`}
                      >
                        <Zap size={16} />
                        Place Bid
                        <ArrowRight
                          size={16}
                          className="group-hover/btn:translate-x-1 transition duration-300"
                        />
                      </div>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="group relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-400/20 to-orange-400/20 rounded-2xl blur-xl"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-16 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-28 h-28 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 flex items-center justify-center animate-float">
                  <Inbox
                    size={56}
                    className="text-amber-500"
                    strokeWidth={1.5}
                  />
                </div>
              </div>
              <p className="text-gray-600 text-xl font-semibold">
                No active markets available
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Check back later for new markets
              </p>
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="text-center text-xs text-gray-400 pt-4">
          <span className="inline-flex items-center gap-1">
            <Gem size={12} className="text-amber-400" />
            Premium Markets • Place your bids now
          </span>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};

export default MatkaMarkets;
