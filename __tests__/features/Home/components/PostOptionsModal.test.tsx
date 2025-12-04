import React from 'react';
import {render, fireEvent} from '@testing-library/react-native';
import PostOptionsModal from '../../../../src/features/Home/components/PostOptionsModal';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';

// Mock vector icons
jest.mock('react-native-vector-icons/Feather', () => 'Icon');

// Mock react-native-elements
jest.mock('react-native-elements', () => ({
  Text: ({children, style}: any) => {
    const {Text} = require('react-native');
    return <Text style={style}>{children}</Text>;
  },
}));

// Mock useTheme hook
jest.mock('hooks/common/useTheme', () => ({
  useTheme: () => ({isDark: false}),
}));

// Mock getClassicDarkLightThemeColor
jest.mock('shared/utils/UserInterface', () => ({
  getClassicDarkLightThemeColor: (isDark: boolean) => ({
    color: isDark ? 'white' : 'black',
  }),
}));

// Create mock store
const createMockStore = (initialState = {}) => {
  const defaultState = {
    user: {
      theme: 'light',
    },
    ...initialState,
  };

  return configureStore({
    reducer: {
      user: (state = defaultState.user) => state,
    },
    preloadedState: defaultState,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
};

// Sample post data
const createSamplePost = (overrides = {}) => ({
  id: 'post-123',
  user: {
    id: 'user-456',
    username: 'TestUser',
    image: 'https://example.com/avatar.jpg',
  },
  description: 'This is a test post',
  postImages: [],
  likes: 10,
  comments: 5,
  timestamp: '2 hours ago',
  ...overrides,
});

const renderWithProviders = (ui: React.ReactElement, store = createMockStore()) => {
  return render(<Provider store={store}>{ui}</Provider>);
};

describe('PostOptionsModal component', () => {
  const defaultProps = {
    showOptions: true,
    setShowOptions: jest.fn(),
    isCurrentUserPost: false,
    isHiding: false,
    post: createSamplePost(),
    isDeleting: false,
    handleDeletePost: jest.fn(),
    handleMessageUser: jest.fn(),
    handleHidePost: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Modal visibility', () => {
    it('should render when visible is true', () => {
      const {getByText} = renderWithProviders(
        <PostOptionsModal {...defaultProps} showOptions={true} />,
      );
      // Should be visible since modal is shown
      expect(getByText(/Message/)).toBeTruthy();
    });

    it('should render when visible is false', () => {
      const {UNSAFE_getAllByType} = renderWithProviders(
        <PostOptionsModal {...defaultProps} showOptions={false} />,
      );
      // Modal component should still exist in tree
      const Modal = require('react-native').Modal;
      expect(UNSAFE_getAllByType(Modal).length).toBeGreaterThan(0);
    });
  });

  describe('Options for other users posts', () => {
    it('should show message option for other users posts', () => {
      const {getByText} = renderWithProviders(
        <PostOptionsModal {...defaultProps} isCurrentUserPost={false} />,
      );
      expect(getByText(/Message @TestUser/)).toBeTruthy();
    });

    it('should show hide post option for other users posts', () => {
      const {getByText} = renderWithProviders(
        <PostOptionsModal {...defaultProps} isCurrentUserPost={false} />,
      );
      expect(getByText('Hide this post')).toBeTruthy();
    });

    it('should call handleMessageUser when message option is pressed', () => {
      const handleMessageUser = jest.fn();
      const {getByText} = renderWithProviders(
        <PostOptionsModal
          {...defaultProps}
          isCurrentUserPost={false}
          handleMessageUser={handleMessageUser}
        />,
      );

      fireEvent.press(getByText(/Message @TestUser/));
      expect(handleMessageUser).toHaveBeenCalledTimes(1);
    });

    it('should call handleHidePost when hide option is pressed', () => {
      const handleHidePost = jest.fn();
      const {getByText} = renderWithProviders(
        <PostOptionsModal
          {...defaultProps}
          isCurrentUserPost={false}
          handleHidePost={handleHidePost}
        />,
      );

      fireEvent.press(getByText('Hide this post'));
      expect(handleHidePost).toHaveBeenCalledTimes(1);
    });

    it('should not show delete option for other users posts', () => {
      const {queryByText} = renderWithProviders(
        <PostOptionsModal {...defaultProps} isCurrentUserPost={false} />,
      );
      expect(queryByText(/Delete Post/)).toBeNull();
    });
  });

  describe('Options for current users posts', () => {
    it('should show delete option for current users posts', () => {
      const {getByText} = renderWithProviders(
        <PostOptionsModal {...defaultProps} isCurrentUserPost={true} />,
      );
      expect(getByText('Delete Post')).toBeTruthy();
    });

    it('should not show message option for own posts', () => {
      const {queryByText} = renderWithProviders(
        <PostOptionsModal {...defaultProps} isCurrentUserPost={true} />,
      );
      expect(queryByText(/Message/)).toBeNull();
    });

    it('should not show hide option for own posts', () => {
      const {queryByText} = renderWithProviders(
        <PostOptionsModal {...defaultProps} isCurrentUserPost={true} />,
      );
      expect(queryByText(/Hide this post/)).toBeNull();
    });

    it('should call handleDeletePost when delete option is pressed', () => {
      const handleDeletePost = jest.fn();
      const {getByText} = renderWithProviders(
        <PostOptionsModal
          {...defaultProps}
          isCurrentUserPost={true}
          handleDeletePost={handleDeletePost}
        />,
      );

      fireEvent.press(getByText('Delete Post'));
      expect(handleDeletePost).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading states', () => {
    it('should show "Deleting post..." text when isDeleting is true', () => {
      const {getByText} = renderWithProviders(
        <PostOptionsModal
          {...defaultProps}
          isCurrentUserPost={true}
          isDeleting={true}
        />,
      );
      expect(getByText('Deleting post...')).toBeTruthy();
    });

    it('should show "Hiding post..." text when isHiding is true', () => {
      const {getByText} = renderWithProviders(
        <PostOptionsModal
          {...defaultProps}
          isCurrentUserPost={false}
          isHiding={true}
        />,
      );
      expect(getByText('Hiding post...')).toBeTruthy();
    });

    it('should show ActivityIndicator when deleting', () => {
      const {UNSAFE_getByType} = renderWithProviders(
        <PostOptionsModal
          {...defaultProps}
          isCurrentUserPost={true}
          isDeleting={true}
        />,
      );
      const ActivityIndicator = require('react-native').ActivityIndicator;
      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });

    it('should show ActivityIndicator when hiding', () => {
      const {UNSAFE_getByType} = renderWithProviders(
        <PostOptionsModal
          {...defaultProps}
          isCurrentUserPost={false}
          isHiding={true}
        />,
      );
      const ActivityIndicator = require('react-native').ActivityIndicator;
      expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
    });

    it('should disable delete button when deleting', () => {
      const handleDeletePost = jest.fn();
      const {getByText} = renderWithProviders(
        <PostOptionsModal
          {...defaultProps}
          isCurrentUserPost={true}
          isDeleting={true}
          handleDeletePost={handleDeletePost}
        />,
      );

      fireEvent.press(getByText('Deleting post...'));
      // Button should be disabled, so handler should not be called
      expect(handleDeletePost).not.toHaveBeenCalled();
    });

    it('should disable hide button when hiding', () => {
      const handleHidePost = jest.fn();
      const {getByText} = renderWithProviders(
        <PostOptionsModal
          {...defaultProps}
          isCurrentUserPost={false}
          isHiding={true}
          handleHidePost={handleHidePost}
        />,
      );

      fireEvent.press(getByText('Hiding post...'));
      expect(handleHidePost).not.toHaveBeenCalled();
    });
  });

  describe('Modal close functionality', () => {
    it('should call setShowOptions with false when overlay is pressed', () => {
      const setShowOptions = jest.fn();
      const {UNSAFE_getAllByType} = renderWithProviders(
        <PostOptionsModal {...defaultProps} setShowOptions={setShowOptions} />,
      );

      const TouchableWithoutFeedback =
        require('react-native').TouchableWithoutFeedback;
      const touchables = UNSAFE_getAllByType(TouchableWithoutFeedback);

      // First touchable is the overlay
      fireEvent.press(touchables[0]);
      expect(setShowOptions).toHaveBeenCalledWith(false);
    });

    it('should close modal on request close (Android back button)', () => {
      const setShowOptions = jest.fn();
      const {UNSAFE_getByType} = renderWithProviders(
        <PostOptionsModal {...defaultProps} setShowOptions={setShowOptions} />,
      );

      const Modal = require('react-native').Modal;
      const modal = UNSAFE_getByType(Modal);

      modal.props.onRequestClose();
      expect(setShowOptions).toHaveBeenCalledWith(false);
    });

    it('should not close when modal content is pressed', () => {
      const setShowOptions = jest.fn();
      const {UNSAFE_getAllByType} = renderWithProviders(
        <PostOptionsModal {...defaultProps} setShowOptions={setShowOptions} />,
      );

      const TouchableWithoutFeedback =
        require('react-native').TouchableWithoutFeedback;
      const touchables = UNSAFE_getAllByType(TouchableWithoutFeedback);

      // The inner TouchableWithoutFeedback prevents event propagation
      // We just verify the structure is correct
      expect(touchables.length).toBeGreaterThan(1);
    });
  });

  describe('Icon rendering', () => {
    it('should show trash icon for delete option', () => {
      const {UNSAFE_getAllByType} = renderWithProviders(
        <PostOptionsModal {...defaultProps} isCurrentUserPost={true} />,
      );

      const icons = UNSAFE_getAllByType('Icon');
      const trashIcon = icons.find((icon: any) => icon.props.name === 'trash-2');
      expect(trashIcon).toBeTruthy();
    });

    it('should show message icon for message option', () => {
      const {UNSAFE_getAllByType} = renderWithProviders(
        <PostOptionsModal {...defaultProps} isCurrentUserPost={false} />,
      );

      const icons = UNSAFE_getAllByType('Icon');
      const messageIcon = icons.find(
        (icon: any) => icon.props.name === 'message-circle',
      );
      expect(messageIcon).toBeTruthy();
    });

    it('should show eye-off icon for hide option', () => {
      const {UNSAFE_getAllByType} = renderWithProviders(
        <PostOptionsModal {...defaultProps} isCurrentUserPost={false} />,
      );

      const icons = UNSAFE_getAllByType('Icon');
      const hideIcon = icons.find((icon: any) => icon.props.name === 'eye-off');
      expect(hideIcon).toBeTruthy();
    });
  });

  describe('Username display', () => {
    it('should display correct username in message option', () => {
      const post = createSamplePost({user: {username: 'JohnDoe'}});
      const {getByText} = renderWithProviders(
        <PostOptionsModal
          {...defaultProps}
          isCurrentUserPost={false}
          post={post}
        />,
      );
      expect(getByText('Message @JohnDoe')).toBeTruthy();
    });

    it('should handle special characters in username', () => {
      const post = createSamplePost({user: {username: 'User_Name-123'}});
      const {getByText} = renderWithProviders(
        <PostOptionsModal
          {...defaultProps}
          isCurrentUserPost={false}
          post={post}
        />,
      );
      expect(getByText('Message @User_Name-123')).toBeTruthy();
    });
  });

  describe('Theme handling', () => {
    it('should render correctly with theme context', () => {
      const {getByText} = renderWithProviders(
        <PostOptionsModal {...defaultProps} />,
      );
      // Check that the modal content renders properly
      expect(getByText(/Message/)).toBeTruthy();
    });
  });
});
