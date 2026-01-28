import { Elysia, t } from "elysia";

/**
 * Webhook routes for channel integrations
 * - Slack Events API
 * - Telegram Bot Webhook
 */

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

// Telegram update schema (simplified)
const TelegramUpdate = t.Object({
  update_id: t.Number(),
  message: t.Optional(
    t.Object({
      message_id: t.Number(),
      from: t.Optional(
        t.Object({
          id: t.Number(),
          username: t.Optional(t.String()),
        })
      ),
      chat: t.Object({
        id: t.Number(),
        type: t.String(),
      }),
      text: t.Optional(t.String()),
    })
  ),
});

export const webhookRoutes = new Elysia({ prefix: "/webhooks" })
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
          // - Parse command (approve, reject, etc.)
          // - Execute corresponding action
          // - Send response back to Slack
        }

        // Handle app_mention events
        if (event.type === "app_mention" && event.text) {
          console.log(`[Slack] Mention from ${event.user}: ${event.text}`);

          // TODO: Process mention through opsbot
        }
      }

      return { ok: true };
    },
    { body: SlackEvent }
  )

  // Telegram Bot Webhook
  .post(
    "/telegram",
    async ({ body }) => {
      console.log(`[Telegram] Received update: ${body.update_id}`);

      if (body.message && body.message.text) {
        const msg = body.message;
        const chatId = msg.chat.id;
        const text = msg.text;
        const username = msg.from?.username || "unknown";

        console.log(`[Telegram] Message from ${username}: ${text}`);

        // TODO: Process message through opsbot
        // - Parse command
        // - Execute action
        // - Send response via Telegram Bot API

        // Example commands:
        // /plans - List pending plans
        // /approve <planId> - Approve a plan
        // /reject <planId> <reason> - Reject a plan
        // /status <planId> - Get plan status
      }

      return { ok: true };
    },
    { body: TelegramUpdate }
  )

  // Generic webhook for custom integrations
  .post("/custom/:integrationId", async ({ params, body }) => {
    console.log(`[Webhook] Custom integration: ${params.integrationId}`);
    console.log(`[Webhook] Body:`, JSON.stringify(body, null, 2));

    // TODO: Route to appropriate handler based on integrationId

    return {
      received: true,
      integrationId: params.integrationId,
      timestamp: new Date().toISOString(),
    };
  })

  // Health check for webhooks
  .get("/health", () => ({
    status: "ready",
    endpoints: {
      slack: "/webhooks/slack/events",
      telegram: "/webhooks/telegram",
      custom: "/webhooks/custom/:integrationId",
    },
  }));
