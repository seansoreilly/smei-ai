import { describe, test, expect } from 'vitest';
import { ALLOWED_ORIGINS, buildCsp, HSTS_HEADER } from '../../lib/config/security';

describe('Security Headers', () => {
  describe('CSP Policy', () => {
    test('buildCsp should generate secure CSP without unsafe directives', () => {
      const nonce = 'test-nonce-12345678';
      const csp = buildCsp(nonce, true);
      
      // Should contain the nonce
      expect(csp).toContain(`'nonce-${nonce}'`);
      
      // Should NOT contain unsafe directives
      expect(csp).not.toContain("'unsafe-inline'");
      expect(csp).not.toContain("'unsafe-eval'");
      
      // Should contain security directives
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain("require-trusted-types-for 'script'");
    });

    test('buildCsp should include report-uri in development', () => {
      const nonce = 'test-nonce-12345678';
      const csp = buildCsp(nonce, false);
      
      expect(csp).toContain('report-uri /csp-report');
    });

    test('buildCsp should not include report-uri in production', () => {
      const nonce = 'test-nonce-12345678';
      const csp = buildCsp(nonce, true);
      
      expect(csp).not.toContain('report-uri');
    });
  });

  describe('CORS Configuration', () => {
    test('ALLOWED_ORIGINS should not contain wildcard', () => {
      expect(ALLOWED_ORIGINS).not.toContain('*');
      expect(ALLOWED_ORIGINS.every(origin => origin.startsWith('http'))).toBe(true);
    });

    test('ALLOWED_ORIGINS should be environment-specific', () => {
      expect(Array.isArray(ALLOWED_ORIGINS)).toBe(true);
      expect(ALLOWED_ORIGINS.length).toBeGreaterThan(0);
    });
  });

  describe('HSTS Configuration', () => {
    test('HSTS_HEADER should have secure configuration', () => {
      expect(HSTS_HEADER.key).toBe('Strict-Transport-Security');
      expect(HSTS_HEADER.value).toContain('max-age=63072000');
      expect(HSTS_HEADER.value).toContain('includeSubDomains');
      expect(HSTS_HEADER.value).toContain('preload');
    });
  });
});