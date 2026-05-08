# Decisions: Astra EA

## ADR-001: Connectivity Path
**Status**: Decided
**Context**: We need a way to interface with WhatsApp that is reliable for personal use and allows for voice note handling.
**Decision**: Use `Baileys`. 
**Rationale**: It is the most robust community-maintained WhatsApp Web library for Node.js. It avoids the costs and restrictions of the official API for prototyping.

## ADR-002: Service Strategy
**Status**: Decided
**Context**: We want to avoid overengineering while maintaining modularity.
**Decision**: Functional service-oriented approach. 
**Rationale**: Keeps code clean and testable without the overhead of heavy frameworks.

## ADR-003: Approval UX
**Status**: Decided
**Context**: How to confirm actions without making the chat noisy.
**Decision**: Reaction-based confirmation. 
**Rationale**: It's fast, mobile-friendly, and doesn't add text to the thread.

## ADR-004: Swapping OpenAI for Google Gemini
**Status**: Decided
**Context**: User requested a free/open-source alternative to OpenAI.
**Decision**: Use Google Gemini 1.5 Flash.
**Rationale**: It offers a generous free tier via AI Studio, supports native audio processing (removing the need for Whisper), and handles structured JSON output reliably.
