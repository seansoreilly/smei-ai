import type { NextConfig } from "next";

// Security headers configuration
const SECURITY_HEADERS = [
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  },
  {
    key: 'Strict-Transport-Security',
    value: process.env.NODE_ENV === 'production' ? 'max-age=63072000; includeSubDomains; preload' : ''
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-inline for dev
      "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.openai.com https://*.anthropic.com https://*.neon.tech",
      "media-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; ')
  }
].filter(header => header.value); // Remove empty headers

const nextConfig: NextConfig = {
  devIndicators: false,
  
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: SECURITY_HEADERS,
      },
    ];
  },

  // Additional security configurations
  poweredByHeader: false,
  
  // Compress responses
  compress: true,
  
  // Enable strict mode
  reactStrictMode: true,
  
  // Security-related experimental features
  experimental: {
    // Enable server actions with security considerations
    serverActions: {
      allowedOrigins: process.env.NODE_ENV === 'development' 
        ? ['localhost:3000', '127.0.0.1:3000']
        : [process.env.VERCEL_URL].filter(Boolean) as string[]
    }
  },

  // Webpack configuration to handle Node.js built-in modules
  webpack: (config, { isServer, dev }) => {
    // Add fallbacks for Node.js built-in modules in browser environment
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
        stream: false,
        buffer: false,
        util: false,
        url: false,
        querystring: false,
        path: false,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        os: false,
        events: false,
        zlib: false,
        http: false,
        https: false,
        punycode: false,
        process: false,
        'timers/promises': false,
      };
    }

    return config;
  }
};

export default nextConfig;
