// API client utility with authentication headers

const API_SECRET = process.env.NEXT_PUBLIC_API_SECRET;

export interface ApiRequestOptions extends RequestInit {
  requireAuth?: boolean;
}

export class ApiClient {
  private static getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {};
    
    if (API_SECRET) {
      headers['x-api-key'] = API_SECRET;
    }
    
    return headers;
  }

  public static async fetch(url: string, options: ApiRequestOptions = {}): Promise<Response> {
    const { requireAuth = true, headers = {}, ...restOptions } = options;
    
    const requestHeaders: HeadersInit = {
      ...headers,
    };

    // Add auth headers for protected routes
    if (requireAuth) {
      Object.assign(requestHeaders, this.getAuthHeaders());
    }

    const requestOptions: RequestInit = {
      ...restOptions,
      headers: requestHeaders,
    };

    return fetch(url, requestOptions);
  }
}

// Convenience function for common API calls
export const apiClient = {
  get: (url: string, options: ApiRequestOptions = {}) => 
    ApiClient.fetch(url, { ...options, method: 'GET' }),
  
  post: (url: string, data?: unknown, options: ApiRequestOptions = {}) => 
    ApiClient.fetch(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    }),
  
  patch: (url: string, data?: unknown, options: ApiRequestOptions = {}) => 
    ApiClient.fetch(url, {
      ...options,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    }),
  
  delete: (url: string, options: ApiRequestOptions = {}) => 
    ApiClient.fetch(url, { ...options, method: 'DELETE' }),
};