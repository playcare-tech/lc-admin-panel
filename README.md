# Text Admin Control Room

Internal admin web app for managing:

- LiveChat agents
- HelpDesk agents
- LiveChat group memberships with `Primary` (`first`) or `Last` (`normal`) priority
- HelpDesk team memberships
- D1-backed audit logs
- Admin-only access using a signed session cookie

The app is built for **Cloudflare Pages + Pages Functions + D1** and uses **Bootstrap 5** with a custom liquid glass UI layer.

## What this project does

### LiveChat

- Create agents
- Suspend agents
- View every agent and their current groups
- Assign multiple selected groups to multiple selected agents
- Remove multiple selected groups from multiple selected agents

### HelpDesk

- Create agents
- Remove agents
- View every agent and their current teams
- Assign multiple selected teams to multiple selected agents
- Remove multiple selected teams from multiple selected agents

### Logging

- Stores audit history in Cloudflare D1
- Logs create, suspend, delete, and membership changes

## Important implementation notes

- **LiveChat** is wired against the Text / LiveChat Configuration API pattern at `https://api.livechatinc.com/<version>/configuration/action/...`.
- **HelpDesk** is wired against `https://api.helpdesk.com/v1/...`.
- The frontend never sends the upstream admin tokens directly. All API calls go through Pages Functions.
- HelpDesk public docs expose a clear **delete agent** endpoint. I used that for the "deactivate/remove" action there.

## Required Cloudflare variables and secrets

Set these in Cloudflare Pages for both **Production** and **Preview** as needed:

### Admin auth

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `SESSION_SECRET`

### Text API auth

- `TEXT_BASIC_AUTH_B64`
- `LIVECHAT_API_VERSION`

Recommended value:

- `LIVECHAT_API_VERSION=v3.6`

## D1 schema

Run the schema from [schema.sql](./schema.sql).

## Local development

1. Install dependencies:

   ```bash
   npm install
   ```

2. Authenticate Wrangler:

   ```bash
   npx wrangler login
   ```

3. Create the D1 database:

   ```bash
   npx wrangler d1 create livechat-admin-logs
   ```

4. Copy the returned `database_id` into [wrangler.toml](./wrangler.toml).

5. Apply the schema:

   ```bash
   npx wrangler d1 execute livechat-admin-logs --file=schema.sql
   ```

6. Create a local env file:

   Copy [.dev.vars.example](./.dev.vars.example) to `.dev.vars` and fill in the real values.

7. Start the app:

   ```bash
   npm run dev
   ```

8. Open the local Pages URL printed by Wrangler.

## Cloudflare Pages setup: step by step

These steps reflect current Cloudflare Pages and D1 docs as of **April 22, 2026**.

### 1. Create a new GitHub repository

1. Go to GitHub.
2. Click **New repository**.
3. Name it something like `text-admin-control-room` or `livechat-admin`.
4. Choose public or private.
5. Do **not** initialize it with README, `.gitignore`, or license if you want to push this folder as-is.
6. Create the repository.

### 2. Connect this folder to that repository

Run these commands in this project folder:

```bash
git init
git add .
git commit -m "Initial Cloudflare Pages admin app"
git branch -M main
git remote add origin https://github.com/YOUR-ACCOUNT/YOUR-REPO.git
git push -u origin main
```

If this folder is already a Git repo, skip `git init` and only add the remote if needed.

### 3. Create the D1 database

```bash
npx wrangler d1 create livechat-admin-logs
```

Then:

1. Copy the generated `database_id`.
2. Paste it into [wrangler.toml](./wrangler.toml).
3. Run:

   ```bash
   npx wrangler d1 execute livechat-admin-logs --file=schema.sql
   ```

### 4. Create the Pages project

In Cloudflare:

1. Go to **Workers & Pages**.
2. Click **Create application**.
3. Choose **Pages**.
4. Choose **Connect to Git**.
5. Authorize GitHub.
6. Select the repository you just created.

### 5. Configure the Pages build

Use:

- **Framework preset**: `None`
- **Build command**: leave blank
- **Build output directory**: `.`
- **Root directory**: leave blank unless the repo is a monorepo
- **Production branch**: `main`

### 6. Add environment variables and secrets in Pages

In the Pages project:

1. Open **Settings**.
2. Go to **Environment variables** and add:
   - `ADMIN_USERNAME`
   - `LIVECHAT_API_VERSION` = `v3.6`
3. Add secrets:
   - `ADMIN_PASSWORD`
   - `SESSION_SECRET`
   - `TEXT_BASIC_AUTH_B64`

### 7. Bind D1 to Pages

In the Pages project:

1. Open **Settings > Bindings**.
2. Click **Add binding**.
3. Choose **D1 database**.
4. Variable name: `DB`
5. Select your `livechat-admin-logs` database.
6. Save.
7. Redeploy the project.

### 8. Trigger the first deployment

Push a commit to `main`:

```bash
git add .
git commit -m "Configure production deployment"
git push
```

Cloudflare Pages will build and deploy automatically.

## Text / HelpDesk API references used

- Text Authorization overview: https://platform.text.com/docs/authorization
- Text scopes: https://platform.text.com/docs/authorization/scopes
- Text Management overview: https://platform.text.com/docs/management
- Text Management changelog: https://platform.text.com/docs/management/changelog
- HelpDesk API reference: https://api.helpdesk.com/docs
- HelpDesk overview: https://platform.text.com/docs/helpdesk

## Suggested next improvements

- Replace static admin username/password with Cloudflare Access or your SSO
- Add confirmation modals for destructive actions
- Add pagination and filters for large licenses
- Add CSV export for logs
- Add unsuspend/reactivate flow for LiveChat if you need it
