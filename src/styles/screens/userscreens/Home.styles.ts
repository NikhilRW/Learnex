import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  mainContainer: {
    width: '100%',
    height: '100%',
  },
  storiesContainer: {
    padding: 10,
  },
  storyItem: {
    marginRight: 15,
    borderWidth: 2,
    borderColor: '#0095f6',
    borderRadius: 50,
    padding: 2.6,
    justifyContent: 'center',
  },
  storyImage: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    resizeMode: 'cover',
  },
  tagsContainer: {
    padding: 10,
  },
  tagButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  tagText: {
    color: '#000',
  },
  postsContainer: {
    width: '100%',
    height: '80%',
  },
  postContainer: {
    marginBottom: 15,
    paddingHorizontal: 12,
    gap: 10,
  },
  skeletonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileLogoContainer: {
    gap: 10,
    paddingHorizontal: 10,
    height: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
