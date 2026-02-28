import React, { useState } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTypedSelector } from 'hooks/redux/useTypedSelector';
import { PostFormData } from 'create-post/types';
import { getStyles } from 'create-post/styles/CreatePost';
import { usePermissions, useDraft, useMediaPicker, useCreatePost } from '../hooks';
import { extractHashtags } from '../utils';
import DraftBanner from '../components/DraftBanner';
import PermissionStatus from '../components/PermissionStatus';
import MediaGrid from '../components/MediaGrid';
import CaptionInput from '../components/CaptionInput';
import TagsInput from '../components/TagsInput';
import VisibilityToggle from '../components/VisibilityToggle';

const CreatePost = () => {
  const navigation = useNavigation();
  const firebase = useTypedSelector(state => state.firebase.firebase);
  const theme = useTypedSelector(state => state.user.theme);
  const isDark = theme === 'dark';

  const [formData, setFormData] = useState<PostFormData>({
    description: '',
    mediaItems: [],
    hashtags: [],
    isPublic: true,
  });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const { permissionsChecked, hasStoragePermission, requestStoragePermissions } =
    usePermissions();

  const { showDraftBanner, clearDraft, restoreDraft } = useDraft(
    formData,
    setFormData,
  );

  const { pickerError, canAddMoreMedia, removeMediaItem, pickMedia } =
    useMediaPicker(
      formData,
      setFormData,
      hasStoragePermission,
      permissionsChecked,
      requestStoragePermissions,
    );

  const { loading, uploadProgress, currentUploadIndex, handleSubmit } =
    useCreatePost(formData, firebase, clearDraft, navigation);

  const styles = getStyles(isDark, hasStoragePermission);

  // Update hashtags as user types description
  const handleDescriptionChange = (text: string) => {
    if (text.length > 2200) {
      return;
    }

    setFormData(prev => ({ ...prev, description: text }));

    const lastWord = text.split(/\s+/).pop() || '';
    if (lastWord.startsWith('#') && lastWord.length > 1) {
      setSuggestions(['trending', 'coding', 'reactnative', 'learnex']);
      setShowSuggestions(true);
    } else if (lastWord.startsWith('@') && lastWord.length > 1) {
      setSuggestions(['nikhil', 'admin', 'moderator']);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }

    const extractedTags = extractHashtags(text);
    if (extractedTags.length > 0) {
      const newTags = extractedTags.filter(
        tag => !formData.hashtags.includes(tag),
      );
      if (newTags.length > 0) {
        setFormData(prev => ({
          ...prev,
          hashtags: [...new Set([...prev.hashtags, ...newTags])],
        }));
      }
    }
  };

  const applySuggestion = (suggestion: string) => {
    const words = formData.description.split(/\s+/);
    words.pop();
    const prefix = formData.description.includes('@') ? '@' : '#';
    const newDescription = [...words, `${prefix}${suggestion} `].join(' ');
    setFormData(prev => ({ ...prev, description: newDescription }));
    setShowSuggestions(false);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.hashtags.includes(tagInput.trim())) {
      let tag = tagInput.trim();
      if (!tag.startsWith('#')) {
        tag = `#${tag}`;
      }
      setFormData(prev => ({ ...prev, hashtags: [...prev.hashtags, tag] }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      hashtags: prev.hashtags.filter(tag => tag !== tagToRemove),
    }));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}>
      {showDraftBanner && (
        <DraftBanner
          onRestore={restoreDraft}
          onDiscard={clearDraft}
          styles={styles}
        />
      )}
      {Platform.OS === 'android' && !hasStoragePermission && (
        <PermissionStatus
          onRequestPermissions={requestStoragePermissions}
          styles={styles}
        />
      )}
      <ScrollView style={styles.scrollView}>
        <View style={styles.form}>
          <MediaGrid
            formData={formData}
            isDark={isDark}
            loading={loading}
            pickerError={pickerError}
            uploadProgress={uploadProgress}
            currentUploadIndex={currentUploadIndex}
            canAddMoreMedia={canAddMoreMedia}
            hasStoragePermission={hasStoragePermission}
            onRemoveMedia={removeMediaItem}
            onPickMedia={pickMedia}
            onRequestPermissions={requestStoragePermissions}
            styles={styles}
          />
          <CaptionInput
            description={formData.description}
            isDark={isDark}
            showSuggestions={showSuggestions}
            suggestions={suggestions}
            onChangeText={handleDescriptionChange}
            onApplySuggestion={applySuggestion}
            styles={styles}
          />
          <TagsInput
            hashtags={formData.hashtags}
            tagInput={tagInput}
            isDark={isDark}
            onChangeTagInput={setTagInput}
            onAddTag={addTag}
            onRemoveTag={removeTag}
            styles={styles}
          />
          <VisibilityToggle
            isPublic={formData.isPublic}
            onChange={isPublic => setFormData(prev => ({ ...prev, isPublic }))}
            styles={styles}
          />
          <TouchableOpacity
            testID="create-post-button"
            style={[
              styles.submitButton,
              loading && styles.submitButtonDisabled,
              isDark && styles.submitButtonDark,
            ]}
            onPress={handleSubmit}
            disabled={loading || formData.mediaItems.length === 0}>
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitButtonText}>Create Post</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default CreatePost;
