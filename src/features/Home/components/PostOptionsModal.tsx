import React, {useMemo} from 'react';
import {ActivityIndicator, StyleSheet, View} from 'react-native';
import {Modal, TouchableOpacity, TouchableWithoutFeedback} from 'react-native';
import {Text} from 'react-native-elements';
import {useTheme} from 'shared/hooks/common/useTheme';
import {PostType} from 'home/types/post';
import Feather from 'react-native-vector-icons/Feather';
import {getClassicDarkLightThemeColor} from 'shared/utils/UserInterface';

const PostOptionsModal = ({
  showOptions,
  setShowOptions,
  isCurrentUserPost,
  isHiding,
  post,
  handleDeletePost,
  handleHidePost,
  handleMessageUser,
  isDeleting,
}: {
  showOptions: boolean;
  setShowOptions: React.Dispatch<React.SetStateAction<boolean>>;
  isCurrentUserPost: boolean;
  isHiding: boolean;
  post: PostType;
  isDeleting: boolean;
  handleDeletePost: () => void;
  handleMessageUser: () => void;
  handleHidePost: () => void;
}) => {
  const {isDark} = useTheme();
  const optionTextColor = useMemo(
    () => (isDark ? '#ff3b30' : '#ff3b30'),
    [isDark],
  );
  const modalBackgroundColor = useMemo(
    () => (isDark ? '#2a2a2a' : 'white'),
    [isDark],
  );

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showOptions}
      onRequestClose={() => setShowOptions(false)}>
      <TouchableWithoutFeedback onPress={() => setShowOptions(false)}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalContent,
                {backgroundColor: modalBackgroundColor},
              ]}>
              {isCurrentUserPost ? (
                // Show only delete option for the user's own post
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={handleDeletePost}
                  disabled={isDeleting}>
                  <Feather name="trash-2" size={24} color={optionTextColor} />
                  <Text style={[styles.optionText, {color: optionTextColor}]}>
                    {isDeleting ? 'Deleting post...' : 'Delete Post'}
                  </Text>
                  {isDeleting && (
                    <ActivityIndicator
                      size="small"
                      color={isDark ? 'white' : '#2379C2'}
                      style={styles.activityIndicator}
                    />
                  )}
                </TouchableOpacity>
              ) : (
                // Show normal options for other users' posts
                <>
                  <TouchableOpacity
                    style={styles.optionItem}
                    onPress={handleMessageUser}>
                    <Feather
                      name="message-circle"
                      size={24}
                      color={isDark ? 'white' : 'black'}
                    />
                    <Text
                      style={[
                        styles.optionText,
                        getClassicDarkLightThemeColor(isDark),
                      ]}>
                      Message @{post.user.username}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.optionItem}
                    onPress={handleHidePost}
                    disabled={isHiding}>
                    <Feather
                      name="eye-off"
                      size={24}
                      color={isDark ? 'white' : 'black'}
                    />
                    <Text
                      style={[
                        styles.optionText,
                        getClassicDarkLightThemeColor(isDark),
                      ]}>
                      {isHiding ? 'Hiding post...' : 'Hide this post'}
                    </Text>
                    {isHiding && (
                      <ActivityIndicator
                        size="small"
                        color={isDark ? 'white' : '#2379C2'}
                        style={styles.activityIndicator}
                      />
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default PostOptionsModal;

export const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#CCCCCC',
  },
  optionText: {
    marginLeft: 15,
    fontSize: 16,
  },
  activityIndicator: {
    marginLeft: 8,
  },
});
