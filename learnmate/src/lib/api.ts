export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  mustChangePassword?: boolean;
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'include',
  });

  const contentType = res.headers.get('content-type');
  let data: any = {};
  if (contentType && contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = { message: await res.text() };
  }

  if (!res.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${res.status}`;
    const error: any = new Error(errorMsg);
    error.status = res.status;
    error.data = data;
    error.mustChangePassword = data.mustChangePassword;
    throw error;
  }

  return data as T;
}

export const api = {
  get: <T = any>(url: string, headers?: Record<string, string>) =>
    apiFetch<T>(url, { method: 'GET', headers }),
  post: <T = any>(url: string, body?: any, headers?: Record<string, string>) =>
    apiFetch<T>(url, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
      headers,
    }),
  patch: <T = any>(url: string, body?: any, headers?: Record<string, string>) =>
    apiFetch<T>(url, {
      method: 'PATCH',
      body: JSON.stringify(body),
      headers,
    }),
  put: <T = any>(url: string, body?: any, headers?: Record<string, string>) =>
    apiFetch<T>(url, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers,
    }),
  delete: <T = any>(url: string, headers?: Record<string, string>) =>
    apiFetch<T>(url, { method: 'DELETE', headers }),
};
