import {
  Award,
  DollarSign,
  Plus,
  RefreshCw,
  TrendingUp,
  Trophy,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { getAdminMarkets } from "../redux/adminMarketSlice";

import {
  clearError,
  clearMessage,
  declareResult,
  getAdminResults,
  getAdminResultStats,
} from "../redux/adminResultSlice";

import { getLowestBidNumber } from "../redux/adminBidSlice";

const AdminResults = () => {
  const dispatch = useDispatch();

  const resultState = useSelector((state) => state.adminResult) || {};
  const {
    results: rawResults = [],
    stats = [],
    loading = false,
    error = null,
    message = null,
    success = false,
    pagination = {},
  } = resultState;

  const marketState = useSelector((state) => state.adminMarket) || {};
  const { markets: rawMarkets = [] } = marketState;

  const bidState = useSelector((state) => state.adminBid) || {};
  const {
    lowestBid = null,
    lowestBidLoading = false,
    lowestBidError = null,
  } = bidState;

  // Some reducers return data directly while others return { data: [] }.
  const results = Array.isArray(rawResults)
    ? rawResults
    : Array.isArray(rawResults?.data)
      ? rawResults.data
      : [];

  const markets = Array.isArray(rawMarkets)
    ? rawMarkets
    : Array.isArray(rawMarkets?.data)
      ? rawMarkets.data
      : [];

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

  // Load results/stats when filters change.
  useEffect(() => {
    dispatch(getAdminResults(filter));
  }, [dispatch, filter]);

  // Markets and stats do not need to be reloaded for every pagination/filter change.
  useEffect(() => {
    dispatch(getAdminResultStats());
    dispatch(getAdminMarkets({ limit: 100 }));
  }, [dispatch]);

  useEffect(() => {
    if (formData.marketId) {
      dispatch(getLowestBidNumber(formData.marketId));
    }
  }, [dispatch, formData.marketId]);

  useEffect(() => {
    if (!error && !message) return;

    const timer = setTimeout(() => {
      if (error) dispatch(clearError());
      if (message) dispatch(clearMessage());
    }, error ? 5000 : 3000);

    return () => clearTimeout(timer);
  }, [error, message, dispatch]);

  const handleFilterChange = (e) => {
    setFilter((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
      page: 1,
    }));
  };

  const handleInputChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const getMarketIdValue = (market) =>
    typeof market?.marketId === "object"
      ? market.marketId?._id
      : market?._id || market?.marketId;

  const getMarketTypes = (market) => {
    if (Array.isArray(market?.gameTypes) && market.gameTypes.length) {
      return market.gameTypes;
    }

    if (market?.gameType) {
      return [market.gameType];
    }

    return [];
  };

  const getResultTypes = (result) => {
    if (Array.isArray(result?.gameTypes) && result.gameTypes.length) {
      return result.gameTypes;
    }

    if (Array.isArray(result?.marketId?.gameTypes) && result.marketId.gameTypes.length) {
      return result.marketId.gameTypes;
    }

    if (result?.gameType) {
      return [result.gameType];
    }

    if (result?.marketId?.gameType) {
      return [result.marketId.gameType];
    }

    if (result?.summary?.gameType) {
      return [result.summary.gameType];
    }

    return [];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.marketId) {
      alert("Please select a market");
      return;
    }

    const formattedNumber = String(formData.winningNumber || "").trim();

    if (!formattedNumber) {
      alert("Please enter winning number");
      return;
    }

    const selectedMarket = markets.find(
      (m) => getMarketIdValue(m) === formData.marketId
    );

    if (!selectedMarket) {
      alert("Selected market not found");
      return;
    }

    const payload = {
      marketId: formData.marketId,
      winningNumber: formattedNumber,
      resultDate: formData.resultDate,
    };

    try {
      await dispatch(declareResult(payload)).unwrap();

      await Promise.all([
        dispatch(getAdminResults(filter)),
        dispatch(getAdminResultStats()),
        dispatch(getAdminMarkets({ limit: 100 })),
      ]);

      setShowModal(false);

      setFormData({
        marketId: "",
        winningNumber: "",
        resultDate: new Date().toISOString().split("T")[0],
      });
    } catch (err) {
      console.error("Declare Result Error:", err);
    }
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

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(Number(amount) || 0);

  const gameTypeDisplay = {
    single: "Single",
    jodi: "Jodi",
    panna: "Panna",
    "half-sangam": "Half-Sangam",
    "full-sangam": "Full-Sangam",
    "last-digit": "Last Digit",
    "first-digit": "First Digit",
  };

  const gameTypeColors = {
    single: "bg-blue-100 text-blue-700",
    jodi: "bg-green-100 text-green-700",
    panna: "bg-purple-100 text-purple-700",
    "half-sangam": "bg-orange-100 text-orange-700",
    "full-sangam": "bg-red-100 text-red-700",
    "last-digit": "bg-indigo-100 text-indigo-700",
    "first-digit": "bg-pink-100 text-pink-700",
  };

  const getGameTypeDisplay = (type) =>
    gameTypeDisplay[type] || type || "N/A";

  const getGameTypeColor = (type) =>
    gameTypeColors[type] || "bg-gray-100 text-gray-700";

  const statsData = useMemo(() => {
    const totalResults = Number(pagination?.total) || results.length;

    // Prefer backend stats if available, otherwise calculate from visible results.
    const backendStats = Array.isArray(stats) ? stats : [];

    const totalPayout =
      results.reduce((sum, r) => sum + Number(r?.totalPayout || 0), 0);

    const totalWinningBids =
      results.reduce((sum, r) => sum + Number(r?.totalWinningBids || 0), 0);

    return {
      totalResults,
      totalPayout,
      totalWinningBids,
      avgPayout: totalResults ? totalPayout / totalResults : 0,
      backendStats,
    };
  }, [results, pagination, stats]);

  const totalPages = Number(pagination?.pages) || 1;
  const currentPage = Number(filter.page) || 1;

  const pendingMarkets = markets.filter(
    (m) => m?.isActive && !m?.isResultDeclared
  );

  if (loading && results.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Trophy size={28} className="text-amber-500" />
            Results
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {pagination?.total ?? results.length} total results found
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
              {markets.map((m) => (
                <option key={m?._id || m?.marketId} value={m?._id || m?.marketId}>
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
              title="Refresh"
            >
              <RefreshCw size={18} className="text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      {results.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Market
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Market ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Game Types
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Winning Number
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Last Digit
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    First Digit
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
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Result Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Declared By
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {results.map((result, index) => {
                  const marketObject =
                    result?.marketId && typeof result.marketId === "object"
                      ? result.marketId
                      : null;

                  const marketMongoId =
                    marketObject?._id ||
                    (typeof result?.marketId === "string"
                      ? result.marketId
                      : "-");

                  const marketCode = marketObject?.marketId || "-";
                  const marketName =
                    result?.marketName ||
                    marketObject?.name ||
                    result?.summary?.marketName ||
                    result?.name ||
                    "N/A";

                  const types = getResultTypes(result);

                  const declaredBy =
                    result?.declaredBy?.name ||
                    result?.declaredBy?.email ||
                    "-";

                  return (
                    <tr
                      key={result?._id || result?.id || `${marketName}-${index}`}
                      className="hover:bg-amber-50/30 transition"
                    >
                      <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                        {marketName}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div className="font-medium">{marketCode}</div>
                        <div className="text-[10px] text-gray-400 max-w-[120px] truncate">
                          {marketMongoId}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {types.length > 0 ? (
                            types.map((type) => (
                              <span
                                key={type}
                                className={`px-2 py-0.5 text-xs font-medium rounded-full ${getGameTypeColor(
                                  type
                                )}`}
                              >
                                {getGameTypeDisplay(type)}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">N/A</span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-sm font-bold text-green-600">
                        {result?.winningNumber ?? "-"}
                      </td>

                      <td className="px-4 py-3 text-sm font-semibold text-indigo-600">
                        {result?.winningLastDigit ?? "-"}
                      </td>

                      <td className="px-4 py-3 text-sm font-semibold text-pink-600">
                        {result?.winningFirstDigit ?? "-"}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600">
                        {Number(result?.totalBids) || 0}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600">
                        {Number(result?.totalWinningBids) || 0}
                      </td>

                      <td className="px-4 py-3 text-sm font-medium text-green-600">
                        {formatCurrency(result?.totalPayout)}
                      </td>

                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          {result?.status || "declared"}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {result?.resultDate
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

                      <td className="px-4 py-3 text-sm text-gray-600">
                        {declaredBy}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-gray-100">
            <span className="text-sm text-gray-600">
              Showing {results.length} of {pagination?.total ?? results.length} results
            </span>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  setFilter((prev) => ({
                    ...prev,
                    page: Math.max(1, currentPage - 1),
                  }))
                }
                disabled={currentPage <= 1}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm hover:bg-gray-50 disabled:opacity-50 transition"
              >
                Previous
              </button>

              <span className="px-4 py-2 border border-gray-200 rounded-xl text-sm bg-amber-50 text-amber-700 font-medium">
                {currentPage} of {totalPages}
              </span>

              <button
                onClick={() =>
                  setFilter((prev) => ({
                    ...prev,
                    page: Math.min(totalPages, currentPage + 1),
                  }))
                }
                disabled={currentPage >= totalPages}
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

      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
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

                    {pendingMarkets.map((m) => {
                      const id = m?._id;
                      const types = getMarketTypes(m);

                      return (
                        <option key={id} value={id}>
                          {m?.name || "Unnamed"} (
                          {types.length ? types.join(", ") : "N/A"})
                        </option>
                      );
                    })}
                  </select>

                  <p className="text-xs text-gray-400 mt-1">
                    Showing only active markets with pending results
                  </p>

                  {formData.marketId && (
                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium text-amber-700">
                            Lowest Bid Number
                          </p>

                          {lowestBidLoading ? (
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                              <p className="text-sm text-gray-500">
                                Finding lowest bid...
                              </p>
                            </div>
                          ) : lowestBidError ? (
                            <p className="text-sm text-red-600 mt-1">
                              {lowestBidError}
                            </p>
                          ) : lowestBid?.lowestNumber !== undefined &&
                            lowestBid?.lowestNumber !== null ? (
                            <p className="text-2xl font-bold text-amber-700 mt-1">
                              {lowestBid.lowestNumber}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-500 mt-1">
                              No pending bid found
                            </p>
                          )}
                        </div>

                        {lowestBid?.bidAmount !== undefined && (
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Bid Amount</p>
                            <p className="text-sm font-bold text-gray-800">
                              {formatCurrency(lowestBid.bidAmount)}
                            </p>
                          </div>
                        )}
                      </div>

                      {lowestBid?.gameType && (
                        <div className="mt-2 pt-2 border-t border-amber-200">
                          <p className="text-xs text-gray-500">Game Type</p>
                          <p className="text-sm font-semibold text-gray-700">
                            {getGameTypeDisplay(lowestBid.gameType)}
                          </p>
                        </div>
                      )}

                      {lowestBid?.lowestNumber !== undefined &&
                        lowestBid?.lowestNumber !== null && (
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                winningNumber: String(lowestBid.lowestNumber),
                              }))
                            }
                            className="mt-3 w-full bg-amber-500 text-white py-2 rounded-lg text-sm font-semibold hover:bg-amber-600 transition"
                          >
                            Use Lowest Bid Number
                          </button>
                        )}
                    </div>
                  )}
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
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white py-2.5 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-50"
                >
                  {loading ? "Declaring..." : "Declare Result"}
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
