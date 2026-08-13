import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllBids, getBidStats, clearError, clearMessage } from "../redux/adminBidSlice";
import { getAdminMarkets } from "../redux/adminMarketSlice";
import {
  Search,
  Filter,
  Clock,
  Trophy,
  XCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  Target,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

const AdminBids = () => {
  const dispatch = useDispatch();
  const { bids, stats, loading, error, message, pagination } = useSelector(
    (state) => state.adminBid
  );
  const { markets } = useSelector((state) => state.adminMarket);
  const [filter, setFilter] = useState({
    status: "",
    marketId: "",
    userId: "",
    gameType: "",
    page: 1,
    limit: 20,
  });
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    dispatch(getAllBids(filter));
    dispatch(getBidStats());
    dispatch(getAdminMarkets({ limit: 100 }));
  }, [dispatch, filter]);

  useEffect(() => {
    if (error) {
      setTimeout(() => dispatch(clearError()), 5000);
    }
    if (message) {
      setTimeout(() => dispatch(clearMessage()), 3000);
    }
  }, [error, message, dispatch]);

  const handleFilterChange = (e) => {
    setFilter({
      ...filter,
      [e.target.name]: e.target.value,
      page: 1,
    });
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock, label: "Pending" },
      won: { color: "bg-green-100 text-green-800", icon: Trophy, label: "Won 🎉" },
      lost: { color: "bg-red-100 text-red-800", icon: XCircle, label: "Lost" },
      cancelled: { color: "bg-gray-100 text-gray-600", icon: AlertCircle, label: "Cancelled" },
    };
    return configs[status] || configs.pending;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  // Updated: Get game type display name
  const getGameTypeDisplay = (type) => {
    const display = {
      single: "Single",
      jodi: "Jodi",
      panna: "Panna",
      "half-sangam": "Half-Sangam",
      "full-sangam": "Full-Sangam",
      "last-digit": "Last Digit",
      "first-digit": "First Digit"
    };
    return display[type] || type;
  };

  // Updated: Get game type color for badge
  const getGameTypeColor = (type) => {
    const colors = {
      single: "bg-blue-100 text-blue-700",
      jodi: "bg-green-100 text-green-700",
      panna: "bg-purple-100 text-purple-700",
      "half-sangam": "bg-orange-100 text-orange-700",
      "full-sangam": "bg-red-100 text-red-700",
      "last-digit": "bg-indigo-100 text-indigo-700",
      "first-digit": "bg-pink-100 text-pink-700"
    };
    return colors[type] || "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Target size={28} className="text-amber-500" />
            All Bids
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {pagination.total || 0} total bids found
          </p>
        </div>
        <button
          onClick={() => dispatch(getAllBids(filter))}
          className="p-2.5 bg-white border border-gray-200 rounded-xl hover:shadow-md transition flex items-center gap-2"
        >
          <RefreshCw size={18} className="text-gray-500" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Target size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="text-gray-500 text-xs">Total Bids</p>
                <p className="text-xl font-bold text-gray-800">{stats.totalBids || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <TrendingUp size={18} className="text-green-600" />
              </div>
              <div>
                <p className="text-gray-500 text-xs">Today's Bids</p>
                <p className="text-xl font-bold text-green-600">{stats.todayBids || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                <DollarSign size={18} className="text-yellow-600" />
              </div>
              <div>
                <p className="text-gray-500 text-xs">Pending Amount</p>
                <p className="text-xl font-bold text-yellow-600">
                  {formatCurrency(stats.statusStats?.find(s => s._id === "pending")?.totalAmount || 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Trophy size={18} className="text-purple-600" />
              </div>
              <div>
                <p className="text-gray-500 text-xs">Total Won</p>
                <p className="text-xl font-bold text-purple-600">
                  {stats.statusStats?.find(s => s._id === "won")?.count || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          ⚠️ {error}
        </div>
      )}
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
          ✅ {message}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              name="status"
              value={filter.status}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Market</label>
            <select
              name="marketId"
              value={filter.marketId}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            >
              <option value="">All Markets</option>
              {markets?.map((m) => (
                <option key={m._id} value={m._id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Game Type</label>
            <select
              name="gameType"
              value={filter.gameType}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            >
              <option value="">All Types</option>
              <option value="single">Single</option>
              <option value="jodi">Jodi</option>
              <option value="panna">Panna</option>
              <option value="half-sangam">Half-Sangam</option>
              <option value="full-sangam">Full-Sangam</option>
              <option value="last-digit">Last Digit</option>
              <option value="first-digit">First Digit</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilter({ ...filter, status: "", marketId: "", gameType: "", page: 1 })}
              className="w-full bg-gray-100 text-gray-700 py-2 rounded-xl hover:bg-gray-200 transition text-sm font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bids Table */}
      {bids?.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Market</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Game</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Number</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Win Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bids.map((bid) => {
                  const statusConfig = getStatusConfig(bid.status);
                  const StatusIcon = statusConfig.icon;
                  const gameTypeDisplay = getGameTypeDisplay(bid.gameType);
                  const gameTypeColor = getGameTypeColor(bid.gameType);
                  return (
                    <tr key={bid._id} className="hover:bg-amber-50/30 transition">
                      <td className="px-4 py-3 text-sm font-mono text-gray-500">
                        {bid.transactionId?.slice(0, 12)}...
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {bid.userId?.name || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {bid.marketId?.name || "N/A"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${gameTypeColor}`}>
                          {gameTypeDisplay}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900">
                        {bid.number}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        ₹{bid.bidAmount}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {bid.winAmount > 0 ? (
                          <span className="text-green-600 font-bold">+₹{bid.winAmount}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${statusConfig.color}`}
                        >
                          <StatusIcon size={12} />
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(bid.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-gray-100">
            <span className="text-sm text-gray-600">
              Showing {bids.length} of {pagination.total} bids
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter({ ...filter, page: Math.max(1, filter.page - 1) })}
                disabled={filter.page === 1}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 disabled:opacity-50 transition"
              >
                Previous
              </button>
              <span className="px-4 py-2 border border-gray-200 rounded-xl text-sm bg-amber-50 text-amber-700 font-medium">
                {filter.page} of {pagination.pages || 1}
              </span>
              <button
                onClick={() => setFilter({ ...filter, page: Math.min(pagination.pages || 1, filter.page + 1) })}
                disabled={filter.page === (pagination.pages || 1)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 disabled:opacity-50 transition"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-gray-500 text-lg">No bids found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
};

export default AdminBids;