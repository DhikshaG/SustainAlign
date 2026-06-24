# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** open a public GitHub issue
2. Email the maintainers with details of the vulnerability
3. Include steps to reproduce if possible
4. Allow reasonable time for a fix before public disclosure

## Security Measures

- JWT tokens with short-lived access tokens (15 min) and rotating refresh tokens
- Argon2 password hashing
- Rate limiting on all endpoints
- Input validation via Zod schemas
- CORS configuration with credentials
- Helmet.js security headers
- File upload MIME validation and size limits
- Graceful shutdown handlers
