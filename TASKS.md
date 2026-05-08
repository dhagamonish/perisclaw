# TASKS: Astra EA

## Phase 0: Foundation
- [x] Initialize Node.js TypeScript project.
- [x] Set up Project Rules and Standards (Strict TS, Pino Logger, Zod Env).
- [ ] Configure Supabase connection.
- [ ] Initial smoke test of environment.

## Phase 1: WhatsApp Connectivity
- [x] Implement Baileys connection handler.
- [x] Create QR-code authentication flow.
- [/] Implement basic message listener (text & voice note detection).

## Phase 2: Intent Engine
- [x] Integrate OpenAI Whisper for voice transcription.
- [x] Design LLM prompt for structured intent parsing.
- [x] Implement basic intent detection (Text & Audio).
- [/] Implement "Confirmation" UX (WhatsApp reactions/keywords).

## Phase 3: Core Integrations
- [ ] Google OAuth2 setup.
- [ ] Google Calendar: Event creation service.
- [ ] Gmail: Draft creation service.
- [ ] Supabase: Persistent reminders system.

## Phase 4: Polish & Documentation
- [ ] Automated tests for Intent Parsing.
- [ ] End-to-end user journey walkthrough.
- [ ] Finalize README and operating docs.
