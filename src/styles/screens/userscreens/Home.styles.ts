import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContainer: {
    width: '100%',
    height: '100%',
  },
  storiesContainer: {
    padding: 10,
  },
  storyItem: {
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#0095f6',
    borderRadius: 50,
    padding: 2,
    justifyContent: 'center',
  },
  storyImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  tagsContainer: {
    padding: 10,
    marginBottom: 10,
  },
  tagButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
  },
  filterInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  clearFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  postsContainer: {
    paddingBottom: 20,
  },
  postContainer: {
    marginBottom: 15,
    paddingHorizontal: 12,
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
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
});
