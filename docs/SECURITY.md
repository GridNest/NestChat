# NestChat Security Documentation

## Overview
NestChat implements multiple security layers to protect data and prevent attacks.

## Authentication
- JWT (JSON Web Tokens) for API authentication
- Tokens expire after 7 days (configurable)
- Passwords hashed with bcrypt (12 rounds)
- Secure token storage on client side

## Authorization
- Role-based access control (RBAC)
- Roles: super_admin, admin, user
- Middleware validates permissions on protected routes
- Users can only access their assigned client data

## Rate Limiting
- Global rate limit: 100 requests per minute per IP
- Configurable per-route limits
- Returns 429 status with retry-after header
- Prevents brute force and DDoS attacks

## Input Sanitization
- MongoDB injection prevention ($ and . operators stripped)
- XSS protection (HTML tags removed)
- Input validation on all endpoints
- Request body size limits (10mb)

## CORS Configuration
- Configurable allowed origins
- Credentials support for authenticated requests
- Preflight request handling

## Security Headers (Helmet)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: restrict camera, microphone, geolocation
- HSTS in production (1 year max-age)

## Domain Validation
- Widget requests validated against allowed domains
- Development mode allows localhost
- Production requires explicit domain whitelist

## Environment Variables
- Secrets never committed to git
- .env file gitignored
- Production uses Render environment variables
- Sensitive data excluded from logs

## Database Security
- MongoDB Atlas encryption at rest
- IP whitelist for database access
- Strong database user passwords
- Minimal required permissions

## API Security
- All mutation endpoints require authentication
- Admin endpoints require admin role
- Request validation on all inputs
- Error messages don't expose internals

## Widget Security
- Domain validation prevents unauthorized embedding
- Secret key for widget configuration
- Rate limiting on widget endpoints
- No sensitive data exposed to client

## Audit Logging
- All admin actions logged
- Login/logout tracked
- Configuration changes recorded
- Retention policy configurable

## Security Best Practices
1. Change default JWT_SECRET
2. Use strong MongoDB passwords
3. Enable HTTPS in production
4. Regularly rotate API keys
5. Monitor audit logs
6. Keep dependencies updated
7. Use environment-specific configs

## Reporting Security Issues
Contact: security@nestchat.com
