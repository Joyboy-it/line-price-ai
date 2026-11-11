export interface ApiError {
  error: string;
  errors?: { line: number; message: string }[];
  fields?: Record<string, string>;
}

/** Client-side fetch that throws the API's Thai error message on failure. */
export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const isForm = init?.body instanceof FormData;
  const response = await fetch(url, {
    ...init,
    headers: isForm || !init?.body ? init?.headers : { 'Content-Type': 'application/json', ...init?.headers },
    cache: 'no-store',
  });
  const data = (await response.json().catch(() => ({}))) as Partial<ApiError>;
  if (!response.ok) {
    const failure = new Error(data.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่') as Error & ApiError;
    failure.errors = data.errors;
    failure.fields = data.fields;
    throw failure;
  }
  return data as T;
}
