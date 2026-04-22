# Text Admin Control Room

Internal admin web app for managing LiveChat and HelpDesk users from one place on Cloudflare Pages.

It includes:

- admin-only login with signed cookie sessions
- LiveChat agent creation
- LiveChat suspend action
- LiveChat bulk group assignment and removal
- LiveChat priority control for `Primary` (`first`) and `Last` (`normal`)
- HelpDesk agent creation
- HelpDesk agent removal through the public delete endpoint
- HelpDesk bulk team assignment and removal
- current group and team visibility per agent
- D1-backed audit logs
- responsive Bootstrap UI with a liquid glass visual style

## Stack

- Cloudflare Pages
- Pages Functions in `/functions`
- Cloudflare D1 for audit logs
- Bootstrap 5 and Bootstrap Icons via CDN
- Plain HTML, CSS, and browser JavaScript

## Project structure

```text
.
├── functions/
│   ├── _lib/
│   └── api/
├── index.html
├── script.js
├── styles.css
├── schema.sql
├── wrangler.toml
└── package.json
```

## Environment variables

Set these for both Preview and Production in Cloudflare Pages:

- `ADMIN_USERNAME`
- `ADMIN_PASSWORD`
- `SESSION_SECRET`
- `TEXT_BASIC_AUTH_B64`
- `LIVECHAT_API_VERSION`

Recommended:

- `LIVECHAT_API_VERSION=v3.6`

## What `TEXT_BASIC_AUTH_B64` should contain

Base64-encode your Text / HelpDesk Basic auth credential pair.

Examples:

- `account_id:personal_access_token`
- `email:personal_access_token`

The exact form depends on how your Text account and token are configured. The Text docs say HelpDesk shares the same auth model as LiveChat, and the HelpDesk public API docs describe Basic auth with account id and token for PAT usage.

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Log in to Cloudflare:

   ```bash
   npx wrangler login
   ```

3. Create a D1 database:

   ```bash
   npx wrangler d1 create text-admin-control-room
   ```

4. Copy the returned `database_id` into [wrangler.toml](/Users/igarkvyatkouski/Desktop/playcare projects/livechat_admin/wrangler.toml).

5. Apply the schema:

   ```bash
   npx wrangler d1 execute text-admin-control-room --file=schema.sql
   ```

6. Create your local secrets file:

   ```bash
   cp .dev.vars.example .dev.vars
   ```

7. Fill in `.dev.vars` with real credentials and secrets.

8. Start local development:

   ```bash
   npm run dev
   ```

## GitHub repository setup

1. Create a new repository in GitHub.
2. Choose a name, for example `text-admin-control-room`.
3. Leave it empty when creating it.
4. In this folder, run:

   ```bash
   git add .
   git commit -m "Initial Cloudflare Pages admin app"
   git branch -M main
   git remote add origin https://github.com/YOUR-ACCOUNT/YOUR-REPO.git
   git push -u origin main
   ```

If this repo already has a remote, skip the `git remote add origin` step.

## Cloudflare Pages setup

These steps reflect the current official Cloudflare Pages and D1 flow as checked on April 22, 2026.

### 1. Create the Pages project

1. Go to Cloudflare Dashboard.
2. Open **Workers & Pages**.
3. Click **Create application**.
4. Choose **Pages**.
5. Choose **Connect to Git**.
6. Authorize GitHub if needed.
7. Select the repository you pushed.

### 2. Configure the build

Use:

- Framework preset: `None`
- Build command: leave blank
- Build output directory: `.`
- Root directory: leave blank unless using a monorepo
- Production branch: `main`

### 3. Add environment variables and secrets

In **Settings > Environment variables**:

- `ADMIN_USERNAME`
- `LIVECHAT_API_VERSION` with value `v3.6`

In **Settings > Variables and Secrets** or the equivalent secret section:

- `ADMIN_PASSWORD`
- `SESSION_SECRET`
- `TEXT_BASIC_AUTH_B64`

### 4. Bind D1

In **Settings > Bindings**:

1. Add a new binding.
2. Choose **D1 database**.
3. Use variable name `DB`.
4. Select the `text-admin-control-room` database.
5. Save.

### 5. Deploy

Push to `main` and Cloudflare Pages will deploy automatically.

## D1 schema deployment

If you need to re-apply the schema later:

```bash
npx wrangler d1 execute text-admin-control-room --file=schema.sql
```

## API behavior notes

### LiveChat

- Uses the Text Configuration API action endpoints at `https://api.livechatinc.com/{version}/configuration/action/...`
- Lists agents and groups
- Creates agents
- Suspends agents
- Updates memberships by replacing the agent's final group set

### HelpDesk

- Uses `https://api.helpdesk.com/v1/...`
- Lists agents and teams
- Creates agents
- Updates team memberships with `PATCH /agents/{id}`
- Removes agents with `DELETE /agents/{id}`

## Operational notes

- Logs are written after successful and failed admin actions
- The UI stores no upstream tokens in the browser
- All upstream API access flows through Pages Functions
- Session cookies are signed with HMAC SHA-256 and marked `HttpOnly`, `Secure`, and `SameSite=Strict`

## Official references used

- Cloudflare Pages Functions: https://developers.cloudflare.com/pages/functions/
- Cloudflare Pages Wrangler configuration: https://developers.cloudflare.com/pages/functions/wrangler-configuration/
- Cloudflare D1 overview: https://developers.cloudflare.com/d1/
- Text Platform overview: https://platform.text.com/docs/
- Text Management overview: https://platform.text.com/docs/management
- Text agent authorization: https://platform.text.com/docs/authorization/agent-authorization
- Text HelpDesk overview: https://platform.text.com/docs/helpdesk
- HelpDesk API docs: https://api.helpdesk.com/docs
