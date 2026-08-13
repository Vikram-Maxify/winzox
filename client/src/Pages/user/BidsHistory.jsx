import {
  AlertCircle,
  AlertTriangle,
  ArrowLeftFromLine,
  ArrowRightFromLine,
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  Dice5,
  Hash,
  History,
  Inbox,
  Moon,
  RefreshCw,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  Trophy,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  cancelBid,
  clearBidError,
  getBiddingHistory,
} from "../../redux/slices/bidSlice";

const BidsHistory = () => {
  const dispatch = useDispatch();
  const { bids, loading, pagination, error, message } = useSelector(
    (state) => state.bid,
  );
  const [filter, setFilter] = useState({
    status: "",
    page: 1,
    limit: 10,
  });
  const [actionMessage, setActionMessage] = useState("");
  const [selectedBid, setSelectedBid] = useState(null);

  useEffect(() => {
    dispatch(getBiddingHistory(filter));
  }, [dispatch, filter]);

  useEffect(() => {
    if (error) {
      setActionMessage({ type: "error", text: error });
      setTimeout(() => {
        setActionMessage("");
        dispatch(clearBidError());
      }, 5000);
    }
    if (message) {
      setActionMessage({ type: "success", text: message });
      setTimeout(() => setActionMessage(""), 3000);
    }
  }, [error, message, dispatch]);

  const handleCancelBid = async (bidId) => {
    if (
      window.confirm(
        "Are you sure you want to cancel this bid? You will get a full refund.",
      )
    ) {
      await dispatch(cancelBid(bidId));
      dispatch(getBiddingHistory(filter));
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        color: "from-amber-400 to-yellow-500",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        icon: Clock,
        label: "Pending",
        glow: "shadow-amber-500/30",
      },
      won: {
        color: "from-emerald-400 to-green-500",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-200",
        icon: Trophy,
        label: "Won",
        glow: "shadow-emerald-500/30",
      },
      lost: {
        color: "from-red-400 to-rose-500",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        icon: XCircle,
        label: "Lost",
        glow: "shadow-red-500/30",
      },
      cancelled: {
        color: "from-gray-400 to-gray-500",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
        icon: AlertCircle,
        label: "Cancelled",
        glow: "shadow-gray-500/30",
      },
    };
    return configs[status] || configs.pending;
  };

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
    return icons[type] || Target;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Calculate statistics
  const totalBids = bids?.length || 0;
  const totalWon = bids?.filter((b) => b.status === "won").length || 0;
  const totalPending = bids?.filter((b) => b.status === "pending").length || 0;
  const totalAmount = bids?.reduce((sum, b) => sum + b.bidAmount, 0) || 0;
  const totalWinAmount =
    bids?.reduce((sum, b) => sum + (b.winAmount || 0), 0) || 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-amber-500"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-amber-500 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-amber-50/30 px-3 sm:px-4 py-4 sm:py-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="group relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 via-orange-400 to-yellow-400 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition duration-500"></div>
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-4 sm:p-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full blur-md"></div>
                    <div className="relative bg-gradient-to-br from-amber-400 to-orange-500 p-2.5 sm:p-3 rounded-full shadow-lg">
                      <History size={20} className="text-white sm:w-7 sm:h-7" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-amber-600 to-orange-500 bg-clip-text text-transparent">
                      Bidding History
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1">
                      <Sparkles size={12} className="text-amber-400" />
                      {pagination.total || 0} total bids placed
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => dispatch(getBiddingHistory(filter))}
                  className="p-2 bg-gradient-to-r from-amber-400 to-orange-400 text-white rounded-xl hover:shadow-lg hover:shadow-amber-500/30 transition-all duration-300 active:scale-95"
                >
                  <RefreshCw size={18} className="animate-spin-slow" />
                </button>
              </div>

              {/* Filter */}
              <div className="relative">
                <select
                  value={filter.status}
                  onChange={(e) =>
                    setFilter({ ...filter, status: e.target.value, page: 1 })
                  }
                  className="w-full px-4 py-2.5 pl-10 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent text-sm bg-white/50 backdrop-blur-sm shadow-sm appearance-none"
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  {filter.status === "" && (
                    <BarChart3 size={16} className="text-gray-400" />
                  )}
                  {filter.status === "pending" && (
                    <Clock size={16} className="text-amber-500" />
                  )}
                  {filter.status === "won" && (
                    <Trophy size={16} className="text-emerald-500" />
                  )}
                  {filter.status === "lost" && (
                    <XCircle size={16} className="text-red-500" />
                  )}
                  {filter.status === "cancelled" && (
                    <AlertCircle size={16} className="text-gray-400" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards - Mobile Grid */}
        {bids?.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                icon: Coins,
                gradient: "from-blue-500 to-indigo-600",
                label: "Total Bids",
                value: totalBids,
              },
              {
                icon: TrendingUp,
                gradient: "from-green-500 to-emerald-600",
                label: "Invested",
                value: formatCurrency(totalAmount),
              },
              {
                icon: Trophy,
                gradient: "from-amber-500 to-orange-600",
                label: "Won",
                value: formatCurrency(totalWinAmount),
              },
              {
                icon: BarChart3,
                gradient: "from-purple-500 to-violet-600",
                label: "Win Rate",
                value:
                  totalBids > 0
                    ? `${Math.round((totalWon / totalBids) * 100)}%`
                    : "0%",
              },
            ].map((stat, index) => (
              <div
                key={index}
                className="relative bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-3 sm:p-4"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg flex-shrink-0`}
                  >
                    <stat.icon size={18} className="text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-gray-500 text-[10px] font-medium uppercase tracking-wider truncate">
                      {stat.label}
                    </p>
                    <p className="text-sm sm:text-base font-extrabold text-gray-800 truncate">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Message */}
        {actionMessage && (
          <div className="relative transition-all duration-500">
            <div
              className={`px-4 py-3 rounded-xl backdrop-blur-sm border flex items-center gap-2 ${
                actionMessage.type === "success"
                  ? "bg-emerald-50/80 border-emerald-200 text-emerald-700"
                  : "bg-red-50/80 border-red-200 text-red-700"
              }`}
            >
              {actionMessage.type === "success" ? (
                <CheckCircle2
                  size={18}
                  className="text-emerald-500 flex-shrink-0"
                />
              ) : (
                <AlertTriangle
                  size={18}
                  className="text-red-500 flex-shrink-0"
                />
              )}
              <span className="text-sm">{actionMessage.text}</span>
            </div>
          </div>
        )}

        {/* Mobile Card View */}
        {bids?.length > 0 ? (
          <div className="space-y-3">
            {bids.map((bid) => {
              const statusConfig = getStatusConfig(bid.status);
              const StatusIcon = statusConfig.icon;
              const gameTypeDisplay = getGameTypeDisplay(bid.gameType);
              const gameTypeGradient = getGameTypeGradient(bid.gameType);
              const GameTypeIcon = getGameTypeIcon(bid.gameType);
              const isExpanded = selectedBid === bid._id;

              return (
                <div
                  key={bid._id}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden"
                >
                  {/* Card Header */}
                  <div
                    className="p-4 cursor-pointer active:scale-[0.99] transition-transform"
                    onClick={() => setSelectedBid(isExpanded ? null : bid._id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">
                          #{bid.transactionId?.slice(0, 8)}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-gradient-to-r ${statusConfig.color} text-white shadow-lg`}
                        >
                          <StatusIcon size={12} />
                          {statusConfig.label}
                        </span>
                      </div>
                      <ChevronRight
                        size={20}
                        className={`text-gray-400 transition-transform duration-300 ${isExpanded ? "rotate-90" : ""}`}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-gradient-to-r ${gameTypeGradient} text-white`}
                          >
                            <GameTypeIcon size={12} />
                            {gameTypeDisplay}
                          </span>
                          <span className="text-lg font-black text-transparent bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text">
                            {bid.number}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-500">Market:</span>
                          <span className="font-bold text-amber-600">
                            {bid.marketId?.name || "N/A"}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-700">
                          {formatCurrency(bid.bidAmount)}
                        </p>
                        {bid.winAmount > 0 && (
                          <p className="text-xs font-extrabold text-green-500">
                            +{formatCurrency(bid.winAmount)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 border-t border-gray-100/50 space-y-3">
                      <div className="grid grid-cols-2 gap-2 pt-3">
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                            Bid Amount
                          </p>
                          <p className="text-sm font-bold text-gray-800">
                            {formatCurrency(bid.bidAmount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                            Win Amount
                          </p>
                          <p className="text-sm font-bold text-green-600">
                            {bid.winAmount > 0
                              ? formatCurrency(bid.winAmount)
                              : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                            Game Type
                          </p>
                          <p className="text-sm font-semibold text-gray-700">
                            {gameTypeDisplay}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                            Number
                          </p>
                          <p className="text-sm font-bold text-indigo-600">
                            {bid.number}
                          </p>
                        </div>
                      </div>

                      {/* Action Button */}
                      {bid.status === "pending" && (
                        <button
                          onClick={() => handleCancelBid(bid._id)}
                          className="w-full py-2.5 bg-gradient-to-r from-red-400 to-rose-500 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300 active:scale-95"
                        >
                          Cancel Bid
                        </button>
                      )}
                      {bid.status === "won" && (
                        <div className="flex items-center justify-center gap-2 py-2 bg-emerald-50 rounded-xl">
                          <Trophy size={18} className="text-amber-400" />
                          <span className="font-bold text-emerald-600">
                            Won {formatCurrency(bid.winAmount)}
                          </span>
                        </div>
                      )}
                      {bid.status === "lost" && (
                        <div className="text-center py-2 bg-red-50 rounded-xl">
                          <span className="text-red-500 font-semibold text-sm">
                            Better luck next time!
                          </span>
                        </div>
                      )}
                      {bid.status === "cancelled" && (
                        <div className="text-center py-2 bg-gray-50 rounded-xl">
                          <span className="text-gray-500 font-semibold text-sm">
                            Refunded
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Pagination - Mobile Optimized */}
            <div className="flex flex-col gap-2 pt-2">
              <span className="text-center text-sm text-gray-600 font-medium">
                Showing {bids.length} of {pagination.total} bids
              </span>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() =>
                    setFilter({
                      ...filter,
                      page: Math.max(1, filter.page - 1),
                    })
                  }
                  disabled={filter.page === 1}
                  className="flex items-center gap-1 px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 bg-white/50 backdrop-blur-sm"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <span className="px-4 py-2 rounded-xl text-sm font-bold bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-lg shadow-amber-500/30">
                  {filter.page} / {pagination.pages}
                </span>
                <button
                  onClick={() =>
                    setFilter({
                      ...filter,
                      page: Math.min(pagination.pages, filter.page + 1),
                    })
                  }
                  disabled={filter.page === pagination.pages}
                  className="flex items-center gap-1 px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 bg-white/50 backdrop-blur-sm"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Empty State - Mobile Optimized */
          <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/50 p-8 text-center overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-amber-400/10 to-orange-400/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-yellow-400/10 to-amber-400/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>

            <div className="relative">
              <div className="inline-block mb-4">
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center shadow-2xl shadow-amber-500/20 border-4 border-white/50">
                  <Inbox
                    size={40}
                    className="text-amber-500"
                    strokeWidth={1.5}
                  />
                </div>
              </div>

              <h3 className="text-xl font-extrabold text-gray-800 mb-2">
                No Bids Found
              </h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">
                Start exploring active markets and place your first bid to win
                exciting rewards!
              </p>

              <div className="flex flex-col gap-3 mt-6">
                <Link
                  to="/matka/markets"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-bold shadow-lg shadow-amber-500/30 active:scale-95 transition-transform"
                >
                  <Target size={18} />
                  Browse Markets
                </Link>
                <Link
                  to="/matka/active-games"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-sm border-2 border-gray-200 text-gray-700 rounded-2xl font-bold active:scale-95 transition-transform"
                >
                  <Trophy size={18} />
                  View Active Games
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 2s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default BidsHistory;
