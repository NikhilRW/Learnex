import {createSelector} from 'reselect';
import {RootState} from './store';

const selectFirebaseState = (state: RootState) => state.firebase;
const selectUserState = (state: RootState) => state.user;
const selectDeepLinkState = (state: RootState) => state.deepLink;
const selectLexAIState = (state: RootState) => state.lexAI;
const selectHackathonState = (state: RootState) => state.hackathon;

export const selectFirebase = createSelector(
  selectFirebaseState,
  firebaseState => firebaseState.firebase,
);

export const selectTheme = createSelector(
  selectUserState,
  userState => userState.theme,
);

export const selectIsDark = createSelector(
  selectTheme,
  theme => theme === 'dark',
);

export const selectIsLoggedIn = createSelector(
  selectUserState,
  userState => userState.isLoggedIn,
);

export const selectUserPhoto = createSelector(
  selectUserState,
  userState => userState.userPhoto,
);

export const selectUserProfileColor = createSelector(
  selectUserState,
  userState => userState.userProfileColor,
);

export const selectUserCustomColorPreference = createSelector(
  selectUserState,
  userState => userState.customColorPrefrence,
);

export const selectUser = createSelector(
  selectUserState,
  userState => userState,
);

export const selectDeepLinkUrl = createSelector(
  selectDeepLinkState,
  deepLinkState => deepLinkState.url,
);

export const selectDeepLinkProcessed = createSelector(
  selectDeepLinkState,
  deepLinkState => deepLinkState.processed,
);

export const selectLexAIMode = createSelector(
  selectLexAIState,
  lexAIState => lexAIState.mode,
);

export const selectHackathon = createSelector(
  selectHackathonState,
  hackathonState => hackathonState,
);
