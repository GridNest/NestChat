# NestChat API Documentation

## Base URL

```
Development: http://localhost:5000/api
Production: https://api.nestchat.com/api
```

## Authentication

All protected routes require JWT token in header:
```
Authorization: Bearer <token>
```

---

## Auth Endpoints

### Register Client
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "company": "Acme Corp",
  "phone": "+1234567890"
}

Response 201:
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "name": "John Doe",
      "email": "john@example.com",
      "company": "Acme Corp",
      "role": "client"
    },
    "client": {
      "id": "client_abc",
      "name": "Acme Corp"
    },
    "tokens": {
      "accessToken": "eyJ...",
      "refreshToken": "eyJ..."
    }
  }
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response 200:
{
  "success": true,
  "data": {
    "user": { ... },
    "client": { ... },
    "tokens": {
      "accessToken": "eyJ...",
      "refreshToken": "eyJ..."
    }
  }
}
```

### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": {
    "user": { ... },
    "client": { ... }
  }
}
```

---

## Widget Endpoints (Public)

### Get Widget Configuration
```http
GET /api/widget/:clientId/config

Response 200:
{
  "success": true,
  "data": {
    "clientName": "Acme Corp",
    "logo": "https://cdn.nestchat.com/logos/acme.png",
    "brandColor": "#3B82F6",
    "secondaryColor": "#1E40AF",
    "botName": "Acme Assistant",
    "greetingMessage": "Hello! How can I help you today?",
    "theme": "light",
    "position": "bottom-right",
    "defaultLanguage": "en",
    "allowedLanguages": ["en", "hi"],
    "quickActions": [
      { "id": "services", "label": "Our Services", "icon": "briefcase" },
      { "id": "pricing", "label": "Pricing", "icon": "dollar" },
      { "id": "contact", "label": "Contact Us", "icon": "phone" }
    ]
  }
}
```

### Get FAQs for Widget
```http
GET /api/widget/:clientId/faq

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "faq_1",
      "category": "pricing",
      "question": "What are your pricing plans?",
      "answer": "We offer three plans: Basic ($99/mo), Pro ($199/mo), and Enterprise (custom).",
      "keywords": ["price", "cost", "plan", "pricing"]
    }
  ]
}
```

### Get Knowledge Base
```http
GET /api/widget/:clientId/knowledge

Response 200:
{
  "success": true,
  "data": [
    {
      "id": "kb_1",
      "pageName": "services",
      "slug": "services",
      "title": "Our Services",
      "content": "We offer web development, mobile apps, and consulting...",
      "tags": ["services", "development", "mobile"]
    }
  ]
}
```

---

## Chat Endpoints

### Start Chat Session
```http
POST /api/chat/start
Content-Type: application/json

{
  "clientId": "client_abc",
  "sessionId": "session_xyz",
  "visitorId": "visitor_123",
  "language": "en",
  "visitorInfo": {
    "userAgent": "...",
    "referrer": "https://example.com",
    "url": "https://example.com/services"
  }
}

Response 201:
{
  "success": true,
  "data": {
    "chatId": "chat_789",
    "sessionId": "session_xyz",
    "welcomeMessage": {
      "id": "msg_001",
      "sender": "bot",
      "content": "Hello! Welcome to Acme Corp. How can I help you?",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  }
}
```

### Send Message
```http
POST /api/chat/message
Content-Type: application/json

{
  "chatId": "chat_789",
  "sessionId": "session_xyz",
  "clientId": "client_abc",
  "content": "What services do you offer?",
  "language": "en"
}

Response 200:
{
  "success": true,
  "data": {
    "userMessage": {
      "id": "msg_002",
      "sender": "user",
      "content": "What services do you offer?",
      "timestamp": "2024-01-15T10:30:05Z"
    },
    "botMessage": {
      "id": "msg_003",
      "sender": "bot",
      "content": "We offer the following services:\n\n1. Web Development\n2. Mobile App Development\n3. UI/UX Design\n4. Digital Marketing\n\nWould you like to know more about any specific service?",
      "timestamp": "2024-01-15T10:30:06Z",
      "metadata": {
        "matchedType": "knowledge",
        "matchedId": "kb_services"
      }
    }
  }
}
```

### Get Chat History
```http
GET /api/chat/:sessionId?clientId=client_abc

Response 200:
{
  "success": true,
  "data": {
    "chatId": "chat_789",
    "messages": [
      {
        "id": "msg_001",
        "sender": "bot",
        "content": "Hello! Welcome to Acme Corp.",
        "timestamp": "2024-01-15T10:30:00Z"
      },
      {
        "id": "msg_002",
        "sender": "user",
        "content": "What services do you offer?",
        "timestamp": "2024-01-15T10:30:05Z"
      }
    ]
  }
}
```

---

## Inquiry Endpoints

### Submit Inquiry
```http
POST /api/inquiry
Content-Type: application/json

{
  "clientId": "client_abc",
  "sessionId": "session_xyz",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "country": "India",
  "state": "Maharashtra",
  "service": "Web Development",
  "details": "Need a corporate website with 10 pages",
  "company": "Acme Corp",
  "source": "chatbot"
}

Response 201:
{
  "success": true,
  "data": {
    "inquiryId": "inq_456",
    "message": "Thank you! Our team will contact you within 24 hours.",
    "externalApiStatus": "forwarded"
  }
}
```

---

## Admin Endpoints

### Get Dashboard Overview
```http
GET /api/analytics/overview?clientId=client_abc&period=7d
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": {
    "visitors": 1250,
    "chats": 340,
    "leads": 45,
    "questions": 890,
    "unanswered": 23,
    "avgResponseTime": "1.2s",
    "satisfactionRate": 87,
    "trend": {
      "visitors": "+12%",
      "chats": "+8%",
      "leads": "+15%"
    }
  }
}
```

### List Clients
```http
GET /api/clients?page=1&limit=10&search=acme
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": {
    "clients": [
      {
        "id": "client_abc",
        "name": "Acme Corp",
        "email": "john@example.com",
        "company": "Acme Corp",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00Z",
        "stats": {
          "totalChats": 450,
          "totalLeads": 32
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

### Create Knowledge Entry
```http
POST /api/knowledge
Authorization: Bearer <token>
Content-Type: application/json

{
  "clientId": "client_abc",
  "pageName": "services",
  "slug": "web-development",
  "title": "Web Development Services",
  "content": "We build custom websites using React, Next.js, and modern technologies...",
  "tags": ["web", "development", "react"],
  "language": "en"
}

Response 201:
{
  "success": true,
  "data": {
    "id": "kb_789",
    "pageName": "web-development",
    "title": "Web Development Services"
  }
}
```

### Create FAQ
```http
POST /api/faqs
Authorization: Bearer <token>
Content-Type: application/json

{
  "clientId": "client_abc",
  "category": "pricing",
  "question": "Do you offer discounts?",
  "answer": "Yes, we offer 10% discount for annual plans and 20% for startups.",
  "answerHi": "Haan, hum annual plans par 10% aur startups par 20% discount dete hain.",
  "keywords": ["discount", "offer", "deal"],
  "priority": 1
}

Response 201:
{
  "success": true,
  "data": {
    "id": "faq_123",
    "question": "Do you offer discounts?"
  }
}
```

### Get Unanswered Questions
```http
GET /api/analytics/unanswered?clientId=client_abc&page=1
Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": {
    "questions": [
      {
        "id": "uq_123",
        "question": "Do you support cryptocurrency payments?",
        "count": 15,
        "firstAsked": "2024-01-10T00:00:00Z",
        "lastAsked": "2024-01-15T00:00:00Z",
        "convertedToFaq": false
      }
    ]
  }
}
```

### Convert Unanswered to FAQ
```http
POST /api/analytics/unanswered/:id/convert
Authorization: Bearer <token>
Content-Type: application/json

{
  "category": "payment",
  "answer": "Yes, we accept cryptocurrency payments through our partner BitPay.",
  "keywords": ["crypto", "bitcoin", "payment"]
}

Response 200:
{
  "success": true,
  "data": {
    "faqId": "faq_456",
    "message": "Unanswered question converted to FAQ"
  }
}
```

---

## Error Responses

### Validation Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

### Authentication Error
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token"
  }
}
```

### Not Found Error
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found"
  }
}
```

### Rate Limit Error
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "retryAfter": 60
  }
}
```
