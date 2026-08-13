import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "./api";

// ================= CREATE MARKET =================
export const createMarket = createAsyncThunk(
  "adminMarket/create",
  async (marketData, { rejectWithValue }) => {
    try {
      const { data } = await api.post("/markets/create", marketData);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create market"
      );
    }
  }
);

// ================= GET ALL MARKETS (ADMIN) =================
export const getAdminMarkets = createAsyncThunk(
  "adminMarket/getAll",
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/markets", { params });
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to get markets"
      );
    }
  }
);

// ================= UPDATE MARKET =================
export const updateMarket = createAsyncThunk(
  "adminMarket/update",
  async ({ marketId, updates }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/markets/${marketId}`, updates);
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update market"
      );
    }
  }
);

// ================= TOGGLE MARKET STATUS =================
export const toggleMarketStatus = createAsyncThunk(
  "adminMarket/toggle",
  async ({ marketId, isActive }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/markets/${marketId}/toggle`, { isActive });
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to toggle market status"
      );
    }
  }
);

// ================= DELETE MARKET =================
export const deleteMarket = createAsyncThunk(
  "adminMarket/delete",
  async (marketId, { rejectWithValue }) => {
    try {
      const { data } = await api.delete(`/markets/${marketId}`);
      return { ...data, marketId };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to delete market"
      );
    }
  }
);

// ================= INITIAL STATE =================
const initialState = {
  markets: [],
  currentMarket: null,
  loading: false,
  error: null,
  message: "",
  success: false,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
};

// ================= SLICE =================
const adminMarketSlice = createSlice({
  name: "adminMarket",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearMessage: (state) => {
      state.message = "";
      state.success = false;
    },
    clearCurrentMarket: (state) => {
      state.currentMarket = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ========== CREATE MARKET ==========
      .addCase(createMarket.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createMarket.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.message = action.payload.message;
        state.markets.unshift(action.payload.data);
        state.error = null;
      })
      .addCase(createMarket.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      })

      // ========== GET ALL MARKETS ==========
      .addCase(getAdminMarkets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAdminMarkets.fulfilled, (state, action) => {
        state.loading = false;
        state.markets = action.payload.data;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(getAdminMarkets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ========== UPDATE MARKET ==========
      .addCase(updateMarket.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateMarket.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.message = action.payload.message;
        const index = state.markets.findIndex(
          (m) => m._id === action.payload.data._id
        );
        if (index !== -1) {
          state.markets[index] = action.payload.data;
        }
        state.error = null;
      })
      .addCase(updateMarket.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload;
      })

      // ========== TOGGLE MARKET STATUS ==========
      .addCase(toggleMarketStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleMarketStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
        const index = state.markets.findIndex(
          (m) => m._id === action.payload.data._id
        );
        if (index !== -1) {
          state.markets[index] = action.payload.data;
        }
        state.error = null;
      })
      .addCase(toggleMarketStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ========== DELETE MARKET ==========
      .addCase(deleteMarket.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMarket.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
        state.markets = state.markets.filter(
          (m) => m._id !== action.payload.marketId
        );
        state.error = null;
      })
      .addCase(deleteMarket.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearMessage, clearCurrentMarket } = adminMarketSlice.actions;
export default adminMarketSlice.reducer;