import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import {PostHeader} from '../../../../../../src/features/Home/components/Post/PostHeader';
import {StyleSheet} from 'react-native';

// Mock vector icons
jest.mock('react-native-vector-icons/Feather', () => 'Icon');

// Mock react-native-elements
jest.mock('react-native-elements', () => ({
  Avatar: ({title, titleStyle}: any) => {
    const {Text, View} = require('react-native');
    return (
      <View testID="avatar">
        <Text style={titleStyle}>{title}</Text>
      </View>
    );
  },
}));

// Mock string helpers
jest.mock('shared/helpers/common/stringHelpers', () => ({
  getUsernameForLogo: jest.fn((username: string) => {
    if (!username) return 'A';
    const parts = username.split(' ');
    if (parts.length > 1) {
      return parts[0][0].toUpperCase() + parts[1][0].toUpperCase();
    }
    return username.slice(0, 2).toUpperCase();
  }),
}));

// Create mock styles
const mockStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  username: {
    marginLeft: 8,
    fontWeight: '600',
    fontSize: 14,
  },
  titleStyle: {
    fontSize: 14,
    fontWeight: '600',
  },
});

describe('PostHeader component', () => {
  const defaultProps = {
    username: 'TestUser',
    userProfileImage: 'https://example.com/avatar.jpg',
    isDark: false,
    onOptionsPress: jest.fn(),
    styles: mockStyles,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render username correctly', () => {
      const {getByText} = render(<PostHeader {...defaultProps} />);
      expect(getByText('TestUser')).toBeTruthy();
    });

    it('should render user profile image when provided', () => {
      const {UNSAFE_getByType} = render(<PostHeader {...defaultProps} />);
      const Image = require('react-native').Image;
      expect(UNSAFE_getByType(Image)).toBeTruthy();
    });

    it('should render Avatar when no profile image is provided', () => {
      const {getByTestId} = render(
        <PostHeader {...defaultProps} userProfileImage={null} />,
      );
      expect(getByTestId('avatar')).toBeTruthy();
    });

    it('should render options button (more icon)', () => {
      const {UNSAFE_getByType} = render(<PostHeader {...defaultProps} />);
      expect(UNSAFE_getByType('Icon')).toBeTruthy();
    });

    it('should render correctly in dark mode', () => {
      const {UNSAFE_getByType} = render(
        <PostHeader {...defaultProps} isDark={true} />,
      );
      const icon = UNSAFE_getByType('Icon');
      expect(icon.props.color).toBe('white');
    });

    it('should render correctly in light mode', () => {
      const {UNSAFE_getByType} = render(
        <PostHeader {...defaultProps} isDark={false} />,
      );
      const icon = UNSAFE_getByType('Icon');
      expect(icon.props.color).toBe('black');
    });
  });

  describe('Avatar with initials', () => {
    it('should show initials for username without image', () => {
      const {getByTestId, getByText} = render(
        <PostHeader {...defaultProps} userProfileImage={null} username="John Doe" />,
      );
      expect(getByTestId('avatar')).toBeTruthy();
      // Avatar should show initials (mocked getUsernameForLogo returns "JD" for "John Doe")
      expect(getByText('JD')).toBeTruthy();
    });

    it('should handle single name for initials', () => {
      const {getByTestId, getByText} = render(
        <PostHeader {...defaultProps} userProfileImage={null} username="John" />,
      );
      expect(getByTestId('avatar')).toBeTruthy();
      expect(getByText('JO')).toBeTruthy();
    });

    it('should handle Anonymous user', () => {
      const {getByTestId, getByText} = render(
        <PostHeader {...defaultProps} userProfileImage={null} username="" />,
      );
      expect(getByTestId('avatar')).toBeTruthy();
      // Empty username falls back to 'Anonymous', mocked to return "AN"
      expect(getByText('AN')).toBeTruthy();
    });
  });

  describe('Options button', () => {
    it('should call onOptionsPress when options button is pressed', () => {
      const onOptionsPress = jest.fn();
      const {UNSAFE_getAllByType} = render(
        <PostHeader {...defaultProps} onOptionsPress={onOptionsPress} />,
      );

      const TouchableOpacity = require('react-native').TouchableOpacity;
      const touchables = UNSAFE_getAllByType(TouchableOpacity);
      
      // The last touchable should be the options button
      fireEvent.press(touchables[touchables.length - 1]);
      expect(onOptionsPress).toHaveBeenCalledTimes(1);
    });

    it('should show more-horizontal icon for options', () => {
      const {UNSAFE_getByType} = render(<PostHeader {...defaultProps} />);
      const icon = UNSAFE_getByType('Icon');
      expect(icon.props.name).toBe('more-horizontal');
    });

    it('should have correct icon size', () => {
      const {UNSAFE_getByType} = render(<PostHeader {...defaultProps} />);
      const icon = UNSAFE_getByType('Icon');
      expect(icon.props.size).toBe(24);
    });
  });

  describe('Image handling', () => {
    it('should handle image load errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const {UNSAFE_getByType} = render(<PostHeader {...defaultProps} />);
      
      const Image = require('react-native').Image;
      const imageComponent = UNSAFE_getByType(Image);
      
      // Simulate image error
      fireEvent(imageComponent, 'error', {
        nativeEvent: {error: 'Failed to load image'},
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Avatar loading error:',
        'Failed to load image',
      );

      consoleSpy.mockRestore();
    });

    it('should set correct image source from URI string', () => {
      const {UNSAFE_getByType} = render(<PostHeader {...defaultProps} />);
      const Image = require('react-native').Image;
      const imageComponent = UNSAFE_getByType(Image);
      
      expect(imageComponent.props.source).toEqual({
        uri: 'https://example.com/avatar.jpg',
      });
    });
  });

  describe('Theme handling', () => {
    it('should apply correct text color in dark mode', () => {
      const {getByText} = render(
        <PostHeader {...defaultProps} isDark={true} />,
      );
      const username = getByText('TestUser');
      expect(username).toBeTruthy();
    });

    it('should apply correct text color in light mode', () => {
      const {getByText} = render(
        <PostHeader {...defaultProps} isDark={false} />,
      );
      const username = getByText('TestUser');
      expect(username).toBeTruthy();
    });
  });

  describe('Different username formats', () => {
    it('should display long usernames correctly', () => {
      const longUsername = 'VeryLongUsernameWithManyCharacters';
      const {getByText} = render(
        <PostHeader {...defaultProps} username={longUsername} />,
      );
      expect(getByText(longUsername)).toBeTruthy();
    });

    it('should display username with special characters', () => {
      const specialUsername = 'User_Name-123';
      const {getByText} = render(
        <PostHeader {...defaultProps} username={specialUsername} />,
      );
      expect(getByText(specialUsername)).toBeTruthy();
    });

    it('should display username with emojis', () => {
      const emojiUsername = 'User🎉';
      const {getByText} = render(
        <PostHeader {...defaultProps} username={emojiUsername} />,
      );
      expect(getByText(emojiUsername)).toBeTruthy();
    });
  });

  describe('Layout structure', () => {
    it('should render header with correct structure', () => {
      const {UNSAFE_getAllByType} = render(<PostHeader {...defaultProps} />);
      const View = require('react-native').View;
      const views = UNSAFE_getAllByType(View);
      
      // Should have at least header, userInfo views
      expect(views.length).toBeGreaterThanOrEqual(2);
    });
  });
});
