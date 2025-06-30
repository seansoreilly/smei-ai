# Security Headers Configuration

This document explains the security headers implemented in the SMEC AI application and their purpose.

## Headers Overview

### X-Frame-Options: DENY
- **Purpose**: Prevents the page from being embedded in frames/iframes
- **Protection**: Clickjacking attacks
- **Value**: `DENY` - completely blocks framing

### X-Content-Type-Options: nosniff
- **Purpose**: Prevents browsers from MIME-type sniffing
- **Protection**: MIME confusion attacks
- **Value**: `nosniff` - forces browsers to respect declared content types

### X-XSS-Protection: 1; mode=block
- **Purpose**: Enables browser's built-in XSS protection
- **Protection**: Cross-site scripting attacks
- **Value**: `1; mode=block` - enables protection and blocks detected attacks

### Referrer-Policy: strict-origin-when-cross-origin
- **Purpose**: Controls how much referrer information is shared
- **Protection**: Information leakage
- **Value**: `strict-origin-when-cross-origin` - sends full URL for same-origin, only origin for cross-origin HTTPS

### Permissions-Policy
- **Purpose**: Controls browser feature access
- **Protection**: Unauthorized access to device features
- **Value**: Disables camera, microphone, geolocation, and interest-cohort

### Strict-Transport-Security (Production Only)
- **Purpose**: Forces HTTPS connections
- **Protection**: Man-in-the-middle attacks, protocol downgrade attacks
- **Value**: `max-age=63072000; includeSubDomains; preload` (2 years)

### Content-Security-Policy (CSP)
- **Purpose**: Prevents code injection attacks
- **Protection**: XSS, data injection, code injection
- **Directives**:
  - `default-src 'self'` - Only allow resources from same origin by default
  - `script-src 'self' 'unsafe-inline' 'unsafe-eval'` - Scripts from same origin (Next.js dev requirements)
  - `style-src 'self' 'unsafe-inline'` - Styles from same origin (Tailwind requirement)
  - `img-src 'self' data: https: blob:` - Images from same origin, data URLs, HTTPS, and blobs
  - `connect-src 'self' https://api.openai.com https://*.anthropic.com https://*.neon.tech` - API connections
  - `object-src 'none'` - No plugins/objects
  - `frame-ancestors 'none'` - Cannot be framed
  - `base-uri 'self'` - Restrict base tag
  - `form-action 'self'` - Forms can only submit to same origin

## CORS Configuration

### Development
- **Allowed Origins**: `localhost:3000`, `127.0.0.1:3000`
- **Methods**: GET, POST, PUT, DELETE, PATCH, OPTIONS
- **Headers**: Content-Type, Authorization, x-api-key
- **Credentials**: Allowed

### Production
- **Allowed Origins**: Configured via `VERCEL_URL` environment variable
- **Same configuration as development**

## Security Features

### OPTIONS Preflight Handling
- Automatically handles CORS preflight requests
- Returns appropriate CORS headers
- 24-hour cache for preflight responses

### Rate Limit Header Exposure
- Exposes rate limiting headers to clients
- Allows frontend to handle rate limiting gracefully

## Environment-Specific Behavior

### Development
- HSTS header is omitted (HTTP allowed)
- More permissive CSP for development tools
- localhost origins allowed

### Production
- Full HSTS implementation
- Stricter origin controls
- HTTPS enforcement via CSP

## Adjusting CSP for Third-Party Services

If you need to add new external services, update the CSP in `next.config.ts`:

```typescript
// For API connections
"connect-src 'self' https://your-new-api.com"

// For external images
"img-src 'self' data: https: blob: https://trusted-cdn.com"

// For external fonts
"font-src 'self' data: https://fonts.googleapis.com"
```

## Testing Security Headers

Use tools like:
- [Security Headers](https://securityheaders.com/)
- [Mozilla Observatory](https://observatory.mozilla.org/)
- [OWASP ZAP](https://owasp.org/www-project-zap/)

## Monitoring

Headers are applied automatically by Next.js configuration. Monitor application logs for:
- CSP violations (if enabled)
- Blocked requests
- CORS errors

## Compliance

These headers help achieve compliance with:
- OWASP Security Guidelines
- PCI DSS requirements
- GDPR security requirements
- Industry security best practices