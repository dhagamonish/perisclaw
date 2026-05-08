# Engineering Standards: Astra EA

## 1. Coding Principles
- **TypeScript Strict Mode**: No `any`, no `ignore`. Use proper interfaces.
- **Functional & Modular**: Prefer pure functions. Export small, focused services.
- **Fail Loudly (Internally)**: Use exhaustive logging for internal errors. Fail silently (gracefully) for the user.

## 2. Documentation Discipline
- Every file must have a purpose described in its header.
- Complex logic must be commented with the "Why", not the "What".
- `DECISIONS.md` must be updated for every major technical fork.

## 3. Testing & QA
- Critical paths (Intent Parsing, API Handlers) require unit tests.
- Use `Zod` for runtime validation of all external data (WA messages, API responses).

## 4. Logging
- Log every incoming WhatsApp event (filtered for privacy).
- Log every LLM interaction (prompt + response).
- Log all API call outcomes.

## 5. Security
- Never commit secrets. Use `.env`.
- All user-specific data must be stored with encryption where possible.
