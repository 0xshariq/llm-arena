import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Prisma CLI does not follow Next.js's env-file precedence. Load the Vercel
// project env first, then allow local development values to fill in or override
// it when present.
config({ path: "/vercel/share/.env.project" });
config({ path: "./.env.development.local", override: true });

export default defineConfig({
  schema: "src/prisma/schema.prisma",
  migrations: {
    path: "src/prisma/migrations",
  },
  datasource: {
    url:
      process.env["DATABASE_URL"] ??
      (() => {
        throw new Error(
          "DATABASE_URL is required to run Prisma CLI commands. Define it in .env.development.local.",
        );
      })(),
  },
});
