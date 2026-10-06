<div align="center">
  <img src="https://files.catbox.moe/vumztw.png" alt="ADK-TS Logo" width="80" />
  <br/>
  <h1>ADK-TS Examples</h1>
  <b>A collection of comprehensive examples that demonstrate how to build AI agents in TypeScript with ADK-TS</b>
  <br/>
  <i>Agent Building • Tool Integration • Memory Systems • Advanced Feature</i>
</div>

---

## 🌟 Overview

This directory contains a collection of comprehensive examples that demonstrate how to build AI agents in TypeScript with ADK-TS. You can use these examples to learn how to build AI agents, integrate tools, manage memory, and implement advanced features.

## 🚀 Quick Start

### Prerequisites

Before running the examples, here's what you need:

- **Node.js 22.0+** (or as specified in the `package.json` file)
- **API Keys** for your chosen LLM provider(s)

_Note: this project uses [**pnpm**](https://pnpm.io/) as the package manager. You can use other package managers, but to have a better experience, please install pnpm globally on your system._

### Setup Instructions

1. **Clone the Repository and Install the Dependencies**

```bash
  git clone https://github.com/IQAIcom/adk-ts.git
  cd adk-ts
  pnpm install
```

1. **Build the ADK-TS Package**

For the examples to work correctly, you need to build the core ADK-TS package first. This step compiles the TypeScript code and prepares the necessary files.

```bash
  pnpm build
```

1. **Configure Environment Variables**

Create a `.env` file in the **examples directory** (not in the root folder) and add your API keys and optional model configuration. This file is used to set environment variables that the examples will use.

```bash
  # apps/examples/.env

  # Optional: Specify which model to use
  LLM_MODEL=your_model_name

  # Required: At least one API key
  GOOGLE_API_KEY=your_google_api_key
  OPENAI_API_KEY=your_openai_api_key
  ANTHROPIC_API_KEY=your_anthropic_api_key
```

The default LLM is Google Gemini. You can get a Google API key from [Google AI Studio](https://makersuite.google.com/app/apikey). If you want to use a different model, you can specify it in the `.env` file using the `LLM_MODEL` variable or update it directly in the example code.

> Note: Some examples require additional configuration or dependencies. Please check the [`.env.example`](.env.example) file for specific instructions.

1. **Run Examples**

To explore the examples, you can either browse all available examples or run a specific one directly:

```bash
  cd apps/examples

  # Interactive mode - browse and select an example
  pnpm start

  # Or run a specific example directly
  pnpm start --name 01-getting-started
  pnpm start --name 06-mcp-and-integrations
```

### Opt-in Parallel Search research agent

The standalone Parallel Search example connects `McpToolset` to
`https://search.parallel.ai/mcp` over Streamable HTTP. Parallel Search MCP is
free and keyless. Your chosen LLM still needs its usual provider credentials.
The example does not change the interactive MCP demo or the built-in search tool.

After installing dependencies, build the core package from the repository root:

```bash
pnpm --filter @iqai/adk build
```

Configure your LLM credentials and optional `LLM_MODEL` in `apps/examples/.env`
as described above, then run:

```bash
cd apps/examples
pnpm parallel-search "What transports does MCP support? Cite the official specification."
```

The agent discovers `web_search` and `web_fetch`, searches for evidence, and
returns an answer with source URLs. It can fetch a specific page when the
question needs more detail. Search queries and requested URLs are sent to
Parallel; retrieved content is sent to your configured LLM. No Parallel API key
or local MCP proxy is required. The connection is closed after the answer or
an error. Network, service rate limits, and LLM credentials can affect execution.

The configuration lives in
`src/06-mcp-and-integrations/parallel-search-agent.ts`. ADK-TS names its remote
transport mode `"sse"`, but implements it with `StreamableHTTPClientTransport`.
The example sets `User-Agent: adk-ts/parallel-search-example` for discovery and
tool requests and filters the advertised tools to search and fetch. Use these
tools in a dedicated agent: the existing Tavily `WebSearchTool` also uses the
name `web_search`, so adding both to the same agent would cause a name collision.

Run the deterministic example tests without LLM credentials or external requests:

```bash
pnpm test:parallel-search
```

These tests use a local MCP fixture and a scripted LLM to check discovery,
filtering, search and fetch through the ADK runner, a sourced final answer,
request headers, and connection cleanup.

## 📚 Explore Example Applications

We have **9 comprehensive examples** that cover the complete ADK-TS feature set, organized in a logical learning progression from basic concepts to advanced implementations:

### 🎯 **Foundational Examples (01-03)**

| Example                                                   | Description                            | Key Concepts                                           |
| --------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------ |
| **[01-getting-started](src/01-getting-started/)**         | Basic agent setup and folder structure | AgentBuilder basics, Zod schemas, structured responses |
| **[02-tools-and-state](src/02-tools-and-state/)**         | Custom tools with state management     | Tool creation, state persistence, system instructions  |
| **[03-multi-agent-systems](src/03-multi-agent-systems/)** | Multi-agent systems and coordination   | Sub-agents, agent delegation, specialized roles        |

### 🔧 **Intermediate Examples (04-05)**

| Example                                                                   | Description                                         | Key Concepts                                                  |
| ------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------- |
| **[04-persistence-and-sessions](src/04-persistence-and-sessions/)**       | Database integration, artifacts, and session rewind | Session persistence, artifacts, event compaction, time-travel |
| **[05-planning-and-code-execution](src/05-planning-and-code-execution/)** | Planning and code execution capabilities            | PlanReActPlanner, BuiltInCodeExecutor, Python sandbox         |

### 🚀 **Advanced Examples (06-09)**

| Example                                                               | Description                                             | Key Concepts                                                                       |
| --------------------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **[06-mcp-and-integrations](src/06-mcp-and-integrations/)**           | Model Context Protocol with custom and external servers | MCP servers, sampling, custom sampling handler with routing, Coingecko integration |
| **[07-guardrails-and-evaluation](src/07-guardrails-and-evaluation/)** | Safety guardrails and agent evaluation                  | Plugins, lifecycle hooks, content filtering, AgentEvaluator                        |
| **[08-observability-and-plugins](src/08-observability-and-plugins/)** | Monitoring, tracing, and metrics                        | OpenTelemetry, Langfuse integration, observability                                 |
| **[09-scheduling](src/09-scheduling/)**                               | Recurring agent execution on a schedule                 | AgentScheduler, cron/interval jobs, callbacks, event listeners                     |

## 🤝 Contributing

If you would like to add examples or improve existing ones, please check out our [Contributing Guide](../../CONTRIBUTING.md) for details on how to get started.

---

💡 **Pro Tip**: Follow the examples in order (01-09) for a structured learning path, or jump to specific examples based on your needs. Start with `01-getting-started` to understand the basics, then explore advanced features like multi-agent systems, MCP integrations, guardrails, observability, and scheduling!
