# LLM Arena

LLM Arena is an open comparison workspace for testing language models against the same prompt. Submit one prompt, stream responses from up to three models in parallel, compare the results, and cast a human vote for the answer you prefer. The product keeps model performance measurable with response speed, time to first token, token usage, and cost metrics.

## What is implemented

- Live free-model catalog with context-window metadata and provider-aware defaults.
- Arena composer with model selection, prompt submission, follow-up turns, and independent streaming requests.
- Human voting with one vote per turn after at least two models have answered.
- Blind mode that replaces model names with neutral labels to reduce brand bias.
- AI-marked response agreement and disagreement analysis.
- Global, personal, and task-category leaderboard views.
- Public thread visibility and shareable thread routes.
- Saved prompts with authenticated persistence and replay support.
- Personal profile insights for model preferences, speed, cost, and quality.
- Authenticated application shell with thread history and model pages.
- Server-side validation, Clerk authentication, Arcjet protection, Prisma/Postgres persistence, and PostHog analytics.

## Product principles

LLM Arena treats human voting as the source of truth for the leaderboard. AI-generated agreement or disagreement analysis is presented as supporting context, never as the winner. Failed model calls remain visible in the data model, measured metrics are kept separate from derived analysis, and the core prompt-to-answer-to-vote loop remains usable even when one model or an analysis request fails.

## Technology

- Next.js 16 App Router and React 19
- TypeScript with strict project conventions
- Tailwind CSS 4 and shadcn/ui
- Prisma 7 with PostgreSQL
- Clerk authentication
- OpenRouter through the Vercel AI SDK
- Arcjet rate limiting and bot protection
- PostHog analytics and LLM observability

## Project structure

```text
src/
├── app/                 # App Router pages and API routes
├── features/            # Domain-oriented UI and server actions
│   ├── arena/           # Composer, streaming responses, voting, analysis
│   ├── blind-mode/      # Blind-mode state and display labels
│   ├── leaderboard/     # Global, personal, and category standings
│   ├── models/          # Live model catalog screen
│   ├── profile/         # Personal model and cost-quality insights
│   ├── prompts/         # Saved prompts and replay actions
│   └── shell/           # Application navigation and thread history
├── infrastructure/     # Database, environment, catalog, auth, and analytics
├── prisma/              # Prisma schema and migrations
└── docs/                # Scope and project decision records
```

## Getting started

Install dependencies with the repository's package manager, then create the local environment file with the required server and public variables:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Sign-in is required for prompt submission, voting, saved prompts, and personal insights.

The application expects configuration for the database, Clerk, OpenRouter, Arcjet, and PostHog. Keep environment access inside the existing infrastructure modules; do not read `process.env` directly from features or routes.

## Validation

Before committing changes, run the project's checks:

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm build
```

The detailed implementation ledger, decisions, corrections, verification notes, and remaining manual checks live in [`src/docs/scope.md`](src/docs/scope.md).

## Roadmap

The next planned product work is monetization and higher-capacity comparisons: daily free-run limits with a paid tier, expanded model counts, and an optional synthesis feature that combines useful parts of multiple answers. These should be introduced only after usage, model-call cost, and the existing comparison loop are measured in production.

## License

This project is maintained as an experimental product workspace for evaluating LLM behavior and usefulness through direct comparison.
