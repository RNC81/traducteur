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
import { WebSocketServer } from "ws";
import { SonioxNodeClient, RealtimeUtteranceBuffer } from "@soniox/node";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { parse as parseCookies, serialize as serializeCookie } from "cookie";
import fs from "fs";
import { URL } from "url";
import translateGoogle from "google-translate-api-x";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const DIST_CLIENT = join(__dirname, "dist", "client");
const PORT = parseInt(process.env.PORT || "10000", 10);

// ─── ENV ─────────────────────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const SONIOX_API_KEY = process.env.SONIOX_API_KEY;

// Public origin of this app (e.g. https://verba-app.onrender.com on Render).
// Falls back to localhost in dev — never process.exit, Soniox is optional.
const PUBLIC_APP_URL = process.env.PUBLIC_APP_URL || `http://localhost:${PORT}`;
const ALLOWED_WS_ORIGINS = new Set([PUBLIC_APP_URL]);

if (!MONGO_URI) {
  console.error("❌ MONGO_URI manquante — démarrage annulé.");
  process.exit(1);
}
if (!JWT_SECRET) {
  console.error("❌ JWT_SECRET manquante — démarrage annulé.");
  process.exit(1);
}

console.log("─────────────────────────────────────────────");
console.log(`✅ MONGO_URI         présente`);
console.log(`✅ JWT_SECRET        présente`);
console.log(`${process.env.GEMINI_API_KEY  ? "✅" : "⚠️ "} GEMINI_API_KEY  ${process.env.GEMINI_API_KEY  ? "présente" : "absente (traduction dégradée)"}`);
console.log(`${process.env.OPENAI_API_KEY  ? "✅" : "⚠️ "} OPENAI_API_KEY  ${process.env.OPENAI_API_KEY  ? "présente" : "absente (fallback Mistral actif)"}`);
console.log(`${process.env.MISTRAL_API_KEY ? "✅" : "⚠️ "} MISTRAL_API_KEY ${process.env.MISTRAL_API_KEY ? "présente" : "absente"}`);
console.log(`${SONIOX_API_KEY ? "✅" : "⚠️ "} SONIOX_API_KEY  ${SONIOX_API_KEY ? "présente" : "absente (mode Soniox indisponible, fallback Web Speech API uniquement)"}`);
console.log(`   PUBLIC_APP_URL    ${PUBLIC_APP_URL}${process.env.PUBLIC_APP_URL ? "" : " (défaut dev — définir PUBLIC_APP_URL en prod)"}`);
console.log("─────────────────────────────────────────────");

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
    isAdmin: { type: Boolean, default: false },
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
    context: { type: String, default: "" },
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
    is_final: { type: Boolean, default: false },
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

// ─── AI TRANSLATION LOGIC ───────────────────────────────────────────────────

async function translateFast(text, targetLangs, contextStr) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return targetLangs.reduce((acc, lang) => ({ ...acc, [lang]: "[Gemini Key missing] " + text }), {});

  const contextPrompt = contextStr ? ` Contexte de ce discours : "${contextStr}".` : "";
  const prompt = `Traduisez rapidement le texte suivant dans les langues demandées: [${targetLangs.join(", ")}].${contextPrompt} Renvoyez UNIQUEMENT un objet JSON valide avec les codes de langue comme clés et les traductions comme valeurs.`;
  const userMessage = `Texte à traduire : "${text}"`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt + "\n\n" + userMessage }] }],
      })
    });
    const data = await res.json();
    let jsonResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    jsonResponse = jsonResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonResponse);
  } catch (err) {
    console.error(`AI Fast Translation error:`, err);
    return targetLangs.reduce((acc, lang) => ({ ...acc, [lang]: "[Error] " + text }), {});
  }
}

async function verifyTranslation(originalText, draftTranslations, contextStr, targetLangs) {
  const openaiKey = process.env.OPENAI_API_KEY;
  const mistralKey = process.env.MISTRAL_API_KEY;

  if (!openaiKey && !mistralKey) return draftTranslations; // No verifier available

  const contextPrompt = contextStr ? ` Le contexte de ce discours est : "${contextStr}".` : "";
  const prompt = `Vous êtes un relecteur expert et un traducteur spécialisé dans la théologie islamique, avec une maîtrise approfondie du vocabulaire et des concepts du Chiisme duodécimain (Ahl al-Bayt, Imamat, Fiqh Ja'fari). Voici un texte original en langue source et sa traduction automatique préliminaire dans [${targetLangs.join(", ")}].${contextPrompt} 
Votre mission :
1. Corriger les erreurs de sens et les contresens.
2. Assurez-vous que la terminologie religieuse employée est exacte, respectueuse et parfaitement alignée avec la doctrine chiite (par exemple, privilégier le vocabulaire approprié pour les Infaillibles, la jurisprudence, etc.).
3. Renvoyer UNIQUEMENT un objet JSON valide avec les codes de langue comme clés et les traductions corrigées comme valeurs. Conservez bien toutes les clés de langue demandées.`;
  
  const userMessage = `Texte original : "${originalText}"\nTraductions préliminaires : ${JSON.stringify(draftTranslations)}`;

  try {
    let jsonResponse = "{}";

    if (openaiKey) {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${openaiKey}` },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: prompt },
            { role: "user", content: userMessage }
          ]
        })
      });
      const data = await res.json();
      jsonResponse = data.choices?.[0]?.message?.content || "{}";
    } else if (mistralKey) {
      const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${mistralKey}` },
        body: JSON.stringify({
          model: "mistral-small-latest",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: prompt },
            { role: "user", content: userMessage }
          ]
        })
      });
      const data = await res.json();
      jsonResponse = data.choices?.[0]?.message?.content || "{}";
    }

    jsonResponse = jsonResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonResponse);
  } catch (err) {
    console.error(`AI Verification error:`, err);
    return draftTranslations; // Fallback to draft
  }
}

// ─── SHARED TRANSCRIPT PIPELINE ──────────────────────────────────────────────
// Extracted so both the HTTP handler (Web Speech API fallback) and the Soniox
// WebSocket handler can push a finalized segment through the same
// persist -> broadcast draft -> background verify -> broadcast verified flow.

/** Draft translation via google-translate-api-x. contextStr is accepted but
 * unused, to keep the same call signature as translateFast (Gemini). */
async function draftTranslateGoogle(text, targetLangs, _contextStr) {
  const translations = {};
  try {
    const promises = targetLangs.map(async (lang) => {
      const gLang = lang.toLowerCase();
      const result = await translateGoogle(text, { to: gLang });
      return { lang: lang.toUpperCase(), text: result.text };
    });
    const results = await Promise.all(promises);
    results.forEach(r => { translations[r.lang] = r.text; });
  } catch (err) {
    console.error("Draft translation error (Google):", err);
  }
  return translations;
}

/** Persist + broadcast a finalized transcript segment, then verify it in the
 * background. draftTranslate: (text, targetLangs, contextStr) => Promise<Record<string,string>> */
async function processFinalTranscript(session, share_code, original_text, { draftTranslate }) {
  // LAZY TRANSLATION: Only translate to languages actively requested by connected clients
  const clientsMap = sseClients.get(share_code);
  const activeLangs = clientsMap ? Array.from(new Set(clientsMap.values())) : (session.target_langs || []);

  const draftTranslations = await draftTranslate(original_text, activeLangs, session.context);

  let transcript = await Transcript.create({
    session_id: session._id,
    original_text,
    translations: draftTranslations,
    is_final: false,
  });

  // Convert Mongoose Document to plain JS object to properly serialize Maps
  const plainTranscript = transcript.toJSON();
  const safeTranslations = plainTranscript.translations || {};

  // Broadcast Draft
  const sessionClients = sseClients.get(share_code);
  if (sessionClients) {
    const msg = JSON.stringify({
      type: "final_draft",
      id: transcript._id.toString(),
      original_text: transcript.original_text,
      translations: safeTranslations,
      is_final: transcript.is_final,
      timestamp: transcript.timestamp,
    });
    sessionClients.forEach((_, send) => send(`data: ${msg}\n\n`));
  }

  // BACKGROUND VERIFICATION
  if (activeLangs.length > 0) {
    verifyTranslation(original_text, safeTranslations, session.context, activeLangs).then(async (rawFinal) => {
      const finalTranslations = { ...safeTranslations };
      for (const [k, v] of Object.entries(rawFinal || {})) {
        if (v && typeof v === "string" && v.trim() !== "") {
          finalTranslations[k.toUpperCase()] = v;
        }
      }

      transcript.translations = finalTranslations;
      transcript.is_final = true;
      await transcript.save();

      const verifiedSessionClients = sseClients.get(share_code);
      if (verifiedSessionClients) {
        const finalMsg = JSON.stringify({
          type: "final_verified",
          id: transcript._id.toString(),
          original_text: transcript.original_text,
          translations: finalTranslations,
          is_final: true,
          timestamp: transcript.timestamp,
        });
        verifiedSessionClients.forEach((_, send) => send(`data: ${finalMsg}\n\n`));
      }
    });
  }

  return transcript;
}

// ─── SONIOX REALTIME STT ─────────────────────────────────────────────────────
const sonioxClient = SONIOX_API_KEY ? new SonioxNodeClient({ api_key: SONIOX_API_KEY }) : null;

// One active Soniox producer per share_code (security #5) — value is either
// { pending: true, ownerId } (reserved during handshake) or the live
// { ws, sttSession } pair once attachSonioxWsHandlers takes over.
const sonioxSessions = new Map();

// Upgrade attempt rate limiting per user (security #10) — in-memory is
// consistent with sseClients: single Render instance, no Redis in this stack.
const sonioxUpgradeAttempts = new Map();
const SONIOX_UPGRADE_RATE_LIMIT = 5;          // max upgrade attempts...
const SONIOX_UPGRADE_RATE_WINDOW_MS = 60_000; // ...per rolling window (ms)
const SONIOX_MAX_SESSION_MS = 10_800_000;     // hard cap: 3h (10800s) per stream

function isSonioxUpgradeRateLimited(userId) {
  const now = Date.now();
  const entry = sonioxUpgradeAttempts.get(userId);
  if (!entry || now - entry.windowStart > SONIOX_UPGRADE_RATE_WINDOW_MS) {
    sonioxUpgradeAttempts.set(userId, { count: 1, windowStart: now });
    return false;
  }
  entry.count += 1;
  return entry.count > SONIOX_UPGRADE_RATE_LIMIT;
}

/** Write a raw HTTP response on the not-yet-upgraded socket and close it.
 * Used for every rejection path in handleSonioxUpgrade — the connection is
 * still plain HTTP at this point, res.writeHead() is not available. */
function rejectUpgrade(socket, status, message) {
  socket.write(`HTTP/1.1 ${status} ${message}\r\n\r\n`);
  socket.destroy();
}

/**
 * Validate a GET /api/soniox-stream?share_code=X upgrade request before
 * accepting the WebSocket. Security checks, in order:
 *   #1  CSWSH        — Origin must be in ALLOWED_WS_ORIGINS
 *   #2  Auth          — valid auth_token JWT cookie required
 *   #10 Rate limiting — max upgrade attempts per user per window
 *   #3  IDOR          — share_code is public (audience-facing); only the
 *                       session owner may push audio into it
 *   #4  Zombie session — reject if session.is_live is false
 *   #5  Single producer — reject a second concurrent stream for the same
 *                       share_code; reservation is synchronous (no await
 *                       between the check and the Map.set) to avoid a
 *                       check-then-act race between concurrent upgrades
 */
async function handleSonioxUpgrade(req, socket, head) {
  // #1 — CSWSH: WebSocket upgrades ignore the Same-Origin Policy, so the
  // browser attaches auth_token regardless of which site initiated the
  // connection. Reject anything not explicitly allowed before doing any work.
  const origin = req.headers.origin;
  if (!origin || !ALLOWED_WS_ORIGINS.has(origin)) {
    return rejectUpgrade(socket, 403, "Forbidden");
  }

  const { searchParams } = new URL(req.url, "http://x");
  const share_code = searchParams.get("share_code");
  if (!share_code) {
    return rejectUpgrade(socket, 400, "Bad Request");
  }

  if (!sonioxClient) {
    return rejectUpgrade(socket, 503, "Service Unavailable");
  }

  // #2 — Auth: same JWT cookie check as every other authenticated route.
  const payload = getUserFromCookie(req);
  if (!payload) {
    return rejectUpgrade(socket, 401, "Unauthorized");
  }

  // #10 — Rate limit upgrade attempts per user before touching the DB.
  if (isSonioxUpgradeRateLimited(payload.userId)) {
    return rejectUpgrade(socket, 429, "Too Many Requests");
  }

  await connectDB();
  const session = await Session.findOne({ share_code });
  if (!session) {
    return rejectUpgrade(socket, 404, "Not Found");
  }

  // #3 — IDOR: share_code alone is not a valid credential for audio
  // ingestion (it's the same code the audience uses on /api/stream).
  if (session.owner.toString() !== payload.userId) {
    return rejectUpgrade(socket, 403, "Forbidden");
  }

  // #4 — Reject zombie sessions (already closed via handleCloseSession).
  if (!session.is_live) {
    return rejectUpgrade(socket, 409, "Conflict");
  }

  // #5 — Single producer per session. Check-and-reserve with no `await` in
  // between: JS is single-threaded and nothing yields the event loop here,
  // so this closes the race between two concurrent upgrade attempts for the
  // same share_code (e.g. duplicate tab).
  if (sonioxSessions.has(share_code)) {
    return rejectUpgrade(socket, 409, "Conflict");
  }
  sonioxSessions.set(share_code, { pending: true, ownerId: payload.userId });

  wss.handleUpgrade(req, socket, head, (ws) => {
    attachSonioxWsHandlers(ws, session, share_code, payload.userId);
  });
}

/**
 * Wire a freshly-upgraded WebSocket to a Soniox realtime STT session for the
 * given (already validated) live session. Owns the full lifecycle: connect,
 * audio relay, result routing, cleanup.
 *
 *   - Client -> server: binary frames only (raw PCM audio). Any text frame
 *     is rejected with ws.close(1003) (security #6).
 *   - is_final:false tokens -> {type:"interim"} sent back over this same ws,
 *     speaker-local display only — never broadcast to the audience over SSE.
 *   - is_final:true tokens -> processFinalTranscript(..., { draftTranslate:
 *     translateFast }), which persists + broadcasts to the audience exactly
 *     like the Web Speech API path, but drafts with Gemini instead of
 *     Google Translate.
 *   - Errors sent to the client are always generic (security #7) — the raw
 *     Soniox error is only logged server-side.
 *   - cleanup() is idempotent and runs on ws close/error, sttSession error,
 *     or the SONIOX_MAX_SESSION_MS hard cap: sttSession.close(),
 *     sonioxSessions.delete(share_code), clearTimeout(hardCapTimer).
 */
async function attachSonioxWsHandlers(ws, session, share_code, _userId) {
  let cleanedUp = false;
  let hardCapTimer = null;

  const sttSession = sonioxClient.realtime.stt({
    model: "stt-rt-v5",
    audio_format: "pcm_s16le",
    sample_rate: 16000,
    num_channels: 1,
    language_hints: session.source_lang ? [session.source_lang] : undefined,
    enable_endpoint_detection: true,
  });

  // Collects is_final tokens across "result" events and flushes one full
  // utterance on "endpoint" — avoids calling processFinalTranscript (Gemini
  // draft + GPT/Mistral verify) once per incrementally-finalized token.
  const utteranceBuffer = new RealtimeUtteranceBuffer();

  function cleanup() {
    if (cleanedUp) return;
    cleanedUp = true;
    if (hardCapTimer) clearTimeout(hardCapTimer);
    sonioxSessions.delete(share_code);

    // Flush any buffered final tokens that never got an "endpoint" — same
    // logic as the "endpoint" handler, so a stream that ends mid-utterance
    // doesn't silently lose the trailing segment.
    const utterance = utteranceBuffer.markEndpoint();
    if (utterance && utterance.text) {
      try {
        ws.send(JSON.stringify({ type: "final", text: utterance.text }));
      } catch (err) {
        console.error("[soniox] failed to send final to speaker (cleanup flush):", err);
      }
      processFinalTranscript(session, share_code, utterance.text, { draftTranslate: translateFast }).catch((err) => {
        console.error("[soniox] processFinalTranscript error (cleanup flush):", err);
      });
    }

    try { sttSession.close(); } catch { /* already closed */ }
    try { ws.close(); } catch { /* already closed */ }
  }

  sttSession.on("result", (result) => {
    const interimText = result.tokens.filter((t) => !t.is_final).map((t) => t.text).join("");
    if (interimText) {
      try {
        ws.send(JSON.stringify({ type: "interim", text: interimText }));
      } catch (err) {
        console.error("[soniox] failed to send interim to speaker:", err);
      }
    }

    // Buffer is_final tokens; they are only turned into a transcript segment
    // when an endpoint (utterance boundary) is detected, see below.
    utteranceBuffer.addResult(result);
  });

  sttSession.on("endpoint", () => {
    const utterance = utteranceBuffer.markEndpoint();
    if (utterance && utterance.text) {
      try {
        ws.send(JSON.stringify({ type: "final", text: utterance.text }));
      } catch (err) {
        console.error("[soniox] failed to send final to speaker:", err);
      }
      processFinalTranscript(session, share_code, utterance.text, { draftTranslate: translateFast }).catch((err) => {
        console.error("[soniox] processFinalTranscript error:", err);
      });
    }
  });

  sttSession.on("error", (err) => {
    console.error("[soniox] STT session error:", err);
    try { ws.send(JSON.stringify({ type: "error", message: "stt_error" })); } catch { /* socket already gone */ }
    cleanup();
  });

  ws.on("message", (data, isBinary) => {
    if (!isBinary) {
      ws.close(1003, "binary only");
      return;
    }
    try {
      sttSession.sendAudio(data);
    } catch (err) {
      console.error("[soniox] sendAudio error:", err);
    }
  });

  ws.on("close", cleanup);
  ws.on("error", (err) => {
    console.error("[soniox] WebSocket error:", err);
    cleanup();
  });

  try {
    await sttSession.connect();
  } catch (err) {
    console.error("[soniox] connect() failed:", err);
    try { ws.send(JSON.stringify({ type: "error", message: "stt_connect_failed" })); } catch { /* noop */ }
    cleanup();
    return;
  }

  sonioxSessions.set(share_code, { ws, sttSession });

  // Hard cap: force-close long-running streams (cost guard on a paid API).
  hardCapTimer = setTimeout(() => {
    console.log(`[soniox] hard cap reached (${SONIOX_MAX_SESSION_MS}ms) for share_code=${share_code}`);
    cleanup();
  }, SONIOX_MAX_SESSION_MS);

  try {
    ws.send(JSON.stringify({ type: "ready" }));
  } catch (err) {
    console.error("[soniox] failed to send ready ack:", err);
  }
}

// ─── API HANDLERS ────────────────────────────────────────────────────────────

/** POST /api/transcripts/interim — ultra-fast word-by-word translation */
async function handleAddInterimTranscript(req, res) {
  const payload = getUserFromCookie(req);
  if (!payload) return json(res, 401, { error: "Non authentifié." });

  const { share_code, original_text } = await readBody(req);
  if (!share_code || !original_text) return json(res, 400, { error: "share_code et original_text requis." });

  await connectDB();
  const session = await Session.findOne({ share_code });
  if (!session) return json(res, 404, { error: "Session introuvable." });

  // LAZY TRANSLATION: Only translate to languages actively requested by connected clients
  const clientsMap = sseClients.get(share_code);
  const activeLangs = clientsMap ? Array.from(new Set(clientsMap.values())) : [];

  if (activeLangs.length === 0) {
    return json(res, 200, { success: true, skipped_translation: true });
  }

  const targetLangs = activeLangs;

  const translations = await draftTranslateGoogle(original_text, targetLangs);

  const sessionClients = sseClients.get(share_code);
  if (sessionClients) {
    const msg = JSON.stringify({
      type: "interim",
      original_text,
      translations
    });
    sessionClients.forEach((_, send) => send(`data: ${msg}\n\n`));
  }

  return json(res, 200, { success: true });
}

/** POST /api/transcripts — add transcript and broadcast via SSE */
async function handleAddTranscript(req, res) {
  const payload = getUserFromCookie(req);
  if (!payload) return json(res, 401, { error: "Non authentifié." });

  const { share_code, original_text } = await readBody(req);
  if (!share_code || !original_text) return json(res, 400, { error: "share_code et original_text requis." });

  await connectDB();
  const session = await Session.findOne({ share_code });
  if (!session) return json(res, 404, { error: "Session introuvable. Créez d'abord une session." });
  if (session.owner.toString() !== payload.userId) return json(res, 403, { error: "Non autorisé." });

  await processFinalTranscript(session, share_code, original_text, { draftTranslate: draftTranslateGoogle });

  return json(res, 200, { success: true });
}

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
  return json(res, 200, { user: { id: user._id.toString(), email: user.email, name: user.name, isAdmin: user.isAdmin === true } });
}

/** POST /api/auth/signout */
function handleSignout(req, res) {
  clearAuthCookie(res);
  return json(res, 200, { success: true });
}

/** GET /api/sessions/:share_code — get session info */
async function handleGetSessionInfo(req, res, share_code) {
  await connectDB();
  const session = await Session.findOne({ share_code });
  if (!session) return json(res, 404, { error: "Session non trouvée" });
  return json(res, 200, session);
}

/** GET /api/sessions/:share_code/transcripts — get history */
async function handleGetSessionTranscripts(req, res, share_code) {
  await connectDB();
  const session = await Session.findOne({ share_code });
  if (!session) return json(res, 404, { error: "Session non trouvée" });

  const transcripts = await Transcript.find({ session_id: session._id }).sort({ timestamp: 1 });
  
  const formatted = transcripts.map(t => {
    const plain = t.toJSON();
    return {
      type: plain.is_final ? "final_verified" : "final_draft",
      id: plain._id.toString(),
      original_text: plain.original_text,
      translations: plain.translations || {},
      is_final: plain.is_final,
      timestamp: plain.timestamp
    };
  });

  return json(res, 200, formatted);
}

/** PATCH /api/sessions/:id — close session (set is_live=false, ended_at) */
async function handleCloseSession(req, res, id) {
  const payload = getUserFromCookie(req);
  if (!payload) return json(res, 401, { error: "Non authentifié." });

  await connectDB();
  const session = await Session.findById(id);
  if (!session) return json(res, 404, { error: "Session non trouvée." });
  if (session.owner.toString() !== payload.userId) return json(res, 403, { error: "Non autorisé." });

  session.is_live = false;
  session.ended_at = new Date();
  await session.save();

  return json(res, 200, { success: true });
}

/** DELETE /api/sessions/:id — delete session and its transcripts */
async function handleDeleteSession(req, res, id) {
  const payload = getUserFromCookie(req);
  if (!payload) return json(res, 401, { error: "Non authentifié." });

  await connectDB();
  const session = await Session.findById(id);
  if (!session) return json(res, 404, { error: "Session non trouvée." });
  if (session.owner.toString() !== payload.userId) return json(res, 403, { error: "Non autorisé." });

  await Transcript.deleteMany({ session_id: session._id });
  await Session.findByIdAndDelete(id);

  return json(res, 200, { success: true });
}

/** GET /api/sessions — list my sessions */
async function handleListSessions(req, res) {
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

/** POST /api/sessions — create a new live session */
async function handleCreateSession(req, res) {
  const payload = getUserFromCookie(req);
  if (!payload) return json(res, 401, { error: "Non authentifié." });

  const { title, source_lang = "fr-FR", target_langs = ["FR", "AR", "EN", "FA", "UR", "HI"], mode = "live", context = "" } = await readBody(req);

  // Generate a unique share_code
  const share_code = Math.random().toString(36).substring(2, 10).toUpperCase();

  await connectDB();
  const session = await Session.create({
    title: title || "Session sans titre",
    source_lang,
    target_langs,
    mode,
    context,
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

  const lang = url.searchParams.get("lang")?.toUpperCase() || "FR";

  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  const send = (data) => res.write(data);
  send(`data: ${JSON.stringify({ type: "connected" })}\n\n`);

  if (!sseClients.has(share_code)) sseClients.set(share_code, new Map());
  sseClients.get(share_code).set(send, lang);

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
  const mod = await import("./dist/server/server.js");
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
  const urlObj = new URL(req.url, "http://x");
  const pathname = decodeURIComponent(urlObj.pathname);

  try {
    // ── API Routes (handled directly — no TanStack Start RPC) ──
    if (req.method === "POST" && pathname === "/api/auth") return handleAuth(req, res);
    if (req.method === "GET" && pathname === "/api/auth/me") return handleMe(req, res);
    if (req.method === "POST" && pathname === "/api/auth/signout") return handleSignout(req, res);
    if (req.method === "POST" && pathname === "/api/transcripts/interim") {
      return handleAddInterimTranscript(req, res);
    }
    if (req.method === "POST" && pathname === "/api/transcripts") {
      return handleAddTranscript(req, res);
    }
    if (req.method === "POST" && pathname === "/api/sessions") {
      return handleCreateSession(req, res);
    }
    if (req.method === "GET" && pathname.match(/^\/api\/sessions\/([^/]+)\/transcripts$/)) {
      return handleGetSessionTranscripts(req, res, pathname.split("/")[3]);
    }
    if (req.method === "GET" && pathname.match(/^\/api\/sessions\/([^/]+)$/)) {
      return handleGetSessionInfo(req, res, pathname.split("/")[3]);
    }
    if (req.method === "PATCH" && pathname.match(/^\/api\/sessions\/([^/]+)$/)) {
      return handleCloseSession(req, res, pathname.split("/")[3]);
    }
    if (req.method === "DELETE" && pathname.match(/^\/api\/sessions\/([^/]+)$/)) {
      return handleDeleteSession(req, res, pathname.split("/")[3]);
    }
    if (req.method === "GET" && pathname === "/api/sessions") {
      return handleListSessions(req, res);
    }
    if (req.method === "GET" && pathname === "/api/stream") return handleStream(req, res);

    // ── Static files ──
    const staticPath = join(DIST_CLIENT, pathname);
    if (existsSync(staticPath) && statSync(staticPath).isFile()) {
      const ext = extname(staticPath).toLowerCase();
      res.writeHead(200, {
        "Content-Type": MIME[ext] || "application/octet-stream",
        "Cache-Control": pathname.startsWith("/assets/")
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
    console.error("[500]", req.method, pathname, err?.message || err);
    if (!res.headersSent) res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
  }
});

// ─── SONIOX WEBSOCKET UPGRADE ─────────────────────────────────────────────────
const wss = new WebSocketServer({ noServer: true, maxPayload: 262_144 }); // 256KB/frame cap (security #6)

httpServer.on("upgrade", (req, socket, head) => {
  const { pathname } = new URL(req.url, "http://x");
  if (pathname !== "/api/soniox-stream") {
    socket.destroy();
    return;
  }
  handleSonioxUpgrade(req, socket, head).catch((err) => {
    console.error("[soniox] handleSonioxUpgrade error:", err);
    socket.destroy();
  });
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Verba server running on http://0.0.0.0:${PORT}`);
});
