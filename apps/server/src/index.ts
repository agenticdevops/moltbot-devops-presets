/**
 * Opsbot Server - Bun + Elysia
 *
 * DevOps assistant with safety-first design
 */

import { Elysia } from "elysia";
import { healthRoutes } from "./routes/health.js";
import { planRoutes } from "./routes/plans.js";
import { approvalRoutes } from "./routes/approvals.js";
import { webhookRoutes } from "./routes/webhooks.js";

const PORT = process.env.PORT || 3000;

const app = new Elysia()
  .use(healthRoutes)
  .use(planRoutes)
  .use(approvalRoutes)
  .use(webhookRoutes)
  .get("/", () => ({
    name: "opsbot",
    version: "0.1.0",
    description: "DevOps assistant with safety-first design",
    docs: "/docs",
    health: "/health",
  }))
  .listen(PORT);

console.log(`🤖 Opsbot server running at http://localhost:${PORT}`);
console.log(`   Health: http://localhost:${PORT}/health`);
console.log(`   Plans:  http://localhost:${PORT}/api/plans`);
