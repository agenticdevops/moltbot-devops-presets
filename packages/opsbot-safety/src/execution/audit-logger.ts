import type { AuditLogEntry, AuditStats, RiskLevel } from "@opsbot/contracts";
import { existsSync, mkdirSync, appendFileSync, readFileSync } from "fs";
import { dirname } from "path";

export interface AuditLoggerConfig {
  logFile: string;
  rotationSizeBytes: number;
  retentionDays: number;
}

const DEFAULT_CONFIG: AuditLoggerConfig = {
  logFile: "memory/actions-log.jsonl",
  rotationSizeBytes: 100 * 1024 * 1024, // 100MB
  retentionDays: 90,
};

export class AuditLogger {
  private config: AuditLoggerConfig;

  constructor(config: Partial<AuditLoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.ensureLogFile();
  }

  /**
   * Ensure log file and directory exist
   */
  private ensureLogFile(): void {
    const dir = dirname(this.config.logFile);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    if (!existsSync(this.config.logFile)) {
      // Write header comment
      appendFileSync(
        this.config.logFile,
        `# Opsbot Audit Log - Created ${new Date().toISOString()}\n`
      );
    }
  }

  /**
   * Log an action to the audit trail
   */
  async logAction(entry: Omit<AuditLogEntry, "timestamp"> & { timestamp?: string }): Promise<void> {
    const fullEntry: AuditLogEntry = {
      timestamp: entry.timestamp || new Date().toISOString(),
      planId: entry.planId,
      action: entry.action,
      resource: entry.resource,
      riskLevel: entry.riskLevel,
      status: entry.status,
      durationSeconds: entry.durationSeconds,
      approver: entry.approver,
      notes: entry.notes,
      metadata: entry.metadata,
    };

    const line = JSON.stringify(fullEntry) + "\n";
    appendFileSync(this.config.logFile, line);
  }

  /**
   * Read all log entries
   */
  private readAllEntries(): AuditLogEntry[] {
    if (!existsSync(this.config.logFile)) {
      return [];
    }

    const content = readFileSync(this.config.logFile, "utf-8");
    const lines = content.split("\n").filter((l) => l.trim() && !l.startsWith("#"));

    return lines
      .map((line) => {
        try {
          return JSON.parse(line) as AuditLogEntry;
        } catch {
          return null;
        }
      })
      .filter((e): e is AuditLogEntry => e !== null);
  }

  /**
   * Read recent entries
   */
  async readRecent(limit: number = 10): Promise<AuditLogEntry[]> {
    const entries = this.readAllEntries();
    return entries.slice(-limit);
  }

  /**
   * Read entries for a specific plan
   */
  async readByPlan(planId: string): Promise<AuditLogEntry[]> {
    const entries = this.readAllEntries();
    return entries.filter((e) => e.planId === planId);
  }

  /**
   * Export entries within a date range
   */
  async exportRange(startDate: Date, endDate: Date): Promise<AuditLogEntry[]> {
    const entries = this.readAllEntries();
    return entries.filter((e) => {
      const entryDate = new Date(e.timestamp);
      return entryDate >= startDate && entryDate <= endDate;
    });
  }

  /**
   * Get statistics from the audit log
   */
  async getStats(): Promise<AuditStats> {
    const entries = this.readAllEntries();

    const stats: AuditStats = {
      totalActions: entries.length,
      successCount: entries.filter((e) => e.status === "success").length,
      failedCount: entries.filter((e) => e.status === "failed").length,
      riskDistribution: {
        LOW: entries.filter((e) => e.riskLevel === "LOW").length,
        MEDIUM: entries.filter((e) => e.riskLevel === "MEDIUM").length,
        HIGH: entries.filter((e) => e.riskLevel === "HIGH").length,
        CRITICAL: entries.filter((e) => e.riskLevel === "CRITICAL").length,
      },
      recentActions: entries.slice(-5),
    };

    return stats;
  }

  /**
   * Search entries by action type
   */
  async searchByAction(action: string): Promise<AuditLogEntry[]> {
    const entries = this.readAllEntries();
    return entries.filter((e) => e.action.toLowerCase().includes(action.toLowerCase()));
  }

  /**
   * Search entries by approver
   */
  async searchByApprover(approver: string): Promise<AuditLogEntry[]> {
    const entries = this.readAllEntries();
    return entries.filter((e) => e.approver?.toLowerCase().includes(approver.toLowerCase()));
  }

  /**
   * Get entries by risk level
   */
  async getByRiskLevel(riskLevel: RiskLevel): Promise<AuditLogEntry[]> {
    const entries = this.readAllEntries();
    return entries.filter((e) => e.riskLevel === riskLevel);
  }

  /**
   * Format a summary of recent activity
   */
  async formatSummary(): Promise<string> {
    const stats = await this.getStats();
    const recent = await this.readRecent(5);

    const lines = [
      "═".repeat(50),
      "AUDIT LOG SUMMARY",
      "═".repeat(50),
      "",
      `Total Actions: ${stats.totalActions}`,
      `Success Rate: ${stats.totalActions > 0 ? Math.round((stats.successCount / stats.totalActions) * 100) : 0}%`,
      "",
      "Risk Distribution:",
      `  🟢 LOW: ${stats.riskDistribution.LOW}`,
      `  🟡 MEDIUM: ${stats.riskDistribution.MEDIUM}`,
      `  🔴 HIGH: ${stats.riskDistribution.HIGH}`,
      `  ⛔ CRITICAL: ${stats.riskDistribution.CRITICAL}`,
      "",
      "Recent Actions:",
    ];

    for (const entry of recent) {
      const status = entry.status === "success" ? "✓" : entry.status === "failed" ? "✗" : "○";
      lines.push(`  ${status} ${entry.action} (${entry.planId}) - ${entry.riskLevel}`);
    }

    lines.push("═".repeat(50));

    return lines.join("\n");
  }
}
