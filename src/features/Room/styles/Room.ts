import {Platform, StyleSheet} from 'react-native';
import {isSmallDevice} from '../constants/common';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  smallTitle: {
    fontSize: 20,
  },
  darkText: {
    color: '#f5f5f5',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingVertical: isSmallDevice ? 8 : 12,
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  darkTab: {
    backgroundColor: '#333',
  },
  darkActiveTab: {
    backgroundColor: '#0055CC',
  },
  tabText: {
    fontSize: isSmallDevice ? 14 : 16,
    fontWeight: '600',
    color: '#555',
  },
  smallTabText: {
    fontSize: 14,
  },
  activeTabText: {
    color: 'white',
  },
  darkTabText: {
    color: '#ccc',
  },
  darkActiveTabText: {
    color: 'white',
  },
  form: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: isSmallDevice ? 12 : 16,
  },
  label: {
    fontSize: isSmallDevice ? 14 : 16,
    marginBottom: isSmallDevice ? 6 : 8,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: isSmallDevice ? 10 : 12,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: isSmallDevice ? 14 : 16,
    color: '#333',
  },
  darkInput: {
    backgroundColor: '#2a2a2a',
    borderColor: '#444',
  },
  textArea: {
    height: isSmallDevice ? 80 : 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: isSmallDevice ? 10 : 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateButtonText: {
    fontSize: isSmallDevice ? 14 : 16,
    color: '#333',
  },
  privacyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleContainer: {
    padding: 4,
  },
  toggleSwitch: {
    width: isSmallDevice ? 44 : 50,
    height: isSmallDevice ? 24 : 28,
    borderRadius: isSmallDevice ? 12 : 14,
    backgroundColor: '#ccc',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#007AFF',
  },
  toggleCircle: {
    width: isSmallDevice ? 20 : 24,
    height: isSmallDevice ? 20 : 24,
    borderRadius: isSmallDevice ? 10 : 12,
    backgroundColor: 'white',
  },
  toggleCircleActive: {
    transform: [{translateX: isSmallDevice ? 20 : 22}],
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: isSmallDevice ? 14 : 16,
    alignItems: 'center',
    marginTop: isSmallDevice ? 16 : 20,
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: 'white',
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: '600',
  },
  taskSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 12,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  taskItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  clearButton: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
    borderWidth: 1,
  },
  // Room screen styles
  screenContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  screenContainerDark: {
    backgroundColor: '#121212',
  },
  scrollContentSmall: {
    padding: 12,
  },
  // TaskListItem styles
  taskItemBgDark: {
    backgroundColor: '#2a2a2a',
  },
  taskItemBgLight: {
    backgroundColor: '#f5f5f5',
  },
  taskItemTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  textWhite: {
    color: 'white',
  },
  textBlack: {
    color: 'black',
  },
  taskItemDescription: {
    marginTop: 5,
  },
  descriptionTextDark: {
    color: '#bbb',
  },
  descriptionTextLight: {
    color: '#666',
  },
  taskItemMetaRow: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  flexRow: {
    flexDirection: 'row',
  },
  taskItemDate: {
    fontSize: 12,
    marginRight: 10,
  },
  dateTextDark: {
    color: '#aaa',
  },
  dateTextLight: {
    color: '#888',
  },
  taskItemPriority: {
    fontSize: 12,
  },
  taskItemMemberBadge: {
    fontSize: 11,
    backgroundColor: '#1a9cd8',
    color: 'white',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  taskItemProgressTrack: {
    height: 4,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressTrackBgDark: {
    backgroundColor: '#404040',
  },
  progressTrackBgLight: {
    backgroundColor: '#e0e0e0',
  },
  taskItemProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  // TaskSelectionModal styles
  modalBgDark: {
    backgroundColor: '#1a1a1a',
  },
  modalBgLight: {
    backgroundColor: 'white',
  },
  modalRefreshMargin: {
    marginRight: 15,
  },
  modalRefreshText: {
    fontSize: 16,
  },
  refreshTextActiveDark: {
    color: '#2379C2',
  },
  refreshTextActiveLight: {
    color: '#2379C2',
  },
  refreshTextDisabledDark: {
    color: '#555',
  },
  refreshTextDisabledLight: {
    color: '#ccc',
  },
  cancelText: {
    fontSize: 16,
  },
  subtitleText: {
    marginTop: 5,
  },
  subtitleTextDark: {
    color: '#aaa',
  },
  subtitleTextLight: {
    color: '#666',
  },
  progressFillCompleted: {
    backgroundColor: '#34C759',
  },
  progressFillActive: {
    backgroundColor: '#1a9cd8',
  },
  flex1: {
    flex: 1,
  },
  lightText: {
    color: 'black',
  },
  placeholderTextDark: {
    color: '#888888',
  },
  placeholderTextLight: {
    color: '#666666',
  },
  clearButtonDark: {
    backgroundColor: '#333',
    borderColor: '#444',
  },
  clearButtonLight: {
    backgroundColor: '#f0f0f0',
    borderColor: '#ddd',
  },
  clearButtonText: {
    color: '#ff3b30',
    marginVertical: 'auto',
    fontSize: 18,
    paddingBottom: 3,
  },
});
