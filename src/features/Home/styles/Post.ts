import {Dimensions, StyleSheet} from 'react-native';
export const createStyles = (isDark: boolean) =>
  StyleSheet.create({
    postContainer: {
      marginBottom: 8,
      borderRadius: 8,
      overflow: 'hidden',
      borderWidth: 0,
      borderColor: isDark ? '#333' : '#e0e0e0',
      backgroundColor: isDark ? '#1a1a1a' : 'white',
      elevation: 4,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 12,
      backgroundColor: isDark ? '#1a1a1a' : 'white',
      borderBottomWidth: 1,
      borderBottomColor: isDark ? '#333' : '#e0e0e0',
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'center',
    },
    avatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 10,
      borderWidth: 1,
      marginTop: 1,
      borderColor: isDark ? '#333' : '#e0e0e0',
    },
    username: {
      fontWeight: '600',
      fontSize: 14,
      color: isDark ? 'white' : 'black',
      marginRight: 6,
    },
    mediaContainer: {
      position: 'relative',
      backgroundColor: isDark ? 'black' : 'white',
      width: '100%',
      overflow: 'hidden',
      padding: 0,
      margin: 0,
    },
    mediaContent: {
      backgroundColor: '#000',
      padding: 0,
      margin: 0,
    },
    carouselContainer: {
      position: 'relative',
      backgroundColor: isDark ? '#1a1a1a' : 'white',
      width: '100%',
      overflow: 'hidden',
    },
    postImage: {
      width: '100%',
      height: '100%',
      backgroundColor: isDark ? 'black' : 'white',
    },
    videoContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 0,
      margin: 0,
      backgroundColor: isDark ? '#1a1a1a' : 'white',
    },
    videoOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'transparent',
    },
    pausedOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    playButton: {
      opacity: 0.9,
    },
    paginationDots: {
      position: 'absolute',
      bottom: 16,
      left: 0,
      right: 0,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    dot: {
      width: 6,
      height: 6,
      margin: 4,
      borderRadius: 3,
    },
    videoDimensions: {
      width: '100%',
      height: '100%',
    },
    imageDimensions: {
      width: '100%',
    },
    activityIndicatorDark: {
      color: 'white',
    },
    activityIndicatorLight: {
      color: '#2379C2',
    },
    bookmarkIconSaved: {
      color: '#3EB9F1',
    },
    bookmarkIconDark: {
      color: 'white',
    },
    bookmarkIconLight: {
      color: 'black',
    },
    likesDark: {
      color: 'white',
    },
    likesLight: {
      color: 'black',
    },
    usernameDark: {
      color: 'white',
    },
    usernameLight: {
      color: 'black',
    },
    descriptionDark: {
      color: '#e0e0e0',
    },
    descriptionLight: {
      color: '#2c2c2c',
    },
    timestampDark: {
      color: '#8e8e8e',
    },
    timestampLight: {
      color: '#666666',
    },
    borderTopDark: {
      borderTopColor: '#333333',
    },
    borderTopLight: {
      borderTopColor: '#f0f0f0',
    },
    commentTextDark: {
      color: '#e0e0e0',
    },
    commentTextLight: {
      color: '#2c2c2c',
    },
    commentTimestampDark: {
      color: '#8e8e8e',
    },
    commentTimestampLight: {
      color: '#666666',
    },
    borderBottomDark: {
      borderBottomColor: '#333333',
    },
    borderBottomLight: {
      borderBottomColor: '#f0f0f0',
    },
    viewAllCommentsDark: {
      color: '#8e8e8e',
    },
    viewAllCommentsLight: {
      color: '#666666',
    },
    heartIconLiked: {
      color: 'red',
    },
    heartIconDark: {
      color: 'white',
    },
    heartIconLight: {
      color: 'black',
    },
    sendIconDark: {
      color: 'white',
    },
    sendIconLight: {
      color: 'black',
    },
    moreIconDark: {
      color: 'white',
    },
    moreIconLight: {
      color: 'black',
    },
    commentIconDark: {
      color: 'white',
    },
    commentIconLight: {
      color: 'black',
    },
    postActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: isDark ? '#1a1a1a' : 'white',
      borderTopWidth: 1,
      borderTopColor: isDark ? '#333' : '#e0e0e0',
    },
    leftActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionButton: {
      marginRight: 16,
    },
    postFooter: {
      paddingHorizontal: 12,
      paddingBottom: 12,
      backgroundColor: isDark ? '#1a1a1a' : 'white',
    },
    likes: {
      fontWeight: '600',
      marginBottom: 4,
      color: isDark ? 'white' : 'black',
    },
    captionContainer: {
      marginBottom: 4,
    },
    caption: {
      fontSize: 14,
      lineHeight: 18,
      color: isDark ? '#e0e0e0' : '#2c2c2c',
    },
    timestamp: {
      fontSize: 12,
      marginTop: 4,
      fontWeight: '400',
      color: isDark ? '#8e8e8e' : '#666666',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: '80%',
      backgroundColor: isDark ? '#2a2a2a' : 'white',
      borderRadius: 12,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: isDark ? '#404040' : '#e0e0e0',
    },
    optionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 15,
      borderBottomWidth: 0.5,
      borderBottomColor: isDark ? '#404040' : '#CCCCCC',
      backgroundColor: isDark ? '#2a2a2a' : 'white',
    },
    optionText: {
      marginLeft: 15,
      fontSize: 16,
      color: isDark ? 'white' : 'black',
    },
    commentsContainer: {
      marginTop: 8,
      paddingHorizontal: 12,
      backgroundColor: isDark ? '#1a1a1a' : 'white',
    },
    commentItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: isDark ? '#1a1a1a' : 'white',
      borderRadius: 8,
      padding: 8,
      borderBottomWidth: 0.5,
      borderBottomColor: isDark ? '#333333' : '#f0f0f0',
      paddingBottom: 10,
      marginBottom: 10,
    },
    commentAvatar: {
      width: 24,
      height: 24,
      borderRadius: 12,
      marginRight: 8,
      borderWidth: 1,
      borderColor: isDark ? '#333' : '#e0e0e0',
    },
    titleStyle: {
      textAlign: 'center',
      fontFamily: 'Kufam-Thin',
    },
    commentContent: {
      flex: 1,
    },
    commentText: {
      fontSize: 13,
      lineHeight: 18,
      color: isDark ? '#e0e0e0' : '#2c2c2c',
    },
    commentUsername: {
      fontWeight: '600',
      fontSize: 13,
      color: isDark ? 'white' : 'black',
    },
    commentMeta: {
      flexDirection: 'row',
      marginTop: 4,
      alignItems: 'center',
    },
    commentTimestamp: {
      fontSize: 12,
      marginRight: 12,
      color: isDark ? '#8e8e8e' : '#666666',
    },
    commentLikes: {
      fontSize: 12,
      color: isDark ? '#8e8e8e' : '#666666',
    },
    viewCommentsButton: {
      paddingVertical: 8,
      alignSelf: 'flex-start',
    },
    viewAllComments: {
      fontSize: 14,
      textAlign: 'center',
      color: '#8e8e8e',
    },
    verticalMediaContainer: {
      height: Dimensions.get('window').height * 0.8,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? '#1a1a1a' : '#000',
    },
    verticalCarouselContainer: {
      height: Dimensions.get('window').height * 0.8,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: isDark ? '#1a1a1a' : '#000',
    },
    verticalVideo: {
      resizeMode: 'contain',
    },
    verticalImage: {
      resizeMode: 'contain',
    },
    // postContainer: {
    //   marginBottom: 8,
    //   borderRadius: 8,
    //   overflow: 'hidden',
    //   backgroundColor: 'white',
    //   shadowColor: '#000',
    //   shadowOffset: {
    //     width: 0,
    //     height: 2,
    //   },
    //   shadowOpacity: 0.25,
    //   shadowRadius: 3.84,
    //   elevation: 4,
    //   width: '100%',
    // },
    // header: {
    //   flexDirection: 'row',
    //   alignItems: 'center',
    //   justifyContent: 'space-between',
    //   paddingHorizontal: 12,
    //   paddingTop: 12,
    //   paddingBottom: 6,
    // },
    // userInfo: {
    //   flexDirection: 'row',
    //   alignItems: 'center',
    // },
    // avatar: {
    //   width: 40,
    //   height: 40,
    //   borderRadius: 20,
    //   marginRight: 10,
    // },
    // username: {
    //   fontWeight: '600',
    //   fontSize: 14,
    // },
    // mediaContainer: {
    //   position: 'relative',
    // },
    // carouselContainer: {
    //   position: 'relative',
    // },
    // postImage: {
    //   width: '100%',
    //   height: 300,
    // },
    // videoOverlay: {
    //   position: 'absolute',
    //   top: 0,
    //   left: 0,
    //   right: 0,
    //   bottom: 0,
    //   justifyContent: 'center',
    //   alignItems: 'center',
    //   backgroundColor: 'transparent',
    // },
    // pausedOverlay: {
    //   position: 'absolute',
    //   top: 0,
    //   left: 0,
    //   right: 0,
    //   bottom: 0,
    //   backgroundColor: 'rgba(0, 0, 0, 0.5)',
    // },
    // playButton: {
    //   opacity: 0.9,
    //   shadowColor: '#000',
    //   shadowOffset: {
    //     width: 0,
    //     height: 2,
    //   },
    //   shadowOpacity: 0.5,
    //   shadowRadius: 3.84,
    // },
    // paginationDots: {
    //   position: 'absolute',
    //   bottom: 16,
    //   left: 0,
    //   right: 0,
    //   flexDirection: 'row',
    //   justifyContent: 'center',
    //   alignItems: 'center',
    // },
    // dot: {
    //   width: 6,
    //   height: 6,
    //   borderRadius: 3,
    //   margin: 4,
    // },
    // postActions: {
    //   flexDirection: 'row',
    //   justifyContent: 'space-between',
    //   alignItems: 'center',
    //   paddingHorizontal: 12,
    //   paddingVertical: 8,
    // },
    // leftActions: {
    //   flexDirection: 'row',
    //   alignItems: 'center',
    // },
    // actionButton: {
    //   marginRight: 16,
    // },
    // postFooter: {
    //   paddingHorizontal: 12,
    //   paddingBottom: 12,
    // },
    // likes: {
    //   fontWeight: '600',
    //   marginBottom: 4,
    // },
    // captionContainer: {
    //   marginBottom: 4,
    // },
    // caption: {
    //   fontSize: 14,
    //   lineHeight: 18,
    // },
    // timestamp: {
    //   fontSize: 12,
    //   marginTop: 4,
    //   fontWeight: '400',
    // },
    // commentsContainer: {
    //   marginTop: 8,
    //   paddingHorizontal: 12,
    // },
    // commentItem: {
    //   flexDirection: 'row',
    //   marginBottom: 8,
    //   alignItems: 'flex-start',
    // },
    // commentAvatar: {
    //   width: 24,
    //   height: 24,
    //   borderRadius: 12,
    //   marginRight: 8,
    // },
    // commentContent: {
    //   flex: 1,
    // },
    // commentText: {
    //   fontSize: 13,
    //   lineHeight: 18,
    // },
    // commentUsername: {
    //   fontWeight: '600',
    //   fontSize: 13,
    // },
    // commentMeta: {
    //   flexDirection: 'row',
    //   marginTop: 4,
    //   alignItems: 'center',
    // },
    // commentTimestamp: {
    //   fontSize: 12,
    //   marginRight: 12,
    // },
    // commentLikes: {
    //   fontSize: 12,
    // },
    // viewCommentsButton: {
    //   paddingVertical: 8,
    // },
    // viewAllComments: {
    //   fontSize: 14,
    //   color: '#8e8e8e',
    // },
    errorContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      backgroundColor: '#f8d7da',
      width: '100%',
      height: 200,
    },
    videoErrorContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#121212',
      zIndex: 1,
    },

    hashtag: {
      fontWeight: '600',
      color: isDark ? '#2379C2' : '#0095f6', // Default color for hashtags (used when isDark isn't available)
    },
    navButton: {
      position: 'absolute',
      top: '50%',
      transform: [{translateY: -15}],
      padding: 10,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderRadius: 20,
    },
    prevButton: {
      left: 10,
    },
    nextButton: {
      right: 10,
    },
    fullPostModalContainer: {
      flex: 1,
      width: '100%',
      height: '100%',
      margin: 0,
      paddingTop: 0, // Ensure no extra padding at the top
      backgroundColor: isDark ? '#1a1a1a' : 'white',
    },
    fullPostScrollView: {
      flex: 1,
      width: '100%',
      height: '100%', // Ensure it takes full height
      marginBottom: 10, // Add margin at bottom
      overflow: 'scroll', // Force scrolling to be enabled
    },
    fullPostScrollContent: {
      flexGrow: 1,
      paddingBottom: 60, // Increase padding at the bottom for better scrolling
      minHeight: '100%',
    },
    fullPostHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      paddingTop: 8,
      borderBottomWidth: 1,
      margin: 0,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      width: '100%',
      borderBottomColor: isDark ? '#333333' : '#f0f0f0',
    },
    closeButton: {
      padding: 8,
      borderRadius: 20,
    },
    fullPostMediaContainer: {
      position: 'relative',
      width: '100%',
      backgroundColor: '#000',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 200,
      overflow: 'hidden',
      padding: 0,
      margin: 0,
    },
    fullPostActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      width: '100%',
      borderBottomColor: isDark ? '#333333' : '#f0f0f0',
    },
    fullPostContentContainer: {
      padding: 16,
      width: '100%',
    },
    fullPostDescriptionContainer: {
      marginVertical: 12,
      flexDirection: 'column',
      flexWrap: 'wrap',
      width: '100%',
    },
    fullPostDescription: {
      fontSize: 16,
      lineHeight: 22,
      width: '100%',
      textAlign: 'justify',
      letterSpacing: 0.3,
      color: isDark ? '#e0e0e0' : '#2c2c2c',
    },
    fullPostCommentsSection: {
      marginTop: 20,
      paddingTop: 16,
      borderTopWidth: 1,
      width: '100%',
      borderTopColor: isDark ? '#333333' : '#f0f0f0',
    },
    commentsHeaderContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    commentsHeader: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? 'white' : 'black',
    },
    viewAllCommentsButton: {
      padding: 5,
    },
  });
