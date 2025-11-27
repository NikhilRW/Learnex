import userReducer, {
  changeIsLoggedIn,
  changeProfileColor,
  changeThemeColor,
  changeUserNewlyOpenedApp,
  setCustomColorPrefrence,
  updateUserPhoto,
} from 'shared/reducers/User';

// Mock Appearance
jest.mock('react-native', () => ({
  Appearance: {
    getColorScheme: jest.fn().mockReturnValue('light'),
  },
}));

describe('UserReducer', () => {
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

  it('should handle changeIsLoggedIn', () => {
    const actual = userReducer(initialState, changeIsLoggedIn(true));
    expect(actual.isLoggedIn).toEqual(true);
  });

  it('should handle changeProfileColor', () => {
    const actual = userReducer(initialState, changeProfileColor('#FF0000'));
    expect(actual.userProfileColor).toEqual('#FF0000');
  });

  it('should handle changeThemeColor', () => {
    const actual = userReducer(initialState, changeThemeColor('dark'));
    expect(actual.theme).toEqual('dark');
  });

  it('should handle changeUserNewlyOpenedApp', () => {
    const actual = userReducer(initialState, changeUserNewlyOpenedApp(true));
    expect(actual.userNewlyOpenedApp).toEqual(true);
  });

  it('should handle setCustomColorPrefrence', () => {
    const actual = userReducer(initialState, setCustomColorPrefrence(true));
    expect(actual.customColorPrefrence).toEqual(true);
  });

  it('should handle updateUserPhoto', () => {
    const actual = userReducer(
      initialState,
      updateUserPhoto('http://example.com/photo.jpg'),
    );
    expect(actual.userPhoto).toEqual('http://example.com/photo.jpg');
  });
});
