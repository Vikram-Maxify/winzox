import {
  Award,
  DollarSign,
  Plus,
  RefreshCw,
  TrendingUp,
  Trophy,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAdminMarkets } from "../redux/adminMarketSlice";
import { getLowestBidNumber, clearLowestBid } from "../redux/adminBidSlice";
import {
  clearError,
  clearMessage,
  declareResult,
  getAdminResults,
  getAdminResultStats,
} from "../redux/adminResultSlice";

const AdminResults = () => {
  const dispatch = useDispatch();

  const resultState = useSelector((state) => state.adminResult) || {};
  const {
    results = [],
    stats = [],
    loading = false,
    error = null,
    message = null,
    success = false,
    pagination = { page: 1, limit: 20, total: 0, pages: 0 },
  } = resultState;

  const marketState = useSelector((state) => state.adminMarket) || {};
  const { markets = [] } = marketState;

  const bidState = useSelector((state) => state.adminBid) || {};
  const {
    lowestBid = null,
    lowestBidLoading = false,
    lowestBidError = null,
  } = bidState;

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
    winningNumbers: {
      single: "",
      jodi: "",
      panna: "",
      "half-sangam": "",
      "full-sangam": "",
      "last-digit": "",
      "first-digit": "",
    },
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

  const handleWinningNumberChange = (gameType, value) => {
    setFormData({
      ...formData,
      winningNumbers: {
        ...formData.winningNumbers,
        [gameType]: value,
      },
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "marketId" || name === "resultDate") {
      setFormData({
        ...formData,
        [name]: value,
      });

      // Fetch the lowest bid number for the selected market.
      if (name === "marketId") {
        if (value) {
          dispatch(getLowestBidNumber(value));
        }
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.marketId) {
      alert("Please select a market");
      return;
    }

    const hasAnyNumber = Object.values(formData.winningNumbers).some(
      (num) => num && num.trim() !== ""
    );
    
    if (!hasAnyNumber) {
      alert("Please enter at least one winning number");
      return;
    }

    const payload = {
      marketId: formData.marketId,
      winningNumbers: formData.winningNumbers,
      resultDate: formData.resultDate,
    };

    await dispatch(declareResult(payload));
    dispatch(getAdminResults(filter));
    dispatch(getAdminResultStats());
    setShowModal(false);
    dispatch(clearLowestBid());
    setFormData({
      marketId: "",
      winningNumbers: {
        single: "",
        jodi: "",
        panna: "",
        "half-sangam": "",
        "full-sangam": "",
        "last-digit": "",
        "first-digit": "",
      },
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
    return display[type] || type || "N/A";
  };

  // ✅ FINAL FIXED: Safely render winning numbers
  const renderWinningNumbers = (result) => {
    try {
      // Agar result hi nahi hai
      if (!result) {
        return <span className="text-gray-400 text-xs">N/A</span>;
      }

      // Agar winningNumber exist nahi karta
      if (!result.winningNumber) {
        return <span className="text-gray-400 text-xs">N/A</span>;
      }

      const wn = result.winningNumber;

      // Agar winningNumber string hai (backward compatibility)
      if (typeof wn === 'string') {
        return (
          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700">
            {wn}
          </span>
        );
      }

      // Agar winningNumber array hai
      if (Array.isArray(wn)) {
        return wn.map((num, index) => (
          <span
            key={index}
            className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700 mr-1 mb-1 inline-block"
          >
            {num}
          </span>
        ));
      }

      // Agar winningNumber object hai (tumhara case)
      if (typeof wn === 'object') {
        // Filter karo sirf non-null, non-empty values
        const entries = Object.entries(wn).filter(([key, value]) => {
          return value !== null && 
                 value !== undefined && 
                 value !== '' && 
                 value !== 'null' &&
                 value !== 'undefined';
        });

        // Agar koi entry nahi hai
        if (entries.length === 0) {
          return <span className="text-gray-400 text-xs">N/A</span>;
        }

        // Map karo entries ko React elements mein
        return entries.map(([gameType, number]) => {
          const displayName = getGameTypeDisplay(gameType);
          return (
            <span
              key={gameType}
              className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700 mr-1 mb-1 inline-block"
            >
              {displayName}: {number}
            </span>
          );
        });
      }

      // Fallback
      return <span className="text-gray-400 text-xs">N/A</span>;
    } catch (error) {
      console.error("Error rendering winning numbers:", error);
      return <span className="text-gray-400 text-xs">Error</span>;
    }
  };

  const calculateStats = () => {
    if (!results || results.length === 0) {
      return {
        totalResults: 0,
        totalPayout: 0,
        totalWinningBids: 0,
        avgPayout: 0,
      };
    }

    const totalResults = results.length;
    const totalPayout = results.reduce(
      (sum, r) => sum + (r.totalPayout || 0),
      0,
    );
    const totalWinningBids = results.reduce(
      (sum, r) => sum + (r.totalWinningBids || 0),
      0,
    );
    const avgPayout = totalResults > 0 ? totalPayout / totalResults : 0;

    return { totalResults, totalPayout, totalWinningBids, avgPayout };
  };

  // Safely resolve market when API returns either:
  // marketId: "ObjectId string"
  // OR marketId: { _id, name, marketId }
  const getMarketName = (marketId) => {
    if (!marketId) return "N/A";

    // Populated market object
    if (typeof marketId === "object") {
      return (
        marketId.name ||
        marketId.marketName ||
        marketId.marketId ||
        marketId._id?.toString?.() ||
        "N/A"
      );
    }

    // Plain ObjectId/string
    const marketIdString = String(marketId);

    const market = markets.find(
      (m) => m && String(m._id) === marketIdString
    );

    return market?.name || market?.marketName || marketIdString || "N/A";
  };

  const statsData = calculateStats();

  const gameTypes = [
    { key: "single", label: "Single", placeholder: "0-9" },
    { key: "jodi", label: "Jodi", placeholder: "00-99" },
    { key: "panna", label: "Panna", placeholder: "000-999" },
    { key: "half-sangam", label: "Half-Sangam", placeholder: "1-3 digits" },
    { key: "full-sangam", label: "Full-Sangam", placeholder: "00-99" },
    { key: "last-digit", label: "Last Digit", placeholder: "00-99" },
    { key: "first-digit", label: "First Digit", placeholder: "00-99" },
  ];

  if (loading && results.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Trophy size={28} className="text-amber-500" />
            Results
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {pagination?.total || results.length || 0} total results found
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Trophy size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-gray-500 text-xs">Total Results</p>
              <p className="text-xl font-bold text-gray-800">
                {statsData.totalResults}
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
                {formatCurrency(statsData.totalPayout)}
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
                {statsData.totalWinningBids}
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
                {formatCurrency(statsData.avgPayout)}
              </p>
            </div>
          </div>
        </div>
      </div>

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
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Market
            </label>
            <select
              name="marketId"
              value={filter.marketId}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            >
              <option value="">All Markets</option>
              {markets?.map((m) => (
                <option key={m._id} value={m._id}>
                  {m?.name || m?.marketName || "Unnamed Market"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Start Date
            </label>
            <input
              type="date"
              name="startDate"
              value={filter.startDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              End Date
            </label>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Market Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Winning Numbers
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total Bids
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Winners
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total Payout
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {results.map((result) => (
                  <tr
                    key={result._id || Math.random()}
                    className="hover:bg-amber-50/30 transition"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-800">
                          {getMarketName(result.marketId)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {renderWinningNumbers(result)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {result.totalBids || 0}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {result.totalWinningBids || 0}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-green-600">
                      {formatCurrency(result.totalPayout || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {result.resultDate
                        ? new Date(result.resultDate).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-gray-100">
            <span className="text-sm text-gray-600">
              Showing {results.length} of {pagination?.total || results.length}{" "}
              results
            </span>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setFilter({
                    ...filter,
                    page: Math.max(1, (filter.page || 1) - 1),
                  })
                }
                disabled={filter.page === 1 || !pagination?.pages}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 disabled:opacity-50 transition"
              >
                Previous
              </button>
              <span className="px-4 py-2 border border-gray-200 rounded-xl text-sm bg-amber-50 text-amber-700 font-medium">
                {filter.page || 1} of {pagination?.pages || 1}
              </span>
              <button
                onClick={() =>
                  setFilter({
                    ...filter,
                    page: Math.min(
                      pagination?.pages || 1,
                      (filter.page || 1) + 1
                    ),
                  })
                }
                disabled={
                  filter.page === (pagination?.pages || 1) || !pagination?.pages
                }
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
          <p className="text-gray-400 text-sm mt-1">
            Declare a result to get started
          </p>
        </div>
      )}

      {/* Declare Result Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Trophy size={20} className="text-amber-500" />
                Declare Result
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  dispatch(clearLowestBid());
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {/* Select Market */}
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
                    {markets
                      ?.filter((m) => m?.isActive && !m?.isResultDeclared)
                      .map((m) => (
                        <option key={m._id} value={m._id}>
                          {m?.name || m?.marketName || "Unnamed Market"}
                        </option>
                      ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    Showing only active markets with pending results
                  </p>

                  {formData.marketId && (
                    <div className="mt-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-medium text-gray-600">
                          Lowest Bid Number
                        </span>

                        {lowestBidLoading ? (
                          <span className="text-xs text-amber-600">
                            Loading...
                          </span>
                        ) : lowestBidError ? (
                          <span className="text-xs text-red-500">
                            {String(lowestBidError)}
                          </span>
                        ) : (
                          <span className="text-sm font-bold text-amber-700">
                            {typeof lowestBid === "object" && lowestBid !== null
                              ? (
                                  lowestBid.number ??
                                  lowestBid.lowestBidNumber ??
                                  lowestBid.data?.number ??
                                  lowestBid.data?.lowestBidNumber ??
                                  "N/A"
                                )
                              : lowestBid ?? "N/A"}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Winning Numbers for all game types */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Winning Numbers (Enter at least one)
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {gameTypes.map((game) => (
                      <div key={game.key}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          {game.label}
                        </label>
                        <input
                          type="text"
                          value={formData.winningNumbers[game.key] || ""}
                          onChange={(e) =>
                            handleWinningNumberChange(game.key, e.target.value)
                          }
                          placeholder={game.placeholder}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    * At least one winning number is required. Leave empty if not applicable.
                  </p>
                </div>

                {/* Result Date */}
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