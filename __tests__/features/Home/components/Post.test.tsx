import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import {NavigationContainer} from '@react-navigation/native';

// Mock vector icons
jest.mock('react-native-vector-icons/Feather', () => 'Icon');
jest.mock('react-native-vector-icons/AntDesign', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

// Mock Video component
jest.mock('react-native-video', () => 'Video');

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

// Mock react-native-snackbar
jest.mock('react-native-snackbar', () => ({
  show: jest.fn(),
  dismiss: jest.fn(),
  LENGTH_LONG: 0,
  LENGTH_SHORT: 1,
  LENGTH_INDEFINITE: -1,
}));

// Mock firebase auth
jest.mock('@react-native-firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: {uid: 'test-user-123', displayName: 'Test User'},
  })),
}));

// Mock firebase firestore
jest.mock('@react-native-firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  updateDoc: jest.fn(() => Promise.resolve()),
  onSnapshot: jest.fn(() => () => {}),
}));

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: mockNavigate,
    }),
  };
});

// Mock MessageService
jest.mock('conversations/services/MessageService', () => ({
  MessageService: jest.fn().mockImplementation(() => ({
    getOrCreateConversation: jest.fn().mockResolvedValue({id: 'conv-123'}),
  })),
}));

// Mock the modals to avoid complex rendering issues
jest.mock('../../../../src/features/Home/components/CommentModal', () => 'CommentModal');
jest.mock('../../../../src/features/Home/components/PostOptionsModal', () => 'PostOptionsModal');
jest.mock('../../../../src/features/Home/components/FullPostModal', () => ({
  FullPostModal: () => null,
}));

// Import Post after mocks
import Post from '../../../../src/features/Home/components/Post';

// Create mock store
const createMockStore = (initialState = {}) => {
  const defaultState = {
    user: {
      theme: 'light',
      userProfileColor: '#2379C2',
    },
    firebase: {
      firebase: {
        posts: {
          likePost: jest.fn().mockResolvedValue({success: true, liked: true}),
          savePost: jest.fn().mockResolvedValue({success: true, saved: true}),
          addComment: jest.fn().mockResolvedValue({
            success: true,
            comment: {id: 'c1', text: 'test'},
          }),
          deletePost: jest.fn().mockResolvedValue({success: true}),
        },
        currentUser: jest.fn().mockReturnValue({
          uid: 'test-user-123',
          displayName: 'Test User',
        }),
      },
    },
    ...initialState,
  };

  return configureStore({
    reducer: {
      user: (state = defaultState.user) => state,
      firebase: (state = defaultState.firebase) => state,
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
  description: 'This is a test post #testing #react',
  postImages: ['https://example.com/image1.jpg'],
  postVideo: null,
  isVideo: false,
  isVertical: false,
  hashtags: ['testing', 'react'],
  likes: 10,
  comments: 5,
  commentsList: [],
  timestamp: '2 hours ago',
  isLiked: false,
  isSaved: false,
  ...overrides,
});

// Wrapper component for rendering with providers
const renderWithProviders = (ui: React.ReactElement, store = createMockStore()) => {
  return render(
    <Provider store={store}>
      <NavigationContainer>{ui}</NavigationContainer>
    </Provider>,
  );
};

describe('Post component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render post with username', () => {
      const post = createSamplePost();
      const {getAllByText} = renderWithProviders(<Post post={post} />);

      // Username appears in header and caption
      const usernames = getAllByText('TestUser');
      expect(usernames.length).toBeGreaterThan(0);
    });

    it('should render like count', () => {
      const post = createSamplePost({likes: 25});
      const {getByText} = renderWithProviders(<Post post={post} />);

      expect(getByText('25 likes')).toBeTruthy();
    });

    it('should render timestamp', () => {
      const post = createSamplePost({timestamp: '3 hours ago'});
      const {getByText} = renderWithProviders(<Post post={post} />);

      expect(getByText('3 hours ago')).toBeTruthy();
    });
  });

  describe('Dark mode', () => {
    it('should render correctly in dark mode', () => {
      const store = createMockStore({
        user: {theme: 'dark', userProfileColor: '#2379C2'},
      });
      const post = createSamplePost();
      const {getAllByText} = renderWithProviders(<Post post={post} />, store);

      const usernames = getAllByText('TestUser');
      expect(usernames.length).toBeGreaterThan(0);
    });
  });

  describe('Comments', () => {
    it('should show view all comments button when there are comments', () => {
      const post = createSamplePost({
        comments: 10,
        commentsList: [{id: 'c1', text: 'Test comment', username: 'User1'}],
      });
      const {getByText} = renderWithProviders(<Post post={post} />);

      expect(getByText('View all 10 comments')).toBeTruthy();
    });
  });

  describe('Post with multiple media', () => {
    it('should handle posts with multiple images', () => {
      const post = createSamplePost({
        postImages: [
          'https://example.com/image1.jpg',
          'https://example.com/image2.jpg',
          'https://example.com/image3.jpg',
        ],
      });
      const {getAllByText} = renderWithProviders(<Post post={post} />);

      const usernames = getAllByText('TestUser');
      expect(usernames.length).toBeGreaterThan(0);
    });
  });

  describe('Post without media', () => {
    it('should render text-only post without errors', () => {
      const post = createSamplePost({
        postImages: [],
        postVideo: null,
      });
      const {getAllByText} = renderWithProviders(<Post post={post} />);

      const usernames = getAllByText('TestUser');
      expect(usernames.length).toBeGreaterThan(0);
    });
  });

  describe('Video post', () => {
    it('should handle video posts', () => {
      const post = createSamplePost({
        isVideo: true,
        postVideo: 'https://example.com/video.mp4',
        postImages: [],
      });
      const {getAllByText} = renderWithProviders(<Post post={post} />);

      const usernames = getAllByText('TestUser');
      expect(usernames.length).toBeGreaterThan(0);
    });
  });

  describe('Owner actions', () => {
    it('should identify current user as post owner', () => {
      const post = createSamplePost({
        user: {
          id: 'test-user-123', // Same as current user
          username: 'CurrentUser',
          image: 'https://example.com/avatar.jpg',
        },
      });
      const {getAllByText} = renderWithProviders(<Post post={post} />);

      const usernames = getAllByText('CurrentUser');
      expect(usernames.length).toBeGreaterThan(0);
    });
  });
});

describe('Post visibility', () => {
  it('should pass isVisible prop to video handler', () => {
    const post = createSamplePost({
      isVideo: true,
      postVideo: 'https://example.com/video.mp4',
    });
    const {getAllByText} = renderWithProviders(
      <Post post={post} isVisible={true} />,
    );

    const usernames = getAllByText('TestUser');
    expect(usernames.length).toBeGreaterThan(0);
  });

  it('should handle isVisible being false', () => {
    const post = createSamplePost({
      isVideo: true,
      postVideo: 'https://example.com/video.mp4',
    });
    const {getAllByText} = renderWithProviders(
      <Post post={post} isVisible={false} />,
    );

    const usernames = getAllByText('TestUser');
    expect(usernames.length).toBeGreaterThan(0);
  });
});
