export async function safeFetchJson<T = any>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    if (typeof window !== 'undefined' && (window as any).__ARCHIVE_MOCK_HANDLER__) {
      const mockHandler = (window as any).__ARCHIVE_MOCK_HANDLER__;
      const mockResult = await mockHandler(url, options);
      if (mockResult !== undefined) {
         return mockResult as T;
      }
    }
    const res = await fetch(url, options);
    if (!res.ok) {
      console.warn(`Fetch ${url} returned HTTP status ${res.status}`);
      return null;
    }
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await res.text();
      console.warn(`Fetch ${url} returned non-JSON content:`, text.substring(0, 100));
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.warn(`SafeFetch error for ${url}:`, err);
    return null;
  }
}

export async function parseJsonResponse<T = any>(res: Response): Promise<T | null> {
  try {
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await res.text();
      console.warn(`Response returned non-JSON content:`, text.substring(0, 100));
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.warn(`Failed to parse JSON response:`, err);
    return null;
  }
}
