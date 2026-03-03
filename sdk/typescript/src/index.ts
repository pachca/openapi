// Re-export generated flat SDK functions (tree-shakeable)
export * from "./generated/sdk.gen.js";

// Re-export all types
export * from "./generated/types.gen.js";

// Re-export client
export { createClient } from "./generated/client/index.js";
export { client } from "./generated/client.gen.js";
export type { Client, Options } from "./generated/client/index.js";

// Pachca facade class
export { Pachca } from "./pachca.js";
export type { PachcaConfig } from "./pachca.js";

// Pagination utilities
export { paginate, paginateAll } from "./paginate.js";
export type { PaginatedResponse, PaginatedOptions } from "./paginate.js";
