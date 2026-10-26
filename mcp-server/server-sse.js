#!/usr/bin/env node

/**
 * Key UI Model Context Protocol (MCP) HTTP / SSE Server
 * Deployable to Render, Railway, Fly.io, Vercel, or any VPS.
 * Provides remote SSE endpoints for AI agents (Cursor, Claude, Antigravity, ChatGPT).
 */

import { createServer } from 'node:http';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { KEY_UI_COMPONENTS } from './registry.js';

const PORT = process.env.PORT || 3333;

function createMcpServerInstance() {
  const server = new Server(
    {
      name: 'key-ui-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    }
  );

  // Tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'list_components',
        description: 'List all available components in Key UI with descriptions, categories, and tags.',
        inputSchema: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              description: 'Optional category filter (e.g. "Interactive Playgrounds", "UI Primitives")',
            },
          },
        },
      },
      {
        name: 'get_component',
        description: 'Get full React/TypeScript source code, props, and peer dependencies for a Key UI component.',
        inputSchema: {
          type: 'object',
          properties: {
            component_id: {
              type: 'string',
              description: 'The unique component ID (e.g. "typewriter", "copy-button", "code-installation-block", "animated-logo", "aquarium-404", "accordion-faq")',
            },
          },
          required: ['component_id'],
        },
      },
      {
        name: 'get_install_command',
        description: 'Get the exact terminal command to install a Key UI component using pnpm, yarn, npm, or bun.',
        inputSchema: {
          type: 'object',
          properties: {
            component_id: {
              type: 'string',
              description: 'The component ID (e.g. "typewriter", "copy-button")',
            },
            package_manager: {
              type: 'string',
              enum: ['pnpm', 'yarn', 'npm', 'bun'],
              description: 'Target package manager (default: "pnpm")',
            },
          },
          required: ['component_id'],
        },
      },
      {
        name: 'search_components',
        description: 'Search Key UI components by keyword, technology, or feature.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search keyword (e.g. "sound", "button", "copy", "typewriter", "fluid", "spring")',
            },
          },
          required: ['query'],
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (name === 'list_components') {
      const categoryFilter = args?.category?.toLowerCase();
      const items = Object.values(KEY_UI_COMPONENTS)
        .filter((c) => !categoryFilter || c.category.toLowerCase().includes(categoryFilter))
        .map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          category: c.category,
          tags: c.tags,
        }));
      return { content: [{ type: 'text', text: JSON.stringify(items, null, 2) }] };
    }

    if (name === 'get_component') {
      const compId = args?.component_id?.toLowerCase()?.trim();
      const comp = KEY_UI_COMPONENTS[compId];
      if (!comp) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Component "${compId}" not found. Available: ${Object.keys(KEY_UI_COMPONENTS).join(', ')}`,
            },
          ],
        };
      }
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                id: comp.id,
                name: comp.name,
                description: comp.description,
                category: comp.category,
                peerDependencies: comp.peerDependencies || {},
                installCommands: comp.installCommands || {},
                props: comp.props || [],
                sourceCode: comp.sourceCode,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    if (name === 'get_install_command') {
      const compId = args?.component_id?.toLowerCase()?.trim();
      const pm = args?.package_manager || 'pnpm';
      const comp = KEY_UI_COMPONENTS[compId];
      if (!comp) {
        return { isError: true, content: [{ type: 'text', text: `Component "${compId}" not found.` }] };
      }
      return {
        content: [
          {
            type: 'text',
            text: comp.installCommands?.[pm] || `pnpm dlx shadcn@latest add @key-ui/${compId}`,
          },
        ],
      };
    }

    if (name === 'search_components') {
      const query = (args?.query || '').toLowerCase().trim();
      const matches = Object.values(KEY_UI_COMPONENTS).filter((c) => {
        return (
          c.id.toLowerCase().includes(query) ||
          c.name.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query) ||
          (c.tags && c.tags.some((t) => t.toLowerCase().includes(query)))
        );
      });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              matches.map((c) => ({
                id: c.id,
                name: c.name,
                description: c.description,
                category: c.category,
                tags: c.tags,
              })),
              null,
              2
            ),
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  });

  // Resources
  server.setRequestHandler(ListResourcesRequestSchema, async () => ({
    resources: [
      {
        uri: 'keyui://components',
        name: 'Key UI Components Catalog',
        description: 'Complete catalog of all Key UI animated and interactive components.',
        mimeType: 'application/json',
      },
      ...Object.values(KEY_UI_COMPONENTS).map((c) => ({
        uri: `keyui://component/${c.id}`,
        name: `${c.name} Component`,
        description: c.description,
        mimeType: 'text/typescript',
      })),
    ],
  }));

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    if (uri === 'keyui://components') {
      return {
        contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(Object.values(KEY_UI_COMPONENTS), null, 2) }],
      };
    }
    if (uri.startsWith('keyui://component/')) {
      const compId = uri.replace('keyui://component/', '');
      const comp = KEY_UI_COMPONENTS[compId];
      if (!comp) throw new Error(`Component resource not found: ${uri}`);
      return {
        contents: [{ uri, mimeType: 'text/typescript', text: comp.sourceCode }],
      };
    }
    throw new Error(`Unknown resource URI: ${uri}`);
  });

  // Prompts
  server.setRequestHandler(ListPromptsRequestSchema, async () => ({
    prompts: [
      {
        name: 'implement-component',
        description: 'Guide for integrating a Key UI component into a user project.',
        arguments: [{ name: 'component_id', description: 'Component ID (e.g. "typewriter")', required: true }],
      },
    ],
  }));

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    if (name === 'implement-component') {
      const compId = args?.component_id;
      return {
        description: `Guide for integrating Key UI ${compId}`,
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Please help me integrate the Key UI "${compId}" component into my React/Tailwind project. Provide installation commands, the TypeScript component, and an example usage.`,
            },
          },
        ],
      };
    }
    throw new Error(`Unknown prompt: ${name}`);
  });

  return server;
}

// Map of active SSE sessions
const transports = new Map();

const httpServer = createServer(async (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  // SSE Stream endpoint
  if (url.pathname === '/sse' && req.method === 'GET') {
    const mcpServer = createMcpServerInstance();
    const transport = new SSEServerTransport('/messages', res);
    const sessionId = transport.sessionId;
    transports.set(sessionId, transport);

    req.on('close', () => {
      transports.delete(sessionId);
    });

    await mcpServer.connect(transport);
    return;
  }

  // Messages post endpoint
  if (url.pathname.startsWith('/messages') && req.method === 'POST') {
    const sessionId = url.searchParams.get('sessionId') || Array.from(transports.keys())[0];
    const transport = transports.get(sessionId);

    if (transport) {
      await transport.handlePostMessage(req, res);
      return;
    } else {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Session not found. Connect to /sse first.' }));
      return;
    }
  }

  // Health & Info endpoint
  if (url.pathname === '/' || url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify(
        {
          name: 'Key UI Remote MCP Server',
          status: 'online',
          version: '1.0.0',
          sseEndpoint: '/sse',
          messagesEndpoint: '/messages',
          componentsCount: Object.keys(KEY_UI_COMPONENTS).length,
          components: Object.keys(KEY_UI_COMPONENTS),
          docs: 'https://github.com/BrextherFx/spotify-showcase',
        },
        null,
        2
      )
    );
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

httpServer.listen(PORT, () => {
  console.log(`Key UI Hosted MCP Server listening on port ${PORT}`);
  console.log(`SSE Endpoint: http://localhost:${PORT}/sse`);
});
