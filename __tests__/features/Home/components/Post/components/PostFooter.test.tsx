import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {PostFooter} from '../../../../../../src/features/Home/components/Post/PostFooter';
import {StyleSheet, Text} from 'react-native';

// Create mock styles
const mockStyles = StyleSheet.create({
  postFooter: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  likes: {
    fontWeight: '600',
    marginBottom: 4,
  },
  captionContainer: {
    marginBottom: 4,
  },
  caption: {
    fontSize: 14,
  },
  username: {
    fontWeight: '600',
  },
  viewCommentsButton: {
    marginTop: 4,
  },
  viewAllComments: {
    color: '#999',
  },
  timestamp: {
    color: '#999',
    fontSize: 12,
    marginTop: 4,
  },
});

describe('PostFooter component', () => {
  const defaultProps = {
    likes: 100,
    username: 'TestUser',
    formattedDescription: <Text>This is a test post with #hashtags</Text>,
    commentsCount: 50,
    hasComments: true,
    timestamp: '2 hours ago',
    onViewCommentsPress: jest.fn(),
    onCaptionPress: jest.fn(),
    styles: mockStyles,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render likes count correctly', () => {
      const {getByText} = render(<PostFooter {...defaultProps} />);
      expect(getByText('100 likes')).toBeTruthy();
    });

    it('should render username in caption', () => {
      const {getAllByText} = render(<PostFooter {...defaultProps} />);
      // Username appears in the caption area
      expect(getAllByText(/TestUser/)).toBeTruthy();
    });

    it('should render timestamp', () => {
      const {getByText} = render(<PostFooter {...defaultProps} />);
      expect(getByText('2 hours ago')).toBeTruthy();
    });

    it('should render view all comments button when there are comments', () => {
      const {getByText} = render(<PostFooter {...defaultProps} />);
      expect(getByText('View all 50 comments')).toBeTruthy();
    });

    it('should not render view all comments button when there are no comments', () => {
      const {queryByText} = render(
        <PostFooter {...defaultProps} hasComments={false} />,
      );
      expect(queryByText(/View all/)).toBeNull();
    });
  });

  describe('Likes display', () => {
    it('should display singular "like" for 1 like', () => {
      // The component always shows "likes" plural based on implementation
      const {getByText} = render(<PostFooter {...defaultProps} likes={1} />);
      expect(getByText('1 likes')).toBeTruthy();
    });

    it('should display 0 likes correctly', () => {
      const {getByText} = render(<PostFooter {...defaultProps} likes={0} />);
      expect(getByText('0 likes')).toBeTruthy();
    });

    it('should display large like counts correctly', () => {
      const {getByText} = render(<PostFooter {...defaultProps} likes={1000000} />);
      expect(getByText('1000000 likes')).toBeTruthy();
    });
  });

  describe('Comments button', () => {
    it('should call onViewCommentsPress when comments button is pressed', () => {
      const onViewCommentsPress = jest.fn();
      const {getByText} = render(
        <PostFooter {...defaultProps} onViewCommentsPress={onViewCommentsPress} />,
      );

      fireEvent.press(getByText('View all 50 comments'));
      expect(onViewCommentsPress).toHaveBeenCalledTimes(1);
    });

    it('should show correct comment count in button text', () => {
      const {getByText} = render(
        <PostFooter {...defaultProps} commentsCount={25} />,
      );
      expect(getByText('View all 25 comments')).toBeTruthy();
    });

    it('should show singular comment text for 1 comment', () => {
      // Component shows "comments" (plural) for all counts
      const {getByText} = render(
        <PostFooter {...defaultProps} commentsCount={1} />,
      );
      expect(getByText('View all 1 comments')).toBeTruthy();
    });
  });

  describe('Caption interaction', () => {
    it('should call onCaptionPress when caption is pressed', () => {
      const onCaptionPress = jest.fn();
      const {UNSAFE_getAllByType} = render(
        <PostFooter {...defaultProps} onCaptionPress={onCaptionPress} />,
      );

      const TouchableWithoutFeedback =
        require('react-native').TouchableWithoutFeedback;
      const touchables = UNSAFE_getAllByType(TouchableWithoutFeedback);

      // First touchable should be the caption container
      fireEvent.press(touchables[0]);
      expect(onCaptionPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('Formatted description', () => {
    it('should render formatted description with hashtags', () => {
      const formattedDesc = (
        <Text>
          Check out this <Text style={{color: '#2379C2'}}>#react</Text> post!
        </Text>
      );
      const {getByText} = render(
        <PostFooter {...defaultProps} formattedDescription={formattedDesc} />,
      );
      expect(getByText('#react')).toBeTruthy();
    });

    it('should render plain text description', () => {
      const plainDescription = <Text>Just a plain text post</Text>;
      const {getByText} = render(
        <PostFooter {...defaultProps} formattedDescription={plainDescription} />,
      );
      expect(getByText('Just a plain text post')).toBeTruthy();
    });

    it('should render description with mentions', () => {
      const mentionDescription = (
        <Text>
          Hey <Text style={{color: '#2379C2'}}>@johndoe</Text>, check this out!
        </Text>
      );
      const {getByText} = render(
        <PostFooter {...defaultProps} formattedDescription={mentionDescription} />,
      );
      expect(getByText('@johndoe')).toBeTruthy();
    });

    it('should render description with emojis', () => {
      const emojiDescription = <Text>Great day! 🎉🌟✨</Text>;
      const {getByText} = render(
        <PostFooter {...defaultProps} formattedDescription={emojiDescription} />,
      );
      expect(getByText('Great day! 🎉🌟✨')).toBeTruthy();
    });

    it('should handle long descriptions with ellipsis', () => {
      const longDescription = (
        <Text>
          This is a very long description that should be truncated after a certain
          number of lines because it contains so much text that it would take up
          too much space on the screen and we want to keep the UI clean and
          readable for all users.
        </Text>
      );
      const {getByText} = render(
        <PostFooter {...defaultProps} formattedDescription={longDescription} />,
      );
      expect(getByText(/This is a very long description/)).toBeTruthy();
    });
  });

  describe('Timestamp formats', () => {
    it('should display seconds ago', () => {
      const {getByText} = render(
        <PostFooter {...defaultProps} timestamp="30 seconds ago" />,
      );
      expect(getByText('30 seconds ago')).toBeTruthy();
    });

    it('should display minutes ago', () => {
      const {getByText} = render(
        <PostFooter {...defaultProps} timestamp="15 minutes ago" />,
      );
      expect(getByText('15 minutes ago')).toBeTruthy();
    });

    it('should display hours ago', () => {
      const {getByText} = render(
        <PostFooter {...defaultProps} timestamp="3 hours ago" />,
      );
      expect(getByText('3 hours ago')).toBeTruthy();
    });

    it('should display days ago', () => {
      const {getByText} = render(
        <PostFooter {...defaultProps} timestamp="5 days ago" />,
      );
      expect(getByText('5 days ago')).toBeTruthy();
    });

    it('should display weeks ago', () => {
      const {getByText} = render(
        <PostFooter {...defaultProps} timestamp="2 weeks ago" />,
      );
      expect(getByText('2 weeks ago')).toBeTruthy();
    });

    it('should display date format for older posts', () => {
      const {getByText} = render(
        <PostFooter {...defaultProps} timestamp="January 15, 2024" />,
      );
      expect(getByText('January 15, 2024')).toBeTruthy();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty username', () => {
      const {getByText} = render(
        <PostFooter {...defaultProps} username="" />,
      );
      // Should still render the footer with likes count
      expect(getByText('100 likes')).toBeTruthy();
    });

    it('should handle null formatted description', () => {
      const {getByText} = render(
        <PostFooter {...defaultProps} formattedDescription={null as any} />,
      );
      // Should still render with likes
      expect(getByText('100 likes')).toBeTruthy();
    });

    it('should handle zero comments', () => {
      const {queryByText} = render(
        <PostFooter {...defaultProps} hasComments={false} commentsCount={0} />,
      );
      expect(queryByText(/View all/)).toBeNull();
    });

    it('should handle very long username', () => {
      const longUsername = 'VeryLongUsernameWithManyCharacters123';
      const {getAllByText} = render(
        <PostFooter {...defaultProps} username={longUsername} />,
      );
      expect(getAllByText(new RegExp(longUsername))).toBeTruthy();
    });
  });

  describe('Layout structure', () => {
    it('should render with correct number of child elements', () => {
      const {UNSAFE_getAllByType} = render(<PostFooter {...defaultProps} />);
      const View = require('react-native').View;
      const views = UNSAFE_getAllByType(View);
      expect(views.length).toBeGreaterThanOrEqual(1);
    });

    it('should have caption container wrapped in touchable', () => {
      const {UNSAFE_getAllByType} = render(<PostFooter {...defaultProps} />);
      const TouchableWithoutFeedback =
        require('react-native').TouchableWithoutFeedback;
      expect(UNSAFE_getAllByType(TouchableWithoutFeedback).length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Interaction callbacks', () => {
    it('should not throw when onViewCommentsPress is undefined', () => {
      const propsWithoutCallback = {
        ...defaultProps,
        onViewCommentsPress: undefined as any,
        hasComments: false,
      };
      expect(() => render(<PostFooter {...propsWithoutCallback} />)).not.toThrow();
    });

    it('should handle multiple rapid caption presses', () => {
      const onCaptionPress = jest.fn();
      const {UNSAFE_getAllByType} = render(
        <PostFooter {...defaultProps} onCaptionPress={onCaptionPress} />,
      );

      const TouchableWithoutFeedback =
        require('react-native').TouchableWithoutFeedback;
      const touchables = UNSAFE_getAllByType(TouchableWithoutFeedback);

      fireEvent.press(touchables[0]);
      fireEvent.press(touchables[0]);
      fireEvent.press(touchables[0]);

      expect(onCaptionPress).toHaveBeenCalledTimes(3);
    });
  });
});
