import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "./api";

// ================= GET ALL BIDS (ADMIN) =================
export const getAllBids = createAsyncThunk(
  "adminBid/getAll",
  async (params, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/bids/admin/all", { params });
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to get bids"
      );
    }
  }
);

// ================= GET BID STATS =================
export const getBidStats = createAsyncThunk(
  "adminBid/getStats",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/bids/admin/stats");
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to get bid stats"
      );
    }
  }
);

// ================= GET TODAY'S BIDS (ADMIN) =================
export const getTodayBids = createAsyncThunk(
  "adminBid/getToday",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/bids/admin/today");
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to get today's bids"
      );
    }
  }
);

// ================= INITIAL STATE =================
const initialState = {
  bids: [],
  todayBids: [],
  stats: null,
  loading: false,
  error: null,
  message: "",
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
};

// ================= SLICE =================
const adminBidSlice = createSlice({
  name: "adminBid",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearMessage: (state) => {
      state.message = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // ========== GET ALL BIDS ==========
      .addCase(getAllBids.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllBids.fulfilled, (state, action) => {
        state.loading = false;
        state.bids = action.payload.data;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(getAllBids.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ========== GET TODAY'S BIDS ==========
      .addCase(getTodayBids.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getTodayBids.fulfilled, (state, action) => {
        state.loading = false;
        state.todayBids = action.payload.data;
        state.error = null;
      })
      .addCase(getTodayBids.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ========== GET BID STATS ==========
      .addCase(getBidStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBidStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload.data;
        state.error = null;
      })
      .addCase(getBidStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearMessage } = adminBidSlice.actions;
export default adminBidSlice.reducer;