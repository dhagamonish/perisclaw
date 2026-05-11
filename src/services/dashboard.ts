import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';
import { env } from '../config/env.js';
import { saveTokens, getAuthUrl, oauth2Client } from './google.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

export function startDashboard() {
  app.get('/', (req, res) => {
    res.send(`
      <html>
        <head>
          <title>Astra EA Portal</title>
          <style>
            body { font-family: 'Inter', sans-serif; background: #0f172a; color: #f1f5f9; text-align: center; padding: 50px; }
            .card { background: #1e293b; padding: 30px; border-radius: 12px; display: inline-block; box-shadow: 0 10px 25px rgba(0,0,0,0.3); }
            h1 { color: #38bdf8; margin-bottom: 10px; }
            p { color: #94a3b8; margin-bottom: 20px; }
            #qr { background: white; padding: 20px; border-radius: 8px; display: none; margin: 0 auto; }
            .status { margin-top: 20px; padding: 10px; border-radius: 6px; font-weight: bold; }
            .connected { background: #065f46; color: #34d399; }
            .disconnected { background: #7f1d1d; color: #f87171; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Astra Intelligence Portal</h1>
            <p>Scan the QR code below to authorize your Executive Assistant.</p>
            <div id="qr"></div>
            <div id="status" class="status disconnected">Waiting for connection...</div>
          </div>
          <script src="/socket.io/socket.io.js"></script>
          <script src="https://cdn.rawgit.com/davidshimjs/qrcodejs/gh-pages/qrcode.min.js"></script>
          <script>
            const socket = io();
            const qrDiv = document.getElementById('qr');
            const statusDiv = document.getElementById('status');
            
            socket.on('qr', (qr) => {
              qrDiv.style.display = 'block';
              qrDiv.innerHTML = '';
              new QRCode(qrDiv, { text: qr, width: 256, height: 256 });
              statusDiv.innerHTML = 'Scan now with WhatsApp';
              statusDiv.className = 'status disconnected';
            });

            socket.on('connection_open', () => {
              qrDiv.style.display = 'none';
              statusDiv.innerHTML = '✅ Astra is Online & Active';
              statusDiv.className = 'status connected';
            });
          </script>
        </body>
      </html>
    `);
  });

  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', uptime: process.uptime() });
  });

  app.get('/oauth2callback', async (req, res) => {
    const { code } = req.query;
    if (code) {
      try {
        const { tokens } = await oauth2Client.getToken(code as string);
        await saveTokens(tokens);
        res.send('<h1>✅ Google Connected!</h1><p>Astra now has access to your Workspace. You can close this window.</p>');
      } catch (err) {
        logger.error(err, 'OAuth callback failed');
        res.status(500).send('Authentication failed');
      }
    }
  });

  server.listen(env.DASHBOARD_PORT, () => {
    logger.info(`Live Dashboard active on port ${env.DASHBOARD_PORT}`);
  });
}

export function broadcastLog(level: string, msg: string, details?: any) {
  io.emit('log', { level, msg, details });
}

export function broadcastQR(qr: string) {
  io.emit('qr', qr);
}

export function broadcastConnectionOpen() {
  io.emit('connection_open');
}
