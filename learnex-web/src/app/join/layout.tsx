import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
    title: 'Join Learnex Meeting',
    description: 'Join a Learnex meeting using your meeting code',
    openGraph: {
        title: 'Join Learnex Meeting',
        description: 'Connect with others on Learnex',
        url: 'https://learnex-web.vercel.app/join',
        siteName: 'Learnex',
        images: [
            {
                url: '/app.png',
                width: 1200,
                height: 630,
                alt: 'Learnex App',
            }
        ],
        locale: 'en_US',
        type: 'website',
    },
    other: {
        'apple-itunes-app': 'app-id=1234567890, app-argument=learnex://',
        'al:ios:app_store_id': '1234567890',
        'al:ios:app_name': 'Learnex',
        'al:ios:url': 'learnex://',
        'al:android:package': 'com.learnex',
        'al:android:url': 'learnex://',
        'al:android:app_name': 'Learnex',
        'al:web:url': 'https://learnex-web.vercel.app',
    }
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
};

export default function JoinLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950">
            {children}
        </div>
    );
} 