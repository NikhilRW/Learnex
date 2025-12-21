import {StyleSheet} from 'react-native';

export const getStyles = (isDark: boolean, hasStoragePermission: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#121212' : '#fff',
    },
    scrollView: {
      flex: 1,
    },
    permissionStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    permissionIcon: {
      marginRight: 8,
    },
    troubleshootingButtonAdditional: {
      marginTop: 8,
    },
    labelText: {
      color: isDark ? '#e0e0e0' : '#333',
    },
    counterText: {
      color: isDark ? '#999' : '#666',
    },
    mediaPreview: {
      backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0',
    },
    mediaProgressText: {
      color: isDark ? '#e0e0e0' : '#666',
      fontSize: 10,
      marginTop: 4,
    },
    mediaPickerContainer: {
      borderColor: isDark ? '#444' : '#ddd',
    },
    mediaPickerDisabled: {
      opacity: 0.7,
    },
    uploadStatusText: {
      color: isDark ? '#e0e0e0' : '#333',
      marginBottom: 4,
    },
    progressBarFill: {
      backgroundColor: isDark ? '#0A84FF' : '#007AFF',
    },
    uploadPercentage: {
      color: isDark ? '#999' : '#666',
      marginTop: 4,
    },
    inputField: {
      borderColor: isDark ? '#444' : '#ddd',
      color: isDark ? '#fff' : '#333',
      backgroundColor: isDark ? '#2a2a2a' : '#fff',
    },
    tagInputContainer: {
      borderColor: isDark ? '#444' : '#ddd',
      backgroundColor: isDark ? '#2a2a2a' : '#fff',
      borderRadius: 10,
      borderWidth: 1,
    },
    tagInputText: {
      color: isDark ? '#fff' : '#333',
    },
    tag: {
      backgroundColor: isDark ? '#333' : '#f0f0f0',
    },
    tagText: {
      color: isDark ? '#fff' : '#333',
    },
    submitButtonDark: {
      backgroundColor: '#0A84FF',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
    },
    backButton: {
      marginRight: 16,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: 'bold',
    },
    form: {
      padding: 16,
    },
    inputContainer: {
      marginBottom: 20,
    },
    labelContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    label: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
      color: isDark ? '#e0e0e0' : '#333',
    },
    mediaCounter: {
      fontSize: 14,
      fontWeight: '500',
      color: isDark ? '#999' : '#666',
    },
    mediaGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    mediaItem: {
      width: '48%',
      height: 220,
      position: 'relative',
    },
    mediaThumbnail: {
      width: '100%',
      height: '100%',
    },
    videoPlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      backgroundColor: isDark ? '#2a2a2a' : '#f0f0f0',
    },
    removeMediaButton: {
      position: 'absolute',
      top: 10,
      right: 10,
      padding: 4,
    },
    addMediaButton: {
      borderWidth: 1,
      borderRadius: 8,
      height: 220,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      width: '48%',
      borderColor: isDark ? '#444' : '#ddd',
      ...(!hasStoragePermission && {opacity: 0.7}),
    },
    videoPlaceholderText: {
      borderColor: isDark ? '#444' : '#ddd',
    },
    contentInput: {
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      minHeight: 120,
      textAlignVertical: 'top',
      borderColor: isDark ? '#444' : '#ddd',
      color: isDark ? '#fff' : '#333',
      backgroundColor: isDark ? '#2a2a2a' : '#fff',
    },
    progressContainer: {
      marginTop: 16,
      padding: 16,
      borderWidth: 1,
      borderRadius: 12,
    },
    progressBarContainer: {
      height: 8,
      borderRadius: 4,
      backgroundColor: 'transparent',
      marginVertical: 8,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      borderRadius: 4,
      backgroundColor: isDark ? '#0A84FF' : '#007AFF',
    },
    progressText: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 4,
    },
    progressMediaUploadStatus: {
      color: isDark ? '#e0e0e0' : '#333',
      marginBottom: 4,
    },

    progressPercentage: {
      fontSize: 12,
      marginTop: 4,
      color: isDark ? '#999' : '#666',
    },
    darkProgressContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderColor: '#444',
    },
    lightProgressContainer: {
      backgroundColor: '#FFFFFF',
      borderColor: '#E5E7EB',
    },
    darkProgressBar: {
      backgroundColor: '#0A84FF',
    },
    lightProgressBar: {
      backgroundColor: '#007AFF',
    },
    darkProgressBarContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    lightProgressBarContainer: {
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
    darkProgressText: {
      color: '#E0E0E0',
    },
    lightProgressText: {
      color: '#1F1F1F',
    },
    darkProgressPercentage: {
      color: '#999',
    },
    lightProgressPercentage: {
      color: '#666',
    },
    errorContainer: {
      marginTop: 10,
      padding: 10,
      borderWidth: 1,
      borderColor: '#ff3b30',
      borderRadius: 8,
      backgroundColor: '#ffd2d0',
    },
    errorText: {
      color: '#ff3b30',
      fontSize: 16,
      fontWeight: '600',
    },
    tagInput: {
      flex: 1,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      marginRight: 8,
      color: isDark ? '#fff' : '#333',
    },
    addTagButton: {
      padding: 8,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    tagWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: isDark ? '#333' : '#f0f0f0',
    },
    tagTextStyle: {
      marginRight: 4,
      color: isDark ? '#fff' : '#333',
    },
    submitButton: {
      backgroundColor: '#007AFF',
      borderRadius: 8,
      padding: 16,
      alignItems: 'center',
      marginTop: 20,
      marginBottom: 40,
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    submitButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    troubleshootingButton: {
      backgroundColor: '#007AFF',
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
      marginTop: 10,
    },
    troubleshootingButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    darkContainer: {
      backgroundColor: '#121212',
    },
    darkText: {
      color: 'white',
    },
    darkPermissionStatusContainer: {
      backgroundColor: '#2a2a2a',
    },
    permissionStatus: {
      margin: 16,
      padding: 12,
      borderWidth: 1,
      borderRadius: 8,
      backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
      borderColor: isDark ? '#444' : '#ddd',
    },
    permissionStatusText: {
      color: isDark ? '#e0e0e0' : '#333',
    },
    visibilityContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
      padding: 12,
      borderRadius: 10,
      backgroundColor: isDark ? '#2a2a2a' : '#f9f9f9',
      borderColor: isDark ? '#444' : '#eee',
      borderWidth: 1,
    },
    visibilityLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#e0e0e0' : '#333',
    },
    visibilityButtons: {
      flexDirection: 'row',
      gap: 8,
    },
    visibilityButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: '#007AFF',
    },
    visibilityButtonActive: {
      backgroundColor: '#007AFF',
    },
    visibilityText: {
      fontSize: 12,
      color: '#007AFF',
      fontWeight: '600',
    },
    visibilityTextActive: {
      color: '#fff',
    },
    characterCounter: {
      position: 'absolute',
      bottom: 12,
      right: 12,
      fontSize: 12,
      color: isDark ? '#999' : '#666',
    },
    draftBanner: {
      backgroundColor: '#007AFF',
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    draftBannerText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '500',
      flex: 1,
    },
    draftBannerButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    draftButton: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 4,
      backgroundColor: 'rgba(255,255,255,0.2)',
    },
    draftButtonText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: 'bold',
    },
    autocompleteContainer: {
      position: 'absolute',
      bottom: '100%',
      left: 0,
      right: 0,
      backgroundColor: isDark ? '#2a2a2a' : '#fff',
      borderRadius: 8,
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: -2},
      shadowOpacity: 0.1,
      shadowRadius: 4,
      maxHeight: 150,
      zIndex: 1000,
    },
    suggestionItem: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#444' : '#eee',
    },
    suggestionText: {
      color: isDark ? '#e0e0e0' : '#333',
      fontSize: 14,
    },
  });
