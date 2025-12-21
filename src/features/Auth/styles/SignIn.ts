import {StyleSheet} from 'react-native';

export const getStyles = (_: boolean) =>
  StyleSheet.create({
    scrollView: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingTop: '25%',
      paddingBottom: 40,
    },
    cricle1: {
      top: '-4%',
      left: '-34%',
      position: 'absolute',
      opacity: 0.8,
      // zIndex: 1,
    },
    circle2: {
      top: '-15%',
      left: '-12%',
      position: 'absolute',
      opacity: 0.8,
      // zIndex: 1,
    },
    flex1: {
      flex: 1,
      gap: 0,
    },
    headerContainer: {
      marginBottom: 40,
      alignItems: 'center',
      width: '100%',
      justifyContent: 'flex-start',
    },
    title: {
      fontFamily: 'Kufam-Bold',
      fontSize: 32,
      color: '#000',
    },
    titleDark: {
      color: '#FFF',
    },
    heroImage: {
      width: 220,
      height: 220,
      marginTop: 20,
      resizeMode: 'contain',
    },
    inputContainer: {
      width: '100%',
      height: 56,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E0E0E0',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      marginBottom: 12,
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
    },
    inputContainerDark: {
      borderColor: '#444',
    },
    inputStyle: {
      fontSize: 15,
      paddingHorizontal: 12,
      color: '#000',
    },
    inputStyleDark: {
      color: '#FFF',
    },
    inputPlaceholder: {
      color: '#AAA',
    },
    inputPlaceholderDark: {
      color: '#888',
    },
    inputContainerStyleNoBorder: {
      borderBottomWidth: 0,
      flex: 1,
    },
    displayNone: {
      display: 'none',
    },
    controlsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      alignItems: 'center',
      marginBottom: 24,
      marginTop: 10,
    },
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    checkboxText: {
      marginLeft: 8,
      fontSize: 14,
      fontWeight: '600',
      color: '#666',
    },
    checkboxTextDark: {
      color: '#EEE',
    },
    checkboxIcon: {
      borderRadius: 6,
    },
    checkboxInnerIcon: {
      borderWidth: 2,
      borderRadius: 6,
    },
    forgotPasswordLink: {
      color: '#37B6F0',
      fontWeight: '800',
      fontSize: 14,
    },
    submitButton: {
      height: 56,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      width: '100%',
      backgroundColor: '#37B6F0',
      shadowColor: '#37B6F0',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
      marginBottom: 20,
    },
    submitButtonDark: {
      backgroundColor: '#1a9cd8',
    },
    submitButtonText: {
      color: 'white',
      fontSize: 18,
      fontWeight: '700',
    },
    footerTextContainer: {
      width: '100%',
      alignItems: 'flex-start',
      marginBottom: 30,
    },
    footerText: {
      fontSize: 14,
      fontWeight: '600',
      color: '#999',
    },
    footerTextDark: {
      color: '#EEE',
    },
    signUpLink: {
      fontWeight: '800',
      color: '#37B6F0',
    },
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
      width: '100%',
    },
    divider: {
      flex: 1,
      height: 1,
      backgroundColor: '#E0E0E0',
    },
    dividerDark: {
      backgroundColor: '#444',
    },
    dividerText: {
      marginHorizontal: 16,
      fontSize: 14,
      fontWeight: '600',
      color: '#999',
    },
    oauthContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 20,
      width: '100%',
    },
    transparentBackground: {
      backgroundColor: 'transparent',
    },
  });
