"""
Sample Data for User Models
Contains realistic sample data for testing and development.

NOTE on credentials:
    Plaintext default passwords live in LOGIN_CREDENTIALS below. They are
    DEVELOPMENT-ONLY DEFAULTS and exist solely so seed_database.py can boot
    a working environment. The plaintexts are intentionally weak so it is
    obvious they must be rotated before any deployment.

    The seed script bcrypt-hashes them at run time (no static-salt pbkdf2
    hashes are checked into source any longer). When you run the seeder it
    prints the email/password table to stdout once; capture it then or
    re-run the seeder.
"""

from datetime import datetime


SAMPLE_USERS = [
    {
        'id': 1,
        'email': 'admin@techcorp.com',
        'role': 'corporate',
        'created_at': datetime(2024, 1, 10, 12, 0, 0)
    },
    {
        'id': 2,
        'email': 'sustainability@greenenergy.com',
        'role': 'corporate',
        'created_at': datetime(2024, 1, 15, 14, 30, 0)
    },
    {
        'id': 3,
        'email': 'director@healthtech.com',
        'role': 'corporate',
        'created_at': datetime(2024, 1, 20, 9, 15, 0)
    },
    {
        'id': 4,
        'email': 'csr@edutech.com',
        'role': 'corporate',
        'created_at': datetime(2024, 1, 25, 16, 45, 0)
    },
    {
        'id': 5,
        'email': 'manager@agritech.com',
        'role': 'corporate',
        'created_at': datetime(2024, 1, 30, 11, 20, 0)
    },
    {
        'id': 6,
        'email': 'director@womenempowerment.org',
        'role': 'ngo',
        'created_at': datetime(2024, 1, 10, 12, 0, 0)
    },
    {
        'id': 7,
        'email': 'coordinator@waterforall.org',
        'role': 'ngo',
        'created_at': datetime(2024, 1, 15, 14, 30, 0)
    },
    {
        'id': 8,
        'email': 'program@youthempowerment.org',
        'role': 'ngo',
        'created_at': datetime(2024, 1, 20, 9, 15, 0)
    },
    {
        'id': 9,
        'email': 'medical@healthforall.org',
        'role': 'ngo',
        'created_at': datetime(2024, 1, 25, 16, 45, 0)
    },
    {
        'id': 10,
        'email': 'coordinator@greenearth.org',
        'role': 'ngo',
        'created_at': datetime(2024, 1, 30, 11, 20, 0)
    },
    {
        'id': 11,
        'email': 'admin@sustainalign.local',
        'role': 'admin',
        'created_at': datetime(2024, 1, 1, 0, 0, 0)
    },
    {
        'id': 12,
        'email': 'auditor@regulatory.gov.in',
        'role': 'regulator',
        'created_at': datetime(2024, 1, 5, 10, 0, 0)
    },
    {
        'id': 13,
        'email': 'inspector@csr.gov.in',
        'role': 'regulator',
        'created_at': datetime(2024, 1, 8, 14, 30, 0)
    },
    {
        'id': 14,
        'email': 'guest-ngo@sustainalign.local',
        'role': 'ngo',
        'created_at': datetime(2024, 1, 1, 0, 0, 0)
    },
    {
        'id': 15,
        'email': 'guest-corporate@sustainalign.local',
        'role': 'corporate',
        'created_at': datetime(2024, 1, 1, 0, 0, 0)
    }
]

# Development-only default passwords. Rotate via the seed script BEFORE
# any deployment. These are NEVER hashed in source; the seed script bcrypts
# them at run time and prints the credential table to stdout.
LOGIN_CREDENTIALS = {
    'admin@techcorp.com': 'admin123',
    'sustainability@greenenergy.com': 'green123',
    'director@healthtech.com': 'health123',
    'csr@edutech.com': 'edu123',
    'manager@agritech.com': 'agri123',
    'director@womenempowerment.org': 'women123',
    'coordinator@waterforall.org': 'water123',
    'program@youthempowerment.org': 'youth123',
    'medical@healthforall.org': 'medical123',
    'coordinator@greenearth.org': 'earth123',
    'admin@sustainalign.local': 'admin123',
    'auditor@regulatory.gov.in': 'audit123',
    'inspector@csr.gov.in': 'inspect123',
    'guest-ngo@sustainalign.local': 'guest123',
    'guest-corporate@sustainalign.local': 'guest123'
}


def get_sample_users(hasher=None):
    """Return sample users.

    If `hasher` is provided (a callable taking plaintext password and
    returning a hash), each user dict is enriched with a `password_hash`
    field computed from the matching LOGIN_CREDENTIALS entry. If no
    hasher is given, dicts are returned without password_hash and the
    caller is responsible for setting it before insert.
    """
    if hasher is None:
        return [dict(u) for u in SAMPLE_USERS]

    enriched = []
    for u in SAMPLE_USERS:
        plaintext = LOGIN_CREDENTIALS.get(u['email'])
        if not plaintext:
            raise ValueError(f"No LOGIN_CREDENTIALS entry for {u['email']}")
        enriched.append({**u, 'password_hash': hasher(plaintext)})
    return enriched


def get_login_credentials():
    """Return email:plaintext mapping for dev/testing only."""
    return dict(LOGIN_CREDENTIALS)


def get_all_sample_data(hasher=None):
    """Return all sample data for user models. See get_sample_users."""
    return {
        'users': get_sample_users(hasher=hasher)
    }


def print_credentials_table():
    """Print the dev credential table to stdout. Called by the seed script."""
    print("\n" + "=" * 78)
    print("  DEV LOGIN CREDENTIALS  (NOT FOR PRODUCTION USE)")
    print("=" * 78)
    print(f"  {'EMAIL':<42} {'PASSWORD':<14} {'ROLE'}")
    print("  " + "-" * 74)
    role_by_email = {u['email']: u['role'] for u in SAMPLE_USERS}
    for email, plaintext in LOGIN_CREDENTIALS.items():
        role = role_by_email.get(email, '?')
        print(f"  {email:<42} {plaintext:<14} {role}")
    print("=" * 78)
    print("  Rotate these passwords before any deployment.")
    print("=" * 78 + "\n")
