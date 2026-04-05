import {StyleSheet} from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    paddingHorizontal: theme.sizes.screenPaddingX,
    backgroundColor: theme.colors.background,
  },
  headerTitle: {
    fontSize: theme.fontSizes.xl,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  backButton: {
    padding: theme.sizes.iconButtonPadding,
  },
  shareButton: {
    padding: theme.sizes.iconButtonPadding,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: theme.sizes.headerHeight,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
    backgroundColor: theme.colors.background,
  },
  qrCodeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    borderRadius: theme.sizes.qrInfoMarginTop,
    padding: theme.sizes.qrInfoMarginTop,
    backgroundColor: theme.colors.background,
  },
  infoText: {
    marginTop: theme.sizes.qrInfoMarginTop,
    fontSize: theme.fontSizes.md,
    textAlign: 'center',
    marginBottom: theme.sizes.qrInfoMarginBottom,
    color: theme.colors.text.secondary,
  },
  shareButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.sizes.shareButtonPaddingH,
    paddingVertical: theme.sizes.shareButtonPaddingV,
    borderRadius: theme.sizes.shareButtonRadius,
    marginTop: theme.sizes.qrInfoMarginTop,
    width: '80%',
    maxWidth: theme.sizes.shareButtonMaxWidth,
    backgroundColor: theme.colors.cta,
  },
  shareButtonText: {
    color: theme.colors.textOnPrimary,
    fontSize: theme.fontSizes.md,
    fontWeight: '600',
  },
  shareButtonIcon: {
    marginRight: theme.sizes.shareButtonIconMargin,
  },
  disabledOpacity: {
    opacity: 0.6,
  },
}));
