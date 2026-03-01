import {StyleSheet} from 'react-native';

export const searchStyles = StyleSheet.create({
  // --- Outer container theme variants ---
  darkContainer: {
    backgroundColor: '#1a1a1a',
  },
  lightContainer: {
    backgroundColor: '#fff',
  },

  // --- Centered layout (loading + empty states) ---
  centeredContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // --- "Searching for …" label ---
  searchingText: {
    marginTop: 16,
  },
  darkSearchingText: {
    color: '#ffffff',
  },
  lightSearchingText: {
    color: '#000000',
  },

  // --- "No results found" label ---
  noResultsText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  darkNoResultsText: {
    color: '#ffffff',
  },
  lightNoResultsText: {
    color: '#000000',
  },
});
