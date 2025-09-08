const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1";

interface ApiError extends Error {
  status?: number;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getAuthToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const method = options.method || "GET";

    console.log(`[API Client] ${method} ${endpoint} - Request started`);

    const token = this.getAuthToken();
    const isFormData = options.body instanceof FormData;

    const headers: Record<string, string> = {
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    // Add default Content-Type for non-FormData requests
    const hasContentType =
      options.headers && "Content-Type" in (options.headers as any);
    if (!hasContentType && !isFormData) {
      headers["Content-Type"] = "application/json";
    }

    // Merge with provided headers, filtering out undefined values
    if (options.headers) {
      Object.entries(options.headers as Record<string, string>).forEach(
        ([key, value]) => {
          if (value !== undefined) {
            headers[key] = value;
          }
        }
      );
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    // Log request details
    console.log(`[API Client] ${method} ${url}`, {
      hasAuth: !!token,
      contentType: headers["Content-Type"] || "none (FormData)",
      hasBody: !!config.body,
      bodyType: isFormData ? "FormData" : typeof config.body,
    });

    try {
      const startTime = Date.now();
      const response = await fetch(url, config);
      const duration = Date.now() - startTime;

      console.log(`[API Client] ${method} ${endpoint} - Response received`, {
        status: response.status,
        statusText: response.statusText,
        duration: `${duration}ms`,
        contentType: response.headers.get("content-type"),
      });

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

        console.error(`[API Client] ${method} ${endpoint} - Request failed`, {
          status: response.status,
          errorMessage,
          duration: `${duration}ms`,
        });

        const error: ApiError = new Error(errorMessage);
        error.status = response.status;
        throw error;
      }

      // Check if response is JSON based on content type
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const responseText = await response.text();
        if (!responseText) {
          console.log(
            `[API Client] ${method} ${endpoint} - Empty JSON response`
          );
          return {} as T;
        }
        const parsedData = JSON.parse(responseText);
        console.log(
          `[API Client] ${method} ${endpoint} - JSON response parsed successfully`,
          {
            data: parsedData,
          }
        );
        return parsedData;
      } else {
        // For non-JSON responses (like file uploads), return the response object
        // This allows the calling code to handle the response appropriately
        console.log(
          `[API Client] ${method} ${endpoint} - Non-JSON response returned`
        );
        return response as unknown as T;
      }
    } catch (error) {
      console.error(
        `[API Client] ${method} ${endpoint} - Request error:`,
        error
      );

      // Handle network errors
      if (!(error as ApiError).status) {
        (error as ApiError).message =
          "Network error. Please check your connection.";
      }

      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    config?: RequestInit
  ): Promise<T> {
    const isFormData = data instanceof FormData;

    const requestConfig: RequestInit = {
      method: "POST",
      body: isFormData ? data : data ? JSON.stringify(data) : undefined,
      ...config,
    };

    // For FormData, don't set Content-Type header
    if (isFormData && requestConfig.headers) {
      const headers = { ...requestConfig.headers };
      delete (headers as any)["Content-Type"];
      requestConfig.headers = headers;
    }

    return this.request<T>(endpoint, requestConfig);
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    config?: RequestInit
  ): Promise<T> {
    const isFormData = data instanceof FormData;

    const requestConfig: RequestInit = {
      method: "PUT",
      body: isFormData ? data : data ? JSON.stringify(data) : undefined,
      ...config,
    };

    // For FormData, don't set Content-Type header
    if (isFormData && requestConfig.headers) {
      const headers = { ...requestConfig.headers };
      delete (headers as any)["Content-Type"];
      requestConfig.headers = headers;
    }

    return this.request<T>(endpoint, requestConfig);
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "DELETE",
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

export const apiClient = new ApiClient(BASE_URL);
