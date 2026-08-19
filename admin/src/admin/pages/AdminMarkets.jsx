import {
  Check,
  Edit,
  Gamepad2,
  Plus,
  Power,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  clearError,
  clearMessage,
  createMarket,
  deleteMarket,
  getAdminMarkets,
  toggleMarketStatus,
  updateMarket,
} from "../redux/adminMarketSlice";

// Allowed game types
const ALL_GAME_TYPES = [
  "single",
  "jodi",
  "panna",
  "half-sangam",
  "full-sangam",
  "last-digit",
  "first-digit",
];

const AdminMarkets = () => {
  const dispatch = useDispatch();
  const { markets, loading, error, message, success } = useSelector(
    (state) =>
      state.adminMarket || {
        markets: [],
        loading: false,
        error: null,
        message: "",
        success: false,
      },
  );

  const [showModal, setShowModal] = useState(false);
  const [editingMarket, setEditingMarket] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // ✅ FIX: gameTypes as array
  const [formData, setFormData] = useState({
    name: "",
    marketId: "",
    gameTypes: [], // Changed from gameType to gameTypes (array)
    openTime: "",
    closeTime: "",
    resultTime: "",
    minBid: "",
    maxBid: "",
    winningMultiplier: 10,
    description: "",
  });

  useEffect(() => {
    dispatch(getAdminMarkets({ limit: 100 }));
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      setTimeout(() => dispatch(clearError()), 5000);
    }
    if (message) {
      setTimeout(() => dispatch(clearMessage()), 3000);
    }
  }, [error, message, dispatch]);

  // Auto-generate market ID
  const generateMarketId = () => {
    if (!markets || markets.length === 0) {
      return "MKT001";
    }

    const numbers = markets
      .map((market) => {
        const match = market.marketId?.match(/MKT(\d+)/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter((num) => num > 0);

    if (numbers.length === 0) {
      return "MKT001";
    }

    const maxNumber = Math.max(...numbers);
    const nextNumber = maxNumber + 1;
    return `MKT${String(nextNumber).padStart(3, "0")}`;
  };

  useEffect(() => {
    if (showModal && !editingMarket) {
      setFormData((prev) => ({
        ...prev,
        marketId: generateMarketId(),
        gameTypes: [], // Reset gameTypes
      }));
    }
  }, [showModal, editingMarket, markets]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // ✅ FIX: Handle gameTypes multi-select
  const handleGameTypeChange = (e) => {
    const selectedOptions = Array.from(
      e.target.selectedOptions,
      (option) => option.value,
    );
    setFormData({
      ...formData,
      gameTypes: selectedOptions,
    });
  };

  // ✅ FIX: Toggle individual game type
  const toggleGameType = (type) => {
    setFormData((prev) => {
      const current = prev.gameTypes || [];
      if (current.includes(type)) {
        return { ...prev, gameTypes: current.filter((t) => t !== type) };
      } else {
        return { ...prev, gameTypes: [...current, type] };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ FIX: Validate gameTypes
    if (!formData.gameTypes || formData.gameTypes.length === 0) {
      alert("Please select at least one game type");
      return;
    }

    const submitData = {
      ...formData,
      minBid: Number(formData.minBid) || 10,
      maxBid: Number(formData.maxBid) || 10000,
      winningMultiplier: Number(formData.winningMultiplier) || 10,
    };

    try {
      if (editingMarket) {
        await dispatch(
          updateMarket({
            marketId: editingMarket._id,
            updates: submitData,
          }),
        ).unwrap();
      } else {
        await dispatch(createMarket(submitData)).unwrap();
      }
      dispatch(getAdminMarkets({ limit: 100 }));
      setShowModal(false);
      setEditingMarket(null);
      resetForm();
    } catch (err) {
      console.error("Submit error:", err);
    }
  };

  const handleEdit = (market) => {
    setEditingMarket(market);
    setFormData({
      name: market.name || "",
      marketId: market.marketId || "",
      gameTypes: market.gameTypes || [], // ✅ FIX: array
      openTime: market.openTime || "",
      closeTime: market.closeTime || "",
      resultTime: market.resultTime || "",
      minBid: market.minBid || "",
      maxBid: market.maxBid || "",
      winningMultiplier: market.winningMultiplier || 10,
      description: market.description || "",
    });
    setShowModal(true);
  };

  const handleToggleStatus = async (marketId, isActive) => {
    try {
      await dispatch(
        toggleMarketStatus({ marketId, isActive: !isActive }),
      ).unwrap();
      dispatch(getAdminMarkets({ limit: 100 }));
    } catch (err) {
      console.error("Toggle status error:", err);
    }
  };

  const handleDelete = async (marketId) => {
    if (window.confirm("Are you sure you want to delete this market?")) {
      try {
        await dispatch(deleteMarket(marketId)).unwrap();
        dispatch(getAdminMarkets({ limit: 100 }));
      } catch (err) {
        console.error("Delete error:", err);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      marketId: generateMarketId(),
      gameTypes: [],
      openTime: "",
      closeTime: "",
      resultTime: "",
      minBid: "",
      maxBid: "",
      winningMultiplier: 10,
      description: "",
    });
  };

  const getGameTypeLabel = (type) => {
    const labels = {
      single: "Single",
      jodi: "Jodi",
      panna: "Panna",
      "half-sangam": "Half Sangam",
      "full-sangam": "Full Sangam",
      "last-digit": "Last Digit",
      "first-digit": "First Digit",
    };
    return labels[type] || type;
  };

  const getGameTypeColor = (type) => {
    const colors = {
      single: "bg-blue-100 text-blue-700",
      jodi: "bg-green-100 text-green-700",
      panna: "bg-purple-100 text-purple-700",
      "half-sangam": "bg-orange-100 text-orange-700",
      "full-sangam": "bg-red-100 text-red-700",
      "last-digit": "bg-indigo-100 text-indigo-700",
      "first-digit": "bg-pink-100 text-pink-700",
    };
    return colors[type] || "bg-gray-100 text-gray-700";
  };

  // Filter markets
  const filteredMarkets = markets?.filter((market) => {
    const matchSearch =
      market.name?.toLowerCase().includes(search.toLowerCase()) ||
      market.marketId?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus
      ? filterStatus === "active"
        ? market.isActive
        : !market.isActive
      : true;
    return matchSearch && matchStatus;
  });

  if (loading && markets.length === 0) {
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
            <Gamepad2 size={28} className="text-amber-500" />
            Manage Markets
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {filteredMarkets?.length || 0} markets found
          </p>
        </div>
        <button
          onClick={() => {
            setEditingMarket(null);
            resetForm();
            setShowModal(true);
          }}
          className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
        >
          <Plus size={18} />
          Create Market
        </button>
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
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search markets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 w-full sm:w-40"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Markets Table */}
      {filteredMarkets?.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Market
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Game Types
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Timing
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Bid Range
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Result
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMarkets.map((market) => (
                  <tr
                    key={market._id}
                    className="hover:bg-amber-50/30 transition"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">
                      {market.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                      {market.marketId}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(market.gameTypes || []).map((type) => (
                          <span
                            key={type}
                            className={`px-2 py-0.5 text-xs font-medium rounded-full ${getGameTypeColor(type)}`}
                          >
                            {getGameTypeLabel(type)}
                          </span>
                        ))}
                        {(!market.gameTypes ||
                          market.gameTypes.length === 0) && (
                          <span className="text-xs text-gray-400">
                            No types
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div>
                        {market.openTime} - {market.closeTime}
                      </div>
                      <div className="text-xs text-gray-400">
                        Result: {market.resultTime}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      ₹{market.minBid} - ₹{market.maxBid}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                          market.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {market.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                          market.isResultDeclared
                            ? "bg-blue-100 text-blue-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {market.isResultDeclared ? "Declared" : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(market)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() =>
                            handleToggleStatus(market._id, market.isActive)
                          }
                          className={`p-1.5 rounded-lg transition ${
                            market.isActive
                              ? "text-red-600 hover:bg-red-50"
                              : "text-green-600 hover:bg-green-50"
                          }`}
                          title={market.isActive ? "Deactivate" : "Activate"}
                        >
                          <Power size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(market._id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-4">🎯</div>
          <p className="text-gray-500 text-lg">No markets found</p>
          <p className="text-gray-400 text-sm mt-1">
            Create a new market to get started
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {editingMarket ? "Edit Market" : "Create New Market"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingMarket(null);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Market Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Market Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                {/* Market ID */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Market ID *
                  </label>
                  <input
                    type="text"
                    name="marketId"
                    value={formData.marketId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-gray-50"
                    required
                    disabled={!!editingMarket}
                  />
                  {!editingMarket && (
                    <p className="text-xs text-gray-400 mt-1">
                      Auto-generated: {formData.marketId || "MKT001"}
                    </p>
                  )}
                </div>

                {/* ✅ FIX: Game Types - Multi Select with Toggle Buttons */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Game Types * (Select at least one)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_GAME_TYPES.map((type) => {
                      const isSelected = (formData.gameTypes || []).includes(
                        type,
                      );
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => toggleGameType(type)}
                          className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                            isSelected
                              ? "bg-amber-500 text-white shadow-md"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {isSelected && (
                            <Check size={14} className="inline mr-1" />
                          )}
                          {getGameTypeLabel(type)}
                        </button>
                      );
                    })}
                  </div>
                  {(!formData.gameTypes || formData.gameTypes.length === 0) && (
                    <p className="text-xs text-red-500 mt-1">
                      Please select at least one game type
                    </p>
                  )}
                  {formData.gameTypes && formData.gameTypes.length > 0 && (
                    <p className="text-xs text-green-600 mt-1">
                      Selected: {formData.gameTypes.length} type(s)
                    </p>
                  )}
                </div>

                {/* Times */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Open Time *
                  </label>
                  <input
                    type="time"
                    name="openTime"
                    value={formData.openTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Close Time *
                  </label>
                  <input
                    type="time"
                    name="closeTime"
                    value={formData.closeTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Result Time *
                  </label>
                  <input
                    type="time"
                    name="resultTime"
                    value={formData.resultTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                {/* Winning Multiplier */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Winning Multiplier
                  </label>
                  <input
                    type="number"
                    name="winningMultiplier"
                    value={formData.winningMultiplier}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    min="1"
                  />
                </div>

                {/* Bid Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Bid (₹)
                  </label>
                  <input
                    type="number"
                    name="minBid"
                    value={formData.minBid}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Bid (₹)
                  </label>
                  <input
                    type="number"
                    name="maxBid"
                    value={formData.maxBid}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    min="1"
                  />
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2.5 rounded-xl font-semibold hover:shadow-lg transition"
                >
                  {editingMarket ? "Update Market" : "Create Market"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingMarket(null);
                    resetForm();
                  }}
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

export default AdminMarkets;
