/**
 * Minimal HTTP client for the Java REST API.
 *
 * All Java*Repository classes share one instance of this client.
 * Replace the base URL in .env per environment:
 *   JAVA_API_URL=https://api.luxe.com      (production)
 *   JAVA_API_URL=https://api-staging.luxe.com  (staging)
 */
export class JavaApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey?: string
  ) {}

  private headers(): Record<string, string> {
    const h: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
    if (this.apiKey) h['X-API-Key'] = this.apiKey;
    return h;
  }

  async get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) url.searchParams.set(k, String(v));
      });
    }
    const res = await fetch(url.toString(), { headers: this.headers() });
    return this.parse<T>(res);
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    return this.parse<T>(res);
  }

  async patch<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'PATCH',
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    return this.parse<T>(res);
  }

  async delete<T>(path: string): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, { method: 'DELETE', headers: this.headers() });
    return this.parse<T>(res);
  }

  private async parse<T>(res: Response): Promise<T> {
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Java API ${res.status}: ${body || res.statusText}`);
    }
    return res.json() as Promise<T>;
  }
}
