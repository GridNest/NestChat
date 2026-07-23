# NestChat Architecture Document

## Overview

NestChat is a multi-tenant SaaS chatbot platform that allows websites to embed a customizable chat widget. Version 1 focuses on rule-based responses using website data without external AI integration.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENTS (WEBSITES)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │  Website A   │  │  Website B   │  │  Website C   │  ...         │
│  │  (Widget)    │  │  (Widget)    │  │  (Widget)    │               │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘               │
└─────────┼──────────────────┼──────────────────┼─────────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     CDN / STATIC ASSETS                             │
│              widget.js / widget.css / assets                        │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       API GATEWAY (Express)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │ Rate Limiter │  │   JWT Auth   │  │   CORS      │               │
│  └─────────────┘  └─────────────┘  └─────────────┘                │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
          ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Client Service  │    │  Chat Service    │    │  Inquiry Service │
│  (Config/Theme)  │    │  (Knowledge)     │    │  (Lead Capture)  │
└────────┬────────┘    └────────┬────────┘    └────────┬────────┘
         │                      │                      │
         ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       MONGODB ATLAS                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │ Clients   │  │ Knowledge │  │ Chats    │  │ Inquiries │         │
│  │ Configs   │  │ FAQs      │  │ Logs     │  │ Leads     │         │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Monorepo Structure

```
nestchat/
├── apps/
│   ├── widget/                  # Embeddable chat widget (React)
│   ├── web/                     # Main website (React + Vite)
│   └── admin/                   # Admin dashboard (React + Vite)
├── packages/
│   ├── server/                  # Backend API (Express + TypeScript)
│   ├── shared/                  # Shared types, constants, utils
│   └── ui/                      # Shared UI components (optional)
├── docs/                        # Documentation
├── scripts/                     # Build/deploy scripts
├── .github/                     # GitHub Actions workflows
├── package.json                 # Root package.json (workspace)
├── turbo.json                   # Turborepo config
├── tsconfig.json                # Base TypeScript config
└── .env.example                 # Environment variables template
```

### Why This Structure?

1. **Monorepo with Turborepo**: Enables shared code, atomic commits, and optimized builds
2. **Separate Apps**: Widget, Web, and Admin can be developed and deployed independently
3. **Shared Packages**: Types and utilities are shared across all apps, preventing duplication
4. **Scalability**: New apps (mobile, CLI) can be added without restructuring

---

## Database Schema Design

### Entity Relationship Diagram

```
┌──────────────────┐       ┌──────────────────┐
│      Client       │       │    ClientConfig   │
├──────────────────┤       ├──────────────────┤
│ _id              │──┐    │ _id              │
│ name             │  │    │ clientId (FK)    │
│ email            │  │    │ logo             │
│ password (hash)  │  │    │ brandColor       │
│ company          │  │    │ secondaryColor   │
│ phone            │  │    │ botName          │
│ isActive         │  ├───>│ greetingMessage  │
│ createdAt        │       │ theme            │
│ updatedAt        │       │ position         │
└──────────────────┘       │ defaultLanguage  │
                           │ allowedLanguages │
                           │ inquiryApiUrl    │
                           │ inquiryApiKey    │
                           │ isActive         │
                           └──────────────────┘

┌──────────────────┐       ┌──────────────────┐
│     Knowledge     │       │       FAQ         │
├──────────────────┤       ├──────────────────┤
│ _id              │       │ _id              │
│ clientId (FK)    │       │ clientId (FK)    │
│ pageName         │       │ category         │
│ slug             │       │ question         │
│ title            │       │ answer           │
│ content          │       │ answerHi (Hindi) │
│ metaDescription  │       │ keywords         │
│ tags             │       │ isActive         │
│ language         │       │ priority         │
│ isActive         │       │ createdAt        │
│ createdAt        │       │ updatedAt        │
│ updatedAt        │       └──────────────────┘
└──────────────────┘

┌──────────────────┐       ┌──────────────────┐
│      Chat         │       │    ChatMessage    │
├──────────────────┤       ├──────────────────┤
│ _id              │──┐    │ _id              │
│ clientId (FK)    │  │    │ chatId (FK)      │
│ sessionId        │  ├───>│ sender           │
│ visitorId        │       │ content          │
│ visitorInfo      │       │ messageType      │
│ status           │       │ metadata         │
│ startedAt        │       │ timestamp        │
│ endedAt          │       └──────────────────┘
│ language         │
└──────────────────┘

┌──────────────────┐       ┌──────────────────┐
│     Inquiry       │       │   UnansweredQ    │
├──────────────────┤       ├──────────────────┤
│ _id              │       │ _id              │
│ clientId (FK)    │       │ clientId (FK)    │
│ name             │       │ question         │
│ email            │       │ sessionId        │
│ phone            │       │ visitorId        │
│ country          │       │ timestamp        │
│ state            │       │ convertedToFaq   │
│ service          │       │ faqId            │
│ details          │       │ createdAt        │
│ company          │       └──────────────────┘
│ source           │
│ status           │
│ createdAt        │
└──────────────────┘

┌──────────────────┐
│      User         │
├──────────────────┤
│ _id              │
│ email            │
│ password (hash)  │
│ name             │
│ role             │
│ lastLogin        │
│ createdAt        │
│ updatedAt        │
└──────────────────┘
```

---

## API Design

### Authentication APIs

```
POST   /api/auth/register        # Register new client
POST   /api/auth/login           # Login (returns JWT)
POST   /api/auth/refresh         # Refresh token
GET    /api/auth/me               # Get current user
PUT    /api/auth/password        # Change password
```

### Client Management APIs (Admin)

```
GET    /api/clients               # List all clients (admin)
POST   /api/clients               # Create client
GET    /api/clients/:id           # Get client details
PUT    /api/clients/:id           # Update client
DELETE /api/clients/:id           # Delete client (soft)
GET    /api/clients/:id/config    # Get client config
PUT    /api/clients/:id/config    # Update client config
```

### Widget Config APIs (Public - by clientId)

```
GET    /api/widget/:clientId/config    # Get widget configuration
GET    /api/widget/:clientId/faq       # Get FAQs for widget
GET    /api/widget/:clientId/knowledge # Get knowledge base
```

### Chat APIs

```
POST   /api/chat/start            # Start new chat session
POST   /api/chat/message          # Send message & get response
GET    /api/chat/:sessionId       # Get chat history
POST   /api/chat/:sessionId/end   # End chat session
```

### Inquiry APIs

```
POST   /api/inquiry               # Submit inquiry (from widget)
GET    /api/inquiries             # List inquiries (admin)
GET    /api/inquiries/:id         # Get inquiry details
PUT    /api/inquiries/:id         # Update inquiry status
POST   /api/inquiry/external      # Forward to external API
```

### Knowledge Base APIs (Admin)

```
GET    /api/knowledge             # List knowledge entries
POST    /api/knowledge            # Create knowledge entry
PUT    /api/knowledge/:id         # Update knowledge entry
DELETE /api/knowledge/:id         # Delete knowledge entry
POST   /api/knowledge/bulk        # Bulk import
```

### FAQ APIs (Admin)

```
GET    /api/faqs                  # List FAQs
POST   /api/faqs                  # Create FAQ
PUT    /api/faqs/:id              # Update FAQ
DELETE /api/faqs/:id              # Delete FAQ
POST   /api/faqs/bulk             # Bulk import
```

### Analytics APIs (Admin)

```
GET    /api/analytics/overview     # Dashboard overview
GET    /api/analytics/chats        # Chat statistics
GET    /api/analytics/leads        # Lead statistics
GET    /api/analytics/unanswered   # Unanswered questions
POST   /api/analytics/unanswered/:id/convert # Convert to FAQ
```

### Chat Logs APIs (Admin)

```
GET    /api/logs/chats            # List chat logs
GET    /api/logs/chats/:id        # Get chat details
GET    /api/logs/export           # Export logs
```

---

## Knowledge Engine Design

### How It Works (No AI - Version 1)

```
User Question
     │
     ▼
┌─────────────────┐
│ Input Processing │ ──> Normalize, lowercase, remove special chars
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  FAQ Matching    │ ──> Keyword matching, fuzzy search
└────────┬────────┘
         │ (if no match)
         ▼
┌─────────────────┐
│ Knowledge Search │ ──> Search page titles, content, tags
└────────┬────────┘
         │ (if no match)
         ▼
┌─────────────────┐
│  Quick Actions   │ ──> Match against predefined actions
└────────┬────────┘
         │ (if no match)
         ▼
┌─────────────────┐
│   Unknown Q      │ ──> Prompt for inquiry
└─────────────────┘
```

### Matching Algorithm

```typescript
// Simplified matching logic
function findAnswer(question: string, clientId: string) {
  const normalized = normalizeQuestion(question);
  
  // Step 1: Exact FAQ match
  const exactFaq = faqCollection.findOne({
    clientId,
    keywords: { $in: extractKeywords(normalized) }
  });
  if (exactFaq) return exactFaq.answer;
  
  // Step 2: Fuzzy FAQ match
  const fuzzyFaq = fuzzyMatch(normalized, faqCollection);
  if (fuzzyFaq && fuzzyFaq.score > 0.7) return fuzzyFaq.answer;
  
  // Step 3: Knowledge base search
  const knowledge = knowledgeCollection.findOne({
    clientId,
    $text: { $search: normalized }
  });
  if (knowledge) return formatKnowledgeResponse(knowledge);
  
  // Step 4: Quick action match
  const action = matchQuickAction(normalized);
  if (action) return action.response;
  
  // Step 5: Unknown - prompt for inquiry
  return getUnknownResponse();
}
```

---

## Widget Architecture

### Embedding Mechanism

```html
<!-- Website adds this single line -->
<script 
  src="https://cdn.nestchat.com/widget.js" 
  data-client-id="CLIENT_ID">
</script>
```

### Widget Internal Structure

```
widget.js (entry point)
     │
     ├── Loads widget.css (styles)
     ├── Creates shadow DOM container
     ├── Initializes React app inside shadow DOM
     └── Connects to NestChat API
```

### Widget State Management

```
┌─────────────────────────────────────┐
│           Widget Store               │
├─────────────────────────────────────┤
│  isOpen: boolean                     │
│  language: 'en' | 'hi'              │
│  messages: Message[]                 │
│  isTyping: boolean                   │
│  currentView: 'chat' | 'inquiry'    │
│  clientConfig: ClientConfig          │
│  sessionId: string                   │
└─────────────────────────────────────┘
```

---

## Security Design

### Authentication Flow

```
Client Login
     │
     ▼
POST /api/auth/login { email, password }
     │
     ▼
Validate Credentials (bcrypt compare)
     │
     ▼
Generate JWT (userId, role, clientId)
     │
     ▼
Return { accessToken, refreshToken }
     │
     ▼
Client stores in httpOnly cookie
     │
     ▼
Subsequent requests include Authorization: Bearer <token>
     │
     ▼
Middleware verifies JWT & attaches user to request
```

### Rate Limiting

```
Global: 100 requests/15 min per IP
Auth: 5 requests/15 min per IP (login/register)
Chat: 30 messages/minute per session
Widget Config: 100 requests/hour per clientId
```

### Input Validation

- All inputs validated with Zod schemas
- SQL injection prevented (MongoDB parameterized queries)
- XSS prevention (sanitized output)
- CORS configured per client domain

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        GITHUB                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ widget branch│  │  main branch │  │ admin branch │            │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘            │
└─────────┼──────────────────┼──────────────────┼───────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                     RENDER                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ Widget CDN   │  │  API Server  │  │ Admin Panel  │            │
│  │ (Static)     │  │ (Node.js)    │  │ (Static)     │            │
│  └─────────────┘  └──────┬───────┘  └─────────────┘            │
└──────────────────────────┼───────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   MONGODB ATLAS                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  nestchat_db                                             │   │
│  │  ├── clients                                             │   │
│  │  ├── client_configs                                      │   │
│  │  ├── knowledge                                           │   │
│  │  ├── faqs                                                │   │
│  │  ├── chats                                               │   │
│  │  ├── chat_messages                                       │   │
│  │  ├── inquiries                                           │   │
│  │  ├── unanswered_questions                                │   │
│  │  └── users                                               │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Environment Variables

```env
# Server
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000

# MongoDB
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/nestchat

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=30d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Widget
WIDGET_CDN_URL=http://localhost:3001

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3002

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

---

## Implementation Milestones

### Milestone 1: Project Setup
- Initialize monorepo with Turborepo
- Set up shared packages (types, utils)
- Configure TypeScript, ESLint, Prettier
- Set up MongoDB connection

### Milestone 2: Backend Core
- User authentication (register, login, JWT)
- Client management CRUD
- Client config management
- Middleware (auth, validation, rate limiting)

### Milestone 3: Knowledge Engine
- Knowledge base CRUD
- FAQ management
- Search/matching algorithm
- Quick actions system

### Milestone 4: Chat System
- Chat session management
- Message handling
- Response generation (rule-based)
- Conversation flow

### Milestone 5: Inquiry System
- Conversational inquiry collection
- Inquiry submission
- External API forwarding
- Unanswered questions tracking

### Milestone 6: Widget Development
- Widget UI (React)
- Shadow DOM encapsulation
- API integration
- Theming system
- Language support

### Milestone 7: Admin Dashboard
- Login/Auth
- Dashboard overview
- Client management UI
- Knowledge base UI
- FAQ management UI
- Chat logs UI
- Inquiry logs UI
- Analytics UI
- Widget generator

### Milestone 8: Polish & Deploy
- Error handling
- Performance optimization
- Security hardening
- Documentation
- Deployment setup
