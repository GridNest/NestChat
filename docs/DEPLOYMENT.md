# NestChat Deployment Guide

## Prerequisites

- Node.js 18+
- pnpm 8+
- MongoDB Atlas account
- Cloudinary account
- Render account
- GitHub account

---

## Environment Setup

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/nestchat.git
cd nestchat
pnpm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` in each package:

```bash
cp .env.example packages/server/.env
```

Fill in the values:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/nestchat
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
```

### 3. Database Setup

```bash
# Seed database with sample data
pnpm run seed
```

---

## Development

```bash
# Start all apps in development mode
pnpm run dev

# Start only server
pnpm run dev --filter=@nestchat/server

# Start only widget
pnpm run dev --filter=@nestchat/widget

# Start only admin
pnpm run dev --filter=@nestchat/admin
```

---

## Production Build

```bash
# Build all packages
pnpm run build

# Build specific package
pnpm run build --filter=@nestchat/server
```

---

## Render Deployment

### 1. API Server

1. Create new Web Service on Render
2. Connect GitHub repository
3. Configure:
   - **Name**: nestchat-api
   - **Runtime**: Node
   - **Build Command**: `pnpm install && pnpm run build --filter=@nestchat/server`
   - **Start Command**: `pnpm run start --filter=@nestchat/server`
   - **Environment Variables**: Add all from `.env`

### 2. Widget (Static Site)

1. Create new Static Site on Render
2. Connect GitHub repository
3. Configure:
   - **Name**: nestchat-widget
   - **Build Command**: `pnpm install && pnpm run build --filter=@nestchat/widget`
   - **Publish Directory**: `apps/widget/dist`

### 3. Admin Panel (Static Site)

1. Create new Static Site on Render
2. Connect GitHub repository
3. Configure:
   - **Name**: nestchat-admin
   - **Build Command**: `pnpm install && pnpm run build --filter=@nestchat/admin`
   - **Publish Directory**: `apps/admin/dist`

---

## MongoDB Atlas Setup

### 1. Create Cluster

1. Log in to MongoDB Atlas
2. Create new cluster (free tier M0)
3. Create database user
4. Whitelist IP addresses (0.0.0.0/0 for development)

### 2. Get Connection String

```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/nestchat?retryWrites=true&w=majority
```

### 3. Create Indexes

```javascript
// Run in MongoDB shell or Atlas UI
db.clients.createIndex({ "email": 1 }, { unique: true });
db.clientconfigs.createIndex({ "clientId": 1 }, { unique: true });
db.knowledges.createIndex({ "clientId": 1, "content": "text" });
db.faqs.createIndex({ "clientId": 1, "keywords": 1 });
db.chats.createIndex({ "sessionId": 1 });
db.chats.createIndex({ "clientId": 1, "createdAt": -1 });
db.inquiries.createIndex({ "clientId": 1, "createdAt": -1 });
db.unansweredquestions.createIndex({ "clientId": 1, "count": -1 });
```

---

## Cloudinary Setup

1. Create Cloudinary account
2. Get credentials from dashboard
3. Create upload presets:
   - `nestchat_logos` (for client logos)
   - `nestchat_assets` (for general assets)

---

## Widget Embedding

After deployment, websites can embed the widget:

```html
<script 
  src="https://nestchat-widget.onrender.com/widget.js" 
  data-client-id="YOUR_CLIENT_ID">
</script>
```

---

## Custom Domain Setup

### API
1. Add custom domain in Render
2. Update CORS origins
3. Update widget API URL

### Widget
1. Add custom domain in Render
2. Update CDN URL in admin settings

---

## Monitoring

### Health Check Endpoint
```http
GET /api/health

Response:
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z",
  "uptime": 86400
}
```

### Logs
- Render provides built-in log viewing
- Winston logs to console in production
- Consider adding external logging service (Sentry, LogRocket)

---

## Security Checklist

- [ ] JWT secrets are strong and unique
- [ ] MongoDB connection string is secure
- [ ] CORS is configured for production domains only
- [ ] Rate limiting is enabled
- [ ] Input validation is in place
- [ ] HTTPS is enforced
- [ ] Environment variables are not exposed
- [ ] Database backups are enabled

---

## Backup Strategy

### MongoDB Atlas
- Enable continuous backups
- Set up scheduled snapshots
- Test restore process

### Code
- GitHub repository is backup
- Tag releases for versioning
