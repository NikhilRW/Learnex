import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 13,
  },
  customHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  menuButton: {
    padding: 8,
  },
  contentContainer: {
    flex: 1,
    paddingVertical: 16,
  },
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(26, 156, 216, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
  },
  addTaskButtonText: {
    marginLeft: 4,
    color: '#1a9cd8',
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    padding: 4,
  },
  filterContainer: {
    marginBottom: 16,
    minHeight: 40,
    maxHeight: 40,
    overflow: 'hidden',
  },
  filterContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  activeFilterChip: {
    backgroundColor: '#1a9cd8',
  },
  filterText: {
    fontWeight: '500',
  },
  taskList: {
    paddingVertical: 16,
    paddingRight: 4, // Ensure right padding for cleaner look
  },
  taskCard: {
    flexDirection: 'row',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    padding: 16,
  },
  taskCheckbox: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#8e8e8e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskContent: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 8,
  },
  completedTaskTitle: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  taskDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  completedTaskText: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  taskFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  taskMetaText: {
    fontSize: 12,
  },
  taskCategory: {
    backgroundColor: 'rgba(26, 156, 216, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 4,
  },
  categoryText: {
    color: '#1a9cd8',
    fontSize: 12,
    fontWeight: '500',
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 5,
    marginLeft: 10,
  },
  statusSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  statusText: {
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    marginTop: -40, // Center the empty state better
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 16,
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  prioritySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  priorityText: {
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  saveButton: {
    backgroundColor: '#1a9cd8',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#1a9cd8',
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  filtersContainer: {
    marginBottom: 16,
    minHeight: 40,
    maxHeight: 40,
    overflow: 'hidden',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  activeFilterButton: {
    backgroundColor: '#1a9cd8',
    borderColor: '#1a9cd8',
  },
  notifyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notifyHint: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: -4,
    marginBottom: 8,
  },
  // --- Theme variants ---
  containerDark: {backgroundColor: '#1a1a1a'},
  containerLight: {backgroundColor: '#f5f5f5'},
  cardDark: {backgroundColor: '#2a2a2a'},
  cardLight: {backgroundColor: 'white'},
  searchContainerDark: {backgroundColor: '#2a2a2a', borderColor: '#404040'},
  searchContainerLight: {backgroundColor: 'white', borderColor: '#e0e0e0'},
  textDark: {color: 'white'},
  textLight: {color: 'black'},
  metaTextDark: {color: '#8e8e8e'},
  metaTextLight: {color: '#666'},
  descTextDark: {color: '#e0e0e0'},
  descTextLight: {color: '#333'},
  taskMetaTextLeft: {fontSize: 12, marginLeft: 5},
  filterButtonDark: {borderColor: '#404040', backgroundColor: '#2a2a2a'},
  filterButtonLight: {borderColor: '#e0e0e0', backgroundColor: 'white'},
  filterTextActive: {color: 'white'},
  filterTextLight: {color: 'black'},
  aiOverlay: {zIndex: 500},
  aiOverlayDark: {backgroundColor: '#00000060'},
  aiOverlayLight: {backgroundColor: '#00000030'},
  teamTasksButton: {marginLeft: 10},
  checkboxCompleted: {backgroundColor: '#1a9cd8', borderColor: '#1a9cd8'},
  // --- DuoTaskItem progress bar ---
  progressWrapper: {marginTop: 10, marginBottom: 5},
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  progressText: {fontSize: 12},
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusBadgeText: {color: 'white', fontSize: 10},
  progressTrack: {height: 6, borderRadius: 3, overflow: 'hidden'},
  progressTrackDark: {backgroundColor: '#404040'},
  progressTrackLight: {backgroundColor: '#e0e0e0'},
  progressFill: {height: '100%', borderRadius: 3},
  // --- InvitationItem action buttons ---
  inviteActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  declineButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#34C759',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
    alignItems: 'center',
  },
  inviteButtonText: {color: 'white'},
  // --- DuoTasks screen: invitations section ---
  invitationsWrapper: {marginBottom: 10},
  invitationsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 10,
  },
  invitationsTitleDark: {color: 'white'},
  invitationsTitleLight: {color: 'black'},
  invitationsListContent: {paddingHorizontal: 10},
  invitationSeparator: {width: 10},
  // Theme variants for TaskModal
  modalContentBgDark: {backgroundColor: '#1a1a1a'},
  modalContentBgLight: {backgroundColor: 'white'},
  inputFieldDark: {
    backgroundColor: '#2a2a2a',
    color: 'white',
    borderColor: '#404040',
  },
  inputFieldLight: {
    backgroundColor: '#f5f5f5',
    color: 'black',
    borderColor: '#e0e0e0',
  },
  hintTextDark: {color: '#8e8e8e'},
  hintTextLight: {color: '#666'},
  unselectedBgDark: {backgroundColor: '#2a2a2a', borderColor: '#404040'},
  unselectedBgLight: {backgroundColor: '#f5f5f5', borderColor: '#e0e0e0'},
  selectedTextWhite: {color: 'white'},
  borderColorDark: {borderColor: '#404040'},
  borderColorLight: {borderColor: '#e0e0e0'},
  statusPendingBg: {backgroundColor: '#1a9cd8'},
  statusCompletedBg: {backgroundColor: '#34C759'},
  // --- TeamTaskModal styles ---
  teamSubtaskListItem: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  teamSubtaskListItemLight: {
    borderColor: '#e0e0e0',
  },
  teamSubtaskListItemDark: {
    borderColor: '#404040',
  },
  emptySubtasksText: {
    textAlign: 'center',
    padding: 20,
  },
  subtaskInputMargin: {
    marginBottom: 5,
  },
  subtaskCountMargin: {
    marginBottom: 10,
  },
  addSubtaskBtn: {
    backgroundColor: '#1a9cd8',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 20,
  },
  addSubtaskBtnText: {
    color: 'white',
  },
  teamMemberDescText: {
    marginBottom: 10,
    fontSize: 12,
  },
  flexOne: {
    flex: 1,
  },
});

export const duoTaskModalStyles = StyleSheet.create({
  modalContent: {
    width: '95%',
    maxHeight: '90%',
  },
  modalContentLight: {
    backgroundColor: '#ffffff',
  },
  modalContentDark: {
    backgroundColor: '#1c1c1c',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalTitleLight: {
    color: '#000000',
  },
  modalTitleDark: {
    color: '#ffffff',
  },
  closeButton: {
    padding: 5,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tabsContainerLight: {
    borderBottomColor: '#e0e0e0',
  },
  tabsContainerDark: {
    borderBottomColor: '#404040',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
  },
  tabActive: {
    borderBottomColor: '#1a9cd8',
  },
  tabInactive: {
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 14.5,
    fontWeight: '600',
    textAlign: 'center',
  },
  teamMembersTabText: {
    marginRight: 2,
  },
  tabTextLight: {
    color: '#666666',
  },
  tabTextDark: {
    color: '#8e8e8e',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputLabelLight: {
    color: '#000000',
  },
  inputLabelDark: {
    color: '#ffffff',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  inputLight: {
    backgroundColor: '#f5f5f5',
    color: '#000000',
    borderColor: '#e0e0e0',
  },
  inputDark: {
    backgroundColor: '#2a2a2a',
    color: '#ffffff',
    borderColor: '#404040',
  },
  placeholderLight: {
    color: '#999999',
  },
  placeholderDark: {
    color: '#8e8e8e',
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  priorityButtonLight: {
    borderColor: '#e0e0e0',
  },
  priorityButtonDark: {
    borderColor: '#404040',
  },
  priorityButtonActive: {
    backgroundColor: '#1a9cd8',
    borderColor: '#1a9cd8',
  },
  priorityButtonText: {
    fontWeight: '500',
  },
  priorityButtonTextLight: {
    color: '#666666',
  },
  priorityButtonTextDark: {
    color: '#8e8e8e',
  },
  priorityButtonTextActive: {
    color: '#ffffff',
  },
  switchTrackLight: {
    backgroundColor: '#e0e0e0',
  },
  switchTrackDark: {
    backgroundColor: '#404040',
  },
  switchTrackActive: {
    backgroundColor: '#1a9cd8',
  },
  switchThumbLight: {
    backgroundColor: '#ffffff',
  },
  switchThumbDark: {
    backgroundColor: '#cccccc',
  },
  switchThumbActive: {
    backgroundColor: '#ffffff',
  },
  descriptionText: {
    marginBottom: 10,
    fontSize: 12,
  },
  descriptionTextLight: {
    color: '#666666',
  },
  descriptionTextDark: {
    color: '#8e8e8e',
  },
  subtaskInput: {
    marginBottom: 10,
  },
  subtaskDescriptionInput: {
    height: 80,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: '#1a9cd8',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  subtasksCount: {
    marginTop: 10,
    marginBottom: 10,
  },
  collaboratorInputContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  collaboratorInput: {
    flex: 1,
    marginRight: 5,
  },
  addCollaboratorButton: {
    backgroundColor: '#1a9cd8',
    padding: 10,
    borderRadius: 5,
    justifyContent: 'center',
  },
  addCollaboratorButtonText: {
    color: 'white',
  },
  errorText: {
    color: '#FF3B30',
    marginBottom: 10,
  },
  teamMembersCount: {
    marginTop: 20,
    marginBottom: 10,
  },
  emptyTeamMembersText: {
    textAlign: 'center',
    padding: 10,
  },
  collaboratorItem: {
    flexDirection: 'row',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  collaboratorItemLight: {
    backgroundColor: '#f5f5f5',
  },
  collaboratorItemDark: {
    backgroundColor: '#2a2a2a',
  },
  collaboratorDetails: {
    flex: 1,
  },
  collaboratorNameLight: {
    color: '#000000',
  },
  collaboratorNameDark: {
    color: '#ffffff',
  },
  collaboratorEmailLight: {
    color: '#666666',
    fontSize: 12,
  },
  collaboratorEmailDark: {
    color: '#8e8e8e',
    fontSize: 12,
  },
  collaboratorEmailInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  collaboratorEmailInputLight: {
    backgroundColor: '#f5f5f5',
    color: '#000000',
    borderColor: '#e0e0e0',
  },
  collaboratorEmailInputDark: {
    backgroundColor: '#2a2a2a',
    color: '#ffffff',
    borderColor: '#404040',
  },
  removeCollaboratorButton: {
    padding: 5,
  },
  removeCollaboratorIconLight: {
    color: '#666666',
  },
  removeCollaboratorIconDark: {
    color: '#8e8e8e',
  },
  removeAllCollaboratorsButton: {
    marginTop: 10,
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
  },
  removeAllCollaboratorsButtonText: {
    color: 'white',
  },
  collaborationHintText: {
    marginTop: 20,
    fontSize: 12,
  },
  collaborationHintTextLight: {
    color: '#666666',
  },
  collaborationHintTextDark: {
    color: '#8e8e8e',
  },
  subtaskList: {
    paddingVertical: 10,
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 10,
    borderRadius: 8,
  },
  subtaskItemLight: {
    backgroundColor: '#f9f9f9',
  },
  subtaskItemDark: {
    backgroundColor: '#222222',
  },
  subtaskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  subtaskCheckboxLight: {
    borderColor: '#8e8e8e',
  },
  subtaskCheckboxDark: {
    borderColor: '#666666',
  },
  subtaskCheckboxActive: {
    backgroundColor: '#1a9cd8',
  },
  subtaskCheckboxInactive: {
    backgroundColor: 'transparent',
  },
  subtaskTitleContainer: {
    flex: 1,
  },
  subtaskTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  subtaskTitleLight: {
    color: '#000000',
  },
  subtaskTitleDark: {
    color: '#ffffff',
  },
  subtaskTitleCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  subtaskDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  subtaskDescriptionLight: {
    color: '#666666',
  },
  subtaskDescriptionDark: {
    color: '#8e8e8e',
  },
  subtaskDescriptionCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  removeSubtaskButton: {
    padding: 5,
    marginLeft: 10,
  },
  removeSubtaskIconLight: {
    color: '#666666',
  },
  removeSubtaskIconDark: {
    color: '#8e8e8e',
  },
  emptySubtasksText: {
    textAlign: 'center',
    padding: 20,
  },
  emptySubtasksTextLight: {
    color: '#666',
  },
  emptySubtasksTextDark: {
    color: '#8e8e8e',
  },
  subtaskListRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  subtaskListRowLight: {
    borderColor: '#e0e0e0',
  },
  subtaskListRowDark: {
    borderColor: '#404040',
  },
  // Modal content backgrounds
  // Progress section
  progressWrapper: {marginHorizontal: 16, marginBottom: 10},
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  progressLabelLight: {color: '#666', fontSize: 12},
  progressLabelDark: {color: '#8e8e8e', fontSize: 12},
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusBadgeActive: {backgroundColor: '#007AFF'},
  statusBadgePending: {backgroundColor: '#FF9500'},
  statusBadgeCompleted: {backgroundColor: '#34C759'},
  statusBadgeText: {color: 'white', fontSize: 10},
  progressTrack: {height: 6, borderRadius: 3, overflow: 'hidden'},
  progressTrackLight: {backgroundColor: '#e0e0e0'},
  progressTrackDark: {backgroundColor: '#404040'},
  progressFill: {height: '100%', borderRadius: 3},
  progressFillActive: {backgroundColor: '#1a9cd8'},
  progressFillCompleted: {backgroundColor: '#34C759'},
  // Detail item
  detailItem: {marginBottom: 15, paddingHorizontal: 16},
  detailLabelLight: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#666',
  },
  detailLabelDark: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#8e8e8e',
  },
  detailValueLight: {fontSize: 16, marginBottom: 5, color: 'black'},
  detailValueDark: {fontSize: 16, marginBottom: 5, color: 'white'},
  // Priority indicator
  priorityRow: {flexDirection: 'row', alignItems: 'center'},
  priorityDot: {width: 12, height: 12, borderRadius: 6, marginRight: 5},
  // Team member label with margin
  teamMemberLabel: {marginBottom: 5},
  // Collaborator card
  collaboratorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
    marginBottom: 5,
  },
  collaboratorCardLight: {backgroundColor: '#f5f5f5'},
  collaboratorCardDark: {backgroundColor: '#2a2a2a'},
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1a9cd8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {color: 'white'},
  collaboratorInfo: {flex: 1},
  // Action buttons (edit/delete)
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
    marginRight: 5,
  },
  editButton: {
    backgroundColor: '#1a9cd8',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 5,
    alignItems: 'center',
    flex: 1,
    marginLeft: 5,
  },
  actionButtonText: {color: 'white'},
  // Subtask tab
  addSubtaskRow: {flexDirection: 'row', marginBottom: 15},
  addSubtaskInput: {flex: 1, marginRight: 10},
  addSubtaskButton: {
    backgroundColor: '#1a9cd8',
    padding: 10,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addSubtaskButtonText: {color: 'white'},
  subtaskCountLabel: {marginBottom: 10},
  subtaskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  subtaskRowLight: {borderColor: '#e0e0e0'},
  subtaskRowDark: {borderColor: '#404040'},
  subtaskContent: {flex: 1},
  subtaskDescLight: {color: '#666', fontSize: 12},
  subtaskDescDark: {color: '#8e8e8e', fontSize: 12},
  subtaskDescCompleted: {textDecorationLine: 'line-through', opacity: 0.7},
  assignedTextLight: {color: '#666', fontSize: 10, marginTop: 2},
  assignedTextDark: {color: '#8e8e8e', fontSize: 10, marginTop: 2},
  completedByText: {color: '#34C759', fontSize: 10, marginTop: 2},
});
