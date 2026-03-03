import { readFileSync, writeFileSync, readdirSync, unlinkSync, existsSync } from "fs";
import { join } from "path";

const modelsDir = "generated/src/main/kotlin/com/pachca/models";

// Fix Map<String, kotlin.Any> → Map<String, kotlinx.serialization.json.JsonElement>
// The generator emits kotlin.Any for additionalProperties schemas, which isn't serializable with kotlinx
for (const file of readdirSync(modelsDir)) {
  const path = join(modelsDir, file);
  let content = readFileSync(path, "utf-8");

  if (content.includes("Map<kotlin.String, kotlin.Any>")) {
    content = content.replace(
      /Map<kotlin\.String, kotlin\.Any>/g,
      "Map<kotlin.String, kotlinx.serialization.json.JsonElement>"
    );

    // Add import if not already present
    if (!content.includes("import kotlinx.serialization.json.JsonElement")) {
      content = content.replace(
        /^(package .+\n)/m,
        "$1\nimport kotlinx.serialization.json.JsonElement\n"
      );
    }

    writeFileSync(path, content);
    console.log(`Fixed Map<String, Any> in ${file}`);
  }
}

// Fix non-nullable List fields that the API returns as null
// The generator ignores nullable: true on array fields with kotlinx_serialization
// Pattern: "val foo: kotlin.collections.List<...>," → "val foo: kotlin.collections.List<...>? = null,"
// Only affects fields that are NOT constructor-required (i.e. ones the API may omit or null)
for (const file of readdirSync(modelsDir)) {
  const path = join(modelsDir, file);
  let content = readFileSync(path, "utf-8");
  let changed = false;

  // Match non-nullable List fields without defaults and make them nullable
  // This regex targets: val fieldName: kotlin.collections.List<...>\n  (no ? and no = default)
  content = content.replace(
    /^(    val \w+: kotlin\.collections\.List<[^>]+(?:<[^>]+>)?>)(,?\s*$)/gm,
    (match, prefix, suffix) => {
      // Skip if already nullable
      if (prefix.endsWith("?")) return match;
      changed = true;
      return `${prefix}? = null${suffix}`;
    }
  );

  if (changed) {
    writeFileSync(path, content);
    console.log(`Fixed nullable List fields in ${file}`);
  }
}

// Delete stale java.io.File.kt artifact if generated
for (const dir of ["models", "infrastructure"]) {
  const staleFile = join("generated/src/main/kotlin/com/pachca", dir, "java.io.File.kt");
  if (existsSync(staleFile)) {
    unlinkSync(staleFile);
    console.log(`Deleted stale ${dir}/java.io.File.kt`);
  }
}

// Fix ApiClient.kt: wire kotlinx.serialization.json into ContentNegotiation
const apiClientPath = "generated/src/main/kotlin/com/pachca/infrastructure/ApiClient.kt";
let apiClient = readFileSync(apiClientPath, "utf-8");

if (apiClient.includes("install(ContentNegotiation) {\n            }")) {
  apiClient = apiClient.replace(
    "import io.ktor.client.plugins.contentnegotiation.ContentNegotiation",
    `import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.json.Json`
  );

  apiClient = apiClient.replace(
    "install(ContentNegotiation) {\n            }",
    `install(ContentNegotiation) {
                json(Json { ignoreUnknownKeys = true; isLenient = true })
            }`
  );

  writeFileSync(apiClientPath, apiClient);
  console.log("Fixed ApiClient.kt: wired kotlinx.serialization into ContentNegotiation");
}

// Fix build.gradle: add ktor-serialization-kotlinx-json dependency
const buildGradlePath = "generated/build.gradle";
let buildGradle = readFileSync(buildGradlePath, "utf-8");

if (!buildGradle.includes("ktor-serialization-kotlinx-json")) {
  buildGradle = buildGradle.replace(
    'implementation "io.ktor:ktor-client-content-negotiation:$ktor_version"',
    'implementation "io.ktor:ktor-client-content-negotiation:$ktor_version"\n    implementation "io.ktor:ktor-serialization-kotlinx-json:$ktor_version"'
  );

  writeFileSync(buildGradlePath, buildGradle);
  console.log("Fixed build.gradle: added ktor-serialization-kotlinx-json dependency");
}
