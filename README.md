# LiveChat Admin

A web application for managing users in LiveChat and HelpDesk platforms, built with Cloudflare Pages and D1 database.

## Features

- Admin authorization with password
- Create and deactivate users on LiveChat/HelpDesk
- Assign/unassign users to groups as primary or last
- View current group memberships for all agents
- Multiple selection for bulk assign/unassign
- View logs of actions stored in D1

## Setup

### Prerequisites

- Node.js and npm
- Cloudflare account
- GitHub account

### Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Run development server: `npm run dev`
4. Open http://localhost:8788

### Cloudflare Setup

1. Install Wrangler CLI: `npm install -g wrangler`
2. Login to Cloudflare: `wrangler auth login`
3. Create D1 database: `wrangler d1 create logs`
   - Note the database_id from the output
   - Update `wrangler.toml` with the database_id
4. Create the logs table: `wrangler d1 execute logs --command "CREATE TABLE logs (id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp TEXT, action TEXT, details TEXT)"`

### GitHub Repository Creation

1. Go to GitHub.com
2. Click "New repository"
3. Name: livechat-admin
4. Make it public or private
5. Do not initialize with README (since we have one)
6. Create repository

### Connect to Cloudflare Pages

1. In Cloudflare Dashboard, go to Pages
2. Click "Create a project"
3. Connect to Git (GitHub)
4. Select your repository: livechat-admin
5. Build settings:
   - Build command: (leave empty, static)
   - Build output directory: (leave empty)
   - Root directory: /
6. Environment variables: Add your API tokens if needed (but for security, use Wrangler secrets)
7. Deploy

### API Tokens

- For LiveChat: Get token from LiveChat Developers Console
- For HelpDesk: Adjust URLs and get token accordingly
- In the app, enter the token in the API Token field

## Usage

- Login with password 'admin'
- Enter API token
- Manage users and groups
- Logs are stored in D1 and displayed in the Logs tab

## Technologies

- HTML/CSS/JavaScript
- Bootstrap 5
- Cloudflare Pages
- Cloudflare D1
- Cloudflare Workers (Pages Functions)