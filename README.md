# Astra EA

A WhatsApp-native personal executive assistant for solo founders.

## Overview
Astra lives in your WhatsApp self-chat. It turns your voice notes and messages into Google Calendar events, Gmail drafts, and reminders—silently and reliably.

## Principles
1. **Calm**: No unnecessary notifications.
2. **Reliable**: Every action is approved.
3. **Minimal**: No dashboards, just chat.

## Tech Stack
- **Node.js / TypeScript**
- **Baileys** (WhatsApp Web API)
- **Supabase** (Database)
- **Google Calendar & Gmail APIs**
- **OpenAI** (LLM & Whisper)

## Getting Started
1. Clone the repository.
2. Run `npm install`.
3. Set up `.env` with your API keys.
4. Run `npm run dev` and scan the QR code in your WhatsApp.

## Rules & Workflows
This project uses the **Antigravity Operating System**. See `.agents/rules/` and `.agents/workflows/` for the protocols governing its development.
