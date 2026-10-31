"""Open enums: a value the SDK does not list yet decodes and keeps the raw string.

Runs the generated client against canned responses, with no dependencies: httpx
is stubbed, and the service gets a client that answers each request with the
next response in line.

    python3 sdk/python/tests/open_enums.py
"""

import asyncio
import pathlib
import sys
import types

stub = types.ModuleType("httpx")
stub.__getattr__ = lambda name: type(name, (), {})
sys.modules["httpx"] = stub
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / "generated"))

from pachca.client import OAuthServiceImpl  # noqa: E402
from pachca.models import ApiError, OAuthError, OAuthErrorCode, OAuthScope, SortOrder, ValidationErrorCode  # noqa: E402

TOKEN_INFO = {
    "id": 4827,
    "token": "cH5kR9mN...x7Qp",
    "name": None,
    "user_id": 12,
    "scopes": ["messages:read", "brand_new:scope"],
    "created_at": "2025-01-15T10:30:00.000Z",
    "revoked_at": None,
    "expires_in": None,
    "last_used_at": None,
}
UNLISTED = "A code this SDK does not list"


class CannedResponse:
    def __init__(self, status_code: int, body: object) -> None:
        self.status_code = status_code
        self._body = body
        self.headers: dict[str, str] = {}

    def json(self) -> object:
        return self._body


class CannedClient:
    def __init__(self, responses: list[CannedResponse]) -> None:
        self._responses = responses

    async def get(self, *args: object, **kwargs: object) -> CannedResponse:
        return self._responses.pop(0)


def check(condition: bool, message: str) -> None:
    if not condition:
        print(f"open enums failed: {message}", file=sys.stderr)
        sys.exit(1)


async def main() -> None:
    service = OAuthServiceImpl(CannedClient([
        CannedResponse(200, {"data": TOKEN_INFO}),
        CannedResponse(401, {"error": "brand_new_401", "error_description": UNLISTED}),
        CannedResponse(403, {"error": "brand_new_403", "error_description": UNLISTED}),
        CannedResponse(422, {"errors": [{"key": "system", "value": None, "message": UNLISTED, "code": "brand_new_code", "payload": None}]}),
    ]))

    info = await service.get_token_info()
    known, unknown = info.scopes
    check(known is OAuthScope.MESSAGES_READ and known.is_known, f"a listed scope decodes to its member, got {known!r}")
    check(isinstance(unknown, OAuthScope) and not unknown.is_known, f"an unlisted scope decodes to a member of OAuthScope, got {unknown!r}")
    check(unknown.value == "brand_new:scope" and unknown == "brand_new:scope", f"the unlisted member keeps the value, got {unknown!r}")

    for code in ("brand_new_401", "brand_new_403"):
        try:
            await service.get_token_info()
            check(False, f"expected OAuthError with {code}")
        except OAuthError as error:
            check(isinstance(error.error, OAuthErrorCode) and not error.error.is_known, f"the code is an OAuthErrorCode, got {error.error!r}")
            check(error.error.value == code and str(error) == code, f"OAuthError keeps the unlisted code {code}, got {error.error!r}")

    try:
        await service.get_token_info()
        check(False, "expected ApiError with brand_new_code")
    except ApiError as error:
        code = error.errors[0].code
        check(isinstance(code, ValidationErrorCode), f"the code is a ValidationErrorCode, got {code!r}")
        check(code.value == "brand_new_code", f"ApiError keeps the unlisted code, got {code!r}")

    check(OAuthErrorCode("insufficient_scope") is OAuthErrorCode.INSUFFICIENT_SCOPE, "a listed code is its member")
    check(OAuthErrorCode.INSUFFICIENT_SCOPE == "insufficient_scope", "a member compares with its string")
    try:
        SortOrder("sideways")
        check(False, "an enum of requests refuses a value it does not list")
    except ValueError:
        pass
    print("open enums ok")

    # The retry, error body, audit details and request body checks need the same stubbed httpx: they run in this process.
    import audit_details
    import error_bodies
    import request_bodies
    import retries

    await retries.main()
    await error_bodies.main()
    audit_details.main()
    request_bodies.main()


asyncio.run(main())
