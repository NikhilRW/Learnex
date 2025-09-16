import {StyleSheet, Platform} from 'react-native';
import {primaryColor} from '../shared/res/strings/eng';

export const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    scrollView: {
      flexGrow: 1,
      width: 'auto',
      justifyContent: 'center',
      paddingTop: '12%',
      position: 'relative',
      minHeight: Platform.OS === 'ios' ? '100%' : 'auto',
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
    },
    agreeCheckboxTextStyle: {
      fontFamily: 'JosefinSans-Regular',
      fontSize: 14,
      fontWeight: 'semibold',
      textAlign: 'left',
      textDecorationLine: 'none',
    },
    checkBoxIconStyle: {
      borderColor: primaryColor,
      borderRadius: 8,
    },
    checkBoxInnerIconStyle: {
      borderWidth: 2,
      borderRadius: 8,
    },
    heroImage: {
      width: 220,
      height: 220,
      marginTop: 25,
      marginRight: 20,
    },
    usernameOrEmailInput: {
      color: isDark ? 'white' : '#1a1a1a',
    },
    usernameOrEmailInputContainerStyle: {
      borderBottomWidth: 0,
    },
  });
