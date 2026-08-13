import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api } from './api';


// Place a bid
export const placeBid = createAsyncThunk(
  'bid/place',
  async (bidData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await api.post(`/bids/place`, bidData, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Get user's bidding history
export const getBiddingHistory = createAsyncThunk(
  'bid/getHistory',
  async (params, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await api.get(`/bids/history`, {
        params,
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Get today's bids summary
export const getTodayBidsSummary = createAsyncThunk(
  'bid/getTodaySummary',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await api.get(`/bids/today-summary`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Cancel bid
export const cancelBid = createAsyncThunk(
  'bid/cancel',
  async (bidId, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await api.delete(`/bids/${bidId}/cancel`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Get bid by ID
export const getBidById = createAsyncThunk(
  'bid/getById',
  async (bidId, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await api.get(`/bids/${bidId}`, {
        headers: { Authorization: `Bearer ${auth.token}` },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  bids: [],
  currentBid: null,
  todaySummary: null,
  isLoading: false,
  isError: false,
  message: '',
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
};

const bidSlice = createSlice({
  name: 'bid',
  initialState,
  reducers: {
    clearBidError: (state) => {
      state.isError = false;
      state.message = '';
    },
    clearCurrentBid: (state) => {
      state.currentBid = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Place bid
      .addCase(placeBid.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(placeBid.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentBid = action.payload.data.bid;
        state.isError = false;
        state.message = action.payload.message;
      })
      .addCase(placeBid.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload?.message || 'Failed to place bid';
      })
      // Get bidding history
      .addCase(getBiddingHistory.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getBiddingHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.bids = action.payload.data;
        state.pagination = action.payload.pagination;
        state.isError = false;
      })
      .addCase(getBiddingHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload?.message || 'Failed to get bidding history';
      })
      // Get today summary
      .addCase(getTodayBidsSummary.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getTodayBidsSummary.fulfilled, (state, action) => {
        state.isLoading = false;
        state.todaySummary = action.payload.data;
        state.isError = false;
      })
      .addCase(getTodayBidsSummary.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload?.message || 'Failed to get today summary';
      })
      // Cancel bid
      .addCase(cancelBid.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(cancelBid.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update bid status in list
        const index = state.bids.findIndex((b) => b._id === action.payload.data.bidId);
        if (index !== -1) {
          state.bids[index].status = 'cancelled';
        }
        state.isError = false;
        state.message = action.payload.message;
      })
      .addCase(cancelBid.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload?.message || 'Failed to cancel bid';
      })
      // Get bid by ID
      .addCase(getBidById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getBidById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentBid = action.payload.data;
        state.isError = false;
      })
      .addCase(getBidById.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload?.message || 'Failed to get bid details';
      });
  },
});

export const { clearBidError, clearCurrentBid } = bidSlice.actions;
export default bidSlice.reducer;