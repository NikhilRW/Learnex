import deepLinkReducer, {
  setDeepLink,
  clearDeepLink,
  markDeepLinkProcessed,
} from '../../../src/shared/reducers/DeepLink';

describe('deepLinkReducer', () => {
  const initialState = {
    url: null,
    processed: false,
  };

  it('should return the initial state', () => {
    expect(deepLinkReducer(undefined, {type: 'unknown'})).toEqual(initialState);
  });

  describe('setDeepLink', () => {
    it('should set the deep link URL', () => {
      const url = 'learnex://room/ABC123';
      const state = deepLinkReducer(initialState, setDeepLink(url));

      expect(state.url).toBe(url);
      expect(state.processed).toBe(false);
    });

    it('should reset processed to false when setting new URL', () => {
      const processedState = {
        url: 'learnex://old-link',
        processed: true,
      };
      const newUrl = 'learnex://new-link';
      const state = deepLinkReducer(processedState, setDeepLink(newUrl));

      expect(state.url).toBe(newUrl);
      expect(state.processed).toBe(false);
    });

    it('should handle various deep link formats', () => {
      const testUrls = [
        'learnex://room/ABCD-1234',
        'learnex://post/123456',
        'learnex://user/profile',
        'https://learnex.app/share/event',
      ];

      testUrls.forEach(url => {
        const state = deepLinkReducer(initialState, setDeepLink(url));
        expect(state.url).toBe(url);
      });
    });
  });

  describe('clearDeepLink', () => {
    it('should clear the deep link URL', () => {
      const stateWithUrl = {
        url: 'learnex://room/ABC123',
        processed: false,
      };
      const state = deepLinkReducer(stateWithUrl, clearDeepLink());

      expect(state.url).toBeNull();
    });

    it('should not affect processed state when clearing', () => {
      const stateWithProcessed = {
        url: 'learnex://room/ABC123',
        processed: true,
      };
      const state = deepLinkReducer(stateWithProcessed, clearDeepLink());

      expect(state.url).toBeNull();
      expect(state.processed).toBe(true);
    });
  });

  describe('markDeepLinkProcessed', () => {
    it('should mark the deep link as processed', () => {
      const stateWithUrl = {
        url: 'learnex://room/ABC123',
        processed: false,
      };
      const state = deepLinkReducer(stateWithUrl, markDeepLinkProcessed());

      expect(state.processed).toBe(true);
      expect(state.url).toBe('learnex://room/ABC123');
    });

    it('should work even when URL is null', () => {
      const state = deepLinkReducer(initialState, markDeepLinkProcessed());

      expect(state.processed).toBe(true);
      expect(state.url).toBeNull();
    });
  });

  describe('deep link workflow', () => {
    it('should handle complete deep link lifecycle', () => {
      // Step 1: Receive deep link
      let state = deepLinkReducer(
        initialState,
        setDeepLink('learnex://room/TEST-1234'),
      );
      expect(state.url).toBe('learnex://room/TEST-1234');
      expect(state.processed).toBe(false);

      // Step 2: Mark as processed after navigation
      state = deepLinkReducer(state, markDeepLinkProcessed());
      expect(state.url).toBe('learnex://room/TEST-1234');
      expect(state.processed).toBe(true);

      // Step 3: Clear the deep link
      state = deepLinkReducer(state, clearDeepLink());
      expect(state.url).toBeNull();
      expect(state.processed).toBe(true);
    });
  });

  describe('state immutability', () => {
    it('should not mutate the original state', () => {
      const originalState = {...initialState};
      deepLinkReducer(initialState, setDeepLink('learnex://test'));
      expect(initialState).toEqual(originalState);
    });
  });
});
