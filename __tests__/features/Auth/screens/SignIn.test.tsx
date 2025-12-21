import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import SignIn from '../../../../src/features/Auth/screens/SignIn';
import Snackbar from 'react-native-snackbar';

// --- Mocks ---

// 1. Navigation
const mockNavigate = jest.fn();
const mockGetParent = jest.fn(() => ({
    navigate: mockNavigate,
}));

jest.mock('@react-navigation/native', () => ({
    useNavigation: () => ({
        navigate: mockNavigate,
        getParent: mockGetParent,
    }),
}));

// 2. Redux Hooks
const mockDispatch = jest.fn();
jest.mock('hooks/redux/useTypedDispatch', () => ({
    useTypedDispatch: () => mockDispatch,
}));

// Mock Firebase Object
const mockFirebase = {
    auth: {
        googleSignIn: jest.fn(),
        githubSignIn: jest.fn(),
        loginWithEmailAndPassword: jest.fn(),
        sendPasswordResetEmail: jest.fn(),
    },
    user: {
        checkUsernameOrEmailRegistered: jest.fn(),
    },
};

jest.mock('hooks/redux/useTypedSelector', () => ({
    useTypedSelector: (selector: any) =>
        selector({
            user: { theme: 'light' },
            firebase: { firebase: mockFirebase },
        }),
}));

// 3. External Libraries
jest.mock('react-native-snackbar', () => ({
    show: jest.fn(),
    LENGTH_LONG: 0,
}));

jest.mock('react-native-vector-icons/Feather', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('react-native-bouncy-checkbox', () => 'Checkbox');

// Mock OAuthButton to add testID for easier testing
jest.mock('auth/components/OAuthButton', () => {
    const { View, TouchableOpacity, Image } = require('react-native');
    return ({ handleOAuthSignIn, isOAuthLoading, isSubmitting, oauthImage, isGitHub }: any) => (
        <View>
            <TouchableOpacity
                testID={isGitHub ? 'github-oauth-button' : 'google-oauth-button'}
                disabled={isOAuthLoading || isSubmitting}
                onPress={handleOAuthSignIn}>
                <Image source={oauthImage} />
            </TouchableOpacity>
        </View>
    );
});

// Mock Image from react-native-elements to avoid loading issues
jest.mock('react-native-elements', () => {
    const actual = jest.requireActual('react-native-elements');
    return {
        ...actual,
        Image: 'Image',
    };
});

describe('SignIn Screen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders correctly', () => {
        const { getByPlaceholderText, getByText } = render(<SignIn />);

        expect(getByPlaceholderText('Username or Email')).toBeTruthy();
        expect(getByPlaceholderText('Password')).toBeTruthy();
        expect(getByText('Sign In')).toBeTruthy();
        expect(getByText('Forgot Password?')).toBeTruthy();
    });

    it('shows validation errors for empty submission', async () => {
        const { getByText } = render(<SignIn />);

        fireEvent.press(getByText('Sign In'));

        await waitFor(() => {
            expect(getByText('Username Or Email is required')).toBeTruthy();
            expect(getByText('Password is required')).toBeTruthy();
        });
    });

    it('handles successful sign in', async () => {
        // Setup mocks for success
        mockFirebase.user.checkUsernameOrEmailRegistered.mockResolvedValue({
            success: true,
            email: 'test@example.com',
        });
        mockFirebase.auth.loginWithEmailAndPassword.mockResolvedValue({
            success: true,
        });

        const { getByPlaceholderText, getByText } = render(<SignIn />);

        // Fill form
        fireEvent.changeText(
            getByPlaceholderText('Username or Email'),
            'testuser',
        );
        fireEvent.changeText(getByPlaceholderText('Password'), 'password123');

        // Submit
        fireEvent.press(getByText('Sign In'));

        // Verify logic
        await waitFor(() => {
            expect(
                mockFirebase.user.checkUsernameOrEmailRegistered,
            ).toHaveBeenCalledWith('testuser');
            expect(
                mockFirebase.auth.loginWithEmailAndPassword,
            ).toHaveBeenCalledWith('test@example.com', 'password123');
            expect(mockDispatch).toHaveBeenCalled(); // Should dispatch login action
            expect(mockNavigate).toHaveBeenCalledWith('UserStack');
        });
    });

    it('handles user not found error', async () => {
        // Setup mock for user not found
        mockFirebase.user.checkUsernameOrEmailRegistered.mockResolvedValue({
            success: false,
        });

        const { getByPlaceholderText, getByText } = render(<SignIn />);

        fireEvent.changeText(
            getByPlaceholderText('Username or Email'),
            'unknownuser',
        );
        fireEvent.changeText(getByPlaceholderText('Password'), 'password123');

        fireEvent.press(getByText('Sign In'));

        await waitFor(() => {
            expect(Snackbar.show).toHaveBeenCalledWith(
                expect.objectContaining({
                    text: "User Doesn't Exist",
                }),
            );
        });
    });

    it('handles wrong password error', async () => {
        // Setup mock for user found but wrong password
        mockFirebase.user.checkUsernameOrEmailRegistered.mockResolvedValue({
            success: true,
            email: 'test@example.com',
        });
        mockFirebase.auth.loginWithEmailAndPassword.mockResolvedValue({
            success: false,
            error: 'Wrong password',
        });

        const { getByPlaceholderText, getByText } = render(<SignIn />);

        fireEvent.changeText(
            getByPlaceholderText('Username or Email'),
            'testuser',
        );
        fireEvent.changeText(getByPlaceholderText('Password'), 'wrongpass');

        fireEvent.press(getByText('Sign In'));

        await waitFor(() => {
            expect(Snackbar.show).toHaveBeenCalledWith(
                expect.objectContaining({
                    text: expect.stringContaining('Login Unsuccessful'),
                }),
            );
        });
    });

    it('handles forgot password', async () => {
        mockFirebase.user.checkUsernameOrEmailRegistered.mockResolvedValue({
            success: true,
            email: 'test@example.com',
        });
        mockFirebase.auth.sendPasswordResetEmail.mockResolvedValue({});

        const { getByPlaceholderText, getByText } = render(<SignIn />);

        // Enter email (required for forgot password logic in component)
        fireEvent.changeText(
            getByPlaceholderText('Username or Email'),
            'test@example.com',
        );

        fireEvent.press(getByText('Forgot Password?'));

        await waitFor(() => {
            expect(
                mockFirebase.user.checkUsernameOrEmailRegistered,
            ).toHaveBeenCalledWith('test@example.com');
            expect(mockFirebase.auth.sendPasswordResetEmail).toHaveBeenCalledWith(
                'test@example.com',
            );
            expect(Snackbar.show).toHaveBeenCalledWith(
                expect.objectContaining({
                    text: expect.stringContaining('Password reset'),
                }),
            );
        });
    });

    it('handles google sign in successfully', async () => {
        mockFirebase.auth.googleSignIn.mockResolvedValue({ success: true });

        const { getByTestId } = render(<SignIn />);

        const googleButton = getByTestId('google-oauth-button');
        fireEvent.press(googleButton);

        await waitFor(() => {
            expect(mockFirebase.auth.googleSignIn).toHaveBeenCalled();
            expect(mockDispatch).toHaveBeenCalled();
            expect(mockNavigate).toHaveBeenCalledWith('UserStack');
        });
    });

    it('handles google sign in failure', async () => {
        mockFirebase.auth.googleSignIn.mockResolvedValue({
            success: false,
            error: 'Google sign in failed',
        });

        const { getByTestId } = render(<SignIn />);

        const googleButton = getByTestId('google-oauth-button');
        fireEvent.press(googleButton);

        await waitFor(() => {
            expect(mockFirebase.auth.googleSignIn).toHaveBeenCalled();
            expect(Snackbar.show).toHaveBeenCalledWith(
                expect.objectContaining({
                    text: expect.stringContaining('Login Unsuccessful'),
                }),
            );
        });
    });

    it('handles github sign in successfully', async () => {
        mockFirebase.auth.githubSignIn.mockResolvedValue({ success: true });

        const { getByTestId } = render(<SignIn />);

        const githubButton = getByTestId('github-oauth-button');
        fireEvent.press(githubButton);

        await waitFor(() => {
            expect(mockFirebase.auth.githubSignIn).toHaveBeenCalled();
            expect(mockDispatch).toHaveBeenCalled();
        });
    });

    it('handles github sign in failure', async () => {
        mockFirebase.auth.githubSignIn.mockResolvedValue({
            success: false,
            error: 'GitHub sign in failed',
        });

        const { getByTestId } = render(<SignIn />);

        const githubButton = getByTestId('github-oauth-button');
        fireEvent.press(githubButton);

        await waitFor(() => {
            expect(mockFirebase.auth.githubSignIn).toHaveBeenCalled();
            expect(Snackbar.show).toHaveBeenCalledWith(
                expect.objectContaining({
                    text: expect.stringContaining('Login Unsuccessful'),
                }),
            );
        });
    });

    it('renders OAuth buttons correctly', () => {
        const { getByTestId } = render(<SignIn />);

        expect(getByTestId('google-oauth-button')).toBeTruthy();
        expect(getByTestId('github-oauth-button')).toBeTruthy();
    });
});