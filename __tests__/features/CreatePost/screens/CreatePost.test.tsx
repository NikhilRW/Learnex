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

<<<<<<< HEAD
=======
jest.mock('react-native-image-picker', () => ({
    launchImageLibrary: jest.fn(),
}));

jest.mock('react-native-config', () => ({
    CLOUDINARY_CLOUD_NAME: 'test-cloud',
}));

>>>>>>> day_04_tests
// Mock navigation
const mockNavigation = {
    goBack: jest.fn(),
    navigate: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
    useNavigation: () => mockNavigation,
}));

<<<<<<< HEAD
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
=======
// Mock global fetch for Cloudinary
global.fetch = jest.fn();
>>>>>>> day_04_tests

// Mock Alert
jest.spyOn(Alert, 'alert');

const mockStore = configureStore([]);

describe('CreatePost Screen', () => {
    let store: any;

    beforeEach(() => {
        store = mockStore({
<<<<<<< HEAD
            user: {
                theme: 'light',
            },
=======
>>>>>>> day_04_tests
            firebase: {
                firebase: {
                    user: {
                        getNameUsernamestring: jest.fn().mockResolvedValue({ fullName: 'Test User' }),
                    },
<<<<<<< HEAD
                }
            }
        });
        jest.clearAllMocks();
    });

    it('renders correctly', () => {
        const { getByPlaceholderText, getByText } = render(
=======
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
>>>>>>> day_04_tests
            <Provider store={store}>
                <CreatePost />
            </Provider>
        );

        expect(getByPlaceholderText('Write a caption...')).toBeTruthy();
<<<<<<< HEAD
=======
        expect(getByTestId('add-media-button')).toBeTruthy();
>>>>>>> day_04_tests
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
<<<<<<< HEAD
                    uri: 'test-image-uri',
                    type: 'image/jpeg',
                    fileName: 'test.jpg',
=======
                    uri: 'file://test-image.jpg',
                    type: 'image/jpeg',
                    fileSize: 1024,
                    width: 1000,
                    height: 800,
>>>>>>> day_04_tests
                },
            ],
        });

        const { getByTestId } = render(
            <Provider store={store}>
                <CreatePost />
            </Provider>
        );

        const addMediaButton = getByTestId('add-media-button');
<<<<<<< HEAD

=======
>>>>>>> day_04_tests
        await act(async () => {
            fireEvent.press(addMediaButton);
        });

        expect(launchImageLibrary).toHaveBeenCalled();
    });

<<<<<<< HEAD
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
=======
    it('handles video selection limit', async () => {
        // Mock selecting 3 videos (limit is 2)
        (launchImageLibrary as jest.Mock).mockResolvedValueOnce({
            assets: [
                { uri: 'video1.mp4', type: 'video/mp4', fileSize: 1000 },
                { uri: 'video2.mp4', type: 'video/mp4', fileSize: 1000 },
                { uri: 'video3.mp4', type: 'video/mp4', fileSize: 1000 },
            ],
        });
>>>>>>> day_04_tests

        const { getByTestId } = render(
            <Provider store={store}>
                <CreatePost />
            </Provider>
        );

<<<<<<< HEAD
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
=======
        const addMediaButton = getByTestId('add-media-button');
        await act(async () => {
            fireEvent.press(addMediaButton);
>>>>>>> day_04_tests
        });

        expect(Alert.alert).toHaveBeenCalledWith(
            'Video Limit',
<<<<<<< HEAD
            'You can only add up to 2 videos per post. Please select fewer videos.'
        );
    });

    it('creates post successfully', async () => {
        const { getByTestId, getByPlaceholderText } = render(
=======
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
>>>>>>> day_04_tests
            <Provider store={store}>
                <CreatePost />
            </Provider>
        );

<<<<<<< HEAD
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

=======
        await act(async () => {
            fireEvent.press(getByTestId('add-media-button'));
        });

        // 2. Enter Description
        const input = getByPlaceholderText('Write a caption...');
        fireEvent.changeText(input, 'My amazing post #testing #reactnative');

>>>>>>> day_04_tests
        // 3. Submit
        const postButton = getByTestId('create-post-button');
        await act(async () => {
            fireEvent.press(postButton);
        });

        // 4. Verify Cloudinary Upload
<<<<<<< HEAD
        expect(global.fetch).toHaveBeenCalled();

        // 5. Verify Firestore Creation
        const { addDoc, collection } = require('@react-native-firebase/firestore');
        expect(addDoc).toHaveBeenCalledWith(
            undefined, // collection reference (mocked return)
            expect.objectContaining({
                description: 'My amazing post #testing #reactnative',
                hashtags: expect.arrayContaining(['testing', 'reactnative']),
                user: expect.objectContaining({
                    id: 'test-user-id', // Note: id not uid based on source code
=======
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
>>>>>>> day_04_tests
                }),
            })
        );

        // 6. Verify Navigation
<<<<<<< HEAD
        expect(mockNavigation.goBack).toHaveBeenCalled();
    });

    it('handles upload error', async () => {
        // Mock fetch failure
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

        const { getByTestId, getByPlaceholderText } = render(
=======
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
>>>>>>> day_04_tests
            <Provider store={store}>
                <CreatePost />
            </Provider>
        );

<<<<<<< HEAD
        // Setup valid post
        fireEvent.changeText(getByPlaceholderText('Write a caption...'), 'Test');

        (launchImageLibrary as jest.Mock).mockResolvedValueOnce({
            assets: [{ uri: 'test-uri', type: 'image/jpeg' }],
        });

=======
>>>>>>> day_04_tests
        await act(async () => {
            fireEvent.press(getByTestId('add-media-button'));
        });

<<<<<<< HEAD
        // Submit
=======
        fireEvent.changeText(getByPlaceholderText('Write a caption...'), 'Test');

>>>>>>> day_04_tests
        await act(async () => {
            fireEvent.press(getByTestId('create-post-button'));
        });

<<<<<<< HEAD
        expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to create post');
=======
        // Should log error (we can spy on console.error if needed) but mainly not navigate back
        expect(mockNavigation.goBack).not.toHaveBeenCalled();
>>>>>>> day_04_tests
    });
});
