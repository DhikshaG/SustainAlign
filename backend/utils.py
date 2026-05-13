import os
import hashlib
import hmac
from datetime import datetime, timedelta
import bcrypt
import jwt
from flask import g, jsonify


def current_user():
    """Return the User attached to flask.g by auth_middleware.enforce_auth.

    Routes guarded by enforce_auth (i.e. anything under /api/* except the
    public allowlist) can rely on this returning a User. Endpoints that may
    legitimately run unauthenticated should still tolerate None.
    """
    return getattr(g, 'user', None)


# Bcrypt cost factor. 12 ~ 250ms on modern hardware. Tune up over time.
_BCRYPT_ROUNDS = 12

# Legacy pbkdf2 hashes (pre-Phase-0) used a fixed salt. We keep the verifier
# for a lazy-upgrade flow: on successful login with a legacy hash, callers
# should re-hash with bcrypt and persist. Detection is by prefix: bcrypt
# hashes always start with "$2".
_LEGACY_FIXED_SALT = b'static-salt'


def _is_bcrypt_hash(stored: str) -> bool:
    return stored.startswith('$2')


def hash_password(password: str) -> str:
    """Hash a password with bcrypt. Always produces a bcrypt-format hash."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=_BCRYPT_ROUNDS)).decode('utf-8')


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a password against either a bcrypt or legacy pbkdf2 hash."""
    if not password_hash:
        return False
    if _is_bcrypt_hash(password_hash):
        try:
            return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
        except (ValueError, TypeError):
            return False
    legacy = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), _LEGACY_FIXED_SALT, 100_000).hex()
    return hmac.compare_digest(legacy, password_hash)


def needs_rehash(password_hash: str) -> bool:
    """Return True if the stored hash should be upgraded to bcrypt on next login."""
    return not _is_bcrypt_hash(password_hash or '')


def _get_secret() -> str:
    """Return SECRET_KEY. In production it MUST be set; in dev we allow a fallback."""
    secret = os.environ.get('SECRET_KEY')
    if secret:
        return secret
    if os.environ.get('FLASK_ENV', '').lower() == 'production':
        raise RuntimeError("SECRET_KEY is required in production")
    return 'dev-secret-do-not-use-in-prod'


def create_token(payload: dict, expires_minutes: int = 60 * 24) -> str:
    """Create a signed JWT. Defaults to 24h expiry; pass 15 for short access tokens."""
    secret = _get_secret()
    exp = datetime.utcnow() + timedelta(minutes=expires_minutes)
    to_encode = {**payload, 'exp': exp, 'iat': datetime.utcnow()}
    return jwt.encode(to_encode, secret, algorithm='HS256')


def decode_token(token: str) -> dict | None:
    if not token:
        return None
    secret = _get_secret()
    try:
        return jwt.decode(token, secret, algorithms=['HS256'])
    except Exception:
        return None


def api_response(data=None, message="", status_code=200, error=None):
    """Standard API response format"""
    response = {
        "success": status_code < 400,
        "message": message,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    if data is not None:
        response["data"] = data
    
    if error:
        response["error"] = error
    
    return jsonify(response), status_code


def validate_required_fields(data, required_fields):
    """Validate that required fields are present in request data"""
    missing_fields = []
    for field in required_fields:
        if field not in data or data[field] is None or data[field] == "":
            missing_fields.append(field)
    
    if missing_fields:
        return False, f"Missing required fields: {', '.join(missing_fields)}"
    
    return True, None


def validate_email(email):
    """Basic email validation"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def sanitize_filename(filename):
    """Sanitize filename for safe storage"""
    import re
    # Remove or replace unsafe characters
    filename = re.sub(r'[^\w\-_\.]', '_', filename)
    # Limit length
    if len(filename) > 255:
        name, ext = os.path.splitext(filename)
        filename = name[:255-len(ext)] + ext
    return filename


def format_currency(amount, currency="INR"):
    """Format currency amount for display"""
    currency_symbols = {
        "INR": "₹",
        "USD": "$",
        "EUR": "€",
        "GBP": "£",
        "AED": "د.إ",
        "JPY": "¥"
    }
    
    symbol = currency_symbols.get(currency, currency)
    
    if currency == "INR":
        # Indian numbering system
        if amount >= 10000000:  # 1 crore
            return f"{symbol}{amount/10000000:.2f} Cr"
        elif amount >= 100000:  # 1 lakh
            return f"{symbol}{amount/100000:.2f} L"
        else:
            return f"{symbol}{amount:,.2f}"
    else:
        return f"{symbol}{amount:,.2f}"


def calculate_budget_splits(budget_amount, splits):
    """Calculate actual amounts from budget splits percentages"""
    if not splits or not budget_amount:
        return {}
    
    calculated_splits = {}
    for category, percentage in splits.items():
        calculated_splits[category] = round((budget_amount * percentage) / 100, 2)
    
    return calculated_splits


def validate_sdg_list(sdg_list):
    """Validate SDG list against known SDGs"""
    valid_sdgs = [
        'No Poverty', 'Zero Hunger', 'Good Health', 'Quality Education',
        'Clean Water', 'Affordable Energy', 'Decent Work', 'Industry & Innovation',
        'Reduced Inequalities', 'Sustainable Cities', 'Responsible Consumption',
        'Climate Action', 'Life Below Water', 'Life On Land', 'Peace & Justice', 'Partnerships'
    ]
    
    if not isinstance(sdg_list, list):
        return False, "SDG list must be an array"
    
    invalid_sdgs = [sdg for sdg in sdg_list if sdg not in valid_sdgs]
    if invalid_sdgs:
        return False, f"Invalid SDGs: {', '.join(invalid_sdgs)}"
    
    return True, None


