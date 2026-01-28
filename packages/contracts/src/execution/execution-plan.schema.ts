import { z } from "zod";

/**
 * Risk level classification for operations
 */
export const RiskLevelSchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export type RiskLevel = z.infer<typeof RiskLevelSchema>;

/**
 * Affected resource in a plan
 */
export const AffectedResourceSchema = z.object({
  type: z.string(),
  name: z.string(),
  namespace: z.string().optional(),
  provider: z.string().optional(),
});
export type AffectedResource = z.infer<typeof AffectedResourceSchema>;

/**
 * Execution step in a plan
 */
export const ExecutionStepSchema = z.object({
  id: z.string(),
  action: z.string(),
  description: z.string(),
  command: z.string().optional(),
  resource: z.string().optional(),
  riskLevel: RiskLevelSchema.default("LOW"),
  reversible: z.boolean().default(true),
  expectedOutcome: z.string().optional(),
  timeout: z.string().default("5m"),
});
export type ExecutionStep = z.infer<typeof ExecutionStepSchema>;

/**
 * Rollback configuration
 */
export const RollbackConfigSchema = z.object({
  method: z.string(),
  commands: z.array(z.string()).optional(),
  estimatedTime: z.string().optional(),
  verificationSteps: z.array(z.string()).optional(),
});
export type RollbackConfig = z.infer<typeof RollbackConfigSchema>;

/**
 * Approval status for a plan
 */
export const ApprovalStatusSchema = z.object({
  required: z.boolean().default(true),
  status: z.enum(["pending", "approved", "rejected", "expired"]).default("pending"),
  approver: z.string().nullable().default(null),
  approvedAt: z.string().datetime().nullable().default(null),
  comment: z.string().optional(),
});
export type ApprovalStatus = z.infer<typeof ApprovalStatusSchema>;

/**
 * Execution status tracking
 */
export const ExecutionStatusSchema = z.object({
  status: z.enum(["pending", "in_progress", "completed", "failed", "rolled_back", "cancelled"]).default("pending"),
  startedAt: z.string().datetime().nullable().default(null),
  completedAt: z.string().datetime().nullable().default(null),
  currentStep: z.number().default(0),
  completedSteps: z.array(z.string()).default([]),
  errors: z.array(z.string()).default([]),
});
export type ExecutionStatus = z.infer<typeof ExecutionStatusSchema>;

/**
 * Validation checks
 */
export const ValidationChecksSchema = z.object({
  preFlight: z.array(z.string()).default([]),
  postExecution: z.array(z.string()).default([]),
});
export type ValidationChecks = z.infer<typeof ValidationChecksSchema>;

/**
 * Full execution plan
 */
export const ExecutionPlanSchema = z.object({
  id: z.string(),
  title: z.string(),
  createdAt: z.string().datetime(),
  riskLevel: RiskLevelSchema,
  estimatedDuration: z.string().optional(),

  context: z.object({
    issue: z.string(),
    rootCause: z.string().optional(),
    affectedResources: z.array(AffectedResourceSchema).default([]),
  }),

  steps: z.array(ExecutionStepSchema).min(1),

  rollback: RollbackConfigSchema.optional(),

  approval: ApprovalStatusSchema.default({}),

  execution: ExecutionStatusSchema.default({}),

  validation: ValidationChecksSchema.default({}),

  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type ExecutionPlan = z.infer<typeof ExecutionPlanSchema>;

/**
 * Step execution result
 */
export const StepResultSchema = z.object({
  stepId: z.string(),
  status: z.enum(["success", "failed", "skipped"]),
  output: z.string().optional(),
  error: z.string().optional(),
  durationMs: z.number().optional(),
});
export type StepResult = z.infer<typeof StepResultSchema>;

/**
 * Plan execution result
 */
export const PlanExecutionResultSchema = z.object({
  planId: z.string(),
  success: z.boolean(),
  stepResults: z.array(StepResultSchema),
  totalDurationMs: z.number(),
  rolledBack: z.boolean().default(false),
});
export type PlanExecutionResult = z.infer<typeof PlanExecutionResultSchema>;
