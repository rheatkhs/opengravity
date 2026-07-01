# OpenGravity

A lightweight, BYOK (Bring Your Own Key) browser-based IDE with a live terminal, local file system sync, and an autonomous reasoning agent.

![Status](https://img.shields.io/badge/status-alpha-orange) ![License](https://img.shields.io/badge/license-MIT-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)

## Features

- **Live Terminal** — xterm.js connected to a native PTY via WebSocket
- **Code Editor** — CodeMirror 6 with syntax highlighting, multi-tab, auto-save
- **File Explorer** — Local file system sync via File System Access API
- **Autonomous Agent** — Reasoning-enabled tool loop with Vercel AI SDK
- **BYOK** — Bring your own API keys: Anthropic, OpenAI, or local Ollama
- **Safety Guardrails** — Step budget counter, consecutive command limits

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Browser Client (:5173)                                 │
│  React + Tailwind + CodeMirror 6 + xterm.js + AI SDK    │
└──────────────────────┬──────────────────────────────────┘
                       │ WebSocket
┌──────────────────────┴──────────────────────────────────┐
│  Local PTY Daemon (:9800)                               │
│  Node.js + node-pty + ws                                │
│  /terminal → raw PTY stream                             │
│  /rpc      → JSON-RPC command execution                 │
└─────────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Node.js ≥ 20
- npm ≥ 10
- Windows 10 1809+ / macOS / Linux

### 1. Start the PTY Daemon

```bash
cd daemon
npm install
npm run dev
```

You should see:
```
  ◆ OpenGravity PTY Daemon v0.1.0
  ─────────────────────────────────
  [ws] Server listening on ws://127.0.0.1:9800
  [main] ✓ Daemon ready
```

### 2. Start the Frontend

```bash
cd client
npm install
npm run dev
```

Open http://localhost:5173 in your browser.

### 3. Configure the Agent

1. Click the **Settings** icon in the sidebar
2. Select your provider (Anthropic, OpenAI, or Ollama)
3. Enter your API key
4. Select a model

### 4. Start Working

1. Click **Open Folder** in the file explorer to load a project
2. Edit files in the CodeMirror editor
3. Use the terminal at the bottom (connected to your real shell)
4. Type an objective in the **Gravity Control** panel to run the agent

## Project Structure

```
opengravity/
├── daemon/              # Local PTY bridge daemon
│   └── src/
│       ├── index.ts     # Entry point
│       ├── pty-manager.ts
│       ├── ws-server.ts
│       ├── rpc-handler.ts
│       └── utils.ts
│
├── client/              # Frontend IDE
│   └── src/
│       ├── agent/       # Autonomous agent core
│       ├── components/  # React UI components
│       ├── lib/         # FS Access, WebSocket, RPC clients
│       ├── stores/      # Zustand state management
│       └── types/       # TypeScript type definitions
│
└── README.md
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vite + React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Editor | CodeMirror 6 |
| Terminal | xterm.js |
| State | Zustand |
| Agent | Vercel AI SDK |
| Daemon | Node.js + node-pty + ws |

## Agent Tools

| Tool | Description |
|------|------------|
| `list_directory` | Browse project file structure |
| `read_file` | Read specific file contents |
| `patch_file` | Edit files with search/replace |
| `execute_command` | Run shell commands via PTY daemon |

## License

MIT
