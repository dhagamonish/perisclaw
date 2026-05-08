# Product Strategy: Astra EA

## 1. MVP Boundaries
- **Scope**: If a feature doesn't directly turn a WA message into a GCal/Gmail action, it is deferred to V2.
- **Complexity**: Avoid complex state machines. Keep the "Message -> Intent -> Approval -> Action" loop as shallow as possible.

## 2. Approval Philosophy
- **Manual by Default**: Every external integration call MUST have an `approved: boolean` check.
- **UX**: Use WhatsApp reactions as the primary approval trigger. Fall back to "Yes/No" text if reactions are unsupported by the client.

## 3. User Journeys
- **Happy Path**: User sends voice note -> Astra transcribes -> Astra suggests action -> User reacts with 👍 -> Astra executes -> Astra sends receipt.
- **Clarification Path**: User sends ambiguous message -> Astra asks for missing detail -> User provides -> Flow continues.

## 4. Prioritization
1. Reliability (Did it catch the message?)
2. Accuracy (Did it understand correctly?)
3. Latency (Did it respond within 5 seconds?)
4. Elegance (Was the interaction minimal?)
