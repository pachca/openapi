import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { parse } from "yaml";

const apisDir = "generated/src/main/kotlin/com/pachca/apis";
const outDir = "generated/src/main/kotlin/com/pachca";

// ── Parse OpenAPI spec for tags ──────────────────────────────

const SPEC_PATH = "../../packages/spec/openapi.yaml";
const spec = parse(readFileSync(SPEC_PATH, "utf-8"));

const specTags: string[] = (spec.tags ?? []).map((t: any) => t.name);

console.log(`Parsed ${specTags.length} tags from OpenAPI spec`);

// ── Tag → service name mapping ───────────────────────────────

const tag2service: Record<string, string> = {
  "Common": "common",
  "Profile": "profile",
  "Users": "users",
  "Group tags": "groupTags",
  "Chats": "chats",
  "Members": "members",
  "Threads": "threads",
  "Messages": "messages",
  "Read members": "readMembers",
  "Reactions": "reactions",
  "Link Previews": "linkPreviews",
  "Search": "search",
  "Tasks": "tasks",
  "Views": "views",
  "Bots": "bots",
  "Security": "security",
};

/** Tag → Api class name.  "Group tags" → "GroupTagsApi" */
function tagToApiClassName(tag: string): string {
  return tag.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join("") + "Api";
}

// ── Build entries from spec tags ─────────────────────────────

const entries: { className: string; propName: string }[] = [];

for (const tag of specTags) {
  const propName = tag2service[tag];
  if (!propName) throw new Error(`No service name mapping for tag "${tag}"`);

  const className = tagToApiClassName(tag);
  const apiFile = join(apisDir, className + ".kt");

  if (!existsSync(apiFile)) {
    console.warn(`Skipping tag "${tag}": ${className}.kt not found`);
    continue;
  }

  entries.push({ className, propName });
}

entries.sort((a, b) => a.propName.localeCompare(b.propName));

// ── Generate PachcaClient.kt ─────────────────────────────────

const lines = entries
  .map(
    ({ className, propName }) =>
      `    val ${propName} by lazy { ${className}(baseUrl, httpClientEngine, httpClientConfig) }`
  )
  .join("\n");

const code = `package com.pachca

import com.pachca.apis.*
import com.pachca.infrastructure.ApiClient
import com.pachca.models.UploadParams
import io.ktor.client.HttpClient
import io.ktor.client.HttpClientConfig
import io.ktor.client.engine.HttpClientEngine
import io.ktor.client.request.forms.formData
import io.ktor.client.request.forms.submitFormWithBinaryData
import io.ktor.client.statement.HttpResponse
import io.ktor.http.Headers
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpStatusCode

class PachcaClient(
    private val baseUrl: String = ApiClient.BASE_URL,
    private val httpClientEngine: HttpClientEngine? = null,
    private val httpClientConfig: ((HttpClientConfig<*>) -> Unit)? = null,
) {
${lines}

    /**
     * Upload a file using params from common.getUploadParams().
     * Handles multipart form construction and \\\${filename} substitution.
     * Returns the file key for use in message attachments.
     */
    suspend fun uploadFile(uploadParams: UploadParams, file: ByteArray, filename: String): String {
        val key = uploadParams.key.replace("\\\${filename}", filename)
        val client = HttpClient()
        try {
            val response: HttpResponse = client.submitFormWithBinaryData(
                url = uploadParams.directUrl,
                formData = formData {
                    append("Content-Disposition", uploadParams.contentDisposition)
                    append("acl", uploadParams.acl)
                    append("policy", uploadParams.policy)
                    append("x-amz-credential", uploadParams.xAmzCredential)
                    append("x-amz-algorithm", uploadParams.xAmzAlgorithm)
                    append("x-amz-date", uploadParams.xAmzDate)
                    append("x-amz-signature", uploadParams.xAmzSignature)
                    append("key", key)
                    append("file", file, Headers.build {
                        append(HttpHeaders.ContentDisposition, "filename=\\"$filename\\"")
                    })
                }
            )
            if (response.status != HttpStatusCode.Created && response.status != HttpStatusCode.NoContent) {
                throw RuntimeException("Upload failed with status \${response.status}")
            }
        } finally {
            client.close()
        }
        return key
    }
}
`;

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "PachcaClient.kt"), code);
console.log(
  `Generated PachcaClient.kt with ${entries.length} API properties: ${entries.map((e) => e.propName).join(", ")}`
);
