import { NextResponse } from 'next/server';

export function safeRedirect(url: string, status: 307 | 308 = 307): NextResponse {
  try {
    const urlObj = new URL(url, 'https://dummy');
    
    // For internal redirects (same host), keep relative paths
    if (urlObj.hostname === 'dummy') {
      // This was a relative path
      const res = NextResponse.redirect(new URL(url, 'https://localhost').toString(), status);
      res.headers.set('Cache-Control', 'no-store');
      return res;
    }
    
    // Strip query string & fragment for external redirects
    urlObj.search = '';
    urlObj.hash = '';
    
    const res = NextResponse.redirect(urlObj.toString(), status);
    
    // Remove body to prevent response-splitting/oversharing
    // Note: NextResponse doesn't have a body property, but we can set headers
    res.headers.set('Cache-Control', 'no-store');
    
    return res;
  } catch {
    // If URL parsing fails, treat as relative path
    const res = NextResponse.redirect(new URL(url, 'https://localhost').toString(), status);
    res.headers.set('Cache-Control', 'no-store');
    return res;
  }
}