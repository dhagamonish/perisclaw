import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';
import { env } from '../config/env.js';
import { saveTokens, oauth2Client } from './google.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

// Serve static files from the 'public' directory
app.use(express.static(path.join(path.dirname(__dirname), '../public')));

export function startDashboard() {
  // Landing Page is handled by express.static on '/'
  
  // The Command Center / Portal
  app.get('/portal', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Astra Command Center</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Outfit:wght@600;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Inter', sans-serif; background: #fbf9f8; color: #1b1c1c; }
          .font-headline { font-family: 'Outfit', sans-serif; }
          .dot-matrix {
            background-image: radial-gradient(circle, #0A0A0A 1px, transparent 1px);
            background-size: 24px 24px;
            opacity: 0.05;
          }
          .glass-card {
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(0, 0, 0, 0.05);
            box-shadow: 0 20px 40px -10px rgba(10, 10, 10, 0.1);
          }
          #qr canvas, #qr img { margin: 0 auto; border: 8px solid white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
          .pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
        </style>
      </head>
      <body class="min-h-screen flex items-center justify-center p-6 relative">
        <div class="fixed inset-0 dot-matrix pointer-events-none"></div>
        
        <div class="glass-card max-w-md w-full p-10 rounded-[32px] text-center relative z-10">
          <div class="flex justify-center mb-8">
            <div class="grid grid-cols-2 gap-1">
              <div class="w-3 h-3 rounded-full bg-[#0050cb]"></div>
              <div class="w-3 h-3 rounded-full bg-[#424656]"></div>
              <div class="w-3 h-3 rounded-full bg-[#424656]"></div>
              <div class="w-3 h-3 rounded-full bg-[#424656]"></div>
            </div>
          </div>
          
          <h1 class="font-headline text-3xl mb-2 tracking-tight">Command Center</h1>
          <p class="text-[#5f5e5e] text-sm mb-8">Secure Industrial Handshake</p>
          
          <div id="qr-container" class="mb-8 hidden">
            <div id="qr" class="mb-4"></div>
            <p class="text-xs font-bold uppercase tracking-widest text-[#0050cb] pulse">Awaiting Scan...</p>
          </div>

          <div id="status-container" class="py-12">
            <div id="status-icon" class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div class="w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
            </div>
            <h2 id="status-text" class="font-headline text-xl mb-1">System Offline</h2>
            <p id="status-desc" class="text-sm text-[#5f5e5e]">Neural Link not established.</p>
          </div>

          <div class="mt-10 pt-10 border-t border-black/5">
            <p class="text-[10px] text-[#727687] font-bold uppercase tracking-[0.2em]">Astra Intelligence v1.0.0</p>
          </div>
        </div>

        <script src="/socket.io/socket.io.js"></script>
        <script src="https://cdn.rawgit.com/davidshimjs/qrcodejs/gh-pages/qrcode.min.js"></script>
        <script>
          const socket = io();
          const qrContainer = document.getElementById('qr-container');
          const qrDiv = document.getElementById('qr');
          const statusContainer = document.getElementById('status-container');
          const statusIcon = document.getElementById('status-icon');
          const statusText = document.getElementById('status-text');
          const statusDesc = document.getElementById('status-desc');
          
          socket.on('qr', (qr) => {
            qrContainer.classList.remove('hidden');
            statusContainer.classList.add('hidden');
            qrDiv.innerHTML = '';
            new QRCode(qrDiv, { text: qr, width: 200, height: 200 });
          });

          socket.on('connection_open', () => {
            qrContainer.classList.add('hidden');
            statusContainer.classList.remove('hidden');
            statusIcon.className = 'w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4';
            statusIcon.innerHTML = '<div class="w-4 h-4 bg-[#0050cb] rounded-full pulse"></div>';
            statusText.innerText = 'System Online';
            statusDesc.innerText = 'Neural Link Active & Secure.';
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
    logger.info(`Live Dashboard active on port \${env.DASHBOARD_PORT}`);
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
