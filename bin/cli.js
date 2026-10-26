#!/usr/bin/env node

/**
 * Key UI CLI
 * Allows users to add components directly to their project via `npx key-ui add <component>`
 * or launch the MCP server via `npx key-ui mcp`.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { KEY_UI_COMPONENTS } from '../mcp-server/registry.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const command = args[0]?.toLowerCase();

function printBanner() {
  console.log(`
\x1b[38;5;208m   __ __              __  ______
  / //_/___ __ __    / / / /  _/
 / ,<  / -_) // /   / /_/ // /  
/_/|_| \\__/\\_, /    \\____/___/  
          /___/                 \x1b[0m
\x1b[2mInteractive physical UI components with sound, kinetics & MCP.\x1b[0m
`);
}

function printHelp() {
  printBanner();
  console.log(`\x1b[1mUsage:\x1b[0m
  npx key-ui <command> [options]

\x1b[1mCommands:\x1b[0m
  \x1b[36madd <component>\x1b[0m     Download and add a component to your project
  \x1b[36mlist\x1b[0m                List all available Key UI components
  \x1b[36mmcp\x1b[0m                 Start the local MCP server for AI agents (stdio)
  \x1b[36mserve-mcp\x1b[0m           Start the remote hosted SSE MCP server
  \x1b[36m--help, -h\x1b[0m          Show this help message

\x1b[1mExamples:\x1b[0m
  npx key-ui add typewriter
  npx key-ui add copy-button --dir src/components
  npx key-ui list
  npx key-ui mcp
`);
}

function listComponents() {
  printBanner();
  console.log(`\x1b[1mAvailable Components:\x1b[0m\n`);
  for (const comp of Object.values(KEY_UI_COMPONENTS)) {
    console.log(`  \x1b[32m✔\x1b[0m \x1b[1m${comp.id}\x1b[0m (\x1b[33m${comp.name}\x1b[0m)`);
    console.log(`    \x1b[2m${comp.description}\x1b[0m`);
    console.log(`    \x1b[38;5;244mCategory:\x1b[0m ${comp.category} | \x1b[38;5;244mTags:\x1b[0m ${comp.tags?.join(', ') || 'ui'}\n`);
  }
}

async function addComponent(componentId, options) {
  if (!componentId) {
    console.error('\x1b[31mError: Please specify a component name.\x1b[0m');
    console.log('Run \x1b[36mnpx key-ui list\x1b[0m to see all available components.');
    process.exit(1);
  }

  const comp = KEY_UI_COMPONENTS[componentId.toLowerCase()];
  if (!comp) {
    console.error(`\x1b[31mError: Component "${componentId}" not found.\x1b[0m`);
    console.log(`Available components: \x1b[36m${Object.keys(KEY_UI_COMPONENTS).join(', ')}\x1b[0m`);
    process.exit(1);
  }

  // Parse destination directory
  let targetDir = 'components';
  const dirIndex = options.indexOf('--dir');
  if (dirIndex !== -1 && options[dirIndex + 1]) {
    targetDir = options[dirIndex + 1];
  } else if (fs.existsSync('src/components')) {
    targetDir = 'src/components';
  }

  const destDir = path.resolve(process.cwd(), targetDir);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // File name
  const fileName = `${comp.id}.tsx`;
  const destPath = path.join(destDir, fileName);

  fs.writeFileSync(destPath, comp.sourceCode.trim() + '\n', 'utf8');

  console.log(`\n\x1b[32m✔ Successfully added ${comp.name}!\x1b[0m`);
  console.log(`  Saved to: \x1b[36m${path.relative(process.cwd(), destPath)}\x1b[0m\n`);

  if (comp.peerDependencies && Object.keys(comp.peerDependencies).length > 0) {
    const deps = Object.keys(comp.peerDependencies).join(' ');
    console.log(`\x1b[33mPeer dependencies required:\x1b[0m`);
    console.log(`  npm install ${deps}`);
    console.log(`  or: pnpm add ${deps}\n`);
  }

  console.log(`\x1b[1mQuick Usage Example:\x1b[0m`);
  console.log(`\x1b[2m  import { ${comp.name.replace(/[^a-zA-Z0-9]/g, '')} } from './${targetDir}/${comp.id}';\x1b[0m\n`);
}

async function runMcp() {
  const mcpPath = path.resolve(__dirname, '../mcp-server/index.js');
  const proc = spawn('node', [mcpPath], { stdio: 'inherit' });
  proc.on('exit', (code) => process.exit(code || 0));
}

async function runServeMcp() {
  const ssePath = path.resolve(__dirname, '../mcp-server/server-sse.js');
  const proc = spawn('node', [ssePath], { stdio: 'inherit' });
  proc.on('exit', (code) => process.exit(code || 0));
}

// Router
switch (command) {
  case 'list':
  case 'ls':
    listComponents();
    break;

  case 'add':
    addComponent(args[1], args.slice(2));
    break;

  case 'mcp':
    runMcp();
    break;

  case 'serve-mcp':
  case 'serve':
    runServeMcp();
    break;

  case '--help':
  case '-h':
  case 'help':
  case undefined:
    printHelp();
    break;

  default:
    console.error(`\x1b[31mUnknown command: ${command}\x1b[0m\n`);
    printHelp();
    process.exit(1);
}
