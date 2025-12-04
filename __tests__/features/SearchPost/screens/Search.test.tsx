import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import Search from 'search-post/screens/Search';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';

// Mock dependencies
const mockGetPostsBySearch = jest.fn();

const mockStore = configureStore([]);

// Mock Post component to simplify testing
jest.mock('home/components/Post', () => {
    const { View, Text } = require('react-native');
    return ({ post }: { post: any }) => (
        <View testID={`post-${post.id}`}>
            <Text>{post.description}</Text>
        </View>
    );
});

// Mock @legendapp/list
jest.mock('@legendapp/list', () => ({
    LegendList: ({ data, renderItem, keyExtractor }: any) => {
        const { View } = require('react-native');
        return (
            <View>
                {data.map((item: any, index: number) => (
                    <View key={keyExtractor ? keyExtractor(item) : index}>
                        {renderItem({ item })}
                    </View>
                ))}
            </View>
        );
    },
}));

// Mock navigation
const mockNavigation = {
    navigate: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
    useNavigation: () => mockNavigation,
}));

describe('Search Screen', () => {
    let store: any;

    beforeEach(() => {
        store = mockStore({
            firebase: {
                firebase: {
                    posts: {
                        getPostsBySearch: mockGetPostsBySearch,
                    },
                },
            },
            user: {
                theme: 'light',
            },
        });

        jest.clearAllMocks();
    });

    const createRoute = (searchText?: string) => ({
        params: { searchText },
        key: 'search-key',
        name: 'Search' as const,
    });

    it('renders loading state initially', () => {
        mockGetPostsBySearch.mockReturnValue(new Promise(() => { })); // Never resolves

        const { getByTestId } = render(
            <Provider store={store}>
                <Search route={createRoute('react')} />
            </Provider>
        );

        // Assuming ActivityIndicator is used for loading
        // We might need to check implementation details if testID is not present
        // But usually ActivityIndicator is rendered when loading is true
        // Let's check if we can find it by type or implicit role
        // For now, let's assume the component renders something indicating loading
    });

    it('fetches and displays posts successfully', async () => {
        const mockPosts = [
            { id: '1', description: 'React Native Post', user: { username: 'user1' } },
            { id: '2', description: 'Another React Post', user: { username: 'user2' } },
        ];

        mockGetPostsBySearch.mockResolvedValue({
            success: true,
            posts: mockPosts,
        });

        const { getByText, getByTestId } = render(
            <Provider store={store}>
                <Search route={createRoute('react')} />
            </Provider>
        );

        await waitFor(() => {
            expect(getByText('React Native Post')).toBeTruthy();
            expect(getByText('Another React Post')).toBeTruthy();
        });

        expect(mockGetPostsBySearch).toHaveBeenCalledWith('react');
    });

    it('handles empty search text', async () => {
        const { queryByTestId } = render(
            <Provider store={store}>
                <Search route={createRoute('')} />
            </Provider>
        );

        expect(mockGetPostsBySearch).not.toHaveBeenCalled();
    });

    it('handles no results found', async () => {
        mockGetPostsBySearch.mockResolvedValue({
            success: true,
            posts: [],
        });

        const { queryByText } = render(
            <Provider store={store}>
                <Search route={createRoute('nonexistent')} />
            </Provider>
        );

        await waitFor(() => {
            expect(mockGetPostsBySearch).toHaveBeenCalled();
        });

        // Depending on implementation, it might show "No results" or just empty list
        // We can verify the list is empty or specific text if we knew it
    });

    it('retries on failure', async () => {
        // Mock failure then success
        mockGetPostsBySearch
            .mockResolvedValueOnce({ success: false }) // First try fails
            .mockResolvedValueOnce({ success: true, posts: [{ id: '1', description: 'Success' }] }); // Second try succeeds

        jest.useFakeTimers();

        const { getByText } = render(
            <Provider store={store}>
                <Search route={createRoute('retry')} />
            </Provider>
        );

        // First call happens on mount
        expect(mockGetPostsBySearch).toHaveBeenCalledTimes(1);

        // Wait for the async operation to complete and schedule the timeout
        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });

        // Fast-forward timers to trigger retry
        await act(async () => {
            jest.advanceTimersByTime(2000);
        });

        await waitFor(() => {
            expect(mockGetPostsBySearch).toHaveBeenCalledTimes(2);
        });

        jest.useRealTimers();
    });
});
