import { describe, test, expect } from 'vitest';
import { safeRedirect } from '../../lib/security/safeRedirect';

describe('Safe Redirect', () => {
  test('should strip query parameters and fragments from external URLs', () => {
    const response = safeRedirect('https://example.com?token=abc&secret=xyz#fragment');
    
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://example.com');
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  test('should handle internal redirects', () => {
    const response = safeRedirect('/dashboard');
    
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toContain('/dashboard');
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  test('should accept custom status codes', () => {
    const response = safeRedirect('https://example.com', 308);
    
    expect(response.status).toBe(308);
    expect(response.headers.get('location')).toBe('https://example.com');
  });

  test('should handle malformed URLs gracefully', () => {
    const response = safeRedirect('not-a-valid-url');
    
    expect(response.status).toBe(307);
    expect(response.headers.get('cache-control')).toBe('no-store');
  });

  test('should strip both search and hash from complex URLs', () => {
    const complexUrl = 'https://evil.com/path?param1=value1&param2=value2#section';
    const response = safeRedirect(complexUrl);
    
    expect(response.headers.get('location')).toBe('https://evil.com/path');
    expect(response.headers.get('location')).not.toContain('param1');
    expect(response.headers.get('location')).not.toContain('#section');
  });
});