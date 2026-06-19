# Architecture réelle — Verba (post-audit)

## Point d'entrée unique : start.mjs

Tout le backend tourne dans `start.mjs`. Ce fichier est le seul serveur actif en production.
Il fait tout : routing HTTP, auth, SSE, traduction IA, connexion MongoDB.
**Ne jamais chercher la logique API dans `src/`** — elle n'est pas là.

## Schéma général

```
Navigateur / OBS
      │
      ▼
start.mjs  (Node.js HTTP natif, port 10000)
      │
      ├── /api/*          → handlers inline dans start.mjs
      │       ├── POST /api/auth              → login + register
      │       ├── GET  /api/auth/me           → session courante (JWT cookie)
      │       ├── POST /api/auth/signout
      │       ├── GET  /api/sessions          → liste sessions du créateur
      │       ├── POST /api/sessions          → créer session
      │       ├── GET  /api/sessions/:code    → infos session
      │       ├── GET  /api/sessions/:code/transcripts
      │       ├── DELETE /api/sessions/:id
      │       ├── POST /api/transcripts       → transcript final + broadcast SSE
      │       ├── POST /api/transcripts/interim → word-by-word rapide
      │       └── GET  /api/stream            → connexion SSE (EventSource)
      │
      ├── /assets/*       → fichiers statiques depuis dist/client/
      │
      └── /*              → SSR via dist/server/server.js (TanStack Start)
```

## MongoDB

Connexion : `mongoose.connect(MONGO_URI)` — singleton `dbConn` dans start.mjs.
Les schémas Mongoose sont définis **inline dans start.mjs**, pas dans src/.

Modèles actifs :
- `User`       → email, password (bcrypt), name
- `Session`    → title, source_lang, target_langs, mode, context, share_code, is_live, owner, started_at, ended_at
- `Transcript` → session_id, original_text, translations (Map), is_final, timestamp

## Auth

JWT signé avec `JWT_SECRET`, stocké en cookie httpOnly `auth_token` (7 jours, SameSite=lax).
Fonction : `getUserFromCookie(req)` → parse cookie → `jwt.verify`.
Pas de middleware global — chaque handler appelle `getUserFromCookie` lui-même.

## SSE — Lazy Translation

```
sseClients : Map<shareCode, Map<sendFn, lang>>
```

Chaque client SSE déclare sa langue à la connexion (`?lang=FR`).
Le serveur ne traduit QUE vers les langues des clients connectés.
Heartbeat toutes les 20s (`: ping`).

## Pipeline IA

| Étape | Outil | Clé |
|-------|-------|-----|
| Interim (word-by-word) | google-translate-api-x | aucune |
| Draft final | Gemini 1.5 Flash | GEMINI_API_KEY |
| Vérification | OpenAI gpt-4o-mini (priorité) ou Mistral | OPENAI_API_KEY / MISTRAL_API_KEY |

## Frontend

TanStack Router (file-based routing) dans `src/routes/`.
Build Vite → `dist/client/` (assets) + `dist/server/server.js` (SSR handler).
Le SSR handler est chargé par start.mjs au démarrage.

Routes actives : `/`, `/auth`, `/dashboard`, `/translate`, `/live/$shareCode`, `/overlay/$shareCode`, `/contact`, `/about`, `/legal`, `/privacy`, `/terms`

## Ce qui N'est PAS en prod

- `src/api/` → supprimé (TanStack server functions, jamais exécutées)
- `src/lib/models/` → supprimé (doublons des schémas inline de start.mjs)
- `src/lib/db.ts` → supprimé (connectToDatabase, remplacé par connectDB inline)
- `src/integrations/` → supprimé (vestige Supabase/Lovable)
