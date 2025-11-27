import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {HackathonSummary} from 'events-and-hackathons/types/hackathon';
import {HackathonService} from '@/features/EventsAndHackathons/services/hackathonService';

/**
 * Interface for the hackathon state in Redux
 */
interface HackathonState {
  events: HackathonSummary[];
  filteredEvents: HackathonSummary[];
  currentLocation: string;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
  filterType: string;
}

/**
 * Initial state for the hackathon reducer
 */
const initialState: HackathonState = {
  events: [],
  filteredEvents: [],
  currentLocation: 'India',
  loading: false,
  error: null,
  lastFetched: null,
  filterType: 'all',
};

/**
 * Async thunk to fetch hackathon events
 */
export const fetchHackathons = createAsyncThunk(
  'hackathon/fetchHackathons',
  async (
    {
      // location = 'India',
      forceRefresh = false,
    }: {location?: string; forceRefresh?: boolean} = {location: 'India'},
    {rejectWithValue},
  ) => {
    try {
      // Always use 'India' as the location
      const finalLocation = 'India';
      const events = await HackathonService.getHackathons(forceRefresh);
      return {events, location: finalLocation};
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to fetch hackathons',
      );
    }
  },
);

/**
 * Async thunk to refresh hackathon events from the server
 */
export const refreshHackathons = createAsyncThunk(
  'hackathon/refreshHackathons',
  async (
    location: string = 'India',
    // _,
    {dispatch, rejectWithValue},
  ) => {
    try {

      // First refresh the events on the server
      const refreshResult = await HackathonService.refreshEvents();

      if (refreshResult.success) {
        // Then fetch the refreshed events with forceRefresh=true to bypass any caching
        return dispatch(
          fetchHackathons({location: location, forceRefresh: true}),
        ).unwrap();
      } else {
        return rejectWithValue(refreshResult.message);
      }
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : 'Failed to refresh hackathons',
      );
    }
  },
);

/**
 * Hackathon slice for Redux
 */
export const hackathonSlice = createSlice({
  name: 'hackathon',
  initialState,
  reducers: {
    setFilterType: (state, action: PayloadAction<string>) => {
      state.filterType = action.payload;
      // Apply filter to events
      if (action.payload === 'all') {
        state.filteredEvents = state.events;
      } else {
        state.filteredEvents = state.events.filter(
          event => event.mode === action.payload,
        );
      }
    },
    clearHackathonCache: state => {
      state.events = [];
      state.filteredEvents = [];
      state.lastFetched = null;
    },
  },
  extraReducers: builder => {
    builder
      // Handle fetchHackathons
      .addCase(fetchHackathons.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHackathons.fulfilled, (state, action) => {
        state.events = action.payload.events;
        state.currentLocation = action.payload.location;
        state.lastFetched = Date.now();
        state.loading = false;

        // Apply current filter
        if (state.filterType === 'all') {
          state.filteredEvents = action.payload.events;
        } else {
          state.filteredEvents = action.payload.events.filter(
            event => event.mode === state.filterType,
          );
        }
      })
      .addCase(fetchHackathons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {setFilterType, clearHackathonCache} = hackathonSlice.actions;

export default hackathonSlice.reducer;
