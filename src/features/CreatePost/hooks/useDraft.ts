import {useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {PostFormData} from '../types';
import {logger} from 'shared/utils/logger';

const DRAFT_STORAGE_KEY = 'create_post_draft';

/**
 * Manages draft auto-save, restore, and clear for the CreatePost form.
 */
export const useDraft = (
  formData: PostFormData,
  setFormData: React.Dispatch<React.SetStateAction<PostFormData>>,
) => {
  const [showDraftBanner, setShowDraftBanner] = useState(false);

  const checkDraft = async () => {
    try {
      const savedDraft = await AsyncStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        setShowDraftBanner(true);
      }
    } catch (e) {
      logger.error('Failed to check draft', e, 'CreatePostDraft');
    }
  };

  const saveDraft = async (data: PostFormData) => {
    try {
      await AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      logger.error('Failed to save draft', e, 'CreatePostDraft');
    }
  };

  const clearDraft = async () => {
    try {
      await AsyncStorage.removeItem(DRAFT_STORAGE_KEY);
      setShowDraftBanner(false);
    } catch (e) {
      logger.error('Failed to clear draft', e, 'CreatePostDraft');
    }
  };

  const restoreDraft = async () => {
    try {
      const savedDraft = await AsyncStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        setFormData(JSON.parse(savedDraft));
      }
      setShowDraftBanner(false);
    } catch (e) {
      logger.error('Failed to restore draft', e, 'CreatePostDraft');
    }
  };

  // Check for an existing draft on mount
  useEffect(() => {
    checkDraft();
  }, []);

  // Auto-save draft whenever form data changes
  useEffect(() => {
    if (formData.description || formData.mediaItems.length > 0) {
      saveDraft(formData);
    }
  }, [formData]);

  return {showDraftBanner, clearDraft, restoreDraft};
};
