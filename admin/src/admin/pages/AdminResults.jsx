import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAdminResults,
  declareResult,
  getAdminResultStats,
  clearError,
  clearMessage,
} from "../redux/adminResultSlice";
import { getAdminMarkets } from "../redux/adminMarketSlice";
import {
  Trophy,
  Calendar,
  Filter,
  RefreshCw,
  Plus,
  X,
  Check,
  Clock,
  Award,
  TrendingUp,
  Users,
  DollarSign,
} from "lucide-react";

const AdminResults = () => {
  const dispatch = useDispatch();
  const { results, stats, loading, error, message, success, pagination } = useSelector(
    (state) => state.adminResult
  );
  const { markets } = useSelector((state) => state.adminMarket);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState({
    marketId: "",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 20,
  });
  const [formData, setFormData] = useState({
    marketId: "",
    winningNumber: "",
    resultDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    dispatch(getAdminResults(filter));
    dispatch(getAdminResultStats());
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

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.marketId) {
      alert("Please select a market");
      return;
    }
    if (!formData.winningNumber) {
      alert("Please enter winning number");
      return;
    }

    await dispatch(declareResult(formData));
    dispatch(getAdminResults(filter));
    dispatch(getAdminResultStats());
    setShowModal(false);
    setFormData({
      marketId: "",
      winningNumber: "",
      resultDate: new Date().toISOString().split("T")[0],
    });
  };

  const clearFilters = () => {
    setFilter({
      marketId: "",
      startDate: "",
      endDate: "",
      page: 1,
      limit: 20,
    });
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

  // Updated: Get game type icon
  const getGameTypeIcon = (type) => {
    const icons = {
      single: "1️⃣",
      jodi: "2️⃣",
      panna: "3️⃣",
      "half-sangam": "🔶",
      "full-sangam": "🔷",
      "last-digit": "🔢",
      "first-digit": "🔢"
    };
    return icons[type] || "🎯";
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
            <Trophy size={28} className="text-amber-500" />
            Results
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {pagination.total || 0} total results found
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
        >
          <Plus size={18} />
          Declare Result
        </button>
      </div>

      {/* Stats Cards */}
      {stats && stats.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Trophy size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="text-gray-500 text-xs">Total Results</p>
                <p className="text-xl font-bold text-gray-800">
                  {stats.reduce((acc, s) => acc + s.totalResults, 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                <TrendingUp size={18} className="text-green-600" />
              </div>
              <div>
                <p className="text-gray-500 text-xs">Total Payout</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(stats.reduce((acc, s) => acc + s.totalPayout, 0))}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <Award size={18} className="text-purple-600" />
              </div>
              <div>
                <p className="text-gray-500 text-xs">Total Winners</p>
                <p className="text-xl font-bold text-purple-600">
                  {stats.reduce((acc, s) => acc + s.totalWinningBids, 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                <DollarSign size={18} className="text-orange-600" />
              </div>
              <div>
                <p className="text-gray-500 text-xs">Avg Payout</p>
                <p className="text-xl font-bold text-orange-600">
                  {formatCurrency(
                    stats.reduce((acc, s) => acc + s.avgPayout, 0) / stats.length
                  )}
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
      {success && message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
          ✅ {message}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
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
            <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={filter.startDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
            <input
              type="date"
              name="endDate"
              value={filter.endDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={clearFilters}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-xl hover:bg-gray-200 transition text-sm font-medium"
            >
              Clear
            </button>
            <button
              onClick={() => dispatch(getAdminResults(filter))}
              className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
            >
              <RefreshCw size={18} className="text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Results Table */}
      {results?.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Market</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Game Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Winning Number</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Bids</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Winners</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Payout</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.map((result) => {
                  const gameTypeDisplay = getGameTypeDisplay(result.gameType);
                  const gameTypeColor = getGameTypeColor(result.gameType);
                  return (
                    <tr key={result._id} className="hover:bg-amber-50/30 transition">
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">
                        {result.marketName}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${gameTypeColor}`}>
                          {gameTypeDisplay}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-green-600">
                        {result.winningNumber}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {result.totalBids}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {result.totalWinningBids}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-green-600">
                        {formatCurrency(result.totalPayout)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(result.resultDate).toLocaleDateString("en-IN", {
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
              Showing {results.length} of {pagination.total} results
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
          <div className="text-5xl mb-4">📋</div>
          <p className="text-gray-500 text-lg">No results found</p>
          <p className="text-gray-400 text-sm mt-1">Declare a result to get started</p>
        </div>
      )}

      {/* Declare Result Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Trophy size={20} className="text-amber-500" />
                Declare Result
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Market *
                  </label>
                  <select
                    name="marketId"
                    value={formData.marketId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  >
                    <option value="">Select Market</option>
                    {markets?.filter(m => m.isActive && !m.isResultDeclared).map((m) => (
                      <option key={m._id} value={m._id}>
                        {m.name} ({getGameTypeDisplay(m.gameType)})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    Showing only active markets with pending results
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Winning Number *
                  </label>
                  <input
                    type="text"
                    name="winningNumber"
                    value={formData.winningNumber}
                    onChange={handleInputChange}
                    placeholder="Enter winning number"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Single (0-9) | Jodi (00-99) | Panna (000-999)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Result Date *
                  </label>
                  <input
                    type="date"
                    name="resultDate"
                    value={formData.resultDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-2.5 rounded-xl font-semibold hover:shadow-lg transition"
                >
                  Declare Result
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminResults;