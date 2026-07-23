# NestChat v1.0.0

A production-ready, multi-tenant SaaS chatbot platform that works across multiple websites without modifying source code.

## Features

- **Multi-Client Support** - Manage multiple clients from one dashboard
- **Knowledge Base** - Add website content for chatbot responses
- **FAQ System** - Create frequently asked questions
- **Inquiry Capture** - Capture leads through chatbot conversations
- **Widget Integration** - Easy embed code for any website
- **Analytics** - Track visitors, chats, and conversions
- **Admin Dashboard** - Complete management interface
- **Security** - JWT auth, rate limiting, input sanitization

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Vite
- **Backend:** Node.js, Express.js, TypeScript
- **Database:** MongoDB Atlas (Mongoose ODM)
- **Auth:** JWT (JSON Web Tokens)
- **Deployment:** Render, GitHub Actions

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- MongoDB Atlas account

### Installation

```bash
git clone https://github.com/yourusername/nestchat.git
cd nestchat
pnpm install
cp packages/server/.env.example packages/server/.env
# Edit .env with your values
pnpm run dev
```

### Environment Variables

| Variable | Description | Default |
| --- | --- | --- |
| `NODE_ENV` | development/production | development |
| `PORT` | Server port | 5000 |
| `MONGODB_URI` | MongoDB Atlas connection string | - |
| `JWT_SECRET` | Secret key for JWT tokens | - |
| `JWT_EXPIRES_IN` | Token expiration | 7d |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | - |
| `CLOUDINARY_API_KEY` | Cloudinary API key | - |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | - |
| `CORS_ORIGIN` | Frontend URL | http://localhost:3000 |

## Project Structure

```
nestchat/
  apps/
    admin/          # React admin panel
    widget/         # Widget build output
  packages/
    server/         # Express.js backend
    shared/         # Shared types and utilities
  docs/             # Documentation
```

## API Endpoints

| Group | Description |
| --- | --- |
| `/api/auth/*` | Authentication |
| `/api/clients/*` | Client management |
| `/api/knowledge/*` | Knowledge base |
| `/api/faqs/*` | FAQ management |
| `/api/chat/*` | Chat functionality |
| `/api/inquiry/*` | Inquiry management |
| `/api/analytics/*` | Analytics data |
| `/api/reports/*` | Report generation |
| `/api/health` | Health check |
| `/api/status` | Service status |

## Widget Integration

Add the following code before the closing `</body>` tag:

```html
<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'YOUR_WIDGET_URL/widget.js';
    script.setAttribute('data-client-id', 'YOUR_CLIENT_ID');
    document.head.appendChild(script);
  })();
</script>
```

## Deployment

- **Frontend:** Render Static Site
- **Backend:** Render Web Service
- **Database:** MongoDB Atlas
- **CI/CD:** GitHub Actions

## Development

```bash
pnpm run dev        # Start all services
pnpm run build      # Build all packages
pnpm run test       # Run tests
pnpm run lint       # Lint code
```

## Documentation

- `docs/ARCHITECTURE.md` - System architecture
- `docs/FOLDER_STRUCTURE.md` - Folder structure
- `docs/API.md` - API documentation
- `docs/DEPLOYMENT.md` - Deployment guide
- `docs/INTEGRATION.md` - Widget integration guide
- `docs/SECURITY.md` - Security documentation
- `docs/TROUBLESHOOTING.md` - Common issues and solutions

## License

MIT License

## Version

v1.0.0 - Initial Production Release
