import type {
  ExecutionPlan,
  ExecutionStep,
  RiskLevel,
  AffectedResource,
  RollbackConfig,
} from "@opsbot/contracts";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

export interface CreatePlanParams {
  title: string;
  riskLevel: RiskLevel;
  issue: string;
  rootCause?: string;
  affectedResources?: AffectedResource[];
  steps: Omit<ExecutionStep, "id">[];
  rollback?: RollbackConfig;
  estimatedDuration?: string;
  validation?: {
    preFlight?: string[];
    postExecution?: string[];
  };
}

export class PlanGenerator {
  private plansDir: string;

  constructor(plansDir: string = "memory/execution-plans") {
    this.plansDir = plansDir;
    this.ensurePlansDir();
  }

  private ensurePlansDir(): void {
    if (!existsSync(this.plansDir)) {
      mkdirSync(this.plansDir, { recursive: true });
    }
  }

  /**
   * Generate a unique plan ID in format: plan-YYYYMMDD-NNN
   */
  private generatePlanId(): string {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");

    // Find existing plans for today
    const existingPlans = readdirSync(this.plansDir)
      .filter((f) => f.startsWith(`plan-${dateStr}`))
      .sort();

    // Get next sequence number
    let seq = 1;
    if (existingPlans.length > 0) {
      const lastPlan = existingPlans[existingPlans.length - 1];
      const match = lastPlan.match(/plan-\d+-(\d+)/);
      if (match) {
        seq = parseInt(match[1], 10) + 1;
      }
    }

    return `plan-${dateStr}-${seq.toString().padStart(3, "0")}`;
  }

  /**
   * Validate plan parameters
   */
  private validateParams(params: CreatePlanParams): void {
    if (!params.title) {
      throw new Error("Plan title is required");
    }

    const validRiskLevels = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    if (!validRiskLevels.includes(params.riskLevel)) {
      throw new Error(`Invalid risk level: ${params.riskLevel}. Must be one of: ${validRiskLevels.join(", ")}`);
    }

    if (!params.steps || params.steps.length === 0) {
      throw new Error("At least one execution step is required");
    }

    if (!params.issue) {
      throw new Error("Issue description is required");
    }
  }

  /**
   * Format steps with sequential IDs
   */
  private formatSteps(steps: Omit<ExecutionStep, "id">[]): ExecutionStep[] {
    return steps.map((step, index) => ({
      id: `step-${index + 1}`,
      action: step.action,
      description: step.description,
      command: step.command,
      resource: step.resource,
      riskLevel: step.riskLevel || "LOW",
      reversible: step.reversible ?? true,
      expectedOutcome: step.expectedOutcome,
      timeout: step.timeout || "5m",
    }));
  }

  /**
   * Create a new execution plan
   */
  create(params: CreatePlanParams): ExecutionPlan {
    this.validateParams(params);

    const planId = this.generatePlanId();
    const now = new Date().toISOString();

    const plan: ExecutionPlan = {
      id: planId,
      title: params.title,
      createdAt: now,
      riskLevel: params.riskLevel,
      estimatedDuration: params.estimatedDuration,

      context: {
        issue: params.issue,
        rootCause: params.rootCause,
        affectedResources: params.affectedResources || [],
      },

      steps: this.formatSteps(params.steps),

      rollback: params.rollback,

      approval: {
        required: params.riskLevel !== "LOW",
        status: "pending",
        approver: null,
        approvedAt: null,
      },

      execution: {
        status: "pending",
        startedAt: null,
        completedAt: null,
        currentStep: 0,
        completedSteps: [],
        errors: [],
      },

      validation: {
        preFlight: params.validation?.preFlight || [],
        postExecution: params.validation?.postExecution || [],
      },
    };

    return plan;
  }

  /**
   * Save plan to disk as JSON
   */
  savePlan(plan: ExecutionPlan): string {
    const filePath = join(this.plansDir, `${plan.id}.json`);
    writeFileSync(filePath, JSON.stringify(plan, null, 2));
    return filePath;
  }

  /**
   * Load plan from disk
   */
  loadPlan(planId: string): ExecutionPlan | null {
    const filePath = join(this.plansDir, `${planId}.json`);
    if (!existsSync(filePath)) {
      return null;
    }
    const content = readFileSync(filePath, "utf-8");
    return JSON.parse(content) as ExecutionPlan;
  }

  /**
   * Update plan and save
   */
  updatePlan(plan: ExecutionPlan): void {
    this.savePlan(plan);
  }

  /**
   * List all plans
   */
  listPlans(): string[] {
    return readdirSync(this.plansDir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""));
  }

  /**
   * List pending plans awaiting approval
   */
  listPendingPlans(): ExecutionPlan[] {
    return this.listPlans()
      .map((id) => this.loadPlan(id))
      .filter((p): p is ExecutionPlan => p !== null && p.approval.status === "pending");
  }
}
