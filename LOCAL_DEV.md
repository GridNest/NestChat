# NestChat Local Development Guide

## Prerequisites

Before you start, ensure you have:

1. **Node.js 20+** installed
   ```bash
   node --version
   ```

2. **pnpm 8+** installed
   ```bash
   npm install -g pnpm
   pnpm --version
   ```

3. **MongoDB Community Server** running locally
   - Download from: https://www.mongodb.com/try/download/community
   - Or use MongoDB Compass: https://www.mongodb.com/products/compass
   - Default port: 27017

---

## Quick Start (3 Terminal Commands)

Open **3 separate terminal windows** and run these commands:

### Terminal 1: Backend API
```bash
cd C:\Users\Home.Vishal_Sahu\Desktop\NestChat
pnpm run dev --filter=@nestchat/server
```

### Terminal 2: Admin Panel
```bash
cd C:\Users\Home.Vishal_Sahu\Desktop\NestChat
pnpm run dev --filter=@nestchat/admin
```

### Terminal 3: Widget Server (Optional - for testing)
```bash
cd C:\Users\Home.Vishal_Sahu\Desktop\NestChat
node widget-server.js
```

---

## Step-by-Step Setup

### Step 1: Install Dependencies

```bash
cd C:\Users\Home.Vishal_Sahu\Desktop\NestChat
pnpm install
```

### Step 2: Start MongoDB

Ensure MongoDB is running on `127.0.0.1:27017`

**Windows Service:**
```bash
# Check if MongoDB is running
net start MongoDB
```

**Or use MongoDB Compass:**
- Connect to: `mongodb://127.0.0.1:27017`
- Database will be created automatically: `nestchat`

### Step 3: Seed Database (First Time Only)

```bash
cd C:\Users\Home.Vishal_Sahu\Desktop\NestChat
pnpm run seed
```

This creates:
- Admin user: `admin@nestchat.com` / `Admin@123`
- Demo client: `demo@example.com` / `Demo@123`

### Step 4: Start Backend API

```bash
cd C:\Users\Home.Vishal_Sahu\Desktop\NestChat
pnpm run dev --filter=@nestchat/server
```

**Expected output:**
```
Server running on port 5000
Environment: development
API URL: http://localhost:5000
Connected to MongoDB
```

### Step 5: Start Admin Panel

```bash
cd C:\Users\Home.Vishal_Sahu\Desktop\NestChat
pnpm run dev --filter=@nestchat/admin
```

**Expected output:**
```
VITE v5.x.x  ready in xxx ms
➜  Local:   http://localhost:3002/
```

### Step 6: Start Widget Server (Optional)

```bash
cd C:\Users\Home.Vishal_Sahu\Desktop\NestChat
node widget-server.js
```

**Expected output:**
```
Widget test server running at http://localhost:3000
Test page: http://localhost:3000/
Widget URL: http://localhost:3000/widget.js
```

---

## Localhost URLs

| Service | URL | Description |
|---------|-----|-------------|
| Backend API | http://localhost:5000 | Express.js server |
| API Health | http://localhost:5000/api/health | Health check endpoint |
| API Status | http://localhost:5000/api/status | Service status |
| Admin Panel | http://localhost:3002 | React admin dashboard |
| Widget Test | http://localhost:3000 | Widget test page |
| Widget JS | http://localhost:3000/widget.js | Widget script |

---

## Login Credentials

### Admin Panel
- **Email:** admin@nestchat.com
- **Password:** Admin@123

### Demo Client
- **Email:** demo@example.com
- **Password:** Demo@123

---

## Testing the APIs

### Test Health Check
```bash
curl http://localhost:5000/api/health
```

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@nestchat.com\",\"password\":\"Admin@123\"}"
```

### Test with Browser
Open http://localhost:5000/api/health in your browser

---

## Environment Configuration

The `.env.development` file is located at:
```
packages/server/.env.development
```

Key settings:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/nestchat
JWT_SECRET=dev-jwt-secret-key-nestchat-2024
```

---

## Troubleshooting

### "MongoDB connection error"
- Ensure MongoDB is running on port 27017
- Check MongoDB service status
- Try connecting with MongoDB Compass

### "Port already in use"
```bash
# Find process using port 5000
netstat -ano | findstr :5000
# Kill the process
taskkill /PID <process_id> /F
```

### "Module not found"
```bash
# Reinstall dependencies
rm -rf node_modules
pnpm install
```

### "Admin panel can't connect to API"
- Ensure backend is running on port 5000
- Check CORS settings in `.env.development`
- Verify API URL in admin panel settings

### Widget not loading
- Ensure widget server is running (port 3000)
- Or use backend directly: http://localhost:5000/widget.js
- Check browser console for errors

---

## Database Management

### View Database in MongoDB Compass
1. Open MongoDB Compass
2. Connect to: `mongodb://127.0.0.1:27017`
3. Select database: `nestchat`

### Collections
- `users` - User accounts
- `clients` - Client configurations
- `knowledgebases` - Knowledge base articles
- `faqs` - Frequently asked questions
- `chats` - Chat sessions
- `chatmessages` - Chat messages
- `inquiries` - Captured leads

### Reset Database
```bash
# Connect to MongoDB
mongosh

# Switch to nestchat database
use nestchat

# Drop all collections
db.dropDatabase()
```

Then re-seed:
```bash
pnpm run seed
```

---

## File Structure

```
NestChat/
├── packages/
│   ├── server/           # Backend API (Express.js)
│   │   ├── src/
│   │   ├── .env.development
│   │   └── package.json
│   ├── widget/           # Widget JavaScript
│   │   └── src/widget.js
│   └── shared/           # Shared types
├── apps/
│   └── admin/            # Admin Panel (React)
├── test-widget.html      # Widget test page
├── widget-server.js      # Widget dev server
└── package.json
```

---

## Next Steps

1. Open Admin Panel: http://localhost:3002
2. Login with admin credentials
3. Create a new client
4. Add knowledge base articles
5. Add FAQs
6. Get widget embed code
7. Test widget on test page

---

## Support

If you encounter issues:
- Check the troubleshooting section above
- Review server logs in Terminal 1
- Check browser console for frontend errors
