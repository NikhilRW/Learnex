import type { Metadata } from 'next';

// Define proper types for generateMetadata params
type Props = {
    params: {
        code: string;
    };
    searchParams: Record<string, string | string[] | undefined>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const code = params.code;
    const deepLink = `learnex://meeting?roomCode=${code}`;

    return {
        title: `Join Learnex Meeting: ${code}`,
        description: `Join Learnex meeting with code ${code}`,
        openGraph: {
            title: `Join Learnex Meeting: ${code}`,
            description: `Connect with others on Learnex`,
            url: `https://learnex-web.vercel.app/join/${code}`,
        },
        other: {
            'apple-itunes-app': `app-id=1234567890, app-argument=${deepLink}`,
            'al:ios:url': deepLink,
            'al:android:url': deepLink,
        }
    };
}

export default function CodeLayout({
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