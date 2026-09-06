import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// The remote workspace stores local development credentials here. Load this
// explicitly because Prisma CLI does not follow Next.js's env-file precedence.
config({ path: "./.env.development.local" });

export default defineConfig({
  schema: "src/prisma/schema.prisma",
  migrations: {
    path: "src/prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
