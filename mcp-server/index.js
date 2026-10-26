#!/usr/bin/env node

/**
 * Key UI Model Context Protocol (MCP) Server
 * Allows AI agents (Claude Desktop, Cursor, Antigravity, Windsurf, Claude Code)
 * to explore, inspect, and retrieve full code & install commands for Key UI components.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { KEY_UI_COMPONENTS } from './registry.js';

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

/**
 * MCP Tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_components',
        description: 'List all available components in Key UI with descriptions, categories, and tags.',
        inputSchema: {
          type: 'object',
          properties: {
            category: {
              type: 'string',
              description: 'Optional category filter (e.g. "Interactive Playgrounds", "UI Primitives", "Pages & Experiences", "Branding & Logos")',
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
  };
});

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

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(items, null, 2),
        },
      ],
    };
  }

  if (name === 'get_component') {
    const compId = args?.component_id?.toLowerCase()?.trim();
    const comp = KEY_UI_COMPONENTS[compId];

    if (!comp) {
      const available = Object.keys(KEY_UI_COMPONENTS).join(', ');
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Component "${compId}" not found. Available components: ${available}`,
          },
        ],
      };
    }

    const response = {
      id: comp.id,
      name: comp.name,
      description: comp.description,
      category: comp.category,
      peerDependencies: comp.peerDependencies || {},
      installCommands: comp.installCommands || {},
      props: comp.props || [],
      sourceCode: comp.sourceCode,
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
    };
  }

  if (name === 'get_install_command') {
    const compId = args?.component_id?.toLowerCase()?.trim();
    const pm = args?.package_manager || 'pnpm';
    const comp = KEY_UI_COMPONENTS[compId];

    if (!comp) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Component "${compId}" not found.`,
          },
        ],
      };
    }

    const cmd = comp.installCommands?.[pm] || `pnpm dlx shadcn@latest add @key-ui/${compId}`;

    return {
      content: [
        {
          type: 'text',
          text: cmd,
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

/**
 * MCP Resources
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const componentResources = Object.values(KEY_UI_COMPONENTS).map((c) => ({
    uri: `keyui://component/${c.id}`,
    name: `${c.name} Component`,
    description: c.description,
    mimeType: 'text/typescript',
  }));

  return {
    resources: [
      {
        uri: 'keyui://components',
        name: 'Key UI Components Catalog',
        description: 'Complete catalog of all Key UI animated and interactive components.',
        mimeType: 'application/json',
      },
      ...componentResources,
    ],
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  if (uri === 'keyui://components') {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(Object.values(KEY_UI_COMPONENTS), null, 2),
        },
      ],
    };
  }

  if (uri.startsWith('keyui://component/')) {
    const compId = uri.replace('keyui://component/', '');
    const comp = KEY_UI_COMPONENTS[compId];

    if (!comp) {
      throw new Error(`Component resource not found: ${uri}`);
    }

    return {
      contents: [
        {
          uri,
          mimeType: 'text/typescript',
          text: comp.sourceCode,
        },
      ],
    };
  }

  throw new Error(`Unknown resource URI: ${uri}`);
});

/**
 * MCP Prompts
 */
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: 'implement-component',
        description: 'Step-by-step guide for integrating a Key UI component into a user project.',
        arguments: [
          {
            name: 'component_id',
            description: 'Component ID to implement (e.g. "typewriter", "copy-button")',
            required: true,
          },
        ],
      },
    ],
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'implement-component') {
    const compId = args?.component_id;
    const comp = KEY_UI_COMPONENTS[compId];

    return {
      description: `Guide for integrating Key UI ${comp ? comp.name : compId}`,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please help me integrate the Key UI "${compId}" component into my React/Tailwind project. Provide the installation commands, create the component file with full TypeScript typings, and show an example page demonstrating how to use it.`,
          },
        },
      ],
    };
  }

  throw new Error(`Unknown prompt: ${name}`);
});

/**
 * Start the MCP Server using Stdio transport
 */
async function run() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Key UI MCP Server running on stdio');
}

run().catch((err) => {
  console.error('Error starting Key UI MCP Server:', err);
  process.exit(1);
});
