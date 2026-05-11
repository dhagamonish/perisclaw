import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { env } from '../config/env.js';
import logger from './logger.js';
import { oauth2Client, saveTokens } from './google.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

export function startDashboard() {
  app.get('/', (req, res) => {
    res.send("<html><head><title>Astra EA Dashboard</title><style>body { font-family: 'Inter', sans-serif; background: #0f172a; color: #f1f5f9; padding: 20px; } h1 { color: #38bdf8; } #logs { background: #1e293b; padding: 15px; border-radius: 8px; height: 500px; overflow-y: scroll; font-family: monospace; } .log-entry { margin-bottom: 5px; padding: 5px; border-bottom: 1px solid #334155; } .INFO { color: #10b981; } .ERROR { color: #ef4444; font-weight: bold; } .WARN { color: #f59e0b; }</style></head><body><div style='display: flex; justify-content: space-between; align-items: center;'><h1>Astra EA: Live Intelligence Feed</h1><button onclick='clearLogs()' style='background: #ef4444; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;'>Clear Logs</button></div><div id='logs'></div><script src='/socket.io/socket.io.js'></script><script>const socket = io(); const logsDiv = document.getElementById('logs'); function clearLogs() { logsDiv.innerHTML = ''; } socket.on('log', (data) => { const entry = document.createElement('div'); entry.className = 'log-entry ' + (data.level || 'INFO'); const time = new Date().toLocaleTimeString(); const level = data.level || 'INFO'; const msg = data.msg || ''; const details = data.details ? '<br/><small>' + JSON.stringify(data.details) + '</small>' : ''; entry.innerHTML = '[' + time + '] <b>' + level + '</b>: ' + msg + details; logsDiv.prepend(entry); });</script></body></html>");
  });

  app.get('/oauth2callback', async (req, res) => {
    const { code } = req.query;
    if (code) {
      try {
        const { tokens } = await oauth2Client.getToken(code as string);
        await saveTokens(tokens);
        logger.info('Google OAuth Successful and tokens saved.');
        res.send("<h1>Success!</h1><p>Astra has received your authorization. You can close this tab and return to WhatsApp.</p>");
      } catch (err) {
        logger.error(err, 'Failed to exchange Google OAuth code');
        res.status(500).send("<h1>Error</h1><p>Failed to authorize Google account.</p>");
      }
    } else {
      res.status(400).send("<h1>Missing Code</h1>");
    }
  });

  httpServer.listen(env.DASHBOARD_PORT, () => {
    logger.info("Dashboard live at http://localhost:" + env.DASHBOARD_PORT);
  });
}

export function broadcastLog(level: string, msg: string, details?: any) {
  io.emit('log', { level, msg, details });
}
