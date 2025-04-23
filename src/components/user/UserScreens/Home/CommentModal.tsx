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
import { Avatar } from 'react-native-elements';
import { getUsernameForLogo } from '../../../../helpers/stringHelpers';
import Snackbar from 'react-native-snackbar';
import firestore from '@react-native-firebase/firestore';

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

/**
 * CommentModal displays a list of comments and allows users to add new comments
 * It supports features like:
 * - Viewing all comments
 * - Adding a new comment
 * - Liking comments
 * - Replying to comments
 * - Editing/Deleting your own comments
 */
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
    const [userProfileImages, setUserProfileImages] = useState<Record<string, string>>({});

    // Track all unique user IDs in comments
    const userIds = React.useMemo(() => {
        const ids = new Set<string>();
        localComments.forEach(comment => {
            if (comment.userId) ids.add(comment.userId);
            if (comment.replies) {
                comment.replies.forEach(reply => {
                    if (reply.userId) ids.add(reply.userId);
                });
            }
        });
        return Array.from(ids);
    }, [localComments]);

    // Listen for profile image updates for all users in comments
    useEffect(() => {
        if (!userIds.length) return;

        // Create listeners for each user
        const unsubscribers = userIds.map(userId =>
            firestore()
                .collection('users')
                .doc(userId)
                .onSnapshot(snapshot => {
                    if (snapshot.exists) {
                        const userData = snapshot.data();
                        if (userData?.image) {
                            setUserProfileImages(prev => ({
                                ...prev,
                                [userId]: userData.image
                            }));
                        }
                    }
                })
        );

        // Clean up listeners when component unmounts
        return () => {
            unsubscribers.forEach(unsubscribe => unsubscribe());
        };
    }, [userIds]);

    // Update local comments when props change
    useEffect(() => {
        setLocalComments(comments);
    }, [comments]);

    // Handle refresh - pull to refresh comments
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

    // Handle copy text function
    const handleCopyText = (text: string) => {
        Clipboard.setString(text);
        setShowOptions(false);
        Alert.alert('Success', 'Comment text copied');
    };

    // Options modal for comment actions (copy, edit, delete)
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

    // Handle like comment function
    const handleLikeComment = async (commentId: string) => {
        try {
            // Make the API call first
            const response = await firebase.posts.likeComment(postId, commentId);

            // Only update UI if the API call succeeds
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

                // Update the UI only after successful API response
                setLocalComments(updatedComments);
            } else {
                console.error('Like comment failed:', response.error);
                // No UI update if the API call fails
            }
        } catch (error) {
            console.error('Error liking comment:', error);
            // No alert - just log the error
        }
    };

    // Handle edit comment function
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

    // Handle delete comment function
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
                                if (comment.id === commentId) {
                                    return false;
                                } else if (comment.replies && comment.replies.length > 0) {
                                    comment.replies = comment.replies.filter(reply => reply.id !== commentId);
                                }
                                return true;
                            });

                            // Update UI immediately
                            setLocalComments(updatedComments);

                            // Then perform the actual deletion in the backend
                            const result = await firebase.posts.deleteComment(
                                postId,
                                commentId
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
            { cancelable: true }
        );
    }, [firebase.posts, postId, localComments, comments]);

    // Handle add reply function
    const handleAddReply = async (commentId: string, replyText: string) => {
        if (!replyText.trim()) return;

        try {
            setIsAddingReply(true);

            const result = await firebase.posts.addReply(
                postId,
                commentId,
                replyText.trim()
            );

            if (result.success) {
                // Update local state with new reply
                const updatedComments = localComments.map(comment => {
                    if (comment.id === commentId) {
                        const newReplies = comment.replies || [];
                        newReplies.push(result.reply);
                        return { ...comment, replies: newReplies };
                    }
                    return comment;
                });

                setLocalComments(updatedComments);
                setReplyingTo(null);
                setReplyText('');
            } else {
                Alert.alert('Error', result.error || 'Failed to add reply');
            }
        } catch (error) {
            console.error('Error adding reply:', error);
            Alert.alert('Error', 'Failed to add reply');
        } finally {
            setIsAddingReply(false);
        }
    };

    // Handle cancel edit function
    const handleCancelEdit = () => {
        setEditingCommentId(null);
        setEditedText('');
    };

    // Render a single comment or reply
    const renderComment = (comment: Comment, isReply = false) => {
        // Get potentially updated user image
        const updatedUserImage = comment.userId ? userProfileImages[comment.userId] : null;
        const displayImage = updatedUserImage || comment.userImage;

        return (
            <View key={comment.id} style={[styles.commentItem, isReply && styles.replyItem]}>
                {displayImage ? (
                    <Image source={{ uri: displayImage }} style={styles.commentAvatar} />
                ) : (
                    <Avatar
                        rounded
                        title={getUsernameForLogo(comment.username)}
                        size={40}
                        containerStyle={[styles.commentAvatar, { backgroundColor: primaryColor }]}
                        titleStyle={{ fontSize: 16 }}
                    />
                )}

                <View style={styles.commentContent}>
                    <View style={styles.commentHeader}>
                        <Text style={styles.commentUsername}>{comment.username}</Text>
                    </View>

                    {editingCommentId === comment.id ? (
                        <View style={styles.editContainer}>
                            <TextInput
                                style={styles.editInput}
                                value={editedText}
                                onChangeText={setEditedText}
                                multiline
                                placeholder="Edit your comment..."
                                placeholderTextColor={isDark ? '#8e8e8e' : '#666666'}
                            />
                            <View style={styles.editActions}>
                                <TouchableOpacity
                                    style={styles.editButton}
                                    onPress={handleCancelEdit}
                                >
                                    <Text style={styles.editButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.editButton, styles.saveButton]}
                                    onPress={() => handleEditComment(comment.id)}
                                >
                                    <Text style={styles.saveButtonText}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <>
                            <Text style={styles.commentText}>{comment.text}</Text>
                            <View style={styles.commentMeta}>
                                <Text style={styles.commentTimestamp}>
                                    {isReply && typeof comment.timestamp === 'string'
                                        ? comment.timestamp
                                        : typeof comment.timestamp === 'string' && comment.timestamp.includes('-')
                                            ? 'just now'
                                            : typeof comment.timestamp === 'string'
                                                ? comment.timestamp
                                                : formatFirestoreTimestamp(comment.timestamp)}
                                    {comment.editedAt && ' (edited)'}
                                </Text>
                                <Text style={styles.commentLikes}>
                                    {comment.likes} likes
                                </Text>
                                {/* Only show Reply button for main comments, not for replies */}
                                {!isReply && (
                                    <TouchableOpacity
                                        onPress={() => setReplyingTo(comment)}
                                        style={{ marginRight: 16 }}
                                    >
                                        <Text style={styles.commentLikes}>Reply</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </>
                    )}
                </View>

                <TouchableOpacity
                    style={styles.likeButton}
                    onPress={() => handleLikeComment(comment.id)}
                >
                    <AntDesign
                        name={comment.isLiked ? "heart" : "hearto"}
                        size={16}
                        color={comment.isLiked ? "red" : (isDark ? "#8e8e8e" : "#666666")}
                    />
                </TouchableOpacity>

                <TouchableOpacity
                    style={{ padding: 4 }}
                    onPress={() => {
                        setSelectedComment(comment);
                        setShowOptions(true);
                    }}
                >
                    <Icon
                        name="more-vertical"
                        size={16}
                        color={isDark ? "#8e8e8e" : "#666666"}
                    />
                </TouchableOpacity>
            </View>
        );
    };

    // Render all replies for a comment
    const renderReplies = (comment: Comment) => {
        if (!comment.replies || comment.replies.length === 0) return null;

        return (
            <View style={styles.replyContainer}>
                {comment.replies.map(reply => renderComment(reply, true))}
            </View>
        );
    };

    return (
        <Modal
            animationType="slide"
            transparent
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                        >
                            <Icon
                                name="x"
                                size={24}
                                color={isDark ? "white" : "black"}
                            />
                        </TouchableOpacity>
                        <Text style={styles.headerText}>Comments</Text>
                        <View style={styles.placeholder} />
                    </View>

                    <ScrollView
                        style={styles.commentsContainer}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor={isDark ? "white" : primaryColor}
                                colors={[primaryColor]}
                            />
                        }
                        showsVerticalScrollIndicator={true}
                    >
                        {localComments.length > 0 ? (
                            localComments.map(comment => (
                                <React.Fragment key={comment.id}>
                                    {renderComment(comment)}
                                    {renderReplies(comment)}
                                </React.Fragment>
                            ))
                        ) : (
                            <View style={{ padding: 16, alignItems: 'center' }}>
                                <Text style={{ color: isDark ? '#8e8e8e' : '#666666' }}>
                                    No comments yet. Be the first to comment!
                                </Text>
                            </View>
                        )}
                    </ScrollView>

                    {replyingTo && (
                        <View style={styles.replyingToContainer}>
                            <Text style={styles.replyingToText}>
                                Replying to {replyingTo.username}
                            </Text>
                            <TouchableOpacity onPress={() => setReplyingTo(null)}>
                                <Icon
                                    name="x"
                                    size={16}
                                    color={isDark ? "#8e8e8e" : "#666666"}
                                />
                            </TouchableOpacity>
                        </View>
                    )}

                    <View style={styles.commentInputContainer}>
                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.commentInput}
                                placeholder={replyingTo ? "Add a reply..." : "Add a comment..."}
                                placeholderTextColor={isDark ? '#8e8e8e' : '#666666'}
                                value={replyingTo ? replyText : newComment}
                                onChangeText={replyingTo ? setReplyText : setNewComment}
                                multiline
                            />
                            <TouchableOpacity
                                style={[
                                    styles.postButton,
                                    (replyingTo ? !replyText.trim() : !newComment.trim()) && styles.disabledPostButton
                                ]}
                                disabled={replyingTo ? isAddingReply || !replyText.trim() : isAddingComment || !newComment.trim()}
                                onPress={async () => {
                                    if (replyingTo) {
                                        await handleAddReply(replyingTo.id, replyText);
                                    } else {
                                        await onAddComment();
                                    }
                                }}
                            >
                                {replyingTo ? (
                                    isAddingReply ? (
                                        <ActivityIndicator size="small" color="white" />
                                    ) : (
                                        <Icon name="send" size={16} color="white" />
                                    )
                                ) : (
                                    isAddingComment ? (
                                        <ActivityIndicator size="small" color="white" />
                                    ) : (
                                        <Icon name="send" size={16} color="white" />
                                    )
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
                <CommentOptionsModal />
            </View>
        </Modal>
    );
};

export default CommentModal;