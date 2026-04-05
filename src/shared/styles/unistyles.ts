import {Appearance} from 'react-native';
import {StyleSheet} from 'react-native-unistyles';
import {moderateScale} from 'react-native-size-matters';

export const palette = {
  purple: '#5A31F4',
  green: '#0ECD9D',
  red: '#CD0E61',
  black: '#0B0B0B',
  white: '#F0F2F3',
} as const;

const ms = (value: number) => moderateScale(value, 0);

const spacing = {
  xs: ms(4),
  s: ms(8),
  m: ms(16),
  l: ms(24),
  xl: ms(40),
  xxl: ms(56),
} as const;

const margins = {
  xs: ms(4),
  s: ms(8),
  m: ms(16),
  l: ms(24),
  xl: ms(32),
  xxl: ms(48),
} as const;

const paddings = {
  xs: ms(4),
  s: ms(8),
  m: ms(16),
  l: ms(24),
  xl: ms(32),
  xxl: ms(48),
} as const;

const radii = {
  xs: ms(4),
  s: ms(8),
  m: ms(12),
  l: ms(16),
  xl: ms(24),
  pill: ms(999),
} as const;

const fontSizes = {
  xs: ms(12),
  sm: ms(14),
  md: ms(16),
  lg: ms(18),
  xl: ms(20),
  xxl: ms(24),
  display: ms(32),
} as const;

const iconSizes = {
  xs: ms(12),
  sm: ms(16),
  md: ms(20),
  lg: ms(24),
  xl: ms(32),
  xxl: ms(40),
} as const;

export const theme = {
  colors: {
    background: '#f5f5f5',
    foreground: '#ffffff',
    text: {
      primary: '#000000',
      secondary: '#555555',
    },
    primary: '#2379C2',
    cta: '#2379C2',
    borderSubtle: 'rgba(0, 0, 0, 0.1)',
    textOnPrimary: '#ffffff',
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
      fontSize: ms(36),
      fontWeight: '700',
    },
    body: {
      fontFamily: 'Merriweather',
      fontSize: ms(16),
      fontWeight: '400',
    },
  },
  sizes: {
    screenPaddingX: ms(16),
    screenPaddingY: ms(16),
    headerHeight: ms(56),
    iconButtonPadding: ms(8),
    qrQuietZone: ms(10),
    qrLogoSize: ms(100),
    qrLogoMargin: ms(-20),
    qrLogoRadius: ms(35),
    qrSize: ms(300),
    qrInfoMarginTop: ms(20),
    qrInfoMarginBottom: ms(30),
    shareButtonPaddingH: ms(20),
    shareButtonPaddingV: ms(12),
    shareButtonRadius: ms(10),
    shareButtonMaxWidth: ms(300),
    shareButtonIconMargin: ms(8),
  },
} as const;

export const darkTheme = {
  ...theme,
  colors: {
    ...theme.colors,
    background: '#1a1a1a',
    foreground: '#1a1a1a',
    text: {
      primary: '#ffffff',
      secondary: '#cccccc',
    },
    borderSubtle: 'rgba(0, 0, 0, 0.1)',
    textOnPrimary: '#ffffff',
    cta: '#2379C2',
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
