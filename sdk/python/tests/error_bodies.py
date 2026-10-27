"""Error bodies: an error answer whose body is empty or not JSON is an ApiError
with the status code and no errors, not a JSON parse error. The event stream
answers 404 with no body when the event history is off, and a proxy answers 502
with an HTML page.

Runs with no dependencies: httpx is stubbed, and the services get a client that
answers each request with the next canned body, parsed the way httpx parses it.
Run by open_enums.py, or on its own:

    python3 sdk/python/tests/error_bodies.py
"""

import asyncio
import json
import pathlib
import sys
import types

if "httpx" not in sys.modules:
    stub = types.ModuleType("httpx")
    stub.__getattr__ = lambda name: type(name, (), {})
    sys.modules["httpx"] = stub
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "generated"))

from pachca.client import BotsServiceImpl, MessagesServiceImpl  # noqa: E402
from pachca.models import ApiError, OAuthError, OAuthErrorCode  # noqa: E402

PROXY_PAGE = b"<html><body>502 Bad Gateway</body></html>"


class RawResponse:
    def __init__(self, status_code: int, content: bytes) -> None:
        self.status_code = status_code
        self.content = content
        self.headers: dict[str, str] = {}

    def json(self) -> object:
        # httpx raises json.JSONDecodeError, a ValueError, on an empty or non-JSON body.
        return json.loads(self.content)


class RawClient:
    def __init__(self) -> None:
        self.responses: list[RawResponse] = []

    async def _answer(self, *args: object, **kwargs: object) -> RawResponse:
        return self.responses.pop(0)

    get = post = delete = _answer


def check(condition: bool, message: str) -> None:
    if not condition:
        print(f"error bodies failed: {message}", file=sys.stderr)
        sys.exit(1)


async def failure(call: object) -> Exception:
    try:
        await call
    except Exception as error:  # noqa: BLE001
        return error
    check(False, "the call did not fail")
    raise AssertionError


async def main() -> None:
    client = RawClient()
    bots = BotsServiceImpl(client)
    messages = MessagesServiceImpl(client)

    client.responses.append(RawResponse(404, b""))
    error = await failure(bots.get_webhook_events_stream())
    check(isinstance(error, ApiError), f"a 404 with no body is an ApiError, got {error!r}")
    check(error.status_code == 404 and error.errors == [], f"the ApiError keeps 404 and no errors, got {error!r}")
    check(str(error) == "HTTP 404", f"the message names the status, got {str(error)!r}")

    client.responses.append(RawResponse(502, PROXY_PAGE))
    error = await failure(bots.self_recreate_bot_token())
    check(isinstance(error, ApiError) and error.status_code == 502, f"a proxy page is an ApiError with 502, got {error!r}")

    client.responses.append(RawResponse(404, b"<html>Not Found</html>"))
    error = await failure(messages.delete_message(1))
    check(isinstance(error, ApiError) and error.status_code == 404, f"a call with no answer body reads the error too, got {error!r}")

    body = {"errors": [{"key": "name", "value": None, "message": "Name is blank", "code": "blank", "payload": None}]}
    client.responses.append(RawResponse(422, json.dumps(body).encode()))
    error = await failure(bots.self_recreate_bot_token())
    check(isinstance(error, ApiError) and error.status_code == 422, f"a JSON error keeps its status, got {error!r}")
    check(error.errors[0].message == "Name is blank" and str(error) == "Name is blank", f"a JSON error keeps its errors, got {error!r}")

    oauth = {"error": "invalid_token", "error_description": "Access token is missing"}
    client.responses.append(RawResponse(401, json.dumps(oauth).encode()))
    error = await failure(bots.get_webhook_events_stream())
    check(isinstance(error, OAuthError) and error.error is OAuthErrorCode.INVALID_TOKEN, f"the OAuth form is an OAuthError, got {error!r}")

    client.responses.append(RawResponse(401, b""))
    error = await failure(bots.get_webhook_events_stream())
    check(isinstance(error, ApiError) and error.status_code == 401, f"a 401 with no body is an ApiError with 401, got {error!r}")

    # Errors of another shape: the status code is kept, the call still fails cleanly.
    client.responses.append(RawResponse(500, json.dumps({"errors": [{"code": "unavailable"}]}).encode()))
    error = await failure(bots.self_recreate_bot_token())
    check(isinstance(error, ApiError) and error.status_code == 500, f"errors of another shape keep the status, got {error!r}")

    # A list of strings stays out of errors: str(error) reads each item's message.
    client.responses.append(RawResponse(500, json.dumps({"errors": ["unavailable"]}).encode()))
    error = await failure(bots.self_recreate_bot_token())
    check(isinstance(error, ApiError) and error.errors == [], f"errors that are not objects are dropped, got {error!r}")
    check(str(error) == "HTTP 500", f"the message names the status, got {str(error)!r}")
    print("error bodies ok")


if __name__ == "__main__":
    asyncio.run(main())
