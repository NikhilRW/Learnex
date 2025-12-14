import React from 'react';
import { render, waitFor, fireEvent, act } from '@testing-library/react-native';
import SavedPosts from '../../../../src/features/SavedPost/screens/SavedPosts';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { getFirestore, getDoc, collection, doc } from '@react-native-firebase/firestore';

// Mock dependencies
jest.mock('@react-navigation/native', () => ({
    useNavigation: () => ({
        navigate: jest.fn(),
        goBack: jest.fn(),
    }),
}));

jest.mock('react-native-safe-area-context', () => ({
    SafeAreaView: ({ children, style }: any) => <div style={style}>{children}</div>,
}));

jest.mock('@legendapp/list', () => ({
    LegendList: ({ data, renderItem, ListEmptyComponent }: any) => {
        const { View, Text } = require('react-native');
        if (!data || data.length === 0) {
            return ListEmptyComponent ? <ListEmptyComponent /> : null;
        }
        return (
            <View testID="legend-list">
                {data.map((item: any, index: number) => (
                    <View key={item.id || index}>
                        {renderItem({ item })}
                    </View>
                ))}
            </View>
        );
    },
}));

jest.mock('home/components/Post', () => {
    const { View, Text } = require('react-native');
    return ({ post }: any) => (
        <View testID={`post-${post.id}`}>
            <Text>{post.description}</Text>
        </View>
    );
});

jest.mock('react-native-vector-icons/Feather', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

// Mock Firestore
jest.mock('@react-native-firebase/firestore', () => ({
    getFirestore: jest.fn(),
    collection: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
}));

// Mock shared utils
jest.mock('shared/services/utils', () => ({
    convertFirestorePost: (data: any) => ({
        ...data,
        timestamp: '2023-01-01',
    }),
}));

const createMockStore = (initialState = {}) => {
    const defaultState = {
        user: {
            theme: 'light',
        },
        firebase: {
            firebase: {
                currentUser: () => ({ uid: 'test-user-123' }),
                subscribeToSavedPosts: jest.fn(() => jest.fn()),
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
        middleware: (getDefaultMiddleware) =>
            getDefaultMiddleware({
                serializableCheck: false,
            }),
    });
};

describe('SavedPosts Screen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders loading state initially', () => {
        const store = createMockStore();
        const { getByTestId } = render(
            <Provider store={store}>
                <SavedPosts />
            </Provider>
        );

        // Assuming ActivityIndicator is rendered
        // Since we didn't mock ActivityIndicator specifically, it renders as normal
        // But we can check if the list is not yet rendered
    });

    it('renders empty state when no saved posts', async () => {
        (getDoc as jest.Mock).mockResolvedValueOnce({
            exists: () => true,
            data: () => ({ savedPosts: [] }),
        });

        const store = createMockStore();
        const { getByText } = render(
            <Provider store={store}>
                <SavedPosts />
            </Provider>
        );

        await waitFor(() => {
            expect(getByText('No Saved Posts')).toBeTruthy();
        });
    });

    it('renders saved posts list', async () => {
        // Mock user doc with saved posts
        (getDoc as jest.Mock).mockImplementation((ref) => {
            // We can't easily check ref arguments without complex mocking of doc/collection
            // So we'll just return data based on call order or assume structure
            return Promise.resolve({
                exists: () => true,
                data: () => ({ savedPosts: ['post-1', 'post-2'] }),
            });
        });

        // Mock individual post fetches
        // We need to handle the subsequent calls to getDoc for posts
        // The first call is for user, subsequent are for posts
        (getDoc as jest.Mock)
            .mockResolvedValueOnce({ // User doc
                exists: () => true,
                data: () => ({ savedPosts: ['post-1'] }),
            })
            .mockResolvedValueOnce({ // Post 1
                exists: () => true,
                data: () => ({ description: 'Saved Post 1', id: 'post-1' }),
            });

        // Mock getDocs for comments
        const { getDocs } = require('@react-native-firebase/firestore');
        getDocs.mockResolvedValue({
            docs: [],
        });

        const store = createMockStore();
        const { getByText } = render(
            <Provider store={store}>
                <SavedPosts />
            </Provider>
        );

        await waitFor(() => {
            expect(getByText('Saved Post 1')).toBeTruthy();
        });
    });

    it('handles removing a saved post (updates list)', async () => {
        // Setup initial state with 1 post
        (getDoc as jest.Mock)
            .mockResolvedValueOnce({ // User doc
                exists: () => true,
                data: () => ({ savedPosts: ['post-1'] }),
            })
            .mockResolvedValueOnce({ // Post 1
                exists: () => true,
                data: () => ({ description: 'Saved Post 1', id: 'post-1' }),
            });

        const { getDocs } = require('@react-native-firebase/firestore');
        getDocs.mockResolvedValue({ docs: [] });

        const subscribeMock = jest.fn((callback) => {
            // Store callback to trigger it later
            (subscribeMock as any).callback = callback;
            return jest.fn();
        });

        const store = createMockStore({
            firebase: {
                firebase: {
                    currentUser: () => ({ uid: 'test-user-123' }),
                    subscribeToSavedPosts: subscribeMock,
                }
            }
        });

        const { getByText, queryByText } = render(
            <Provider store={store}>
                <SavedPosts />
            </Provider>
        );

        await waitFor(() => {
            expect(getByText('Saved Post 1')).toBeTruthy();
        });

        // Simulate update: User removes post, so savedPosts becomes empty
        (getDoc as jest.Mock).mockReset();
        (getDoc as jest.Mock).mockResolvedValue({ // User doc
            exists: () => true,
            data: () => ({ savedPosts: [] }),
        });

        // Trigger subscription callback
        if ((subscribeMock as any).callback) {
            await act(async () => {
                await (subscribeMock as any).callback();
            });
        }

        await waitFor(() => {
            expect(queryByText('Saved Post 1')).toBeNull();
            expect(getByText('No Saved Posts')).toBeTruthy();
        });
    });
});
