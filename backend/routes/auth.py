"""
Authentication routes: signup, login, refresh, logout.

Token strategy:
    - Access token: 15-minute JWT, type='access', signed with SECRET_KEY.
      Sent on every API request as Authorization: Bearer <token>.
    - Refresh token: 7-day JWT, type='refresh', signed with JWT_REFRESH_SECRET.
      Stored in the refresh_tokens table for rotation/revocation. Each
      /api/auth/refresh call invalidates the presented refresh token and
      issues a new pair. Reuse of a revoked refresh token is treated as
      evidence of theft and triggers full revocation for that user.
"""

from __future__ import annotations

import secrets
from datetime import datetime, timedelta

from flask import Blueprint, request, jsonify

from models import db, User, RefreshToken
from utils import (
    hash_password,
    verify_password,
    needs_rehash,
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    REFRESH_TOKEN_TTL_DAYS,
)

auth_bp = Blueprint('auth', __name__)


def _generate_jti() -> str:
    """48 random bytes -> 64 url-safe characters. Plenty of entropy."""
    return secrets.token_urlsafe(48)


def _issue_token_pair(user: User) -> dict:
    """Mint access + refresh tokens, persist the refresh row, return the API payload."""
    access = create_access_token({'sub': user.id, 'email': user.email, 'role': user.role})

    jti = _generate_jti()
    refresh, refresh_expires_at = create_refresh_token(user.id, jti)

    db.session.add(RefreshToken(
        user_id=user.id,
        jti=jti,
        expires_at=refresh_expires_at,
        user_agent=(request.headers.get('User-Agent') or '')[:255],
        ip_address=(request.remote_addr or '')[:64],
    ))
    db.session.commit()

    return {
        'access_token': access,
        'refresh_token': refresh,
        'token_type': 'Bearer',
        'expires_in_minutes': 15,
        'refresh_expires_in_days': REFRESH_TOKEN_TTL_DAYS,
        'user': user.to_dict(),
    }


def _revoke_all_user_tokens(user_id: int) -> int:
    """Mark every active refresh token for this user as revoked. Returns count."""
    now = datetime.utcnow()
    rows = RefreshToken.query.filter(
        RefreshToken.user_id == user_id,
        RefreshToken.revoked_at.is_(None),
        RefreshToken.expires_at > now,
    ).all()
    for row in rows:
        row.revoked_at = now
    db.session.commit()
    return len(rows)


@auth_bp.post('/signup')
def signup():
    data = request.get_json(force=True)
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''
    role = (data.get('role') or 'corporate').strip()

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409

    user = User(email=email, password_hash=hash_password(password), role=role)
    db.session.add(user)
    db.session.commit()

    return jsonify(_issue_token_pair(user)), 201


@auth_bp.post('/login')
def login():
    data = request.get_json(force=True)
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    user = User.query.filter_by(email=email).first()
    if not user or not verify_password(password, user.password_hash):
        return jsonify({'error': 'Invalid credentials'}), 401

    # Lazy bcrypt upgrade for legacy pbkdf2 hashes. Zero user friction.
    if needs_rehash(user.password_hash):
        user.password_hash = hash_password(password)
        db.session.commit()

    return jsonify(_issue_token_pair(user)), 200


@auth_bp.post('/refresh')
def refresh():
    """Rotate refresh token. Old jti is revoked, new pair is issued.

    Reuse of an already-revoked refresh token is suspicious — we revoke
    every refresh token for the user as a precaution against theft.
    """
    data = request.get_json(silent=True) or {}
    refresh_jwt = data.get('refresh_token') or ''

    payload = decode_refresh_token(refresh_jwt)
    if not payload:
        return jsonify({'error': 'Invalid or expired refresh token'}), 401

    jti = payload.get('jti')
    user_id = payload.get('sub')
    if not jti or not user_id:
        return jsonify({'error': 'Malformed refresh token'}), 401

    row = RefreshToken.query.filter_by(jti=jti).first()
    if not row:
        # Token signed by us but no DB record — treat as forged.
        return jsonify({'error': 'Refresh token not recognized'}), 401

    if row.revoked_at is not None:
        # Reuse-after-revocation. Possible theft. Burn everything.
        revoked_count = _revoke_all_user_tokens(row.user_id)
        return jsonify({
            'error': 'Refresh token reuse detected. All sessions revoked.',
            'revoked': revoked_count,
        }), 401

    if row.expires_at <= datetime.utcnow():
        return jsonify({'error': 'Refresh token expired'}), 401

    user = User.query.get(row.user_id)
    if not user:
        return jsonify({'error': 'User no longer exists'}), 401

    # Mint the new pair first so we know the new jti for replaced_by tracking.
    new_pair = _issue_token_pair(user)

    # Now revoke the old token, linking to its successor.
    new_payload = decode_refresh_token(new_pair['refresh_token'])
    row.revoked_at = datetime.utcnow()
    row.replaced_by_jti = new_payload['jti'] if new_payload else None
    db.session.commit()

    return jsonify(new_pair), 200


@auth_bp.post('/logout')
def logout():
    """Revoke the presented refresh token. No-op if missing/invalid (logout
    should be idempotent — never tell the client their token was bad)."""
    data = request.get_json(silent=True) or {}
    refresh_jwt = data.get('refresh_token') or ''

    payload = decode_refresh_token(refresh_jwt)
    if not payload:
        return jsonify({'message': 'logged out'}), 200

    jti = payload.get('jti')
    if jti:
        row = RefreshToken.query.filter_by(jti=jti).first()
        if row and row.revoked_at is None:
            row.revoked_at = datetime.utcnow()
            db.session.commit()

    return jsonify({'message': 'logged out'}), 200


@auth_bp.post('/forgot-password')
def forgot_password():
    """Stub — Phase 2 wires real email. Returns 200 regardless of whether
    the email exists, to avoid leaking valid email addresses."""
    data = request.get_json(force=True)
    email = (data.get('email') or '').strip().lower()
    exists = bool(User.query.filter_by(email=email).first())
    return jsonify({'sent': exists}), 200
