const BASE_URL = 'http://192.168.1.40:3000';

type ApiResponse<T> = { success: true; data: T } | { success: false; message: string };

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const json: ApiResponse<T> = await response.json();

  if (!json.success) {
    throw new Error(json.message ?? 'An unknown error occurred.');
  }

  return json.data;
}
