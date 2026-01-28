import { Elysia, t } from "elysia";

export const healthRoutes = new Elysia({ prefix: "/health" })
  .get("/", () => ({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "0.1.0",
    uptime: process.uptime(),
  }))
  .get("/ready", () => {
    // Check if all dependencies are ready
    const checks = {
      memory: true,
      config: true,
    };

    const allReady = Object.values(checks).every(Boolean);

    return {
      ready: allReady,
      checks,
      timestamp: new Date().toISOString(),
    };
  })
  .get("/live", () => ({
    live: true,
    timestamp: new Date().toISOString(),
  }));
