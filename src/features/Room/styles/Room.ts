import {SCREEN_WIDTH} from 'shared/constants/common';
import {Platform, StyleSheet} from 'react-native';

const isSmallDevice = SCREEN_WIDTH < 380;

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
});
