# Google OAuth (Log ind med Google) – opsætning

Denne guide beskriver, hvordan du opretter **GOOGLE_CLIENT_ID**, **GOOGLE_CLIENT_SECRET** og **GOOGLE_CALLBACK_URL** til customer login i Medusa/storefront. Variablerne bruges i `apps/commerce/.env` (kopier fra `env.template`).

---

## 1. Opret eller vælg projekt i Google Cloud

1. Gå til [Google Cloud Console](https://console.cloud.google.com/).
2. Vælg et eksisterende projekt eller **Opret projekt** (fx "Guapo").
3. Sørg for, at du er i det rigtige projekt (projektnavn øverst i konsollen).

---

## 2. Aktiver OAuth-consent og OAuth API

1. I venstremenuen: **APIs & Services** → **OAuth consent screen**.
2. Vælg **External** (eller Internal hvis kun G Suite-brugere).
3. Udfyld **App name** (fx "Guapo"), **User support email**, **Developer contact** – gem.
4. I venstremenuen: **APIs & Services** → **Library**.
5. Søg efter **Google+ API** eller **Google Identity** – eller brug **Credentials** direkte; OAuth 2.0 bruger ofte "Google Identity"-scopes. For “Log ind med Google” er det typisk nok at oprette OAuth 2.0 Client ID (næste trin).

---

## 3. Opret OAuth 2.0 Client ID (Web application)

1. **APIs & Services** → **Credentials** (eller **Google Auth Platform** → **Clients** i nyere UI).
2. Klik **+ Create Credentials** → **OAuth client ID** (eller **Create client**).
3. **Application type:** vælg **Web application**.
4. **Name:** fx "Guapo Storefront".

5. **Vigtigt – to slags URIs:**
   - **URIs / Authorized JavaScript origins:** Her kan du angive *origins* (uden sti), fx `http://localhost:3000`, `https://guapo-storefront-staging.up.railway.app`, `https://guapo.store`. Disse er de domæner, der må starte OAuth-flowet.
   - **Authorized redirect URIs:** Her **skal** du angive den **fulde callback-URL inkl. sti** – ikke bare origin. Google sender brugeren tilbage til præcis denne URL med `?code=...`. Tilføj **+ Add URI** for hver af disse:
     - Lokal: `http://localhost:3000/da/auth/google/callback` og evt. `http://localhost:3000/en/auth/google/callback`
     - Staging: `https://guapo-storefront-staging.up.railway.app/da/auth/google/callback` (og evt. `/en/...`)
     - Produktion: `https://guapo.store/da/auth/google/callback` (og evt. `/en/...`)

   Uden de fulde redirect-URIs (med `/da/auth/google/callback`) får du "Redirect URI mismatch".

6. Klik **Create**.

---

## 4. Kopiér Client ID og Client Secret

1. Efter oprettelse vises en modal med **Client ID** og **Client secret**.
2. **Client ID** (ligner `xxxxx.apps.googleusercontent.com`) → brug som `GOOGLE_CLIENT_ID`.
3. **Client secret** → brug som `GOOGLE_CLIENT_SECRET`.
4. Du kan også finde dem senere under **Credentials** → klik på den oprettede OAuth 2.0 client.

---

## 5. Sæt variabler i `apps/commerce/.env`

I `apps/commerce/.env` (eller kopier fra `env.template`):

```bash
# AUTH (Customer login: emailpass + Google)
GOOGLE_CLIENT_ID=din-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=din-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/da/auth/google/callback
```

- **Lokal udvikling:** `GOOGLE_CALLBACK_URL` skal matche én af de **Authorized redirect URIs** du tilføjede i trin 3 (fx `http://localhost:3000/da/auth/google/callback`).
- **Staging:** `GOOGLE_CALLBACK_URL=https://guapo-storefront-staging.up.railway.app/da/auth/google/callback` (og samme URL tilføjet under Authorized redirect URIs i Google Cloud).
- **Produktion:** `GOOGLE_CALLBACK_URL=https://guapo.store/da/auth/google/callback` (og samme URL under Authorized redirect URIs).

---

## 6. Genstart Medusa

Efter ændring af `.env`:

```bash
cd apps/commerce && pnpm dev
```

---

## Fejlsøgning

| Problem | Tjek |
|--------|------|
| "Redirect URI mismatch" | Callback-URL i `.env` skal være **præcis** den samme som i Google Cloud (inkl. http/https, port, sti). |
| "Access blocked" | OAuth consent screen: tilføj test-brugere under "Test users" hvis appen er i "Testing". |
| Login knap gør ingenting | Tjek at `GOOGLE_CLIENT_ID` og `GOOGLE_CLIENT_SECRET` er sat i `apps/commerce/.env` og at commerce-backend kører. |

---

## Reference

- [Google OAuth 2.0 for Web](https://developers.google.com/identity/protocols/oauth2/web-server)
- Medusa: `apps/commerce/medusa-config.ts` (auth module med google provider), storefront callback: `apps/storefront/src/app/[locale]/auth/google/callback/page.tsx`
