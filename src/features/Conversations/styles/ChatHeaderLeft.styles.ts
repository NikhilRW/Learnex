import { StyleSheet } from "react-native";

export const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    recipientName: {
      marginLeft: 8,
      fontSize: 17,
      fontWeight: '600',
      color: isDark ? 'white' : 'black',
    },
    backButtonContainer: {flexDirection: 'row', alignItems: 'center'},
    backButton: {marginLeft: 10, marginRight: 8},
    recipientPhotoContainer: {flexDirection: 'row', alignItems: 'center'},
    recipientPhoto: {width: 36, height: 36, borderRadius: 18},
    avatar: {backgroundColor: '#2379C2'},
  });
