# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability within this project, please send an e-mail to the development team. All security vulnerabilities will be promptly addressed.

## July 2025 Remediation

This section documents the comprehensive security fixes implemented in July 2025 following a HostedScan security audit.

### Overview

Four critical security issues were identified and remediated:

1. **Wildcard CORS Vulnerability** (Task 13) - High severity
2. **Unsafe CSP Directives** (Task 14) - High severity  
3. **Missing HSTS Headers** (Task 15) - Medium severity
4. **Unsafe Redirects** (Task 15) - Medium severity

### Security Fixes Implemented

#### 1. CORS Hardening (Task 13)
- **Issue**: Wildcard `Access-Control-Allow-Origin: *` on `/_next/image` endpoint
- **Fix**: Implemented origin-specific CORS headers
- **Files**: `lib/config/security.ts`, `middleware.ts`
- **Verification**: CORS headers now limited to configured allowed origins

#### 2. Content Security Policy (Task 14)
- **Issue**: CSP contained `unsafe-inline` and `unsafe-eval` directives
- **Fix**: Implemented nonce-based CSP without unsafe directives
- **Files**: `lib/config/security.ts`, `middleware.ts`, `app/layout.tsx`, `lib/nonce.ts`
- **Policy**:
  ```
  default-src 'self';
  script-src 'self' 'nonce-{random}';
  style-src 'self' https://fonts.googleapis.com 'nonce-{random}';
  object-src 'none';
  frame-ancestors 'none';
  require-trusted-types-for 'script';
  ```

#### 3. HSTS Implementation (Task 15)
- **Issue**: Missing Strict-Transport-Security headers
- **Fix**: Global HSTS header enforcement
- **Configuration**: `max-age=63072000; includeSubDomains; preload`
- **Coverage**: All responses including `_next/image` endpoint

#### 4. Safe Redirects (Task 15)
- **Issue**: Redirects could leak sensitive data in URL parameters
- **Fix**: Implemented `safeRedirect()` utility
- **Features**: 
  - Strips query parameters and fragments from external redirects
  - Preserves relative paths for internal redirects
  - Sets `Cache-Control: no-store` header

### Validation Suite

#### Running Security Tests

```bash
# Run all security tests
npm run test:security

# Full security validation (tests + build)
npm run security:validate
```

#### Test Coverage

- **Unit Tests**: CSP generation, safe redirects, security configuration
- **Integration Tests**: Header injection, CORS behavior, HSTS enforcement
- **Regression Tests**: Automated prevention of security regressions

#### Continuous Security

The project now includes:
- Automated security tests in CI/CD pipeline
- Security header validation on every build
- Documentation of security best practices

### Security Headers Configuration

#### Production Headers

All responses include these security headers:

```
Content-Security-Policy: [nonce-based policy]
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
```

#### CORS Policy

- **Allowed Origins**: Environment-specific configuration
- **Methods**: `GET, POST, PUT, DELETE, PATCH, OPTIONS`
- **Headers**: `Content-Type, Authorization, x-api-key`
- **Credentials**: Supported with origin validation

### Development Guidelines

#### Adding New Redirects

Always use the `safeRedirect()` utility:

```typescript
import { safeRedirect } from '@/lib/security/safeRedirect';

// Good
return safeRedirect(url);

// Bad - don't use directly
return NextResponse.redirect(url);
```

#### Inline Scripts/Styles

Use nonce for any inline content:

```typescript
import { getNonce } from '@/lib/nonce';

const nonce = await getNonce();
// Use nonce in script/style tags
```

#### CORS Origins

Update `ALLOWED_ORIGINS` in `lib/config/security.ts` when adding new domains.

### Security Scanning

The project should be regularly scanned for vulnerabilities:

1. **Automated**: CI/CD pipeline includes security validation
2. **Manual**: Periodic security audits and penetration testing
3. **Monitoring**: Security header validation in production

### HSTS Preload

Once verified in production, consider submitting the domain to the [HSTS Preload List](https://hstspreload.org/).

### Contact

For security concerns or questions about these implementations:
- Review Task Master tasks 13-16 for detailed implementation
- Check `docs/security/hostedscan/2025-07-01-tracking.md` for tracking details
- Contact the development team for urgent security matters

### Verification Checklist

- [x] Wildcard CORS eliminated
- [x] CSP implemented without unsafe directives  
- [x] HSTS headers on all responses
- [x] Safe redirect utility implemented
- [x] Automated security tests created
- [x] Security documentation updated
- [x] CI/CD security validation enabled

Last updated: July 1, 2025