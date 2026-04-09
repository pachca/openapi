function snakeToCamel(str: string): string {
  const camel = str.replace(/[-_]([a-zA-Z])/g, (_, c) => c.toUpperCase());
  return camel.charAt(0).toLowerCase() + camel.slice(1);
}

function camelToSnake(str: string): string {
  return str
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase();
}

export function deserialize(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(deserialize);
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [snakeToCamel(k), deserialize(v)]),
    );
  }
  return obj;
}

export function serialize(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(serialize);
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [camelToSnake(k), serialize(v)]),
    );
  }
  return obj;
}

const MAX_RETRIES = 3;
const RETRYABLE_5XX = new Set([500, 502, 503, 504]);

function jitter(delay: number): number {
  return delay * (0.5 + Math.random() * 0.5);
}

export async function fetchWithRetry(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(input, init);
    if (response.status === 429 && attempt < MAX_RETRIES) {
      const retryAfter = response.headers.get("retry-after");
      const delay = retryAfter ? Number(retryAfter) * 1000 : 1000 * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, addJitter(delay)));
      continue;
    }
    if (RETRYABLE_5XX.has(response.status) && attempt < MAX_RETRIES) {
      const delay = 1000 * (attempt + 1);
      await new Promise((r) => setTimeout(r, addJitter(delay)));
      continue;
    }
    if (RETRYABLE_5XX.has(response.status) && attempt < MAX_RETRIES) {
      const delay = jitter(10000 * Math.pow(2, attempt));
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }
    return response;
  }
}
