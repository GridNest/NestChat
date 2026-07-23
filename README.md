# NestChat

A multi-tenant SaaS chatbot platform that allows websites to embed a customizable chat widget.

## Features (Version 1)

- Floating Chat Widget
- Mobile Responsive
- Dark Mode Ready
- Language Selection (English/Hindi)
- Website Knowledge Search
- FAQ Search
- Conversational Inquiry Engine
- Admin Dashboard
- Widget Generator
- Analytics & Logs
- Multi-Client Support

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, TypeScript
- **Backend**: Node.js, Express.js, MongoDB Atlas
- **Auth**: JWT
- **Deployment**: Render, GitHub
- **Image Upload**: Cloudinary

## Project Structure

```
nestchat/
├── apps/
│   ├── widget/         # Embeddable chat widget
│   ├── web/            # Marketing website
│   └── admin/          # Admin dashboard
├── packages/
│   ├── server/         # Backend API
│   └── shared/         # Shared types & utils
├── docs/               # Documentation
└── scripts/            # Build scripts
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- MongoDB Atlas account

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/nestchat.git
cd nestchat

# Install dependencies
pnpm install

# Set up environment
cp .env.example packages/server/.env
# Edit .env with your values

# Start development
pnpm run dev
```

### Development URLs

- **Widget**: http://localhost:3001
- **Admin**: http://localhost:3002
- **API**: http://localhost:5000

## Widget Embedding

Add this single line to any website:

```html
<script 
  src="https://your-widget-url.com/widget.js" 
  data-client-id="CLIENT_ID">
</script>
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Folder Structure](docs/FOLDER_STRUCTURE.md)
- [API Documentation](docs/API.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## Version Roadmap

### Version 1 (Current)
- Rule-based responses
- Knowledge base search
- FAQ matching
- Inquiry collection

### Version 2 (Future)
- OpenAI integration
- Gemini integration
- Claude integration
- AI-powered responses

## License

MIT
