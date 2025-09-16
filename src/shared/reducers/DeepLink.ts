import {createSlice, PayloadAction} from '@reduxjs/toolkit';

interface DeepLinkState {
  url: string | null;
  processed: boolean;
}

const initialState: DeepLinkState = {
  url: null,
  processed: false,
};

const deepLinkSlice = createSlice({
  name: 'deepLink',
  initialState,
  reducers: {
    setDeepLink: (state, action: PayloadAction<string>) => {
      state.url = action.payload;
      state.processed = false;
    },
    clearDeepLink: state => {
      state.url = null;
    },
    markDeepLinkProcessed: state => {
      state.processed = true;
    },
  },
});

export const {setDeepLink, clearDeepLink, markDeepLinkProcessed} =
  deepLinkSlice.actions;
export default deepLinkSlice.reducer;
