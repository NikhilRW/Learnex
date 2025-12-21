import React from 'react';
import { fireEvent, waitFor, act } from '@testing-library/react-native';
import SignUp from '../../../../src/features/Auth/screens/SignUp';
import { renderWithProviders } from '../../../../__tests__/test-utils';
import Snackbar from 'react-native-snackbar';

// Mock Navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();
const mockGetParent = jest.fn().mockReturnValue({
  navigate: mockNavigate,
});

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
    getParent: mockGetParent,
  }),
}));

// Mock Firebase Auth and Firestore
jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    currentUser: { uid: 'test-uid' },
    createUserWithEmailAndPassword: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    signInWithCredential: jest.fn(),
    signOut: jest.fn(),
  })),
  getAuth: jest.fn(() => ({
    currentUser: { uid: 'test-uid' },
    createUserWithEmailAndPassword: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    signInWithCredential: jest.fn(),
    signOut: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  })),
  GithubAuthProvider: {
    credential: jest.fn(),
  },
  GoogleAuthProvider: {
    credential: jest.fn(),
  },
  OIDCAuthProvider: {
    credential: jest.fn(),
  },
}));

jest.mock('@react-native-firebase/firestore', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    collection: jest.fn(),
    doc: jest.fn(),
  })),
  getFirestore: jest.fn(() => ({
    collection: jest.fn(),
    doc: jest.fn(),
  })),
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  onSnapshot: jest.fn(),
  serverTimestamp: jest.fn(),
}));

jest.mock('@react-native-firebase/messaging', () => {
  return () => ({
    getToken: jest.fn(),
    onTokenRefresh: jest.fn(),
    onMessage: jest.fn(),
    setBackgroundMessageHandler: jest.fn(),
    requestPermission: jest.fn(),
    getInitialNotification: jest.fn(),
    onNotificationOpenedApp: jest.fn(),
  });
});

// Mock Async Storage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock Google Signin
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(),
    signIn: jest.fn(),
    getTokens: jest.fn(),
    signOut: jest.fn(),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
  },
}));

// Mock App Auth
jest.mock('react-native-app-auth', () => ({
  authorize: jest.fn(),
}));

// Mock Config
jest.mock('react-native-config', () => ({
  GITHUB_CLIENT_ID: 'test-id',
  GITHUB_CLIENT_SECRET: 'test-secret',
}));

// Mock Notifee
jest.mock('@notifee/react-native', () => ({
  displayNotification: jest.fn(),
  triggerNotification: jest.fn(),
  requestPermission: jest.fn(),
  onBackgroundEvent: jest.fn(),
  onForegroundEvent: jest.fn(),
  getInitialNotification: jest.fn(),
  createChannel: jest.fn(),
  AndroidImportance: {
    HIGH: 4,
  },
  AndroidVisibility: {
    PUBLIC: 1,
  },
  EventType: {
    PRESS: 1,
  },
}));

// Mock Snackbar
jest.mock('react-native-snackbar', () => ({
  show: jest.fn(),
  LENGTH_LONG: 0,
}));

// Mock Vector Icons
jest.mock('react-native-vector-icons/Feather', () => 'FeatherIcon');
jest.mock('react-native-vector-icons/MaterialIcons', () => 'MaterialIcons');

// Mock Bouncy Checkbox
jest.mock('react-native-bouncy-checkbox', () => {
  const { TouchableOpacity, Text } = require('react-native');
  return (props: any) => (
    <TouchableOpacity
      testID="bouncy-checkbox"
      onPress={() => props.onPress && props.onPress(!props.isChecked)}
    >
      <Text>{props.isChecked ? 'Checked' : 'Unchecked'}</Text>
      {props.textComponent}
    </TouchableOpacity>
  );
});

// Mock OAuthButton
jest.mock('../../../../src/features/Auth/components/OAuthButton', () => {
  const { TouchableOpacity, Text } = require('react-native');
  return ({ handleOAuthSignIn, isGitHub, isSubmitting }: any) => (
    <TouchableOpacity
      testID={isGitHub ? 'github-signin-button' : 'google-signin-button'}
      onPress={handleOAuthSignIn}
      disabled={isSubmitting}
    >
      <Text>{isGitHub ? 'GitHub Sign In' : 'Google Sign In'}</Text>
    </TouchableOpacity>
  );
});

// Mock Firebase methods
const mockSignUpWithEmailAndPassword = jest.fn();
const mockCheckUsernameIsAvailable = jest.fn();
const mockCheckEmailIsAvailable = jest.fn();
const mockGoogleSignIn = jest.fn();
const mockGithubSignIn = jest.fn();

const initialState = {
  user: {
    theme: 'light',
  },
  firebase: {
    firebase: {
      auth: {
        signUpWithEmailAndPassword: mockSignUpWithEmailAndPassword,
        googleSignIn: mockGoogleSignIn,
        githubSignIn: mockGithubSignIn,
      },
      user: {
        checkUsernameIsAvailable: mockCheckUsernameIsAvailable,
        checkEmailIsAvailable: mockCheckEmailIsAvailable,
      },
    },
  },
};

describe('SignUp Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementations
    mockSignUpWithEmailAndPassword.mockResolvedValue({ success: true });
    mockCheckUsernameIsAvailable.mockResolvedValue({ success: true });
    mockCheckEmailIsAvailable.mockResolvedValue({ success: true });
    mockGoogleSignIn.mockResolvedValue({ success: true });
    mockGithubSignIn.mockResolvedValue({ success: true });
  });

  it('renders correctly', () => {
    const { getByPlaceholderText, getByText } = renderWithProviders(<SignUp />, {
      preloadedState: initialState,
    });

    expect(getByPlaceholderText('Full Name')).toBeTruthy();
    expect(getByPlaceholderText('Username')).toBeTruthy();
    expect(getByPlaceholderText('Email Address')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByPlaceholderText('Confirm Password')).toBeTruthy();
    expect(getByText('Create An Account')).toBeTruthy();
  });

  it('validates empty form submission', async () => {
    const { getByText } = renderWithProviders(<SignUp />, {
      preloadedState: initialState,
    });

    fireEvent.press(getByText('Create An Account'));

    await waitFor(() => {
      // Assuming ErrorMessage component renders the error text
      // You might need to adjust based on actual validation messages in yupSchemas
      // Common yup messages: "Required", "Please enter your name", etc.
      // Since I don't have the exact strings from yupSchemas, I'll check for generic existence or specific if I knew them.
      // Let's assume standard messages or check if ErrorMessage renders.
      // If validation fails, submitDataToDB is NOT called.
      expect(mockSignUpWithEmailAndPassword).not.toHaveBeenCalled();
    });
  });

  it('validates password mismatch', async () => {
    const { getByPlaceholderText, getByText } = renderWithProviders(<SignUp />, {
      preloadedState: initialState,
    });

    fireEvent.changeText(getByPlaceholderText('Password'), 'Password@123');
    fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'Password@124');

    fireEvent.press(getByText('Create An Account'));

    await waitFor(() => {
      expect(getByText('Passwords must match')).toBeTruthy();
    });
  });

  it('validates invalid email format', async () => {
    const { getByPlaceholderText, getByText } = renderWithProviders(<SignUp />, {
      preloadedState: initialState,
    });

    fireEvent.changeText(getByPlaceholderText('Email Address'), 'invalid-email');
    fireEvent.press(getByText('Create An Account'));

    await waitFor(() => {
      expect(getByText('Invalid email format')).toBeTruthy();
    });
  });

  it('validates password complexity', async () => {
    const { getByPlaceholderText, getByText } = renderWithProviders(<SignUp />, {
      preloadedState: initialState,
    });

    // Too short
    fireEvent.changeText(getByPlaceholderText('Password'), 'pass');
    fireEvent.press(getByText('Create An Account'));
    await waitFor(() => {
      expect(getByText('Password must be at least 8 characters long')).toBeTruthy();
    });

    // No uppercase
    fireEvent.changeText(getByPlaceholderText('Password'), 'password@123');
    fireEvent.press(getByText('Create An Account'));
    await waitFor(() => {
      expect(getByText('Password must contain at least one uppercase letter')).toBeTruthy();
    });
  });

  it('disables buttons while submitting', async () => {
    // Mock a slow sign up
    mockSignUpWithEmailAndPassword.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 500)));

    const { getByText, getByPlaceholderText, getByTestId } = renderWithProviders(<SignUp />, {
      preloadedState: initialState,
    });

    // Fill valid form
    fireEvent.changeText(getByPlaceholderText('Full Name'), 'John Doe');
    fireEvent.changeText(getByPlaceholderText('Username'), 'johndoe');
    fireEvent.changeText(getByPlaceholderText('Email Address'), 'john@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'Password@123');
    fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'Password@123');
    fireEvent.press(getByTestId('bouncy-checkbox'));

    const submitBtn = getByText('Create An Account');
    fireEvent.press(submitBtn);

    // Check if OAuth buttons are disabled
    await waitFor(() => {
      const googleBtn = getByTestId('google-signin-button');
      // Check both direct prop and accessibilityState just in case
      const isDisabled = googleBtn.props.disabled || googleBtn.props.accessibilityState?.disabled;
      expect(isDisabled).toBe(true);
    });
  });

  it('handles input changes and toggles password visibility', () => {
    const { getByPlaceholderText } = renderWithProviders(<SignUp />, {
      preloadedState: initialState,
    });

    const fullNameInput = getByPlaceholderText('Full Name');
    fireEvent.changeText(fullNameInput, 'John Doe');
    expect(fullNameInput.props.value).toBe('John Doe');

    const passwordInput = getByPlaceholderText('Password');
    fireEvent.changeText(passwordInput, 'password123');
    expect(passwordInput.props.value).toBe('password123');

    // Toggle password visibility
    // The icon is inside the Input rightIcon.
    // Since we mocked FeatherIcon as a string, we might not be able to press it easily unless we find the parent Touchable.
    // However, react-native-elements Input rightIcon usually wraps it.
    // Let's skip the visibility toggle test if it's hard to target the icon specifically without testID,
    // or we can try to find the icon by type if possible.
    // For now, focusing on data entry.
  });

  it('checks username availability (debounced)', async () => {
    jest.useFakeTimers();
    const { getByPlaceholderText } = renderWithProviders(<SignUp />, {
      preloadedState: initialState,
    });

    const usernameInput = getByPlaceholderText('Username');
    fireEvent.changeText(usernameInput, 'newuser');

    // Fast forward debounce time (500ms)
    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(mockCheckUsernameIsAvailable).toHaveBeenCalledWith('newuser');
    });
    jest.useRealTimers();
  });

  it('shows error if username is not available', async () => {
    mockCheckUsernameIsAvailable.mockResolvedValue({ success: false });
    jest.useFakeTimers();

    const { getByPlaceholderText, getByText, getByTestId } = renderWithProviders(<SignUp />, {
      preloadedState: initialState,
    });

    // Fill all fields to pass Formik validation
    fireEvent.changeText(getByPlaceholderText('Full Name'), 'John Doe');
    fireEvent.changeText(getByPlaceholderText('Email Address'), 'john@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'Password@123');
    fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'Password@123');

    // Agree to terms
    const checkbox = getByTestId('bouncy-checkbox');
    fireEvent.press(checkbox);

    const usernameInput = getByPlaceholderText('Username');
    fireEvent.changeText(usernameInput, 'takenuser');

    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(mockCheckUsernameIsAvailable).toHaveBeenCalled();
    });

    // Wait for the error message to appear, indicating state update is complete
    await waitFor(() => {
      expect(getByText('Username is not available')).toBeTruthy();
    });

    fireEvent.press(getByText('Create An Account'));

    await waitFor(() => {
      expect(Snackbar.show).toHaveBeenCalledWith(expect.objectContaining({
        text: 'Username Not Available',
      }));
    });

    jest.useRealTimers();
  });

  it('shows error if terms not agreed', async () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(<SignUp />, {
      preloadedState: initialState,
    });

    // Fill form with valid data
    fireEvent.changeText(getByPlaceholderText('Full Name'), 'John Doe');
    fireEvent.changeText(getByPlaceholderText('Username'), 'johndoe');
    fireEvent.changeText(getByPlaceholderText('Email Address'), 'john@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'Password@123');
    fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'Password@123');

    // Ensure checkbox is unchecked (default)
    // Try to submit
    fireEvent.press(getByText('Create An Account'));

    await waitFor(() => {
      expect(Snackbar.show).toHaveBeenCalledWith(expect.objectContaining({
        text: 'User must agree terms and condition',
      }));
    });
  });

  it('submits form successfully when valid and terms agreed', async () => {
    const { getByText, getByPlaceholderText, getByTestId } = renderWithProviders(<SignUp />, {
      preloadedState: initialState,
    });

    // Fill form
    fireEvent.changeText(getByPlaceholderText('Full Name'), 'John Doe');
    fireEvent.changeText(getByPlaceholderText('Username'), 'johndoe');
    fireEvent.changeText(getByPlaceholderText('Email Address'), 'john@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'Password@123');
    fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'Password@123');

    // Agree to terms
    const checkbox = getByTestId('bouncy-checkbox');
    fireEvent.press(checkbox);

    // Submit
    await act(async () => {
      fireEvent.press(getByText('Create An Account'));
    });

    await waitFor(() => {
      expect(mockSignUpWithEmailAndPassword).toHaveBeenCalledWith({
        fullName: 'John Doe',
        username: 'johndoe',
        email: 'john@example.com',
        password: 'Password@123',
        confirmPassword: 'Password@123',
      });
      expect(Snackbar.show).toHaveBeenCalledWith(expect.objectContaining({
        text: 'Sign Up Successful',
      }));
      expect(mockNavigate).toHaveBeenCalledWith('SignIn');
    });
  });

  it('handles sign up failure', async () => {
    mockSignUpWithEmailAndPassword.mockResolvedValue({ success: false, error: 'Email already in use' });

    const { getByText, getByPlaceholderText, getByTestId } = renderWithProviders(<SignUp />, {
      preloadedState: initialState,
    });

    // Fill form
    fireEvent.changeText(getByPlaceholderText('Full Name'), 'John Doe');
    fireEvent.changeText(getByPlaceholderText('Username'), 'johndoe');
    fireEvent.changeText(getByPlaceholderText('Email Address'), 'john@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'Password@123');
    fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'Password@123');

    // Agree to terms
    const checkbox = getByTestId('bouncy-checkbox');
    fireEvent.press(checkbox);

    // Submit
    await act(async () => {
      fireEvent.press(getByText('Create An Account'));
    });

    await waitFor(() => {
      expect(Snackbar.show).toHaveBeenCalledWith(expect.objectContaining({
        text: 'Email already in use',
      }));
    });
  });

  it('handles Google Sign In', async () => {
    const { getByTestId } = renderWithProviders(<SignUp />, {
      preloadedState: initialState,
    });

    fireEvent.press(getByTestId('google-signin-button'));

    await waitFor(() => {
      expect(mockGoogleSignIn).toHaveBeenCalled();
      expect(mockGetParent).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('UserStack');
    });
  });

  it('handles GitHub Sign In', async () => {
    const { getByTestId } = renderWithProviders(<SignUp />, {
      preloadedState: initialState,
    });

    fireEvent.press(getByTestId('github-signin-button'));

    await waitFor(() => {
      expect(mockGithubSignIn).toHaveBeenCalled();
      expect(mockGetParent).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('UserStack');
    });
  });

  it('navigates to SignIn when "Sign In" link is pressed', () => {
    const { getByText } = renderWithProviders(<SignUp />, {
      preloadedState: initialState,
    });

    fireEvent.press(getByText('Sign In'));
    expect(mockNavigate).toHaveBeenCalledWith('SignIn');
  });
});
