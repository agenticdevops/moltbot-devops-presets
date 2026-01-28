import type { ExecutionPlan, RiskLevel } from "@opsbot/contracts";
import { PlanGenerator } from "./plan-generator.js";

/**
 * Risk level indicators for display
 */
const RISK_INDICATORS: Record<RiskLevel, string> = {
  LOW: "🟢 LOW",
  MEDIUM: "🟡 MEDIUM",
  HIGH: "🔴 HIGH",
  CRITICAL: "⛔ CRITICAL",
};

export type ApprovalAction = "approve" | "reject" | "explain" | "modify" | "unknown";

export interface ApprovalResponse {
  action: ApprovalAction;
  comment?: string;
  query?: string;
}

export interface ApprovalConfig {
  autoApproveLowRisk: boolean;
  blockCritical: boolean;
  requireApproval: RiskLevel[];
}

const DEFAULT_CONFIG: ApprovalConfig = {
  autoApproveLowRisk: false,
  blockCritical: true,
  requireApproval: ["MEDIUM", "HIGH", "CRITICAL"],
};

export class ApprovalHandler {
  private planGenerator: PlanGenerator;
  private config: ApprovalConfig;

  private approvalKeywords = ["yes", "approve", "approved", "execute", "proceed", "confirm", "ok", "go"];
  private rejectionKeywords = ["no", "reject", "rejected", "cancel", "abort", "stop", "deny"];
  private explainKeywords = ["explain", "details", "more", "why", "what", "how", "show"];
  private modifyKeywords = ["modify", "change", "edit", "update", "adjust"];

  constructor(planGenerator: PlanGenerator, config: Partial<ApprovalConfig> = {}) {
    this.planGenerator = planGenerator;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Format a plan for presentation to the user
   */
  formatPlan(plan: ExecutionPlan): string {
    const lines: string[] = [];

    lines.push("═".repeat(60));
    lines.push(`📋 EXECUTION PLAN: ${plan.id}`);
    lines.push("═".repeat(60));
    lines.push("");
    lines.push(`Title: ${plan.title}`);
    lines.push(`Risk Level: ${RISK_INDICATORS[plan.riskLevel]}`);
    lines.push(`Estimated Duration: ${plan.estimatedDuration || "Unknown"}`);
    lines.push(`Created: ${new Date(plan.createdAt).toLocaleString()}`);
    lines.push("");

    lines.push("─".repeat(60));
    lines.push("CONTEXT");
    lines.push("─".repeat(60));
    lines.push(`Issue: ${plan.context.issue}`);
    if (plan.context.rootCause) {
      lines.push(`Root Cause: ${plan.context.rootCause}`);
    }
    if (plan.context.affectedResources.length > 0) {
      lines.push("Affected Resources:");
      for (const r of plan.context.affectedResources) {
        lines.push(`  - ${r.type}/${r.name}${r.namespace ? ` (ns: ${r.namespace})` : ""}`);
      }
    }
    lines.push("");

    lines.push("─".repeat(60));
    lines.push("EXECUTION STEPS");
    lines.push("─".repeat(60));
    for (const step of plan.steps) {
      const riskBadge = RISK_INDICATORS[step.riskLevel];
      lines.push(`${step.id}: ${step.description}`);
      lines.push(`    Action: ${step.action}`);
      if (step.command) {
        lines.push(`    Command: ${step.command}`);
      }
      lines.push(`    Risk: ${riskBadge} | Reversible: ${step.reversible ? "Yes" : "No"}`);
      lines.push("");
    }

    if (plan.rollback) {
      lines.push("─".repeat(60));
      lines.push("ROLLBACK PLAN");
      lines.push("─".repeat(60));
      lines.push(`Method: ${plan.rollback.method}`);
      if (plan.rollback.commands) {
        lines.push("Commands:");
        for (const cmd of plan.rollback.commands) {
          lines.push(`  - ${cmd}`);
        }
      }
      if (plan.rollback.estimatedTime) {
        lines.push(`Estimated Rollback Time: ${plan.rollback.estimatedTime}`);
      }
      lines.push("");
    }

    if (plan.validation.preFlight.length > 0 || plan.validation.postExecution.length > 0) {
      lines.push("─".repeat(60));
      lines.push("VALIDATION CHECKS");
      lines.push("─".repeat(60));
      if (plan.validation.preFlight.length > 0) {
        lines.push("Pre-flight:");
        for (const check of plan.validation.preFlight) {
          lines.push(`  ✓ ${check}`);
        }
      }
      if (plan.validation.postExecution.length > 0) {
        lines.push("Post-execution:");
        for (const check of plan.validation.postExecution) {
          lines.push(`  ✓ ${check}`);
        }
      }
      lines.push("");
    }

    lines.push("═".repeat(60));
    lines.push("DECISION REQUIRED");
    lines.push("═".repeat(60));
    lines.push("Reply with one of:");
    lines.push("  • approve / yes - Execute this plan");
    lines.push("  • reject [reason] - Cancel this plan");
    lines.push("  • explain [step-id] - Get more details");
    lines.push("  • modify [changes] - Request modifications");
    lines.push("═".repeat(60));

    return lines.join("\n");
  }

  /**
   * Parse user response to determine action
   */
  parseResponse(response: string): ApprovalResponse {
    const lower = response.toLowerCase().trim();
    const words = lower.split(/\s+/);
    const firstWord = words[0];
    const rest = words.slice(1).join(" ");

    if (this.approvalKeywords.includes(firstWord)) {
      return { action: "approve", comment: rest || undefined };
    }

    if (this.rejectionKeywords.includes(firstWord)) {
      return { action: "reject", comment: rest || undefined };
    }

    if (this.explainKeywords.includes(firstWord)) {
      return { action: "explain", query: rest || undefined };
    }

    if (this.modifyKeywords.includes(firstWord)) {
      return { action: "modify", comment: rest || undefined };
    }

    return { action: "unknown" };
  }

  /**
   * Check if plan can be auto-approved
   */
  canAutoApprove(plan: ExecutionPlan): boolean {
    if (!this.config.autoApproveLowRisk) {
      return false;
    }
    return plan.riskLevel === "LOW";
  }

  /**
   * Check if plan is blocked (CRITICAL requires explicit override)
   */
  isBlocked(plan: ExecutionPlan): boolean {
    return this.config.blockCritical && plan.riskLevel === "CRITICAL";
  }

  /**
   * Check if plan requires approval
   */
  requiresApproval(plan: ExecutionPlan): boolean {
    return this.config.requireApproval.includes(plan.riskLevel);
  }

  /**
   * Approve a plan
   */
  approve(plan: ExecutionPlan, approver: string, comment?: string): ExecutionPlan {
    if (this.isBlocked(plan)) {
      throw new Error(
        `CRITICAL risk plans are blocked. Use explicit override to approve plan ${plan.id}`
      );
    }

    plan.approval.status = "approved";
    plan.approval.approver = approver;
    plan.approval.approvedAt = new Date().toISOString();
    if (comment) {
      plan.approval.comment = comment;
    }

    this.planGenerator.updatePlan(plan);
    return plan;
  }

  /**
   * Approve a CRITICAL plan with explicit override
   */
  approveWithOverride(plan: ExecutionPlan, approver: string, comment?: string): ExecutionPlan {
    plan.approval.status = "approved";
    plan.approval.approver = approver;
    plan.approval.approvedAt = new Date().toISOString();
    plan.approval.comment = `[CRITICAL OVERRIDE] ${comment || "Explicit approval"}`;

    this.planGenerator.updatePlan(plan);
    return plan;
  }

  /**
   * Reject a plan
   */
  reject(plan: ExecutionPlan, approver: string, reason?: string): ExecutionPlan {
    plan.approval.status = "rejected";
    plan.approval.approver = approver;
    plan.approval.approvedAt = new Date().toISOString();
    plan.approval.comment = reason;
    plan.execution.status = "cancelled";

    this.planGenerator.updatePlan(plan);
    return plan;
  }

  /**
   * Explain a specific step
   */
  explainStep(plan: ExecutionPlan, stepId?: string): string {
    if (!stepId) {
      // Return overview of all steps
      return plan.steps
        .map((s) => `${s.id}: ${s.action} - ${s.description}`)
        .join("\n");
    }

    const step = plan.steps.find((s) => s.id === stepId);
    if (!step) {
      return `Step ${stepId} not found in plan`;
    }

    const lines = [
      `Step: ${step.id}`,
      `Action: ${step.action}`,
      `Description: ${step.description}`,
      `Command: ${step.command || "N/A"}`,
      `Resource: ${step.resource || "N/A"}`,
      `Risk Level: ${RISK_INDICATORS[step.riskLevel]}`,
      `Reversible: ${step.reversible ? "Yes" : "No"}`,
      `Expected Outcome: ${step.expectedOutcome || "N/A"}`,
      `Timeout: ${step.timeout}`,
    ];

    return lines.join("\n");
  }
}
