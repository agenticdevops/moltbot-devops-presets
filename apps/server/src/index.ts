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
import { createHeartbeatRoutes } from "./routes/heartbeat.js";
import { TelegramBot } from "./channels/telegram/bot.js";
import { HeartbeatScheduler } from "./services/heartbeat.js";

const PORT = process.env.PORT || 3000;

// Initialize Telegram bot if configured
const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const telegramBot = telegramToken ? new TelegramBot(telegramToken) : null;

// Initialize heartbeat scheduler if configured
let heartbeatScheduler: HeartbeatScheduler | null = null;
const heartbeatChatId = process.env.OPSBOT_HEARTBEAT_CHAT_ID;
if (telegramBot && heartbeatChatId) {
  heartbeatScheduler = new HeartbeatScheduler(telegramBot, {
    chatId: heartbeatChatId,
    includeKubernetes: true,
    includeDocker: true,
    includeSystem: true,
  });
  // Default to 24 hour interval
  const intervalHours = parseInt(process.env.OPSBOT_HEARTBEAT_INTERVAL_HOURS || "24");
  heartbeatScheduler.start(intervalHours * 60 * 60 * 1000);
  console.log(`   Heartbeat: Scheduled every ${intervalHours} hours to chat ${heartbeatChatId}`);
}

const app = new Elysia()
  .use(healthRoutes)
  .use(planRoutes)
  .use(approvalRoutes)
  .use(webhookRoutes)
  .use(createHeartbeatRoutes(telegramBot))
  .get("/", () => ({
    name: "opsbot",
    version: "0.1.0",
    description: "DevOps assistant with safety-first design",
    docs: "/docs",
    health: "/health",
    heartbeat: "/api/heartbeat",
  }))
  .listen(PORT);

console.log(`🤖 Opsbot server running at http://localhost:${PORT}`);
console.log(`   Health: http://localhost:${PORT}/health`);
console.log(`   Plans:  http://localhost:${PORT}/api/plans`);
console.log(`   Heartbeat: http://localhost:${PORT}/api/heartbeat`);
