"""Retries: a 504 with the error code timeout is a search the server stopped
because the query is too heavy, so RetryTransport hands it back at once, while a
504 from a proxy is retried.

Runs with no dependencies: httpx is stubbed, RetryTransport wraps a transport
that answers every request with the same canned response, and the pauses are
recorded instead of slept. Run by open_enums.py, or on its own:

    python3 sdk/python/tests/retries.py
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

from pachca.utils import RetryTransport  # noqa: E402

SEARCH_TIMEOUT = json.dumps(
    {"errors": [{"key": "system", "value": None, "message": "Search timed out", "code": "timeout", "payload": None}]}
).encode()
OTHER_CODE = json.dumps({"errors": [{"code": "unavailable", "message": "Try later"}]}).encode()
PROXY_PAGE = b"<html>Gateway Timeout</html>"


class CannedRequest:
    def __init__(self, method: str) -> None:
        self.method = method


class CannedResponse:
    def __init__(self, status_code: int, body: bytes) -> None:
        self.status_code = status_code
        self.headers: dict[str, str] = {}
        self._body = body

    async def aread(self) -> bytes:
        return self._body


class RepeatingTransport:
    def __init__(self, status_code: int, body: bytes) -> None:
        self._status_code = status_code
        self._body = body
        self.requests = 0

    async def handle_async_request(self, request: CannedRequest) -> CannedResponse:
        self.requests += 1
        return CannedResponse(self._status_code, self._body)


def check(condition: bool, message: str) -> None:
    if not condition:
        print(f"retries failed: {message}", file=sys.stderr)
        sys.exit(1)


async def send(method: str, status_code: int, body: bytes) -> tuple[int, int, int]:
    """Requests made, pauses taken and the status handed back."""
    pauses: list[float] = []

    async def record(delay: float) -> None:
        pauses.append(delay)

    inner = RepeatingTransport(status_code, body)
    real_sleep = asyncio.sleep
    asyncio.sleep = record
    try:
        response = await RetryTransport(inner).handle_async_request(CannedRequest(method))
    finally:
        asyncio.sleep = real_sleep
    return inner.requests, len(pauses), response.status_code


async def main() -> None:
    requests, pauses, status = await send("GET", 504, SEARCH_TIMEOUT)
    check(status == 504 and requests == 1 and pauses == 0, f"a 504 with the code timeout is not repeated, got {requests} requests")

    for body in (PROXY_PAGE, OTHER_CODE):
        requests, pauses, status = await send("GET", 504, body)
        check(requests == 4 and pauses == 3, f"a 504 without the code timeout is retried, got {requests} requests for {body!r}")
        requests, _, _ = await send("DELETE", 504, body)
        check(requests == 4, f"DELETE is retried after a 504, got {requests} requests for {body!r}")

    requests, _, _ = await send("POST", 504, PROXY_PAGE)
    check(requests == 1, f"a POST is not repeated after a 504, got {requests} requests")
    # The code decides only for a 504: a 503 that names it is still retried.
    requests, _, _ = await send("GET", 503, SEARCH_TIMEOUT)
    check(requests == 4, f"a 503 is retried whatever its body, got {requests} requests")
    print("retries ok")


if __name__ == "__main__":
    asyncio.run(main())
