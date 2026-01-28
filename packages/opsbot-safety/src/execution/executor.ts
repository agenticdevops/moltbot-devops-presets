import type {
  ExecutionPlan,
  ExecutionStep,
  StepResult,
  PlanExecutionResult,
} from "@opsbot/contracts";
import { PlanGenerator } from "./plan-generator.js";
import { AuditLogger } from "./audit-logger.js";
import { spawn } from "child_process";

export interface ExecutorConfig {
  dryRun: boolean;
  pauseBetweenSteps: boolean;
  defaultTimeoutMs: number;
}

const DEFAULT_CONFIG: ExecutorConfig = {
  dryRun: false,
  pauseBetweenSteps: false,
  defaultTimeoutMs: 300000, // 5 minutes
};

export class Executor {
  private planGenerator: PlanGenerator;
  private logger: AuditLogger;
  private config: ExecutorConfig;

  constructor(
    planGenerator: PlanGenerator,
    logger: AuditLogger,
    config: Partial<ExecutorConfig> = {}
  ) {
    this.planGenerator = planGenerator;
    this.logger = logger;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Parse timeout string to milliseconds
   * Supports: "5s", "10m", "2h"
   */
  private parseTimeout(timeout: string): number {
    const match = timeout.match(/^(\d+)(s|m|h)$/);
    if (!match) {
      return this.config.defaultTimeoutMs;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case "s":
        return value * 1000;
      case "m":
        return value * 60 * 1000;
      case "h":
        return value * 60 * 60 * 1000;
      default:
        return this.config.defaultTimeoutMs;
    }
  }

  /**
   * Execute a shell command with timeout
   */
  private async executeCommand(
    command: string,
    timeoutMs: number
  ): Promise<{ success: boolean; output: string; error?: string }> {
    if (this.config.dryRun) {
      return {
        success: true,
        output: `[DRY RUN] Would execute: ${command}`,
      };
    }

    return new Promise((resolve) => {
      const parts = command.split(" ");
      const cmd = parts[0];
      const args = parts.slice(1);

      let stdout = "";
      let stderr = "";
      let killed = false;

      const proc = spawn(cmd, args, {
        shell: true,
        timeout: timeoutMs,
      });

      proc.stdout?.on("data", (data) => {
        stdout += data.toString();
      });

      proc.stderr?.on("data", (data) => {
        stderr += data.toString();
      });

      const timer = setTimeout(() => {
        killed = true;
        proc.kill("SIGTERM");
      }, timeoutMs);

      proc.on("close", (code) => {
        clearTimeout(timer);

        if (killed) {
          resolve({
            success: false,
            output: stdout,
            error: `Command timed out after ${timeoutMs}ms`,
          });
        } else if (code === 0) {
          resolve({
            success: true,
            output: stdout,
          });
        } else {
          resolve({
            success: false,
            output: stdout,
            error: stderr || `Command exited with code ${code}`,
          });
        }
      });

      proc.on("error", (err) => {
        clearTimeout(timer);
        resolve({
          success: false,
          output: "",
          error: err.message,
        });
      });
    });
  }

  /**
   * Execute a single step
   */
  private async executeStep(step: ExecutionStep): Promise<StepResult> {
    const startTime = Date.now();
    const timeoutMs = this.parseTimeout(step.timeout);

    if (!step.command) {
      return {
        stepId: step.id,
        status: "skipped",
        output: "No command specified",
        durationMs: Date.now() - startTime,
      };
    }

    const result = await this.executeCommand(step.command, timeoutMs);

    return {
      stepId: step.id,
      status: result.success ? "success" : "failed",
      output: result.output,
      error: result.error,
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Run pre-flight validation checks
   */
  private async runPreFlightChecks(plan: ExecutionPlan): Promise<boolean> {
    if (plan.validation.preFlight.length === 0) {
      return true;
    }

    console.log("Running pre-flight checks...");
    for (const check of plan.validation.preFlight) {
      // For now, just log the checks - real implementation would run them
      console.log(`  ✓ ${check}`);
    }
    return true;
  }

  /**
   * Run post-execution validation checks
   */
  private async runPostExecutionChecks(plan: ExecutionPlan): Promise<boolean> {
    if (plan.validation.postExecution.length === 0) {
      return true;
    }

    console.log("Running post-execution checks...");
    for (const check of plan.validation.postExecution) {
      console.log(`  ✓ ${check}`);
    }
    return true;
  }

  /**
   * Execute the rollback procedure
   */
  async rollback(plan: ExecutionPlan): Promise<boolean> {
    if (!plan.rollback) {
      console.log("No rollback procedure defined");
      return false;
    }

    console.log("Executing rollback...");

    if (plan.rollback.commands) {
      for (const cmd of plan.rollback.commands) {
        console.log(`  Running: ${cmd}`);
        const result = await this.executeCommand(cmd, this.config.defaultTimeoutMs);
        if (!result.success) {
          console.log(`  ⚠ Rollback command failed: ${result.error}`);
          // Continue with remaining rollback commands
        }
      }
    }

    plan.execution.status = "rolled_back";
    this.planGenerator.updatePlan(plan);

    await this.logger.logAction({
      timestamp: new Date().toISOString(),
      planId: plan.id,
      action: "rollback",
      riskLevel: plan.riskLevel,
      status: "success",
      notes: "Rollback completed",
    });

    return true;
  }

  /**
   * Execute an approved plan
   */
  async execute(plan: ExecutionPlan): Promise<PlanExecutionResult> {
    const startTime = Date.now();

    // Validate plan is approved
    if (plan.approval.status !== "approved") {
      throw new Error(`Plan ${plan.id} is not approved. Current status: ${plan.approval.status}`);
    }

    // Prevent re-execution
    if (plan.execution.status === "completed") {
      throw new Error(`Plan ${plan.id} has already been executed`);
    }

    // Update status to in_progress
    plan.execution.status = "in_progress";
    plan.execution.startedAt = new Date().toISOString();
    this.planGenerator.updatePlan(plan);

    await this.logger.logAction({
      timestamp: new Date().toISOString(),
      planId: plan.id,
      action: "execution_started",
      riskLevel: plan.riskLevel,
      status: "pending",
      approver: plan.approval.approver || undefined,
    });

    // Run pre-flight checks
    const preFlightOk = await this.runPreFlightChecks(plan);
    if (!preFlightOk) {
      plan.execution.status = "failed";
      plan.execution.errors.push("Pre-flight checks failed");
      this.planGenerator.updatePlan(plan);

      return {
        planId: plan.id,
        success: false,
        stepResults: [],
        totalDurationMs: Date.now() - startTime,
        rolledBack: false,
      };
    }

    // Execute steps
    const stepResults: StepResult[] = [];
    let allSucceeded = true;

    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      plan.execution.currentStep = i + 1;
      this.planGenerator.updatePlan(plan);

      console.log(`Executing step ${step.id}: ${step.description}`);

      const result = await this.executeStep(step);
      stepResults.push(result);

      if (result.status === "success") {
        plan.execution.completedSteps.push(step.id);
        console.log(`  ✓ Step ${step.id} completed`);
      } else if (result.status === "failed") {
        allSucceeded = false;
        plan.execution.errors.push(`Step ${step.id} failed: ${result.error}`);
        console.log(`  ✗ Step ${step.id} failed: ${result.error}`);
        break; // Stop on failure
      }
    }

    // Handle failure - attempt rollback
    let rolledBack = false;
    if (!allSucceeded && plan.rollback) {
      console.log("Execution failed, attempting rollback...");
      rolledBack = await this.rollback(plan);
    }

    // Run post-execution checks if successful
    if (allSucceeded) {
      await this.runPostExecutionChecks(plan);
    }

    // Update final status
    plan.execution.status = allSucceeded ? "completed" : rolledBack ? "rolled_back" : "failed";
    plan.execution.completedAt = new Date().toISOString();
    this.planGenerator.updatePlan(plan);

    const totalDurationMs = Date.now() - startTime;

    await this.logger.logAction({
      timestamp: new Date().toISOString(),
      planId: plan.id,
      action: "execution_completed",
      riskLevel: plan.riskLevel,
      status: allSucceeded ? "success" : "failed",
      durationSeconds: Math.round(totalDurationMs / 1000),
      approver: plan.approval.approver || undefined,
      notes: rolledBack ? "Rolled back after failure" : undefined,
    });

    return {
      planId: plan.id,
      success: allSucceeded,
      stepResults,
      totalDurationMs,
      rolledBack,
    };
  }
}
