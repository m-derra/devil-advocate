# Devil's Advocate

A hackathon project critique tool that roasts your idea before the judges do.

## Features

- **4 Parallel Critic Agents**: Technical, Business, UX, and Pitch critics analyze your project simultaneously
- **Prepared Rebuttals**: Get defense strategies for each critique
- **Real-time Streaming**: Watch the critiques come in live via SSE
- **Feedback Collection**: Built-in widget to collect feature requests and bug reports
- **Admin Dashboard**: View and export all feedback for Product OS integration

## Tech Stack

- **Runtime**: Bun
- **Backend**: Express.js + TypeScript
- **Frontend**: React + Vite + TailwindCSS
- **Database**: PostgreSQL + Drizzle ORM
- **AI**: Claude API (Anthropic)

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) installed
- PostgreSQL database
- Anthropic API key

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/devil-advocate.git
cd devil-advocate
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables:
```bash
# packages/api/.env
cp packages/api/.env.example packages/api/.env
# Edit with your ANTHROPIC_API_KEY and DATABASE_URL
```

4. Initialize the database:
```bash
bun run db:push
```

5. Start development servers:
```bash
bun run dev
```

This starts:
- API server at http://localhost:3001
- Web app at http://localhost:5173

## Routes

| Route | Description |
|-------|-------------|
| `/devil` | Landing page with input form |
| `/devil/session/:id` | Real-time critique progress |
| `/devil/report/:id` | Final report with export |
| `/devil/admin` | Feedback dashboard |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sessions` | Create new critique session |
| GET | `/api/sessions/:id` | Get session details |
| GET | `/api/sessions/:id/stream` | SSE stream for real-time updates |
| POST | `/api/feedback` | Submit feedback |
| GET | `/api/feedback` | List all feedback (admin) |
| GET | `/api/feedback/export` | Export feedback as JSON |

## Intentional Limitations

These are by design to generate feature requests:

- Text-only input (no file uploads)
- No saved session history
- English only
- No sharing functionality
- Generic critiques (no tech stack awareness)
- No GitHub integration
- Markdown-only export
- No follow-up conversations
- No dark mode toggle

## Feedback Integration

Export feedback from `/devil/admin` and import into Product OS:

```bash
# Download feedback
curl http://localhost:3001/api/feedback/export > feedback.json

# Use as customer feedback context in Product OS
```

## License

MIT
