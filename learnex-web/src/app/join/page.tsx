'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

// Separate component that uses useSearchParams to avoid the error
function JoinRedirectContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const code = searchParams.get('code');

    useEffect(() => {
        if (code) {
            // Redirect to the dynamic route
            router.replace(`/join/${code}`);
        } else {
            // No code provided, redirect to home
            router.replace('/');
        }
    }, [code, router]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
            <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin" />
            <p className="mt-4 text-lg">Redirecting...</p>
        </div>
    );
}

// Loading component for the Suspense boundary
function Loading() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
            <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin" />
            <p className="mt-4 text-lg">Loading...</p>
        </div>
    );
}

// Main component wrapped with Suspense
export default function JoinRedirect() {
    return (
        <Suspense fallback={<Loading />}>
            <JoinRedirectContent />
        </Suspense>
    );
} 