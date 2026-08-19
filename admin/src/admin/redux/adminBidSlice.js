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

// ======================================================
// GET LOWEST BID NUMBER BY MARKET
// ======================================================
export const getLowestBidNumber = createAsyncThunk(
  "adminBid/getLowestBidNumber",
  async (marketId, { rejectWithValue }) => {
    try {
      if (!marketId) {
        return rejectWithValue("Market ID is required");
      }

      const { data } = await api.get(`/bids/admin/lowest/${marketId}`);

      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to get lowest bid number"
      );
    }
  }
);

// ================= INITIAL STATE =================
const initialState = {
  bids: [],
  todayBids: [],
  stats: null,

  // Lowest bid
  lowestBid: null,

  loading: false,
  lowestBidLoading: false,

  error: null,
  lowestBidError: null,

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
      state.lowestBidError = null;
    },

    clearMessage: (state) => {
      state.message = "";
    },

    clearLowestBid: (state) => {
      state.lowestBid = null;
      state.lowestBidError = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // ==================================================
      // GET ALL BIDS
      // ==================================================
      .addCase(getAllBids.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(getAllBids.fulfilled, (state, action) => {
        state.loading = false;

        state.bids = action.payload.data || [];

        state.pagination = action.payload.pagination || {
          page: 1,
          limit: 20,
          total: 0,
          pages: 0,
        };

        state.error = null;
      })

      .addCase(getAllBids.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ==================================================
      // GET TODAY'S BIDS
      // ==================================================
      .addCase(getTodayBids.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(getTodayBids.fulfilled, (state, action) => {
        state.loading = false;

        state.todayBids = action.payload.data || [];

        state.error = null;
      })

      .addCase(getTodayBids.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ==================================================
      // GET BID STATS
      // ==================================================
      .addCase(getBidStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(getBidStats.fulfilled, (state, action) => {
        state.loading = false;

        state.stats = action.payload.data || null;

        state.error = null;
      })

      .addCase(getBidStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ==================================================
      // GET LOWEST BID NUMBER
      // ==================================================
      .addCase(getLowestBidNumber.pending, (state) => {
        state.lowestBidLoading = true;
        state.lowestBidError = null;
      })

      .addCase(getLowestBidNumber.fulfilled, (state, action) => {
        state.lowestBidLoading = false;

        state.lowestBid = action.payload;

        state.lowestBidError = null;
      })

      .addCase(getLowestBidNumber.rejected, (state, action) => {
        state.lowestBidLoading = false;

        state.lowestBidError = action.payload;

        state.lowestBid = null;
      });
  },
});

// ================= ACTIONS =================
export const {
  clearError,
  clearMessage,
  clearLowestBid,
} = adminBidSlice.actions;

// ================= REDUCER =================
export default adminBidSlice.reducer;