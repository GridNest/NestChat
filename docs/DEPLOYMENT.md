# NestChat Deployment Guide

## Overview
NestChat is designed for deployment on Render with MongoDB Atlas.

## Prerequisites
- GitHub account
- Render account (https://render.com)
- MongoDB Atlas account (https://mongodb.com/atlas)
- Cloudinary account (https://cloudinary.com)

## Step 1: MongoDB Atlas Setup
1. Create free cluster
2. Create database user
3. Whitelist IP addresses (0.0.0.0/0 for Render)
4. Get connection string
5. Create database named "nestchat"

## Step 2: Cloudinary Setup
1. Create account
2. Get cloud name, API key, API secret
3. Create upload preset (optional)

## Step 3: GitHub Setup
1. Push code to GitHub repository
2. Ensure .env is in .gitignore

## Step 4: Deploy Backend on Render
1. Create new Web Service
2. Connect GitHub repository
3. Configure:
   - Name: nestchat-api
   - Region: Oregon (or closest)
   - Branch: main
   - Build Command: pnpm install && pnpm run build
   - Start Command: cd packages/server && pnpm start
4. Add environment variables:
   - NODE_ENV=production
   - PORT=10000
   - MONGODB_URI=your-atlas-uri
   - JWT_SECRET=your-secret
   - CLOUDINARY_CLOUD_NAME=your-cloud
   - CLOUDINARY_API_KEY=your-key
   - CLOUDINARY_API_SECRET=your-secret
5. Create service

## Step 5: Deploy Admin Panel on Render
1. Create new Static Site
2. Connect GitHub repository
3. Configure:
   - Name: nestchat-admin
   - Branch: main
   - Build Command: pnpm install && pnpm run build --filter=@nestchat/admin
   - Publish Directory: apps/admin/dist
4. Create service

## Step 6: Deploy Widget
The widget is a static JavaScript file.
Options:
1. Host on Render Static Site
2. Host on CDN
3. Include in backend public folder

## Step 7: Configure Custom Domains (Optional)
1. Add domain in Render
2. Update DNS records
3. Update CORS_ORIGIN in backend

## Environment Variables Reference
| Variable | Description |
|----------|-------------|
| NODE_ENV | Environment mode (production/development) |
| PORT | Server port (default: 10000) |
| MONGODB_URI | MongoDB Atlas connection string |
| JWT_SECRET | Secret key for JWT token generation |
| CLOUDINARY_CLOUD_NAME | Cloudinary cloud name |
| CLOUDINARY_API_KEY | Cloudinary API key |
| CLOUDINARY_API_SECRET | Cloudinary API secret |
| CORS_ORIGIN | Allowed CORS origins (comma-separated) |

## Post-Deployment Verification
1. Check /api/health endpoint
2. Check /api/status endpoint
3. Test admin login
4. Test widget on a test page

## Common Issues
- CORS errors: Check CORS_ORIGIN matches frontend URL
- MongoDB connection: Ensure IP whitelist includes Render
- Build failures: Check Node.js version is 20

## Performance Tips
- Enable Render auto-scaling
- Use MongoDB Atlas M10+ for production
- Enable Cloudinary auto-optimization
