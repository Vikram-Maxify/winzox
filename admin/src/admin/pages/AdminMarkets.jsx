import {
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

const AdminMarkets = () => {
  const dispatch = useDispatch();

  const {
    markets = [],
    loading = false,
    error = null,
    message = "",
    success = false,
  } = useSelector(
    (state) =>
      state.adminMarket || {
        markets: [],
        loading: false,
        error: null,
        message: "",
        success: false,
      }
  );

  // ======================================================
  // STATES
  // ======================================================

  const [showModal, setShowModal] = useState(false);
  const [editingMarket, setEditingMarket] = useState(null);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    marketId: "",
    openTime: "",
    closeTime: "",
    resultTime: "",
    minBid: "",
    maxBid: "",
    description: "",
    image: null,
  });

  // ======================================================
  // IMAGE PREVIEW
  // ======================================================

  const [imagePreview, setImagePreview] = useState("");

  // ======================================================
  // FETCH MARKETS
  // ======================================================

  useEffect(() => {
    dispatch(getAdminMarkets({ limit: 100 }));
  }, [dispatch]);

  // ======================================================
  // CLEAR ERROR / MESSAGE
  // ======================================================

  useEffect(() => {
    let errorTimer;
    let messageTimer;

    if (error) {
      errorTimer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
    }

    if (message) {
      messageTimer = setTimeout(() => {
        dispatch(clearMessage());
      }, 3000);
    }

    return () => {
      if (errorTimer) {
        clearTimeout(errorTimer);
      }

      if (messageTimer) {
        clearTimeout(messageTimer);
      }
    };
  }, [error, message, dispatch]);

  // ======================================================
  // GENERATE MARKET ID
  // ======================================================

  const generateMarketId = () => {
    if (!markets || markets.length === 0) {
      return "MKT001";
    }

    const numbers = markets
      .map((market) => {
        const match = market.marketId?.match(/MKT(\d+)/);

        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((num) => num > 0);

    if (numbers.length === 0) {
      return "MKT001";
    }

    const maxNumber = Math.max(...numbers);
    const nextNumber = maxNumber + 1;

    return `MKT${String(nextNumber).padStart(3, "0")}`;
  };

  // ======================================================
  // AUTO MARKET ID
  // ======================================================

  useEffect(() => {
    if (showModal && !editingMarket) {
      setFormData((prev) => ({
        ...prev,
        marketId: generateMarketId(),
      }));
    }
  }, [showModal, editingMarket, markets]);

  // ======================================================
  // INPUT CHANGE
  // ======================================================

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ======================================================
  // IMAGE CHANGE
  // ======================================================

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // Check image type
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");

      e.target.value = "";

      return;
    }

    // Maximum 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB.");

      e.target.value = "";

      return;
    }

    setFormData((prev) => ({
      ...prev,
      image: file,
    }));

    // Create preview
    const previewUrl = URL.createObjectURL(file);

    setImagePreview(previewUrl);
  };

  // ======================================================
  // SUBMIT MARKET
  // ======================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // ==================================================
      // VALIDATION
      // ==================================================

      if (!formData.name.trim()) {
        alert("Market name is required.");
        return;
      }

      if (!formData.marketId.trim()) {
        alert("Market ID is required.");
        return;
      }

      if (!formData.openTime) {
        alert("Open time is required.");
        return;
      }

      if (!formData.closeTime) {
        alert("Close time is required.");
        return;
      }

      if (!formData.resultTime) {
        alert("Result time is required.");
        return;
      }

      // ==================================================
      // FORM DATA
      // ==================================================

      const data = new FormData();

      data.append("name", formData.name.trim());

      data.append(
        "marketId",
        formData.marketId.trim()
      );

      data.append(
        "openTime",
        formData.openTime
      );

      data.append(
        "closeTime",
        formData.closeTime
      );

      data.append(
        "resultTime",
        formData.resultTime
      );

      data.append(
        "minBid",
        String(
          Number(formData.minBid) || 10
        )
      );

      data.append(
        "maxBid",
        String(
          Number(formData.maxBid) || 10000
        )
      );

      data.append(
        "description",
        formData.description?.trim() || ""
      );

      // ==================================================
      // IMAGE
      // ==================================================

      if (formData.image instanceof File) {
        data.append(
          "image",
          formData.image
        );
      }

      // ==================================================
      // UPDATE
      // ==================================================

      if (editingMarket) {
        await dispatch(
          updateMarket({
            marketId: editingMarket._id,
            updates: data,
          })
        ).unwrap();
      }

      // ==================================================
      // CREATE
      // ==================================================

      else {
        await dispatch(
          createMarket(data)
        ).unwrap();
      }

      // ==================================================
      // REFRESH
      // ==================================================

      await dispatch(
        getAdminMarkets({
          limit: 100,
        })
      );

      // ==================================================
      // CLOSE
      // ==================================================

      closeModal();
    } catch (err) {
      console.error(
        "Submit market error:",
        err
      );
    }
  };

  // ======================================================
  // EDIT MARKET
  // ======================================================

  const handleEdit = (market) => {
    setEditingMarket(market);

    setFormData({
      name: market.name || "",

      marketId:
        market.marketId || "",

      openTime:
        market.openTime || "",

      closeTime:
        market.closeTime || "",

      resultTime:
        market.resultTime || "",

      minBid:
        market.minBid ?? "",

      maxBid:
        market.maxBid ?? "",

      description:
        typeof market.description === "string"
          ? market.description
          : "",

      image: null,
    });

    // Existing image only if string
    if (
      typeof market.image === "string" &&
      market.image.trim()
    ) {
      setImagePreview(
        market.image
      );
    } else {
      setImagePreview("");
    }

    setShowModal(true);
  };

  // ======================================================
  // TOGGLE STATUS
  // ======================================================

  const handleToggleStatus = async (
    marketId,
    isActive
  ) => {
    try {
      await dispatch(
        toggleMarketStatus({
          marketId,
          isActive: !isActive,
        })
      ).unwrap();

      await dispatch(
        getAdminMarkets({
          limit: 100,
        })
      );
    } catch (err) {
      console.error(
        "Toggle status error:",
        err
      );
    }
  };

  // ======================================================
  // DELETE MARKET
  // ======================================================

  const handleDelete = async (marketId) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this market?"
      );

    if (!confirmed) {
      return;
    }

    try {
      await dispatch(
        deleteMarket(marketId)
      ).unwrap();

      await dispatch(
        getAdminMarkets({
          limit: 100,
        })
      );
    } catch (err) {
      console.error(
        "Delete market error:",
        err
      );
    }
  };

  // ======================================================
  // RESET FORM
  // ======================================================

  const resetForm = () => {
    setFormData({
      name: "",
      marketId: generateMarketId(),
      openTime: "",
      closeTime: "",
      resultTime: "",
      minBid: "",
      maxBid: "",
      description: "",
      image: null,
    });

    setImagePreview("");
  };

  // ======================================================
  // CLOSE MODAL
  // ======================================================

  const closeModal = () => {
    setShowModal(false);
    setEditingMarket(null);

    setFormData({
      name: "",
      marketId: generateMarketId(),
      openTime: "",
      closeTime: "",
      resultTime: "",
      minBid: "",
      maxBid: "",
      description: "",
      image: null,
    });

    setImagePreview("");
  };

  // ======================================================
  // CREATE MODAL
  // ======================================================

  const openCreateModal = () => {
    setEditingMarket(null);

    setFormData({
      name: "",
      marketId: generateMarketId(),
      openTime: "",
      closeTime: "",
      resultTime: "",
      minBid: "",
      maxBid: "",
      description: "",
      image: null,
    });

    setImagePreview("");

    setShowModal(true);
  };

  // ======================================================
  // FILTER MARKETS
  // ======================================================

  const filteredMarkets =
    markets?.filter((market) => {
      const searchValue =
        search.toLowerCase().trim();

      const marketName =
        typeof market.name === "string"
          ? market.name.toLowerCase()
          : "";

      const marketId =
        typeof market.marketId === "string"
          ? market.marketId.toLowerCase()
          : "";

      const matchSearch =
        marketName.includes(searchValue) ||
        marketId.includes(searchValue);

      const matchStatus = filterStatus
        ? filterStatus === "active"
          ? market.isActive
          : !market.isActive
        : true;

      return (
        matchSearch &&
        matchStatus
      );
    }) || [];

  // ======================================================
  // LOADING
  // ======================================================

  if (
    loading &&
    markets.length === 0
  ) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  // ======================================================
  // UI
  // ======================================================

  return (
    <div className="space-y-6 p-4">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Gamepad2
              size={28}
              className="text-amber-500"
            />

            Manage Markets
          </h1>

          <p className="text-gray-500 text-sm mt-1">
            {filteredMarkets.length}{" "}
            markets found
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
        >
          <Plus size={18} />

          Create Market
        </button>
      </div>

      {/* ==================================================
          ERROR
      ================================================== */}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          ⚠️{" "}
          {typeof error === "string"
            ? error
            : error?.message ||
              "Something went wrong"}
        </div>
      )}

      {/* ==================================================
          SUCCESS
      ================================================== */}

      {success && message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
          ✅ {message}
        </div>
      )}

      {/* ==================================================
          FILTERS
      ================================================== */}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              placeholder="Search markets..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Status */}
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(
                e.target.value
              )
            }
            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 w-full sm:w-40"
          >
            <option value="">
              All Status
            </option>

            <option value="active">
              Active
            </option>

            <option value="inactive">
              Inactive
            </option>
          </select>
        </div>
      </div>

      {/* ==================================================
          MARKETS TABLE
      ================================================== */}

      {filteredMarkets.length > 0 ? (
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
                {filteredMarkets.map(
                  (market) => (
                    <tr
                      key={market._id}
                      className="hover:bg-amber-50/30 transition"
                    >
                      {/* ==================================
                          MARKET + IMAGE
                      ================================== */}

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {typeof market.image ===
                            "string" &&
                          market.image.trim() ? (
                            <img
                              src={
                                market.image
                              }
                              alt={
                                market.name ||
                                "Market"
                              }
                              className="w-14 h-14 rounded-xl object-cover border border-gray-200"
                              onError={(
                                e
                              ) => {
                                e.currentTarget.style.display =
                                  "none";
                              }}
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                              <Gamepad2
                                size={22}
                              />
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-800">
                              {market.name ||
                                "Unnamed Market"}
                            </div>

                            {typeof market.description ===
                              "string" &&
                              market.description.trim() && (
                                <div className="text-xs text-gray-400 max-w-[180px] truncate">
                                  {
                                    market.description
                                  }
                                </div>
                              )}
                          </div>
                        </div>
                      </td>

                      {/* ==================================
                          MARKET ID
                      ================================== */}

                      <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                        {market.marketId}
                      </td>

                      {/* ==================================
                          TIMING
                      ================================== */}

                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div>
                          {
                            market.openTime
                          }{" "}
                          -{" "}
                          {
                            market.closeTime
                          }
                        </div>

                        <div className="text-xs text-gray-400">
                          Result:{" "}
                          {
                            market.resultTime
                          }
                        </div>
                      </td>

                      {/* ==================================
                          BID RANGE
                      ================================== */}

                      <td className="px-4 py-3 text-sm text-gray-600">
                        ₹
                        {
                          market.minBid
                        }{" "}
                        - ₹
                        {
                          market.maxBid
                        }
                      </td>

                      {/* ==================================
                          STATUS
                      ================================== */}

                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                            market.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {market.isActive
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      {/* ==================================
                          RESULT
                      ================================== */}

                      <td className="px-4 py-3">
                        <span
                          className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                            market.isResultDeclared
                              ? "bg-blue-100 text-blue-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {market.isResultDeclared
                            ? "Declared"
                            : "Pending"}
                        </span>
                      </td>

                      {/* ==================================
                          ACTIONS
                      ================================== */}

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(
                                market
                              )
                            }
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit
                              size={16}
                            />
                          </button>

                          {/* Toggle */}
                          <button
                            type="button"
                            onClick={() =>
                              handleToggleStatus(
                                market._id,
                                market.isActive
                              )
                            }
                            className={`p-1.5 rounded-lg transition ${
                              market.isActive
                                ? "text-red-600 hover:bg-red-50"
                                : "text-green-600 hover:bg-green-50"
                            }`}
                            title={
                              market.isActive
                                ? "Deactivate"
                                : "Activate"
                            }
                          >
                            <Power
                              size={16}
                            />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                market._id
                              )
                            }
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2
                              size={16}
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-4">
            🎯
          </div>

          <p className="text-gray-500 text-lg">
            No markets found
          </p>

          <p className="text-gray-400 text-sm mt-1">
            Create a new market to get
            started
          </p>
        </div>
      )}

      {/* ==================================================
          CREATE / EDIT MODAL
      ================================================== */}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            {/* ============================================
                MODAL HEADER
            ============================================ */}

            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-800">
                {editingMarket
                  ? "Edit Market"
                  : "Create New Market"}
              </h2>

              <button
                type="button"
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* ============================================
                FORM
            ============================================ */}

            <form
              onSubmit={handleSubmit}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ========================================
                    MARKET NAME
                ======================================== */}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Market Name *
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={
                      formData.name
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="Enter market name"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                {/* ========================================
                    MARKET ID
                ======================================== */}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Market ID *
                  </label>

                  <input
                    type="text"
                    name="marketId"
                    value={
                      formData.marketId
                    }
                    onChange={
                      handleInputChange
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-gray-50"
                    required
                    disabled={
                      !!editingMarket
                    }
                  />

                  {!editingMarket && (
                    <p className="text-xs text-gray-400 mt-1">
                      Auto-generated:{" "}
                      {formData.marketId ||
                        "MKT001"}
                    </p>
                  )}
                </div>

                {/* ========================================
                    OPEN TIME
                ======================================== */}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Open Time *
                  </label>

                  <input
                    type="time"
                    name="openTime"
                    value={
                      formData.openTime
                    }
                    onChange={
                      handleInputChange
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                {/* ========================================
                    CLOSE TIME
                ======================================== */}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Close Time *
                  </label>

                  <input
                    type="time"
                    name="closeTime"
                    value={
                      formData.closeTime
                    }
                    onChange={
                      handleInputChange
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                {/* ========================================
                    RESULT TIME
                ======================================== */}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Result Time *
                  </label>

                  <input
                    type="time"
                    name="resultTime"
                    value={
                      formData.resultTime
                    }
                    onChange={
                      handleInputChange
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                {/* ========================================
                    MIN BID
                ======================================== */}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Min Bid (₹)
                  </label>

                  <input
                    type="number"
                    name="minBid"
                    value={
                      formData.minBid
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="10"
                    min="1"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* ========================================
                    MAX BID
                ======================================== */}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Bid (₹)
                  </label>

                  <input
                    type="number"
                    name="maxBid"
                    value={
                      formData.maxBid
                    }
                    onChange={
                      handleInputChange
                    }
                    placeholder="10000"
                    min="1"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* ========================================
                    DESCRIPTION
                ======================================== */}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={
                      formData.description
                    }
                    onChange={
                      handleInputChange
                    }
                    rows="3"
                    placeholder="Enter market description"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* ========================================
                    MARKET IMAGE
                ======================================== */}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Market Image
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={
                      handleImageChange
                    }
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                  />

                  <p className="text-xs text-gray-400 mt-1">
                    Maximum image size:
                    5MB
                  </p>

                  {/* ====================================
                      IMAGE PREVIEW
                  ==================================== */}

                  {imagePreview && (
                    <div className="mt-4">
                      <p className="text-xs font-medium text-gray-500 mb-2">
                        {formData.image
                          ? "New Image Preview"
                          : "Current Image"}
                      </p>

                      <div className="flex items-start gap-4">
                        <img
                          src={
                            imagePreview
                          }
                          alt="Market Preview"
                          className="w-32 h-32 object-cover rounded-xl border border-gray-200 shadow-sm"
                          onError={(
                            e
                          ) => {
                            e.currentTarget.style.display =
                              "none";
                          }}
                        />

                        {formData.image instanceof
                          File && (
                          <div className="pt-2">
                            <p className="text-sm text-gray-700 font-medium break-all">
                              {
                                formData
                                  .image
                                  .name
                              }
                            </p>

                            <p className="text-xs text-gray-400 mt-1">
                              {(
                                formData
                                  .image
                                  .size /
                                1024 /
                                1024
                              ).toFixed(
                                2
                              )}{" "}
                              MB
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ==========================================
                  BUTTONS
              ========================================== */}

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={
                    loading
                  }
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2.5 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading
                    ? editingMarket
                      ? "Updating..."
                      : "Creating..."
                    : editingMarket
                    ? "Update Market"
                    : "Create Market"}
                </button>

                <button
                  type="button"
                  onClick={
                    closeModal
                  }
                  disabled={
                    loading
                  }
                  className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-300 transition disabled:opacity-60"
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