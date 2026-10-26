# Key UI — Deployment & Publishing Guide (step.md)

This step-by-step guide covers:
1. **Pushing Code to GitHub** (`https://github.com/BrextherFx/spotify-showcase`)
2. **Publishing CLI & MCP to NPM** (`npm publish`)
3. **Hosting the Remote MCP Server** (Render, Railway, or VPS)

---

## 📌 Step 1: Push Code to GitHub

The previous GitHub account (`lowkshivam`) has been **completely logged out** and removed from Windows Credential Manager.

### 1.1 Configure your Git Identity
Run these commands in PowerShell or Command Prompt:

```bash
git config --global user.name "BrextherFx"
git config --global user.email "your-email@example.com"
```
*(Replace `your-email@example.com` with your GitHub email address).*

### 1.2 Initialize Git & Add Remote
In the project directory `C:\Users\thril\Desktop\Key-Ui`:

```bash
# 1. Initialize local repository
git init

# 2. Add remote repository
git remote add origin https://github.com/BrextherFx/spotify-showcase.git

# 3. Stage all files (node_modules and dist are safely ignored by .gitignore)
git add .

# 4. Commit changes
git commit -m "feat: Key UI full release with Typewriter, Chanh Dai copy button, and native MCP server"

# 5. Set branch to main and push
git branch -M main
git push -u origin main --force
```

### 1.3 Authenticating with GitHub
When Git asks for credentials:
- **Username**: `BrextherFx`
- **Password**: Use a **Personal Access Token (Classic)** instead of your password.
  - To generate a token: Go to **GitHub** → **Settings** → **Developer Settings** → **Personal access tokens** → **Tokens (classic)** → Generate new token with `repo` permissions.

---

## 📌 Step 2: Publish to NPM (Key UI CLI)

Once published to npm, anyone can run:
```bash
npx key-ui add typewriter
npx key-ui add copy-button
npx key-ui list
npx key-ui mcp
```

### 2.1 Log into NPM
Run:
```bash
npm login
```
Enter your NPM username, password, and email.

*(If you don't have an NPM account yet, register at [npmjs.com/signup](https://www.npmjs.com/signup)).*

### 2.2 Verify Package Name
If the package name `key-ui` is already taken on NPM, you can publish under your personal scope in `package.json`:
- Option A: Change `"name": "@brextherfx/key-ui"` in `package.json`
- Option B: Use `"name": "key-ui-components"` or `"name": "key-ui-mcp"`

### 2.3 Publish to NPM
```bash
# Build the latest bundle
npm run build

# Publish public package
npm publish --access public
```

---

## 📌 Step 3: Host the Remote MCP Server (SSE)

Key UI includes a built-in HTTP SSE server in [`mcp-server/server-sse.js`](./mcp-server/server-sse.js) that allows AI agents to connect from anywhere over the internet.

### Option A: Free Hosting on Render.com (Recommended)
1. Go to [render.com](https://render.com) and create a free account.
2. Click **New +** → **Web Service**.
3. Connect your GitHub repository: `https://github.com/BrextherFx/spotify-showcase`.
4. Configure service settings:
   - **Name**: `key-ui-mcp`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node mcp-server/server-sse.js`
   - **Instance Type**: `Free`
5. Click **Deploy Web Service**.
6. Once deployed, Render will give you a public URL like:
   `https://key-ui-mcp.onrender.com`

### How AI Agents Connect to your Hosted MCP Server
In **Cursor** or **Claude Desktop**, developers simply add:
```json
{
  "mcpServers": {
    "key-ui-hosted": {
      "url": "https://key-ui-mcp.onrender.com/sse"
    }
  }
}
```

---

## 📌 Step 4: Local CLI Commands Quick Reference

| Command | Action |
| :--- | :--- |
| `npm run dev` | Launch Vite local dev server with hot reload |
| `npm run build` | Compile TypeScript and bundle production assets |
| `npm run preview` | Run production preview server on `http://localhost:3000` |
| `npm run mcp` | Launch local MCP server for AI agents via stdio |
| `npm run mcp:sse` | Launch local HTTP SSE server on `http://localhost:3333` |
| `node bin/cli.js list` | Display all available components in terminal |
| `node bin/cli.js add typewriter` | Add typewriter component to `./components/` |
