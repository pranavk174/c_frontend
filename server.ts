import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { createProxyMiddleware } from "http-proxy-middleware";
import type { IncomingMessage, ServerResponse } from "http";
import { loadEnvConfig } from "@next/env";
import type { Socket } from "node:net";
import { logger } from "@/lib/utils";
// Load .env before anything else so BASE_URL is available
loadEnvConfig(process.cwd());

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const backendUrl = process.env.BASE_URL;

  if (!backendUrl) {
    throw new Error("BASE_URL is not defined in .env");
  }

  // Proxy all /socket.io/* requests to backend.
  // Because the browser connects to localhost, all localhost cookies
  // (including httpOnly accessToken) are sent automatically.
  const socketProxy = createProxyMiddleware<IncomingMessage, ServerResponse>({
    target: backendUrl,
    changeOrigin: true,
    ws: true,
    pathFilter: "/socket.io",
  });

  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);

    if (req.url?.startsWith("/socket.io")) {
      return socketProxy(req, res, () => {
        handle(req, res, parsedUrl);
      });
    }

    handle(req, res, parsedUrl);
  });

  // Proxy WebSocket upgrade requests

  server.on("upgrade", (req, socket, head) => {
    if (req.url?.startsWith("/socket.io")) {
      socketProxy.upgrade!(req, socket as Socket, head);
    }
  });

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    logger.log(`> Ready on http://localhost:${port}`);
  });
});
