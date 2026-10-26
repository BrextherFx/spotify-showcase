# Key UI Model Context Protocol (MCP) Server

Connect your favorite AI agent (**Cursor**, **Claude Desktop**, **Antigravity**, **Windsurf**, or **Claude Code**) directly to **Key UI** to discover, inspect, and retrieve code for interactive physical components, physics simulations, and audio synthesizers.

---

## ⚡ Quick Configuration

### 1. Claude Desktop
Add this to your `claude_desktop_config.json`:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

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

### 2. Cursor IDE
Add to `.cursor/mcp.json` or in Cursor Settings > Features > MCP:

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

### 3. Windsurf
Add to `~/.codeium/windsurf/mcp_config.json`:

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

## 🛠 Available MCP Tools

| Tool | Parameters | Description |
| :--- | :--- | :--- |
| `list_components` | `category?` (string) | Lists all available components, tags, and descriptions. |
| `get_component` | `component_id` (string, required) | Returns the full React TypeScript source code, prop interfaces, peer dependencies, and styling. |
| `get_install_command` | `component_id`, `package_manager?` (`pnpm`\|`yarn`\|`npm`\|`bun`) | Generates CLI install commands. |
| `search_components` | `query` (string, required) | Search components by keyword (e.g., "typewriter", "audio", "spring", "button"). |

---

## 📦 Components Currently Available

- `typewriter`: Interactive mechanical typewriter with tactile keypress audio, ink typing physics, WPM/CPM accuracy tracking, and receipt download.
- `copy-button`: Chanh Dai inspired animated copy button with smooth state transitions, mechanical sound knock, and tooltip.
- `code-installation-block`: Tabbed terminal package manager installation block (`pnpm`, `yarn`, `npm`, `bun`) with active underline indicator and syntax highlighting.
- `animated-logo`: 4-piece spring-loaded geometric "K" logo with magnetic cursor hover physics, amber and obsidian colorways.
- `aquarium-404`: Underwater 404 canvas with Navier-Stokes 2D fluid simulation, cavitation bubbles, and Minnaert hydrophone audio synthesis.
- `accordion-faq`: Physical spring-animated FAQ accordion with fluid damping physics and tactile click audio feedback.

---

## 💡 Example AI Agent Prompts

Once configured, you can simply ask your AI assistant:
- *"Fetch the Typewriter component from Key UI and integrate it into my dashboard."*
- *"Show me how to install the Key UI CopyButton component using pnpm."*
- *"Find all audio-reactive components in Key UI."*
