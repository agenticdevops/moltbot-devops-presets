---
sidebar_position: 4
---

# Telegram Bot Setup

Configure Opsbot as a Telegram bot for ChatOps.

## Create a Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` to create a new bot
3. Follow the prompts to set a name and username
4. Save the bot token (format: `123456:ABC-DEF...`)

## Configure Opsbot

### Environment Variable

```bash
export TELEGRAM_BOT_TOKEN=your-bot-token-here
```

### Docker Compose

```yaml
services:
  opsbot:
    environment:
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
```

### Kubernetes Secret

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: opsbot-secrets
stringData:
  telegram-bot-token: "your-bot-token-here"
```

## Set Up Webhook

Telegram needs to know where to send messages. You have two options:

### Option 1: Public URL

If Opsbot is publicly accessible:

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-domain.com/webhooks/telegram"}'
```

Or use the Opsbot API:

```bash
curl -X POST "http://localhost:3000/webhooks/telegram/setup" \
  -H "Content-Type: application/json" \
  -d '{"webhookUrl": "https://your-domain.com/webhooks/telegram"}'
```

### Option 2: ngrok (Development)

For local development, use ngrok:

```bash
# Start ngrok
ngrok http 3000

# Use the ngrok URL
curl -X POST "http://localhost:3000/webhooks/telegram/setup" \
  -H "Content-Type: application/json" \
  -d '{"webhookUrl": "https://abc123.ngrok.io/webhooks/telegram"}'
```

## Verify Setup

Check if the bot is configured:

```bash
curl http://localhost:3000/webhooks/telegram/info
```

Expected response:

```json
{
  "configured": true,
  "bot": {
    "id": 123456789,
    "username": "your_opsbot"
  }
}
```

## Using the Bot

### Start a Chat

1. Find your bot in Telegram (search for its username)
2. Click "Start" or send `/start`
3. The bot will respond with available commands

### Available Commands

```
/start    - Show welcome message
/help     - Show available commands
/plans    - List pending plans
/plan     - View plan details
/approve  - Approve a plan
/reject   - Reject a plan
/execute  - Execute approved plan
/status   - Get plan status
/audit    - View audit log
/health   - System health check
```

### Example Conversation

```
You: /plans

Bot: 📋 Pending Plans:

🟡 plan-20260128-001
   Scale API deployment to 5 replicas
   Risk: MEDIUM

Use /plan <id> for details

You: /plan plan-20260128-001

Bot: [Shows full plan details]

You: /approve plan-20260128-001 Approved for traffic spike

Bot: ✅ Plan plan-20260128-001 approved by @yourname

Use /execute plan-20260128-001 to run.

You: /execute plan-20260128-001

Bot: ✅ Plan plan-20260128-001 executed successfully!

Duration: 12s
Steps completed: 3/3
```

## Security Considerations

### Restrict Access

Limit which Telegram users/chats can interact with the bot:

```json
{
  "channels": {
    "telegram": {
      "enabled": true,
      "allowedChatIds": [123456789, -987654321]
    }
  }
}
```

To find your chat ID, send a message to the bot and check the logs, or use `@userinfobot`.

### Private Bot

Make your bot private:

1. Go to `@BotFather`
2. Send `/setjoingroups`
3. Select your bot
4. Choose "Disable"

### Group Chat

For group chats:

1. Add the bot to the group
2. Grant admin permissions (or disable privacy mode with BotFather)
3. Use commands with `@botname` suffix in groups

## Troubleshooting

### Bot not responding

1. Check if token is set correctly
2. Verify webhook is configured
3. Check server logs for errors
4. Test webhook URL is accessible

### Webhook fails

```bash
# Delete existing webhook
curl "https://api.telegram.org/bot<TOKEN>/deleteWebhook"

# Get webhook info
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"

# Set webhook again
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://your-domain.com/webhooks/telegram"
```

### Message not delivered

Check if the chat is in the allowed list:

```bash
# Check logs for
[Telegram] Chat 123456789 not in allowed list
```

Add the chat ID to configuration if needed.
