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
