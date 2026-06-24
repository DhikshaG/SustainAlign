# Contributing to SustainAlign

Thanks for your interest in contributing!

## Development Setup

1. Clone the repo and install dependencies:
   ```bash
   git clone <repo-url>
   cd sustainalign
   npm install
   ```

2. Set up the database:
   ```bash
   cp backend/.env.example backend/.env
   cd backend && npm run db:reset
   ```

3. Start development:
   ```bash
   make dev-backend   # terminal 1
   make dev-frontend  # terminal 2
   ```

## Code Style

- **Backend:** ESM, Node.js 20+, Express 5, Drizzle ORM, Zod validation
- **Frontend:** React 19, Vite 8, Tailwind CSS 4, React Router 7
- **No TypeScript** — the codebase uses plain JavaScript with JSDoc where needed

## Pull Requests

- Keep PRs small and focused
- Include a clear description of what changed and why
- Run `npm run lint` before submitting
- Test your changes locally with `npm run build`

## Security

If you discover a security vulnerability, please report it privately via email rather than opening a public issue.
