// Security configuration constants
export const ALLOWED_ORIGINS = process.env.NODE_ENV === 'development' 
  ? [
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ]
  : [
      'https://www.smecai.online',
      'https://smecai.online'
    ];

// HSTS header configuration
export const HSTS_HEADER = {
  key: 'Strict-Transport-Security',
  value: 'max-age=63072000; includeSubDomains; preload'
};

// CSP nonce-based policy builder
export function buildCsp(nonce: string, isProd: boolean): string {
  const basePolicy = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    `script-src 'self' 'nonce-${nonce}'`,
    `style-src 'self' https://fonts.googleapis.com 'nonce-${nonce}'`,
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    "connect-src 'self' https://api.openai.com https://*.anthropic.com https://*.neon.tech",
    "upgrade-insecure-requests",
    "require-trusted-types-for 'script'"
  ];

  if (!isProd) {
    basePolicy.push("report-uri /csp-report");
  }

  return basePolicy.join('; ');
}