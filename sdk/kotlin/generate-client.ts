import { readdirSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const apisDir = "generated/src/main/kotlin/com/pachca/apis";
const outDir = "generated/src/main/kotlin/com/pachca";

const apiFiles = readdirSync(apisDir)
  .filter((f) => f.endsWith("Api.kt"))
  .sort();

const entries = apiFiles.map((f) => {
  const className = f.replace(".kt", "");
  // MessagesApi → messages, GroupTagsApi → groupTags
  const propName =
    className.replace(/Api$/, "").charAt(0).toLowerCase() +
    className.replace(/Api$/, "").slice(1);
  return { className, propName };
});

const lines = entries
  .map(
    ({ className, propName }) =>
      `    val ${propName} by lazy { ${className}(baseUrl, httpClientEngine, httpClientConfig) }`
  )
  .join("\n");

const code = `package com.pachca

import com.pachca.apis.*
import com.pachca.infrastructure.ApiClient
import io.ktor.client.HttpClientConfig
import io.ktor.client.engine.HttpClientEngine

class PachcaClient(
    private val baseUrl: String = ApiClient.BASE_URL,
    private val httpClientEngine: HttpClientEngine? = null,
    private val httpClientConfig: ((HttpClientConfig<*>) -> Unit)? = null,
) {
${lines}
}
`;

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "PachcaClient.kt"), code);
console.log(
  `Generated PachcaClient.kt with ${entries.length} API properties: ${entries.map((e) => e.propName).join(", ")}`
);
