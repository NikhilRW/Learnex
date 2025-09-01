'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';

type RouteParams = {
    code: string;
};

export default function JoinCodePage(): JSX.Element {
    // Type safe params extraction
    const params = useParams<RouteParams>();
    const code = params?.code || '';

    const [copied, setCopied] = useState<boolean>(false);
    const [redirectAttempted, setRedirectAttempted] = useState<boolean>(false);

    // Deep link to the app
    const deepLink = code ? `learnex://meeting?roomCode=${code}` : '';

    // Function to open the app
    const openApp = useCallback((): void => {
        if (deepLink) {
            window.location.href = deepLink;
        }
    }, [deepLink]);

    useEffect(() => {
        // Immediately try to open the app when the page loads
        if (code && !redirectAttempted) {
            // Try to open the app immediately
            console.log('Attempting to open app with deep link:', deepLink);
            openApp();
            setRedirectAttempted(true);
        }
    }, [code, deepLink, redirectAttempted, openApp]);

    const copyCodeToClipboard = (): void => {
        if (code) {
            navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!code) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
                <h1 className="text-3xl font-bold mb-4">Invalid Meeting Link</h1>
                <p className="mb-4">
                    This meeting link is invalid or has expired. Please check the link and try again.
                </p>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
            <h1 className="text-3xl font-bold mb-8">Join Learnex Meeting</h1>

            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
                {redirectAttempted && (
                    <div className="mb-6 p-3 bg-blue-100 dark:bg-blue-900 rounded-md">
                        <p className="text-blue-800 dark:text-blue-100">
                            Opening Learnex app... If nothing happens, you may not have the app installed.
                        </p>
                    </div>
                )}

                <h2 className="text-xl font-semibold mb-4 dark:text-white">Open in Learnex App</h2>

                <div className="flex flex-col gap-4 mb-6">
                    <button
                        onClick={openApp}
                        className="px-4 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        Open in Learnex App
                    </button>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-5 mt-2">
                    <h3 className="text-md font-semibold mb-2 dark:text-white">Meeting Code:</h3>
                    <div className="flex items-center justify-center mb-4">
                        <code className="bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded text-lg font-mono dark:text-white">{code}</code>
                        <button
                            onClick={copyCodeToClipboard}
                            className="ml-2 p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            aria-label="Copy code"
                        >
                            {copied ? '✓' : 'Copy'}
                        </button>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        You can manually enter this code in the Learnex app to join the meeting.
                    </p>
                </div>
                <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors">
                    <a href="app-release.apk">Download Learnex</a>
                </button>
            </div>
        </div>
    );
} 