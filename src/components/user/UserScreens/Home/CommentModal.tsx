import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Modal,
    Text,
    TouchableOpacity,
    ScrollView,
    Image,
    TextInput,
    ActivityIndicator,
    Alert,
    AlertButton,
    Clipboard,
    RefreshControl,
    TouchableWithoutFeedback,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { Comment } from '../../../../types/post';
import { useTypedSelector } from '../../../../hooks/useTypedSelector';
import { formatFirestoreTimestamp } from '../../../../service/firebase/utils';
import { primaryColor } from '../../../../res/strings/eng';
import { createStyles } from '../../../../styles/components/user/CommentModal.styles';

interface CommentModalProps {
    visible: boolean;
    onClose: () => void;
    comments: Comment[];
    isDark: boolean;
    onAddComment?: () => Promise<void>;
    newComment?: string;
    setNewComment?: (text: string) => void;
    isAddingComment?: boolean;
    postId?: string;
}

const CommentModal: React.FC<CommentModalProps> = ({
    visible,
    onClose,
    comments,
    isDark,
    onAddComment = async () => { },
    newComment = '',
    setNewComment = () => { },
    isAddingComment = false,
    postId = '',
}) => {
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editedText, setEditedText] = useState('');
    const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
    const [replyText, setReplyText] = useState('');
    const [isAddingReply, setIsAddingReply] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
    const firebase = useTypedSelector(state => state.firebase.firebase);
    const currentUser = firebase.currentUser();
    const styles = createStyles(isDark);
    const [localComments, setLocalComments] = useState(comments);

    useEffect(() => {
        setLocalComments(comments);
    }, [comments]);

    const onRefresh = useCallback(async () => {
        try {
            setRefreshing(true);
            await onAddComment();
        } catch (error) {
            console.error('Error refreshing comments:', error);
            Alert.alert('Error', 'Failed to refresh comments');
        } finally {
            setRefreshing(false);
        }
    }, [onAddComment]);

    const handleCopyText = (text: string) => {
        Clipboard.setString(text);
        setShowOptions(false);
        Alert.alert('Success', 'Comment text copied');
    };

    const CommentOptionsModal = () => {
        if (!selectedComment) return null;

        const canEdit = selectedComment.userId === currentUser?.uid;
        const canDelete = selectedComment.userId === currentUser?.uid;

        return (
            <Modal
                animationType="fade"
                transparent={true}
                visible={showOptions}
                onRequestClose={() => setShowOptions(false)}
            >
                <TouchableWithoutFeedback onPress={() => setShowOptions(false)}>
                    <View style={styles.optionsModalOverlay}>
                        <TouchableWithoutFeedback>
                            <View style={styles.optionsModalContent}>
                                <TouchableOpacity
                                    style={styles.optionItem}
                                    onPress={() => {
                                        handleCopyText(selectedComment.text);
                                    }}
                                >
                                    <FontAwesome name="copy" size={24} color={isDark ? "white" : "black"} />
                                    <Text style={styles.optionText}>Copy Text</Text>
                                </TouchableOpacity>

                                {canEdit && (
                                    <TouchableOpacity
                                        style={styles.optionItem}
                                        onPress={() => {
                                            setEditingCommentId(selectedComment.id);
                                            setEditedText(selectedComment.text);
                                            setShowOptions(false);
                                        }}
                                    >
                                        <MaterialIcons name="edit" size={24} color={isDark ? "white" : "black"} />
                                        <Text style={styles.optionText}>Edit Comment</Text>
                                    </TouchableOpacity>
                                )}

                                {canDelete && (
                                    <TouchableOpacity
                                        style={[styles.optionItem, { borderBottomWidth: 0 }]}
                                        onPress={() => {
                                            setShowOptions(false);
                                            setTimeout(() => {
                                                handleDeleteComment(selectedComment.id);
                                            }, 300);
                                        }}
                                    >
                                        <MaterialIcons name="delete-outline" size={24} color="#FF3B30" />
                                        <Text style={[styles.optionText, styles.dangerOption]}>Delete Comment</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        );
    };

    const handleLikeComment = async (commentId: string) => {
        try {
            const response = await firebase.posts.likeComment(postId, commentId);
            if (response.success) {
                const updatedComments = localComments.map(comment => {
                    if (comment.id === commentId) {
                        const newIsLiked = !comment.isLiked;
                        const newLikes = newIsLiked ? comment.likes + 1 : comment.likes - 1;
                        return { ...comment, isLiked: newIsLiked, likes: newLikes };
                    } else if (comment.replies && comment.replies.length > 0) {
                        const updatedReplies = comment.replies.map(reply => {
                            if (reply.id === commentId) {
                                const newIsLiked = !reply.isLiked;
                                const newLikes = newIsLiked ? reply.likes + 1 : reply.likes - 1;
                                return { ...reply, isLiked: newIsLiked, likes: newLikes };
                            }
                            return reply;
                        });
                        return { ...comment, replies: updatedReplies };
                    }
                    return comment;
                });
                setLocalComments(updatedComments);
            } else {
                Alert.alert('Error', response.error || 'Failed to like comment');
            }
        } catch (error) {
            Alert.alert('Error', 'An error occurred while liking the comment');
        }
    };

    const handleEditComment = useCallback(async (commentId: string) => {
        if (!editedText.trim()) return;

        try {
            // Update local state immediately for better UX
            const updatedComments = localComments.map(comment => {
                if (comment.id === commentId) {
                    return {
                        ...comment,
                        text: editedText.trim(),
                        editedAt: new Date().toISOString()
                    };
                } else if (comment.replies && comment.replies.length > 0) {
                    const updatedReplies = comment.replies.map(reply => {
                        if (reply.id === commentId) {
                            return {
                                ...reply,
                                text: editedText.trim(),
                                editedAt: new Date().toISOString()
                            };
                        }
                        return reply;
                    });
                    return { ...comment, replies: updatedReplies };
                }
                return comment;
            });

            // Update UI immediately
            setLocalComments(updatedComments);
            setEditingCommentId(null);
            setEditedText('');

            // Then perform the actual edit in the backend
            const result = await firebase.posts.editComment(
                postId,
                commentId,
                editedText.trim(),
            );

            if (!result.success) {
                Alert.alert('Error', result.error || 'Failed to edit comment');
                // If edit fails, revert to original comments
                setLocalComments(comments);
                setEditingCommentId(commentId);
                setEditedText(editedText);
            }
        } catch (error) {
            console.error('Error editing comment:', error);
            Alert.alert('Error', 'Failed to edit comment');
            // If edit fails, revert to original comments
            setLocalComments(comments);
            setEditingCommentId(commentId);
            setEditedText(editedText);
        }
    }, [editedText, firebase.posts, postId, localComments, comments]);

    const handleDeleteComment = useCallback(async (commentId: string) => {
        Alert.alert(
            'Delete Comment',
            'Are you sure you want to delete this comment?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Update local state immediately for better UX
                            const updatedComments = localComments.filter(comment => {
                                // Filter out the deleted comment
                                if (comment.id === commentId) return false;

                                // If comment has replies, check if any reply needs to be removed
                                if (comment.replies && comment.replies.length > 0) {
                                    comment.replies = comment.replies.filter(reply => reply.id !== commentId);
                                }
                                return true;
                            });

                            // Update UI immediately
                            setLocalComments(updatedComments);

                            // Then perform the actual deletion in the backend
                            const result = await firebase.posts.deleteComment(
                                postId,
                                commentId,
                            );

                            if (!result.success) {
                                Alert.alert('Error', result.error || 'Failed to delete comment');
                                // If deletion fails, revert to original comments
                                setLocalComments(comments);
                            }
                        } catch (error) {
                            console.error('Error deleting comment:', error);
                            Alert.alert('Error', 'Failed to delete comment');
                            // If deletion fails, revert to original comments
                            setLocalComments(comments);
                        }
                    },
                },
            ],
        );
    }, [firebase.posts, postId, localComments, comments]);

    const handleAddReply = async (commentId: string, replyText: string) => {
        if (!commentId || !replyText.trim()) {
            console.log('Invalid reply parameters:', { commentId, replyText });
            Alert.alert('Error', 'Invalid reply parameters');
            return;
        }

        try {
            // Log the full comment object for debugging
            const parentComment = comments.find(c => c.id === commentId);
            console.log('Found parent comment:', parentComment);

            console.log('Attempting to add reply:', {
                postId,
                commentId,
                replyText,
                replyingTo: replyingTo?.username,
                parentCommentExists: !!parentComment
            });

            if (!parentComment) {
                console.error('Parent comment not found in comments array');
                Alert.alert('Error', 'Could not find the comment to reply to');
                return;
            }

            setIsAddingReply(true);
            const response = await firebase.posts.addReply(postId, commentId, replyText.trim());

            if (response.success) {
                console.log('Reply added successfully:', response.reply);
                setReplyingTo(null);
                setReplyText('');
                if (onAddComment) {
                    await onAddComment();
                }
            } else {
                console.error('Failed to add reply:', response.error);
                Alert.alert('Error', response.error || 'Failed to add reply');
            }
        } catch (error) {
            console.error('Error in handleAddReply:', error);
            Alert.alert('Error', 'Failed to add reply');
        } finally {
            setIsAddingReply(false);
        }
    };

    const renderComment = useCallback((comment: Comment, isReply = false) => {
        const isEditing = editingCommentId === comment.id;
        const canEdit = comment.userId === currentUser?.uid;
        const canDelete = comment.userId === currentUser?.uid;

        return (
            <View key={comment.id} style={[styles.commentItem, isReply && styles.replyItem]}>
                <Image
                    source={{ uri: comment.userImage }}
                    style={styles.commentAvatar}
                />
                <View style={styles.commentContent}>
                    <View style={styles.commentHeader}>
                        <Text style={[
                            styles.commentUsername,
                            { color: isDark ? 'white' : 'black' }
                        ]}>
                            {comment.username}
                        </Text>
                        {(canEdit || canDelete) && (
                            <TouchableOpacity
                                onPress={() => {
                                    setSelectedComment(comment);
                                    setShowOptions(true);
                                }}
                                style={styles.optionsButton}
                            >
                                <MaterialIcons
                                    name="more-vert"
                                    size={20}
                                    color={isDark ? '#8e8e8e' : '#666666'}
                                />
                            </TouchableOpacity>
                        )}
                    </View>
                    {isEditing ? (
                        <View style={styles.editContainer}>
                            <TextInput
                                style={[
                                    styles.editInput,
                                    {
                                        color: isDark ? 'white' : 'black',
                                        backgroundColor: isDark ? '#2a2a2a' : '#f5f5f5',
                                    },
                                ]}
                                value={editedText}
                                onChangeText={setEditedText}
                                multiline
                                autoFocus
                            />
                            <View style={styles.editActions}>
                                <TouchableOpacity
                                    onPress={() => {
                                        setEditingCommentId(null);
                                        setEditedText('');
                                    }}
                                    style={styles.editButton}>
                                    <Text style={styles.editButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => handleEditComment(comment.id)}
                                    style={[styles.editButton, styles.saveButton]}>
                                    <Text style={styles.saveButtonText}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <>
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
                                    {typeof comment.timestamp === 'string'
                                        ? comment.timestamp
                                        : formatFirestoreTimestamp(comment.timestamp)}
                                    {comment.editedAt && ' (edited)'}
                                </Text>
                                <Text style={[
                                    styles.commentLikes,
                                    { color: isDark ? '#8e8e8e' : '#666666' }
                                ]}>
                                    {comment.likes} likes
                                </Text>
                                {!isReply && (
                                    <TouchableOpacity
                                        style={styles.replyButton}
                                        className={`${isDark ? 'bg-[#1a9cd8]' : 'bg-[#3EB9F1]'}`}
                                        onPress={() => {
                                            setReplyingTo(comment);
                                            setReplyText(`@${comment.username} `);
                                        }}>
                                        <Text style={[
                                            styles.replyButtonText,
                                        ]}>Reply</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </>
                    )}
                </View>
                <TouchableOpacity
                    style={styles.likeButton}
                    onPress={() => handleLikeComment(comment.id)}>
                    <AntDesign
                        name={comment.isLiked ? "heart" : "hearto"}
                        size={16}
                        color={comment.isLiked ? "red" : (isDark ? "#8e8e8e" : "#666666")}
                    />
                </TouchableOpacity>
            </View>
        );
    }, [editingCommentId, editedText, currentUser, isDark, handleLikeComment, handleEditComment, handleDeleteComment]);

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
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Icon name="chevron-down" size={28} color={isDark ? 'white' : 'black'} />
                        </TouchableOpacity>
                        <Text style={[
                            styles.headerText,
                            { color: isDark ? 'white' : 'black' }
                        ]}>Comments</Text>
                        <View style={styles.placeholder} />
                    </View>

                    <ScrollView
                        style={styles.commentsContainer}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor={isDark ? '#ffffff' : '#000000'}
                                colors={[primaryColor]}
                                progressBackgroundColor={isDark ? '#1a1a1a' : '#ffffff'}
                            />
                        }
                    >
                        {localComments.map(comment => (
                            <React.Fragment key={comment.id}>
                                {renderComment(comment)}
                                {comment.replies?.map(reply => renderComment(reply, true))}
                            </React.Fragment>
                        ))}
                    </ScrollView>

                    <View style={styles.commentInputContainer}>
                        {replyingTo ? (
                            <>
                                <View style={styles.replyingToContainer}>
                                    <Text style={styles.replyingToText}>
                                        Replying to @{replyingTo.username}
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => {
                                            setReplyingTo(null);
                                            setReplyText('');
                                        }}>
                                        <Icon name="x" size={16} color={isDark ? '#8e8e8e' : '#666666'} />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.inputWrapper}>
                                    <TextInput
                                        style={styles.commentInput}
                                        placeholder="Add a reply..."
                                        placeholderTextColor={isDark ? '#8e8e8e' : '#666666'}
                                        value={replyText}
                                        onChangeText={setReplyText}
                                        multiline
                                    />
                                    <TouchableOpacity
                                        onPress={() => handleAddReply(replyingTo.id, replyText)}
                                        disabled={!replyText.trim()}
                                        style={[
                                            styles.postButton,
                                            !replyText.trim() && styles.disabledPostButton
                                        ]}>
                                        <Icon name="send" size={20} color="white" />
                                    </TouchableOpacity>
                                </View>
                            </>
                        ) : (
                            <View style={styles.inputWrapper}>
                                <TextInput
                                    style={styles.commentInput}
                                    placeholder="Add a comment..."
                                    placeholderTextColor={isDark ? '#8e8e8e' : '#666666'}
                                    value={newComment}
                                    onChangeText={setNewComment}
                                    multiline
                                />
                                {isAddingComment ? (
                                    <ActivityIndicator size={20} color="white" style={styles.postButton} />
                                ) : (
                                    <TouchableOpacity
                                        onPress={onAddComment}
                                        disabled={!newComment.trim()}
                                        style={[
                                            styles.postButton,
                                            !newComment.trim() && styles.disabledPostButton
                                        ]}>
                                        <Icon name="send" size={20} color="white" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>
                </View>
                <CommentOptionsModal />
            </View>
        </Modal>
    );
};

export default CommentModal;