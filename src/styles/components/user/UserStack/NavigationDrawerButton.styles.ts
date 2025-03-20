import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  image: {
    height: 20,
    width: 20,
    tintColor: 'black',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 7,
    width: '90%',
    justifyContent: 'space-between',
  },
  profilePic: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    marginHorizontal: 10,
    padding: 8,
    borderRadius: 20,
  },
  container: {
    width: 45,
    height: 45,
    paddingBottom: 4,
    borderRadius: 30,
    borderWidth: 2,
  },
});
