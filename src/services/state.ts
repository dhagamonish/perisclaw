import { AstraIntent } from './ai.js';

interface PendingAction {
  intent: AstraIntent;
  timestamp: number;
}

const pendingActions = new Map<string, PendingAction>();

// Actions expire after 5 minutes
const EXPIRY_MS = 5 * 60 * 1000;

export function setPendingAction(jid: string, intent: AstraIntent) {
  pendingActions.set(jid, {
    intent,
    timestamp: Date.now()
  });
}

export function getPendingAction(jid: string): AstraIntent | null {
  const action = pendingActions.get(jid);
  if (!action) return null;

  if (Date.now() - action.timestamp > EXPIRY_MS) {
    pendingActions.delete(jid);
    return null;
  }

  return action.intent;
}

export function clearPendingAction(jid: string) {
  pendingActions.delete(jid);
}
