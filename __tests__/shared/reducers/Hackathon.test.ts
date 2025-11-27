import hackathonReducer, {
  fetchHackathons,
  refreshHackathons,
  setFilterType,
  clearHackathonCache,
} from 'shared/reducers/Hackathon';
import { HackathonService } from '@/features/EventsAndHackathons/services/hackathonService';
import { configureStore } from '@reduxjs/toolkit';

// Mock HackathonService
jest.mock('@/features/EventsAndHackathons/services/hackathonService', () => ({
  HackathonService: {
    getHackathons: jest.fn(),
    refreshEvents: jest.fn(),
  },
}));

describe('HackathonReducer', () => {
  const initialState = {
    events: [],
    filteredEvents: [],
    currentLocation: 'India',
    loading: false,
    error: null,
    lastFetched: null,
    filterType: 'all',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return initial state', () => {
    expect(hackathonReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setFilterType', () => {
    const stateWithEvents = {
      ...initialState,
      events: [{ id: '1', mode: 'online' }, { id: '2', mode: 'offline' }] as any,
    };
    const actual = hackathonReducer(stateWithEvents, setFilterType('online'));
    expect(actual.filterType).toEqual('online');
    expect(actual.filteredEvents).toHaveLength(1);
    expect(actual.filteredEvents[0].mode).toEqual('online');
  });

  it('should handle fetchHackathons.pending', () => {
    const action = { type: fetchHackathons.pending.type };
    const actual = hackathonReducer(initialState, action);
    expect(actual.loading).toEqual(true);
    expect(actual.error).toBeNull();
  });

  it('should handle fetchHackathons.fulfilled', () => {
    const mockEvents = [{ id: '1', title: 'Hackathon 1', mode: 'online' }];
    const action = { 
        type: fetchHackathons.fulfilled.type, 
        payload: { events: mockEvents, location: 'India' } 
    };
    const actual = hackathonReducer(initialState, action);
    expect(actual.loading).toEqual(false);
    expect(actual.events).toEqual(mockEvents);
    expect(actual.filteredEvents).toEqual(mockEvents);
    expect(actual.currentLocation).toEqual('India');
  });

  it('should handle fetchHackathons.rejected', () => {
    const action = { 
        type: fetchHackathons.rejected.type, 
        payload: 'Error fetching' 
    };
    const actual = hackathonReducer(initialState, action);
    expect(actual.loading).toEqual(false);
    expect(actual.error).toEqual('Error fetching');
  });

  it('should handle clearHackathonCache', () => {
      const stateWithData = {
          ...initialState,
          events: [{ id: '1' }] as any,
          filteredEvents: [{ id: '1' }] as any,
          lastFetched: 123456,
      };
      const actual = hackathonReducer(stateWithData, clearHackathonCache());
      expect(actual.events).toEqual([]);
      expect(actual.filteredEvents).toEqual([]);
      expect(actual.lastFetched).toBeNull();
  });

  describe('refreshHackathons', () => {
    it('should call getHackathons with forceRefresh=true when refreshEvents is successful', async () => {
        const store = configureStore({ reducer: { hackathon: hackathonReducer } });
        (HackathonService.refreshEvents as jest.Mock).mockResolvedValue({ success: true });
        (HackathonService.getHackathons as jest.Mock).mockResolvedValue([{ id: '1', title: 'Refreshed Event' }]);

        await store.dispatch(refreshHackathons('India'));

        expect(HackathonService.refreshEvents).toHaveBeenCalled();
        expect(HackathonService.getHackathons).toHaveBeenCalledWith(true);
        
        const state = store.getState().hackathon;
        expect(state.events).toHaveLength(1);
        expect(state.events[0].id).toEqual('1');
        expect(state.events[0].title).toEqual('Refreshed Event');
    });

    it('should reject when refreshEvents fails', async () => {
        const store = configureStore({ reducer: { hackathon: hackathonReducer } });
        (HackathonService.refreshEvents as jest.Mock).mockResolvedValue({ success: false, message: 'Refresh failed' });

        const result = await store.dispatch(refreshHackathons('India'));
        
        expect(HackathonService.refreshEvents).toHaveBeenCalled();
        expect(HackathonService.getHackathons).not.toHaveBeenCalled();
        expect(result.type).toEqual(refreshHackathons.rejected.type);
        expect(result.payload).toEqual('Refresh failed');
    });
  });
});
