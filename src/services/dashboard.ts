import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { env } from '../config/env.js';
import logger from './logger.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

export function startDashboard() {
  app.get('/', (req, res) => {
    res.send("<html><head><title>Astra EA Dashboard</title><style>body { font-family: 'Inter', sans-serif; background: #0f172a; color: #f1f5f9; padding: 20px; } h1 { color: #38bdf8; } #logs { background: #1e293b; padding: 15px; border-radius: 8px; height: 500px; overflow-y: scroll; font-family: monospace; } .log-entry { margin-bottom: 5px; padding: 5px; border-bottom: 1px solid #334155; } .INFO { color: #10b981; } .ERROR { color: #ef4444; font-weight: bold; } .WARN { color: #f59e0b; }</style></head><body><div style='display: flex; justify-content: space-between; align-items: center;'><h1>Astra EA: Live Intelligence Feed</h1><button onclick='clearLogs()' style='background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;'>Clear Logs</button></div><div id='logs'></div><script src='/socket.io/socket.io.js'></script><script>const socket = io(); const logsDiv = document.getElementById('logs'); function clearLogs() { logsDiv.innerHTML = ''; } socket.on('log', (data) => { const entry = document.createElement('div'); entry.className = 'log-entry ' + (data.level || 'INFO'); const time = new Date().toLocaleTimeString(); const level = data.level || 'INFO'; const msg = data.msg || ''; const details = data.details ? '<br/><small>' + JSON.stringify(data.details) + '</small>' : ''; entry.innerHTML = '[' + time + '] <b>' + level + '</b>: ' + msg + details; logsDiv.prepend(entry); });</script></body></html>");
  });

  app.get('/oauth2callback', (req, res) => {
    const { code } = req.query;
    logger.info({ code }, 'Google OAuth2 Code Received');
    res.send("<h1>Success!</h1><p>Astra has received your authorization. You can close this tab and return to WhatsApp.</p>");
  });

  httpServer.listen(env.DASHBOARD_PORT, () => {
    logger.info("Dashboard live at http://localhost:" + env.DASHBOARD_PORT);
  });
}

export function broadcastLog(level: string, msg: string, details?: any) {
  io.emit('log', { level, msg, details });
}
