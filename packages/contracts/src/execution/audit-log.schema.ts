import { z } from "zod";
import { RiskLevelSchema } from "./execution-plan.schema.js";

/**
 * Audit log entry for tracking all operations
 */
export const AuditLogEntrySchema = z.object({
  timestamp: z.string().datetime(),
  planId: z.string(),
  action: z.string(),
  resource: z.string().optional(),
  riskLevel: RiskLevelSchema,
  status: z.enum(["success", "failed", "pending", "cancelled"]),
  durationSeconds: z.number().optional(),
  approver: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>;

/**
 * Audit log statistics
 */
export const AuditStatsSchema = z.object({
  totalActions: z.number(),
  successCount: z.number(),
  failedCount: z.number(),
  riskDistribution: z.object({
    LOW: z.number(),
    MEDIUM: z.number(),
    HIGH: z.number(),
    CRITICAL: z.number(),
  }),
  recentActions: z.array(AuditLogEntrySchema),
});
export type AuditStats = z.infer<typeof AuditStatsSchema>;
