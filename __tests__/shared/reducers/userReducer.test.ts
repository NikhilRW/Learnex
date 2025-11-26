import userReducer, {
  changeIsLoggedIn,
  changeProfileColor,
  changeThemeColor,
  changeUserNewlyOpenedApp,
  setCustomColorPrefrence,
  updateUserPhoto,
} from '../../../src/shared/reducers/User';

// Mock Appearance module
jest.mock('react-native', () => ({
  Appearance: {
    getColorScheme: jest.fn(() => 'light'),
  },
}));

describe('userReducer', () => {
  const initialState = {
    isLoggedIn: false,
    theme: 'light',
    userNewlyOpenedApp: null,
    userProfileColor: null,
    customColorPrefrence: false,
    userPhoto: null,
  };

  it('should return the initial state', () => {
    expect(userReducer(undefined, {type: 'unknown'})).toEqual(initialState);
  });

  describe('changeIsLoggedIn', () => {
    it('should set isLoggedIn to true', () => {
      const state = userReducer(initialState, changeIsLoggedIn(true));
      expect(state.isLoggedIn).toBe(true);
    });

    it('should set isLoggedIn to false', () => {
      const loggedInState = {...initialState, isLoggedIn: true};
      const state = userReducer(loggedInState, changeIsLoggedIn(false));
      expect(state.isLoggedIn).toBe(false);
    });
  });

  describe('changeProfileColor', () => {
    it('should update userProfileColor', () => {
      const state = userReducer(initialState, changeProfileColor('#FF0000'));
      expect(state.userProfileColor).toBe('#FF0000');
    });

    it('should replace existing profile color', () => {
      const stateWithColor = {...initialState, userProfileColor: '#00FF00'};
      const state = userReducer(stateWithColor, changeProfileColor('#0000FF'));
      expect(state.userProfileColor).toBe('#0000FF');
    });
  });

  describe('changeThemeColor', () => {
    it('should change theme to dark', () => {
      const state = userReducer(initialState, changeThemeColor('dark'));
      expect(state.theme).toBe('dark');
    });

    it('should change theme to light', () => {
      const darkState = {...initialState, theme: 'dark'};
      const state = userReducer(darkState, changeThemeColor('light'));
      expect(state.theme).toBe('light');
    });
  });

  describe('changeUserNewlyOpenedApp', () => {
    it('should set userNewlyOpenedApp to true', () => {
      const state = userReducer(initialState, changeUserNewlyOpenedApp(true));
      expect(state.userNewlyOpenedApp).toBe(true);
    });

    it('should set userNewlyOpenedApp to false', () => {
      const state = userReducer(initialState, changeUserNewlyOpenedApp(false));
      expect(state.userNewlyOpenedApp).toBe(false);
    });
  });

  describe('setCustomColorPrefrence', () => {
    it('should enable custom color preference', () => {
      const state = userReducer(initialState, setCustomColorPrefrence(true));
      expect(state.customColorPrefrence).toBe(true);
    });

    it('should disable custom color preference', () => {
      const stateWithPref = {...initialState, customColorPrefrence: true};
      const state = userReducer(stateWithPref, setCustomColorPrefrence(false));
      expect(state.customColorPrefrence).toBe(false);
    });
  });

  describe('updateUserPhoto', () => {
    it('should set user photo URL', () => {
      const photoUrl = 'https://example.com/photo.jpg';
      const state = userReducer(initialState, updateUserPhoto(photoUrl));
      expect(state.userPhoto).toBe(photoUrl);
    });

    it('should clear user photo when set to null', () => {
      const stateWithPhoto = {
        ...initialState,
        userPhoto: 'https://example.com/photo.jpg',
      };
      const state = userReducer(stateWithPhoto, updateUserPhoto(null));
      expect(state.userPhoto).toBeNull();
    });
  });

  describe('state immutability', () => {
    it('should not mutate the original state', () => {
      const originalState = {...initialState};
      userReducer(initialState, changeIsLoggedIn(true));
      expect(initialState).toEqual(originalState);
    });
  });
});
