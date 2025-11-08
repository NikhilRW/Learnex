import React from 'react';
import {View, TouchableOpacity, ActivityIndicator} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Icon from 'react-native-vector-icons/Feather';
import {primaryColor} from 'shared/res/strings/eng';

interface PostActionsProps {
  isLiked: boolean;
  isSaved: boolean;
  isSaving: boolean;
  isDark: boolean;
  onLikePress: () => void;
  onCommentPress: () => void;
  onSharePress: () => void;
  onSavePress: () => void;
  styles: any;
}

export const PostActions: React.FC<PostActionsProps> = ({
  isLiked,
  isSaved,
  isSaving,
  isDark,
  onLikePress,
  onCommentPress,
  onSharePress,
  onSavePress,
  styles,
}) => {
  return (
    <View style={styles.postActions}>
      <View style={styles.leftActions}>
        <TouchableOpacity onPress={onLikePress} style={styles.actionButton}>
          <AntDesign
            name={isLiked ? 'heart' : 'hearto'}
            size={24}
            color={isLiked ? 'red' : isDark ? 'white' : 'black'}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onCommentPress}>
          <MaterialIcons
            name="comment"
            size={24}
            color={isDark ? 'white' : 'black'}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onSharePress}>
          <Icon name="send" size={24} color={isDark ? 'white' : 'black'} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={onSavePress} disabled={isSaving}>
        {isSaving ? (
          <ActivityIndicator
            size="small"
            color={isDark ? 'white' : '#2379C2'}
          />
        ) : (
          <MaterialIcons
            name={isSaved ? 'bookmark' : 'bookmark-outline'}
            size={26}
            color={isSaved ? primaryColor : isDark ? 'white' : 'black'}
          />
        )}
      </TouchableOpacity>
    </View>
  );
};
