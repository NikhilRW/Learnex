import React from 'react';
import { View, Modal, Text, TouchableOpacity, ScrollView, Image, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Comment } from '../../../../types/post';

interface CommentModalProps {
    visible: boolean;
    onClose: () => void;
    comments: Comment[];
    isDark: boolean;
    onAddComment: () => Promise<void>;
    newComment: string;
    setNewComment: (text: string) => void;
    isAddingComment: boolean;
}

const CommentModal: React.FC<CommentModalProps> = ({
    visible,
    onClose,
    comments,
    isDark,
    onAddComment,
    newComment,
    setNewComment,
    isAddingComment
}) => {
    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}>
            <View style={[
                styles.modalContainer,
                { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)' }
            ]}>
                <View style={[
                    styles.modalContent,
                    { backgroundColor: isDark ? '#1a1a1a' : 'white' }
                ]}>
                    <View style={styles.header}>
                        <Text style={[
                            styles.headerText,
                            { color: isDark ? 'white' : 'black' }
                        ]}>Comments</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Icon name="x" size={24} color={isDark ? 'white' : 'black'} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.commentsContainer}>
                        {comments.map((comment, index) => (
                            <View key={comment.id || index} style={styles.commentItem}>
                                <Image
                                    source={comment.userImage}
                                    style={styles.commentAvatar}
                                />
                                <View style={styles.commentContent}>
                                    <Text style={[
                                        styles.commentUsername,
                                        { color: isDark ? 'white' : 'black' }
                                    ]}>
                                        {comment.username}
                                    </Text>
                                    <Text style={[
                                        styles.commentText,
                                        { color: isDark ? '#e0e0e0' : '#2c2c2c' }
                                    ]}>
                                        {comment.text}
                                    </Text>
                                    <View style={styles.commentMeta}>
                                        <Text style={[
                                            styles.commentTimestamp,
                                            { color: isDark ? '#8e8e8e' : '#666666' }
                                        ]}>
                                            {comment.timestamp}
                                        </Text>
                                        <Text style={[
                                            styles.commentLikes,
                                            { color: isDark ? '#8e8e8e' : '#666666' }
                                        ]}>
                                            {comment.likes} likes
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </ScrollView>

                    <View style={[
                        styles.commentInputContainer,
                        { backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5' }
                    ]}>
                        <TextInput
                            style={[
                                styles.commentInput,
                                { color: isDark ? 'white' : 'black' }
                            ]}
                            placeholder="Add a comment..."
                            placeholderTextColor={isDark ? '#8e8e8e' : '#666666'}
                            value={newComment}
                            onChangeText={setNewComment}
                            multiline
                        />
                        {isAddingComment ? (
                            <ActivityIndicator size="small" color={isDark ? 'white' : 'black'} />
                        ) : (
                            <TouchableOpacity
                                onPress={onAddComment}
                                disabled={!newComment.trim()}
                                style={[
                                    styles.postButton,
                                    { opacity: newComment.trim() ? 1 : 0.5 }
                                ]}
                            >
                                <Text style={[
                                    styles.postButtonText,
                                    { color: isDark ? '#0095f6' : '#0095f6' }
                                ]}>Post</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalContent: {
        height: '80%',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerText: {
        fontSize: 18,
        fontWeight: '600',
    },
    commentsContainer: {
        flex: 1,
    },
    commentItem: {
        flexDirection: 'row',
        marginBottom: 20,
        alignItems: 'flex-start',
    },
    commentAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    commentContent: {
        flex: 1,
    },
    commentUsername: {
        fontWeight: '600',
        marginBottom: 4,
        fontSize: 14,
    },
    commentText: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 4,
    },
    commentMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    commentTimestamp: {
        fontSize: 12,
        marginRight: 16,

    },
    commentLikes: {
        fontSize: 12,
    },
    commentInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    commentInput: {
        flex: 1,
        marginRight: 12,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        fontSize: 14,
    },
    postButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    postButtonText: {
        fontWeight: '600',
        fontSize: 14,
    },
});

export default CommentModal;
