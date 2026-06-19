# Fichiers critiques — ne pas modifier sans raison explicite

## INTERDICTION ABSOLUE

### start.mjs
Cœur du produit. Contient : serveur HTTP, toutes les routes API, schémas Mongoose,
logique SSE, pipeline IA, auth JWT.
**Toute modification = risque de casser le streaming en production.**
Avant de toucher : relire l'architecture dans `.claude/context/project.md`.
Après modification : `npm run build` + `node start.mjs` obligatoires.

### vite.config.ts
Configuration build Vite + TanStack Start. Fragile — dépend de `@lovable.dev/vite-tanstack-config`.
Ne pas modifier la structure `tanstackStart.server.entry` sans tester le build complet.

### src/server.ts
SSR error wrapper chargé par le build TanStack Start.
Ne contient plus de logique métier (le bloc /api/stream a été retiré lors du cleanup T0.1).
Modifier = risque de casser le SSR handler chargé par start.mjs.

## MODIFIER AVEC PRÉCAUTION

### src/routes/__root.tsx
Layout racine TanStack Router. Toute modification affecte toutes les pages.

### src/routes/translate.tsx
Logique microphone (Web Speech API) + envoi SSE + création de session.
Flow le plus complexe côté frontend — tester le flow complet après chaque modif.

### src/routes/live.$shareCode.tsx et overlay.$shareCode.tsx
Consomment le SSE. Tester avec un vrai stream après modification.

## VARIABLES D'ENVIRONNEMENT — ne jamais hardcoder

```
MONGO_URI          → connexion MongoDB Atlas
JWT_SECRET         → signature JWT (min. 32 chars random en prod)
GEMINI_API_KEY     → traductions draft
OPENAI_API_KEY     → vérification IA (prioritaire)
MISTRAL_API_KEY    → vérification IA (fallback)
```

Toutes les clés passent par `process.env`. Aucune valeur dans le code.
Le fallback `dev_fallback_only_not_for_prod` dans start.mjs est intentionnel pour le dev local uniquement.

## NE PAS RECRÉER

Ces fichiers ont été supprimés intentionnellement lors de T0.1 — ne pas les recréer :
- `src/api/` (TanStack server functions, non exécutées en prod)
- `src/lib/models/` (doublons des schémas inline de start.mjs)
- `src/lib/db.ts` (remplacé par connectDB inline)
- `src/integrations/supabase/` et `src/integrations/lovable/`
- `wrangler.jsonc`, `bunfig.toml`, `bun.lock`
