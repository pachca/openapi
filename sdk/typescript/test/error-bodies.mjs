// Error bodies against the built dist/: an error answer whose body is empty or
// not JSON is an ApiError with the status code and no errors, not a JSON parse
// error. The event stream answers 404 with no body when the event history is
// off, and a proxy answers 502 with an HTML page. Every request is answered by
// one canned response instead of the network.
//
// Run after `npm run build`:
//   node test/error-bodies.mjs

import { ApiError, OAuthError, OAuthErrorCode, PachcaClient } from "../dist/index.js";

function answer(status, body, contentType) {
  globalThis.fetch = async () =>
    new Response(body, { status, headers: contentType ? { "Content-Type": contentType } : {} });
}

function check(condition, message) {
  if (!condition) {
    console.error(`error bodies failed: ${message}`);
    process.exit(1);
  }
}

async function failure(call) {
  try {
    await call();
  } catch (error) {
    return error;
  }
  check(false, "the call did not fail");
}

function checkApiError(error, status, what) {
  check(error instanceof ApiError, `${what} is an ApiError, got ${error?.constructor?.name}: ${error?.message}`);
  check(error.status === status, `${what} keeps the status code ${status}, got ${error.status}`);
  return error;
}

const client = new PachcaClient("test-token", "http://pachca.test");

answer(404, null);
const empty = checkApiError(await failure(() => client.bots.getWebhookEventsStream()), 404, "a 404 with no body");
check(empty.errors.length === 0, `an empty body gives no errors, got ${JSON.stringify(empty.errors)}`);
check(empty.message === "HTTP 404", `the message names the status, got ${empty.message}`);

// POST is not repeated after a 5xx: one request, the page comes back at once.
answer(502, "<html><body>502 Bad Gateway</body></html>", "text/html");
checkApiError(await failure(() => client.bots.selfRecreateBotToken()), 502, "a proxy page");
answer(404, "<html>Not Found</html>", "text/html");
checkApiError(await failure(() => client.messages.deleteMessage(1)), 404, "a call with no answer body");

answer(422, JSON.stringify({ errors: [{ key: "name", value: null, message: "Name is blank", code: "blank", payload: null }] }), "application/json");
const invalid = checkApiError(await failure(() => client.bots.selfRecreateBotToken()), 422, "a JSON error");
check(invalid.errors.length === 1 && invalid.errors[0].message === "Name is blank", `a JSON error keeps its errors, got ${JSON.stringify(invalid.errors)}`);

answer(401, JSON.stringify({ error: "invalid_token", error_description: "Access token is missing" }), "application/json");
const oauth = await failure(() => client.bots.getWebhookEventsStream());
check(oauth instanceof OAuthError && oauth.error === OAuthErrorCode.InvalidToken, `the OAuth form is an OAuthError, got ${oauth}`);
answer(401, null);
checkApiError(await failure(() => client.bots.getWebhookEventsStream()), 401, "a 401 with no body");

console.log("error bodies ok");
