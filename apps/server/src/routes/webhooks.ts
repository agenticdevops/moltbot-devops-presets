import { Elysia, t } from "elysia";
import { TelegramBot, handleCommand, parseCommand } from "../channels/telegram/index.js";
import {
  PlanGenerator,
  ApprovalHandler,
  Executor,
  AuditLogger,
} from "@opsbot/safety";

// Initialize services
const plansDir = process.env.OPSBOT_MEMORY_DIR
  ? `${process.env.OPSBOT_MEMORY_DIR}/execution-plans`
  : "memory/execution-plans";
const logsFile = process.env.OPSBOT_MEMORY_DIR
  ? `${process.env.OPSBOT_MEMORY_DIR}/audit-log.jsonl`
  : "memory/audit-log.jsonl";

const planGenerator = new PlanGenerator(plansDir);
const auditLogger = new AuditLogger({ logFile: logsFile });
const approvalHandler = new ApprovalHandler(planGenerator);
const executor = new Executor(planGenerator, auditLogger, {
  dryRun: process.env.OPSBOT_DRY_RUN === "true",
});

// Initialize Telegram bot
const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
const telegramBot = telegramToken ? new TelegramBot({ token: telegramToken }) : null;

// Telegram update schema
const TelegramUpdate = t.Object({
  update_id: t.Number(),
  message: t.Optional(
    t.Object({
      message_id: t.Number(),
      from: t.Optional(
        t.Object({
          id: t.Number(),
          username: t.Optional(t.String()),
          first_name: t.Optional(t.String()),
        })
      ),
      chat: t.Object({
        id: t.Number(),
        type: t.String(),
      }),
      text: t.Optional(t.String()),
      date: t.Number(),
    })
  ),
});

// Slack event schema
const SlackEvent = t.Object({
  type: t.String(),
  challenge: t.Optional(t.String()),
  event: t.Optional(
    t.Object({
      type: t.String(),
      user: t.Optional(t.String()),
      text: t.Optional(t.String()),
      channel: t.Optional(t.String()),
      ts: t.Optional(t.String()),
    })
  ),
});

export const webhookRoutes = new Elysia({ prefix: "/webhooks" })
  // Telegram Bot Webhook
  .post(
    "/telegram",
    async ({ body }) => {
      if (!telegramBot) {
        console.log("[Telegram] Bot not configured (missing TELEGRAM_BOT_TOKEN)");
        return { ok: true, error: "Bot not configured" };
      }

      const message = telegramBot.parseUpdate(body);
      if (!message) {
        return { ok: true };
      }

      console.log(`[Telegram] Message from @${message.username || message.userId}: ${message.text}`);

      // Check if allowed
      if (!telegramBot.isAllowed(message.chatId)) {
        console.log(`[Telegram] Chat ${message.chatId} not in allowed list`);
        return { ok: true };
      }

      // Handle command
      const result = await handleCommand({
        message,
        planGenerator,
        approvalHandler,
        executor,
        auditLogger,
      });

      // Send response
      await telegramBot.sendLongMessage(message.chatId, result.text, message.messageId);

      return { ok: true };
    },
    { body: TelegramUpdate }
  )

  // Telegram webhook setup endpoint
  .post("/telegram/setup", async ({ body }) => {
    if (!telegramBot) {
      return { success: false, error: "Bot not configured" };
    }

    const webhookUrl = (body as any).webhookUrl;
    if (!webhookUrl) {
      return { success: false, error: "webhookUrl is required" };
    }

    const success = await telegramBot.setWebhook(webhookUrl);
    return { success, webhookUrl };
  })

  // Get Telegram bot info
  .get("/telegram/info", async () => {
    if (!telegramBot) {
      return { configured: false, error: "Bot not configured" };
    }

    const info = await telegramBot.getMe();
    return {
      configured: true,
      bot: info,
    };
  })

  // Slack Events API
  .post(
    "/slack/events",
    async ({ body }) => {
      // Handle Slack URL verification challenge
      if (body.type === "url_verification" && body.challenge) {
        return { challenge: body.challenge };
      }

      // Handle Slack events
      if (body.type === "event_callback" && body.event) {
        const event = body.event;

        console.log(`[Slack] Received event: ${event.type}`);

        // Handle message events
        if (event.type === "message" && event.text) {
          console.log(`[Slack] Message from ${event.user}: ${event.text}`);

          // TODO: Process message through opsbot
          // Similar to Telegram but with Slack-specific formatting
        }

        // Handle app_mention events
        if (event.type === "app_mention" && event.text) {
          console.log(`[Slack] Mention from ${event.user}: ${event.text}`);
        }
      }

      return { ok: true };
    },
    { body: SlackEvent }
  )

  // Generic webhook for custom integrations
  .post("/custom/:integrationId", async ({ params, body }) => {
    console.log(`[Webhook] Custom integration: ${params.integrationId}`);

    return {
      received: true,
      integrationId: params.integrationId,
      timestamp: new Date().toISOString(),
    };
  })

  // Health check for webhooks
  .get("/health", async () => {
    const telegramInfo = telegramBot ? await telegramBot.getMe() : null;

    return {
      status: "ready",
      channels: {
        telegram: {
          configured: !!telegramBot,
          bot: telegramInfo,
        },
        slack: {
          configured: !!process.env.SLACK_BOT_TOKEN,
        },
      },
      endpoints: {
        telegram: "/webhooks/telegram",
        slack: "/webhooks/slack/events",
        custom: "/webhooks/custom/:integrationId",
      },
    };
  });
