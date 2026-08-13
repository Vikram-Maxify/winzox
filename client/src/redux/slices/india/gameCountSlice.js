import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../api";

export const getGameCounts = createAsyncThunk(
  "indiaGameCount/getGameCounts",
  async (_, thunkAPI) => {
    try {
      const { data } = await api.get("/india/game-counts");
      return data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || "Something went wrong");
    }
  }
);

const indiaGameCountSlice = createSlice({
  name: "indiaGameCount",
  initialState: { loading: false, gameCounts: [], error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getGameCounts.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(getGameCounts.fulfilled, (state, action) => {
        state.loading = false; state.gameCounts = action.payload || [];
      })
      .addCase(getGameCounts.rejected, (state, action) => {
        state.loading = false; state.error = action.payload;
      });
  },
});

export default indiaGameCountSlice.reducer;
