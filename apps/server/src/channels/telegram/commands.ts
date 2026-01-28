/**
 * Telegram Command Handler for Opsbot
 *
 * Parses and executes bot commands.
 */

import type { TelegramMessage } from "./bot.js";
import {
  PlanGenerator,
  ApprovalHandler,
  Executor,
  AuditLogger,
} from "@opsbot/safety";

export interface CommandContext {
  message: TelegramMessage;
  planGenerator: PlanGenerator;
  approvalHandler: ApprovalHandler;
  executor: Executor;
  auditLogger: AuditLogger;
}

export interface CommandResult {
  text: string;
  success: boolean;
}

/**
 * Parse a command from message text
 */
export function parseCommand(text: string): { command: string; args: string[] } | null {
  const trimmed = text.trim();

  // Check if it starts with /
  if (!trimmed.startsWith("/")) {
    return null;
  }

  const parts = trimmed.slice(1).split(/\s+/);
  const command = parts[0].toLowerCase().replace(/@.*$/, ""); // Remove @botname
  const args = parts.slice(1);

  return { command, args };
}

/**
 * Handle /start command
 */
function handleStart(ctx: CommandContext): CommandResult {
  return {
    success: true,
    text: `🤖 *Opsbot* - DevOps Assistant

Welcome! I help you manage infrastructure safely.

*Commands:*
/plans - List pending plans
/plan <id> - View plan details
/approve <id> - Approve a plan
/reject <id> <reason> - Reject a plan
/execute <id> - Execute approved plan
/status <id> - Get plan status
/audit - View recent audit log
/health - System health check
/help - Show this help

*Safety Modes:*
• Read-only: Only view operations
• Plan-mode: Review before execute
• Full-access: Direct execution

Current mode: *plan-mode*`,
  };
}

/**
 * Handle /help command
 */
function handleHelp(ctx: CommandContext): CommandResult {
  return handleStart(ctx);
}

/**
 * Handle /plans command - list pending plans
 */
function handlePlans(ctx: CommandContext): CommandResult {
  const pending = ctx.planGenerator.listPendingPlans();

  if (pending.length === 0) {
    return {
      success: true,
      text: "✅ No pending plans awaiting approval.",
    };
  }

  const lines = ["📋 *Pending Plans:*\n"];

  for (const plan of pending) {
    const riskEmoji = getRiskEmoji(plan.riskLevel);
    lines.push(`${riskEmoji} \`${plan.id}\``);
    lines.push(`   ${plan.title}`);
    lines.push(`   Risk: ${plan.riskLevel}\n`);
  }

  lines.push(`\nUse /plan <id> for details`);

  return {
    success: true,
    text: lines.join("\n"),
  };
}

/**
 * Handle /plan <id> command - view plan details
 */
function handlePlan(ctx: CommandContext, args: string[]): CommandResult {
  if (args.length === 0) {
    return {
      success: false,
      text: "❌ Usage: /plan <plan-id>",
    };
  }

  const planId = args[0];
  const plan = ctx.planGenerator.loadPlan(planId);

  if (!plan) {
    return {
      success: false,
      text: `❌ Plan not found: \`${planId}\``,
    };
  }

  const formatted = ctx.approvalHandler.formatPlan(plan);

  return {
    success: true,
    text: "```\n" + formatted + "\n```",
  };
}

/**
 * Handle /approve <id> command
 */
async function handleApprove(ctx: CommandContext, args: string[]): Promise<CommandResult> {
  if (args.length === 0) {
    return {
      success: false,
      text: "❌ Usage: /approve <plan-id> [comment]",
    };
  }

  const planId = args[0];
  const comment = args.slice(1).join(" ") || undefined;
  const plan = ctx.planGenerator.loadPlan(planId);

  if (!plan) {
    return {
      success: false,
      text: `❌ Plan not found: \`${planId}\``,
    };
  }

  if (plan.approval.status !== "pending") {
    return {
      success: false,
      text: `❌ Plan is not pending. Status: ${plan.approval.status}`,
    };
  }

  const approver = ctx.message.username || `user:${ctx.message.userId}`;

  try {
    if (plan.riskLevel === "CRITICAL") {
      return {
        success: false,
        text: `⛔ CRITICAL plans require explicit override.\nUse: /approve-critical ${planId}`,
      };
    }

    ctx.approvalHandler.approve(plan, approver, comment);

    await ctx.auditLogger.logAction({
      planId: plan.id,
      action: "plan_approved",
      riskLevel: plan.riskLevel,
      status: "success",
      approver,
      notes: `Approved via Telegram by ${approver}`,
    });

    return {
      success: true,
      text: `✅ Plan \`${planId}\` approved by @${approver}\n\nUse /execute ${planId} to run.`,
    };
  } catch (error) {
    return {
      success: false,
      text: `❌ Approval failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Handle /reject <id> <reason> command
 */
async function handleReject(ctx: CommandContext, args: string[]): Promise<CommandResult> {
  if (args.length === 0) {
    return {
      success: false,
      text: "❌ Usage: /reject <plan-id> [reason]",
    };
  }

  const planId = args[0];
  const reason = args.slice(1).join(" ") || "Rejected via Telegram";
  const plan = ctx.planGenerator.loadPlan(planId);

  if (!plan) {
    return {
      success: false,
      text: `❌ Plan not found: \`${planId}\``,
    };
  }

  if (plan.approval.status !== "pending") {
    return {
      success: false,
      text: `❌ Plan is not pending. Status: ${plan.approval.status}`,
    };
  }

  const approver = ctx.message.username || `user:${ctx.message.userId}`;

  ctx.approvalHandler.reject(plan, approver, reason);

  await ctx.auditLogger.logAction({
    planId: plan.id,
    action: "plan_rejected",
    riskLevel: plan.riskLevel,
    status: "cancelled",
    approver,
    notes: `Rejected via Telegram: ${reason}`,
  });

  return {
    success: true,
    text: `🚫 Plan \`${planId}\` rejected by @${approver}\nReason: ${reason}`,
  };
}

/**
 * Handle /execute <id> command
 */
async function handleExecute(ctx: CommandContext, args: string[]): Promise<CommandResult> {
  if (args.length === 0) {
    return {
      success: false,
      text: "❌ Usage: /execute <plan-id>",
    };
  }

  const planId = args[0];
  const plan = ctx.planGenerator.loadPlan(planId);

  if (!plan) {
    return {
      success: false,
      text: `❌ Plan not found: \`${planId}\``,
    };
  }

  if (plan.approval.status !== "approved") {
    return {
      success: false,
      text: `❌ Plan must be approved first. Status: ${plan.approval.status}`,
    };
  }

  if (plan.execution.status === "completed") {
    return {
      success: false,
      text: `❌ Plan has already been executed.`,
    };
  }

  try {
    const result = await ctx.executor.execute(plan);

    if (result.success) {
      return {
        success: true,
        text: `✅ Plan \`${planId}\` executed successfully!\n\nDuration: ${Math.round(result.totalDurationMs / 1000)}s\nSteps completed: ${result.stepResults.filter((s) => s.status === "success").length}/${result.stepResults.length}`,
      };
    } else {
      const failedStep = result.stepResults.find((s) => s.status === "failed");
      return {
        success: false,
        text: `❌ Plan execution failed!\n\nFailed step: ${failedStep?.stepId}\nError: ${failedStep?.error}\n${result.rolledBack ? "✅ Rollback completed" : "⚠️ Manual rollback may be needed"}`,
      };
    }
  } catch (error) {
    return {
      success: false,
      text: `❌ Execution error: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Handle /status <id> command
 */
function handleStatus(ctx: CommandContext, args: string[]): CommandResult {
  if (args.length === 0) {
    return {
      success: false,
      text: "❌ Usage: /status <plan-id>",
    };
  }

  const planId = args[0];
  const plan = ctx.planGenerator.loadPlan(planId);

  if (!plan) {
    return {
      success: false,
      text: `❌ Plan not found: \`${planId}\``,
    };
  }

  const riskEmoji = getRiskEmoji(plan.riskLevel);
  const approvalEmoji = getApprovalEmoji(plan.approval.status);
  const executionEmoji = getExecutionEmoji(plan.execution.status);

  return {
    success: true,
    text: `📊 *Plan Status: ${planId}*

${riskEmoji} Risk: ${plan.riskLevel}
${approvalEmoji} Approval: ${plan.approval.status}
${executionEmoji} Execution: ${plan.execution.status}

Title: ${plan.title}
Created: ${new Date(plan.createdAt).toLocaleString()}
${plan.approval.approver ? `Approver: ${plan.approval.approver}` : ""}
${plan.execution.completedAt ? `Completed: ${new Date(plan.execution.completedAt).toLocaleString()}` : ""}`,
  };
}

/**
 * Handle /audit command
 */
async function handleAudit(ctx: CommandContext): Promise<CommandResult> {
  const summary = await ctx.auditLogger.formatSummary();

  return {
    success: true,
    text: "```\n" + summary + "\n```",
  };
}

/**
 * Handle /health command
 */
function handleHealth(ctx: CommandContext): CommandResult {
  const pending = ctx.planGenerator.listPendingPlans();

  return {
    success: true,
    text: `💚 *System Health*

Status: Online
Pending plans: ${pending.length}
Mode: plan-mode

All systems operational.`,
  };
}

/**
 * Main command handler
 */
export async function handleCommand(ctx: CommandContext): Promise<CommandResult> {
  const parsed = parseCommand(ctx.message.text);

  if (!parsed) {
    return {
      success: false,
      text: "I only respond to commands. Use /help to see available commands.",
    };
  }

  const { command, args } = parsed;

  switch (command) {
    case "start":
      return handleStart(ctx);
    case "help":
      return handleHelp(ctx);
    case "plans":
      return handlePlans(ctx);
    case "plan":
      return handlePlan(ctx, args);
    case "approve":
      return handleApprove(ctx, args);
    case "reject":
      return handleReject(ctx, args);
    case "execute":
      return handleExecute(ctx, args);
    case "status":
      return handleStatus(ctx, args);
    case "audit":
      return handleAudit(ctx);
    case "health":
      return handleHealth(ctx);
    default:
      return {
        success: false,
        text: `❓ Unknown command: /${command}\n\nUse /help to see available commands.`,
      };
  }
}

// Helper functions
function getRiskEmoji(risk: string): string {
  switch (risk) {
    case "LOW":
      return "🟢";
    case "MEDIUM":
      return "🟡";
    case "HIGH":
      return "🔴";
    case "CRITICAL":
      return "⛔";
    default:
      return "⚪";
  }
}

function getApprovalEmoji(status: string): string {
  switch (status) {
    case "pending":
      return "⏳";
    case "approved":
      return "✅";
    case "rejected":
      return "🚫";
    case "expired":
      return "⌛";
    default:
      return "❓";
  }
}

function getExecutionEmoji(status: string): string {
  switch (status) {
    case "pending":
      return "⏳";
    case "in_progress":
      return "🔄";
    case "completed":
      return "✅";
    case "failed":
      return "❌";
    case "rolled_back":
      return "↩️";
    case "cancelled":
      return "🚫";
    default:
      return "❓";
  }
}
