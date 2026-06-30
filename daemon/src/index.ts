import { PtyManager } from './pty-manager.js';
import { WsServer } from './ws-server.js';
import { log, getDefaultShell } from './utils.js';

const PORT = parseInt(process.env.OG_PORT || '9800', 10);
const HOST = process.env.OG_HOST || '127.0.0.1';

/**
 * OpenGravity PTY Daemon
 *
 * A lightweight local background service that bridges the browser IDE
 * to a native pseudo-terminal via WebSockets.
 */
async function main(): Promise<void> {
  console.log('');
  console.log('  \x1b[1m\x1b[35m◆ OpenGravity\x1b[0m \x1b[90mPTY Daemon v0.1.0\x1b[0m');
  console.log('  \x1b[90m─────────────────────────────────\x1b[0m');
  console.log('');

  // Initialize PTY manager
  const ptyManager = new PtyManager();
  log('main', `Default shell: ${getDefaultShell()}`);

  // Spawn the PTY process
  ptyManager.spawn({
    cwd: process.cwd(),
  });

  // Handle PTY exit — auto-respawn
  ptyManager.on('exit', ({ exitCode, signal }) => {
    log('main', `PTY exited (code: ${exitCode}, signal: ${signal}). Respawning...`, 'warn');
    setTimeout(() => {
      ptyManager.spawn({ cwd: process.cwd() });
    }, 500);
  });

  // Initialize and start WebSocket server
  const wsServer = new WsServer(ptyManager);
  await wsServer.start({ port: PORT, host: HOST });

  console.log('');
  log('main', '\x1b[32m✓ Daemon ready\x1b[0m');
  console.log('');

  // Graceful shutdown handlers
  const shutdown = async () => {
    console.log('');
    log('main', 'Received shutdown signal');
    ptyManager.destroy();
    await wsServer.shutdown();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Windows: handle Ctrl+C
  if (process.platform === 'win32') {
    process.on('SIGHUP', shutdown);
  }
}

main().catch((error) => {
  log('main', `Fatal error: ${error.message}`, 'error');
  console.error(error);
  process.exit(1);
});
