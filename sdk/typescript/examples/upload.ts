/**
 * File upload example demonstrating the Pachca TypeScript SDK.
 *
 * Uploads a local file and sends it as a message attachment.
 *
 * Usage:
 *
 *   PACHCA_TOKEN=your_token PACHCA_CHAT_ID=12345 PACHCA_FILE_PATH=./photo.png bun run examples/upload.ts
 */

import { readFileSync, statSync } from "node:fs";
import { basename } from "node:path";
import { PachcaClient } from "../src/index.js";

const token = process.env.PACHCA_TOKEN;
const chatIdStr = process.env.PACHCA_CHAT_ID;
const filePath = process.env.PACHCA_FILE_PATH;

if (!token || !chatIdStr || !filePath) {
  console.error(
    "Set PACHCA_TOKEN, PACHCA_CHAT_ID, and PACHCA_FILE_PATH environment variables",
  );
  process.exit(1);
}

const chatId = Number(chatIdStr);
const filename = basename(filePath);
const client = new PachcaClient(token);

// ── Step 1: Read the local file ─────────────────────────────────
console.log(`1. Reading file: ${filePath}`);
const fileBytes = readFileSync(filePath);
const fileSize = statSync(filePath).size;
const file = new Blob([fileBytes]);
console.log(`   Size: ${fileSize} bytes`);

// ── Step 2: Get upload params ───────────────────────────────────
console.log("2. Getting upload params...");
const params = await client.common.getUploadParams();
const key = params.key.replace("${filename}", filename);
console.log(`   Got direct_url: ${params.directUrl}`);

// ── Step 3: Upload the file via SDK ─────────────────────────────
console.log("3. Uploading file...");
await client.common.uploadFile({
  contentDisposition: params.contentDisposition,
  acl: params.acl,
  policy: params.policy,
  xAmzCredential: params.xAmzCredential,
  xAmzAlgorithm: params.xAmzAlgorithm,
  xAmzDate: params.xAmzDate,
  xAmzSignature: params.xAmzSignature,
  key,
  file,
}, params.directUrl);
console.log(`   Uploaded, key: ${key}`);

// ── Step 4: Send message with the file attached ─────────────────
console.log("4. Sending message with attachment...");
const msg = await client.messages.createMessage({
  message: {
    entityId: chatId,
    content: `File upload test: ${filename} 🚀`,
    files: [
      {
        key,
        name: filename,
        fileType: "file",
        size: fileSize,
      },
    ],
  },
});
console.log(`   Message ID: ${msg.id}`);

console.log("\nDone! File uploaded and sent.");
