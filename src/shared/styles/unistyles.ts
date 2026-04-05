import {Appearance} from 'react-native';
import {StyleSheet} from 'react-native-unistyles';
import {moderateScale, scale, verticalScale} from 'react-native-size-matters';
import { primaryColor } from '../res/strings/eng';
import { secondsInDay } from 'date-fns/constants';

export const palette = {
  purple: '#5A31F4',
  green: '#0ECD9D',
  red: '#CD0E61',
  black: '#0B0B0B',
  white: '#F0F2F3',
} as const;

const spacing = {
  xs: scale(4),
  s: scale(8),
  m: scale(16),
  l: scale(24),
  xl: scale(40),
  xxl: scale(56),
} as const;

const margins = {
  xs: scale(4),
  s: scale(8),
  m: scale(16),
  l: scale(24),
  xl: scale(32),
  xxl: scale(48),
} as const;

const paddings = {
  xs: scale(4),
  s: scale(8),
  m: scale(16),
  l: scale(24),
  xl: scale(32),
  xxl: scale(48),
} as const;

const radii = {
  xs: scale(4),
  s: scale(8),
  m: scale(12),
  l: scale(16),
  xl: scale(24),
  pill: scale(999),
} as const;

const fontSizes = {
  xs: moderateScale(12),
  sm: moderateScale(14),
  md: moderateScale(16),
  lg: moderateScale(18),
  xl: moderateScale(20),
  xxl: moderateScale(24),
  display: moderateScale(32),
} as const;

const iconSizes = {
  xs: scale(12),
  sm: scale(16),
  md: scale(20),
  lg: scale(24),
  xl: scale(32),
  xxl: scale(40),
} as const;

export const theme = {
  colors: {
    background: palette.white,
    foreground: palette.black,
    text: {
      primary: palette.black,
      secondary: '#5C5C5C',
    },
    primary: palette.purple,
    success: palette.green,
    danger: palette.red,
    failure: palette.red,
  },
  spacing,
  margins,
  paddings,
  radii,
  fontSizes,
  iconSizes,
  textVariants: {
    header: {
      fontFamily: 'Raleway',
      fontSize: moderateScale(36),
      fontWeight: '700',
    },
    body: {
      fontFamily: 'Merriweather',
      fontSize: moderateScale(16),
      fontWeight: '400',
    },
  },
  sizes: {
    screenPaddingX: scale(16),
    screenPaddingY: verticalScale(16),
  },
} as const;

export const darkTheme = {
  ...theme,
  colors: {
    ...theme.colors,
    background: palette.black,
    foreground: palette.white,
    text: {
      primary: palette.white,
      secondary: '#C7C7C7',
    },
  },
} as const;

export const breakpoints = {
  xs: 0,
  sm: 360,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

const appThemes = {
  light: theme,
  dark: darkTheme,
} as const;

type AppThemes = typeof appThemes;
type AppBreakpoints = typeof breakpoints;

declare module 'react-native-unistyles' {
  export interface UnistylesThemes extends AppThemes {}
  export interface UnistylesBreakpoints extends AppBreakpoints {}
}

StyleSheet.configure({
  themes: appThemes,
  breakpoints,
  settings: {
    initialTheme: () =>
      Appearance.getColorScheme() === 'dark' ? 'dark' : 'light',
  },
});
