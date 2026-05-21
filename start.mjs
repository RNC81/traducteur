/**
 * start.mjs — Serveur Node.js natif pour Render
 *
 * Toute la logique API (auth, sessions, transcripts, SSE) est gérée
 * directement ici en Node.js pur, sans passer par TanStack Start server
 * functions (qui causaient des erreurs require/vinxi en production).
 *
 * Le reste (pages UI) passe au handler TanStack Start compilé.
 */

import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { parse as parseCookies, serialize as serializeCookie } from "cookie";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const DIST_CLIENT = join(__dirname, "dist", "client");
const PORT = parseInt(process.env.PORT || "10000", 10);

// ─── ENV ─────────────────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || "dev_fallback_only_not_for_prod";

if (!MONGO_URI) {
  console.error("❌ MONGO_URI environment variable is not set.");
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.warn("⚠️  JWT_SECRET is not set — using insecure fallback (dev only).");
}

// ─── DATABASE ────────────────────────────────────────────────────────────────
let dbConn = null;
async function connectDB() {
  if (dbConn) return dbConn;
  dbConn = await mongoose.connect(MONGO_URI, { bufferCommands: false });
  console.log("✅ MongoDB connected.");
  return dbConn;
}

// ─── MODELS ──────────────────────────────────────────────────────────────────
const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String },
    name: { type: String },
  },
  { timestamps: true }
);
const User = mongoose.models.User || mongoose.model("User", UserSchema);

const SessionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    source_lang: { type: String, required: true },
    target_langs: [{ type: String }],
    mode: { type: String, enum: ["live", "faith"], default: "live" },
    share_code: { type: String, required: true, unique: true },
    is_live: { type: Boolean, default: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    started_at: { type: Date, default: Date.now },
    ended_at: { type: Date },
  },
  { timestamps: true }
);
const Session = mongoose.models.Session || mongoose.model("Session", SessionSchema);

const TranscriptSchema = new mongoose.Schema(
  {
    session_id: { type: mongoose.Schema.Types.ObjectId, ref: "Session", required: true },
    original_text: { type: String, required: true },
    translations: { type: Map, of: String },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);
const Transcript = mongoose.models.Transcript || mongoose.model("Transcript", TranscriptSchema);

// ─── SSE CLIENTS ─────────────────────────────────────────────────────────────
// Map<shareCode, Set<(msg: string) => void>>
const sseClients = new Map();

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function json(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function getUserFromCookie(req) {
  try {
    const cookies = parseCookies(req.headers.cookie || "");
    const token = cookies.auth_token;
    if (!token) return null;
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function setAuthCookie(res, userId) {
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
  res.setHeader(
    "Set-Cookie",
    serializeCookie("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    })
  );
  return token;
}

function clearAuthCookie(res) {
  res.setHeader(
    "Set-Cookie",
    serializeCookie("auth_token", "", { httpOnly: true, path: "/", maxAge: 0 })
  );
}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString() || "{}"));
      } catch {
        resolve({});
      }
    });
    req.on("error", reject);
  });
}

// ─── API ROUTE HANDLERS ───────────────────────────────────────────────────────

/** POST /api/auth — sign up or sign in */
async function handleAuth(req, res) {
  const { email, password } = await readBody(req);

  if (!email || !password) return json(res, 400, { error: "Email et mot de passe requis." });
  if (password.length < 8) return json(res, 400, { error: "Mot de passe trop court (min. 8 caractères)." });

  await connectDB();
  const existing = await User.findOne({ email: email.toLowerCase().trim() });

  if (existing) {
    if (!existing.password) return json(res, 401, { error: "Compte sans mot de passe — utilisez Google." });
    const ok = await bcrypt.compare(password, existing.password);
    if (!ok) return json(res, 401, { error: "Identifiants invalides." });
    setAuthCookie(res, existing._id.toString());
    return json(res, 200, { success: true, isNew: false, email: existing.email });
  }

  // Nouveau compte
  const hashed = await bcrypt.hash(password, 10);
  const newUser = await User.create({ email: email.toLowerCase().trim(), password: hashed });
  setAuthCookie(res, newUser._id.toString());
  return json(res, 201, { success: true, isNew: true, email: newUser.email });
}

/** GET /api/auth/me — current user from cookie */
async function handleMe(req, res) {
  const payload = getUserFromCookie(req);
  if (!payload) return json(res, 200, { user: null });

  await connectDB();
  const user = await User.findById(payload.userId).select("-password").lean();
  if (!user) return json(res, 200, { user: null });
  return json(res, 200, { user: { id: user._id.toString(), email: user.email, name: user.name } });
}

/** POST /api/auth/signout */
function handleSignout(req, res) {
  clearAuthCookie(res);
  return json(res, 200, { success: true });
}

/** GET /api/sessions */
async function handleGetSessions(req, res) {
  const payload = getUserFromCookie(req);
  if (!payload) return json(res, 401, { error: "Non authentifié." });

  await connectDB();
  const sessions = await Session.find({ owner: payload.userId })
    .sort({ started_at: -1 })
    .limit(20)
    .lean();

  return json(res, 200, sessions.map((s) => ({
    id: s._id.toString(),
    title: s.title,
    source_lang: s.source_lang,
    target_langs: s.target_langs,
    mode: s.mode,
    is_live: s.is_live,
    started_at: s.started_at?.toISOString(),
    ended_at: s.ended_at?.toISOString() || null,
  })));
}

/** POST /api/transcripts — add transcript and broadcast via SSE */
async function handleAddTranscript(req, res) {
  const payload = getUserFromCookie(req);
  if (!payload) return json(res, 401, { error: "Non authentifié." });

  const { share_code, original_text, translations } = await readBody(req);
  if (!share_code || !original_text) return json(res, 400, { error: "share_code et original_text requis." });

  await connectDB();
  const session = await Session.findOne({ share_code });
  if (!session) return json(res, 404, { error: "Session introuvable. Créez d'abord une session." });
  if (session.owner.toString() !== payload.userId) return json(res, 403, { error: "Non autorisé." });

  const transcript = await Transcript.create({
    session_id: session._id,
    original_text,
    translations,
  });

  // Broadcast SSE
  const sessionClients = sseClients.get(share_code);
  if (sessionClients) {
    const msg = JSON.stringify({
      id: transcript._id.toString(),
      original_text: transcript.original_text,
      translations: Object.fromEntries(transcript.translations || []),
      timestamp: transcript.timestamp,
    });
    sessionClients.forEach((send) => send(`data: ${msg}\n\n`));
  }

  return json(res, 200, { success: true });
}

/** POST /api/sessions — create a new live session */
async function handleCreateSession(req, res) {
  const payload = getUserFromCookie(req);
  if (!payload) return json(res, 401, { error: "Non authentifié." });

  const { title, source_lang = "fr-FR", target_langs = ["FR", "AR"], mode = "live" } = await readBody(req);

  // Generate a unique share_code
  const share_code = Math.random().toString(36).substring(2, 10).toUpperCase();

  await connectDB();
  const session = await Session.create({
    title: title || "Session sans titre",
    source_lang,
    target_langs,
    mode,
    share_code,
    is_live: true,
    owner: payload.userId,
    started_at: new Date(),
  });

  return json(res, 201, {
    id: session._id.toString(),
    share_code: session.share_code,
    title: session.title,
  });
}

/** GET /api/stream?share_code=X — SSE */
function handleStream(req, res) {
  const url = new URL(req.url, `http://localhost`);
  const share_code = url.searchParams.get("share_code");
  if (!share_code) {
    res.writeHead(400);
    res.end("Missing share_code");
    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  const send = (data) => res.write(data);
  send(`data: ${JSON.stringify({ type: "connected" })}\n\n`);

  if (!sseClients.has(share_code)) sseClients.set(share_code, new Set());
  sseClients.get(share_code).add(send);

  // Heartbeat every 20s to keep connection alive
  const heartbeat = setInterval(() => res.write(": ping\n\n"), 20_000);

  req.on("close", () => {
    clearInterval(heartbeat);
    sseClients.get(share_code)?.delete(send);
    if (sseClients.get(share_code)?.size === 0) sseClients.delete(share_code);
  });
}

// ─── STATIC FILE SERVING ──────────────────────────────────────────────────────
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
};

// ─── TanStack Start SSR handler ───────────────────────────────────────────────
console.log("⏳ Loading SSR handler...");
let ssrHandler;
try {
  const mod = await import("./dist/server/index.js");
  ssrHandler = mod.default;
  console.log("✅ SSR handler loaded.");
} catch (err) {
  console.error("❌ Failed to load SSR handler:", err);
  process.exit(1);
}

async function nodeToWebRequest(req) {
  const host = req.headers.host || `localhost:${PORT}`;
  const proto = req.headers["x-forwarded-proto"] || "https";
  const url = new URL(req.url, `${proto}://${host}`);

  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) continue;
    Array.isArray(value)
      ? value.forEach((v) => headers.append(key, v))
      : headers.set(key, value);
  }

  let body;
  if (req.method !== "GET" && req.method !== "HEAD") {
    const chunks = [];
    await new Promise((res, rej) => {
      req.on("data", (c) => chunks.push(c));
      req.on("end", res);
      req.on("error", rej);
    });
    if (chunks.length) body = Buffer.concat(chunks);
  }

  return new Request(url.toString(), { method: req.method, headers, body });
}

async function sendWebResponse(webRes, res) {
  const headers = {};
  webRes.headers.forEach((v, k) => (headers[k] = v));
  res.writeHead(webRes.status, headers);
  if (webRes.body) {
    const reader = webRes.body.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    } catch { /* stream closed */ }
  }
  res.end();
}

// ─── MAIN SERVER ─────────────────────────────────────────────────────────────
const httpServer = createServer(async (req, res) => {
  const rawPath = decodeURIComponent(new URL(req.url, "http://x").pathname);

  try {
    // ── API Routes (handled directly — no TanStack Start RPC) ──
    if (rawPath === "/api/auth" && req.method === "POST") return handleAuth(req, res);
    if (rawPath === "/api/auth/me" && req.method === "GET") return handleMe(req, res);
    if (rawPath === "/api/auth/signout" && req.method === "POST") return handleSignout(req, res);
    if (rawPath === "/api/sessions" && req.method === "GET") return handleGetSessions(req, res);
    if (rawPath === "/api/sessions" && req.method === "POST") return handleCreateSession(req, res);
    if (rawPath === "/api/transcripts" && req.method === "POST") return handleAddTranscript(req, res);
    if (rawPath === "/api/stream" && req.method === "GET") return handleStream(req, res);

    // ── Static files ──
    const staticPath = join(DIST_CLIENT, rawPath);
    if (existsSync(staticPath) && statSync(staticPath).isFile()) {
      const ext = extname(staticPath).toLowerCase();
      res.writeHead(200, {
        "Content-Type": MIME[ext] || "application/octet-stream",
        "Cache-Control": rawPath.startsWith("/assets/")
          ? "public, max-age=31536000, immutable"
          : "no-cache",
      });
      createReadStream(staticPath).pipe(res);
      return;
    }

    // ── UI pages → TanStack Start SSR ──
    const webReq = await nodeToWebRequest(req);
    const webRes = await ssrHandler.fetch(webReq, {}, {});
    await sendWebResponse(webRes, res);
  } catch (err) {
    console.error("[500]", req.method, rawPath, err?.message || err);
    if (!res.headersSent) res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
  }
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Verba server running on http://0.0.0.0:${PORT}`);
});
