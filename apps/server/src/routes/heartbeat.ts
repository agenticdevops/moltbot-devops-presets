import { Elysia, t } from "elysia";
import { TelegramBot } from "../channels/telegram/bot";
import { generateHeartbeatReport, sendHeartbeat } from "../services/heartbeat";

export function createHeartbeatRoutes(bot: TelegramBot | null) {
  return new Elysia({ prefix: "/api/heartbeat" })
    .get("/", async () => {
      // Generate report without sending
      const report = await generateHeartbeatReport({
        chatId: "",
        includeKubernetes: true,
        includeDocker: true,
        includeSystem: true,
      });

      return {
        report,
        generatedAt: new Date().toISOString(),
      };
    })
    .post(
      "/trigger",
      async ({ body }) => {
        if (!bot) {
          return {
            success: false,
            error: "Telegram bot not configured",
          };
        }

        const chatId =
          body?.chatId || process.env.OPSBOT_HEARTBEAT_CHAT_ID || "";

        if (!chatId) {
          return {
            success: false,
            error:
              "No chat ID provided. Set OPSBOT_HEARTBEAT_CHAT_ID or provide chatId in request body.",
          };
        }

        await sendHeartbeat(bot, {
          chatId,
          includeKubernetes: body?.includeKubernetes ?? true,
          includeDocker: body?.includeDocker ?? true,
          includeSystem: body?.includeSystem ?? true,
        });

        return {
          success: true,
          message: `Heartbeat sent to chat ${chatId}`,
          timestamp: new Date().toISOString(),
        };
      },
      {
        body: t.Optional(
          t.Object({
            chatId: t.Optional(t.String()),
            includeKubernetes: t.Optional(t.Boolean()),
            includeDocker: t.Optional(t.Boolean()),
            includeSystem: t.Optional(t.Boolean()),
          })
        ),
      }
    )
    .get("/preview", async () => {
      // Get a preview of what the heartbeat would look like
      const report = await generateHeartbeatReport({
        chatId: "",
        includeKubernetes: true,
        includeDocker: true,
        includeSystem: true,
      });

      return {
        preview: report,
        timestamp: new Date().toISOString(),
      };
    });
}
