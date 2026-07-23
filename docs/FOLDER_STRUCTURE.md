# NestChat Folder Structure

## Complete Directory Tree

```
nestchat/
│
├── .github/
│   └── workflows/
│       ├── ci.yml                    # CI pipeline
│       ├── deploy-api.yml            # Deploy API to Render
│       └── deploy-widget.yml         # Deploy widget to CDN
│
├── apps/
│   │
│   ├── widget/                       # Embeddable Chat Widget
│   │   ├── public/
│   │   │   └── favicon.ico
│   │   ├── src/
│   │   │   ├── main.tsx              # Entry point
│   │   │   ├── App.tsx               # Root component
│   │   │   ├── index.css             # Global styles
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── ChatWidget.tsx     # Main widget container
│   │   │   │   ├── ChatHeader.tsx     # Header with logo, title
│   │   │   │   ├── ChatMessages.tsx   # Message list
│   │   │   │   ├── ChatMessage.tsx    # Single message bubble
│   │   │   │   ├── ChatInput.tsx      # Input field
│   │   │   │   ├── QuickActions.tsx   # Quick action buttons
│   │   │   │   ├── LanguageSelector.tsx
│   │   │   │   ├── WelcomeScreen.tsx
│   │   │   │   ├── TypingIndicator.tsx
│   │   │   │   ├── InquiryForm.tsx    # Conversational form
│   │   │   │   └── WidgetButton.tsx   # Floating button
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   ├── useChat.ts         # Chat logic
│   │   │   │   ├── useWidget.ts       # Widget state
│   │   │   │   └── useTheme.ts        # Theme management
│   │   │   │
│   │   │   ├── services/
│   │   │   │   └── api.ts             # API client
│   │   │   │
│   │   │   ├── store/
│   │   │   │   └── chatStore.ts       # Zustand store
│   │   │   │
│   │   │   ├── styles/
│   │   │   │   └── widget.css         # Widget styles
│   │   │   │
│   │   │   ├── types/
│   │   │   │   └── index.ts           # Widget types
│   │   │   │
│   │   │   └── utils/
│   │   │       ├── storage.ts         # Local storage utils
│   │   │       └── helpers.ts         # Helper functions
│   │   │
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   └── tailwind.config.js
│   │
│   ├── web/                          # Main Marketing Website
│   │   ├── public/
│   │   │   └── assets/
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── index.css
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── layout/
│   │   │   │   │   ├── Header.tsx
│   │   │   │   │   ├── Footer.tsx
│   │   │   │   │   └── Layout.tsx
│   │   │   │   │
│   │   │   │   ├── sections/
│   │   │   │   │   ├── Hero.tsx
│   │   │   │   │   ├── Features.tsx
│   │   │   │   │   ├── Pricing.tsx
│   │   │   │   │   └── CTA.tsx
│   │   │   │   │
│   │   │   │   └── ui/
│   │   │   │       ├── Button.tsx
│   │   │   │       └── Card.tsx
│   │   │   │
│   │   │   ├── pages/
│   │   │   │   ├── Home.tsx
│   │   │   │   ├── Features.tsx
│   │   │   │   ├── Pricing.tsx
│   │   │   │   ├── About.tsx
│   │   │   │   ├── Contact.tsx
│   │   │   │   ├── Login.tsx
│   │   │   │   └── Register.tsx
│   │   │   │
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   └── utils/
│   │   │
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   │
│   └── admin/                        # Admin Dashboard
│       ├── public/
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   ├── index.css
│       │   │
│       │   ├── components/
│       │   │   ├── layout/
│       │   │   │   ├── Sidebar.tsx
│       │   │   │   ├── TopBar.tsx
│       │   │   │   └── AdminLayout.tsx
│       │   │   │
│       │   │   ├── dashboard/
│       │   │   │   ├── StatsCard.tsx
│       │   │   │   ├── Charts.tsx
│       │   │   │   └── RecentActivity.tsx
│       │   │   │
│       │   │   ├── clients/
│       │   │   │   ├── ClientList.tsx
│       │   │   │   ├── ClientForm.tsx
│       │   │   │   └── ClientSettings.tsx
│       │   │   │
│       │   │   ├── knowledge/
│       │   │   │   ├── KnowledgeList.tsx
│       │   │   │   ├── KnowledgeForm.tsx
│       │   │   │   └── KnowledgePreview.tsx
│       │   │   │
│       │   │   ├── faqs/
│       │   │   │   ├── FaqList.tsx
│       │   │   │   ├── FaqForm.tsx
│       │   │   │   └── FaqCategories.tsx
│       │   │   │
│       │   │   ├── logs/
│       │   │   │   ├── ChatLogs.tsx
│       │   │   │   ├── ChatDetail.tsx
│       │   │   │   ├── InquiryLogs.tsx
│       │   │   │   └── InquiryDetail.tsx
│       │   │   │
│       │   │   ├── analytics/
│       │   │   │   ├── Overview.tsx
│       │   │   │   ├── Charts.tsx
│       │   │   │   └── Export.tsx
│       │   │   │
│       │   │   └── ui/
│       │   │       ├── Button.tsx
│       │   │       ├── Input.tsx
│       │   │       ├── Modal.tsx
│       │   │       ├── Table.tsx
│       │   │       └── Card.tsx
│       │   │
│       │   ├── pages/
│       │   │   ├── Login.tsx
│       │   │   ├── Dashboard.tsx
│       │   │   ├── Clients.tsx
│       │   │   ├── ClientDetail.tsx
│       │   │   ├── KnowledgeBase.tsx
│       │   │   ├── FAQs.tsx
│       │   │   ├── ChatLogs.tsx
│       │   │   ├── InquiryLogs.tsx
│       │   │   ├── Analytics.tsx
│       │   │   └── Settings.tsx
│       │   │
│       │   ├── hooks/
│       │   │   ├── useAuth.ts
│       │   │   ├── useClients.ts
│       │   │   ├── useKnowledge.ts
│       │   │   └── useAnalytics.ts
│       │   │
│       │   ├── services/
│       │   │   └── api.ts
│       │   │
│       │   ├── store/
│       │   │   └── authStore.ts
│       │   │
│       │   └── utils/
│       │
│       ├── index.html
│       ├── package.json
│       ├── tsconfig.json
│       └── vite.config.ts
│
├── packages/
│   │
│   ├── server/                       # Backend API
│   │   ├── src/
│   │   │   ├── index.ts              # Server entry point
│   │   │   ├── app.ts                # Express app setup
│   │   │   │
│   │   │   ├── config/
│   │   │   │   ├── database.ts        # MongoDB connection
│   │   │   │   ├── env.ts             # Environment variables
│   │   │   │   └── cors.ts            # CORS configuration
│   │   │   │
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts            # JWT authentication
│   │   │   │   ├── validate.ts        # Request validation
│   │   │   │   ├── rateLimiter.ts     # Rate limiting
│   │   │   │   ├── errorHandler.ts    # Global error handler
│   │   │   │   └── sanitize.ts        # Input sanitization
│   │   │   │
│   │   │   ├── modules/
│   │   │   │   │
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth.routes.ts
│   │   │   │   │   ├── auth.controller.ts
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   └── auth.validation.ts
│   │   │   │   │
│   │   │   │   ├── client/
│   │   │   │   │   ├── client.model.ts
│   │   │   │   │   ├── client.routes.ts
│   │   │   │   │   ├── client.controller.ts
│   │   │   │   │   ├── client.service.ts
│   │   │   │   │   └── client.validation.ts
│   │   │   │   │
│   │   │   │   ├── clientConfig/
│   │   │   │   │   ├── clientConfig.model.ts
│   │   │   │   │   ├── clientConfig.routes.ts
│   │   │   │   │   ├── clientConfig.controller.ts
│   │   │   │   │   └── clientConfig.service.ts
│   │   │   │   │
│   │   │   │   ├── knowledge/
│   │   │   │   │   ├── knowledge.model.ts
│   │   │   │   │   ├── knowledge.routes.ts
│   │   │   │   │   ├── knowledge.controller.ts
│   │   │   │   │   ├── knowledge.service.ts
│   │   │   │   │   └── knowledge.validation.ts
│   │   │   │   │
│   │   │   │   ├── faq/
│   │   │   │   │   ├── faq.model.ts
│   │   │   │   │   ├── faq.routes.ts
│   │   │   │   │   ├── faq.controller.ts
│   │   │   │   │   ├── faq.service.ts
│   │   │   │   │   └── faq.validation.ts
│   │   │   │   │
│   │   │   │   ├── chat/
│   │   │   │   │   ├── chat.model.ts
│   │   │   │   │   ├── chat.routes.ts
│   │   │   │   │   ├── chat.controller.ts
│   │   │   │   │   ├── chat.service.ts
│   │   │   │   │   ├── message.model.ts
│   │   │   │   │   └── knowledgeEngine.ts
│   │   │   │   │
│   │   │   │   ├── inquiry/
│   │   │   │   │   ├── inquiry.model.ts
│   │   │   │   │   ├── inquiry.routes.ts
│   │   │   │   │   ├── inquiry.controller.ts
│   │   │   │   │   ├── inquiry.service.ts
│   │   │   │   │   └── inquiry.validation.ts
│   │   │   │   │
│   │   │   │   ├── unanswered/
│   │   │   │   │   ├── unanswered.model.ts
│   │   │   │   │   ├── unanswered.routes.ts
│   │   │   │   │   ├── unanswered.controller.ts
│   │   │   │   │   └── unanswered.service.ts
│   │   │   │   │
│   │   │   │   ├── analytics/
│   │   │   │   │   ├── analytics.routes.ts
│   │   │   │   │   ├── analytics.controller.ts
│   │   │   │   │   └── analytics.service.ts
│   │   │   │   │
│   │   │   │   └── widget/
│   │   │   │       ├── widget.routes.ts
│   │   │   │       └── widget.controller.ts
│   │   │   │
│   │   │   ├── utils/
│   │   │   │   ├── apiError.ts        # Custom error classes
│   │   │   │   ├── apiResponse.ts     # Standardized responses
│   │   │   │   ├── logger.ts          # Winston logger
│   │   │   │   ├── helpers.ts         # Utility functions
│   │   │   │   └── constants.ts       # App constants
│   │   │   │
│   │   │   └── types/
│   │   │       └── index.ts           # Server types
│   │   │
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── shared/                       # Shared Code
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   │
│   │   │   ├── types/
│   │   │   │   ├── client.ts          # Client types
│   │   │   │   ├── chat.ts            # Chat types
│   │   │   │   ├── inquiry.ts         # Inquiry types
│   │   │   │   ├── knowledge.ts       # Knowledge types
│   │   │   │   ├── faq.ts             # FAQ types
│   │   │   │   ├── widget.ts          # Widget types
│   │   │   │   └── api.ts             # API response types
│   │   │   │
│   │   │   ├── constants/
│   │   │   │   ├── languages.ts       # Language definitions
│   │   │   │   ├── quickActions.ts    # Quick action definitions
│   │   │   │   ├── messages.ts        # Default messages
│   │   │   │   └── regex.ts           # Regex patterns
│   │   │   │
│   │   │   └── utils/
│   │   │       ├── validation.ts      # Shared validators
│   │   │       ├── formatters.ts      # Data formatters
│   │   │       └── search.ts          # Search utilities
│   │   │
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── ui/                           # Shared UI Components (optional)
│       ├── src/
│       │   ├── components/
│       │   │   ├── Button/
│       │   │   ├── Input/
│       │   │   ├── Modal/
│       │   │   └── ...
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── docs/                             # Documentation
│   ├── ARCHITECTURE.md
│   ├── FOLDER_STRUCTURE.md
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── CONTRIBUTING.md
│
├── scripts/                          # Scripts
│   ├── setup.sh                      # Initial setup
│   ├── seed.ts                       # Database seeding
│   └── deploy.sh                     # Deployment script
│
├── .env.example                      # Environment template
├── .gitignore
├── .eslintrc.js
├── .prettierrc
├── package.json                      # Root package.json
├── pnpm-workspace.yaml               # pnpm workspace
├── turbo.json                        # Turborepo config
├── tsconfig.json                     # Base TypeScript config
└── README.md
```

---

## Key Files Explanation

### Widget Entry Point
- `apps/widget/src/main.tsx`: Bootstraps the widget React app
- Creates shadow DOM for style isolation
- Reads `data-client-id` from script tag

### Server Entry Point
- `packages/server/src/index.ts`: Starts Express server
- `packages/server/src/app.ts`: Configures all middleware and routes

### Shared Types
- `packages/shared/src/types/`: TypeScript interfaces used across all apps
- Prevents type duplication and ensures consistency

### Knowledge Engine
- `packages/server/src/modules/chat/knowledgeEngine.ts`: Core matching logic
- Separated from routes for testability

---

## Why This Structure?

| Decision | Reason |
|----------|--------|
| Monorepo | Atomic commits, shared code, single dependency management |
| Turborepo | Fast builds, caching, parallel execution |
| Module pattern | Each feature is self-contained (model, routes, controller, service) |
| Shared package | Types/constants reused across widget, admin, and server |
| Shadow DOM | Widget styles don't conflict with host website |
| Separate apps | Widget, web, and admin can be deployed independently |
