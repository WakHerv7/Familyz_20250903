const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

interface ApiError extends Error {
  status?: number;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('accessToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const token = this.getAuthToken();

    const headers: Record<string, string> = {
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    // Add default Content-Type for non-FormData requests
    const hasContentType = options.headers && 'Content-Type' in (options.headers as any);
    if (!hasContentType) {
      headers['Content-Type'] = 'application/json';
    }

    // Merge with provided headers, filtering out undefined values
    if (options.headers) {
      Object.entries(options.headers as Record<string, string>).forEach(([key, value]) => {
        if (value !== undefined) {
          headers[key] = value;
        }
      });
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;

        try {
          const errorData = JSON.parse(errorText) as { message?: string };
          errorMessage = errorData.message || errorMessage;
        } catch {
          // If parsing fails, use the text as is
          errorMessage = errorText || errorMessage;
        }

        const error: ApiError = new Error(errorMessage);
        error.status = response.status;
        throw error;
      }

      const responseText = await response.text();
      if (!responseText) {
        return {} as T;
      }

      return JSON.parse(responseText);
    } catch (error) {
      console.error('API request failed:', error);

      // Handle network errors
      if (!(error as ApiError).status) {
        (error as ApiError).message = 'Network error. Please check your connection.';
      }

      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown, config?: RequestInit): Promise<T> {
    const isFormData = data instanceof FormData;

    const requestConfig: RequestInit = {
      method: 'POST',
      body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
      ...config,
    };

    // For FormData, don't set Content-Type header
    if (isFormData && requestConfig.headers) {
      const headers = { ...requestConfig.headers };
      delete (headers as any)['Content-Type'];
      requestConfig.headers = headers;
    }

    return this.request<T>(endpoint, requestConfig);
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

export const apiClient = new ApiClient(BASE_URL);
