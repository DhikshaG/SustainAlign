from flask import Blueprint, request, jsonify
from models import db, User
from utils import hash_password, verify_password, create_token, needs_rehash

auth_bp = Blueprint('auth', __name__)


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

    token = create_token({'sub': user.id, 'email': user.email, 'role': user.role})
    return jsonify({'token': token, 'user': user.to_dict()}), 201


@auth_bp.post('/login')
def login():
    data = request.get_json(force=True)
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    user = User.query.filter_by(email=email).first()
    if not user or not verify_password(password, user.password_hash):
        return jsonify({'error': 'Invalid credentials'}), 401

    # Lazy upgrade: legacy pbkdf2 hashes get re-hashed to bcrypt on successful
    # login. Zero user friction; existing seeded accounts migrate transparently.
    if needs_rehash(user.password_hash):
        user.password_hash = hash_password(password)
        db.session.commit()

    token = create_token({'sub': user.id, 'email': user.email, 'role': user.role})
    return jsonify({'token': token, 'user': user.to_dict()}), 200


@auth_bp.post('/forgot-password')
def forgot_password():
    data = request.get_json(force=True)
    email = (data.get('email') or '').strip().lower()
    # In real implementation, generate token and email it
    exists = bool(User.query.filter_by(email=email).first())
    return jsonify({'sent': exists}), 200


