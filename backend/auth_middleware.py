"""
Authentication and authorization middleware for SustainAlign API routes.

Provides two decorators:
    - @require_auth: validates Bearer JWT, attaches User to flask.g
    - @require_role(*roles): enforces role membership; depends on @require_auth

Also exposes a `before_app_request`-style helper, `enforce_auth`, that can be
registered on the Flask app to apply auth globally with an allowlist for
public endpoints (auth + health).

Design notes:
- Tokens are validated against SECRET_KEY via utils.decode_token.
- We attach the full User ORM object to `g.user` for convenience, plus
  `g.role` and `g.user_id` for fast access without an extra query.
- 401 vs 403:
    * 401 = no/invalid/expired token
    * 403 = valid token but insufficient role
- The allowlist uses path prefixes; keep it small and explicit.
"""

from __future__ import annotations

from functools import wraps
from typing import Callable, Iterable

from flask import g, jsonify, request

from models import User
from utils import decode_token


# Public path prefixes that bypass auth. Order doesn't matter; matched by
# str.startswith. Keep this list as small as possible.
PUBLIC_PATH_PREFIXES: tuple[str, ...] = (
    "/api/auth/",
    "/api/health",
)


def _extract_bearer_token() -> str | None:
    header = request.headers.get("Authorization", "")
    if not header.lower().startswith("bearer "):
        return None
    token = header[len("Bearer ") :].strip()
    return token or None


def _unauthorized(message: str = "Unauthorized"):
    return jsonify({"error": message}), 401


def _forbidden(message: str = "Forbidden"):
    return jsonify({"error": message}), 403


def _resolve_user_from_token() -> tuple[User | None, str | None]:
    """Return (user, error_message). On success error_message is None."""
    token = _extract_bearer_token()
    if not token:
        return None, "Missing or malformed Authorization header"

    payload = decode_token(token)
    if not payload:
        return None, "Invalid or expired token"

    user_id = payload.get("sub")
    if not user_id:
        return None, "Token missing subject"

    user = User.query.get(user_id)
    if not user:
        return None, "User no longer exists"

    return user, None


def require_auth(view: Callable):
    """Decorator: require a valid JWT. Populates g.user, g.user_id, g.role."""

    @wraps(view)
    def wrapper(*args, **kwargs):
        user, err = _resolve_user_from_token()
        if err or user is None:
            return _unauthorized(err or "Unauthorized")
        g.user = user
        g.user_id = user.id
        g.role = user.role
        return view(*args, **kwargs)

    return wrapper


def require_role(*roles: str):
    """Decorator: require g.role to be in `roles`. Implies @require_auth."""

    if not roles:
        raise ValueError("require_role requires at least one role")

    def decorator(view: Callable):
        @wraps(view)
        def wrapper(*args, **kwargs):
            user, err = _resolve_user_from_token()
            if err or user is None:
                return _unauthorized(err or "Unauthorized")
            if user.role not in roles:
                return _forbidden(
                    f"Role '{user.role}' not permitted; requires one of {list(roles)}"
                )
            g.user = user
            g.user_id = user.id
            g.role = user.role
            return view(*args, **kwargs)

        return wrapper

    return decorator


def is_public_path(path: str, extra_prefixes: Iterable[str] = ()) -> bool:
    prefixes = PUBLIC_PATH_PREFIXES + tuple(extra_prefixes)
    return any(path.startswith(p) for p in prefixes)


def enforce_auth(extra_public_prefixes: Iterable[str] = ()):
    """
    Returns a function suitable for `app.before_request`.

    Applies auth globally, allowing only PUBLIC_PATH_PREFIXES (plus any extras
    the caller adds, e.g. '/static/') to pass through without a token.

    Non-API paths (anything not starting with '/api/') are left untouched so
    that admin HTML or static assets are not unintentionally blocked.
    """

    extras = tuple(extra_public_prefixes)

    def _before_request():
        path = request.path or ""
        # Only guard the JSON API surface. Non-/api paths route to view/admin
        # endpoints which manage their own auth (or will be deleted in Phase 0).
        if not path.startswith("/api/"):
            return None
        if is_public_path(path, extras):
            return None
        # OPTIONS preflight should not require auth.
        if request.method == "OPTIONS":
            return None

        user, err = _resolve_user_from_token()
        if err or user is None:
            return _unauthorized(err or "Unauthorized")
        g.user = user
        g.user_id = user.id
        g.role = user.role
        return None

    return _before_request
