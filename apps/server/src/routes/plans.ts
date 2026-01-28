import { Elysia, t } from "elysia";
import {
  PlanGenerator,
  ApprovalHandler,
  AuditLogger,
} from "@opsbot/safety";
import type { RiskLevel } from "@opsbot/contracts";

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

// Request/Response schemas
const CreatePlanBody = t.Object({
  title: t.String(),
  riskLevel: t.Union([
    t.Literal("LOW"),
    t.Literal("MEDIUM"),
    t.Literal("HIGH"),
    t.Literal("CRITICAL"),
  ]),
  issue: t.String(),
  rootCause: t.Optional(t.String()),
  estimatedDuration: t.Optional(t.String()),
  steps: t.Array(
    t.Object({
      action: t.String(),
      description: t.String(),
      command: t.Optional(t.String()),
      resource: t.Optional(t.String()),
      riskLevel: t.Optional(
        t.Union([
          t.Literal("LOW"),
          t.Literal("MEDIUM"),
          t.Literal("HIGH"),
          t.Literal("CRITICAL"),
        ])
      ),
      reversible: t.Optional(t.Boolean()),
      expectedOutcome: t.Optional(t.String()),
      timeout: t.Optional(t.String()),
    })
  ),
  rollback: t.Optional(
    t.Object({
      method: t.String(),
      commands: t.Optional(t.Array(t.String())),
      estimatedTime: t.Optional(t.String()),
    })
  ),
  validation: t.Optional(
    t.Object({
      preFlight: t.Optional(t.Array(t.String())),
      postExecution: t.Optional(t.Array(t.String())),
    })
  ),
});

export const planRoutes = new Elysia({ prefix: "/api/plans" })
  // List all plans
  .get("/", () => {
    const planIds = planGenerator.listPlans();
    const plans = planIds.map((id) => {
      const plan = planGenerator.loadPlan(id);
      return plan
        ? {
            id: plan.id,
            title: plan.title,
            riskLevel: plan.riskLevel,
            approvalStatus: plan.approval.status,
            executionStatus: plan.execution.status,
            createdAt: plan.createdAt,
          }
        : null;
    }).filter(Boolean);

    return { plans, total: plans.length };
  })

  // List pending plans
  .get("/pending", () => {
    const plans = planGenerator.listPendingPlans();
    return {
      plans: plans.map((p) => ({
        id: p.id,
        title: p.title,
        riskLevel: p.riskLevel,
        createdAt: p.createdAt,
      })),
      total: plans.length,
    };
  })

  // Get a specific plan
  .get("/:planId", ({ params }) => {
    const plan = planGenerator.loadPlan(params.planId);
    if (!plan) {
      return { error: "Plan not found", planId: params.planId };
    }
    return { plan };
  })

  // Get plan formatted for review
  .get("/:planId/review", ({ params }) => {
    const plan = planGenerator.loadPlan(params.planId);
    if (!plan) {
      return { error: "Plan not found", planId: params.planId };
    }
    return {
      planId: plan.id,
      formatted: approvalHandler.formatPlan(plan),
    };
  })

  // Create a new plan
  .post(
    "/",
    ({ body }) => {
      try {
        const plan = planGenerator.create({
          title: body.title,
          riskLevel: body.riskLevel as RiskLevel,
          issue: body.issue,
          rootCause: body.rootCause,
          estimatedDuration: body.estimatedDuration,
          steps: body.steps.map((s) => ({
            action: s.action,
            description: s.description,
            command: s.command,
            resource: s.resource,
            riskLevel: (s.riskLevel as RiskLevel) || "LOW",
            reversible: s.reversible ?? true,
            expectedOutcome: s.expectedOutcome,
            timeout: s.timeout || "5m",
          })),
          rollback: body.rollback,
          validation: body.validation,
        });

        const filePath = planGenerator.savePlan(plan);

        // Log plan creation
        auditLogger.logAction({
          planId: plan.id,
          action: "plan_created",
          riskLevel: plan.riskLevel,
          status: "pending",
          notes: `Plan created: ${plan.title}`,
        });

        return {
          success: true,
          plan: {
            id: plan.id,
            title: plan.title,
            riskLevel: plan.riskLevel,
            requiresApproval: plan.approval.required,
          },
          filePath,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };
      }
    },
    { body: CreatePlanBody }
  )

  // Delete a plan (only if pending)
  .delete("/:planId", ({ params }) => {
    const plan = planGenerator.loadPlan(params.planId);
    if (!plan) {
      return { error: "Plan not found", planId: params.planId };
    }

    if (plan.approval.status !== "pending") {
      return {
        error: "Can only delete pending plans",
        planId: params.planId,
        status: plan.approval.status,
      };
    }

    // Mark as rejected/deleted
    approvalHandler.reject(plan, "system", "Deleted by user");

    return { success: true, planId: params.planId };
  });
