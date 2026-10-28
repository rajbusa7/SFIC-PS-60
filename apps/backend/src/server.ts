import { app } from "./app";
import { config } from "./config/environment";

const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` StudySaathi AI Backend Server Running`);
  console.log(` URL: http://localhost:${PORT}`);
  console.log(` API Prefix: ${config.apiPrefix}`);
  console.log(` Health Check: http://localhost:${PORT}${config.apiPrefix}/health`);
  console.log(` Environment: ${config.nodeEnv}`);
  console.log(`====================================================`);
});

// Graceful Shutdown
function handleShutdown(signal: string) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(() => {
    console.log("StudySaathi AI Backend closed cleanly.");
    process.exit(0);
  });
}

process.on("SIGINT", () => handleShutdown("SIGINT"));
process.on("SIGTERM", () => handleShutdown("SIGTERM"));

export default server;
