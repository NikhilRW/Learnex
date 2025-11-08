import React from 'react';
import {View, Text, TouchableOpacity, TouchableWithoutFeedback} from 'react-native';

interface PostFooterProps {
  likes: number;
  username: string;
  formattedDescription: React.ReactNode;
  commentsCount: number;
  hasComments: boolean;
  timestamp: string;
  onViewCommentsPress: () => void;
  onCaptionPress: () => void;
  styles: any;
}

export const PostFooter: React.FC<PostFooterProps> = ({
  likes,
  username,
  formattedDescription,
  commentsCount,
  hasComments,
  timestamp,
  onViewCommentsPress,
  onCaptionPress,
  styles,
}) => {
  return (
    <View style={styles.postFooter}>
      <Text style={[styles.likes]}>{likes} likes</Text>
      <TouchableWithoutFeedback onPress={onCaptionPress}>
        <View style={styles.captionContainer}>
          <Text style={[styles.caption]} numberOfLines={3} ellipsizeMode="tail">
            <Text style={[styles.username]} numberOfLines={1}>
              {username + '  '}
            </Text>
            {formattedDescription}
          </Text>
        </View>
      </TouchableWithoutFeedback>

      {hasComments && (
        <TouchableOpacity
          style={styles.viewCommentsButton}
          onPress={onViewCommentsPress}>
          <Text style={styles.viewAllComments}>
            View all {commentsCount} comments
          </Text>
        </TouchableOpacity>
      )}

      <Text style={styles.timestamp}>{timestamp}</Text>
    </View>
  );
};
