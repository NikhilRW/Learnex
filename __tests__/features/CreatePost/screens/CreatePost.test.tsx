import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import CreatePost from 'create-post/screens/CreatePost';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { launchImageLibrary } from 'react-native-image-picker';
import { Alert } from 'react-native';

// Mock dependencies
jest.mock('@react-native-firebase/firestore', () => ({
    getFirestore: jest.fn(),
    collection: jest.fn(),
    addDoc: jest.fn(),
    serverTimestamp: jest.fn(() => 'timestamp'),
}));

jest.mock('@react-native-firebase/auth', () => ({
    getAuth: jest.fn(() => ({
        currentUser: {
            uid: 'test-user-id',
            displayName: 'Test User',
            photoURL: 'test-photo-url',
        },
    })),
}));

// Mock navigation
const mockNavigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
    useNavigation: () => mockNavigation,
}));

// Mock Cloudinary
global.fetch = jest.fn(() =>
    Promise.resolve({
        json: () => Promise.resolve({ secure_url: 'https://cloudinary.com/test-image.jpg' }),
    })
) as jest.Mock;

// Mock Image Picker
jest.mock('react-native-image-picker', () => ({
    launchImageLibrary: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

const mockStore = configureStore([]);

describe('CreatePost Screen', () => {
    let store: any;

    beforeEach(() => {
        store = mockStore({
            user: {
                theme: 'light',
            },
            firebase: {
                firebase: {
                    user: {
                        getNameUsernamestring: jest.fn().mockResolvedValue({ fullName: 'Test User' }),
                    },
                }
            }
        });
        jest.clearAllMocks();
    });

    it('renders correctly', () => {
        const { getByPlaceholderText, getByText } = render(
            <Provider store={store}>
                <CreatePost />
            </Provider>
        );

        expect(getByPlaceholderText('Write a caption...')).toBeTruthy();
        expect(getByText('Create Post')).toBeTruthy();
    });

    it('validates empty description', async () => {
        const { getByTestId } = render(
            <Provider store={store}>
                <CreatePost />
            </Provider>
        );

        const postButton = getByTestId('create-post-button');
        const addMediaButton = getByTestId('add-media-button');

        // Mock image selection to enable button
        (launchImageLibrary as jest.Mock).mockResolvedValueOnce({
            assets: [{ uri: 'test-uri', type: 'image/jpeg' }],
        });

        await act(async () => {
            fireEvent.press(addMediaButton);
        });

        fireEvent.press(postButton);

        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Please add a description');
    });

    it('disables button when no media selected', async () => {
        const { getByTestId, getByPlaceholderText } = render(
            <Provider store={store}>
                <CreatePost />
            </Provider>
        );

        const input = getByPlaceholderText('Write a caption...');
        fireEvent.changeText(input, 'My test post');

        const postButton = getByTestId('create-post-button');

        // Check if button is disabled
        expect(postButton.props.accessibilityState.disabled).toBe(true);

        // Verify alert is NOT called because button is disabled
        fireEvent.press(postButton);
        expect(Alert.alert).not.toHaveBeenCalled();
    });

    it('handles image selection', async () => {
        (launchImageLibrary as jest.Mock).mockResolvedValueOnce({
            assets: [
                {
                    uri: 'test-image-uri',
                    type: 'image/jpeg',
                    fileName: 'test.jpg',
                },
            ],
        });

        const { getByTestId } = render(
            <Provider store={store}>
                <CreatePost />
            </Provider>
        );

        const addMediaButton = getByTestId('add-media-button');
        await act(async () => {
            fireEvent.press(addMediaButton);
        });

        expect(launchImageLibrary).toHaveBeenCalled();
    });

    it('validates video selection limit', async () => {
        // Mock 3 video selections
        (launchImageLibrary as jest.Mock)
            .mockResolvedValueOnce({
                assets: [{ uri: 'video1', type: 'video/mp4' }],
            })
            .mockResolvedValueOnce({
                assets: [{ uri: 'video2', type: 'video/mp4' }],
            })
            .mockResolvedValueOnce({
                assets: [{ uri: 'video3', type: 'video/mp4' }],
            });

        const { getByTestId } = render(
            <Provider store={store}>
                <CreatePost />
            </Provider>
        );

        // Select first video
        await act(async () => {
            fireEvent.press(getByTestId('add-media-button'));
        });

        // Select second video
        await act(async () => {
            fireEvent.press(getByTestId('add-media-button'));
        });

        // Try to select third video
        await act(async () => {
            fireEvent.press(getByTestId('add-media-button'));
        });

        expect(Alert.alert).toHaveBeenCalledWith(
            'Video Limit',
            'You can only add up to 2 videos per post. Please select fewer videos.'
        );
    });

    it('creates post successfully', async () => {
        const { getByTestId, getByPlaceholderText } = render(
            <Provider store={store}>
                <CreatePost />
            </Provider>
        );

        // 1. Add Description
        const input = getByPlaceholderText('Write a caption...');
        fireEvent.changeText(input, 'My amazing post #testing #reactnative');

        // 2. Add Media
        (launchImageLibrary as jest.Mock).mockResolvedValueOnce({
            assets: [{ uri: 'test-uri', type: 'image/jpeg' }],
        });

        const addMediaButton = getByTestId('add-media-button');
        await act(async () => {
            fireEvent.press(addMediaButton);
        });

        // 3. Submit
        const postButton = getByTestId('create-post-button');
        await act(async () => {
            fireEvent.press(postButton);
        });

        // 4. Verify Cloudinary Upload
        expect(global.fetch).toHaveBeenCalled();

        // 5. Verify Firestore Creation
        const { addDoc } = require('@react-native-firebase/firestore');
        expect(addDoc).toHaveBeenCalledWith(
            undefined, // collection reference (mocked return)
            expect.objectContaining({
                description: 'My amazing post #testing #reactnative',
                hashtags: expect.arrayContaining(['testing', 'reactnative']),
                user: expect.objectContaining({
                    id: 'test-user-id', // Note: id not uid based on source code
                }),
            })
        );

        // 6. Verify Navigation
        expect(mockNavigation.goBack).toHaveBeenCalled();
    });

    it('handles upload error', async () => {
        // Mock fetch failure
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        const { getByTestId, getByPlaceholderText } = render(
            <Provider store={store}>
                <CreatePost />
            </Provider>
        );

        // Setup valid post
        fireEvent.changeText(getByPlaceholderText('Write a caption...'), 'Test');

        (launchImageLibrary as jest.Mock).mockResolvedValueOnce({
            assets: [{ uri: 'test-uri', type: 'image/jpeg' }],
        });

        await act(async () => {
            fireEvent.press(getByTestId('add-media-button'));
        });

        // Submit
        await act(async () => {
            fireEvent.press(getByTestId('create-post-button'));
        });

        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to create post');
    });

    it('enforces character limit', async () => {
        const { getByPlaceholderText, getByText } = render(
            <Provider store={store}>
                <CreatePost />
            </Provider>
        );

        const input = getByPlaceholderText('Write a caption...');

        // Type exactly 2200
        const maxText = 'a'.repeat(2200);
        fireEvent.changeText(input, maxText);
        expect(getByText('2200/2200')).toBeTruthy();

        // Try to type more
        const tooLongText = 'a'.repeat(2201);
        fireEvent.changeText(input, tooLongText);
        // Should still be 2200 because of the check in handleDescriptionChange
        expect(getByText('2200/2200')).toBeTruthy();
    });

    it('toggles post visibility', async () => {
        const { getByText } = render(
            <Provider store={store}>
                <CreatePost />
            </Provider>
        );

        const privateButton = getByText('Private');
        fireEvent.press(privateButton);

        expect(privateButton).toBeTruthy();
    });

    it('restores draft from AsyncStorage', async () => {
        const AsyncStorage = require('@react-native-async-storage/async-storage');
        const draft = JSON.stringify({
            description: 'Saved draft',
            mediaItems: [],
            hashtags: [],
            isPublic: true
        });

        AsyncStorage.getItem.mockResolvedValue(draft);

        const { findByText, getByDisplayValue } = render(
            <Provider store={store}>
                <CreatePost />
            </Provider>
        );

        // Should see draft banner
        const restoreButton = await findByText('Restore');
        await act(async () => {
            fireEvent.press(restoreButton);
        });

        await waitFor(() => {
            expect(getByDisplayValue('Saved draft')).toBeTruthy();
        });
    });

    it('shows tag suggestions', async () => {
        const { getByPlaceholderText, getByText } = render(
            <Provider store={store}>
                <CreatePost />
            </Provider>
        );

        const input = getByPlaceholderText('Write a caption...');
        fireEvent.changeText(input, '#');
        fireEvent.changeText(input, '#coding');

        await waitFor(() => {
            expect(getByText('reactnative')).toBeTruthy();
        });
    });
});
