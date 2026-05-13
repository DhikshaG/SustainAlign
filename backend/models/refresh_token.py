"""
Refresh-token persistence for rotating-token authentication.

Design:
    - Each successful login (or signup, or /refresh) creates one row.
    - jti is the unique identifier embedded in the refresh JWT.
    - On /refresh, the incoming jti must exist, not be revoked, and not be
      expired. We then mark it revoked and issue a new pair (new jti row).
    - replaced_by_jti points to the successor; useful for theft-detection
      audits (if a revoked token gets reused, that's evidence the chain
      was forked, indicating compromise -> revoke all tokens for the user).

The actual JWT signing/decoding lives in utils.py; this model only tracks
state for revocation and rotation.
"""

from datetime import datetime

from .base import db


class RefreshToken(db.Model):
    __tablename__ = 'refresh_tokens'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    jti = db.Column(db.String(64), unique=True, nullable=False, index=True)
    issued_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=False)
    revoked_at = db.Column(db.DateTime, nullable=True)
    replaced_by_jti = db.Column(db.String(64), nullable=True)
    user_agent = db.Column(db.String(255), nullable=True)
    ip_address = db.Column(db.String(64), nullable=True)

    def is_active(self) -> bool:
        return self.revoked_at is None and self.expires_at > datetime.utcnow()

    def revoke(self, replaced_by: str | None = None) -> None:
        self.revoked_at = datetime.utcnow()
        if replaced_by:
            self.replaced_by_jti = replaced_by

    def to_dict(self) -> dict:
        return {
            'id': self.id,
            'user_id': self.user_id,
            'jti': self.jti,
            'issued_at': self.issued_at.isoformat() if self.issued_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'revoked_at': self.revoked_at.isoformat() if self.revoked_at else None,
            'replaced_by_jti': self.replaced_by_jti,
            'active': self.is_active(),
        }
