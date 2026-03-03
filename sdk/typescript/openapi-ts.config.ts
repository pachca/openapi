import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "src/generated/openapi.yaml",
  output: { path: "src/generated" },
  plugins: [
    { name: "@hey-api/typescript", enums: "javascript" },
    { name: "@hey-api/sdk", operationId: true },
    { name: "@hey-api/client-fetch" },
  ],
});
