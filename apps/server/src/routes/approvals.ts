import { Elysia, t } from "elysia";
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
const approvalHandler = new ApprovalHandler(planGenerator, {
  autoApproveLowRisk: false,
  blockCritical: true,
});
const executor = new Executor(planGenerator, auditLogger, {
  dryRun: process.env.OPSBOT_DRY_RUN === "true",
});

// Schemas
const ApproveBody = t.Object({
  approver: t.String(),
  comment: t.Optional(t.String()),
  override: t.Optional(t.Boolean()),
});

const RejectBody = t.Object({
  approver: t.String(),
  reason: t.Optional(t.String()),
});

export const approvalRoutes = new Elysia({ prefix: "/api/approvals" })
  // Get pending approvals
  .get("/pending", () => {
    const plans = planGenerator.listPendingPlans();
    return {
      pending: plans.map((p) => ({
        planId: p.id,
        title: p.title,
        riskLevel: p.riskLevel,
        createdAt: p.createdAt,
        requiresApproval: p.approval.required,
      })),
      total: plans.length,
    };
  })

  // Approve a plan
  .post(
    "/:planId/approve",
    async ({ params, body }) => {
      const plan = planGenerator.loadPlan(params.planId);
      if (!plan) {
        return { error: "Plan not found", planId: params.planId };
      }

      if (plan.approval.status !== "pending") {
        return {
          error: "Plan is not pending approval",
          planId: params.planId,
          currentStatus: plan.approval.status,
        };
      }

      try {
        let approvedPlan;
        if (plan.riskLevel === "CRITICAL" && body.override) {
          approvedPlan = approvalHandler.approveWithOverride(
            plan,
            body.approver,
            body.comment
          );
        } else {
          approvedPlan = approvalHandler.approve(plan, body.approver, body.comment);
        }

        // Log approval
        await auditLogger.logAction({
          planId: plan.id,
          action: "plan_approved",
          riskLevel: plan.riskLevel,
          status: "success",
          approver: body.approver,
          notes: body.comment,
        });

        return {
          success: true,
          planId: approvedPlan.id,
          status: approvedPlan.approval.status,
          approver: approvedPlan.approval.approver,
          message: "Plan approved. Use POST /api/approvals/:planId/execute to run.",
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Approval failed",
        };
      }
    },
    { body: ApproveBody }
  )

  // Reject a plan
  .post(
    "/:planId/reject",
    async ({ params, body }) => {
      const plan = planGenerator.loadPlan(params.planId);
      if (!plan) {
        return { error: "Plan not found", planId: params.planId };
      }

      if (plan.approval.status !== "pending") {
        return {
          error: "Plan is not pending approval",
          planId: params.planId,
          currentStatus: plan.approval.status,
        };
      }

      const rejectedPlan = approvalHandler.reject(plan, body.approver, body.reason);

      // Log rejection
      await auditLogger.logAction({
        planId: plan.id,
        action: "plan_rejected",
        riskLevel: plan.riskLevel,
        status: "cancelled",
        approver: body.approver,
        notes: body.reason,
      });

      return {
        success: true,
        planId: rejectedPlan.id,
        status: rejectedPlan.approval.status,
        reason: body.reason,
      };
    },
    { body: RejectBody }
  )

  // Execute an approved plan
  .post("/:planId/execute", async ({ params }) => {
    const plan = planGenerator.loadPlan(params.planId);
    if (!plan) {
      return { error: "Plan not found", planId: params.planId };
    }

    if (plan.approval.status !== "approved") {
      return {
        error: "Plan must be approved before execution",
        planId: params.planId,
        approvalStatus: plan.approval.status,
      };
    }

    if (plan.execution.status === "completed") {
      return {
        error: "Plan has already been executed",
        planId: params.planId,
        executionStatus: plan.execution.status,
      };
    }

    try {
      const result = await executor.execute(plan);

      return {
        success: result.success,
        planId: result.planId,
        stepResults: result.stepResults,
        totalDurationMs: result.totalDurationMs,
        rolledBack: result.rolledBack,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Execution failed",
      };
    }
  })

  // Rollback an executed plan
  .post("/:planId/rollback", async ({ params }) => {
    const plan = planGenerator.loadPlan(params.planId);
    if (!plan) {
      return { error: "Plan not found", planId: params.planId };
    }

    if (!plan.rollback) {
      return {
        error: "Plan has no rollback procedure defined",
        planId: params.planId,
      };
    }

    try {
      const success = await executor.rollback(plan);

      return {
        success,
        planId: params.planId,
        status: plan.execution.status,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Rollback failed",
      };
    }
  })

  // Get audit log
  .get("/audit", async ({ query }) => {
    const limit = query.limit ? parseInt(query.limit as string) : 20;
    const entries = await auditLogger.readRecent(limit);
    const stats = await auditLogger.getStats();

    return {
      entries,
      stats: {
        total: stats.totalActions,
        success: stats.successCount,
        failed: stats.failedCount,
        riskDistribution: stats.riskDistribution,
      },
    };
  })

  // Get audit log for a specific plan
  .get("/audit/:planId", async ({ params }) => {
    const entries = await auditLogger.readByPlan(params.planId);
    return { planId: params.planId, entries };
  });
