import {StyleSheet} from 'react-native';
import {primaryColor} from 'shared/res/strings/eng';

export const styles = StyleSheet.create({
  // --- SafeAreaView container ---
  container: {
    flex: 1,
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  lightContainer: {
    backgroundColor: '#f5f5f5',
  },

  // --- List content ---
  contentContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  contentContainerEmpty: {
    flex: 1,
  },

  // --- Item separator ---
  separator: {
    height: 10,
  },

  // --- Header ---
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  darkHeader: {
    backgroundColor: '#1a1a1a',
  },
  lightHeader: {
    backgroundColor: 'white',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  darkHeaderTitle: {
    color: 'white',
  },
  lightHeaderTitle: {
    color: 'black',
  },
  backButton: {
    padding: 8,
  },
  spacer: {
    width: 24,
  },

  // --- Loading ---
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // --- Empty state ---
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  darkEmptyTitle: {
    color: 'white',
  },
  lightEmptyTitle: {
    color: 'black',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  darkEmptyText: {
    color: '#b0b0b0',
  },
  lightEmptyText: {
    color: '#666666',
  },
  exploreButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: primaryColor,
  },
  exploreButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});
