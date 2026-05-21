// start.mjs - Serveur Node.js natif pour Render
// Remplace "vite preview" qui ne gère pas correctement les server functions
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const DIST_CLIENT = join(__dirname, "dist", "client");
const PORT = parseInt(process.env.PORT || "10000", 10);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
};

console.log("⏳ Loading SSR handler from dist/server/index.js...");
let handler;
try {
  const mod = await import("./dist/server/index.js");
  handler = mod.default;
  console.log("✅ SSR handler loaded.");
} catch (err) {
  console.error("❌ Failed to load SSR handler:", err);
  process.exit(1);
}

/** Convert a Node.js IncomingMessage to a Web API Request */
async function nodeToWebRequest(req) {
  const host = req.headers.host || `localhost:${PORT}`;
  // Render terminates TLS, so behind the proxy it's http but externally it's https
  const proto = req.headers["x-forwarded-proto"] || "https";
  const url = new URL(req.url, `${proto}://${host}`);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => headers.append(key, v));
    } else {
      headers.set(key, value);
    }
  }

  let body = null;
  if (req.method !== "GET" && req.method !== "HEAD") {
    const chunks = [];
    await new Promise((resolve, reject) => {
      req.on("data", (c) => chunks.push(c));
      req.on("end", resolve);
      req.on("error", reject);
    });
    if (chunks.length > 0) body = Buffer.concat(chunks);
  }

  return new Request(url.toString(), {
    method: req.method,
    headers,
    body: body?.length ? body : undefined,
  });
}

/** Pipe a Web API Response back to the Node.js response */
async function sendWebResponse(webRes, res) {
  const headers = {};
  webRes.headers.forEach((value, key) => {
    headers[key] = value;
  });
  res.writeHead(webRes.status, headers);

  if (webRes.body) {
    const reader = webRes.body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    } catch (e) {
      console.error("Stream error:", e);
    }
  }
  res.end();
}

const httpServer = createServer(async (req, res) => {
  try {
    // 1. Try to serve from dist/client (static assets)
    const rawPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
    const staticPath = join(DIST_CLIENT, rawPath);

    if (existsSync(staticPath) && statSync(staticPath).isFile()) {
      const ext = extname(staticPath).toLowerCase();
      const mime = MIME[ext] || "application/octet-stream";
      const isImmutable = rawPath.startsWith("/assets/");
      res.writeHead(200, {
        "Content-Type": mime,
        "Cache-Control": isImmutable
          ? "public, max-age=31536000, immutable"
          : "no-cache, no-store, must-revalidate",
      });
      createReadStream(staticPath).pipe(res);
      return;
    }

    // 2. Everything else → TanStack Start SSR + server functions handler
    const webReq = await nodeToWebRequest(req);
    const webRes = await handler.fetch(webReq, {}, {});
    await sendWebResponse(webRes, res);
  } catch (err) {
    console.error("[500]", req.url, err);
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "text/plain" });
    }
    res.end("Internal Server Error");
  }
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server is running on http://0.0.0.0:${PORT}`);
});
