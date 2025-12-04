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

jest.mock('react-native-image-picker', () => ({
    launchImageLibrary: jest.fn(),
}));

jest.mock('react-native-config', () => ({
    CLOUDINARY_CLOUD_NAME: 'test-cloud',
}));

// Mock navigation
const mockNavigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
    useNavigation: () => mockNavigation,
}));

// Mock global fetch for Cloudinary
global.fetch = jest.fn();

// Mock Alert
jest.spyOn(Alert, 'alert');

const mockStore = configureStore([]);

describe('CreatePost Screen', () => {
    let store: any;

    beforeEach(() => {
        store = mockStore({
            firebase: {
                firebase: {
                    user: {
                        getNameUsernamestring: jest.fn().mockResolvedValue({ fullName: 'Test User' }),
                    },
                },
            },
            user: {
                theme: 'light',
            },
        });

        jest.clearAllMocks();
        (global.fetch as jest.Mock).mockResolvedValue({
            json: async () => ({ secure_url: 'https://cloudinary.com/test-image.jpg' }),
        });
    });

    it('renders correctly', () => {
        const { getByPlaceholderText, getByText, getByTestId } = render(
            <Provider store={store}>
                <CreatePost />
            </Provider>
        );

        expect(getByPlaceholderText('Write a caption...')).toBeTruthy();
        expect(getByTestId('add-media-button')).toBeTruthy();
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
                    uri: 'file://test-image.jpg',
                    type: 'image/jpeg',
                    fileSize: 1024,
                    width: 1000,
                    height: 800,
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

    it('handles video selection limit', async () => {
        // Mock selecting 3 videos (limit is 2)
        (launchImageLibrary as jest.Mock).mockResolvedValueOnce({
            assets: [
                { uri: 'video1.mp4', type: 'video/mp4', fileSize: 1000 },
                { uri: 'video2.mp4', type: 'video/mp4', fileSize: 1000 },
                { uri: 'video3.mp4', type: 'video/mp4', fileSize: 1000 },
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

        expect(Alert.alert).toHaveBeenCalledWith(
            'Video Limit',
            expect.stringContaining('You can only add up to 2 videos')
        );
    });

    it('uploads media and creates post successfully', async () => {
        // 1. Select Media
        (launchImageLibrary as jest.Mock).mockResolvedValueOnce({
            assets: [
                {
                    uri: 'file://test-image.jpg',
                    type: 'image/jpeg',
                    fileSize: 1024,
                    width: 1000,
                    height: 800,
                },
            ],
        });

        const { getByText, getByPlaceholderText, getByTestId } = render(
            <Provider store={store}>
                <CreatePost />
            </Provider>
        );

        await act(async () => {
            fireEvent.press(getByTestId('add-media-button'));
        });

        // 2. Enter Description
        const input = getByPlaceholderText('Write a caption...');
        fireEvent.changeText(input, 'My amazing post #testing #reactnative');

        // 3. Submit
        const postButton = getByTestId('create-post-button');
        await act(async () => {
            fireEvent.press(postButton);
        });

        // 4. Verify Cloudinary Upload
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('cloudinary.com'),
            expect.objectContaining({
                method: 'POST',
                body: expect.any(FormData),
            })
        );

        // 5. Verify Firestore Add
        const { addDoc, collection } = require('@react-native-firebase/firestore');
        expect(collection).toHaveBeenCalled();
        expect(addDoc).toHaveBeenCalledWith(
            undefined, // collection result
            expect.objectContaining({
                description: 'My amazing post #testing #reactnative',
                hashtags: expect.arrayContaining(['testing', 'reactnative']),
                searchKeywords: expect.arrayContaining(['my', 'amazing', 'post', 'testing', 'reactnative']),
                postImages: ['https://cloudinary.com/test-image.jpg'],
                user: expect.objectContaining({
                    id: 'test-user-id',
                }),
            })
        );

        // 6. Verify Navigation
        expect(Alert.alert).toHaveBeenCalledWith('Success', 'Post created successfully!');
        expect(mockNavigation.goBack).toHaveBeenCalled();
    });

    it('handles upload failure', async () => {
        // Mock upload failure
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        (launchImageLibrary as jest.Mock).mockResolvedValueOnce({
            assets: [{ uri: 'file://test.jpg', type: 'image/jpeg', fileSize: 1000 }],
        });

        const { getByText, getByPlaceholderText, getByTestId } = render(
            <Provider store={store}>
                <CreatePost />
            </Provider>
        );

        await act(async () => {
            fireEvent.press(getByTestId('add-media-button'));
        });

        fireEvent.changeText(getByPlaceholderText('Write a caption...'), 'Test');

        await act(async () => {
            fireEvent.press(getByTestId('create-post-button'));
        });

        // Should log error (we can spy on console.error if needed) but mainly not navigate back
        expect(mockNavigation.goBack).not.toHaveBeenCalled();
    });
});
