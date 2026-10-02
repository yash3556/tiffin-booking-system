import { authenticatedApiFetch } from '@/lib/auth-client';

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; message: string };

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const headers = new Headers(options?.headers);
  headers.set('Content-Type', 'application/json');

  const response = await authenticatedApiFetch(path, {
    ...options,
    headers,
  });

  const json: ApiResponse<T> = await response.json();

  if (!json.success) {
    throw new Error(json.message ?? 'An unknown error occurred.');
  }

  return json.data;
}