import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {userState} from '../types/userType';
import {Appearance} from 'react-native';

const initialState: userState = {
  isLoggedIn: false,
  theme: Appearance.getColorScheme()!,
  userNewlyOpenedApp: null,
  userProfileColor:null,
  customColorPrefrence:false
};
export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    changeIsLoggedIn: (state, action: PayloadAction<boolean>) => {
      state.isLoggedIn = action.payload;
    },
    changeProfileColor: (state, action: PayloadAction<string>) => {
      state.userProfileColor = action.payload;
    },
    changeThemeColor: (state, action: PayloadAction<string>) => {
      state.theme = action.payload;
    },
    changeUserNewlyOpenedApp: (state, action: PayloadAction<boolean>) => {
      state.userNewlyOpenedApp = action.payload;
    },
  },
});

export default userSlice.reducer;
export const {
  changeIsLoggedIn,
  changeProfileColor,
  changeThemeColor,
  changeUserNewlyOpenedApp,
} = userSlice.actions;
