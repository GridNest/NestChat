import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

function loadEnv(): void {
  const envFile = process.env.NODE_ENV === 'production' ? '.env' : '.env.development';

  const possiblePaths = [
    path.join(__dirname, `../../${envFile}`),
    path.join(__dirname, `../../../${envFile}`),
    path.join(process.cwd(), envFile),
    path.join(process.cwd(), 'packages/server', envFile),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      dotenv.config({ path: p });
      return;
    }
  }
}

loadEnv();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  API_URL: process.env.API_URL || 'http://localhost:5000',

  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/nestchat',

  JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',

  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3002'],

  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
};

export function validateEnv() {
  const required = ['MONGODB_URI', 'JWT_SECRET'];
  const placeholderValues = [
    'your-super-secret-jwt-key-change-this',
    'your-super-secret-jwt-key-change-this-in-production',
    'fallback-secret-change-in-production',
    'fallback-refresh-secret',
    'dev-jwt-secret-key-nestchat-2024',
    'dev-refresh-secret-key-nestchat-2024',
  ];

  const missing = required.filter(key => {
    const val = process.env[key];
    return !val || placeholderValues.includes(val);
  });

  if (missing.length > 0) {
    console.warn(`[WARN] Some environment variables are missing or using placeholder values: ${missing.join(', ')}`);
    if (env.NODE_ENV === 'production') {
      throw new Error(`Missing or placeholder environment variables in production: ${missing.join(', ')}`);
    }
  }
}
