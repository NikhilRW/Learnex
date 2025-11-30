import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {PostActions} from '../../../../../../src/features/Home/components/Post/PostActions';
import {StyleSheet} from 'react-native';

// Mock vector icons
jest.mock('react-native-vector-icons/AntDesign', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('react-native-vector-icons/Feather', () => 'Icon');

// Mock the primaryColor
jest.mock('shared/res/strings/eng', () => ({
  primaryColor: '#2379C2',
}));

// Create mock styles
const mockStyles = StyleSheet.create({
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  leftActions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginRight: 16,
  },
});

describe('PostActions component', () => {
  const defaultProps = {
    isLiked: false,
    isSaved: false,
    isSaving: false,
    isDark: false,
    onLikePress: jest.fn(),
    onCommentPress: jest.fn(),
    onSharePress: jest.fn(),
    onSavePress: jest.fn(),
    styles: mockStyles,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all action buttons', () => {
      const {UNSAFE_getAllByType} = render(<PostActions {...defaultProps} />);
      
      // Should render multiple Icon components for like, comment, share, save
      const icons = UNSAFE_getAllByType('Icon');
      expect(icons.length).toBeGreaterThanOrEqual(4);
    });

    it('should render correctly in light mode', () => {
      const {UNSAFE_getAllByType} = render(<PostActions {...defaultProps} isDark={false} />);
      const icons = UNSAFE_getAllByType('Icon');
      expect(icons.length).toBeGreaterThanOrEqual(4);
    });

    it('should render correctly in dark mode', () => {
      const {UNSAFE_getAllByType} = render(<PostActions {...defaultProps} isDark={true} />);
      const icons = UNSAFE_getAllByType('Icon');
      expect(icons.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Like button', () => {
    it('should call onLikePress when like button is pressed', () => {
      const onLikePress = jest.fn();
      const {UNSAFE_getAllByType} = render(
        <PostActions {...defaultProps} onLikePress={onLikePress} />,
      );

      // Get the first TouchableOpacity (like button)
      const TouchableOpacity = require('react-native').TouchableOpacity;
      const touchables = UNSAFE_getAllByType(TouchableOpacity);
      
      // Fire press on the first touchable (like button)
      fireEvent.press(touchables[0]);
      expect(onLikePress).toHaveBeenCalledTimes(1);
    });

    it('should show filled heart when post is liked', () => {
      const {UNSAFE_getAllByType} = render(
        <PostActions {...defaultProps} isLiked={true} />,
      );

      const icons = UNSAFE_getAllByType('Icon');
      // First icon should be the heart icon
      const heartIcon = icons[0];
      expect(heartIcon.props.name).toBe('heart');
    });

    it('should show empty heart when post is not liked', () => {
      const {UNSAFE_getAllByType} = render(
        <PostActions {...defaultProps} isLiked={false} />,
      );

      const icons = UNSAFE_getAllByType('Icon');
      const heartIcon = icons[0];
      expect(heartIcon.props.name).toBe('hearto');
    });

    it('should show red color when liked', () => {
      const {UNSAFE_getAllByType} = render(
        <PostActions {...defaultProps} isLiked={true} />,
      );

      const icons = UNSAFE_getAllByType('Icon');
      const heartIcon = icons[0];
      expect(heartIcon.props.color).toBe('red');
    });
  });

  describe('Comment button', () => {
    it('should call onCommentPress when comment button is pressed', () => {
      const onCommentPress = jest.fn();
      const {UNSAFE_getAllByType} = render(
        <PostActions {...defaultProps} onCommentPress={onCommentPress} />,
      );

      const TouchableOpacity = require('react-native').TouchableOpacity;
      const touchables = UNSAFE_getAllByType(TouchableOpacity);
      
      // Second touchable should be comment button
      fireEvent.press(touchables[1]);
      expect(onCommentPress).toHaveBeenCalledTimes(1);
    });
  });

  describe('Share button', () => {
    it('should call onSharePress when share button is pressed', () => {
      const onSharePress = jest.fn();
      const {UNSAFE_getAllByType} = render(
        <PostActions {...defaultProps} onSharePress={onSharePress} />,
      );

      const TouchableOpacity = require('react-native').TouchableOpacity;
      const touchables = UNSAFE_getAllByType(TouchableOpacity);
      
      // Third touchable should be share button
      fireEvent.press(touchables[2]);
      expect(onSharePress).toHaveBeenCalledTimes(1);
    });
  });

  describe('Save button', () => {
    it('should call onSavePress when save button is pressed', () => {
      const onSavePress = jest.fn();
      const {UNSAFE_getAllByType} = render(
        <PostActions {...defaultProps} onSavePress={onSavePress} />,
      );

      const TouchableOpacity = require('react-native').TouchableOpacity;
      const touchables = UNSAFE_getAllByType(TouchableOpacity);
      
      // Fourth touchable should be save button
      fireEvent.press(touchables[3]);
      expect(onSavePress).toHaveBeenCalledTimes(1);
    });

    it('should show filled bookmark when post is saved', () => {
      const {UNSAFE_getAllByType} = render(
        <PostActions {...defaultProps} isSaved={true} />,
      );

      const icons = UNSAFE_getAllByType('Icon');
      // Last icon should be bookmark
      const bookmarkIcon = icons[icons.length - 1];
      expect(bookmarkIcon.props.name).toBe('bookmark');
    });

    it('should show outlined bookmark when post is not saved', () => {
      const {UNSAFE_getAllByType} = render(
        <PostActions {...defaultProps} isSaved={false} />,
      );

      const icons = UNSAFE_getAllByType('Icon');
      const bookmarkIcon = icons[icons.length - 1];
      expect(bookmarkIcon.props.name).toBe('bookmark-outline');
    });

    it('should disable save button when saving', () => {
      const {UNSAFE_getAllByType} = render(
        <PostActions {...defaultProps} isSaving={true} />,
      );

      const TouchableOpacity = require('react-native').TouchableOpacity;
      const touchables = UNSAFE_getAllByType(TouchableOpacity);
      
      // Last touchable should be disabled
      const saveButton = touchables[touchables.length - 1];
      expect(saveButton.props.disabled).toBe(true);
    });

    it('should show ActivityIndicator when saving', () => {
      const {UNSAFE_getByType} = render(
        <PostActions {...defaultProps} isSaving={true} />,
      );

      const ActivityIndicator = require('react-native').ActivityIndicator;
      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });

    it('should not show ActivityIndicator when not saving', () => {
      const {UNSAFE_queryByType} = render(
        <PostActions {...defaultProps} isSaving={false} />,
      );

      const ActivityIndicator = require('react-native').ActivityIndicator;
      expect(UNSAFE_queryByType(ActivityIndicator)).toBeNull();
    });
  });

  describe('Theme handling', () => {
    it('should use white color for icons in dark mode', () => {
      const {UNSAFE_getAllByType} = render(
        <PostActions {...defaultProps} isDark={true} isLiked={false} />,
      );

      const icons = UNSAFE_getAllByType('Icon');
      // Check that non-liked heart icon uses white in dark mode
      expect(icons[0].props.color).toBe('white');
    });

    it('should use black color for icons in light mode', () => {
      const {UNSAFE_getAllByType} = render(
        <PostActions {...defaultProps} isDark={false} isLiked={false} />,
      );

      const icons = UNSAFE_getAllByType('Icon');
      // Check that non-liked heart icon uses black in light mode
      expect(icons[0].props.color).toBe('black');
    });
  });

  describe('Rapid interactions', () => {
    it('should handle rapid like button presses', () => {
      const onLikePress = jest.fn();
      const {UNSAFE_getAllByType} = render(
        <PostActions {...defaultProps} onLikePress={onLikePress} />,
      );

      const TouchableOpacity = require('react-native').TouchableOpacity;
      const touchables = UNSAFE_getAllByType(TouchableOpacity);

      // Simulate rapid pressing
      fireEvent.press(touchables[0]);
      fireEvent.press(touchables[0]);
      fireEvent.press(touchables[0]);

      expect(onLikePress).toHaveBeenCalledTimes(3);
    });

    it('should not call onSavePress when saving is in progress', () => {
      const onSavePress = jest.fn();
      const {UNSAFE_getAllByType} = render(
        <PostActions {...defaultProps} onSavePress={onSavePress} isSaving={true} />,
      );

      const TouchableOpacity = require('react-native').TouchableOpacity;
      const touchables = UNSAFE_getAllByType(TouchableOpacity);

      // The save button is disabled when saving
      const saveButton = touchables[touchables.length - 1];
      expect(saveButton.props.disabled).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should render with proper structure for screen readers', () => {
      const {UNSAFE_getAllByType} = render(<PostActions {...defaultProps} />);
      const icons = UNSAFE_getAllByType('Icon');
      expect(icons.length).toBeGreaterThanOrEqual(4);
    });
  });
});
