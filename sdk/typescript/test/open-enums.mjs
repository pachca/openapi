// Open enums against the built dist/: a value the SDK does not list yet decodes
// as is — in a response, in the OAuth error body and in the API error body.
// Every request is answered by the next canned response instead of the network.
//
// Run after `npm run build`:
//   node test/open-enums.mjs

import { ApiError, OAuthError, OAuthErrorCode, OAuthScope, PachcaClient } from "../dist/index.js";

const tokenInfo = {
  id: 4827,
  token: "cH5kR9mN...x7Qp",
  name: null,
  user_id: 12,
  scopes: ["messages:read", "brand_new:scope"],
  created_at: "2025-01-15T10:30:00.000Z",
  revoked_at: null,
  expires_in: null,
  last_used_at: null,
};

const responses = [
  [200, { data: tokenInfo }],
  [401, { error: "brand_new_401", error_description: "A code this SDK does not list" }],
  [403, { error: "brand_new_403", error_description: "A code this SDK does not list" }],
  [422, { errors: [{ key: "system", value: null, message: "A code this SDK does not list", code: "brand_new_code", payload: null }] }],
];

globalThis.fetch = async () => {
  const [status, body] = responses.shift();
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
};

function check(condition, message) {
  if (!condition) {
    console.error(`open enums failed: ${message}`);
    process.exit(1);
  }
}

const client = new PachcaClient("test-token", "http://pachca.test");

const info = await client.oauth.getTokenInfo();
check(info.scopes[0] === OAuthScope.MessagesRead, `a listed scope decodes to its member, got ${info.scopes[0]}`);
check(info.scopes[1] === "brand_new:scope", `an unlisted scope keeps its value, got ${info.scopes[1]}`);

for (const [code, ErrorClass, read] of [
  ["brand_new_401", OAuthError, (e) => e.error],
  ["brand_new_403", OAuthError, (e) => e.error],
  ["brand_new_code", ApiError, (e) => e.errors?.[0]?.code],
]) {
  try {
    await client.oauth.getTokenInfo();
    check(false, `expected ${ErrorClass.name} with ${code}`);
  } catch (error) {
    check(error instanceof ErrorClass, `expected ${ErrorClass.name}, got ${error}`);
    check(read(error) === code, `${ErrorClass.name} keeps the unlisted code ${code}, got ${read(error)}`);
  }
}

check(OAuthErrorCode.InsufficientScope === "insufficient_scope", "OAuthErrorCode lists insufficient_scope");
console.log("open enums ok");
