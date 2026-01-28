import { TelegramBot } from "../channels/telegram/bot";
import { spawn } from "child_process";

interface HeartbeatConfig {
  chatId: string;
  cronExpression?: string;
  includeKubernetes?: boolean;
  includeDocker?: boolean;
  includeSystem?: boolean;
}

interface SystemStats {
  cpuUsage: number;
  memoryUsed: number;
  memoryTotal: number;
  diskUsed: number;
  diskTotal: number;
  uptime: string;
  loadAverage: number[];
}

interface DockerStats {
  runningContainers: number;
  totalContainers: number;
  images: number;
  imageSize: string;
  networks: number;
}

interface KubernetesStats {
  nodesReady: number;
  nodesTotal: number;
  podsRunning: number;
  podsPending: number;
  podsFailed: number;
  deploymentsAvailable: number;
  deploymentsTotal: number;
}

async function runCommand(command: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args);
    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(stderr || `Command failed with code ${code}`));
      }
    });

    proc.on("error", reject);
  });
}

async function getSystemStats(): Promise<SystemStats | null> {
  try {
    const os = await import("os");

    const cpus = os.cpus();
    const cpuUsage = cpus.reduce((acc, cpu) => {
      const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
      const idle = cpu.times.idle;
      return acc + ((total - idle) / total) * 100;
    }, 0) / cpus.length;

    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    // Get disk usage (works on Unix-like systems)
    let diskUsed = 0;
    let diskTotal = 0;
    try {
      const dfOutput = await runCommand("df", ["-k", "/"]);
      const lines = dfOutput.trim().split("\n");
      if (lines.length > 1) {
        const parts = lines[1].split(/\s+/);
        diskTotal = parseInt(parts[1]) * 1024; // Convert from KB to bytes
        diskUsed = parseInt(parts[2]) * 1024;
      }
    } catch {
      // Disk stats unavailable
    }

    const uptimeSeconds = os.uptime();
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const uptime = days > 0 ? `${days} days, ${hours} hours` : `${hours} hours`;

    return {
      cpuUsage: Math.round(cpuUsage),
      memoryUsed: usedMemory,
      memoryTotal: totalMemory,
      diskUsed,
      diskTotal,
      uptime,
      loadAverage: os.loadavg().map((l) => Math.round(l * 100) / 100),
    };
  } catch {
    return null;
  }
}

async function getDockerStats(): Promise<DockerStats | null> {
  try {
    // Get container counts
    const psOutput = await runCommand("docker", [
      "ps",
      "-a",
      "--format",
      "{{.Status}}",
    ]);
    const containers = psOutput.trim().split("\n").filter(Boolean);
    const runningContainers = containers.filter((c) =>
      c.startsWith("Up")
    ).length;

    // Get image count and size
    const imagesOutput = await runCommand("docker", [
      "images",
      "--format",
      "{{.Size}}",
    ]);
    const images = imagesOutput.trim().split("\n").filter(Boolean);

    // Get network count
    const networksOutput = await runCommand("docker", [
      "network",
      "ls",
      "--format",
      "{{.Name}}",
    ]);
    const networks = networksOutput.trim().split("\n").filter(Boolean).length;

    // Calculate total image size (approximate)
    let totalSize = 0;
    for (const size of images) {
      const match = size.match(/^([\d.]+)(\w+)$/);
      if (match) {
        const value = parseFloat(match[1]);
        const unit = match[2].toUpperCase();
        if (unit === "GB") totalSize += value * 1024 * 1024 * 1024;
        else if (unit === "MB") totalSize += value * 1024 * 1024;
        else if (unit === "KB") totalSize += value * 1024;
        else if (unit === "B") totalSize += value;
      }
    }

    const formatSize = (bytes: number): string => {
      if (bytes >= 1024 * 1024 * 1024)
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
      if (bytes >= 1024 * 1024)
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
      return `${(bytes / 1024).toFixed(1)} KB`;
    };

    return {
      runningContainers,
      totalContainers: containers.length,
      images: images.length,
      imageSize: formatSize(totalSize),
      networks,
    };
  } catch {
    return null;
  }
}

async function getKubernetesStats(): Promise<KubernetesStats | null> {
  try {
    // Get node status
    const nodesOutput = await runCommand("kubectl", [
      "get",
      "nodes",
      "-o",
      "jsonpath={range .items[*]}{.status.conditions[?(@.type=='Ready')].status}{' '}{end}",
    ]);
    const nodeStatuses = nodesOutput.trim().split(" ").filter(Boolean);
    const nodesReady = nodeStatuses.filter((s) => s === "True").length;
    const nodesTotal = nodeStatuses.length;

    // Get pod status
    const podsOutput = await runCommand("kubectl", [
      "get",
      "pods",
      "--all-namespaces",
      "-o",
      "jsonpath={range .items[*]}{.status.phase}{' '}{end}",
    ]);
    const podStatuses = podsOutput.trim().split(" ").filter(Boolean);
    const podsRunning = podStatuses.filter((s) => s === "Running").length;
    const podsPending = podStatuses.filter((s) => s === "Pending").length;
    const podsFailed = podStatuses.filter((s) => s === "Failed").length;

    // Get deployment status
    const deploymentsOutput = await runCommand("kubectl", [
      "get",
      "deployments",
      "--all-namespaces",
      "-o",
      "jsonpath={range .items[*]}{.status.availableReplicas}/{.status.replicas}{' '}{end}",
    ]);
    const deployments = deploymentsOutput.trim().split(" ").filter(Boolean);
    let deploymentsAvailable = 0;
    let deploymentsTotal = deployments.length;

    for (const d of deployments) {
      const [available, total] = d.split("/");
      if (available === total && available !== "0") {
        deploymentsAvailable++;
      }
    }

    return {
      nodesReady,
      nodesTotal,
      podsRunning,
      podsPending,
      podsFailed,
      deploymentsAvailable,
      deploymentsTotal,
    };
  } catch {
    return null;
  }
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export async function generateHeartbeatReport(
  config: HeartbeatConfig
): Promise<string> {
  const date = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  let report = `📊 *Daily DevOps Report - ${date}*\n\n`;
  let allHealthy = true;

  // Kubernetes stats
  if (config.includeKubernetes !== false) {
    const k8s = await getKubernetesStats();
    if (k8s) {
      const nodesHealthy = k8s.nodesReady === k8s.nodesTotal;
      const podsHealthy = k8s.podsFailed === 0 && k8s.podsPending === 0;
      const deploymentsHealthy =
        k8s.deploymentsAvailable === k8s.deploymentsTotal;

      if (!nodesHealthy || !podsHealthy || !deploymentsHealthy) {
        allHealthy = false;
      }

      report += `☸️ *Kubernetes*\n`;
      report += `├── Nodes: ${k8s.nodesReady}/${k8s.nodesTotal} Ready${nodesHealthy ? "" : " ⚠️"}\n`;
      report += `├── Pods: ${k8s.podsRunning} Running`;
      if (k8s.podsPending > 0) report += `, ${k8s.podsPending} Pending ⚠️`;
      if (k8s.podsFailed > 0) report += `, ${k8s.podsFailed} Failed 🔴`;
      report += `\n`;
      report += `└── Deployments: ${k8s.deploymentsAvailable}/${k8s.deploymentsTotal} Available${deploymentsHealthy ? "" : " ⚠️"}\n\n`;
    } else {
      report += `☸️ *Kubernetes*: Not available\n\n`;
    }
  }

  // Docker stats
  if (config.includeDocker !== false) {
    const docker = await getDockerStats();
    if (docker) {
      report += `🐳 *Docker*\n`;
      report += `├── Containers: ${docker.runningContainers} running\n`;
      report += `├── Images: ${docker.images} (${docker.imageSize})\n`;
      report += `└── Networks: ${docker.networks}\n\n`;
    } else {
      report += `🐳 *Docker*: Not available\n\n`;
    }
  }

  // System stats
  if (config.includeSystem !== false) {
    const system = await getSystemStats();
    if (system) {
      const memoryPercent = Math.round(
        (system.memoryUsed / system.memoryTotal) * 100
      );
      const diskPercent =
        system.diskTotal > 0
          ? Math.round((system.diskUsed / system.diskTotal) * 100)
          : 0;

      if (memoryPercent > 90 || diskPercent > 90) {
        allHealthy = false;
      }

      report += `💻 *System*\n`;
      report += `├── CPU: ${system.cpuUsage}% avg\n`;
      report += `├── Memory: ${formatBytes(system.memoryUsed)}/${formatBytes(system.memoryTotal)} (${memoryPercent}%)${memoryPercent > 80 ? " ⚠️" : ""}\n`;
      if (system.diskTotal > 0) {
        report += `├── Disk: ${formatBytes(system.diskUsed)}/${formatBytes(system.diskTotal)} (${diskPercent}%)${diskPercent > 80 ? " ⚠️" : ""}\n`;
      }
      report += `└── Uptime: ${system.uptime}\n\n`;
    } else {
      report += `💻 *System*: Stats unavailable\n\n`;
    }
  }

  report += allHealthy
    ? `✅ All systems operational`
    : `⚠️ Some issues detected - review above`;

  return report;
}

export async function sendHeartbeat(
  bot: TelegramBot,
  config: HeartbeatConfig
): Promise<void> {
  const report = await generateHeartbeatReport(config);
  await bot.sendMessage(config.chatId, report, { parseMode: "Markdown" });
}

export class HeartbeatScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private bot: TelegramBot;
  private config: HeartbeatConfig;

  constructor(bot: TelegramBot, config: HeartbeatConfig) {
    this.bot = bot;
    this.config = config;
  }

  start(intervalMs: number = 24 * 60 * 60 * 1000): void {
    // Send initial heartbeat
    sendHeartbeat(this.bot, this.config).catch(console.error);

    // Schedule recurring heartbeats
    this.intervalId = setInterval(() => {
      sendHeartbeat(this.bot, this.config).catch(console.error);
    }, intervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
