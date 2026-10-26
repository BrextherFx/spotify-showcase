# Key UI ⚡

A modern library of **living, physical web interfaces** featuring procedural Web Audio synthesis, spring kinetics, Canvas fluid dynamics, and native **Model Context Protocol (MCP)** integration for AI coding agents.

[![npm version](https://img.shields.io/npm/v/key-ui.svg)](https://www.npmjs.com/package/key-ui)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## ⚡ Quick Install via CLI

You can download and add any component directly to your React / Next.js / Vite project using the Key UI CLI:

```bash
# Add mechanical typewriter component
npx key-ui add typewriter

# Add tactile animated copy button
npx key-ui add copy-button

# Add tabbed code installation block
npx key-ui add code-installation-block

# List all available components
npx key-ui list
```

---

## 🤖 Connect to AI Coding Agents (Cursor, Claude, Windsurf, Antigravity)

Key UI includes a native **Model Context Protocol (MCP)** server. AI assistants can inspect components, search capabilities, and retrieve ready-to-use TypeScript code directly.

### Cursor IDE
Add to `.cursor/mcp.json` or Cursor Settings > Features > MCP:
```json
{
  "mcpServers": {
    "key-ui": {
      "command": "node",
      "args": ["mcp-server/index.js"]
    }
  }
}
```

### Claude Desktop
Add to `%APPDATA%\Claude\claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "key-ui": {
      "command": "node",
      "args": ["C:/Users/thril/Desktop/Key-Ui/mcp-server/index.js"]
    }
  }
}
```

---

## 🚀 Local Development Setup

```bash
# Install dependencies
npm install

# Run Vite dev server
npm run dev

# Build production bundle
npm run build

# Preview build
npm run preview

# Start MCP server (stdio)
npm run mcp

# Start Remote Hosted MCP Server (SSE)
npm run mcp:sse
```

---

## 📦 Components Included

1. **Mechanical Typewriter (`/play/typewriter`)**
   - Procedural mechanical key clicks, carriage slide, and end-of-line bell chimes synthesized via Web Audio API.
   - Real paper typing simulation with typos staying permanently on paper.
   - Live WPM, CPM, accuracy tracking, and receipt canvas download.
   - Chanh Dai style installation block and tactile copy button.

2. **Submerged Aquarium 404 (`/404`)**
   - 2D Navier-Stokes fluid turbulence and interactive water wake.
   - Underwater acoustic hydrophone synthesis (Minnaert bubble cavitation, fluid drag).
   - Floating physics digits you can toss and submerge.

3. **Living Accordion FAQ (`/play/accordion`)**
   - Italian Red Pearl Marbled finish procedural shader.
   - Fluid spring physics with acoustic bellows.
   - Dual-reed sound synthesis with real musical frequencies (C4, E4, G4, A4, C5).
   - Live chord detection when 3 or more FAQ items are opened.

4. **Vinyl Turntable Lyrics (`/play/vinyl-lyrics`)**
   - Realistic vinyl record player with physical grooves and specular lighting.
   - Real-time scratching physics with audio pitch shift.
   - Syllable-by-syllable karaoke lyrics tracking.

5. **Tactile Copy Button (`CopyButton`)**
   - Chanh Dai inspired minimal 28×28px copy button.
   - Smooth morphing transition between `idle`, `done`, and `error`.
   - Web Audio mechanical tap knock feedback and hover tooltip.

6. **Animated Geometric Logo (`AnimatedLogo`)**
   - 4-piece spring-loaded "K" logo.
   - Interactive magnetic cursor attraction.
   - Dual theme support: glowing amber gradient for dark pages, polished obsidian for light backgrounds.

---

## 🌐 Hosted Remote MCP Server

To host your MCP server remotely (so AI agents can connect over the internet without local Node installation):
- Deploy this repository to **Render**, **Railway**, **Fly.io**, or **Vercel**.
- Start command: `node mcp-server/server-sse.js`
- Connect your agent to: `https://your-domain.com/sse`

---

## 📄 License
MIT © [BrextherFx](https://github.com/BrextherFx)
