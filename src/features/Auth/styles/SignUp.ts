import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  cricle1: {
    top: '-5%',
    left: '-35%',
    position: 'absolute',
    opacity: 0.7,
  },
  circle2: {
    top: '-16%',
    left: '-15%',
    position: 'absolute',
    opacity: 0.6,
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: '25%',
    paddingBottom: 40,
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
  subtitle: {
    fontFamily: 'Kufam-SemiBold',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 10,
    color: '#666',
  },
  subtitleDark: {
    color: '#DDD',
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
    flex: 1,
  },
  displayNone: {
    display: 'none',
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
  checkboxContainer: {
    width: '100%',
    paddingHorizontal: 12,
    flex: 1,
    marginBottom: 20,
    marginTop:10,
  },
  checkboxText: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  checkboxTextDark: {
    color: '#FFF',
  },
  checkboxIcon: {
    borderRadius: 6,
  },
  checkboxInnerIcon: {
    borderWidth: 2,
    borderRadius: 6,
  },
  submitButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    width: '100%',
    backgroundColor: '#37B6F0',
    shadowColor: '#37B6F0',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  footerTextDark: {
    color: '#EEE',
  },
  signInLink: {
    fontWeight: '800',
    color: '#37B6F0',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30,
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
  },
  flex1: {
    flex: 1,
  },
  inputContainerStyleNoBorder: {
    borderBottomWidth: 0,
    flex: 1,
  },
});
