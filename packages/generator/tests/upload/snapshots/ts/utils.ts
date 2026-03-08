function snakeToCamel(str: string): string {
  const camel = str.replace(/[-_]([a-zA-Z])/g, (_, c) => c.toUpperCase());
  return camel.charAt(0).toLowerCase() + camel.slice(1);
}

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
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
      Object.entries(obj).map(([k, v]) => [camelToSnake(k), serialize(v)]),
    );
  }
  return obj;
}
