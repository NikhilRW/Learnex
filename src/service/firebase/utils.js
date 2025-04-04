"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertFirestorePost = exports.convertFirestoreComment = exports.formatFirestoreTimestamp = exports.formatTimestamp = exports.toImageSource = void 0;
// Helper function to convert string URLs to ImageSourcePropType
function toImageSource(url) {
    return { uri: url };
}
exports.toImageSource = toImageSource;
// Helper function to format timestamps
function formatTimestamp(date) {
    var now = new Date();
    var diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60)
        return "".concat(diffInSeconds, "s ago");
    if (diffInSeconds < 3600)
        return "".concat(Math.floor(diffInSeconds / 60), "m ago");
    if (diffInSeconds < 86400)
        return "".concat(Math.floor(diffInSeconds / 3600), "h ago");
    if (diffInSeconds < 604800)
        return "".concat(Math.floor(diffInSeconds / 86400), "d ago");
    if (diffInSeconds < 2419200)
        return "".concat(Math.floor(diffInSeconds / 604800), "w ago");
    return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
}
exports.formatTimestamp = formatTimestamp;
// Helper function to convert Firestore timestamp to formatted string
function formatFirestoreTimestamp(timestamp) {
    if (!timestamp)
        return '';
    // Handle different timestamp formats
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        // Standard Firestore timestamp object with toDate() method
        return formatTimestamp(timestamp.toDate());
    }
    else if (timestamp._seconds !== undefined &&
        timestamp._nanoseconds !== undefined) {
        // Raw Firestore timestamp object with _seconds and _nanoseconds
        var date = new Date(timestamp._seconds * 1000);
        return formatTimestamp(date);
    }
    else if (timestamp instanceof Date) {
        // Already a Date object
        return formatTimestamp(timestamp);
    }
    else if (typeof timestamp === 'number') {
        // Timestamp as milliseconds
        return formatTimestamp(new Date(timestamp));
    }
    else if (typeof timestamp === 'string') {
        // Already formatted string or ISO date string
        if (isNaN(Date.parse(timestamp))) {
            // Not a valid date string, return as is
            return timestamp;
        }
        return formatTimestamp(new Date(timestamp));
    }
    // Fallback for unknown format
    return '';
}
exports.formatFirestoreTimestamp = formatFirestoreTimestamp;
// Helper function to convert FirestoreComment to Comment
function convertFirestoreComment(comment) {
    // Convert replies if they exist
    var convertedReplies = comment.replies
        ? comment.replies.map(function (reply) { return convertFirestoreComment(reply); })
        : undefined;
    return __assign(__assign({}, comment), { userImage: comment.userImage, timestamp: formatFirestoreTimestamp(comment.timestamp), isLiked: false, replies: convertedReplies });
}
exports.convertFirestoreComment = convertFirestoreComment;
// Helper function to convert FirestorePost to PostType
function convertFirestorePost(postData, currentUserId) {
    var _a;
    // Convert post images if they exist
    var convertedPostImages = postData.postImages
        ? postData.postImages.map(function (img) { return toImageSource(img); })
        : undefined;
    return {
        id: postData.id,
        user: {
            id: postData.user.id,
            username: postData.user.username,
            image: toImageSource(postData.user.image), // Convert string to ImageSourcePropType
        },
        description: postData.description,
        likes: postData.likes || 0,
        comments: postData.comments || 0,
        timestamp: formatFirestoreTimestamp(postData.timestamp),
        postImages: convertedPostImages,
        postVideo: postData.postVideo,
        hashtags: postData.hashtags || [],
        isVideo: postData.isVideo,
        commentsList: (_a = postData.commentsList) === null || _a === void 0 ? void 0 : _a.map(convertFirestoreComment),
        isLiked: (postData.likedBy || []).includes(currentUserId),
        isSaved: false, // Adding missing required property
    };
}
exports.convertFirestorePost = convertFirestorePost;
