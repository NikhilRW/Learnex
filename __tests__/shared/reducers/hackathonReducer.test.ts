import hackathonReducer, {
  setFilterType,
  clearHackathonCache,
} from '../../../src/shared/reducers/Hackathon';
import {
  HackathonSummary,
  EventSource,
  EventMode,
} from '../../../src/features/EventsAndHackathons/types/hackathon';

// Mock the HackathonService
jest.mock(
  '../../../src/features/EventsAndHackathons/services/hackathonService',
  () => ({
    HackathonService: {
      getHackathons: jest.fn(),
      refreshEvents: jest.fn(),
    },
  }),
);

describe('hackathonReducer', () => {
  const initialState = {
    events: [] as HackathonSummary[],
    filteredEvents: [] as HackathonSummary[],
    currentLocation: 'India',
    loading: false,
    error: null,
    lastFetched: null,
    filterType: 'all',
  };

  const mockEvents: HackathonSummary[] = [
    {
      id: '1',
      source: EventSource.DEVFOLIO,
      title: 'HackMIT',
      description: 'MIT Hackathon',
      startDate: '2025-01-15',
      endDate: '2025-01-17',
      location: 'Boston, MA',
      mode: EventMode.ONLINE,
      imageUrl: 'https://example.com/hackmit.jpg',
      url: 'https://hackmit.org',
    },
    {
      id: '2',
      source: EventSource.HACKEREARTH,
      title: 'ETHGlobal',
      description: 'Ethereum Hackathon',
      startDate: '2025-02-20',
      endDate: '2025-02-22',
      location: 'San Francisco, CA',
      mode: EventMode.IN_PERSON,
      imageUrl: 'https://example.com/ethglobal.jpg',
      url: 'https://ethglobal.com',
    },
    {
      id: '3',
      source: EventSource.DEVFOLIO,
      title: 'BuildAI',
      description: 'AI Building Hackathon',
      startDate: '2025-03-10',
      endDate: '2025-03-12',
      location: 'Online',
      mode: EventMode.ONLINE,
      imageUrl: null,
      url: 'https://buildai.dev',
    },
    {
      id: '4',
      source: EventSource.DEVFOLIO,
      title: 'DevPost Challenge',
      description: 'DevPost Hackathon',
      startDate: '2025-04-05',
      endDate: '2025-04-07',
      location: 'Hybrid Event',
      mode: EventMode.HYBRID,
      imageUrl: 'https://example.com/devpost.jpg',
      url: 'https://devpost.com',
    },
  ];

  it('should return the initial state', () => {
    expect(hackathonReducer(undefined, {type: 'unknown'})).toEqual(
      initialState,
    );
  });

  describe('setFilterType', () => {
    const stateWithEvents = {
      ...initialState,
      events: mockEvents,
      filteredEvents: mockEvents,
    };

    it('should set filter type to "all" and show all events', () => {
      const state = hackathonReducer(stateWithEvents, setFilterType('all'));

      expect(state.filterType).toBe('all');
      expect(state.filteredEvents).toEqual(mockEvents);
      expect(state.filteredEvents.length).toBe(4);
    });

    it('should filter events by "online" mode', () => {
      const state = hackathonReducer(
        stateWithEvents,
        setFilterType(EventMode.ONLINE),
      );

      expect(state.filterType).toBe(EventMode.ONLINE);
      expect(state.filteredEvents.length).toBe(2);
      expect(state.filteredEvents.every(e => e.mode === EventMode.ONLINE)).toBe(
        true,
      );
    });

    it('should filter events by "in-person" mode', () => {
      const state = hackathonReducer(
        stateWithEvents,
        setFilterType(EventMode.IN_PERSON),
      );

      expect(state.filterType).toBe(EventMode.IN_PERSON);
      expect(state.filteredEvents.length).toBe(1);
      expect(state.filteredEvents[0].title).toBe('ETHGlobal');
    });

    it('should filter events by "hybrid" mode', () => {
      const state = hackathonReducer(
        stateWithEvents,
        setFilterType(EventMode.HYBRID),
      );

      expect(state.filterType).toBe(EventMode.HYBRID);
      expect(state.filteredEvents.length).toBe(1);
      expect(state.filteredEvents[0].title).toBe('DevPost Challenge');
    });

    it('should return empty array when no events match filter', () => {
      const state = hackathonReducer(
        stateWithEvents,
        setFilterType('nonexistent'),
      );

      expect(state.filterType).toBe('nonexistent');
      expect(state.filteredEvents.length).toBe(0);
    });

    it('should not modify original events array', () => {
      const state = hackathonReducer(
        stateWithEvents,
        setFilterType(EventMode.ONLINE),
      );

      expect(state.events).toEqual(mockEvents);
      expect(state.events.length).toBe(4);
    });
  });

  describe('clearHackathonCache', () => {
    it('should clear all events and reset lastFetched', () => {
      const stateWithData = {
        ...initialState,
        events: mockEvents,
        filteredEvents: mockEvents,
        lastFetched: Date.now(),
      };

      const state = hackathonReducer(stateWithData, clearHackathonCache());

      expect(state.events).toEqual([]);
      expect(state.filteredEvents).toEqual([]);
      expect(state.lastFetched).toBeNull();
    });

    it('should preserve other state properties', () => {
      const stateWithData = {
        ...initialState,
        events: mockEvents,
        filteredEvents: mockEvents,
        currentLocation: 'India',
        filterType: 'online',
        loading: false,
        error: null,
        lastFetched: Date.now(),
      };

      const state = hackathonReducer(stateWithData, clearHackathonCache());

      expect(state.currentLocation).toBe('India');
      expect(state.filterType).toBe('online');
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('state immutability', () => {
    it('should not mutate the original state on setFilterType', () => {
      const stateWithEvents = {
        ...initialState,
        events: [...mockEvents],
        filteredEvents: [...mockEvents],
      };
      const originalState = JSON.parse(JSON.stringify(stateWithEvents));

      hackathonReducer(stateWithEvents, setFilterType(EventMode.ONLINE));

      expect(stateWithEvents.filterType).toEqual(originalState.filterType);
    });

    it('should not mutate the original state on clearHackathonCache', () => {
      const stateWithEvents = {
        ...initialState,
        events: [...mockEvents],
        filteredEvents: [...mockEvents],
        lastFetched: Date.now(),
      };
      const originalEvents = [...stateWithEvents.events];

      hackathonReducer(stateWithEvents, clearHackathonCache());

      expect(stateWithEvents.events).toEqual(originalEvents);
    });
  });
});
