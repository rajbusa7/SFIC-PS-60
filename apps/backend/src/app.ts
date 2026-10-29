import express, { Express, Request, Response } from "express";
import cors from "cors";
import v1Routes from "./routes";
import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/logger";
import { config } from "./config/environment";

export function createApp(): Express {
  const app = express();

  // Core Middleware
  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true, limit: "2mb" }));
  app.use(requestLogger);

  // Mount API v1 Routes
  app.use("/api/v1", v1Routes);

  // Root Welcome / Health Redirect
  app.get("/", (req: Request, res: Response) => {
    res.status(200).json({
      name: "ShikshaSetu AI Backend API",
      version: "1.0.0",
      status: "running",
      documentation: "/docs/API.md",
      health: "/api/v1/health",
    });
  });

  // 404 Fallback for unknown routes
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: `Route not found: ${req.method} ${req.originalUrl}`,
      availableEndpoints: "/api/v1/health",
    });
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
