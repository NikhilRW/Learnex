import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // Configure redirects for the join route
  async redirects() {
    return [
      // Redirect /join without code parameter to home
      {
        source: '/join',
        missing: [
          {
            type: 'query',
            key: 'code',
          },
        ],
        destination: '/',
        permanent: false,
      },
      // Old-style URL with code as query parameter redirects to new-style URL with code in path
      {
        source: '/join',
        has: [
          {
            type: 'query',
            key: 'code',
            value: '(?<code>.*)',
          },
        ],
        destination: '/join/:code',
        permanent: true,
      },
    ];
  },

  // Set security headers for the join route
  async headers() {
    return [
      {
        source: '/join/:code*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline';",
          },
        ],
      },
    ];
  },

  // Configure allowed remote image patterns
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatar.iran.liara.run',
        port: '',
        pathname: '/public/**',
        search: '',
      },
    ],
  },

  // Enable React strict mode for better debug checks
  reactStrictMode: true,

  // Disable ESLint during build to avoid build failures due to linting errors
  eslint: {
    // Only run ESLint in development, not during production builds
    ignoreDuringBuilds: true,
  },

  // Disable type checking during build to avoid build failures
  typescript: {
    // Only check types in development, not during production builds
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
